import axios from "axios";
import axiosInstance, { BROWSER_API_BASE } from "./config/axios-instance";
import type { AxiosError } from "axios";
import type {
  LoginResponse,
  SendOtpPayload,
  VerifyOtpPayload,
  SetPasswordPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  RefreshTokenPayload,
} from "./types/auth.types";

/** True when 404 is a JSON API error (e.g. "User not found"), not a missing route — must not fall through to other URLs. */
function isStructuredApi404(error: AxiosError): boolean {
  if (error.response?.status !== 404) return false;
  const data = error.response.data;
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  if (d.success === false) return true;
  if (typeof d.message === "string" && d.message.length > 0) return true;
  return false;
}

// POST login (supports multiple backend route variants)
export const apiLogin = async (email: string, password: string) => {
  const payload = { email, password };
  const directLoginUrl = "https://app.wisdomtooth.tech/api/v1/auth/login";
  const baseCandidates = [
    process.env.NEXT_PUBLIC_API_BASE_URL,
    process.env.NEXT_PUBLIC_BACKEND_URL,
    "https://api.wisdomtooth.tech",
    "https://api.wisdomtooth.tech/api",
    "https://app.wisdomtooth.tech",
    "https://app.wisdomtooth.tech/api",
  ].filter(Boolean) as string[];

  const loginPaths = [
    "/auth/login",
    "/login",
    "/users/login",
    "/auth/sign-in",
    "/api/auth/login",
    "/api/login",
  ];

  const requestUrls = Array.from(
    new Set([
      // Browser: same-origin proxy (see next.config rewrites) — avoids CORS on direct HTTPS calls
      ...(typeof window !== "undefined" ? [`${BROWSER_API_BASE}/auth/login`] : []),
      directLoginUrl,
      ...loginPaths,
      ...baseCandidates.flatMap((base) =>
        loginPaths.map((path) => `${base.replace(/\/+$/, "")}${path}`),
      ),
    ]),
  );

  let lastError: unknown = null;

  for (const url of requestUrls) {
    try {
      return await axios.post<{ success: boolean; data: LoginResponse; message?: string }>(
        url,
        payload,
        {
          timeout: 10000,
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error) {
      const axiosError = error as AxiosError;
      lastError = error;
      // If endpoint doesn't exist, try next path. For other errors, stop immediately.
      if (axiosError.response?.status !== 404) {
        throw error;
      }
      // Backend may use 404 + JSON for auth failures (e.g. user not found) — do not retry other URLs.
      if (isStructuredApi404(axiosError)) {
        throw error;
      }
    }
  }

  throw lastError;
};

// POST /auth/send-otp (public — no Bearer; matches mobile onboarding)
export const apiSendOtp = (payload: SendOtpPayload) =>
  axiosInstance.post<{ success: boolean; message: string }>(
    "/auth/send-otp",
    payload,
    { skipAuth: true },
  );

// POST /auth/verify-otp
export const apiVerifyOtp = (payload: VerifyOtpPayload) =>
  axiosInstance.post<{ success: boolean; message: string }>(
    "/auth/verify-otp",
    payload,
    { skipAuth: true },
  );

// POST /auth/set-password — backend requires email verified (OTP) first; see mobile set-password flow.
export const apiSetPassword = (email: string, password: string, confirmPassword: string) =>
  axiosInstance.post<{ success: boolean; message?: string }>(
    "/auth/set-password",
    { email, password, confirmPassword } as SetPasswordPayload,
    { skipAuth: true },
  );

// POST /auth/forgot-password
export const apiForgotPassword = (payload: ForgotPasswordPayload) =>
  axiosInstance.post<{ success: boolean; message: string }>("/auth/forgot-password", payload);

// POST /auth/reset-password
export const apiResetPassword = (payload: ResetPasswordPayload) =>
  axiosInstance.post<{ success: boolean; message: string }>("/auth/reset-password", payload);

// POST /auth/refresh-token
export const apiRefreshToken = (payload: RefreshTokenPayload) =>
  axiosInstance.post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
    "/auth/refresh-token",
    payload,
  );

// POST /auth/logout  (JWT protected)
export const apiLogout = () =>
  axiosInstance.post<{ success: boolean; message: string }>("/auth/logout");
