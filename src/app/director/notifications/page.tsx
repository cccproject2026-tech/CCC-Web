"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { directorGlassCard, directorPageRoot } from "../directorUi";
import { getNotification } from "@/app/Services/api";
import type { NotificationItem } from "@/app/Services/types/home.types";
import {
  mapNotificationItemToPopup,
  resolveSessionUserId,
  unwrapNotificationsList,
} from "@/app/Services/notificationUi";

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const uid = resolveSessionUserId();
    if (!uid) {
      setLoading(false);
      setError("Sign in to view notifications.");
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {

        const res = await getNotification({ role: "director" });

        // if (!cancelled) setItems(list);
        const list = unwrapNotificationsList(res);
const newestFirst = [...list].reverse();

if (!cancelled) setItems(newestFirst);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Could not load notifications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={directorPageRoot}>
      <section className="flex-1 pb-16 pt-4">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-8">
            <h1 className="mb-2 text-3xl font-semibold text-white sm:text-[36px]">Notifications</h1>
            <div className="h-px w-full bg-white/20" />
          </div>

          {loading && (
            <div className={`flex items-center justify-center gap-3 py-20 ${directorGlassCard} rounded-2xl`}>
              <i className="fa-solid fa-spinner fa-spin text-2xl text-[#8ec5eb]" />
              <p className="text-white/70">Loading…</p>
            </div>
          )}

          {!loading && error && (
            <p className={`rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 ${directorGlassCard}`}>
              {error}
            </p>
          )}

          {!loading && !error && items.length === 0 && (
            <p className={`rounded-2xl px-6 py-12 text-center text-white/60 ${directorGlassCard}`}>No notifications yet.</p>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="space-y-4">
              {items.map((n) => {
                const p = mapNotificationItemToPopup(n);
                return (
                
                  <div
  key={n._id}
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
  className={`relative px-6 py-5 transition hover:border-white/25 ${directorGlassCard} ${
    p.link ? "cursor-pointer hover:bg-white/[0.03]" : ""
  }`}
>
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/10">
                          <i className={`${p.icon} text-lg ${p.iconColor}`} />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-start justify-between gap-3">
                          <h3 className="text-[15px] font-semibold leading-snug text-white">{p.title}</h3>
                          {!n.isRead && (
                            <span className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-[#FFD700]" title="Unread" />
                          )}
                        </div>
                        {p.subtitle && <p className="text-[13px] leading-relaxed text-white/65">{p.subtitle}</p>}
                        <p className="mt-2 text-[11px] text-white/45">{p.time}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
