import axiosInstance from "./config/axios-instance";
import type {
  LoginResponse,
  SendOtpPayload,
  VerifyOtpPayload,
  SetPasswordPayload,
  ForgotPasswordPayload,
  ResetPasswordPayload,
  RefreshTokenPayload,
} from "./types/auth.types";

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
