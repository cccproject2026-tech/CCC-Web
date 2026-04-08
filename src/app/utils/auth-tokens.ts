import { getCookie } from "@/app/utils/cookies";

export function getAccessToken(): string | null {
  if (typeof document === "undefined") return null;
  return getCookie("accessToken")?.trim() || null;
}
