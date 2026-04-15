// import axios from "axios";

// const axiosInstance = axios.create({
//   baseURL: process.env.NEXT_PUBLIC_API_BASE_URL, 
//   timeout: 10000,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });

// // Request interceptor
// axiosInstance.interceptors.request.use(
//   (config) => {
//     if (typeof window !== 'undefined') {
//       const token = localStorage.getItem('authToken');
//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // 🚨 Response Interceptor — handle errors
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // console.error("API Error:", error.response?.data || error.message);
//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;


import axios, { AxiosError, AxiosHeaders } from "axios";
import { getCookie, setCookie, clearAllCookies } from "@/app/utils/cookies";
import { isPastorPublicRoute } from "@/app/utils/pastor-auth";
import { isMentorPublicRoute } from "@/app/utils/mentor-auth";
import { isDirectorPublicRoute } from "@/app/utils/director-auth";

const normalizeBaseUrl = (raw?: string | null): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "/") return null;
  return trimmed.replace(/\/+$/, "");
};

const ensureApiV1 = (base: string): string => {
  if (base.includes("/api/v1")) return base;
  if (base.endsWith("/api")) return `${base}/v1`;
  return `${base}/api/v1`;
};

const baseCandidates = [
  normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL),
  normalizeBaseUrl(process.env.NEXT_PUBLIC_BACKEND_URL),
  "https://app.wisdomtooth.tech/api/v1",
  "https://api.wisdomtooth.tech/api/v1",
].filter(Boolean) as string[];

/** Same-origin path — `next.config` rewrites to `app.wisdomtooth.tech/api/v1`. Required in the browser to avoid CORS. */
export const BROWSER_API_BASE = "/api-proxy";

const resolvedBaseURL =
  typeof window !== "undefined"
    ? BROWSER_API_BASE
    : ensureApiV1(baseCandidates[0]);

const axiosInstance = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Mobile parity: queued refresh flow for concurrent 401s
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processRefreshQueue(err: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (token) resolve(token);
    else reject(err);
  });
  refreshQueue = [];
}

// Dedicated client for refresh call (avoid interceptor recursion)
const refreshClient = axios.create({
  baseURL: resolvedBaseURL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

// --------------------------------------------------
// REQUEST INTERCEPTOR (Attach Token)
// --------------------------------------------------
axiosInstance.interceptors.request.use(
  (config) => {
    /** Public routes (e.g. interest registration) must not send a user token or the API may validate differently and return 400. */
    if (config.skipAuth) {
      if (config.headers instanceof AxiosHeaders) {
        config.headers.delete("Authorization");
      } else {
        delete (config.headers as Record<string, unknown>)["Authorization"];
      }
      return config;
    }
    const token = getCookie("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Mobile parity: clean query params + prevent cached GETs
    if (config.params && typeof config.params === "object") {
      const cleaned: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(config.params as Record<string, unknown>)) {
        if (v === undefined || v === null) continue;
        const s = String(v).trim();
        if (!s || s === "undefined" || s === "null") continue;
        cleaned[k] = v;
      }
      config.params = Object.keys(cleaned).length ? cleaned : undefined;
    }
    if (typeof config.url === "string" && config.url.includes("undefined")) {
      config.url = config.url.replace(/[?&][^=]*=undefined/g, "").replace(/[?&]$/, "");
    }

    // Encourage fresh reads where backend/proxies cache aggressively
    if (config.method?.toLowerCase() === "get") {
      (config.headers as any)["Cache-Control"] = "no-cache";
      (config.headers as any)["Pragma"] = "no-cache";
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// --------------------------------------------------
// RESPONSE INTERCEPTOR (Handle API Errors)
// --------------------------------------------------
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error?.response?.status;
    const originalRequest = error.config as (AxiosError["config"] & { _retry?: boolean; skipAuth?: boolean }) | undefined;

    // Attempt refresh flow on 401 (except auth endpoints / public routes)
    if (
      status === 401 &&
      typeof window !== "undefined" &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.skipAuth
    ) {
      const url = String(originalRequest.url ?? "");
      const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/refresh-token");
      if (!isAuthEndpoint) {
        const refreshToken = getCookie("refreshToken")?.trim();
        if (refreshToken) {
          originalRequest._retry = true;

          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              refreshQueue.push({
                resolve: (token: string) => {
                  if (originalRequest.headers) {
                    (originalRequest.headers as any).Authorization = `Bearer ${token}`;
                  }
                  resolve(axiosInstance(originalRequest));
                },
                reject,
              });
            });
          }

          isRefreshing = true;
          try {
            const res = await refreshClient.post<{ success: boolean; data?: { accessToken: string; refreshToken: string } }>(
              "/auth/refresh-token",
              { refreshToken },
            );
            const nextAccess = res.data?.data?.accessToken;
            const nextRefresh = res.data?.data?.refreshToken;
            if (!nextAccess || !nextRefresh) {
              throw new Error("Refresh token failed.");
            }
            setCookie("accessToken", nextAccess);
            setCookie("refreshToken", nextRefresh);
            processRefreshQueue(null, nextAccess);

            if (originalRequest.headers) {
              (originalRequest.headers as any).Authorization = `Bearer ${nextAccess}`;
            }
            return axiosInstance(originalRequest);
          } catch (refreshErr) {
            processRefreshQueue(refreshErr, null);
            // fall through to role redirect below
          } finally {
            isRefreshing = false;
          }
        }
      }
    }

    // Role redirect (kept) when not refreshable / refresh fails
    if (status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      const search = window.location.search || "";
      const ret = `${path}${search}`;
      if (path.startsWith("/pastor/") && !isPastorPublicRoute(path)) {
        clearAllCookies();
        window.location.assign(`/pastor/login?returnUrl=${encodeURIComponent(ret)}`);
      } else if (path.startsWith("/mentor/") && !isMentorPublicRoute(path)) {
        clearAllCookies();
        window.location.assign(`/mentor/login?returnUrl=${encodeURIComponent(ret)}`);
      } else if (path.startsWith("/director/") && !isDirectorPublicRoute(path)) {
        clearAllCookies();
        window.location.assign(`/director/login?returnUrl=${encodeURIComponent(ret)}`);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
