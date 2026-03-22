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

// POST /auth/login
export const apiLogin = (email: string, password: string) =>
  axiosInstance.post<{ success: boolean; data: LoginResponse; message?: string }>(
    "/auth/login",
    { email, password },
  );

// POST /auth/send-otp
export const apiSendOtp = (payload: SendOtpPayload) =>
  axiosInstance.post<{ success: boolean; message: string }>("/auth/send-otp", payload);

// POST /auth/verify-otp
export const apiVerifyOtp = (payload: VerifyOtpPayload) =>
  axiosInstance.post<{ success: boolean; message: string }>("/auth/verify-otp", payload);

// POST /auth/set-password
export const apiSetPassword = (email: string, password: string, confirmPassword: string) =>
  axiosInstance.post<{ success: boolean; message?: string }>(
    "/auth/set-password",
    { email, password, confirmPassword } as SetPasswordPayload,
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
