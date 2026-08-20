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
      <body>
        <Suspense fallback={null}>
          <FacebookPixel pixelId={pixelId} />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
