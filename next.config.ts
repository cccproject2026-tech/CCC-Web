import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* options here */
  output: "standalone",

  /** Proxy API in dev/prod so the browser calls same-origin URLs — avoids CORS blocking localhost → wisdomtooth.tech */
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: "https://app.wisdomtooth.tech/api/v1/:path*",
      },
    ];
  },
  images: {
    domains: ['example.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
  
