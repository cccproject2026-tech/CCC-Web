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


import axios from "axios";
import { getCookie } from "@/app/utils/cookies";

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

const resolvedBaseURL = ensureApiV1(baseCandidates[0]);

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
    // optional log:
    // console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export default axiosInstance;
