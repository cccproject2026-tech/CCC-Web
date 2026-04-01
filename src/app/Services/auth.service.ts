import axios from "axios";
import axiosInstance from "./config/axios-instance";
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
      directLoginUrl,
      ...loginPaths, // keep relative attempts first (works when proxy is configured)
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
    }
  }

  throw lastError;
};

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
