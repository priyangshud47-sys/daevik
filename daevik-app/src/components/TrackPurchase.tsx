'use client';

import { useEffect, useRef } from 'react';
import { trackFbEvent } from '@/lib/fb-client';

interface TrackPurchaseProps {
  value: number;
  currency: string;
  productName: string;
  productId: string;
  eventId: string;
}

export default function TrackPurchase({ value, currency, productName, productId, eventId }: TrackPurchaseProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    
    trackFbEvent('Purchase', {
      value,
      currency,
      content_name: productName,
      content_ids: [productId],
      content_type: 'product',
    }, { eventID: eventId });
  }, [value, currency, productName, productId, eventId]);

  return null;
}
