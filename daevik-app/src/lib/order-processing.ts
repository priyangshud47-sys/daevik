import { supabase } from '@/lib/supabase';
import { sendProductDeliveryEmail } from '@/lib/email';
import { trackPurchase } from '@/lib/facebook-capi';
import { logFunnelEvent } from '@/lib/funnel';
import { generateInvoicePDF } from '@/lib/invoice';

export async function processOrderCompletion(
  orderId: string,
  transactionId: string | null,
  gatewayResponse: any,
  gatewayName: string,
  appUrl: string
) {
  // Atomic update for idempotency
  const { data: updatedOrder, error: updateError } = await supabase
    .from('orders')
    .update({
      payment_status: 'completed',
      transaction_id: transactionId,
      gateway_response: gatewayResponse,
    })
    .eq('id', orderId)
    .eq('payment_status', 'pending')
    .select('id')
    .single();

  // If no row was updated, another process already completed this order
  if (!updatedOrder || updateError) {
    return { status: 'already_processed' };
  }

  // Fetch full order details for emails and tracking
  const { data: order } = await supabase
    .from('orders')
    .select('*, product:products(*), customer:customers(*)')
    .eq('id', orderId)
    .single();

  if (!order || !order.customer || !order.product) {
    console.error('Order missing relations after completion:', orderId);
    return { status: 'completed_but_missing_relations' };
  }

  // Generate Invoice
  let invoicePdf;
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
      gateway: gatewayName,
      transactionId: transactionId || orderId,
    });
    invoicePdf = { filename: `Invoice-${order.id.slice(0, 8)}.pdf`, content: invoiceBuffer };
  } catch (err) {
    console.error('Failed to generate invoice PDF:', err);
  }

  // Send Email
  try {
    await sendProductDeliveryEmail({
      customerName: order.customer.name,
      customerEmail: order.customer.email,
      productName: order.product.name,
      productPrice: `₹${order.amount}`,
      downloadLink: `${appUrl}/thank-you/${order.product.slug}?orderId=${order.id}`,
      orderId: order.id,
      productId: order.product.id,
      invoicePdf,
    });
  } catch (emailErr) {
    console.error('Failed to send product delivery email:', emailErr);
  }

  // Track Facebook CAPI
  try {
    const nameParts = (order.customer.name || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    await trackPurchase({
      url: `${appUrl}/checkout/${order.product.slug}`,
      eventId: `purchase_${order.id}`,
      productName: order.product.name,
      productId: order.product.id,
      value: order.amount,
      currency: order.currency,
      userEmail: order.customer.email,
      userPhone: order.customer.phone || undefined,
      userFirstName: firstName || undefined,
      userLastName: lastName || undefined,
      // fb_pixel_id is stored inside checkout_config, not as a top-level column.
      // fb_access_token does not exist on products — the CAPI lib will fall back
      // to the global fb_capi_config table automatically.
      fbPixelId: (order.product.checkout_config as Record<string, string> | null)?.fb_pixel_id || null,
      fbAccessToken: null,
    });
  } catch (fbErr) {
    console.error('Failed to track FB CAPI:', fbErr);
  }

  // Log Funnel Event
  try {
    await logFunnelEvent({
      productId: order.product.id,
      sessionId: order.id,
      eventType: 'purchase',
    });
  } catch (funnelErr) {
    console.error('Failed to log funnel event:', funnelErr);
  }

  return { status: 'processed' };
}
