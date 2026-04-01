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

const api = axios.create({
  baseURL: ensureApiV1(baseCandidates[0]),
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Attach token automatically
api.interceptors.request.use((config) => {
  const token = getCookie("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
