import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import FacebookPixel from "@/components/FacebookPixel";
import { supabase } from "@/lib/supabase";
import { unstable_cache } from "next/cache";

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

const getPixelId = unstable_cache(
  async () => {
    try {
      const { data } = await supabase
        .from('fb_capi_config')
        .select('pixel_id')
        .eq('active', true)
        .single();
      return data?.pixel_id || null;
    } catch (error) {
      console.error('Failed to load FB Pixel ID', error);
      return null;
    }
  },
  ['fb-pixel-id'],
  { revalidate: 3600 }
);

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pixelId = await getPixelId();

  return (
    <html lang="en">
      <head>
        {pixelId && (
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
        )}
      </head>
      <body>
        <Suspense fallback={null}>
          <FacebookPixel pixelId={pixelId} />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
