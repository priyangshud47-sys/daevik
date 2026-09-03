import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

const FB_PIXEL_ID = process.env.FB_PIXEL_ID || '';
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || '';
const FB_TEST_EVENT_CODE = process.env.FB_TEST_EVENT_CODE || '';
const FB_API_VERSION = 'v18.0';


type EventName = 'PageView' | 'ViewContent' | 'InitiateCheckout' | 'Purchase' | 'AddToCart';

interface CAPIEventParams {
  eventName: EventName;
  eventId: string; // For deduplication with client-side Pixel
  sourceUrl: string;
  externalId?: string;  // Stable user identifier (session/customer ID) — hashed before sending
  userEmail?: string;
  userPhone?: string;
  userFirstName?: string; // Improves audience match rate significantly
  userLastName?: string;  // Improves audience match rate significantly
  userCountry?: string;   // Two-letter ISO code, e.g. 'in' (hashed per Meta spec)
  userIp?: string;
  userAgent?: string;
  fbp?: string; // Facebook browser ID cookie
  fbc?: string; // Facebook click ID cookie
  customData?: {
    value?: number;
    currency?: string;
    content_name?: string;
    content_ids?: string[];
    content_type?: string;
    num_items?: number;
    contents?: Array<{
      id: string;
      quantity: number;
      item_price?: number;
    }>;
  };
  fbPixelId?: string | null;
  fbAccessToken?: string | null;
}

// Hash PII as required by Facebook CAPI spec
function hashPII(value: string): string {
  return crypto
    .createHash('sha256')
    .update(value.trim().toLowerCase())
    .digest('hex');
}

export async function sendCAPIEvent(params: CAPIEventParams): Promise<boolean> {
  let pixelId = params.fbPixelId || FB_PIXEL_ID;
  let accessToken = params.fbAccessToken || FB_ACCESS_TOKEN;
  let testEventCode = FB_TEST_EVENT_CODE;

  // If not provided in params or env, try to fetch from database.
  // Use .limit(1) instead of .single() — .single() errors when multiple active
  // rows exist (which is the case when multiple pixels are configured).
  if (!pixelId || !accessToken) {
    try {
      // Prefer a config whose pixel_id matches the one passed in params (per-product pixel).
      // Fall back to the most-recently-updated active config.
      const { data: configs } = await supabase
        .from('fb_capi_config')
        .select('*')
        .eq('active', true)
        .order('updated_at', { ascending: false });

      const config = configs?.find((c) => c.pixel_id === params.fbPixelId) ?? configs?.[0];

      if (config && config.pixel_id && config.access_token) {
        pixelId = config.pixel_id;
        accessToken = config.access_token;
        if (config.test_event_code) {
          testEventCode = config.test_event_code;
        }
      }
    } catch (e) {
      console.error('Failed to fetch FB CAPI config from DB', e);
    }
  }

  if (!pixelId || !accessToken) {
    console.warn('Facebook CAPI not configured — skipping event:', params.eventName);
    return false;
  }

  const apiUrl = `https://graph.facebook.com/${FB_API_VERSION}/${pixelId}/events`;

  const userData: Record<string, string | string[]> = {};

  if (params.externalId) {
    userData.external_id = [hashPII(params.externalId)];
  }
  if (params.userEmail) {
    userData.em = [hashPII(params.userEmail)];
  }
  if (params.userPhone) {
    // Strip non-numeric chars and leading zeros
    let cleanPhone = params.userPhone.replace(/[^\d]/g, '').replace(/^0+/, '');
    // If standard 10-digit Indian mobile number, add 91 country code for Meta E.164 compliance
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    if (cleanPhone) {
      userData.ph = [hashPII(cleanPhone)];
    }
  }
  if (params.userFirstName) {
    userData.fn = [hashPII(params.userFirstName)];
  }
  if (params.userLastName) {
    userData.ln = [hashPII(params.userLastName)];
  }
  if (params.userIp) {
    userData.client_ip_address = params.userIp;
  }
  if (params.userAgent) {
    userData.client_user_agent = params.userAgent;
  }

  // Country: 2-letter ISO code hashed per Meta CAPI specification
  const countryCode = (params.userCountry || 'in').trim().toLowerCase();
  if (countryCode.length === 2) {
    userData.country = [hashPII(countryCode)];
  }
  // Normalize and assign fbp (Facebook browser ID)
  if (params.fbp) {
    const cleanFbp = params.fbp.trim();
    if (cleanFbp) {
      userData.fbp = cleanFbp.startsWith('fb.') ? cleanFbp : `fb.1.${Date.now()}.${cleanFbp}`;
    }
  }

  // Normalize and assign fbc (Facebook click ID)
  if (params.fbc) {
    const cleanFbc = params.fbc.trim();
    if (cleanFbc) {
      userData.fbc = cleanFbc.startsWith('fb.') ? cleanFbc : `fb.1.${Date.now()}.${cleanFbc}`;
    }
  }

  // Fallback: If fbc is missing, automatically extract fbclid from sourceUrl query string
  if (!userData.fbc && params.sourceUrl) {
    try {
      const parsedUrl = new URL(params.sourceUrl);
      const fbclid = parsedUrl.searchParams.get('fbclid');
      if (fbclid) {
        userData.fbc = `fb.1.${Date.now()}.${fbclid}`;
      }
    } catch {}
  }

  const eventData: Record<string, unknown> = {
    event_name: params.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    event_source_url: params.sourceUrl,
    action_source: 'website',
    user_data: userData,
  };

  if (params.customData) {
    eventData.custom_data = params.customData;
  }

  const payload: Record<string, unknown> = {
    data: [eventData],
    access_token: accessToken,
  };

  if (testEventCode) {
    payload.test_event_code = testEventCode;
  }

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Facebook CAPI error:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Facebook CAPI request failed:', err);
    return false;
  }
}

// Convenience methods for common events
export async function trackPageView(params: {
  url: string;
  eventId: string;
  userIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  fbPixelId?: string | null;
  fbAccessToken?: string | null;
}) {
  return sendCAPIEvent({
    eventName: 'PageView',
    eventId: params.eventId,
    sourceUrl: params.url,
    userIp: params.userIp,
    userAgent: params.userAgent,
    fbp: params.fbp,
    fbc: params.fbc,
    fbPixelId: params.fbPixelId,
    fbAccessToken: params.fbAccessToken,
  });
}

export async function trackInitiateCheckout(params: {
  url: string;
  eventId: string;
  productName: string;
  productId: string;
  value: number;
  currency: string;
  externalId?: string;
  userEmail?: string;
  userPhone?: string;
  userFirstName?: string;
  userLastName?: string;
  userIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  fbPixelId?: string | null;
  fbAccessToken?: string | null;
}) {
  return sendCAPIEvent({
    eventName: 'InitiateCheckout',
    eventId: params.eventId,
    sourceUrl: params.url,
    externalId: params.externalId,
    userEmail: params.userEmail,
    userPhone: params.userPhone,
    userFirstName: params.userFirstName,
    userLastName: params.userLastName,
    userIp: params.userIp,
    userAgent: params.userAgent,
    fbp: params.fbp,
    fbc: params.fbc,
    fbPixelId: params.fbPixelId,
    fbAccessToken: params.fbAccessToken,
    customData: {
      value: params.value,
      currency: params.currency,
      content_name: params.productName,
      content_ids: [params.productId],
      content_type: 'product',
      num_items: 1,
      contents: [
        {
          id: params.productId,
          quantity: 1,
          item_price: params.value,
        },
      ],
    },
  });
}

export async function trackViewContent(params: {
  url: string;
  eventId?: string;
  productName: string;
  productId: string;
  value: number;
  currency: string;
  userIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  fbPixelId?: string | null;
  fbAccessToken?: string | null;
}) {
  return sendCAPIEvent({
    eventName: 'ViewContent',
    eventId: params.eventId || `vc_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    sourceUrl: params.url,
    userIp: params.userIp,
    userAgent: params.userAgent,
    fbp: params.fbp,
    fbc: params.fbc,
    fbPixelId: params.fbPixelId,
    fbAccessToken: params.fbAccessToken,
    customData: {
      value: params.value,
      currency: params.currency,
      content_name: params.productName,
      content_ids: [params.productId],
      content_type: 'product',
      num_items: 1,
      contents: [
        {
          id: params.productId,
          quantity: 1,
          item_price: params.value,
        },
      ],
    },
  });
}

export async function trackPurchase(params: {
  url: string;
  eventId: string;
  productName: string;
  productId: string;
  value: number;
  currency: string;
  externalId?: string;
  userEmail: string;
  userPhone?: string;
  userFirstName?: string;
  userLastName?: string;
  userCountry?: string;
  userIp?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
  fbPixelId?: string | null;
  fbAccessToken?: string | null;
}) {
  return sendCAPIEvent({
    eventName: 'Purchase',
    eventId: params.eventId,
    sourceUrl: params.url,
    externalId: params.externalId,
    userEmail: params.userEmail,
    userPhone: params.userPhone,
    userFirstName: params.userFirstName,
    userLastName: params.userLastName,
    userCountry: params.userCountry,
    userIp: params.userIp,
    userAgent: params.userAgent,
    fbp: params.fbp,
    fbc: params.fbc,
    fbPixelId: params.fbPixelId,
    fbAccessToken: params.fbAccessToken,
    customData: {
      value: params.value,
      currency: params.currency,
      content_name: params.productName,
      content_ids: [params.productId],
      content_type: 'product',
      num_items: 1,
      contents: [
        {
          id: params.productId,
          quantity: 1,
          item_price: params.value,
        },
      ],
    },
  });
}
