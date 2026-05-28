import axiosInstance from "./config/axios-instance";
import type {
  LoginResponse,
  SendOtpPayload,
  VerifyOtpPayload,
  SetPasswordPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  RefreshTokenPayload,
  CheckOnboardingStatusRequest,
  CheckOnboardingStatusResponse,
} from "./types/auth.types";
import type { GoogleCalendarConnectionStatus } from "./types/users.types";

// POST login through shared axios instance (same base/proxy as all web API calls)
export const apiLogin = async (email: string, password: string) => {
  return axiosInstance.post<{ success: boolean; data: LoginResponse; message?: string }>(
    "/auth/login",
    { email, password },
    {
      skipAuth: true,
    },
  );
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
// export const apiForgotPassword = (payload: ForgotPasswordPayload) =>
//   axiosInstance.post<{ success: boolean; message: string }>("/auth/forgot-password", payload);
export const apiForgotPassword = (payload: ForgotPasswordPayload) =>
  axiosInstance.post<{ success: boolean; message: string }>(
    "/auth/forgot-password",
    payload,
    { skipAuth: true },
  );

// POST /auth/reset-password
// export const apiResetPassword = (payload: ResetPasswordPayload) =>
//   axiosInstance.post<{ success: boolean; message: string }>("/auth/reset-password", payload);
export const apiResetPassword = (payload: ResetPasswordPayload) =>
  axiosInstance.post<{ success: boolean; message: string }>(
    "/auth/reset-password",
    payload,
    { skipAuth: true },
  );

// POST /auth/refresh-token
export const apiRefreshToken = (payload: RefreshTokenPayload) =>
  axiosInstance.post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
    "/auth/refresh-token",
    payload,
  );

// POST /auth/logout  (JWT protected)
export const apiLogout = () =>
  axiosInstance.post<{ success: boolean; message: string }>("/auth/logout");

/** GET `/auth/google` — returns OAuth URL. Send `Authorization: Bearer` only (no anonymous ?userId= flow). Optional ?userId is omitted here; backend derives user from JWT. */
export const apiGetGoogleCalendarAuthUrl = () =>
  axiosInstance.get<{ url?: string; data?: { url?: string }; success?: boolean }>(
    "/auth/google",
    { suppress401Redirect: true },
  );

/** GET `/google-calendar/status` — backend source of truth for connection health + sync metadata. */
export const apiGetGoogleCalendarStatus = () =>
  axiosInstance.get<GoogleCalendarConnectionStatus>("/google-calendar/status", {
    suppress401Redirect: true,
  });

function pickOAuthUrl(record: Record<string, unknown>): string | null {
  const keys = ["url", "oauthUrl", "authUrl", "authorizationUrl", "redirectUrl", "link"] as const;
  for (const k of keys) {
    const v = record[k];
    if (typeof v === "string" && /^https?:\/\//i.test(v.trim())) return v.trim();
  }
  return null;
}

/** Extract Google OAuth authorize URL from common CCC backend envelopes. */
export function unwrapGoogleOAuthRedirectUrl(payload: unknown): string | null {
  const root = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  if (!root) return null;
  const top = pickOAuthUrl(root);
  if (top) return top;
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : null;
  if (data) {
    const inner = pickOAuthUrl(data);
    if (inner) return inner;
  }
  return null;
}

// POST /auth/check-onboarding-status — resume onboarding (public; matches mobile)
export const apiCheckOnboardingStatus = (email: string) =>
  axiosInstance.post<CheckOnboardingStatusResponse>(
    "/auth/check-onboarding-status",
    { email: email.trim() } satisfies CheckOnboardingStatusRequest,
    { skipAuth: true },
  );
