const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireTenant } = require('../../middleware/tenant.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { validate, schemas } = require('../../middleware/validate.middleware');
const { auditLog } = require('../../middleware/audit.middleware');
const inventoryController = require('./inventory.controller');

// All routes require authentication and tenant context
router.use(authenticate, requireTenant);

// Product schemas
const createProductSchema = z.object({
  name: z.string().min(1).max(200),
  sku: z.string().min(1).max(50),
  description: z.string().optional(),
  price: z.number().min(0),
  costPrice: z.number().min(0).optional(),
  category: z.string().optional(),
  unit: z.enum(['pcs', 'kg', 'g', 'ltr', 'ml', 'mtr', 'cm', 'box', 'pack', 'dozen', 'pair']).optional(),
  minStockLevel: z.number().min(0).optional(),
  reorderPoint: z.number().min(0).optional(),
  reorderQuantity: z.number().min(0).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  hsnCode: z.string().optional(),
  initialStock: z.number().min(0).optional(),
  warehouseId: z.string().optional(),
});

const stockAdjustmentSchema = z.object({
  productId: schemas.objectId,
  warehouseId: schemas.objectId,
  quantity: z.number(),
  type: z.enum(['purchase', 'sale', 'adjustment', 'return', 'damage', 'expiry', 'opening_stock']),
  reason: z.string().optional(),
  batchNumber: z.string().optional(),
  serialNumber: z.string().optional(),
  expiryDate: z.string().optional(),
  costPrice: z.number().optional(),
});

const transferSchema = z.object({
  productId: schemas.objectId,
  fromWarehouseId: schemas.objectId,
  toWarehouseId: schemas.objectId,
  quantity: z.number().min(1),
  reason: z.string().optional(),
});

// Dashboard
router.get('/dashboard', authorize('inventory', 'read'), inventoryController.getDashboard);

// Products
router.get('/products', authorize('inventory', 'read'), inventoryController.getProducts);
router.post('/products', authorize('inventory', 'create'), validate(createProductSchema), auditLog('inventory', 'CREATE', 'Product'), inventoryController.createProduct);
router.get('/products/:id', authorize('inventory', 'read'), inventoryController.getProduct);
router.put('/products/:id', authorize('inventory', 'update'), auditLog('inventory', 'UPDATE', 'Product'), inventoryController.updateProduct);
router.delete('/products/:id', authorize('inventory', 'delete'), auditLog('inventory', 'DELETE', 'Product'), inventoryController.deleteProduct);

// Stock
router.get('/stock', authorize('inventory', 'read'), inventoryController.getStock);
router.post('/stock/adjust', authorize('inventory', 'update'), validate(stockAdjustmentSchema), auditLog('inventory', 'UPDATE', 'Stock'), inventoryController.adjustStock);
router.post('/stock/transfer', authorize('inventory', 'update'), validate(transferSchema), auditLog('inventory', 'UPDATE', 'StockTransfer'), inventoryController.transferStock);
router.get('/stock/movements', authorize('inventory', 'read'), inventoryController.getStockMovements);
router.get('/stock/low-stock', authorize('inventory', 'read'), inventoryController.getLowStockProducts);

// Warehouses
router.get('/warehouses', authorize('inventory', 'read'), inventoryController.getWarehouses);
router.post('/warehouses', authorize('inventory', 'create'), inventoryController.createWarehouse);
router.put('/warehouses/:id', authorize('inventory', 'update'), inventoryController.updateWarehouse);

// Suppliers
router.get('/suppliers', authorize('purchase', 'read'), inventoryController.getSuppliers);
router.post('/suppliers', authorize('purchase', 'create'), inventoryController.createSupplier);
router.put('/suppliers/:id', authorize('purchase', 'update'), inventoryController.updateSupplier);

// Purchase Orders
router.get('/purchase-orders', authorize('purchase', 'read'), inventoryController.getPurchaseOrders);
router.post('/purchase-orders', authorize('purchase', 'create'), auditLog('purchase', 'CREATE', 'PurchaseOrder'), inventoryController.createPurchaseOrder);
router.get('/purchase-orders/:id', authorize('purchase', 'read'), inventoryController.getPurchaseOrder);
router.put('/purchase-orders/:id', authorize('purchase', 'update'), inventoryController.updatePurchaseOrder);
router.post('/purchase-orders/:id/approve', authorize('purchase', 'approve'), auditLog('purchase', 'APPROVE', 'PurchaseOrder'), inventoryController.approvePurchaseOrder);
router.post('/purchase-orders/:id/receive', authorize('purchase', 'update'), auditLog('purchase', 'UPDATE', 'GRN'), inventoryController.receiveGoods);

// Export
router.get('/products/export', authorize('inventory', 'export'), inventoryController.exportProducts);

module.exports = router;
