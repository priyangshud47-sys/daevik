// Razorpay Webhook Handler
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyRazorpayWebhookSignature } from '@/lib/payments/razorpay';
import { processOrderCompletion } from '@/lib/order-processing';

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

      // Dynamically determine the app URL for the email link
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'https://daevik.in');

      const result = await processOrderCompletion(
        order.id,
        paymentEntity?.id || razorpayOrderId,
        event.payload,
        'Razorpay',
        appUrl
      );

      if (result.status === 'already_processed') {
        return NextResponse.json({ status: 'already_processed' });
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
