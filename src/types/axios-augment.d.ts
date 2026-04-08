import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** When true, axios-instance does not attach Bearer token (public endpoints). */
    skipAuth?: boolean;
  }
}
