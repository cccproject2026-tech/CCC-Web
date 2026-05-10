import type { NextConfig } from "next";
import path from "path";

/** Must match server-side base resolution in `axios-instance.ts` so `/api-proxy` hits the same API as SSR. */
function resolveApiProxyRewriteDestination(): string {
  const raw = (
    process.env.API_PROXY_TARGET ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BACKEND_URL ||
    ""
  ).trim();
  let base: string;
  if (!raw) {
    base = "https://app.wisdomtooth.tech/api/v1";
  } else {
    base = raw.replace(/\/+$/, "");
    if (!base.includes("/api/v1")) {
      if (base.endsWith("/api")) base = `${base}/v1`;
      else base = `${base}/api/v1`;
    }
  }
  return `${base}/:path*`;
}

const nextConfig: NextConfig = {
  /* options here */
  output: "standalone",

  /** Pin workspace root to this project so Next.js doesn't pick up the
   *  lockfile at C:\Users\anant\package-lock.json as the monorepo root. */
  outputFileTracingRoot: path.join(__dirname),

  /** App Router paths are case-sensitive in production; normalize legacy lowercase links from breadcrumbs/old bookmarks */
  async redirects() {
    return [
      {
        source: "/director/revitalization-roadmap/home",
        destination: "/director/revitalization-roadmap",
        permanent: true,
      },
      {
        source: "/director/revitalization-roadmap/home/:path*",
        destination: "/director/revitalization-roadmap/:path*",
        permanent: true,
      },
      /** Do not add /pastor/assessments → /pastor/Assessments redirects here: on case-insensitive
       *  hosts the matcher can match both casings and cause ERR_TOO_MANY_REDIRECTS. In-app links use `/pastor/Assessments/...`. */
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

  /** Proxy API in dev/prod so the browser calls same-origin URLs — avoids CORS blocking localhost → remote API */
  async rewrites() {
    return [
      {
        source: "/api-proxy/:path*",
        destination: resolveApiProxyRewriteDestination(),
      },
      /**
       * Public URL is `/pastor/appointments`. The app route folder is currently `appt_route_lower`
       * (see `src/app/pastor/appt_route_lower`). Rewrites must target that segment or requests 404.
       * When you rename that folder to `appointments` in git, set destination to `/pastor/appointments`
       * and remove these two lines (no-op rewrite).
       */
      { source: "/pastor/appointments", destination: "/pastor/appt_route_lower" },
      {
        source: "/pastor/appointments/:path*",
        destination: "/pastor/appt_route_lower/:path*",
      },
      { source: "/pastor/assessments", destination: "/pastor/Assessments" },
      { source: "/pastor/assessments/:path*", destination: "/pastor/Assessments/:path*" },
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
  
