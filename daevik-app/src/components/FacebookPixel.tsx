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

  // 2. Track Route Changes (SPA navigation)
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (!pixelId) return;
    
    // Skip the very first render — the inline <Script> already fires PageView on load
    if (isFirstRender.current) {
      isFirstRender.current = false;
      routeChangeTracked.current = pathname + searchParams.toString();
      return;
    }

    // Prevent double firing for the same route
    const currentRoute = pathname + searchParams.toString();
    if (routeChangeTracked.current === currentRoute) return;
    routeChangeTracked.current = currentRoute;

    // Wait for fbq to be available before tracking
    const tryTrack = () => {
      if (typeof window !== 'undefined' && window.fbq && typeof window.fbq === 'function') {
        window.fbq('track', 'PageView');
      } else {
        setTimeout(tryTrack, 300);
      }
    };
    tryTrack();
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
