"use client";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import { useState, useEffect } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { getNotifications } from "@/app/Services/pastor.service";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const ICON_MAP: any = {
    microgrant: { icon: "fa-circle-check", color: "text-green-600" },
    roadmap: { icon: "fa-map", color: "text-blue-500" },
    appointment: { icon: "fa-calendar-check", color: "text-yellow-500" },
    assessment: { icon: "fa-clipboard-check", color: "text-purple-500" },
    assignment: { icon: "fa-file-alt", color: "text-orange-500" },
    general: { icon: "fa-bell", color: "text-gray-500" }
  };

  useEffect(() => {
    async function loadNotifications() {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
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
          time: "Just now",
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
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0E458A] to-[#1B5FA9]">
      <PastorHeader showFullHeader={true} />

      <main className="flex-1 px-4 sm:px-10 md:px-20 py-5 sm:py-8 md:py-10 text-white">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 border-b border-white/30 pb-2">
            Notifications
          </h1>

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
                className="bg-white text-gray-800 rounded-md shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 hover:shadow-md transition"
              >
                {/* Left Section */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`mt-1 text-base sm:text-lg ${note.color} w-7 h-7 flex items-center justify-center bg-gray-100 rounded-full`}
                  >
                    <i className={`fa-solid ${note.icon}`}></i>
                  </div>

                  <div>
                    <p className="font-semibold text-sm">{note.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{note.desc}</p>
                  </div>
                </div>

                {/* Right Side: Time */}
                <div className="text-xs text-gray-500 sm:mt-1">{note.time}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
