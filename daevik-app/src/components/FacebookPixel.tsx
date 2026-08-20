'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

export default function FacebookPixel({ pixelId }: { pixelId: string | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasFiredInit = useRef(false);

  useEffect(() => {
    if (!pixelId) return;
    
    // We already fire a PageView in the layout head on initial load.
    // So we only want to fire it on subsequent route changes.
    if (!hasFiredInit.current) {
      hasFiredInit.current = true;
      return;
    }
    
    // Fire PageView on route changes.
    const handleRouteChange = () => {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'PageView');
      }
    };
    
    handleRouteChange();
  }, [pathname, searchParams, pixelId]);

  return null;
}
