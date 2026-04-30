"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import HeroBg from "../../Assets/hero-bg.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import { getCookie, setCookie } from "@/app/utils/cookies";
import { getMentorUserId } from "@/app/utils/mentor-auth";
import { getNotification } from "@/app/Services/api";
import type { NotificationItem } from "@/app/Services/types/home.types";
import {
  mapNotificationItemToPopup,
  unwrapNotificationsList,
} from "@/app/Services/notificationUi";
import {
  mentorBodyText,
  mentorHeroOverlay,
  mentorMainGradient,
  mentorPageRoot,
  mentorPrimaryCta,
  mentorSecondaryCta,
  mentorGlassCardFrost,
  mentorSpinner,
  mentorEmptyPanel,
} from "@/app/Components/mentor/mentor-theme";

const listRowClass =
  "rounded-xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-3 text-white shadow-sm transition hover:border-white/25 hover:shadow-md sm:flex sm:items-start sm:justify-between sm:gap-0 sm:p-4";

export default function NotificationsPage() {
  const router = useRouter();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = useCallback(async () => {
    const enabledCookie = getCookie("mentor_notifications_enabled");
    const enabled = enabledCookie === null ? true : enabledCookie !== "false";
    setNotificationsEnabled(enabled);

    if (!enabled) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    const mentorId = getMentorUserId();
    if (!mentorId) {
      setLoading(false);
      setError("Sign in as a mentor to view notifications.");
      setItems([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // const res = await getNotification(mentorId);
      // const list = unwrapNotificationsList(res);
      // setItems(list);
      const res = await getNotification(mentorId);
const list = unwrapNotificationsList(res);
const newestFirst = [...list].reverse();

setItems(newestFirst);
    } catch (e) {
      console.error("Mentor notifications:", e);
      setError("Could not load notifications.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleTurnOff = () => {
    setCookie("mentor_notifications_enabled", "false", 30);
    setNotificationsEnabled(false);
    setItems([]);
    setError(null);
    setLoading(false);
  };

  const handleTurnOn = () => {
    setCookie("mentor_notifications_enabled", "true", 30);
    setNotificationsEnabled(true);
    void loadNotifications();
  };

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <section
        className="relative flex min-h-[180px] flex-col justify-center bg-cover bg-center px-4 py-10 text-white sm:min-h-[220px] md:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className={mentorHeroOverlay} />
        <div className="relative z-10 max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
            <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
            Leadership Support Network
          </p>
          <h1 className="mt-3 text-2xl font-semibold sm:text-3xl md:text-4xl">Notifications</h1>
          <p className={`mt-2 max-w-2xl ${mentorBodyText}`}>
            Stay up to date with assessments, assignments, appointments, and roadmap activity — the same feed as in
            your header bell.
          </p>
        </div>
      </section>

      <main className={`${mentorMainGradient} flex-1 px-4 pb-16 pt-8 md:px-16 lg:px-20`}>
        <div className="mx-auto max-w-5xl">
          <div className={`${mentorGlassCardFrost} mb-6 p-5 sm:p-6`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Preferences</h2>
                <p className={`mt-1 ${mentorBodyText}`}>
                  {notificationsEnabled
                    ? "Browser alerts use your account notification list."
                    : "Alerts are paused. Turn them back on to load your list."}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="whitespace-nowrap rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-[#cde2f2]/90">
                  {notificationsEnabled ? "Enabled" : "Disabled"}
                </span>
                {notificationsEnabled ? (
                  <>
                    <button type="button" className={mentorSecondaryCta} onClick={() => void loadNotifications()}>
                      Refresh
                    </button>
                    <button type="button" className={mentorSecondaryCta} onClick={handleTurnOff}>
                      Turn off
                    </button>
                  </>
                ) : (
                  <button type="button" className={mentorPrimaryCta} onClick={handleTurnOn}>
                    Turn on notifications
                  </button>
                )}
              </div>
            </div>
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className={mentorSpinner} />
              <p className={`text-sm ${mentorBodyText}`}>Loading notifications…</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100">
              {error}
            </div>
          )}

          {!loading && !error && notificationsEnabled && items.length === 0 && (
            <div className={mentorEmptyPanel}>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/5">
                <i className="fa-regular fa-bell text-2xl text-[#8ec5eb]" aria-hidden />
              </div>
              <p className={`${mentorBodyText}`}>No notifications yet.</p>
            </div>
          )}

          {!loading && !error && notificationsEnabled && items.length > 0 && (
            <div className="flex flex-col gap-4">
              {items.map((note) => {
                const p = mapNotificationItemToPopup(note);
                return (
                  // <div key={note._id} className={listRowClass}>
                  <div
  key={note._id}
  role={p.link ? "button" : undefined}
  tabIndex={p.link ? 0 : undefined}
  onClick={() => {
    if (p.link) router.push(p.link);
  }}
  onKeyDown={(e) => {
    if (!p.link) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(p.link);
    }
  }}
  className={`${listRowClass} ${
    p.link ? "cursor-pointer hover:bg-white/[0.03]" : ""
  }`}
>
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-base sm:text-lg">
                        <i className={`${p.icon} ${p.iconColor}`} aria-hidden />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-start gap-2">
                          <p className="text-sm font-semibold leading-snug">{p.title}</p>
                          {!note.isRead && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#FFD700]" title="Unread" />
                          )}
                        </div>
                        {p.subtitle ? <p className="mt-1 text-xs text-[#cde2f2]">{p.subtitle}</p> : null}
                      </div>
                    </div>

                    <div className="mt-2 text-xs text-[#cde2f2] sm:mt-1 sm:text-right">{p.time}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
