import PDFDocument from 'pdfkit';

interface InvoiceData {
  orderId: string;
  date: string;
  customerName: string;
  customerEmail: string;
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

      // Header
      doc
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('TAX INVOICE / RECEIPT', { align: 'right' })
        .moveDown();

      // Company Info
      doc
        .fontSize(10)
        .font('Helvetica')
        .text('Daevik', 50, 50)
        .text('contact@daevik.in', 50, 65)
        .text('https://daevik.in', 50, 80)
        .moveDown();

      // Invoice Details
      doc.moveTo(50, 110).lineTo(550, 110).stroke();
      
      const detailsTop = 130;
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Billed To:', 50, detailsTop)
        .font('Helvetica')
        .text(data.customerName, 50, detailsTop + 15)
        .text(data.customerEmail, 50, detailsTop + 30);

      doc
        .font('Helvetica-Bold')
        .text('Invoice Details:', 350, detailsTop)
        .font('Helvetica')
        .text(`Order ID: ${data.orderId}`, 350, detailsTop + 15)
        .text(`Date: ${data.date}`, 350, detailsTop + 30)
        .text(`Payment Gateway: ${data.gateway.toUpperCase()}`, 350, detailsTop + 45);

      if (data.transactionId) {
        doc.text(`Transaction ID: ${data.transactionId}`, 350, detailsTop + 60);
      }

      doc.moveTo(50, 220).lineTo(550, 220).stroke();

      // Table Header
      const tableTop = 240;
      doc
        .font('Helvetica-Bold')
        .text('Description', 50, tableTop)
        .text('Qty', 350, tableTop)
        .text('Amount', 450, tableTop, { width: 100, align: 'right' });

      doc.moveTo(50, 260).lineTo(550, 260).stroke();

      // Table Row
      doc
        .font('Helvetica')
        .text(data.productName, 50, 280, { width: 280 })
        .text('1', 350, 280)
        .text(`${data.currency} ${data.amount.toFixed(2)}`, 450, 280, { width: 100, align: 'right' });

      doc.moveTo(50, 310).lineTo(550, 310).stroke();

      // Totals
      doc
        .font('Helvetica-Bold')
        .text('Total:', 350, 330)
        .text(`${data.currency} ${data.amount.toFixed(2)}`, 450, 330, { width: 100, align: 'right' });

      // Footer
      doc
        .fontSize(10)
        .font('Helvetica')
        .text(
          'This is a computer-generated invoice and does not require a physical signature.',
          50,
          700,
          { align: 'center', width: 500 }
        );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
