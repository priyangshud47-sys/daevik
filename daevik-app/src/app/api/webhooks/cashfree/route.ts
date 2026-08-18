import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyCashfreeSignature } from '@/lib/payments/cashfree';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-webhook-signature');
    const timestamp = request.headers.get('x-webhook-timestamp');

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
    }

    const body = JSON.parse(rawBody);

    // Get gateway config for Cashfree
    const { data: config } = await supabase
      .from('gateway_configs')
      .select('webhook_secret, api_secret')
      .eq('provider', 'cashfree')
      .eq('active', true)
      .single();

    if (!config) {
      return NextResponse.json({ error: 'Cashfree not configured' }, { status: 400 });
    }

    // Usually Cashfree webhooks are verified with API Secret or a specific Webhook Secret if generated
    // We'll prioritize the webhook_secret, fallback to api_secret
    const secret = config.webhook_secret || config.api_secret;

    if (!secret) {
      return NextResponse.json({ error: 'Webhook secret missing' }, { status: 400 });
    }

    const isValid = verifyCashfreeSignature(rawBody, signature, timestamp, secret);

    if (!isValid) {
      console.error('Invalid Cashfree webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Process the event
    // Cashfree event type usually in `type` or we can just check `data.payment.payment_status`
    if (body.type === 'PAYMENT_SUCCESS_WEBHOOK' || body.data?.payment?.payment_status === 'SUCCESS') {
      const orderId = body.data.order.order_id;
      const transactionId = body.data.payment.cf_payment_id;

      // Check order
      const { data: order } = await supabase
        .from('orders')
        .select('*, customer:customers(*), product:products(*)')
        .eq('id', orderId)
        .single();

      if (order && order.payment_status === 'pending') {
        // Mark as completed
        await supabase
          .from('orders')
          .update({
            payment_status: 'completed',
            gateway_order_id: transactionId ? transactionId.toString() : order.gateway_order_id,
          })
          .eq('id', orderId);

        // Send email (we make an internal request to our email API)
        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
        
        try {
          await fetch(`${appUrl}/api/email/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerName: order.customer.name,
              customerEmail: order.customer.email,
              productName: order.product.name,
              productPrice: `₹${order.amount}`,
              downloadLink: `${appUrl}/thank-you/${order.product.slug}?orderId=${order.id}`,
              orderId: order.id,
            })
          });
        } catch (emailErr) {
          console.error('Failed to trigger email API from webhook', emailErr);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cashfree Webhook Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
