'use client';

import { useEffect, useRef } from 'react';
import { trackFbEvent } from '@/lib/fb-client';
import { trackGooglePurchase } from '@/lib/google-client';

interface TrackPurchaseProps {
  value: number;
  currency: string;
  productName: string;
  productId: string;
  eventId: string;
  orderId?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
}

export default function TrackPurchase({
  value,
  currency,
  productName,
  productId,
  eventId,
  orderId,
  customerEmail,
  customerPhone,
  customerName,
}: TrackPurchaseProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    const actualOrderId = orderId || eventId.replace(/^purchase_/, '') || `order_${Date.now()}`;

    // 1. Meta / Facebook Pixel Purchase Event
    trackFbEvent('Purchase', {
      value,
      currency: currency || 'INR',
      content_name: productName,
      content_ids: [productId],
      content_type: 'product',
      num_items: 1,
      contents: [{ id: productId, quantity: 1, item_price: value }],
    }, { eventID: eventId });

    // 2. Google Ads Conversion & GA4 Purchase Tracking
    trackGooglePurchase({
      orderId: actualOrderId,
      value,
      currency: currency || 'INR',
      productName,
      productId,
      customer: {
        email: customerEmail,
        phone: customerPhone,
        name: customerName,
      },
    }).catch(err => {
      console.warn('[GoogleTag] Error tracking Google purchase:', err);
    });
  }, [value, currency, productName, productId, eventId, orderId, customerEmail, customerPhone, customerName]);

  return null;
}
