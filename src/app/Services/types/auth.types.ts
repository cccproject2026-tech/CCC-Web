// Auth types matching CCC-Backend auth module DTOs

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    _id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    profilePicture?: string;
  };
}

export interface SendOtpPayload {
  email: string;
  /** Must match backend `SendOtpDto` — see `/auth/send-otp`. */
  purpose: "email_verification" | "password_reset";
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface SetPasswordPayload {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  password: string;
  confirmPassword: string;
}

export interface RefreshTokenPayload {
  refreshToken: string;
}

/** Backend-driven onboarding resume step (`POST /auth/check-onboarding-status`). */
export type OnboardingNextStep =
  | "pending"
  | "verify-email"
  | "set-password"
  | "login"
  | "rejected";

export interface CheckOnboardingStatusRequest {
  email: string;
}

export interface CheckOnboardingStatusData {
  email: string;
  interestStatus: string;
  isEmailVerified: boolean;
  isPasswordSet: boolean;
  nextStep: OnboardingNextStep;
}

export interface CheckOnboardingStatusResponse {
  success: boolean;
  message?: string;
  data: CheckOnboardingStatusData;
}
