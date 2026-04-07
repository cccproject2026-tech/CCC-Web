"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import HeroSection from "../../Components/HeroSection";
import WhatWeDoSection from "../../Components/WhatWeDoSection";
import { useRouter } from "next/navigation";
import { apiGetInterestByEmail } from "@/app/Services/interests.service";
import { getCookie } from "@/app/utils/cookies";
import { Interest } from "@/app/Services/types";

function normStatus(s: string | undefined | null): string {
  return String(s ?? "")
    .trim()
    .toLowerCase();
}

export default function Processing() {
  const router = useRouter();
  const [showPopup, setShowPopup] = useState(true);
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

    const res = await apiGetInterestByEmail(email);
    const body = res.data;
    if (body && body.success === false) {
      throw new Error(body.message || "Unable to load status");
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
        await fetchStatus();
      } catch (err) {
        console.error("Failed to fetch interest status:", err);
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
  }, [fetchStatus]);

  /** Poll every 20s so the banner updates after the director accepts (avoids stale nginx/CDN cache + no manual refresh). */
  useEffect(() => {
    const email = getCookie("interestEmail");
    if (!email?.trim()) return;

    let intervalId: ReturnType<typeof setInterval> | undefined;

    const tick = async () => {
      try {
        const data = await fetchStatus();
        const next = normStatus(data?.status);
        if (next === "accepted" && !navigatedRef.current) {
          navigatedRef.current = true;
          if (intervalId != null) window.clearInterval(intervalId);
          setTimeout(() => router.push("/pastor/setpassword"), 1500);
          return;
        }
        if (next === "rejected" && intervalId != null) {
          window.clearInterval(intervalId);
        }
      } catch {
        /* keep last good state */
      }
    };

    intervalId = window.setInterval(tick, 20000);
    return () => {
      if (intervalId != null) window.clearInterval(intervalId);
    };
  }, [fetchStatus, router]);

  const status = normStatus(interest?.status);
  const isAccepted = status === "accepted";
  const isRejected = status === "rejected";

  return (
    <div className="relative">
      {/* ✅ Hero Section */}
      <HeroSection
        title="Processing"
        subtitle="Your form submitted successfully please wait for approval"
        primaryBtn={{
          label: statusLoading ? "Checking..." : "Check Status",
          onClick: async () => {
            const email = getCookie("interestEmail");
            if (!email) return;
            setStatusLoading(true);
            setStatusError(null);
            setShowPopup(true);
            try {
              const data = await fetchStatus();
              const st = normStatus(data?.status);
              if (st === "accepted" && !navigatedRef.current) {
                navigatedRef.current = true;
                setTimeout(() => router.push("/pastor/setpassword"), 1500);
              }
            } catch (err) {
              console.error("Failed to fetch interest status:", err);
              setStatusError("Unable to load your status. Please try again later.");
            } finally {
              setStatusLoading(false);
            }
          },
        }}
        showContactBox={true}
      />

      {/* Status Banner */}
      {showPopup && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="flex items-center justify-between bg-[#1A2E7A] text-white px-6 py-3 rounded-lg shadow-lg min-w-[320px] gap-4">
            <div className="flex items-center gap-3">
              {statusLoading ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="animate-spin h-5 w-5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v2a6 6 0 00-6 6H4z" />
                </svg>
              ) : (
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isAccepted ? "bg-green-400" : isRejected ? "bg-red-400" : "bg-yellow-400"
                  }`}
                />
              )}
              <span className="font-medium text-sm tracking-wide">
                {statusLoading
                  ? "Checking status..."
                  : statusError
                    ? statusError
                    : isAccepted
                      ? "Your application has been accepted!"
                      : isRejected
                        ? "Your application was not approved."
                        : "Waiting for Approval"}
              </span>
            </div>
            <button
              onClick={() => setShowPopup(false)}
              className="text-white hover:text-gray-300 transition"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ✅ Below Section */}
      <WhatWeDoSection />
    </div>
  );
}
