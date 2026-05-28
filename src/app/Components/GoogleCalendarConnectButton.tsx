"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiGetGoogleCalendarAuthUrl,
  apiGetGoogleCalendarStatus,
  unwrapGoogleOAuthRedirectUrl,
} from "@/app/Services/auth.service";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";
import { getCookie } from "@/app/utils/cookies";
import type {
  GoogleCalendarConnectionStatus,
  GoogleCalendarStatus,
} from "@/app/Services/types/users.types";

type Props = {
  variant?: "dark" | "light";
  className?: string;
  label?: string;
  onConnectionSynced?: () => void;
  onStatusChange?: (status: GoogleCalendarStatus | null) => void;
};

/**
 * Starts Google OAuth for Calendar linking: GET `/auth/google` with `Authorization: Bearer` (session cookie).
 * Always use the latest URL from the server response — do not stash or bookmark old OAuth URLs.
 */
export default function GoogleCalendarConnectButton({
  variant = "dark",
  className = "",
  label = "Link Google Calendar",
  onConnectionSynced,
  onStatusChange,
}: Props) {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [syncingAfterRedirect, setSyncingAfterRedirect] = useState(false);
  const [errorHint, setErrorHint] = useState<string | null>(null);

  const hasSession = !!getCookie("accessToken")?.trim();
  const userId = (getCookie("userId") || "").trim();

  const googleStatusKey = useMemo(() => ["google-calendar-status", userId] as const, [userId]);
  const { data: calendarConnectionStatus } = useQuery<GoogleCalendarConnectionStatus>({
    queryKey: googleStatusKey,
    enabled: hasSession && !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const res = await apiGetGoogleCalendarStatus();
      return res.data;
    },
  });
  const calendarStatus = calendarConnectionStatus?.status ?? null;

  useEffect(() => {
    onStatusChange?.(calendarStatus ?? null);
  }, [calendarStatus, onStatusChange]);

  useEffect(() => {
    const linked = searchParams.get("googleCalendar");
    if (!linked || !hasSession || !userId) return;
    if (linked !== "linked" && linked !== "1") return;

    let cancelled = false;
    setSyncingAfterRedirect(true);
    setErrorHint(null);

    void (async () => {
      try {
        await queryClient.invalidateQueries({ queryKey: ["current-user"] });
        await queryClient.invalidateQueries({ queryKey: ["mentor-availability"] });
        await queryClient.invalidateQueries({ queryKey: ["google-calendar-status"] });
        await queryClient.invalidateQueries({ queryKey: googleStatusKey });
        await queryClient.refetchQueries({ queryKey: googleStatusKey, exact: true });
        onConnectionSynced?.();
      } catch {
        // Keep the control usable even if refresh fails.
      } finally {
        if (!cancelled) setSyncingAfterRedirect(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams, hasSession, userId, queryClient, googleStatusKey, onConnectionSynced]);

  const statusCopy = useMemo(() => {
    if (calendarStatus === "expired") return { icon: "⚠", text: "Reconnect Google Calendar" };
    if (calendarStatus === "error") return { icon: "⚠", text: "Calendar Connection Error" };
    if (calendarStatus === "disconnected") return { icon: "❌", text: "Calendar Disconnected" };
    return null;
  }, [calendarStatus]);

  const dynamicLabel =
    calendarStatus === "expired" || calendarStatus === "error"
      ? "Reconnect Google Calendar"
      : label;

  const base =
    variant === "light"
      ? "border border-gray-300 bg-white text-[#0B1C58] hover:bg-gray-50"
      : "border border-[#8ec5eb]/40 bg-[#8ec5eb]/10 text-[#d9ebf8] hover:bg-[#8ec5eb]/20";

  if (!hasSession) return null;

  return (
    <div className="inline-flex max-w-full flex-col gap-1">
      {calendarStatus === "connected" ? (
        <div className={`inline-flex items-center gap-3 rounded-lg px-3 py-2 ${base} ${className}`} role="status" aria-live="polite">
          <span className="inline-flex items-center gap-2 text-xs font-semibold">
            <i className="fa-solid fa-check" aria-hidden />
            Google Calendar Connected
          </span>
          <span className="text-[11px] text-[#cde2f2]/90">
            {calendarConnectionStatus?.email
              ? `${calendarConnectionStatus.email} linked`
              : "Busy time sync enabled"}
          </span>
          {calendarConnectionStatus?.lastSyncAt ? (
            <span className="text-[11px] text-[#cde2f2]/80">
              Last synced {new Date(calendarConnectionStatus.lastSyncAt).toLocaleString()}
            </span>
          ) : null}
          <button
            type="button"
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
                const msg = extractApiErrorMessage(e);
                setErrorHint(msg);
              } finally {
                setPending(false);
              }
            }}
            className="text-[11px] font-semibold text-[#8ec5eb] underline underline-offset-2 transition hover:text-white"
          >
            Reconnect
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={pending || syncingAfterRedirect}
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
          {pending || syncingAfterRedirect ? (
            <i className="fa-solid fa-spinner fa-spin" aria-hidden />
          ) : (
            <i className="fa-brands fa-google" aria-hidden />
          )}
          {syncingAfterRedirect ? "Refreshing calendar status…" : pending ? "Opening Google…" : dynamicLabel}
        </button>
      )}
      {statusCopy ? (
        <p className="max-w-[min(420px,100%)] text-[11px] leading-snug text-[#fef3c7]">
          {statusCopy.icon} {statusCopy.text}
        </p>
      ) : null}
      {calendarStatus && calendarStatus !== "connected" && calendarConnectionStatus?.lastError ? (
        <p className="max-w-[min(420px,100%)] text-[11px] leading-snug text-amber-100/95">
          Last sync issue: {calendarConnectionStatus.lastError}
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
