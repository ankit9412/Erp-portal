const { StatusCodes } = require('http-status-codes');
const financeService = require('./finance.service');
const Invoice = require('./invoice.model');
const Transaction = require('./transaction.model');
const { NotFoundError } = require('../../middleware/error.middleware');
const pdfService = require('../../shared/pdf.service');

class FinanceController {
  async getDashboard(req, res, next) {
    try {
      const stats = await financeService.getDashboardStats(req.tenantId, req.query.period);
      res.json({ success: true, data: stats });
    } catch (error) { next(error); }
  }

  async getInvoices(req, res, next) {
    try {
      const { page = 1, limit = 20, status, paymentStatus, search, startDate, endDate } = req.query;
      const query = { tenantId: req.tenantId, deletedAt: null };
      if (status) query.status = status;
      if (paymentStatus) query.paymentStatus = paymentStatus;
      if (search) query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
      ];
      if (startDate || endDate) {
        query.invoiceDate = {};
        if (startDate) query.invoiceDate.$gte = new Date(startDate);
        if (endDate) query.invoiceDate.$lte = new Date(endDate);
      }

      const [invoices, total] = await Promise.all([
        Invoice.find(query)
          .populate('customer', 'name email')
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .lean(),
        Invoice.countDocuments(query),
      ]);

      res.json({ success: true, data: invoices, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
    } catch (error) { next(error); }
  }

  async createInvoice(req, res, next) {
    try {
      const invoice = await financeService.createInvoice(req.tenantId, req.body, req.user._id);
      res.status(StatusCodes.CREATED).json({ success: true, data: invoice });
    } catch (error) { next(error); }
  }

  async getInvoice(req, res, next) {
    try {
      const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.tenantId })
        .populate('customer')
        .populate('createdBy', 'firstName lastName');
      if (!invoice) throw new NotFoundError('Invoice');
      res.json({ success: true, data: invoice });
    } catch (error) { next(error); }
  }

  async updateInvoice(req, res, next) {
    try {
      const invoice = await Invoice.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.tenantId, status: { $in: ['draft', 'sent'] } },
        { $set: req.body },
        { new: true }
      );
      if (!invoice) throw new NotFoundError('Invoice');
      res.json({ success: true, data: invoice });
    } catch (error) { next(error); }
  }

  async deleteInvoice(req, res, next) {
    try {
      const invoice = await Invoice.findOneAndUpdate(
        { _id: req.params.id, tenantId: req.tenantId, status: 'draft' },
        { $set: { deletedAt: new Date() } }
      );
      if (!invoice) throw new NotFoundError('Invoice');
      res.json({ success: true, message: 'Invoice deleted.' });
    } catch (error) { next(error); }
  }

  async sendInvoice(req, res, next) {
    try {
      const result = await financeService.sendInvoice(req.tenantId, req.params.id);
      res.json({ success: true, ...result });
    } catch (error) { next(error); }
  }

  async recordPayment(req, res, next) {
    try {
      const invoice = await financeService.recordPayment(req.tenantId, req.params.id, req.body, req.user._id);
      res.json({ success: true, data: invoice });
    } catch (error) { next(error); }
  }

  async downloadInvoicePDF(req, res, next) {
    try {
      const invoice = await Invoice.findOne({ _id: req.params.id, tenantId: req.tenantId }).lean();
      if (!invoice) throw new NotFoundError('Invoice');

      const tenant = await require('../tenant/tenant.model').findById(req.tenantId).lean();
      const pdfBuffer = await pdfService.generateInvoice(invoice, tenant);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoice.invoiceNumber}.pdf`);
      res.send(pdfBuffer);
    } catch (error) { next(error); }
  }

  async getTransactions(req, res, next) {
    try {
      const { page = 1, limit = 20, type, category, startDate, endDate } = req.query;
      const query = { tenantId: req.tenantId };
      if (type) query.type = type;
      if (category) query.category = category;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const [transactions, total] = await Promise.all([
        Transaction.find(query)
          .populate('createdBy', 'firstName lastName')
          .sort({ date: -1 })
          .skip((page - 1) * limit)
          .limit(parseInt(limit))
          .lean(),
        Transaction.countDocuments(query),
      ]);

      res.json({ success: true, data: transactions, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
    } catch (error) { next(error); }
  }

  async createTransaction(req, res, next) {
    try {
      const transaction = await Transaction.create({
        ...req.body,
        tenantId: req.tenantId,
        transactionNumber: `TXN-${Date.now()}`,
        createdBy: req.user._id,
      });
      res.status(StatusCodes.CREATED).json({ success: true, data: transaction });
    } catch (error) { next(error); }
  }

  async getTransaction(req, res, next) {
    try {
      const transaction = await Transaction.findOne({ _id: req.params.id, tenantId: req.tenantId });
      if (!transaction) throw new NotFoundError('Transaction');
      res.json({ success: true, data: transaction });
    } catch (error) { next(error); }
  }

  async getProfitLossReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const report = await financeService.getProfitLossReport(req.tenantId, startDate, endDate);
      res.json({ success: true, data: report });
    } catch (error) { next(error); }
  }

  async getBalanceSheet(req, res, next) {
    try {
      res.json({ success: true, data: { message: 'Balance sheet endpoint - implement based on chart of accounts' } });
    } catch (error) { next(error); }
  }

  async getCashFlowReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const tenantObjId = require('mongoose').Types.ObjectId(req.tenantId);

      const cashFlow = await Transaction.aggregate([
        {
          $match: {
            tenantId: tenantObjId,
            date: { $gte: new Date(startDate), $lte: new Date(endDate) },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: { type: '$type', month: { $month: '$date' }, year: { $year: '$date' } },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      res.json({ success: true, data: cashFlow });
    } catch (error) { next(error); }
  }

  async getTaxReport(req, res, next) {
    try {
      const { startDate, endDate } = req.query;
      const tenantObjId = new require('mongoose').Types.ObjectId(req.tenantId);

      const taxData = await Invoice.aggregate([
        {
          $match: {
            tenantId: tenantObjId,
            invoiceDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
            status: { $ne: 'cancelled' },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$totalAmount' },
            totalTax: { $sum: '$taxAmount' },
            totalCGST: { $sum: '$cgstAmount' },
            totalSGST: { $sum: '$sgstAmount' },
            totalIGST: { $sum: '$igstAmount' },
            invoiceCount: { $sum: 1 },
          },
        },
      ]);

      res.json({ success: true, data: taxData[0] || {} });
    } catch (error) { next(error); }
  }

  async exportReport(req, res, next) {
    try {
      const ExcelJS = require('exceljs');
      const { type, startDate, endDate } = req.query;

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Report');

      if (type === 'invoices') {
        const invoices = await Invoice.find({
          tenantId: req.tenantId,
          invoiceDate: { $gte: new Date(startDate), $lte: new Date(endDate) },
        }).lean();

        sheet.columns = [
          { header: 'Invoice #', key: 'invoiceNumber', width: 15 },
          { header: 'Date', key: 'invoiceDate', width: 15 },
          { header: 'Customer', key: 'customer', width: 25 },
          { header: 'Amount', key: 'totalAmount', width: 15 },
          { header: 'Paid', key: 'paidAmount', width: 15 },
          { header: 'Status', key: 'paymentStatus', width: 12 },
        ];

        invoices.forEach((inv) => {
          sheet.addRow({
            invoiceNumber: inv.invoiceNumber,
            invoiceDate: new Date(inv.invoiceDate).toLocaleDateString(),
            customer: inv.customerDetails?.name || '',
            totalAmount: inv.totalAmount,
            paidAmount: inv.paidAmount,
            paymentStatus: inv.paymentStatus,
          });
        });
      }

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${type}-report.xlsx`);
      await workbook.xlsx.write(res);
      res.end();
    } catch (error) { next(error); }
  }

  async getExpenses(req, res, next) {
    try {
      const { page = 1, limit = 20, category, startDate, endDate } = req.query;
      const query = { tenantId: req.tenantId, type: 'expense' };
      if (category) query.category = category;
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const [expenses, total] = await Promise.all([
        Transaction.find(query).sort({ date: -1 }).skip((page - 1) * limit).limit(parseInt(limit)).lean(),
        Transaction.countDocuments(query),
      ]);

      res.json({ success: true, data: expenses, pagination: { page: parseInt(page), limit: parseInt(limit), total } });
    } catch (error) { next(error); }
  }

  async createExpense(req, res, next) {
    try {
      const expense = await Transaction.create({
        ...req.body,
        type: 'expense',
        tenantId: req.tenantId,
        transactionNumber: `EXP-${Date.now()}`,
        createdBy: req.user._id,
      });
      res.status(StatusCodes.CREATED).json({ success: true, data: expense });
    } catch (error) { next(error); }
  }
}

module.exports = new FinanceController();
