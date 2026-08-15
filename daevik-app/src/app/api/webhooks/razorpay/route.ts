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

    const { data: config } = await supabase
      .from('gateway_configs')
      .select('webhook_secret')
      .eq('provider', 'razorpay')
      .eq('active', true)
      .single();

    if (!config || !config.webhook_secret) {
      return NextResponse.json({ error: 'Gateway config missing' }, { status: 500 });
    }

    // Verify webhook signature
    if (!verifyRazorpayWebhookSignature(body, signature, config.webhook_secret)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(body);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const razorpayOrderId = payment.order_id;

      // Find the order by gateway_order_id
      const { data: order } = await supabase
        .from('orders')
        .select('*, product:products(*), customer:customers(*)')
        .eq('gateway_order_id', razorpayOrderId)
        .single();

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Idempotency check
      if (order.payment_status === 'completed') {
        return NextResponse.json({ status: 'already_processed' });
      }

      // Update order status
      await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          transaction_id: payment.id,
          gateway_response: payment,
        })
        .eq('id', order.id);

      // Dynamically determine the app URL for the email link
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'https://daevik.in');

      // Send product delivery email
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
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Razorpay webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
