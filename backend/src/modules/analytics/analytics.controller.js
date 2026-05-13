const Invoice = require('../finance/invoice.model');
const Transaction = require('../finance/transaction.model');
const Product = require('../inventory/product.model');
const StockMovement = require('../inventory/stockMovement.model');
const Employee = require('../hr/employee.model');
const Attendance = require('../hr/attendance.model');
const { cache } = require('../../config/redis');
const mongoose = require('mongoose');
const moment = require('moment');

class AnalyticsController {
  async getOverview(req, res, next) {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.tenantId);
      const cacheKey = `analytics:overview:${req.tenantId}`;
      const cached = await cache.get(cacheKey);
      if (cached) return res.json({ success: true, data: cached });

      const startOfMonth = moment().startOf('month').toDate();
      const startOfYear = moment().startOf('year').toDate();

      const [
        monthlyRevenue,
        yearlyRevenue,
        totalProducts,
        lowStockCount,
        totalEmployees,
        pendingInvoices,
      ] = await Promise.all([
        Invoice.aggregate([
          { $match: { tenantId, invoiceDate: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' }, paid: { $sum: '$paidAmount' } } },
        ]),
        Invoice.aggregate([
          { $match: { tenantId, invoiceDate: { $gte: startOfYear }, status: { $ne: 'cancelled' } } },
          { $group: { _id: null, total: { $sum: '$totalAmount' }, paid: { $sum: '$paidAmount' } } },
        ]),
        Product.countDocuments({ tenantId: req.tenantId, status: 'active', deletedAt: null }),
        Product.countDocuments({
          tenantId: req.tenantId, status: 'active', deletedAt: null,
          $expr: { $lte: ['$stock', '$minStockLevel'] },
        }),
        Employee.countDocuments({ tenantId: req.tenantId, status: 'active', deletedAt: null }),
        Invoice.countDocuments({ tenantId: req.tenantId, paymentStatus: { $in: ['unpaid', 'partial'] } }),
      ]);

      const data = {
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        monthlyCollected: monthlyRevenue[0]?.paid || 0,
        yearlyRevenue: yearlyRevenue[0]?.total || 0,
        totalProducts,
        lowStockCount,
        totalEmployees,
        pendingInvoices,
      };

      await cache.set(cacheKey, data, 300);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async getRevenueAnalytics(req, res, next) {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.tenantId);
      const { period = '12months' } = req.query;

      let startDate;
      let groupBy;

      switch (period) {
        case '7days':
          startDate = moment().subtract(7, 'days').toDate();
          groupBy = { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' }, day: { $dayOfMonth: '$invoiceDate' } };
          break;
        case '30days':
          startDate = moment().subtract(30, 'days').toDate();
          groupBy = { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' }, day: { $dayOfMonth: '$invoiceDate' } };
          break;
        default: // 12months
          startDate = moment().subtract(12, 'months').toDate();
          groupBy = { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' } };
      }

      const revenueData = await Invoice.aggregate([
        {
          $match: {
            tenantId,
            invoiceDate: { $gte: startDate },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: groupBy,
            revenue: { $sum: '$totalAmount' },
            collected: { $sum: '$paidAmount' },
            invoiceCount: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]);

      res.json({ success: true, data: revenueData });
    } catch (error) { next(error); }
  }

  async getInventoryAnalytics(req, res, next) {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.tenantId);

      const [
        categoryDistribution,
        warehouseStock,
        totalProducts,
        lowStockCount,
        totalWarehouses,
        stockValue,
      ] = await Promise.all([
        // Category Distribution
        Product.aggregate([
          { $match: { tenantId, status: 'active', deletedAt: null } },
          { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'cat' } },
          { $group: { _id: { $arrayElemAt: ['$cat.name', 0] }, value: { $sum: 1 } } },
          { $project: { name: { $ifNull: ['$_id', 'Uncategorized'] }, value: 1, _id: 0 } },
        ]),
        // Stock by Warehouse
        require('../inventory/stock.model').aggregate([
          { $match: { tenantId } },
          { $lookup: { from: 'warehouses', localField: 'warehouse', foreignField: '_id', as: 'wh' } },
          { $group: { _id: { $arrayElemAt: ['$wh.name', 0] }, stock: { $sum: '$quantity' } } },
          { $project: { name: { $ifNull: ['$_id', 'Unknown'] }, stock: 1, _id: 0 } },
        ]),
        Product.countDocuments({ tenantId: req.tenantId, status: 'active', deletedAt: null }),
        Product.countDocuments({
          tenantId: req.tenantId, status: 'active', deletedAt: null,
          $expr: { $lte: ['$stock', '$minStockLevel'] },
        }),
        require('../inventory/warehouse.model').countDocuments({ tenantId: req.tenantId, isActive: true }),
        Product.aggregate([
          { $match: { tenantId, status: 'active', deletedAt: null } },
          { $group: { _id: null, totalValue: { $sum: { $multiply: ['$stock', '$costPrice'] } } } },
        ]),
      ]);

      res.json({
        success: true,
        data: {
          categoryDistribution,
          warehouseStock,
          totalProducts,
          lowStockCount,
          totalWarehouses,
          totalValue: stockValue[0]?.totalValue || 0,
        },
      });
    } catch (error) { next(error); }
  }

  async getHRAnalytics(req, res, next) {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.tenantId);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        departmentDistribution,
        monthlyAttendance,
        totalEmployees,
        presentToday,
        onLeave,
      ] = await Promise.all([
        // Department Distribution
        Employee.aggregate([
          { $match: { tenantId, deletedAt: null } },
          { $lookup: { from: 'departments', localField: 'department', foreignField: '_id', as: 'dept' } },
          { $group: { _id: { $arrayElemAt: ['$dept.name', 0] }, count: { $sum: 1 } } },
          { $project: { name: { $ifNull: ['$_id', 'Others'] }, count: 1, _id: 0 } },
          { $sort: { count: -1 } },
        ]),
        // Attendance Trend
        Attendance.aggregate([
          {
            $match: {
              tenantId,
              date: { $gte: moment().subtract(6, 'months').startOf('month').toDate() },
            },
          },
          {
            $group: {
              _id: { month: { $month: '$date' }, year: { $year: '$date' } },
              present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
              total: { $sum: 1 },
            },
          },
          {
            $project: {
              month: { $concat: [{ $toString: '$_id.month' }, '/', { $toString: '$_id.year' }] },
              rate: { $cond: [{ $gt: ['$total', 0] }, { $multiply: [{ $divide: ['$present', '$total'] }, 100] }, 0] },
              _id: 0,
            },
          },
        ]),
        Employee.countDocuments({ tenantId: req.tenantId, status: 'active', deletedAt: null }),
        Attendance.countDocuments({ tenantId: req.tenantId, date: today, status: 'present' }),
        Attendance.countDocuments({ tenantId: req.tenantId, date: today, status: 'on_leave' }),
      ]);

      res.json({
        success: true,
        data: {
          departmentDistribution,
          monthlyAttendance,
          totalEmployees,
          presentToday,
          onLeave,
          avgAttendance: monthlyAttendance.length > 0
            ? (monthlyAttendance.reduce((sum, a) => sum + a.rate, 0) / monthlyAttendance.length).toFixed(1)
            : 0,
        },
      });
    } catch (error) { next(error); }
  }

  async getSalesAnalytics(req, res, next) {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.tenantId);

      const salesData = await Invoice.aggregate([
        {
          $match: {
            tenantId,
            invoiceDate: { $gte: moment().subtract(12, 'months').toDate() },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' } },
            totalSales: { $sum: '$totalAmount' },
            invoiceCount: { $sum: 1 },
            avgOrderValue: { $avg: '$totalAmount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      res.json({ success: true, data: salesData });
    } catch (error) { next(error); }
  }

  async getKPIs(req, res, next) {
    try {
      const tenantId = new mongoose.Types.ObjectId(req.tenantId);
      const startOfMonth = moment().startOf('month').toDate();
      const startOfLastMonth = moment().subtract(1, 'month').startOf('month').toDate();
      const endOfLastMonth = moment().subtract(1, 'month').endOf('month').toDate();

      const [currentMonth, lastMonth] = await Promise.all([
        Invoice.aggregate([
          { $match: { tenantId, invoiceDate: { $gte: startOfMonth }, status: { $ne: 'cancelled' } } },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 }, avgValue: { $avg: '$totalAmount' } } },
        ]),
        Invoice.aggregate([
          { $match: { tenantId, invoiceDate: { $gte: startOfLastMonth, $lte: endOfLastMonth }, status: { $ne: 'cancelled' } } },
          { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 }, avgValue: { $avg: '$totalAmount' } } },
        ]),
      ]);

      const curr = currentMonth[0] || { revenue: 0, count: 0, avgValue: 0 };
      const prev = lastMonth[0] || { revenue: 0, count: 0, avgValue: 0 };

      const kpis = [
        {
          key: 'monthly_revenue',
          label: 'Monthly Revenue',
          value: curr.revenue,
          previousValue: prev.revenue,
          change: prev.revenue > 0 ? (((curr.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1) : 0,
          trend: curr.revenue >= prev.revenue ? 'up' : 'down',
          format: 'currency',
        },
        {
          key: 'invoice_count',
          label: 'Invoices Issued',
          value: curr.count,
          previousValue: prev.count,
          change: prev.count > 0 ? (((curr.count - prev.count) / prev.count) * 100).toFixed(1) : 0,
          trend: curr.count >= prev.count ? 'up' : 'down',
          format: 'number',
        },
        {
          key: 'avg_order_value',
          label: 'Avg Order Value',
          value: curr.avgValue,
          previousValue: prev.avgValue,
          change: prev.avgValue > 0 ? (((curr.avgValue - prev.avgValue) / prev.avgValue) * 100).toFixed(1) : 0,
          trend: curr.avgValue >= prev.avgValue ? 'up' : 'down',
          format: 'currency',
        },
      ];

      res.json({ success: true, data: kpis });
    } catch (error) { next(error); }
  }

  async getForecast(req, res, next) {
    try {
      // Simple linear regression forecast
      const tenantId = new mongoose.Types.ObjectId(req.tenantId);

      const historicalData = await Invoice.aggregate([
        {
          $match: {
            tenantId,
            invoiceDate: { $gte: moment().subtract(6, 'months').toDate() },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' } },
            revenue: { $sum: '$totalAmount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      // Simple moving average forecast for next 3 months
      const revenues = historicalData.map((d) => d.revenue);
      const avg = revenues.length > 0 ? revenues.reduce((a, b) => a + b, 0) / revenues.length : 0;
      const trend = revenues.length > 1 ? (revenues[revenues.length - 1] - revenues[0]) / revenues.length : 0;

      const forecast = [1, 2, 3].map((i) => ({
        month: moment().add(i, 'months').format('MMM YYYY'),
        predicted: Math.max(0, avg + trend * i),
        confidence: Math.max(0.5, 0.9 - i * 0.1),
      }));

      res.json({ success: true, data: { historical: historicalData, forecast } });
    } catch (error) { next(error); }
  }
}

module.exports = new AnalyticsController();
