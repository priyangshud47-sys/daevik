'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useState } from 'react';

// Declare fbq for TypeScript
declare global {
  interface Window {
    fbq: (...args: unknown[]) => void;
    _fbq: unknown;
  }
}

export default function FacebookPixel() {
  const [pixelId, setPixelId] = useState<string | null>(null);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    fetch('/api/track/pixel')
      .then((res) => res.json())
      .then((data) => {
        if (data.pixelId) {
          setPixelId(data.pixelId);
        }
      })
      .catch((err) => console.error('Failed to load FB Pixel ID', err));
  }, []);

  useEffect(() => {
    if (!pixelId) return;
    
    // Fire PageView on route changes.
    // We delay slightly to ensure fbq is fully initialized from the Script tag.
    const handleRouteChange = () => {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'PageView');
      }
    };
    
    // We don't want to fire twice on the initial load, because the snippet already fires PageView.
    // We can rely on the Next.js router changes. 
    // This simple check works well enough for App router.
    handleRouteChange();
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
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
