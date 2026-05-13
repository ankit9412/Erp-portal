const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const { requireTenant } = require('../../middleware/tenant.middleware');
const { authorize } = require('../../middleware/rbac.middleware');
const analyticsController = require('./analytics.controller');

router.use(authenticate, requireTenant);

router.get('/overview', authorize('analytics', 'read'), analyticsController.getOverview);
router.get('/revenue', authorize('analytics', 'read'), analyticsController.getRevenueAnalytics);
router.get('/inventory', authorize('analytics', 'read'), analyticsController.getInventoryAnalytics);
router.get('/hr', authorize('analytics', 'read'), analyticsController.getHRAnalytics);
router.get('/sales', authorize('analytics', 'read'), analyticsController.getSalesAnalytics);
router.get('/kpi', authorize('analytics', 'read'), analyticsController.getKPIs);
router.get('/forecast', authorize('analytics', 'read'), analyticsController.getForecast);

module.exports = router;
