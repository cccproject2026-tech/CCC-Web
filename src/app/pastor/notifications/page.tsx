"use client";
import PastorHeader from "@/app/Components/PastorHeader";
import { useState, useEffect } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { getNotifications } from "@/app/Services/pastor.service";
import { getCookie } from "@/app/utils/cookies";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const ICON_MAP: any = {
    microgrant: { icon: "fa-circle-check", color: "text-[#9ef0be]" },
    roadmap: { icon: "fa-map", color: "text-[#8ec5eb]" },
    appointment: { icon: "fa-calendar-check", color: "text-[#f7d37c]" },
    assessment: { icon: "fa-clipboard-check", color: "text-[#b9b4ff]" },
    assignment: { icon: "fa-file-alt", color: "text-[#ffcf9f]" },
    general: { icon: "fa-bell", color: "text-[#cde2f2]" }
  };

  useEffect(() => {
    async function loadNotifications() {
      try {
        const storedUser = JSON.parse(getCookie("user") || "{}");
        const userId = storedUser?.id;
        if (!userId) return;

        const res = await getNotifications(userId);

        const list = res.data?.data?.notifications || [];

        // Normalize notifications for UI
        const formatted = list.map((n: any, index: number) => ({
          id: index + 1,
          title: n.name,
          desc: n.details,
          module: n.module,
          time: n.createdAt ? new Date(n.createdAt).toLocaleString() : "Just now",
          icon: ICON_MAP[n.module]?.icon || "fa-bell",
          color: ICON_MAP[n.module]?.color || "text-gray-500"
        }));

        setNotifications(formatted);
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
            {notifications.map((note) => (
              <div
                key={note.id}
                className="rounded-xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-3 text-white shadow-sm transition hover:shadow-md sm:flex sm:items-start sm:justify-between sm:gap-0 sm:p-4"
              >
                {/* Left Section */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-base sm:text-lg ${note.color}`}
                  >
                    <i className={`fa-solid ${note.icon}`}></i>
                  </div>

                  <div>
                    <p className="font-semibold text-sm">{note.title}</p>
                    <p className="mt-1 text-xs text-[#cde2f2]">{note.desc}</p>
                  </div>
                </div>

                {/* Right Side: Time */}
                <div className="text-xs text-[#cde2f2] sm:mt-1">{note.time}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
