import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyCashfreeSignature } from '@/lib/payments/cashfree';
import { processOrderCompletion } from '@/lib/order-processing';

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

      // We just call the unified order processor
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'https://daevik.in');

      await processOrderCompletion(
        orderId,
        transactionId ? transactionId.toString() : null,
        body,
        'Cashfree',
        appUrl
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cashfree Webhook Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
