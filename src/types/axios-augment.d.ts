import "axios";

declare module "axios" {
  interface AxiosRequestConfig {
    /** When true, axios-instance does not attach Bearer token (public endpoints). */
    skipAuth?: boolean;
    /** When true, global 401 redirect is skipped so caller can render inline UX. */
    suppress401Redirect?: boolean;
  }
}
