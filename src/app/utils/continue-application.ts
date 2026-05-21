import { isAxiosError } from "axios";
import { apiCheckOnboardingStatus } from "@/app/Services/api";
import { apiGetInterestByEmail } from "@/app/Services/interests.service";
import type { CheckOnboardingStatusData } from "@/app/Services/types/auth.types";
import { setCookie } from "@/app/utils/cookies";
import { resolveOnboardingRoute } from "@/app/utils/onboarding-navigation";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidContinueEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function getContinueApplicationError(err: unknown): string {
  if (isAxiosError(err)) {
    const status = err.response?.status;
    if (status === 404) {
      return "We could not find an application associated with this email.";
    }
    const data = err.response?.data;
    if (data && typeof data === "object" && "message" in data) {
      const message = (data as { message?: string | string[] }).message;
      if (Array.isArray(message) && message[0]) return String(message[0]);
      if (typeof message === "string" && message.trim()) return message;
    }
    if (status && status >= 500) {
      return "Something went wrong on our servers. Please try again later.";
    }
    if (!err.response) {
      return "Network error. Check your connection and try again.";
    }
  }
  if (err instanceof Error && err.message.trim()) return err.message;
  return "We could not continue your application. Please check your email and try again.";
}

async function inferRoleFromInterest(email: string): Promise<"pastor" | "mentor"> {
  try {
    const res = await apiGetInterestByEmail(email);
    const interest = res.data?.data;
    const title = String(interest?.title ?? "").toLowerCase();
    if (title.includes("mentor") || title.includes("field mentor")) return "mentor";
  } catch {
    // Role hint is optional; default to pastor login.
  }
  return "pastor";
}

export interface ContinueApplicationResult {
  route: string;
  status: CheckOnboardingStatusData;
}

/**
 * Calls check-onboarding-status, persists email cookie, returns navigation target.
 */
export async function continueApplicationByEmail(
  email: string,
): Promise<ContinueApplicationResult> {
  const trimmed = email.trim();

  if (!trimmed) {
    throw new Error("Please enter your email address.");
  }

  if (!isValidContinueEmail(trimmed)) {
    throw new Error("Please enter a valid email address.");
  }

  const res = await apiCheckOnboardingStatus(trimmed);
  const body = res.data;

  if (!body?.success || !body.data) {
    throw new Error(
      body?.message || "We could not continue your application. Please try again.",
    );
  }

  const status = body.data;
  const resolvedEmail = (status.email || trimmed).trim();
  setCookie("interestEmail", resolvedEmail);

  const role =
    status.nextStep === "login"
      ? await inferRoleFromInterest(resolvedEmail)
      : undefined;

  const route = resolveOnboardingRoute(status.nextStep, {
    email: resolvedEmail,
    role,
  });

  return { route, status };
}
