import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* options here */
  output: "standalone",

  /** App Router paths are case-sensitive in production; normalize legacy lowercase links from breadcrumbs/old bookmarks */
  async redirects() {
    return [
      {
        source: "/mentor/revitalization-roadmap",
        destination: "/mentor/RevitalizationRoadmap",
        permanent: false,
      },
      {
        source: "/mentor/revitalization-roadmap/:path*",
        destination: "/mentor/RevitalizationRoadmap/:path*",
        permanent: false,
      },
    ];
  },

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
  
