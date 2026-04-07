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
    /** Avoid Node fetching remote URLs during optimization (TLS / corporate CA issues in dev). */
    unoptimized:
      process.env.NODE_ENV === "development" ||
      process.env.SKIP_IMAGE_OPTIMIZATION === "1",
    remotePatterns: [
      { protocol: "https", hostname: "example.com", pathname: "/**" },
      { protocol: "https", hostname: "www.example.com", pathname: "/**" },
      { protocol: "https", hostname: "wisdomtooth.tech", pathname: "/**" },
      { protocol: "https", hostname: "**.wisdomtooth.tech", pathname: "/**" },
      { protocol: "https", hostname: "app.wisdomtooth.tech", pathname: "/**" },
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
  
