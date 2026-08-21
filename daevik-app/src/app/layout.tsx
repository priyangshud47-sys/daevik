import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import FacebookPixel from "@/components/FacebookPixel";
import { supabase } from "@/lib/supabase";

export const metadata: Metadata = {
  title: "Daevik — Premium Digital Products",
  description: "Discover and purchase premium digital products from Daevik. Instant delivery, secure payments, and unique product experiences.",
  openGraph: {
    title: "Daevik — Premium Digital Products",
    description: "Discover and purchase premium digital products from Daevik.",
    siteName: "Daevik",
    type: "website",
  },
};

async function getPixelId(): Promise<string | null> {
  try {
    const { data: configs } = await supabase
      .from('fb_capi_config')
      .select('pixel_id')
      .eq('active', true)
      .order('updated_at', { ascending: false })
      .limit(1);

    return configs?.[0]?.pixel_id || process.env.NEXT_PUBLIC_META_PIXEL_ID || null;
  } catch {
    return process.env.NEXT_PUBLIC_META_PIXEL_ID || null;
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pixelId = await getPixelId();

  // Security: only allow purely numeric pixel IDs
  const safePixelId = pixelId && /^\d+$/.test(pixelId) ? pixelId : null;

  return (
    <html lang="en">
      <head>
        {safePixelId && (
          <>
            <script
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
                  fbq('init', '${safePixelId}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${safePixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
      </head>
      <body>
        <Suspense fallback={null}>
          <FacebookPixel pixelId={safePixelId} />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
