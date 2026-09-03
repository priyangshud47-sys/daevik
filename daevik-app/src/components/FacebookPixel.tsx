'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import Script from 'next/script';

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : undefined;
}

function setCookie(name: string, value: string, days = 90) {
  if (typeof document === 'undefined') return;
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
}

function captureFbc(searchParams: URLSearchParams): string | undefined {
  let fbclid: string | null = searchParams.get('fbclid');
  if (!fbclid && typeof window !== 'undefined') {
    fbclid = new URLSearchParams(window.location.search).get('fbclid');
  }
  if (fbclid) {
    const fbcValue = `fb.1.${Date.now()}.${fbclid}`;
    setCookie('_fbc', fbcValue);
    return fbcValue;
  }
  return getCookie('_fbc');
}

export default function FacebookPixel({ pixelId }: { pixelId: string | null }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRoute = useRef<string | null>(null);

  useEffect(() => {
    if (!pixelId) return;

    const currentRoute = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    // Skip duplicate fires for the same route
    if (lastTrackedRoute.current === currentRoute) return;
    lastTrackedRoute.current = currentRoute;

    // 1. Capture fbc immediately if fbclid is in URL, or read from cookie
    const fbcVal = captureFbc(searchParams);

    // 2. Generate a single deduplication event ID for this PageView
    const eventId = `pv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 3. Fire Client-side Pixel with matching eventID
    const tryTrack = () => {
      if (typeof window !== 'undefined' && window.fbq && typeof window.fbq === 'function') {
        window.fbq('track', 'PageView', {}, { eventID: eventId });
      } else {
        setTimeout(tryTrack, 300);
      }
    };
    tryTrack();

    // 4. Fire Server-side CAPI PageView with matching eventID, fbc, and fbp
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const fbpVal = getCookie('_fbp');

    fetch('/api/track/capi', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'PageView',
        url: currentUrl,
        eventId,
        fbp: fbpVal,
        fbc: fbcVal || getCookie('_fbc'),
      }),
    }).catch(() => {});
  }, [pathname, searchParams, pixelId]);

  if (!pixelId) return null;

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

