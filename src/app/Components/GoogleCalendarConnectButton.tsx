"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGetGoogleCalendarAuthUrl, unwrapGoogleOAuthRedirectUrl } from "@/app/Services/auth.service";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";
import { getCookie } from "@/app/utils/cookies";
import { apiGetUserById, unwrapUserResponse } from "@/app/Services/users.service";
import type { GoogleCalendarStatus } from "@/app/Services/types/users.types";

type Props = {
  variant?: "dark" | "light";
  className?: string;
  label?: string;
};

/**
 * Starts Google OAuth for Calendar linking: GET `/auth/google` with `Authorization: Bearer` (session cookie).
 * Always use the latest URL from the server response — do not stash or bookmark old OAuth URLs.
 */
export default function GoogleCalendarConnectButton({
  variant = "dark",
  className = "",
  label = "Link Google Calendar",
}: Props) {
  const [pending, setPending] = useState(false);
  const [errorHint, setErrorHint] = useState<string | null>(null);
  const [calendarStatus, setCalendarStatus] = useState<GoogleCalendarStatus | null>(null);

  const hasSession = !!getCookie("accessToken")?.trim();
  const userId = (getCookie("userId") || "").trim();

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!hasSession || !userId) return;
      try {
        const res = await apiGetUserById(userId);
        const user = unwrapUserResponse(res as { data?: unknown });
        const status = user?.googleCalendarStatus;
        if (!cancelled && status) setCalendarStatus(status);
      } catch {
        // Non-fatal: keep button usable even if profile load fails.
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [hasSession, userId]);

  const statusCopy = useMemo(() => {
    if (calendarStatus === "connected") return { icon: "✅", text: "Google Calendar Connected" };
    if (calendarStatus === "expired") return { icon: "⚠", text: "Reconnect Google Calendar" };
    if (calendarStatus === "error") return { icon: "⚠", text: "Calendar Connection Error" };
    if (calendarStatus === "disconnected") return { icon: "❌", text: "Calendar Disconnected" };
    return null;
  }, [calendarStatus]);

  const dynamicLabel =
    calendarStatus === "connected" || calendarStatus === "expired" || calendarStatus === "error"
      ? "Reconnect Google Calendar"
      : label;

  const base =
    variant === "light"
      ? "border border-gray-300 bg-white text-[#0B1C58] hover:bg-gray-50"
      : "border border-[#8ec5eb]/40 bg-[#8ec5eb]/10 text-[#d9ebf8] hover:bg-[#8ec5eb]/20";

  if (!hasSession) return null;

  return (
    <div className="inline-flex max-w-full flex-col gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={async () => {
          setErrorHint(null);
          setPending(true);
          try {
            const res = await apiGetGoogleCalendarAuthUrl();
            const url = unwrapGoogleOAuthRedirectUrl(res.data);
            if (url) {
              setCalendarStatus("connected");
              window.location.assign(url);
              return;
            }
            setErrorHint(
              "Calendar linking is not ready: the server did not return a Google sign-in URL. Ask the backend team to confirm GET /auth/google.",
            );
          } catch (e) {
            console.error(e);
            const msg = extractApiErrorMessage(e);
            const status = (e as { response?: { status?: number } })?.response?.status;
            if (status === 401) {
              setErrorHint("You need to be logged in first (session expired). Sign in again, then retry.");
            } else if (status === 404) {
              setErrorHint(
                "GET /auth/google is not available on this API build (404). Backend must expose Google OAuth bootstrap.",
              );
            } else {
              setErrorHint(msg);
            }
          } finally {
            setPending(false);
          }
        }}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${base} ${className}`}
      >
        {pending ? <i className="fa-solid fa-spinner fa-spin" aria-hidden /> : <i className="fa-brands fa-google" aria-hidden />}
        {pending ? "Opening Google…" : dynamicLabel}
      </button>
      {statusCopy ? (
        <p className="max-w-[min(420px,100%)] text-[11px] leading-snug text-[#fef3c7]">
          {statusCopy.icon} {statusCopy.text}
        </p>
      ) : null}
      {errorHint ? (
        <p className="max-w-[min(420px,100%)] text-[11px] leading-snug text-red-200/95" role="alert">
          {errorHint}
        </p>
      ) : null}
    </div>
  );
}
