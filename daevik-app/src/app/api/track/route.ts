// Funnel event tracking API endpoint
import { NextRequest, NextResponse } from 'next/server';
import { logFunnelEvent } from '@/lib/funnel';

/*
-- MIGRATION REQUIRED
ALTER TABLE funnel_events 
  ADD COLUMN utm_source TEXT,
  ADD COLUMN utm_medium TEXT,
  ADD COLUMN utm_campaign TEXT;
*/

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, sessionId, eventType, utm_source, utm_medium, utm_campaign } = body;

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
      utm_source,
      utm_medium,
      utm_campaign,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track event error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
