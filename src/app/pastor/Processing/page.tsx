"use client";

import Link from "next/link";
<<<<<<< Updated upstream
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
=======
import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
>>>>>>> Stashed changes
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "../../Assets/hero-bg.png";
import { apiGetInterestByEmail } from "@/app/Services/interests.service";
import { getCookie } from "@/app/utils/cookies";
import { Interest } from "@/app/Services/types";

function normStatus(s: string | undefined | null): string {
  return String(s ?? "")
    .trim()
    .toLowerCase();
}

/**
 * Interest approval tracking — same visual system as `/pastor/Thankyou` and `/pastor/home`.
 * Copy aligns with CCC-Mobile pending panel; polling keeps status fresh after director action.
 */
function ProcessingPageContent() {
  const router = useRouter();
  const [interest, setInterest] = useState<Interest | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const navigatedRef = useRef(false);

  const fetchStatus = useCallback(async (): Promise<Interest | null> => {
    const email = getCookie("interestEmail");
    if (!email?.trim()) {
      setStatusError("No saved email. Open the interest link from your confirmation email or resubmit the form.");
      setInterest(null);
      return null;
    }

<<<<<<< Updated upstream
    const res = await apiGetInterestByEmail(email);
    const body = res.data;
=======
  if (!email?.trim()) {
    setStatusError("No saved email. Open the interest link from your confirmation email or resubmit the form.");
    setInterest(null);
    return null;
  }

  const res = await apiGetInterestByEmail(email);
    const body = res.data as { success?: boolean; data?: Interest | null };
>>>>>>> Stashed changes
    if (body && body.success === false) {
      const message = (res.data as { message?: string } | undefined)?.message;
      throw new Error(message || "Unable to load status");
    }
    const data = body?.data ?? null;
    setInterest(data);
    setStatusError(null);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setStatusLoading(true);
        const data = await fetchStatus();
        if (!cancelled) {
          const statusNorm = normStatus(data?.status);
          // Check if already accepted on load
          if (statusNorm === "accepted" && !navigatedRef.current) {
            navigatedRef.current = true;
            setTimeout(() => router.push("/pastor/setpassword"), 1500);
          }
        }
      } catch (err) {
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
  }, [fetchStatus, router]);

  useEffect(() => {
    const email = getCookie("interestEmail");
    if (!email?.trim()) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const tick = async () => {
      try {
        const data = await fetchStatus();
        const next = normStatus(data?.status);
<<<<<<< Updated upstream
        if (next === "accepted" && !navigatedRef.current) {
          navigatedRef.current = true;
          if (intervalId != null) window.clearInterval(intervalId);
          setTimeout(() => router.push("/pastor/setpassword"), 1500);
=======
        // if (next === "accepted" && !navigatedRef.current) {
        //   navigatedRef.current = true;
        //   if (intervalId != null) window.clearInterval(intervalId);
        //   setTimeout(() => router.push("/pastor/setpassword"), 1500);
        //   return;
        // }
        if (next === "accepted" && intervalId != null) {
          clearInterval(intervalId);
>>>>>>> Stashed changes
          return;
        }
        if (next === "rejected" && intervalId != null) {
          clearInterval(intervalId);
        }
      } catch (err) {
        // Polling failed, will retry next interval
      }
    };

    // Start polling immediately, then every 20 seconds
    tick();
    intervalId = setInterval(tick, 20000);
    return () => {
      if (intervalId != null) clearInterval(intervalId);
    };
  }, [fetchStatus, router]);

  const status = normStatus(interest?.status);
  const isAccepted = status === "accepted";
  const isRejected = status === "rejected";
  const isPending = !isAccepted && !isRejected && !statusError;

  const handleCheckStatus = async () => {
    const email = getCookie("interestEmail");
    if (!email) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      const data = await fetchStatus();
      const st = normStatus(data?.status);
      if (st === "accepted" && !navigatedRef.current) {
        navigatedRef.current = true;
        setTimeout(() => router.push("/pastor/setpassword"), 1500);
      }
    } catch (err) {
      setStatusError("Unable to load your status. Please try again later.");
    } finally {
      setStatusLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      <section
        className="relative flex-1 overflow-hidden bg-cover bg-top px-4 pb-16 pt-6 sm:px-8 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.72)_0%,rgba(6,41,70,0.78)_45%,rgba(6,41,70,0.96)_100%)]" />

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:items-start">
            {/* Live status pill — gradient when waiting; solid accents when terminal */}
            <div
              className={`inline-flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg sm:order-2 ${
                isAccepted
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
                  className={`h-2.5 w-2.5 rounded-full ${
                    isAccepted ? "bg-white" : isRejected ? "bg-white" : statusError ? "bg-white" : "bg-white"
                  }`}
                  style={
                    isPending && !statusLoading
                      ? { boxShadow: "0 0 0 3px rgba(255,255,255,0.25)" }
                      : undefined
                  }
                />
              )}
              {statusLoading
                ? "Checking status..."
                : statusError
                  ? "Could not load status"
                  : isAccepted
                    ? "Application accepted"
                    : isRejected
                      ? "Application not approved"
                      : "Waiting for Approval"}
              {!statusLoading && !statusError && (isPending || isAccepted || isRejected) && (
                <i className="fa-solid fa-chevron-right text-xs text-white/80" aria-hidden />
              )}
            </div>
            <p className="text-center text-xs uppercase tracking-[0.2em] text-white/75 sm:order-1 sm:text-left">
              Live status · updates
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7 xl:col-span-8">
              <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.55)_0%,rgba(9,49,80,0.72)_100%)] p-8 shadow-[0_20px_50px_rgba(2,20,38,0.4)] backdrop-blur-md md:p-10 lg:p-12">
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white/10 md:h-20 md:w-20">
                  {statusLoading ? (
                    <i className="fa-solid fa-spinner fa-spin text-3xl text-[#8ec5eb] md:text-4xl" aria-hidden />
                  ) : isAccepted ? (
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
                    ? "Checking your application…"
                    : statusError
                      ? "We couldn’t refresh your status"
                      : isAccepted
                        ? "Your application has been accepted!"
                        : isRejected
                          ? "Your application was not approved"
                          : "Your Application Under Review"}
                </h1>

                <div className="mt-6 max-w-2xl space-y-4 text-base leading-relaxed text-[#cde2f2] md:text-lg">
                  {statusError ? (
                    <p>{statusError}</p>
                  ) : isAccepted ? (
                    <>
<<<<<<< Updated upstream
                      <p>You’re approved to continue. You’ll be redirected to set your password shortly.</p>
                      <p>If nothing happens, go to Set Password from your email or open the button below.</p>
=======
                      <p>You’re approved to continue. Complete your account setup by creating your password.</p>
                      <div className="mt-6">
                        <SetPasswordInlinePanel />
                      </div>
>>>>>>> Stashed changes
                    </>
                  ) : isRejected ? (
                    <p>
                      If you have questions, please contact us using the information on this page. We’re grateful for
                      your interest in Community Change.
                    </p>
                  ) : (
                    <>
                      <p>Thank you for your submission.</p>
                      <p>Your application is under review.</p>
                      <p>We will notify you soon. God bless you!</p>
                    </>
                  )}
                </div>

                {isPending && !statusLoading && (
                  <p className="mt-6 flex flex-wrap items-center gap-2 text-sm text-[#8ec5eb]/95">
                    <i className="fa-solid fa-rotate text-[#8ec5eb]" aria-hidden />
                    This page rechecks your approval about every 20 seconds. Use{" "}
                    <strong className="font-semibold text-white">Check Status</strong> for an immediate refresh.
                  </p>
                )}

                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                  <button
                    type="button"
                    disabled={statusLoading}
                    onClick={handleCheckStatus}
                    className="rounded-xl bg-white px-8 py-3 text-sm font-semibold text-[#0f4a76] shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition hover:bg-[#e7f1fa] disabled:cursor-not-allowed disabled:opacity-70 md:px-10 md:text-base"
                  >
                    {statusLoading ? "Checking…" : "Check Status"}
                  </button>
                  {isAccepted && (
                    <button
                      type="button"
                      onClick={() => router.push("/pastor/setpassword")}
                      className="rounded-xl border border-white/30 bg-white/10 px-8 py-3 text-sm font-semibold text-white transition hover:bg-white/15 md:text-base"
                    >
                      Go to Set Password
                    </button>
                  )}
                  <Link
                    href="/pastor/Thankyou"
                    className="text-center text-sm font-medium text-[#8ec5eb] underline-offset-4 hover:underline sm:text-left"
                  >
                    Thank you page
                  </Link>
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

              <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(15,74,118,0.5)_0%,rgba(9,49,80,0.65)_100%)] p-6 backdrop-blur-md">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <i className="fa-solid fa-satellite-dish text-[#8ec5eb]" aria-hidden />
                  </div>
                  <h2 className="text-xl font-semibold text-white">How this page works</h2>
                </div>
                <ul className="space-y-3 text-sm leading-relaxed text-[#cde2f2]">
                  <li className="flex gap-2">
                    <span className="text-[#8ec5eb]">•</span>
                    <span>Loads your real status from the server (same email you used on the form).</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#8ec5eb]">•</span>
                    <span>Polls in the background so you see approval without refreshing manually.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-[#8ec5eb]">•</span>
                    <span>
                      The{" "}
                      <Link href="/pastor/Thankyou" className="font-semibold text-[#8ec5eb] underline-offset-2 hover:underline">
                        confirmation screen
                      </Link>{" "}
                      only says we received your form — it does not check status.
                    </span>
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
