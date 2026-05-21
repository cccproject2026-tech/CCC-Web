import type { OnboardingNextStep } from "@/app/Services/types/auth.types";

export type OnboardingRoleHint = "pastor" | "mentor" | string | undefined;

export interface ResolveOnboardingRouteOptions {
  email: string;
  role?: OnboardingRoleHint;
}

function normalizeRole(role?: OnboardingRoleHint): "pastor" | "mentor" {
  const r = String(role ?? "")
    .trim()
    .toLowerCase();
  return r.includes("mentor") ? "mentor" : "pastor";
}

/**
 * Maps backend `nextStep` to the correct web route.
 * Backend `nextStep` is the primary source of truth for onboarding resume.
 */
export function resolveOnboardingRoute(
  nextStep: OnboardingNextStep,
  options: ResolveOnboardingRouteOptions,
): string {
  const email = encodeURIComponent(options.email.trim());
  const role = normalizeRole(options.role);

  switch (nextStep) {
    case "pending":
      return `/pastor/Processing?email=${email}`;
    case "verify-email":
      return `/pastor/Processing?email=${email}&step=verify-email`;
    case "set-password":
      return `/pastor/Processing?email=${email}&step=set-password`;
    case "login": {
      const base = role === "mentor" ? "/mentor/login" : "/pastor/login";
      return `${base}?email=${email}`;
    }
    case "rejected":
      return `/pastor/Processing?email=${email}&step=rejected`;
    default:
      return `/pastor/Processing?email=${email}`;
  }
}

/** Initial OTP/password panel step from Processing URL `step` query param. */
export function processingStepToInitialPanelStep(
  stepParam: string | null,
  isEmailVerified: boolean,
): 1 | 2 | 3 | undefined {
  const step = String(stepParam ?? "").trim().toLowerCase();
  if (step === "set-password" && isEmailVerified) return 3;
  if (step === "verify-email") return 1;
  if (step === "set-password") return 1;
  return undefined;
}
