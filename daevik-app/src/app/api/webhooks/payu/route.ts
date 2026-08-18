// PayU Webhook / Return Handler
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { verifyPayUResponse } from '@/lib/payments/payu';
import { sendProductDeliveryEmail } from '@/lib/email';
import { trackPurchase } from '@/lib/facebook-capi';
import { logFunnelEvent } from '@/lib/funnel';
import { generateInvoicePDF } from '@/lib/invoice';

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

      // Update order
      await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          transaction_id: params.mihpayid || params.payuMoneyId,
          gateway_response: params,
        })
        .eq('id', order.id);

      // Dynamically determine the app URL for the email link
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${protocol}://${host}` : 'https://daevik.in');

      // Send product delivery email
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
            gateway: 'PayU',
            transactionId: params.mihpayid || txnId,
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

        await logFunnelEvent({
          productId: order.product.id,
          sessionId: order.id,
          eventType: 'purchase',
        });
      }

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
