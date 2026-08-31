'use client';

// Declare Google Tag globals for TypeScript
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
    _googleTrackingConfig?: {
      google_ads_id?: string | null;
      purchase_conversion_label?: string | null;
      begin_checkout_conversion_label?: string | null;
      view_item_conversion_label?: string | null;
      ga4_id?: string | null;
      enhanced_conversions?: boolean;
      active?: boolean;
    };
  }
}

/**
 * Safely calls window.gtag with retry logic if the script hasn't loaded yet.
 */
export function trackGoogleEvent(
  eventName: string,
  params?: Record<string, unknown>
): void {
  if (typeof window === 'undefined') return;

  let attempts = 0;
  const tryTrack = () => {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, params);
    } else {
      attempts++;
      if (attempts < 40) {
        setTimeout(tryTrack, 500);
      } else {
        console.warn(`[GoogleTag] Failed to fire event "${eventName}": gtag.js not loaded`);
      }
    }
  };

  tryTrack();
}

/**
 * Sets user data for Google Ads Enhanced Conversions.
 * Google will match hashed user identifiers with logged-in Google accounts for higher attribution accuracy.
 */
export function setGoogleUserData(userData: {
  email?: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
  country?: string;
}): void {
  if (typeof window === 'undefined') return;

  const sanitized: Record<string, unknown> = {};

  if (userData.email && userData.email.trim()) {
    sanitized.email = userData.email.trim().toLowerCase();
  }

  if (userData.phone_number && userData.phone_number.trim()) {
    // E.164 phone normalization if possible
    let phone = userData.phone_number.replace(/[^\d+]/g, '');
    if (!phone.startsWith('+') && phone.length === 10) {
      phone = `+91${phone}`; // Default Indian phone prefix if 10 digits
    }
    sanitized.phone_number = phone;
  }

  if (userData.first_name || userData.last_name || userData.country) {
    sanitized.address = {
      first_name: userData.first_name?.trim() || undefined,
      last_name: userData.last_name?.trim() || undefined,
      country: userData.country?.trim() || 'IN',
    };
  }

  if (Object.keys(sanitized).length === 0) return;

  if (typeof window.gtag === 'function') {
    window.gtag('set', 'user_data', sanitized);
  } else {
    // Queue dataLayer call
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(['set', 'user_data', sanitized]);
  }
}

/**
 * Fires a page_view event on SPA route changes
 */
export function trackGooglePageView(url?: string, title?: string): void {
  if (typeof window === 'undefined') return;

  const pagePath = url || window.location.pathname + window.location.search;
  const pageTitle = title || document.title;

  trackGoogleEvent('page_view', {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: pageTitle,
  });
}

/**
 * Tracks product view (view_item) for GA4 and Google Ads dynamic remarketing
 */
export function trackGoogleViewItem(product: {
  id: string;
  name: string;
  price: number;
  currency?: string;
}): void {
  if (typeof window === 'undefined') return;

  const currency = product.currency || 'INR';

  trackGoogleEvent('view_item', {
    currency,
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: 1,
      },
    ],
  });

  // Also check if a Google Ads view_item conversion label is configured
  fetchGoogleConfig().then(config => {
    if (config?.google_ads_id && config?.view_item_conversion_label) {
      trackGoogleEvent('conversion', {
        send_to: `${config.google_ads_id}/${config.view_item_conversion_label}`,
        value: product.price,
        currency,
      });
    }
  }).catch(() => {});
}

/**
 * Tracks checkout initiation (begin_checkout)
 */
export function trackGoogleBeginCheckout(product: {
  id: string;
  name: string;
  price: number;
  currency?: string;
}): void {
  if (typeof window === 'undefined') return;

  const currency = product.currency || 'INR';

  trackGoogleEvent('begin_checkout', {
    currency,
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: 1,
      },
    ],
  });

  fetchGoogleConfig().then(config => {
    if (config?.google_ads_id && config?.begin_checkout_conversion_label) {
      trackGoogleEvent('conversion', {
        send_to: `${config.google_ads_id}/${config.begin_checkout_conversion_label}`,
        value: product.price,
        currency,
      });
    }
  }).catch(() => {});
}

/**
 * Tracks Purchase conversion for Google Ads Conversion Campaigns & GA4 Ecommerce.
 * Automatically de-duplicates by order ID to prevent multiple conversion counts on refresh.
 */
export async function trackGooglePurchase(props: {
  orderId: string;
  value: number;
  currency?: string;
  productName?: string;
  productId?: string;
  customer?: {
    email?: string;
    phone?: string;
    name?: string;
  };
}): Promise<void> {
  if (typeof window === 'undefined') return;

  const dedupeKey = `daevik_g_purchase_${props.orderId}`;
  if (sessionStorage.getItem(dedupeKey)) {
    console.log(`[GoogleTag] Purchase ${props.orderId} already tracked on this session, skipping duplicate.`);
    return;
  }
  sessionStorage.setItem(dedupeKey, '1');

  const currency = props.currency || 'INR';

  // 1. Enhanced Conversions: Set user data first
  if (props.customer) {
    const nameParts = (props.customer.name || '').trim().split(' ');
    setGoogleUserData({
      email: props.customer.email,
      phone_number: props.customer.phone,
      first_name: nameParts[0] || undefined,
      last_name: nameParts.slice(1).join(' ') || undefined,
      country: 'IN',
    });
  }

  // 2. Fire GA4 standard ecommerce purchase event
  trackGoogleEvent('purchase', {
    transaction_id: props.orderId,
    value: props.value,
    currency,
    items: [
      {
        item_id: props.productId || 'product',
        item_name: props.productName || 'Daevik Product',
        price: props.value,
        quantity: 1,
      },
    ],
  });

  // 3. Fire Google Ads conversion event with send_to: "AW-CONVERSION_ID/CONVERSION_LABEL"
  const config = await fetchGoogleConfig();
  if (config?.google_ads_id && config?.purchase_conversion_label) {
    const adsId = config.google_ads_id.startsWith('AW-')
      ? config.google_ads_id
      : `AW-${config.google_ads_id}`;

    trackGoogleEvent('conversion', {
      send_to: `${adsId}/${config.purchase_conversion_label}`,
      value: props.value,
      currency,
      transaction_id: props.orderId,
    });
    console.log(`[GoogleTag] Fired Google Ads Conversion to ${adsId}/${config.purchase_conversion_label}`);
  }
}

/**
 * Internal cache for Google Tracking configuration on the client
 */
let cachedConfig: Window['_googleTrackingConfig'] | null = null;

async function fetchGoogleConfig() {
  if (typeof window === 'undefined') return null;
  if (window._googleTrackingConfig) return window._googleTrackingConfig;
  if (cachedConfig) return cachedConfig;

  try {
    const res = await fetch('/api/settings/google');
    if (res.ok) {
      const data = await res.json();
      cachedConfig = data;
      window._googleTrackingConfig = data;
      return data;
    }
  } catch (err) {
    console.warn('[GoogleTag] Could not fetch Google settings:', err);
  }
  return null;
}
