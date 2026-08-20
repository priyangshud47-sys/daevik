'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialized = useRef(false);
  const [pixelId, setPixelId] = useState<string | null>(null);

  // 1. Fetch Pixel ID from frontend
  useEffect(() => {
    fetch('/api/track/pixel')
      .then((res) => res.json())
      .then((data) => {
        if (data.pixelId) {
          setPixelId(data.pixelId);
        }
      })
      .catch((err) => console.error('Error fetching pixel', err));
  }, []);

  // 2. Inject Meta Pixel Script dynamically when pixelId is available
  useEffect(() => {
    if (!pixelId || initialized.current) return;
    initialized.current = true;

    // Standard Facebook Pixel Base Code
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    
    window.fbq('init', pixelId);
    window.fbq('track', 'PageView');
  }, [pixelId]);

  // 3. Track Route Changes
  useEffect(() => {
    if (!pixelId || !initialized.current) return;
    
    // Facebook Pixel helper detects PageView on every route
    if (typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams, pixelId]);

  return null;
}
