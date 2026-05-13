const Product = require('./product.model');
const Stock = require('./stock.model');
const StockMovement = require('./stockMovement.model');
const Warehouse = require('./warehouse.model');
const { cache } = require('../../config/redis');
const { AppError, NotFoundError } = require('../../middleware/error.middleware');
const { notificationQueue } = require('../../jobs/queues');
const logger = require('../../config/logger');
const mongoose = require('mongoose');

class InventoryService {
  /**
   * Get all products with pagination and filters
   */
  async getProducts(tenantId, { page = 1, limit = 10, search, category, status, sort = 'createdAt', order = 'desc', lowStock }) {
    const query = { tenantId, deletedAt: null };

    if (search) {
      query.$text = { $search: search };
    }
    if (category) query.category = category;
    if (status) query.status = status;
    if (lowStock === 'true') {
      query.$expr = { $lte: ['$stock', '$minStockLevel'] };
    }

    const skip = (page - 1) * limit;
    const sortObj = { [sort]: order === 'asc' ? 1 : -1 };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .populate('supplier', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create a new product
   */
  async createProduct(tenantId, data, userId) {
    // Check SKU uniqueness within tenant
    const existing = await Product.findOne({ tenantId, sku: data.sku });
    if (existing) {
      throw new AppError(`SKU '${data.sku}' already exists.`, 409, 'DUPLICATE_SKU');
    }

    const product = await Product.create({ ...data, tenantId });

    // Create initial stock entry in default warehouse if quantity provided
    if (data.initialStock > 0 && data.warehouseId) {
      await this.adjustStock({
        tenantId,
        productId: product._id,
        warehouseId: data.warehouseId,
        quantity: data.initialStock,
        type: 'opening_stock',
        reason: 'Initial stock entry',
        userId,
      });
    }

    // Invalidate cache
    await cache.delPattern(`products:${tenantId}:*`);

    return product;
  }

  /**
   * Update product
   */
  async updateProduct(tenantId, productId, data) {
    const product = await Product.findOneAndUpdate(
      { _id: productId, tenantId, deletedAt: null },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!product) throw new NotFoundError('Product');

    await cache.del(`product:${productId}`);
    await cache.delPattern(`products:${tenantId}:*`);

    return product;
  }

  /**
   * Adjust stock (add/remove/transfer)
   */
  async adjustStock({ tenantId, productId, warehouseId, quantity, type, reason, userId, batchNumber, serialNumber, expiryDate, costPrice }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const product = await Product.findOne({ _id: productId, tenantId }).session(session);
      if (!product) throw new NotFoundError('Product');

      const warehouse = await Warehouse.findOne({ _id: warehouseId, tenantId }).session(session);
      if (!warehouse) throw new NotFoundError('Warehouse');

      // Find or create stock record
      let stock = await Stock.findOne({ tenantId, product: productId, warehouse: warehouseId }).session(session);

      const previousQuantity = stock?.quantity || 0;
      let newQuantity;

      if (['purchase', 'opening_stock', 'return', 'grn'].includes(type)) {
        newQuantity = previousQuantity + Math.abs(quantity);
      } else if (['sale', 'damage', 'expiry'].includes(type)) {
        newQuantity = previousQuantity - Math.abs(quantity);
        if (newQuantity < 0) {
          throw new AppError('Insufficient stock.', 400, 'INSUFFICIENT_STOCK');
        }
      } else if (type === 'adjustment') {
        newQuantity = quantity; // Set absolute value
      } else {
        newQuantity = previousQuantity + quantity; // Signed quantity
      }

      if (!stock) {
        stock = await Stock.create([{
          tenantId,
          product: productId,
          warehouse: warehouseId,
          quantity: newQuantity,
          batchNumber,
          serialNumber,
          expiryDate,
          costPrice,
        }], { session });
        stock = stock[0];
      } else {
        stock.quantity = newQuantity;
        if (batchNumber) stock.batchNumber = batchNumber;
        if (serialNumber) stock.serialNumber = serialNumber;
        if (expiryDate) stock.expiryDate = expiryDate;
        await stock.save({ session });
      }

      // Update product total stock
      const totalStock = await Stock.aggregate([
        { $match: { tenantId: product.tenantId, product: product._id } },
        { $group: { _id: null, total: { $sum: '$quantity' } } },
      ]).session(session);

      product.stock = totalStock[0]?.total || 0;
      await product.save({ session });

      // Create movement record
      const movement = await StockMovement.create([{
        tenantId,
        product: productId,
        warehouse: warehouseId,
        type,
        quantity: newQuantity - previousQuantity,
        previousQuantity,
        newQuantity,
        unitCost: costPrice,
        totalCost: costPrice ? costPrice * Math.abs(newQuantity - previousQuantity) : undefined,
        reason,
        batchNumber,
        serialNumber,
        expiryDate,
        performedBy: userId,
        status: 'completed',
      }], { session });

      await session.commitTransaction();

      // Check low stock alert
      if (product.stock <= product.minStockLevel && product.minStockLevel > 0) {
        await notificationQueue.add('low-stock-alert', {
          tenantId: tenantId.toString(),
          productId: productId.toString(),
          productName: product.name,
          currentStock: product.stock,
          minStockLevel: product.minStockLevel,
        });
      }

      // Invalidate caches
      await cache.del(`product:${productId}`);
      await cache.del(`stock:${tenantId}:${productId}`);

      return { stock, movement: movement[0], product };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Transfer stock between warehouses
   */
  async transferStock({ tenantId, productId, fromWarehouseId, toWarehouseId, quantity, userId, reason }) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Deduct from source
      const sourceStock = await Stock.findOne({
        tenantId, product: productId, warehouse: fromWarehouseId
      }).session(session);

      if (!sourceStock || sourceStock.quantity < quantity) {
        throw new AppError('Insufficient stock in source warehouse.', 400, 'INSUFFICIENT_STOCK');
      }

      sourceStock.quantity -= quantity;
      await sourceStock.save({ session });

      // Add to destination
      let destStock = await Stock.findOne({
        tenantId, product: productId, warehouse: toWarehouseId
      }).session(session);

      if (!destStock) {
        destStock = await Stock.create([{
          tenantId, product: productId, warehouse: toWarehouseId, quantity,
        }], { session });
        destStock = destStock[0];
      } else {
        destStock.quantity += quantity;
        await destStock.save({ session });
      }

      // Create movement records
      await StockMovement.create([
        {
          tenantId, product: productId, warehouse: fromWarehouseId,
          fromWarehouse: fromWarehouseId, toWarehouse: toWarehouseId,
          type: 'transfer', quantity: -quantity,
          previousQuantity: sourceStock.quantity + quantity,
          newQuantity: sourceStock.quantity,
          reason, performedBy: userId, status: 'completed',
        },
        {
          tenantId, product: productId, warehouse: toWarehouseId,
          fromWarehouse: fromWarehouseId, toWarehouse: toWarehouseId,
          type: 'transfer', quantity,
          previousQuantity: destStock.quantity - quantity,
          newQuantity: destStock.quantity,
          reason, performedBy: userId, status: 'completed',
        },
      ], { session });

      await session.commitTransaction();
      return { sourceStock, destStock };
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Get inventory dashboard stats
   */
  async getDashboardStats(tenantId) {
    const cacheKey = `inventory:stats:${tenantId}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const [
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue,
      recentMovements,
    ] = await Promise.all([
      Product.countDocuments({ tenantId, status: 'active', deletedAt: null }),
      Product.countDocuments({
        tenantId, status: 'active', deletedAt: null,
        $expr: { $and: [{ $lte: ['$stock', '$minStockLevel'] }, { $gt: ['$stock', 0] }] },
      }),
      Product.countDocuments({ tenantId, status: 'active', deletedAt: null, stock: 0 }),
      Product.aggregate([
        { $match: { tenantId: new mongoose.Types.ObjectId(tenantId), status: 'active', deletedAt: null } },
        { $group: { _id: null, totalValue: { $sum: { $multiply: ['$stock', '$costPrice'] } } } },
      ]),
      StockMovement.find({ tenantId })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('product', 'name sku')
        .populate('warehouse', 'name')
        .lean(),
    ]);

    const stats = {
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      totalStockValue: totalStockValue[0]?.totalValue || 0,
      recentMovements,
    };

    await cache.set(cacheKey, stats, 300); // 5 min cache
    return stats;
  }
}

module.exports = new InventoryService();
