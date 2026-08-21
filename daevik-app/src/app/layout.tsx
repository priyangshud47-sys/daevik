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
