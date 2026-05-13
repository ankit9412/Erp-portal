const Invoice = require('./invoice.model');
const Transaction = require('./transaction.model');
const { cache } = require('../../config/redis');
const { AppError, NotFoundError } = require('../../middleware/error.middleware');
const { generateInvoicePDF } = require('../../shared/pdf.service');
const { sendEmail } = require('../../shared/email.service');
const mongoose = require('mongoose');
const moment = require('moment');

class FinanceService {
  /**
   * Create invoice
   */
  async createInvoice(tenantId, data, userId) {
    const tenant = await require('../tenant/tenant.model').findById(tenantId).lean();
    const prefix = tenant?.settings?.invoicePrefix || 'INV';
    const count = await Invoice.countDocuments({ tenantId });
    const invoiceNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;

    // Calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    const items = data.items.map((item) => {
      const lineTotal = item.quantity * item.unitPrice;
      const discountAmt = item.discountType === 'fixed'
        ? item.discount || 0
        : lineTotal * ((item.discount || 0) / 100);
      const taxableAmount = lineTotal - discountAmt;
      const tax = taxableAmount * ((item.taxRate || 0) / 100);

      subtotal += taxableAmount;
      taxAmount += tax;

      // GST split (CGST + SGST for intra-state, IGST for inter-state)
      const isInterState = data.isInterState || false;
      if (isInterState) {
        igstAmount += tax;
      } else {
        cgstAmount += tax / 2;
        sgstAmount += tax / 2;
      }

      return {
        ...item,
        taxAmount: tax,
        cgst: isInterState ? 0 : tax / 2,
        sgst: isInterState ? 0 : tax / 2,
        igst: isInterState ? tax : 0,
        totalAmount: taxableAmount + tax,
      };
    });

    const totalAmount = subtotal + taxAmount + (data.shippingAmount || 0) - (data.discountAmount || 0);

    const invoice = await Invoice.create({
      ...data,
      tenantId,
      invoiceNumber,
      items,
      subtotal,
      taxAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      totalAmount,
      balanceAmount: totalAmount,
      createdBy: userId,
    });

    // Create transaction record
    await Transaction.create({
      tenantId,
      transactionNumber: `TXN-${Date.now()}`,
      type: 'income',
      category: 'sales',
      amount: totalAmount,
      description: `Invoice ${invoiceNumber}`,
      referenceModel: 'Invoice',
      referenceId: invoice._id,
      date: invoice.invoiceDate,
      status: 'pending',
      createdBy: userId,
    });

    await cache.delPattern(`finance:${tenantId}:*`);
    return invoice;
  }

  /**
   * Record payment for invoice
   */
  async recordPayment(tenantId, invoiceId, paymentData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const invoice = await Invoice.findOne({ _id: invoiceId, tenantId }).session(session);
      if (!invoice) throw new NotFoundError('Invoice');

      if (invoice.paymentStatus === 'paid') {
        throw new AppError('Invoice is already fully paid.', 400);
      }

      const paymentAmount = parseFloat(paymentData.amount);
      if (paymentAmount > invoice.balanceAmount) {
        throw new AppError('Payment amount exceeds balance amount.', 400);
      }

      invoice.payments.push({
        ...paymentData,
        amount: paymentAmount,
        recordedBy: userId,
      });

      invoice.paidAmount += paymentAmount;
      invoice.balanceAmount = invoice.totalAmount - invoice.paidAmount;

      if (invoice.balanceAmount <= 0) {
        invoice.paymentStatus = 'paid';
        invoice.status = 'paid';
      } else {
        invoice.paymentStatus = 'partial';
        invoice.status = 'partial';
      }

      await invoice.save({ session });

      // Update transaction
      await Transaction.findOneAndUpdate(
        { tenantId, referenceId: invoiceId },
        { $set: { status: invoice.paymentStatus === 'paid' ? 'completed' : 'pending' } },
        { session }
      );

      await session.commitTransaction();
      await cache.delPattern(`finance:${tenantId}:*`);

      return invoice;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Generate and send invoice PDF
   */
  async sendInvoice(tenantId, invoiceId) {
    const invoice = await Invoice.findOne({ _id: invoiceId, tenantId })
      .populate('customer', 'name email')
      .lean();

    if (!invoice) throw new NotFoundError('Invoice');

    const tenant = await require('../tenant/tenant.model').findById(tenantId).lean();

    // Generate PDF
    const pdfBuffer = await generateInvoicePDF(invoice, tenant);

    // Send email
    await sendEmail({
      to: invoice.customerDetails?.email || invoice.customer?.email,
      subject: `Invoice ${invoice.invoiceNumber} from ${tenant.name}`,
      template: 'invoice',
      data: {
        invoiceNumber: invoice.invoiceNumber,
        companyName: tenant.name,
        customerName: invoice.customerDetails?.name,
        totalAmount: invoice.totalAmount,
        dueDate: invoice.dueDate,
      },
      attachments: [
        {
          filename: `Invoice-${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    await Invoice.findByIdAndUpdate(invoiceId, {
      status: 'sent',
      emailSentAt: new Date(),
    });

    return { message: 'Invoice sent successfully.' };
  }

  /**
   * Get financial dashboard stats
   */
  async getDashboardStats(tenantId, period = 'month') {
    const cacheKey = `finance:stats:${tenantId}:${period}`;
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const now = moment();
    let startDate, prevStartDate, prevEndDate;

    switch (period) {
      case 'week':
        startDate = now.clone().startOf('week').toDate();
        prevStartDate = now.clone().subtract(1, 'week').startOf('week').toDate();
        prevEndDate = now.clone().subtract(1, 'week').endOf('week').toDate();
        break;
      case 'year':
        startDate = now.clone().startOf('year').toDate();
        prevStartDate = now.clone().subtract(1, 'year').startOf('year').toDate();
        prevEndDate = now.clone().subtract(1, 'year').endOf('year').toDate();
        break;
      default: // month
        startDate = now.clone().startOf('month').toDate();
        prevStartDate = now.clone().subtract(1, 'month').startOf('month').toDate();
        prevEndDate = now.clone().subtract(1, 'month').endOf('month').toDate();
    }

    const tenantObjId = new mongoose.Types.ObjectId(tenantId);

    const [
      currentRevenue,
      prevRevenue,
      currentExpenses,
      prevExpenses,
      overdueInvoices,
      revenueByMonth,
      expenseByCategory,
      topCustomers,
    ] = await Promise.all([
      // Current period revenue
      Invoice.aggregate([
        { $match: { tenantId: tenantObjId, invoiceDate: { $gte: startDate }, paymentStatus: { $in: ['paid', 'partial'] } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      // Previous period revenue
      Invoice.aggregate([
        { $match: { tenantId: tenantObjId, invoiceDate: { $gte: prevStartDate, $lte: prevEndDate }, paymentStatus: { $in: ['paid', 'partial'] } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      // Current expenses
      Transaction.aggregate([
        { $match: { tenantId: tenantObjId, type: 'expense', date: { $gte: startDate }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Previous expenses
      Transaction.aggregate([
        { $match: { tenantId: tenantObjId, type: 'expense', date: { $gte: prevStartDate, $lte: prevEndDate }, status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),
      // Overdue invoices
      Invoice.countDocuments({
        tenantId,
        dueDate: { $lt: new Date() },
        paymentStatus: { $ne: 'paid' },
      }),
      // Revenue by month (last 12 months)
      Invoice.aggregate([
        {
          $match: {
            tenantId: tenantObjId,
            invoiceDate: { $gte: moment().subtract(12, 'months').toDate() },
          },
        },
        {
          $group: {
            _id: { year: { $year: '$invoiceDate' }, month: { $month: '$invoiceDate' } },
            revenue: { $sum: '$totalAmount' },
            paid: { $sum: '$paidAmount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      // Expenses by category
      Transaction.aggregate([
        { $match: { tenantId: tenantObjId, type: 'expense', date: { $gte: startDate } } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
        { $sort: { total: -1 } },
        { $limit: 10 },
      ]),
      // Top customers by revenue
      Invoice.aggregate([
        { $match: { tenantId: tenantObjId, invoiceDate: { $gte: startDate } } },
        { $group: { _id: '$customer', totalRevenue: { $sum: '$totalAmount' }, invoiceCount: { $sum: 1 } } },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'customers', localField: '_id', foreignField: '_id', as: 'customer' } },
      ]),
    ]);

    const revenue = currentRevenue[0]?.total || 0;
    const prevRev = prevRevenue[0]?.total || 0;
    const expenses = currentExpenses[0]?.total || 0;
    const prevExp = prevExpenses[0]?.total || 0;

    const stats = {
      revenue,
      revenueGrowth: prevRev > 0 ? (((revenue - prevRev) / prevRev) * 100).toFixed(1) : 0,
      expenses,
      expenseGrowth: prevExp > 0 ? (((expenses - prevExp) / prevExp) * 100).toFixed(1) : 0,
      profit: revenue - expenses,
      profitMargin: revenue > 0 ? (((revenue - expenses) / revenue) * 100).toFixed(1) : 0,
      overdueInvoices,
      revenueByMonth,
      expenseByCategory,
      topCustomers,
    };

    await cache.set(cacheKey, stats, 300);
    return stats;
  }

  /**
   * Get P&L report
   */
  async getProfitLossReport(tenantId, startDate, endDate) {
    const tenantObjId = new mongoose.Types.ObjectId(tenantId);
    const start = new Date(startDate);
    const end = new Date(endDate);

    const [income, expenses] = await Promise.all([
      Transaction.aggregate([
        { $match: { tenantId: tenantObjId, type: 'income', date: { $gte: start, $lte: end }, status: 'completed' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
      Transaction.aggregate([
        { $match: { tenantId: tenantObjId, type: 'expense', date: { $gte: start, $lte: end }, status: 'completed' } },
        { $group: { _id: '$category', total: { $sum: '$amount' } } },
      ]),
    ]);

    const totalIncome = income.reduce((sum, i) => sum + i.total, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.total, 0);

    return {
      period: { startDate, endDate },
      income: { breakdown: income, total: totalIncome },
      expenses: { breakdown: expenses, total: totalExpenses },
      grossProfit: totalIncome - totalExpenses,
      netProfit: totalIncome - totalExpenses,
      profitMargin: totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(2) : 0,
    };
  }
}

module.exports = new FinanceService();
