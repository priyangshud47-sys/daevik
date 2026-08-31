'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';
import Script from 'next/script';
import type { GoogleTrackingConfig } from '@/lib/google-config';
import { trackGooglePageView } from '@/lib/google-client';

interface GoogleTagProps {
  config: Partial<GoogleTrackingConfig> | null;
}

export default function GoogleTag({ config }: GoogleTagProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedRoute = useRef<string | null>(null);

  const googleAdsId = config?.google_ads_id?.trim() || null;
  const ga4Id = config?.ga4_id?.trim() || null;
  const primaryId = googleAdsId || ga4Id;
  const isActive = config?.active !== false && !!primaryId;

  // Sync config to window._googleTrackingConfig so client helpers have instant access
  useEffect(() => {
    if (typeof window !== 'undefined' && config) {
      window._googleTrackingConfig = config;
    }
  }, [config]);

  // Track SPA route changes
  useEffect(() => {
    if (!isActive) return;

    const currentRoute = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');

    // Skip duplicate fires for the same route
    if (lastTrackedRoute.current === currentRoute) return;
    lastTrackedRoute.current = currentRoute;

    trackGooglePageView(currentRoute);
  }, [pathname, searchParams, isActive]);

  if (!isActive || !primaryId) {
    return null;
  }

  // Sanitized Google Ads / GA4 tag IDs (alphanumeric and hyphens only to prevent injection)
  const safeAdsId = googleAdsId && /^[A-Za-z0-9_-]+$/.test(googleAdsId) ? googleAdsId : null;
  const safeGa4Id = ga4Id && /^[A-Za-z0-9_-]+$/.test(ga4Id) ? ga4Id : null;
  const safePrimaryId = safeAdsId || safeGa4Id;

  if (!safePrimaryId) return null;

  return (
    <>
      {/* Global Site Tag (gtag.js) */}
      <Script
        id="google-tag-base"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${safePrimaryId}`}
      />
      
      {/* Google Tag Initialization */}
      <Script
        id="google-tag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            ${safeAdsId ? `gtag('config', '${safeAdsId}', {
              send_page_view: false,
              ${config?.enhanced_conversions ? `'allow_enhanced_conversions': true,` : ''}
            });` : ''}

            ${safeGa4Id ? `gtag('config', '${safeGa4Id}', {
              send_page_view: false
            });` : ''}
          `,
        }}
      />
    </>
  );
}
