"use client";

import { useState } from "react";
import { apiGetGoogleCalendarAuthUrl, unwrapGoogleOAuthRedirectUrl } from "@/app/Services/auth.service";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";
import { getCookie } from "@/app/utils/cookies";

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

  const hasSession = !!getCookie("accessToken")?.trim();
  if (!hasSession) return null;

  const base =
    variant === "light"
      ? "border border-gray-300 bg-white text-[#0B1C58] hover:bg-gray-50"
      : "border border-[#8ec5eb]/40 bg-[#8ec5eb]/10 text-[#d9ebf8] hover:bg-[#8ec5eb]/20";

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
        {pending ? "Opening Google…" : label}
      </button>
      {errorHint ? (
        <p className="max-w-[min(420px,100%)] text-[11px] leading-snug text-red-200/95" role="alert">
          {errorHint}
        </p>
      ) : null}
    </div>
  );
}
