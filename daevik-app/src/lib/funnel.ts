// Funnel Event Tracking
import { supabase } from '@/lib/supabase';
import type { FunnelEventInsert } from '@/lib/database.types';

export type FunnelEventType = 'page_view' | 'checkout_start' | 'purchase' | 'abandoned';

export async function logFunnelEvent(params: {
  productId: string;
  sessionId: string;
  eventType: FunnelEventType;
  metadata?: Record<string, unknown>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
}): Promise<void> {
  const event: FunnelEventInsert & { utm_source?: string; utm_medium?: string; utm_campaign?: string; } = {
    product_id: params.productId,
    session_id: params.sessionId,
    event_type: params.eventType,
    metadata: (params.metadata || {}) as Record<string, string>,
    utm_source: params.utm_source,
    utm_medium: params.utm_medium,
    utm_campaign: params.utm_campaign,
  };

  const { error } = await supabase.from('funnel_events').insert(event as any);

  if (error) {
    console.error('Failed to log funnel event:', error);
  }
}

// Detect abandoned checkouts: sessions with checkout_start but no purchase within timeout
export async function detectAbandonedCarts(timeoutMinutes = 30): Promise<number> {
  const cutoff = new Date(Date.now() - timeoutMinutes * 60 * 1000).toISOString();

  // Find checkout_start events older than timeout that have no matching purchase
  const { data: abandonedSessions, error } = await supabase
    .rpc('detect_abandoned_carts', { cutoff_time: cutoff });

  if (error) {
    // If RPC doesn't exist, use a manual query approach
    const { data: checkoutStarts } = await supabase
      .from('funnel_events')
      .select('session_id, product_id')
      .eq('event_type', 'checkout_start')
      .lt('created_at', cutoff);

    if (!checkoutStarts || checkoutStarts.length === 0) return 0;

    let abandonedCount = 0;
    for (const session of checkoutStarts) {
      const { data: purchase } = await supabase
        .from('funnel_events')
        .select('id')
        .eq('session_id', session.session_id)
        .eq('event_type', 'purchase')
        .limit(1);

      const { data: alreadyMarked } = await supabase
        .from('funnel_events')
        .select('id')
        .eq('session_id', session.session_id)
        .eq('event_type', 'abandoned')
        .limit(1);

      if ((!purchase || purchase.length === 0) && (!alreadyMarked || alreadyMarked.length === 0)) {
        await logFunnelEvent({
          productId: session.product_id || '',
          sessionId: session.session_id,
          eventType: 'abandoned',
        });
        abandonedCount++;
      }
    }

    return abandonedCount;
  }

  return abandonedSessions?.length || 0;
}

export async function getFunnelStats(
  productId?: string,
  startDate?: string,
  endDate?: string
): Promise<{
  page_views: number;
  checkout_starts: number;
  purchases: number;
  abandoned: number;
  traffic_sources: { source: string, count: number }[];
}> {
  let query = supabase.from('funnel_events').select('event_type, utm_source, utm_medium, utm_campaign');

  if (productId) {
    query = query.eq('product_id', productId);
  }

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lt('created_at', endDate);
  }

  const { data, error } = await query;

  if (error || !data) {
    return { page_views: 0, checkout_starts: 0, purchases: 0, abandoned: 0, traffic_sources: [] };
  }
  
  const sourcesMap = new Map<string, number>();
  data.forEach(e => {
    if (e.event_type === 'page_view') {
      const source = e.utm_source || 'Direct';
      sourcesMap.set(source, (sourcesMap.get(source) || 0) + 1);
    }
  });
  
  const traffic_sources = Array.from(sourcesMap.entries())
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);

  return {
    page_views: data.filter(e => e.event_type === 'page_view').length,
    checkout_starts: data.filter(e => e.event_type === 'checkout_start').length,
    purchases: data.filter(e => e.event_type === 'purchase').length,
    abandoned: data.filter(e => e.event_type === 'abandoned').length,
    traffic_sources,
  };
}
