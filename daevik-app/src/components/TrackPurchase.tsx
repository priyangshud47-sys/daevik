'use client';

import { useEffect } from 'react';
import { trackFbEvent } from '@/lib/fb-client';

interface TrackPurchaseProps {
  value: number;
  currency: string;
  productName: string;
  productId: string;
}

export default function TrackPurchase({ value, currency, productName, productId }: TrackPurchaseProps) {
  useEffect(() => {
    trackFbEvent('Purchase', {
      value,
      currency,
      content_name: productName,
      content_ids: [productId],
      content_type: 'product',
    });
  }, [value, currency, productName, productId]);

  return null;
}
