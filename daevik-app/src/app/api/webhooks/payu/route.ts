// PayU Webhook / Return Handler
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyPayUResponse } from '@/lib/payments/payu';
import { processOrderCompletion } from '@/lib/order-processing';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const params: Record<string, string> = {};
    formData.forEach((value, key) => {
      params[key] = value.toString();
    });

    const type = request.nextUrl.searchParams.get('type');
    const txnId = params.txnid;

    if (!txnId) {
      return NextResponse.redirect(new URL('/?error=invalid_transaction', request.url));
    }

    // Find order
    const { data: order } = await supabase
      .from('orders')
      .select('*, product:products(*), customer:customers(*)')
      .eq('gateway_order_id', txnId)
      .single();

    if (!order) {
      return NextResponse.redirect(new URL('/?error=order_not_found', request.url));
    }

    // Idempotency check
    if (order.payment_status === 'completed') {
      return NextResponse.redirect(
        new URL(`/thank-you/${order.product?.slug || ''}?orderId=${order.id}`, request.url)
      );
    }

    if (type === 'success' && params.status === 'success') {
      // Fetch gateway configuration from database
      const { data: gatewayConfig } = await supabase
        .from('gateway_configs')
        .select('*')
        .eq('provider', 'payu')
        .eq('active', true)
        .single();

      if (!gatewayConfig || !gatewayConfig.api_key || !gatewayConfig.api_secret) {
        console.error('PayU gateway not configured or missing keys');
        return NextResponse.redirect(new URL('/?error=gateway_not_configured', request.url));
      }

      // Verify hash
      const isValid = verifyPayUResponse(
        params, 
        gatewayConfig.api_key, 
        gatewayConfig.api_secret
      );

      if (!isValid) {
        // Only update to failed if not already completed (idempotency)
      if (order.payment_status !== 'completed') {
        await supabase
          .from('orders')
          .update({ payment_status: 'failed', gateway_response: params })
          .eq('id', order.id);
      }

        return NextResponse.redirect(new URL('/?error=payment_verification_failed', request.url));
      }

      // Update order and process completion
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'https://daevik.in');

      await processOrderCompletion(
        order.id,
        params.mihpayid || params.payuMoneyId || txnId,
        params,
        'PayU',
        appUrl
      );

      return NextResponse.redirect(
        new URL(`/thank-you/${order.product?.slug || ''}?orderId=${order.id}`, request.url)
      );
    } else {
      // Payment failed
      await supabase
        .from('orders')
        .update({ payment_status: 'failed', gateway_response: params })
        .eq('id', order.id);

      const productSlug = order.product?.slug || '';
      return NextResponse.redirect(
        new URL(`/checkout/${productSlug}?error=payment_failed`, request.url)
      );
    }
  } catch (error) {
    console.error('PayU webhook error:', error);
    return NextResponse.redirect(new URL('/?error=internal_error', request.url));
  }
}
