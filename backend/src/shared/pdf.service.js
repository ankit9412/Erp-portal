const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { formatCurrency, formatDate } = require('../utils/formatters');

class PDFService {
  async generateInvoice(invoice, tenant) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Header
        doc.fillColor('#444444')
          .fontSize(20)
          .text(tenant.name, 50, 57)
          .fontSize(10)
          .text(tenant.email, 50, 80)
          .text(tenant.phone, 50, 95)
          .text(tenant.address?.street || '', 50, 110)
          .moveDown();

        // Invoice Title
        doc.fillColor('#333333')
          .fontSize(20)
          .text('INVOICE', 50, 160, { align: 'right' });

        doc.fontSize(10)
          .text(`Invoice Number: ${invoice.invoiceNumber}`, 50, 185, { align: 'right' })
          .text(`Date: ${new Date(invoice.invoiceDate).toLocaleDateString()}`, 50, 200, { align: 'right' })
          .text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 50, 215, { align: 'right' })
          .moveDown();

        // Billing Details
        doc.fillColor('#444444')
          .fontSize(12)
          .text('Bill To:', 50, 160)
          .fontSize(10)
          .text(invoice.customerName, 50, 180)
          .text(invoice.customerEmail || '', 50, 195)
          .text(invoice.customerAddress || '', 50, 210);

        // Table Header
        const tableTop = 270;
        doc.font('Helvetica-Bold');
        this.generateTableRow(doc, tableTop, 'Item', 'Quantity', 'Price', 'Total');
        this.generateHr(doc, tableTop + 20);
        doc.font('Helvetica');

        // Table Items
        let i;
        for (i = 0; i < invoice.items.length; i++) {
          const item = invoice.items[i];
          const position = tableTop + (i + 1) * 30;
          this.generateTableRow(
            doc,
            position,
            item.name,
            item.quantity.toString(),
            item.unitPrice.toFixed(2),
            (item.quantity * item.unitPrice).toFixed(2)
          );
          this.generateHr(doc, position + 20);
        }

        // Summary
        const subtotalPosition = tableTop + (i + 1) * 30;
        doc.font('Helvetica-Bold');
        this.generateTableRow(doc, subtotalPosition, '', '', 'Subtotal', invoice.subTotal.toFixed(2));
        
        const taxPosition = subtotalPosition + 20;
        this.generateTableRow(doc, taxPosition, '', '', `Tax (${invoice.taxRate}%)`, invoice.taxAmount.toFixed(2));
        
        const totalPosition = taxPosition + 25;
        doc.fontSize(15);
        this.generateTableRow(doc, totalPosition, '', '', 'TOTAL', invoice.totalAmount.toFixed(2));

        // Footer
        doc.fontSize(10)
          .fillColor('#777777')
          .text('Thank you for your business.', 50, 700, { align: 'center', width: 500 });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  generateTableRow(doc, y, item, quantity, price, total) {
    doc.fontSize(10)
      .text(item, 50, y)
      .text(quantity, 280, y, { width: 90, align: 'right' })
      .text(price, 370, y, { width: 90, align: 'right' })
      .text(total, 0, y, { align: 'right' });
  }

  generateHr(doc, y) {
    doc.strokeColor('#aaaaaa')
      .lineWidth(1)
      .moveTo(50, y)
      .lineTo(550, y)
      .stroke();
  }
}

module.exports = new PDFService();
