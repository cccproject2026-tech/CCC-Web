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
  purpose?: 'set-password' | 'forgot-password';
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
