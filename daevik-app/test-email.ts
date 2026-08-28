import { sendProductDeliveryEmail } from '@/lib/email';
import { supabase } from '@/lib/supabase';
import { generateInvoicePDF } from '@/lib/invoice';
import { processOrderCompletion } from '@/lib/order-processing';

async function testEmail() {
  const orderId = '2a07c385-5403-4107-98ec-755c497eb95e';
  console.log('Testing email for order:', orderId);

  const { data: order } = await supabase
    .from('orders')
    .select('*, product:products(*), customer:customers(*)')
    .eq('id', orderId)
    .single();

  if (!order) {
    console.log('Order not found');
    return;
  }

  console.log('Order found:', order.id);
  console.log('Customer:', order.customer.email);

  try {
    const invoiceBuffer = await generateInvoicePDF({
      orderId: order.id,
      date: new Date().toLocaleDateString(),
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      customerPhone: order.customer.phone,
      productName: order.product.name,
      amount: order.amount,
      currency: order.currency,
      gateway: 'Cashfree',
      transactionId: order.transaction_id || order.id,
    });

    console.log('Invoice generated. Size:', invoiceBuffer.length);

    const result = await sendProductDeliveryEmail({
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      productName: order.product.name,
      productPrice: `₹${order.amount}`,
      downloadLink: `https://daevik.in/thank-you/${order.product.slug}?orderId=${order.id}`,
      orderId: order.id,
      productId: order.product.id,
      invoicePdf: { filename: `Invoice-${order.id.slice(0, 8)}.pdf`, content: invoiceBuffer },
    });

    console.log('Email send result:', result);
  } catch (e) {
    console.error('Error during email test:', e);
  }
}

testEmail();
