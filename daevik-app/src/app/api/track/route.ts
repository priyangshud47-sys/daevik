// Funnel event tracking API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { logFunnelEvent } from '@/lib/funnel';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, sessionId, eventType } = body;

    if (!productId || !sessionId || !eventType) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, sessionId, eventType' },
        { status: 400 }
      );
    }

    const validTypes = ['page_view', 'checkout_start', 'purchase', 'abandoned'];
    if (!validTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid eventType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    await logFunnelEvent({
      productId,
      sessionId,
      eventType,
      metadata: body.metadata || {},
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
