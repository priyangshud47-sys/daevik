// Razorpay Webhook Handler
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyRazorpayWebhookSignature } from '@/lib/payments/razorpay';
import { sendProductDeliveryEmail } from '@/lib/email';
import { trackPurchase } from '@/lib/facebook-capi';
import { logFunnelEvent } from '@/lib/funnel';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature') || '';
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('CRITICAL: RAZORPAY_WEBHOOK_SECRET is missing from environment variables');
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
      
      const paymentEntity = eventType === 'payment.captured' 
        ? event.payload.payment.entity 
        : null;

      // Find the order by gateway_order_id
      const { data: order } = await supabase
        .from('orders')
        .select('*, product:products(*), customer:customers(*)')
        .eq('gateway_order_id', razorpayOrderId)
        .single();

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Idempotency check: if order is already processed, safely return OK
      if (order.payment_status === 'completed') {
        return NextResponse.json({ status: 'already_processed' });
      }

      // Update order status
      await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          ...(paymentEntity && { transaction_id: paymentEntity.id }),
          gateway_response: event.payload,
        })
        .eq('id', order.id);

      // Dynamically determine the app URL for the email link
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'https://daevik.in');

      // Send product delivery email and track events only if we successfully moved from pending -> completed
      if (order.customer && order.product) {
        await sendProductDeliveryEmail({
          customerName: order.customer.name,
          customerEmail: order.customer.email,
          productName: order.product.name,
          productPrice: `₹${order.amount}`,
          downloadLink: `${appUrl}/thank-you/${order.product.slug}?orderId=${order.id}`,
          orderId: order.id,
          productId: order.product.id,
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
