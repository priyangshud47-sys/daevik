// Create payment order — routes to correct gateway based on product config
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createRazorpayOrder } from '@/lib/payments/razorpay';
import { createPayUFormData } from '@/lib/payments/payu';
import { createPayPalOrder } from '@/lib/payments/paypal';
import { createCashfreeOrder } from '@/lib/payments/cashfree';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productSlug, customerName, customerEmail, customerPhone, fbp, fbc, ga_client_id } = body;

    // Capture IP and User-Agent at order creation time for FB CAPI match quality
    const userIp = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || request.headers.get('x-real-ip')
      || null;
    const userAgent = request.headers.get('user-agent') || null;

    if (!productSlug || !customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { error: 'Missing required fields including phone number' },
        { status: 400 }
      );
    }

    if (
      typeof productSlug !== 'string' || productSlug.length > 100 ||
      typeof customerName !== 'string' || customerName.length > 100 ||
      typeof customerEmail !== 'string' || customerEmail.length > 150 || !/^\S+@\S+\.\S+$/.test(customerEmail) ||
      (customerPhone && (typeof customerPhone !== 'string' || customerPhone.length > 20))
    ) {
      return NextResponse.json(
        { error: 'Invalid input format or length' },
        { status: 400 }
      );
    }

    // Fetch product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('slug', productSlug)
      .eq('status', 'live')
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Create or find customer
    let customerId: string;
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', customerEmail)
      .single();

    if (existingCustomer) {
      customerId = existingCustomer.id;
    } else {
      const { data: newCustomer, error: customerError } = await supabase
        .from('customers')
        .insert({
          name: customerName,
          email: customerEmail,
          phone: customerPhone || null,
        })
        .select('id')
        .single();

      if (customerError || !newCustomer) {
        return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
      }
      customerId = newCustomer.id;
    }

    const orderId = uuidv4();
    const host = request.headers.get('host');
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    let appUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!appUrl) {
      appUrl = host ? `${protocol}://${host}` : 'http://localhost:3000';
    }

    const setSessionCookie = (res: NextResponse) => {
      res.cookies.set('daevik_customer_session', customerId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365,
      });
      return res;
    };

    // Fetch gateway configuration from database
    const { data: gatewayConfig } = await supabase
      .from('gateway_configs')
      .select('*')
      .eq('provider', product.gateway_provider)
      .eq('active', true)
      .single();

    if (!gatewayConfig) {
      return NextResponse.json({ error: `Payment gateway ${product.gateway_provider} is not configured or not active` }, { status: 400 });
    }

    const mode = (gatewayConfig.extra_config as Record<string, string>)?.mode || 'test';

    // Route to correct gateway
    switch (product.gateway_provider) {
      case 'razorpay': {
        const rzpOrder = await createRazorpayOrder({
          amount: product.price,
          currency: 'INR',
          receipt: orderId,
          notes: {
            product_id: product.id,
            customer_id: customerId,
          },
          keyId: gatewayConfig.api_key || '',
          keySecret: gatewayConfig.api_secret || '',
        });

        // Create pending order
        await supabase.from('orders').insert({
          id: orderId,
          product_id: product.id,
          customer_id: customerId,
          amount: product.price,
          currency: 'INR',
          gateway_used: 'razorpay',
          payment_status: 'pending',
          gateway_order_id: rzpOrder.id,
          fb_browser_id: fbp || null,
          fb_click_id: fbc || null,
          user_ip: userIp,
          user_agent: userAgent,
          ga_client_id: ga_client_id || null,
        });

        return setSessionCookie(NextResponse.json({
          gateway: 'razorpay',
          orderId,
          razorpayOrderId: rzpOrder.id,
          razorpayKeyId: gatewayConfig.api_key,
          amount: product.price * 100,
          currency: 'INR',
          productName: product.name,
          customerName,
          customerEmail,
          customerPhone,
        }));
      }

      case 'payu': {
        const txnId = `TXN_${Date.now()}_${orderId.slice(0, 8)}`;
        const formData = createPayUFormData({
          amount: product.price,
          productInfo: product.name,
          firstName: customerName,
          email: customerEmail,
          transactionId: txnId,
          phone: customerPhone,
          successUrl: `${appUrl}/api/webhooks/payu?type=success`,
          failureUrl: `${appUrl}/api/webhooks/payu?type=failure`,
          merchantKey: gatewayConfig.api_key || '',
          merchantSalt: gatewayConfig.api_secret || '',
          mode: mode as 'test' | 'live',
        });

        // Create pending order
        await supabase.from('orders').insert({
          id: orderId,
          product_id: product.id,
          customer_id: customerId,
          amount: product.price,
          currency: 'INR',
          gateway_used: 'payu',
          payment_status: 'pending',
          gateway_order_id: txnId,
          fb_browser_id: fbp || null,
          fb_click_id: fbc || null,
          user_ip: userIp,
          user_agent: userAgent,
          ga_client_id: ga_client_id || null,
        });

        return setSessionCookie(NextResponse.json({
          gateway: 'payu',
          orderId,
          formData,
        }));
      }

      case 'paypal': {
        return NextResponse.json({ error: 'PayPal is not supported for INR products at this time.' }, { status: 400 });
      }

      case 'cashfree': {
        const cfOrder = await createCashfreeOrder({
          orderId,
          orderAmount: product.price,
          orderCurrency: 'INR',
          customerDetails: {
            customerId,
            customerName,
            customerEmail,
            customerPhone: customerPhone || '9999999999', // Cashfree requires a phone number
          },
          returnUrl: `${appUrl}/api/webhooks/cashfree?order_id=${orderId}`,
          appId: gatewayConfig.api_key || '',
          secretKey: gatewayConfig.api_secret || '',
          mode,
        });

        // Create pending order
        await supabase.from('orders').insert({
          id: orderId,
          product_id: product.id,
          customer_id: customerId,
          amount: product.price,
          currency: 'INR',
          gateway_used: 'cashfree',
          payment_status: 'pending',
          gateway_order_id: cfOrder.orderId,
          fb_browser_id: fbp || null,
          fb_click_id: fbc || null,
          user_ip: userIp,
          user_agent: userAgent,
          ga_client_id: ga_client_id || null,
        });

        return setSessionCookie(NextResponse.json({
          gateway: 'cashfree',
          orderId,
          paymentSessionId: cfOrder.paymentSessionId,
          mode,
        }));
      }

      default:
        return NextResponse.json({ error: 'Invalid gateway provider' }, { status: 400 });
    }
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
