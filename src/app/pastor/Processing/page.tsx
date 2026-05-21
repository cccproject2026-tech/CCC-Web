"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import HeroBg from "../../Assets/hero-bg.png";
import { apiCheckOnboardingStatus } from "@/app/Services/auth.service";
import { apiGetInterestByEmail } from "@/app/Services/interests.service";
import { getCookie, setCookie } from "@/app/utils/cookies";
import type { CheckOnboardingStatusData } from "@/app/Services/types/auth.types";
import type { Interest } from "@/app/Services/types";
import SetPasswordInlinePanel from "@/app/Components/SetPasswordInlinePanel";
import {
  processingStepToInitialPanelStep,
  resolveOnboardingRoute,
} from "@/app/utils/onboarding-navigation";

function inferLoginPathFromInterest(interest: Interest | null): string {
  const interestRole = String(interest?.title ?? "").toLowerCase();
  return interestRole.includes("mentor") ? "/mentor/login" : "/pastor/login";
}

function getPanelInitialStep(
  stepParam: string | null,
  onboarding: CheckOnboardingStatusData | null,
): 1 | 2 | 3 | undefined {
  const fromUrl = processingStepToInitialPanelStep(
    stepParam,
    onboarding?.isEmailVerified ?? false,
  );
  if (fromUrl) return fromUrl;
  if (!onboarding) return undefined;
  if (onboarding.nextStep === "set-password" && onboarding.isEmailVerified) return 3;
  if (onboarding.nextStep === "verify-email") return 1;
  if (onboarding.nextStep === "set-password") return 1;
  return undefined;
}

function ProcessingPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const emailFromUrl = searchParams.get("email") ?? "";
  const stepParam = searchParams.get("step");

  const resolvedEmail = useMemo(() => {
    const fromUrl = emailFromUrl.trim();
    if (fromUrl) return fromUrl;
    return (getCookie("interestEmail") ?? "").trim();
  }, [emailFromUrl]);

  const [onboarding, setOnboarding] = useState<CheckOnboardingStatusData | null>(null);
  const [interest, setInterest] = useState<Interest | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [showStatusText, setShowStatusText] = useState(false);

  const fetchOnboarding = useCallback(async (): Promise<CheckOnboardingStatusData | null> => {
    if (!resolvedEmail) {
      setStatusError(
        "No saved email. Use Continue Application on the home page or open the link from your confirmation email.",
      );
      setOnboarding(null);
      return null;
    }

    setCookie("interestEmail", resolvedEmail);

    const res = await apiCheckOnboardingStatus(resolvedEmail);
    const body = res.data;

    if (!body?.success || !body.data) {
      throw new Error(body?.message || "Unable to load onboarding status");
    }

    const data = body.data;
    setOnboarding(data);
    setStatusError(null);

    if (data.nextStep === "login") {
      try {
        const interestRes = await apiGetInterestByEmail(resolvedEmail);
        const interestData = interestRes.data?.data ?? null;
        setInterest(interestData);
        const role = inferLoginPathFromInterest(interestData).includes("mentor")
          ? "mentor"
          : "pastor";
        router.replace(
          resolveOnboardingRoute("login", { email: resolvedEmail, role }),
        );
      } catch {
        router.replace(
          resolveOnboardingRoute("login", { email: resolvedEmail, role: "pastor" }),
        );
      }
      return data;
    }

    return data;
  }, [resolvedEmail, router]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setStatusLoading(true);
        await fetchOnboarding();
        if (!cancelled && resolvedEmail) {
          try {
            const interestRes = await apiGetInterestByEmail(resolvedEmail);
            if (!cancelled) setInterest(interestRes.data?.data ?? null);
          } catch {
            // Interest record is supplemental (role hint only).
          }
        }
      } catch {
        if (!cancelled) {
          setStatusError("Unable to load your status. Please try again later.");
        }
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchOnboarding, resolvedEmail]);

  useEffect(() => {
    if (!resolvedEmail || statusLoading) return;
    if (onboarding && onboarding.nextStep !== "pending") return;

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const tick = async () => {
      try {
        const data = await fetchOnboarding();
        const next = data?.nextStep;
        if (next && next !== "pending" && intervalId != null) {
          clearInterval(intervalId);
        }
      } catch {
        // Retry on next interval.
      }
    };

    void tick();
    intervalId = setInterval(() => {
      void tick();
    }, 20000);

    return () => {
      if (intervalId != null) clearInterval(intervalId);
    };
  }, [resolvedEmail, statusLoading, onboarding?.nextStep, fetchOnboarding]);

  const nextStep = onboarding?.nextStep;
  const isRejected = nextStep === "rejected";
  const isPending = nextStep === "pending";
  const showPasswordFlow =
    nextStep === "verify-email" || nextStep === "set-password";

  const loginPath = inferLoginPathFromInterest(interest);

  const panelInitialStep = getPanelInitialStep(stepParam, onboarding);
  const panelEmail = resolvedEmail || onboarding?.email || "";

  const statusLabel = statusLoading
    ? "Checking..."
    : statusError
      ? "Unavailable"
      : isRejected
        ? "Rejected"
        : showPasswordFlow
          ? "Continue setup"
          : isPending
            ? "Waiting for Approval"
            : "Status";

  const handlePasswordSetSuccess = () => {
    setTimeout(() => {
      router.push(loginPath);
    }, 1200);
  };

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-white font-[Albert_Sans]">
      <section
        className="relative flex-1 overflow-hidden bg-cover bg-top px-4 pb-16 pt-6 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.72)_0%,rgba(6,41,70,0.78)_45%,rgba(6,41,70,0.96)_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:justify-between">
            <button
              type="button"
              onClick={() => setShowStatusText((prev) => !prev)}
              className={`inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:scale-[1.02] sm:order-2 ${
                showPasswordFlow
                  ? "bg-emerald-600/90 shadow-emerald-900/30"
                  : isRejected
                    ? "bg-red-600/85 shadow-red-900/30"
                    : statusError
                      ? "bg-amber-600/85 shadow-amber-900/30"
                      : ""
              }`}
              style={
                isPending || statusLoading
                  ? { background: "linear-gradient(90deg, #B83AF3 0%, #21B6E9 100%)" }
                  : undefined
              }
            >
              {statusLoading ? (
                <i className="fa-solid fa-circle-notch animate-spin text-white/90" aria-hidden />
              ) : (
                <span
                  className="h-2.5 w-2.5 rounded-full bg-white"
                  style={
                    isPending && !statusLoading
                      ? { boxShadow: "0 0 0 3px rgba(255,255,255,0.25)" }
                      : undefined
                  }
                />
              )}

              <span>Status</span>

              {!statusLoading && !statusError && (
                <i className="fa-solid fa-chevron-right text-xs text-white/80" aria-hidden />
              )}

              {showStatusText && <span>{statusLabel}</span>}
            </button>
            <p className="text-center text-xs uppercase tracking-[0.2em] text-white/75 sm:order-1 sm:text-left">
              Live status · updates
            </p>
          </div>

          <div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.55)_0%,rgba(9,49,80,0.72)_100%)] p-8 shadow-[0_20px_50px_rgba(2,20,38,0.4)] backdrop-blur-md md:p-10 lg:p-12">
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 md:h-20 md:w-20">
                  {statusLoading ? (
                    <i className="fa-solid fa-spinner fa-spin text-3xl text-[#8ec5eb] md:text-4xl" aria-hidden />
                  ) : showPasswordFlow ? (
                    <i className="fa-solid fa-circle-check text-3xl text-emerald-300 md:text-4xl" aria-hidden />
                  ) : isRejected ? (
                    <i className="fa-solid fa-circle-xmark text-3xl text-red-300 md:text-4xl" aria-hidden />
                  ) : statusError ? (
                    <i className="fa-solid fa-triangle-exclamation text-3xl text-amber-300 md:text-4xl" aria-hidden />
                  ) : (
                    <i className="fa-regular fa-clock text-3xl text-[#8ec5eb] md:text-4xl" aria-hidden />
                  )}
                </div>

                <h1 className="text-3xl font-semibold leading-tight text-white md:text-4xl lg:text-[2.5rem] lg:leading-snug">
                  {statusLoading
                    ? "Checking your application..."
                    : statusError
                      ? "We couldn’t refresh your status"
                      : showPasswordFlow
                        ? "Continue your account setup"
                        : isRejected
                          ? "Your application was not approved"
                          : "Your Application Under Review"}
                </h1>

                <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-[#cde2f2] md:text-lg">
                  {statusError ? (
                    <p>{statusError}</p>
                  ) : showPasswordFlow ? (
                    <>
                      <p>
                        {onboarding?.isEmailVerified
                          ? "Your email is verified. Create your password to finish activating your account."
                          : "Verify your email, then create your password to activate your account."}
                      </p>
                      <div className="mt-6">
                        <SetPasswordInlinePanel
                          email={panelEmail}
                          initialStep={panelInitialStep}
                          loginPath={loginPath}
                          onSuccess={handlePasswordSetSuccess}
                        />
                      </div>
                    </>
                  ) : isRejected ? (
                    <p>
                      If you have questions, please contact us using the information on this page.
                      We’re grateful for your interest in Community Change.
                    </p>
                  ) : (
                    <>
                      <p>Thank you for your submission.</p>
                      <p>Your application is under review.</p>
                      <p>We will notify you soon. God bless you!</p>
                    </>
                  )}
                </div>

                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="mt-8">
                    <Link
                      href="/"
                      className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0b2d4f] transition hover:scale-105"
                    >
                      Back
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-6 lg:col-span-5 xl:col-span-4">
              <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] p-6 backdrop-blur-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <i className="fa-solid fa-address-card text-[#8ec5eb]" aria-hidden />
                  </div>
                  <h2 className="text-xl font-semibold text-white">Contact Information</h2>
                </div>
                <ul className="space-y-3 text-sm text-[#cde2f2]">
                  <li className="flex items-start gap-3">
                    <i className="fa-solid fa-phone mt-0.5 text-[#8ec5eb]" aria-hidden />
                    <span>269-471-6159</span>
                  </li>
                  <li className="flex items-start gap-3 break-all">
                    <i className="fa-solid fa-envelope mt-0.5 text-[#8ec5eb]" aria-hidden />
                    <span>communitychange@andrews.edu</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <i className="fa-solid fa-globe mt-0.5 text-[#8ec5eb]" aria-hidden />
                    <span>communitychange.world</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default function ProcessingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#062946] px-4 text-white font-[Albert_Sans]">
          <div className="text-center">
            <i className="fa-solid fa-circle-notch animate-spin text-2xl text-[#8ec5eb]" aria-hidden />
            <p className="mt-3 text-sm text-[#cde2f2]">Loading application status...</p>
          </div>
        </div>
      }
    >
      <ProcessingPageContent />
    </Suspense>
  );
}
