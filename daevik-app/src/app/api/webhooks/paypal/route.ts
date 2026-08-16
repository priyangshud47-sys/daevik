// PayPal Return / Webhook Handler
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { capturePayPalOrder } from '@/lib/payments/paypal';
import { sendProductDeliveryEmail } from '@/lib/email';
import { trackPurchase } from '@/lib/facebook-capi';
import { logFunnelEvent } from '@/lib/funnel';
import { generateInvoicePDF } from '@/lib/invoice';

// Handle PayPal return redirect (capture payment)
export async function GET(request: NextRequest) {
  try {
    const orderId = request.nextUrl.searchParams.get('orderId');
    const token = request.nextUrl.searchParams.get('token'); // PayPal order ID

    if (!orderId || !token) {
      return NextResponse.redirect(new URL('/?error=invalid_paypal_return', request.url));
    }

    // Find our order
    const { data: order } = await supabase
      .from('orders')
      .select('*, product:products(*), customer:customers(*)')
      .eq('id', orderId)
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

    // Fetch gateway configuration from database
    const { data: gatewayConfig } = await supabase
      .from('gateway_configs')
      .select('*')
      .eq('provider', 'paypal')
      .eq('active', true)
      .single();

    if (!gatewayConfig || !gatewayConfig.api_key || !gatewayConfig.api_secret) {
      console.error('PayPal gateway not configured or missing keys');
      return NextResponse.redirect(new URL('/?error=gateway_not_configured', request.url));
    }

    const mode = (gatewayConfig.extra_config as Record<string, string>)?.mode || 'test';

    // Capture the payment
    const captureResult = await capturePayPalOrder(
      token,
      gatewayConfig.api_key,
      gatewayConfig.api_secret,
      mode as 'test' | 'live'
    );

    if (captureResult.status === 'COMPLETED') {
      // Update order
      await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          transaction_id: captureResult.id,
          gateway_response: captureResult as unknown as Record<string, unknown>,
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
            gateway: 'PayPal',
            transactionId: captureResult.id,
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
      await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          gateway_response: captureResult as unknown as Record<string, unknown>,
        })
        .eq('id', order.id);

      const productSlug = order.product?.slug || '';
      return NextResponse.redirect(
        new URL(`/checkout/${productSlug}?error=payment_failed`, request.url)
      );
    }
  } catch (error) {
    console.error('PayPal return error:', error);
    return NextResponse.redirect(new URL('/?error=internal_error', request.url));
  }
}
