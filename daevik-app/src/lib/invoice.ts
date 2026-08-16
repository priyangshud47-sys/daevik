import PDFDocument from 'pdfkit';

interface InvoiceData {
  orderId: string;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  productName: string;
  amount: number;
  currency: string;
  gateway: string;
  transactionId?: string | null;
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      const brandColor = '#111827'; // Dark gray/black for professional look
      const accentColor = '#6B1D2A'; // Daevik brand color

      // --- Header ---
      doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .fillColor(brandColor)
        .text('INVOICE', 50, 50, { align: 'right' });

      doc
        .fontSize(10)
        .font('Helvetica')
        .fillColor('#6B7280')
        .text('Daevik', 50, 55)
        .text('contact@daevik.in')
        .text('https://daevik.in');

      doc.moveDown(2);
      const headerY = doc.y;

      // --- Divider ---
      doc
        .moveTo(50, headerY)
        .lineTo(545, headerY)
        .lineWidth(2)
        .strokeColor(accentColor)
        .stroke();

      doc.moveDown(1);

      // --- Customer & Invoice Details ---
      const detailsY = doc.y;

      // Left Column (Billed To)
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(brandColor)
        .text('Billed To:', 50, detailsY)
        .font('Helvetica')
        .fillColor('#374151')
        .moveDown(0.2)
        .text(data.customerName)
        .text(data.customerEmail);

      if (data.customerPhone) {
        doc.text(data.customerPhone);
      }

      const leftBottom = doc.y;

      // Right Column (Invoice Info)
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(brandColor)
        .text('Invoice Details:', 300, detailsY)
        .font('Helvetica')
        .fillColor('#374151')
        .moveDown(0.2)
        .text(`Order ID: ${data.orderId}`, { width: 245 }) // Specify width to allow wrapping
        .text(`Date: ${data.date}`, { width: 245 })
        .text(`Gateway: ${data.gateway.toUpperCase()}`, { width: 245 });

      if (data.transactionId) {
        doc.text(`Transaction ID: ${data.transactionId}`, { width: 245 });
      }

      doc.moveDown(2);

      // Save Y position after the details (which might wrap)
      const tableTop = Math.max(leftBottom, doc.y) + 20;

      // --- Table Header ---
      doc
        .moveTo(50, tableTop - 10)
        .lineTo(545, tableTop - 10)
        .lineWidth(1)
        .strokeColor('#E5E7EB')
        .stroke();

      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(brandColor)
        .text('Description', 50, tableTop)
        .text('Qty', 350, tableTop, { width: 50, align: 'center' })
        .text('Amount', 420, tableTop, { width: 125, align: 'right' });

      doc
        .moveTo(50, tableTop + 15)
        .lineTo(545, tableTop + 15)
        .stroke();

      // --- Table Row ---
      const rowTop = tableTop + 25;
      
      doc
        .font('Helvetica')
        .fillColor('#374151')
        .text(data.productName, 50, rowTop, { width: 290 })
        .text('1', 350, rowTop, { width: 50, align: 'center' })
        .text(`${data.currency} ${data.amount.toFixed(2)}`, 420, rowTop, { width: 125, align: 'right' });

      // Calculate position after description which might wrap
      const tableBottom = doc.y + 15;

      doc
        .moveTo(50, tableBottom)
        .lineTo(545, tableBottom)
        .stroke();

      // --- Totals ---
      doc
        .font('Helvetica-Bold')
        .fillColor(brandColor)
        .text('Total:', 350, tableBottom + 15)
        .text(`${data.currency} ${data.amount.toFixed(2)}`, 420, tableBottom + 15, { width: 125, align: 'right' });

      // --- Footer ---
      doc
        .fontSize(9)
        .font('Helvetica')
        .fillColor('#9CA3AF')
        .text(
          'This is a computer-generated invoice and does not require a physical signature.',
          50,
          750,
          { align: 'center', width: 495 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
