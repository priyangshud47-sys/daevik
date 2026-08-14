// Email Send API (internal use by webhooks)
import { NextRequest, NextResponse } from 'next/server';
import { sendProductDeliveryEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerName, customerEmail, productName, productPrice, downloadLink, orderId } = body;

    if (!customerName || !customerEmail || !productName || !orderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const success = await sendProductDeliveryEmail({
      customerName,
      customerEmail,
      productName,
      productPrice: productPrice || '',
      downloadLink: downloadLink || '',
      orderId,
    });

    return NextResponse.json({ success });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
