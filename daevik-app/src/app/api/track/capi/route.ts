import { NextRequest, NextResponse } from 'next/server';
import { trackPageView, trackInitiateCheckout } from '@/lib/facebook-capi';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, url, productName, productId, value, currency, externalId, userEmail, userPhone, userFirstName, userLastName, fbp, fbc } = body;

    // Get client IP and user agent
    const userIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
    const userAgent = request.headers.get('user-agent') || undefined;

    // Get Facebook cookies if they aren't explicitly passed in body
    const finalFbp = fbp || request.cookies.get('_fbp')?.value;
    const finalFbc = fbc || request.cookies.get('_fbc')?.value;

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
    } else {
      return NextResponse.json({ error: 'Unsupported event type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('CAPI Tracking API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
