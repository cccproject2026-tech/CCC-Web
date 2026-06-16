"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { directorGlassCard, directorPageRoot } from "../directorUi";
import { getNotification } from "@/app/Services/api";
import type { NotificationItem } from "@/app/Services/types/home.types";
import {
  mapNotificationItemToPopup,
  resolveSessionUserId,
  unwrapNotificationsList,
} from "@/app/Services/notificationUi";

const notificationsPerPage = 10;

const sortNotificationsNewestFirst = (list: NotificationItem[]) =>
  [...list].sort((a: any, b: any) => {
    const aTime = new Date(
      a.createdAt || a.updatedAt || a.date || a.time || a.timestamp || 0,
    ).getTime();

    const bTime = new Date(
      b.createdAt || b.updatedAt || b.date || b.time || b.timestamp || 0,
    ).getTime();

    return bTime - aTime;
  });

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
const newestFirst = sortNotificationsNewestFirst(list);

if (!cancelled) {
  setItems(newestFirst);
  setCurrentPage(1);
}
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

  const totalPages = Math.ceil(items.length / notificationsPerPage);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * notificationsPerPage;
    return items.slice(start, start + notificationsPerPage);
  }, [items, currentPage]);

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  function getPaginationItems(currentPage: number, totalPages: number): Array<number | "..."> {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 3) {
      return [1, 2, 3, "...", totalPages];
    }

    if (currentPage >= totalPages - 2) {
      return [1, "...", totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
  }

  const showingStart = items.length === 0 ? 0 : (currentPage - 1) * notificationsPerPage + 1;
  const showingEnd = Math.min(items.length, currentPage * notificationsPerPage);

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
            <>
            <div className="space-y-4">
              {paginatedItems.map((n) => {
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
            {totalPages > 1 && (
              <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
                <p className="text-sm text-white/60">
                  Showing {showingStart}-{showingEnd} of {items.length} notifications
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-white/75 transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {getPaginationItems(currentPage, totalPages).map((item, index) => {
                    if (item === "...") {
                      return (
                        <span key={`ellipsis-${index}`} className="px-2 text-sm text-white/50">
                          ...
                        </span>
                      );
                    }

                    const page = item;

                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => goToPage(page)}
                        className={`h-8 min-w-8 rounded-lg border px-2 text-xs font-semibold transition ${
                          currentPage === page
                            ? "border-[#8ec5eb] bg-[#8ec5eb] text-[#062946]"
                            : "border-white/15 text-white hover:bg-white/10"
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-white/15 px-3 py-2 text-sm font-medium text-white/75 transition hover:border-white/30 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
