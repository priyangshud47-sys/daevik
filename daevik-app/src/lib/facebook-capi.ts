import crypto from 'crypto';
import { supabase } from '@/lib/supabase';

const FB_PIXEL_ID = process.env.FB_PIXEL_ID || '';
const FB_ACCESS_TOKEN = process.env.FB_ACCESS_TOKEN || '';
const FB_TEST_EVENT_CODE = process.env.FB_TEST_EVENT_CODE || '';
const FB_API_VERSION = 'v18.0';
const FB_API_URL = `https://graph.facebook.com/${FB_API_VERSION}`;

type EventName = 'PageView' | 'InitiateCheckout' | 'Purchase' | 'AddToCart';

interface CAPIEventParams {
  eventName: EventName;
  eventId: string; // For deduplication with client-side Pixel
  sourceUrl: string;
  userEmail?: string;
  userPhone?: string;
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

  // If not provided in params or env, try to fetch from database
  if (!pixelId || !accessToken) {
    try {
      const { data: config } = await supabase
        .from('fb_capi_config')
        .select('*')
        .eq('active', true)
        .single();
        
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

  if (params.userEmail) {
    userData.em = [hashPII(params.userEmail)];
  }
  if (params.userPhone) {
    userData.ph = [hashPII(params.userPhone)];
  }
  if (params.userIp) {
    userData.client_ip_address = params.userIp;
  }
  if (params.userAgent) {
    userData.client_user_agent = params.userAgent;
  }
  if (params.fbp) {
    userData.fbp = params.fbp;
  }
  if (params.fbc) {
    userData.fbc = params.fbc;
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
  userEmail?: string;
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
    userEmail: params.userEmail,
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
  userEmail: string;
  userIp?: string;
  userAgent?: string;
  fbPixelId?: string | null;
  fbAccessToken?: string | null;
}) {
  return sendCAPIEvent({
    eventName: 'Purchase',
    eventId: params.eventId,
    sourceUrl: params.url,
    userEmail: params.userEmail,
    userIp: params.userIp,
    userAgent: params.userAgent,
    fbPixelId: params.fbPixelId,
    fbAccessToken: params.fbAccessToken,
    customData: {
      value: params.value,
      currency: params.currency,
      content_name: params.productName,
      content_ids: [params.productId],
      content_type: 'product',
    },
  });
}
