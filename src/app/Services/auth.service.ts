import axiosInstance from "./config/axios-instance";

export const apiLogin = (email: string, password: string) => {
  return axiosInstance.post<{ success: boolean; data: any; message?: string }>(
    "/auth/login",
    { email, password }
  );
};

export const apiSetPassword = (email: string, password: string, confirmPassword: string) => {
  return axiosInstance.post<{ success: boolean; message?: string }>(
    "/auth/set-password",
    { email, password, confirmPassword }
  );
};
