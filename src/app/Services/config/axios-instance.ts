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


import axios, { AxiosHeaders } from "axios";
import { getCookie, clearAllCookies } from "@/app/utils/cookies";
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
    return config;
  },
  (error) => Promise.reject(error)
);

// --------------------------------------------------
// RESPONSE INTERCEPTOR (Handle API Errors)
// --------------------------------------------------
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
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
