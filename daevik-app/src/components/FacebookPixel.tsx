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
  const lastTrackedRoute = useRef<string | null>(null);

  useEffect(() => {
    if (!pixelId) return;

    const currentRoute = pathname + searchParams.toString();

    // Skip first render — the server-side <script> in layout.tsx already fires PageView
    if (lastTrackedRoute.current === null) {
      lastTrackedRoute.current = currentRoute;
      return;
    }

    // Skip duplicate fires for the same route
    if (lastTrackedRoute.current === currentRoute) return;
    lastTrackedRoute.current = currentRoute;

    // Wait for fbq to be ready, then fire PageView for SPA navigation
    const tryTrack = () => {
      if (typeof window !== 'undefined' && window.fbq && typeof window.fbq === 'function') {
        window.fbq('track', 'PageView');
      } else {
        setTimeout(tryTrack, 300);
      }
    };
    tryTrack();
  }, [pathname, searchParams, pixelId]);

  return null;
}

