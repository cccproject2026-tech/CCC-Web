"use client";
import PastorHeader from "@/app/Components/PastorHeader";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { getNotifications } from "@/app/Services/pastor.service";
import { getPastorUserId } from "@/app/utils/pastor-auth";
import { mapNotificationItemToPopup, unwrapNotificationsList } from "@/app/Services/notificationUi";
import type { NotificationItem } from "@/app/Services/types/home.types";

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNotifications() {
      try {
        const userId = getPastorUserId();
        if (!userId) return;

        const res = await getNotifications(userId);
        const list = unwrapNotificationsList(res);
        setNotifications(list);
      } catch (err) {
        console.error("Error loading notifications:", err);
      } finally {
        setLoading(false);
      }
    }

    loadNotifications();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_20%_10%,rgba(141,211,243,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)]">
      <PastorHeader showFullHeader={true} />

      <main className="flex-1 px-4 sm:px-10 md:px-20 py-5 sm:py-8 md:py-10 text-white">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-5 shadow-[0_20px_45px_rgba(2,20,38,0.35)]">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
              <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
              Leadership Support Network
            </p>
            <h1 className="mt-3 text-2xl font-semibold">Notifications</h1>
            <p className="mt-1 text-sm text-[#cde2f2]">
              Stay up to date with assessments, assignments, appointments, and roadmap activity.
            </p>
          </div>

          {loading && (
            <p className="text-center text-white/70 py-5">Loading notifications...</p>
          )}

          {/* If empty */}
          {!loading && notifications.length === 0 && (
            <p className="text-center text-white/70 py-5">
              No notifications available
            </p>
          )}

          {/* Notification List */}
          <div className="flex flex-col gap-4">
            {notifications.map((note) => {
              const p = mapNotificationItemToPopup(note);
              return (
                // <div
                //   key={note._id}
                //   className="rounded-xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-3 text-white shadow-sm transition hover:shadow-md sm:flex sm:items-start sm:justify-between sm:gap-0 sm:p-4"
                // >
                <div
  key={note._id}
  role={p.link ? "button" : undefined}
  tabIndex={p.link ? 0 : undefined}
  onClick={() => {
    if (p.link) {
      router.push(p.link);
    }
  }}
  onKeyDown={(e) => {
    if (!p.link) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(p.link);
    }
  }}
  className={`rounded-xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-3 text-white shadow-sm transition hover:shadow-md sm:flex sm:items-start sm:justify-between sm:gap-0 sm:p-4 ${
    p.link ? "cursor-pointer hover:bg-white/[0.03]" : ""
  }`}
>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-base sm:text-lg">
                      <i className={`${p.icon} ${p.iconColor}`} aria-hidden />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-start gap-2">
                        <p className="font-semibold text-sm">{p.title}</p>
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
        </div>
      </main>
    </div>
  );
}
