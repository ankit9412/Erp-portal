const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { requireTenant } = require('../../middleware/tenant.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const { auditLog } = require('../../middleware/audit.middleware');
const financeController = require('./finance.controller');

router.use(authenticate, requireTenant);

// Dashboard
router.get('/dashboard', authorize('finance', 'read'), financeController.getDashboard);

// Invoices
router.get('/invoices', authorize('finance', 'read'), financeController.getInvoices);
router.post('/invoices', authorize('finance', 'create'), auditLog('finance', 'CREATE', 'Invoice'), financeController.createInvoice);
router.get('/invoices/:id', authorize('finance', 'read'), financeController.getInvoice);
router.put('/invoices/:id', authorize('finance', 'update'), financeController.updateInvoice);
router.delete('/invoices/:id', authorize('finance', 'delete'), financeController.deleteInvoice);
router.post('/invoices/:id/send', authorize('finance', 'update'), auditLog('finance', 'SEND', 'Invoice'), financeController.sendInvoice);
router.post('/invoices/:id/payment', authorize('finance', 'update'), auditLog('finance', 'PAYMENT', 'Invoice'), financeController.recordPayment);
router.get('/invoices/:id/pdf', authorize('finance', 'read'), financeController.downloadInvoicePDF);

// Transactions
router.get('/transactions', authorize('finance', 'read'), financeController.getTransactions);
router.post('/transactions', authorize('finance', 'create'), auditLog('finance', 'CREATE', 'Transaction'), financeController.createTransaction);
router.get('/transactions/:id', authorize('finance', 'read'), financeController.getTransaction);

// Reports
router.get('/reports/profit-loss', authorize('reports', 'read'), financeController.getProfitLossReport);
router.get('/reports/balance-sheet', authorize('reports', 'read'), financeController.getBalanceSheet);
router.get('/reports/cash-flow', authorize('reports', 'read'), financeController.getCashFlowReport);
router.get('/reports/tax', authorize('reports', 'read'), financeController.getTaxReport);
router.get('/reports/export', authorize('reports', 'export'), financeController.exportReport);

// Expenses
router.get('/expenses', authorize('finance', 'read'), financeController.getExpenses);
router.post('/expenses', authorize('finance', 'create'), financeController.createExpense);

module.exports = router;
