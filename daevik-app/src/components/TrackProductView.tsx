'use client';

import { useEffect, useRef } from 'react';
import { trackFbEvent } from '@/lib/fb-client';
import { trackGoogleViewItem } from '@/lib/google-client';

interface TrackProductViewProps {
  productId: string;
  productName: string;
  price: number;
  currency?: string;
}

export default function TrackProductView({
  productId,
  productName,
  price,
  currency = 'INR',
}: TrackProductViewProps) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;

    // 1. Meta / Facebook Pixel ViewContent
    trackFbEvent('ViewContent', {
      content_name: productName,
      content_ids: [productId],
      content_type: 'product',
      value: price,
      currency,
    });

    // 2. Google Ads & GA4 view_item event
    trackGoogleViewItem({
      id: productId,
      name: productName,
      price,
      currency,
    });
  }, [productId, productName, price, currency]);

  return null;
}
