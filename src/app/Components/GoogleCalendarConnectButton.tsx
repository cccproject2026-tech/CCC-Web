"use client";

import { useState } from "react";
import { apiGetGoogleCalendarAuthUrl, unwrapGoogleOAuthRedirectUrl } from "@/app/Services/auth.service";

type Props = {
  userId?: string | null;
  variant?: "dark" | "light";
  className?: string;
  label?: string;
};

/**
 * Starts Google OAuth for Calendar linking: GET `/auth/google?userId=` → redirect to returned `url`.
 */
export default function GoogleCalendarConnectButton({
  userId,
  variant = "dark",
  className = "",
  label = "Link Google Calendar",
}: Props) {
  const [pending, setPending] = useState(false);
  const id = String(userId ?? "").trim();
  if (!id) return null;

  const base =
    variant === "light"
      ? "border border-gray-300 bg-white text-[#0B1C58] hover:bg-gray-50"
      : "border border-[#8ec5eb]/40 bg-[#8ec5eb]/10 text-[#d9ebf8] hover:bg-[#8ec5eb]/20";

  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        try {
          const res = await apiGetGoogleCalendarAuthUrl(id);
          const url = unwrapGoogleOAuthRedirectUrl(res.data);
          if (url) {
            window.location.assign(url);
            return;
          }
        } catch (e) {
          console.error(e);
        } finally {
          setPending(false);
        }
      }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:opacity-60 ${base} ${className}`}
    >
      {pending ? <i className="fa-solid fa-spinner fa-spin" aria-hidden /> : <i className="fa-brands fa-google" aria-hidden />}
      {pending ? "Opening Google…" : label}
    </button>
  );
}
