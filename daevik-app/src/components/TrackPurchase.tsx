'use client';

import { useEffect } from 'react';

interface TrackPurchaseProps {
  value: number;
  currency: string;
  productName: string;
  productId: string;
}

export default function TrackPurchase({ value, currency, productName, productId }: TrackPurchaseProps) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // If fbq is not yet defined by the base script, we can stub it
      if (!window.fbq) {
        window.fbq = function() {
          if (window.fbq.callMethod) {
            window.fbq.callMethod.apply(window.fbq, arguments);
          } else {
            window.fbq.queue.push(arguments);
          }
        };
        window.fbq.queue = window.fbq.queue || [];
      }
      
      window.fbq('track', 'Purchase', {
        value,
        currency,
        content_name: productName,
        content_ids: [productId],
        content_type: 'product',
      });
    }
  }, [value, currency, productName, productId]);

  return null;
}
