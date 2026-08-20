import type { Metadata } from "next";
import "./globals.css";
import { Suspense } from "react";
import FacebookPixel from "@/components/FacebookPixel";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
      </head>
      <body>
        <Suspense fallback={null}>
          <FacebookPixel />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
