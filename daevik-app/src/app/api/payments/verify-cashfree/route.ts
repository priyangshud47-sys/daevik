// Server-side Cashfree payment verification endpoint
// Called by the checkout page after Cashfree modal returns success
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { processOrderCompletion } from '@/lib/order-processing';

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // 1. Check if order exists and is still pending
    const { data: order } = await supabase
      .from('orders')
      .select('id, payment_status, gateway_used, product:products(slug)')
      .eq('id', orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.payment_status === 'completed') {
      return NextResponse.json({ status: 'already_completed', slug: (order.product as any)?.slug });
    }

    if (order.gateway_used !== 'cashfree') {
      return NextResponse.json({ error: 'Not a Cashfree order' }, { status: 400 });
    }

    // 2. Verify payment with Cashfree API
    const { data: config } = await supabase
      .from('gateway_configs')
      .select('api_key, api_secret, extra_config')
      .eq('provider', 'cashfree')
      .single();

    if (!config || !config.api_key || !config.api_secret) {
      return NextResponse.json({ error: 'Cashfree not configured' }, { status: 500 });
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

    if (!cfRes.ok) {
      console.error('Cashfree verify: API call failed', await cfRes.text());
      return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }

    const cfData = await cfRes.json();

    if (cfData.order_status !== 'PAID') {
      return NextResponse.json({ status: 'not_paid', orderStatus: cfData.order_status });
    }

    // 3. Process the order (update DB, send email, track FB, generate invoice)
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'https://daevik.in');

    const result = await processOrderCompletion(
      orderId,
      cfData.cf_order_id ? cfData.cf_order_id.toString() : null,
      cfData,
      'Cashfree',
      appUrl
    );

    console.log('Cashfree Verify: Order processed', orderId, result.status);

    return NextResponse.json({ 
      status: 'completed', 
      slug: (order.product as any)?.slug 
    });
  } catch (error) {
    console.error('Cashfree verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
