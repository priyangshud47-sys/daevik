'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';

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
  const [pixelId, setPixelId] = useState<string | null>(null);
  const routeChangeTracked = useRef<string | null>(null);

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

  // 2. Track Route Changes
  useEffect(() => {
    if (!pixelId) return;
    
    // Facebook Pixel helper detects PageView on every route
    if (typeof window !== 'undefined' && window.fbq) {
      // Prevent double firing on the initial render since the snippet itself fires PageView
      if (routeChangeTracked.current === pathname + searchParams.toString()) return;
      routeChangeTracked.current = pathname + searchParams.toString();
      
      window.fbq('track', 'PageView');
    }
  }, [pathname, searchParams, pixelId]);

  if (!pixelId) return null;

  // Security Verification: Meta Pixel IDs strictly contain only numbers.
  // This Regex completely neutralizes any potential XSS payload injected via the database.
  if (!/^\d+$/.test(pixelId)) {
    console.error('Security Alert: Invalid Meta Pixel ID format detected. Injection blocked.');
    return null;
  }

  return (
    <>
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
