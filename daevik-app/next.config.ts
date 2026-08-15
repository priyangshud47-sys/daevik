import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Allow uploaded landing page HTML to be served in iframes
  async headers() {
    return [
      {
        source: '/api/landing/:slug',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self'",
          },
        ],
      },
    ];
  },
  outputFileTracingIncludes: {
    '/api/admin/products/sync': ['./local_products/**/*'],
  },
};

export default nextConfig;
