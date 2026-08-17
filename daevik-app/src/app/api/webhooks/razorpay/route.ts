// Razorpay Webhook Handler
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyRazorpayWebhookSignature } from '@/lib/payments/razorpay';
import { sendProductDeliveryEmail } from '@/lib/email';
import { trackPurchase } from '@/lib/facebook-capi';
import { logFunnelEvent } from '@/lib/funnel';
import { generateInvoicePDF } from '@/lib/invoice';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';
    // Fetch gateway configuration from database
    const { data: gatewayConfig } = await supabase
      .from('gateway_configs')
      .select('*')
      .eq('provider', 'razorpay')
      .eq('active', true)
      .single();

    const webhookSecret = gatewayConfig?.webhook_secret || process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('CRITICAL: Razorpay webhook secret is missing from database and env');
      return NextResponse.json({ error: 'Webhook configuration error' }, { status: 500 });
    }

    // Verify webhook signature safely
    if (!verifyRazorpayWebhookSignature(body, signature, webhookSecret)) {
      console.error('Razorpay Webhook: Invalid signature detected');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    // Handle payment.captured or order.paid
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const razorpayOrderId = eventType === 'payment.captured' 
        ? event.payload.payment.entity.order_id 
        : event.payload.order.entity.id;
      
      // Both payment.captured and order.paid include the payment entity in Razorpay
      const paymentEntity = event.payload.payment?.entity;

      // Find the order by gateway_order_id
      const { data: order } = await supabase
        .from('orders')
        .select('*, product:products(*), customer:customers(*)')
        .eq('gateway_order_id', razorpayOrderId)
        .single();

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Atomic update for idempotency
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          // Use payment ID if available, fallback to Razorpay Order ID
          transaction_id: paymentEntity?.id || razorpayOrderId,
          gateway_response: event.payload,
        })
        .eq('id', order.id)
        .eq('payment_status', 'pending')
        .select('id')
        .single();

      // If no row was updated, another concurrent webhook already processed it
      if (!updatedOrder || updateError) {
        return NextResponse.json({ status: 'already_processed' });
      }

      // Dynamically determine the app URL for the email link
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'https://daevik.in');

      // Send product delivery email and track events only if we successfully moved from pending -> completed
      if (order.customer && order.product) {
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
            gateway: 'Razorpay',
            transactionId: paymentEntity?.id,
          });
          invoicePdf = { filename: `Invoice-${order.id.slice(0, 8)}.pdf`, content: invoiceBuffer };
        } catch (err) {
          console.error('Failed to generate invoice PDF:', err);
        }

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

        // Track purchase event (Facebook CAPI)
        await trackPurchase({
          url: `${appUrl}/checkout/${order.product.slug}`,
          eventId: `purchase_${order.id}`,
          productName: order.product.name,
          productId: order.product.id,
          value: order.amount,
          currency: order.currency,
          userEmail: order.customer.email,
          fbPixelId: order.product.fb_pixel_id,
          fbAccessToken: order.product.fb_access_token,
        });

        // Log funnel event
        await logFunnelEvent({
          productId: order.product.id,
          sessionId: order.id,
          eventType: 'purchase',
        });
      }
    } else if (eventType === 'payment.failed') {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;

      const { data: order } = await supabase
        .from('orders')
        .select('id, payment_status')
        .eq('gateway_order_id', razorpayOrderId)
        .single();

      if (order && order.payment_status !== 'completed') {
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
            gateway_response: event.payload,
          })
          .eq('id', order.id);
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
