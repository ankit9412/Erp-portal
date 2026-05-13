const { StatusCodes } = require('http-status-codes');
const inventoryService = require('./inventory.service');
const Product = require('./product.model');
const Stock = require('./stock.model');
const StockMovement = require('./stockMovement.model');
const Warehouse = require('./warehouse.model');
const Supplier = require('./supplier.model');
const PurchaseOrder = require('./purchaseOrder.model');
const { NotFoundError } = require('../../middleware/error.middleware');
const ExcelJS = require('exceljs');

class InventoryController {
  async getDashboard(req, res, next) {
    try {
      const stats = await inventoryService.getDashboardStats(req.tenantId);
      res.json({ success: true, data: stats });
    } catch (error) { next(error); }
  }

  async getProducts(req, res, next) {
    try {
      const result = await inventoryService.getProducts(req.tenantId, req.query);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async createProduct(req, res, next) {
    try {
      const product = await inventoryService.createProduct(req.tenantId, req.body, req.user._id);
      res.status(StatusCodes.CREATED).json({ success: true, data: product });
    } catch (error) { next(error); }
  }

  async getProduct(req, res, next) {
    try {
      const product = await Product.findOne({ _id: req.params.id, tenantId: req.tenantId, deletedAt: null })
        .populate('category', 'name')
        .populate('supplier', 'name email phone');
      if (!product) throw new NotFoundError('Product');
      res.json({ success: true, data: product });
    } catch (error) { next(error); }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await inventoryService.updateProduct(req.tenantId, req.params.id, req.body);
      res.json({ success: true, data: product });
    } catch (error) { next(error); }
  }

  async deleteProduct(req, res, next) {
    try {
      const product = await Product.findOne({ _id: req.params.id, tenantId: req.tenantId });
      if (!product) throw new NotFoundError('Product');
      await product.softDelete();
      res.json({ success: true, message: 'Product deleted successfully.' });
    } catch (error) { next(error); }
  }

  async getStock(req, res, next) {
    try {
      const { warehouseId, productId, page = 1, limit = 20 } = req.query;
      const query = { tenantId: req.tenantId };
      if (warehouseId) query.warehouse = warehouseId;
      if (productId) query.product = productId;

      const [stocks, total] = await Promise.all([
        Stock.find(query)
          .populate('product', 'name sku unit minStockLevel')
          .populate('warehouse', 'name code')
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .lean(),
        Stock.countDocuments(query),
      ]);

      res.json({ success: true, data: stocks, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
    } catch (error) { next(error); }
  }

  async adjustStock(req, res, next) {
    try {
      const result = await inventoryService.adjustStock({
        tenantId: req.tenantId,
        ...req.body,
        userId: req.user._id,
      });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async transferStock(req, res, next) {
    try {
      const result = await inventoryService.transferStock({
        tenantId: req.tenantId,
        ...req.body,
        userId: req.user._id,
      });
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getStockMovements(req, res, next) {
    try {
      const { page = 1, limit = 20, type, productId, warehouseId } = req.query;
      const query = { tenantId: req.tenantId };
      if (type) query.type = type;
      if (productId) query.product = productId;
      if (warehouseId) query.warehouse = warehouseId;

      const [movements, total] = await Promise.all([
        StockMovement.find(query)
          .populate('product', 'name sku')
          .populate('warehouse', 'name')
          .populate('performedBy', 'firstName lastName')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .lean(),
        StockMovement.countDocuments(query),
      ]);

      res.json({ success: true, data: movements, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
    } catch (error) { next(error); }
  }

  async getLowStockProducts(req, res, next) {
    try {
      const products = await Product.find({
        tenantId: req.tenantId,
        status: 'active',
        deletedAt: null,
        $expr: { $lte: ['$stock', '$minStockLevel'] },
      }).populate('supplier', 'name email').lean();

      res.json({ success: true, data: products });
    } catch (error) { next(error); }
  }

  async getWarehouses(req, res, next) {
    try {
      const warehouses = await Warehouse.find({ tenantId: req.tenantId, isActive: true })
        .populate('manager', 'firstName lastName')
        .lean();
      res.json({ success: true, data: warehouses });
    } catch (error) { next(error); }
  }

  async createWarehouse(req, res, next) {
    try {
      const warehouse = await Warehouse.create({ ...req.body, tenantId: req.tenantId });
      res.status(StatusCodes.CREATED).json({ success: true, data: warehouse });
    } catch (error) { next(error); }
  }

  async updateWarehouse(req, res, next) {
    try {
      const warehouse = await Warehouse.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.tenantId },
        { $set: req.body },
        { new: true }
      );
      if (!warehouse) throw new NotFoundError('Warehouse');
      res.json({ success: true, data: warehouse });
    } catch (error) { next(error); }
  }

  async getSuppliers(req, res, next) {
    try {
      const { page = 1, limit = 20, search, status } = req.query;
      const query = { tenantId: req.tenantId, deletedAt: null };
      if (search) query.$text = { $search: search };
      if (status) query.status = status;

      const [suppliers, total] = await Promise.all([
        Supplier.find(query).sort({ name: 1 }).skip((page - 1) * limit).limit(parseInt(limit)).lean(),
        Supplier.countDocuments(query),
      ]);

      res.json({ success: true, data: suppliers, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
    } catch (error) { next(error); }
  }

  async createSupplier(req, res, next) {
    try {
      const supplier = await Supplier.create({ ...req.body, tenantId: req.tenantId });
      res.status(StatusCodes.CREATED).json({ success: true, data: supplier });
    } catch (error) { next(error); }
  }

  async updateSupplier(req, res, next) {
    try {
      const supplier = await Supplier.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.tenantId },
        { $set: req.body },
        { new: true }
      );
      if (!supplier) throw new NotFoundError('Supplier');
      res.json({ success: true, data: supplier });
    } catch (error) { next(error); }
  }

  async getPurchaseOrders(req, res, next) {
    try {
      const { page = 1, limit = 20, status, supplierId } = req.query;
      const query = { tenantId: req.tenantId };
      if (status) query.status = status;
      if (supplierId) query.supplier = supplierId;

      const [orders, total] = await Promise.all([
        PurchaseOrder.find(query)
          .populate('supplier', 'name email')
          .populate('warehouse', 'name')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .lean(),
        PurchaseOrder.countDocuments(query),
      ]);

      res.json({ success: true, data: orders, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
    } catch (error) { next(error); }
  }

  async createPurchaseOrder(req, res, next) {
    try {
      const tenant = req.tenant;
      const poNumber = `${tenant.settings?.poPrefix || 'PO'}-${Date.now()}`;
      const po = await PurchaseOrder.create({
        ...req.body,
        tenantId: req.tenantId,
        poNumber,
        createdBy: req.user._id,
      });
      res.status(StatusCodes.CREATED).json({ success: true, data: po });
    } catch (error) { next(error); }
  }

  async getPurchaseOrder(req, res, next) {
    try {
      const po = await PurchaseOrder.findOne({ _id: req.params.id, tenantId: req.tenantId })
        .populate('supplier')
        .populate('items.product', 'name sku unit')
        .populate('warehouse', 'name')
        .populate('createdBy', 'firstName lastName');
      if (!po) throw new NotFoundError('Purchase Order');
      res.json({ success: true, data: po });
    } catch (error) { next(error); }
  }

  async updatePurchaseOrder(req, res, next) {
    try {
      const po = await PurchaseOrder.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.tenantId, status: { $in: ['draft', 'pending_approval'] } },
        { $set: req.body },
        { new: true }
      );
      if (!po) throw new NotFoundError('Purchase Order');
      res.json({ success: true, data: po });
    } catch (error) { next(error); }
  }

  async approvePurchaseOrder(req, res, next) {
    try {
      const po = await PurchaseOrder.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.tenantId, status: 'pending_approval' },
        { $set: { status: 'approved', approvedBy: req.user._id } },
        { new: true }
      );
      if (!po) throw new NotFoundError('Purchase Order');
      res.json({ success: true, data: po, message: 'Purchase order approved.' });
    } catch (error) { next(error); }
  }

  async receiveGoods(req, res, next) {
    try {
      const po = await PurchaseOrder.findOne({ _id: req.params.id, tenantId: req.tenantId });
      if (!po) throw new NotFoundError('Purchase Order');

      // Process each received item
      for (const item of req.body.items) {
        if (item.receivedQuantity > 0) {
          await inventoryService.adjustStock({
            tenantId: req.tenantId,
            productId: item.productId,
            warehouseId: po.warehouse,
            quantity: item.receivedQuantity,
            type: 'grn',
            reason: `GRN for PO ${po.poNumber}`,
            userId: req.user._id,
            costPrice: item.unitPrice,
          });
        }
      }

      po.status = 'received';
      po.deliveryDate = new Date();
      await po.save();

      res.json({ success: true, data: po, message: 'Goods received successfully.' });
    } catch (error) { next(error); }
  }

  async exportProducts(req, res, next) {
    try {
      const products = await Product.find({ tenantId: req.tenantId, deletedAt: null })
        .populate('category', 'name')
        .lean();

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Products');

      sheet.columns = [
        { header: 'SKU', key: 'sku', width: 15 },
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Price', key: 'price', width: 12 },
        { header: 'Cost Price', key: 'costPrice', width: 12 },
        { header: 'Stock', key: 'stock', width: 10 },
        { header: 'Min Stock', key: 'minStockLevel', width: 12 },
        { header: 'Status', key: 'status', width: 12 },
      ];

      products.forEach((p) => {
        sheet.addRow({
          sku: p.sku,
          name: p.name,
          category: p.category?.name || '',
          price: p.price,
          costPrice: p.costPrice || '',
          stock: p.stock,
          minStockLevel: p.minStockLevel,
          status: p.status,
        });
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=products.xlsx');
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) { next(error); }
  }
}

module.exports = new InventoryController();
