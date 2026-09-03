/**
 * Google Analytics 4 — Measurement Protocol (Server-Side)
 *
 * Fires GA4 events directly from your server (no browser required).
 * Used in webhooks so conversions are tracked even if the user never
 * visits the thank-you page.
 *
 * Requirements:
 *   NEXT_PUBLIC_GA4_ID    — e.g. G-XXXXXXXXXX
 *   GA4_MP_API_SECRET     — GA4 Admin → Data Streams → Your Stream → MP API secrets → Create
 *
 * GA4 deduplicates server-side vs client-side purchase events by transaction_id,
 * so no double-counting occurs when the user also visits the thank-you page.
 *
 * Docs: https://developers.google.com/analytics/devguides/collection/protocol/ga4
 */

const GA4_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_ID || process.env.GA4_ID || '';
const GA4_MP_API_SECRET = process.env.GA4_MP_API_SECRET || '';
const GA4_MP_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

export interface GA4MPPurchaseParams {
  /** GA4 client_id from the _ga cookie (raw or already-parsed) */
  clientId: string;
  /** Unique order ID — GA4 uses transaction_id to deduplicate with client-side hits */
  orderId: string;
  value: number;
  currency?: string;
  productName?: string;
  productId?: string;
  /** Optional GA4 session_id from _ga_XXXX cookie for better session attribution */
  sessionId?: string;
}

/**
 * Extracts the numeric client_id from the raw _ga cookie value.
 * Raw format: "GA1.1.1234567890.1234567890" → "1234567890.1234567890"
 */
export function parseGaClientId(rawGaCookie: string): string {
  if (!rawGaCookie) return '';
  const parts = rawGaCookie.split('.');
  if (parts.length >= 4) {
    return `${parts[2]}.${parts[3]}`;
  }
  return rawGaCookie; // already in numeric form
}

/**
 * Sends a server-side purchase event to GA4 via Measurement Protocol.
 * Returns true on success, false if not configured or on error.
 * Gracefully no-ops if env vars are missing — safe to call unconditionally.
 */
export async function trackGooglePurchaseMP(params: GA4MPPurchaseParams): Promise<boolean> {
  if (!GA4_MEASUREMENT_ID || !GA4_MP_API_SECRET) {
    console.warn(
      '[GA4-MP] Skipping server-side purchase — NEXT_PUBLIC_GA4_ID or GA4_MP_API_SECRET not set.\n' +
      '         Get your API secret: GA4 → Admin → Data Streams → Your Stream → Measurement Protocol API secrets'
    );
    return false;
  }

  if (!params.clientId) {
    console.warn(`[GA4-MP] Order ${params.orderId}: no ga_client_id (user may have analytics blocked) — skipping.`);
    return false;
  }

  const currency = params.currency || 'INR';
  const clientId = parseGaClientId(params.clientId);

  const eventParams: Record<string, unknown> = {
    transaction_id: params.orderId,
    value: params.value,
    currency,
    items: [
      {
        item_id: params.productId || 'product',
        item_name: params.productName || 'Daevik Product',
        price: params.value,
        quantity: 1,
      },
    ],
  };

  if (params.sessionId) {
    eventParams.session_id = params.sessionId;
  }

  const body = {
    client_id: clientId,
    events: [{ name: 'purchase', params: eventParams }],
  };

  const url = `${GA4_MP_ENDPOINT}?measurement_id=${encodeURIComponent(GA4_MEASUREMENT_ID)}&api_secret=${encodeURIComponent(GA4_MP_API_SECRET)}`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    // GA4 MP returns 204 No Content on success
    if (res.status === 204 || res.ok) {
      console.log(`[GA4-MP] Server-side purchase fired for order ${params.orderId} (client_id: ${clientId})`);
      return true;
    }

    const text = await res.text();
    console.error(`[GA4-MP] Unexpected ${res.status} for order ${params.orderId}:`, text);
    return false;
  } catch (err) {
    console.error(`[GA4-MP] Network error for order ${params.orderId}:`, err);
    return false;
  }
}
