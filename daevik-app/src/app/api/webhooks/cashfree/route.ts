// Cashfree: Server-side payment verification + webhook handler
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyCashfreeSignature } from '@/lib/payments/cashfree';
import { processOrderCompletion } from '@/lib/order-processing';
import { redirect } from 'next/navigation';

// =====================================================
// POST: Cashfree Webhook (called by Cashfree servers)
// =====================================================
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Check if this is a webhook (has signature headers) or a return URL redirect
  const signature = request.headers.get('x-webhook-signature');
  const timestamp = request.headers.get('x-webhook-timestamp');

  // If no signature headers, this might be Cashfree's return_url POST redirect
  // Some Cashfree flows POST to the return URL
  if (!signature || !timestamp) {
    // Try to handle as a return URL
    const url = new URL(request.url);
    const orderId = url.searchParams.get('order_id');
    if (orderId) {
      return handleReturnUrl(orderId, request);
    }
    console.error('Cashfree Webhook: Missing signature headers and no order_id');
    return NextResponse.json({ error: 'Missing webhook headers' }, { status: 400 });
  }

  try {
    const body = JSON.parse(rawBody);

    // Get gateway config for Cashfree
    const { data: config } = await supabase
      .from('gateway_configs')
      .select('webhook_secret, api_secret')
      .eq('provider', 'cashfree')
      .eq('active', true)
      .single();

    if (!config) {
      console.error('Cashfree Webhook: No active config found');
      return NextResponse.json({ error: 'Cashfree not configured' }, { status: 400 });
    }

    const secret = config.webhook_secret || config.api_secret;

    if (!secret) {
      console.error('Cashfree Webhook: No secret found');
      return NextResponse.json({ error: 'Webhook secret missing' }, { status: 400 });
    }

    const isValid = verifyCashfreeSignature(rawBody, signature, timestamp, secret);

    // If it's a test webhook from the dashboard, just return 200 OK
    // Cashfree often sends test webhooks with mismatched signatures (e.g., using test keys while app is in live mode)
    if (body.type === 'TEST' || body.type === 'TEST_WEBHOOK' || body.type === 'WEBHOOK_TEST') {
      console.log('Cashfree Webhook: Received test ping. Returning 200 OK.');
      return NextResponse.json({ success: true, message: 'Test webhook received' });
    }

    if (!isValid) {
      console.error('Cashfree Webhook: Invalid signature. Secret used:', secret.substring(0, 4) + '...');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Cashfree Webhook: Valid signature, event type:', body.type);

    // Process the event
    if (body.type === 'PAYMENT_SUCCESS_WEBHOOK' || body.data?.payment?.payment_status === 'SUCCESS') {
      const orderId = body.data.order.order_id;
      const transactionId = body.data.payment.cf_payment_id;

      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'https://daevik.in');

      console.log('Cashfree Webhook: Processing order', orderId);

      await processOrderCompletion(
        orderId,
        transactionId ? transactionId.toString() : null,
        body,
        'Cashfree',
        appUrl
      );

      console.log('Cashfree Webhook: Order processed successfully', orderId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cashfree Webhook Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// =====================================================
// GET: Return URL handler (customer redirected here after payment)
// This is the critical path for modal-based checkout
// =====================================================
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const orderId = url.searchParams.get('order_id');

  if (!orderId) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
  }

  return handleReturnUrl(orderId, request);
}

// =====================================================
// Shared: Verify payment with Cashfree API and process
// =====================================================
async function handleReturnUrl(orderId: string, request: NextRequest) {
  try {
    // 1. Fetch order to get product slug for redirect
    const { data: order } = await supabase
      .from('orders')
      .select('id, payment_status, product:products(slug)')
      .eq('id', orderId)
      .single();

    if (!order) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const productSlug = (order.product as any)?.slug || '';

    // If already completed (by webhook), just redirect
    if (order.payment_status === 'completed') {
      return NextResponse.redirect(new URL(`/thank-you/${productSlug}?orderId=${orderId}`, request.url));
    }

    // 2. Verify payment directly with Cashfree API
    const { data: config } = await supabase
      .from('gateway_configs')
      .select('api_key, api_secret, extra_config')
      .eq('provider', 'cashfree')
      .single();

    if (!config || !config.api_key || !config.api_secret) {
      console.error('Cashfree Return: No config found for verification');
      return NextResponse.redirect(new URL(`/thank-you/${productSlug}?orderId=${orderId}`, request.url));
    }

    const mode = (config.extra_config as Record<string, string>)?.mode || 'test';
    const baseUrl = mode === 'live' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';

    const cfRes = await fetch(`${baseUrl}/orders/${orderId}`, {
      headers: {
        'x-client-id': config.api_key,
        'x-client-secret': config.api_secret,
        'x-api-version': '2023-08-01'
      }
    });

    if (cfRes.ok) {
      const cfData = await cfRes.json();
      console.log('Cashfree Return: Order status for', orderId, ':', cfData.order_status);

      if (cfData.order_status === 'PAID') {
        const host = request.headers.get('host');
        const protocol = request.headers.get('x-forwarded-proto') || 'https';
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'https://daevik.in');

        await processOrderCompletion(
          orderId,
          cfData.cf_order_id ? cfData.cf_order_id.toString() : null,
          cfData,
          'Cashfree',
          appUrl
        );

        console.log('Cashfree Return: Order completed and email sent for', orderId);
      }
    } else {
      console.error('Cashfree Return: API verification failed', await cfRes.text());
    }

    // 3. Always redirect to thank-you page
    return NextResponse.redirect(new URL(`/thank-you/${productSlug}?orderId=${orderId}`, request.url));
  } catch (error) {
    console.error('Cashfree Return URL Error:', error);
    return NextResponse.redirect(new URL('/', request.url));
  }
}
