import { NextRequest, NextResponse } from 'next/server';
import { trackPageView, trackViewContent, trackInitiateCheckout, trackPurchase } from '@/lib/facebook-capi';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, url, productName, productId, value, currency, externalId, userEmail, userPhone, userFirstName, userLastName, fbp, fbc } = body;

    // Get client IP and user agent
    const rawIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userIp = rawIp ? rawIp.split(',')[0].trim() : undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // 1. Resolve fbc (Facebook Click ID)
    let finalFbc = fbc || request.cookies.get('_fbc')?.value;
    if (!finalFbc) {
      let fbclid: string | null = null;
      if (url) {
        try {
          const parsedUrl = new URL(url, 'https://daevik.in');
          fbclid = parsedUrl.searchParams.get('fbclid');
        } catch {}
      }
      if (!fbclid) {
        const referer = request.headers.get('referer');
        if (referer) {
          try {
            const parsedRef = new URL(referer);
            fbclid = parsedRef.searchParams.get('fbclid');
          } catch {}
        }
      }
      if (!fbclid) {
        fbclid = request.nextUrl.searchParams.get('fbclid');
      }
      if (fbclid) {
        finalFbc = `fb.1.${Date.now()}.${fbclid}`;
      }
    } else if (!finalFbc.startsWith('fb.')) {
      finalFbc = `fb.1.${Date.now()}.${finalFbc}`;
    }

    // 2. Resolve fbp (Facebook Browser ID)
    let finalFbp = fbp || request.cookies.get('_fbp')?.value;
    if (finalFbp && !finalFbp.startsWith('fb.')) {
      finalFbp = `fb.1.${Date.now()}.${finalFbp}`;
    }

    const eventId = body.eventId || uuidv4();

    if (event === 'PageView') {
      await trackPageView({
        url,
        eventId,
        userIp,
        userAgent,
        fbp: finalFbp,
        fbc: finalFbc,
      });
    } else if (event === 'ViewContent') {
      await trackViewContent({
        url,
        eventId,
        productName: productName || 'Unknown Product',
        productId: productId || 'unknown',
        value: value || 0,
        currency: currency || 'INR',
        userIp,
        userAgent,
        fbp: finalFbp,
        fbc: finalFbc,
      });
    } else if (event === 'InitiateCheckout') {
      await trackInitiateCheckout({
        url,
        eventId,
        productName: productName || 'Unknown Product',
        productId: productId || 'unknown',
        value: value || 0,
        currency: currency || 'INR',
        externalId,
        userEmail,
        userPhone,
        userFirstName,
        userLastName,
        userIp,
        userAgent,
        fbp: finalFbp,
        fbc: finalFbc,
      });
    } else if (event === 'Purchase') {
      // Server-side Purchase via CAPI — used as a fallback if the webhook-triggered
      // CAPI call in order-processing.ts fails, or for direct client-triggered CAPI.
      await trackPurchase({
        url,
        eventId,
        productName: productName || 'Unknown Product',
        productId: productId || 'unknown',
        value: value || 0,
        currency: currency || 'INR',
        externalId,
        userEmail: userEmail || '',
        userPhone,
        userFirstName,
        userLastName,
        userIp,
        userAgent,
        fbp: finalFbp,
        fbc: finalFbc,
      });
    } else {
      return NextResponse.json({ error: 'Unsupported event type' }, { status: 400 });
    }
    const response = NextResponse.json({ success: true, eventId, fbc: finalFbc, fbp: finalFbp });

    if (finalFbc && !request.cookies.get('_fbc')) {
      response.cookies.set('_fbc', finalFbc, {
        maxAge: 90 * 24 * 60 * 60, // 90 days
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    if (finalFbp && !request.cookies.get('_fbp')) {
      response.cookies.set('_fbp', finalFbp, {
        maxAge: 90 * 24 * 60 * 60, // 90 days
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
    }

    return response;
  } catch (error) {
    console.error('CAPI Tracking API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
