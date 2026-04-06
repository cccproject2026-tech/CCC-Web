"use client";

import { useEffect, useMemo, useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import { getCookie, setCookie } from "@/app/utils/cookies";

type Note = {
  id: number;
  title: string;
  desc: string;
  icon: string;
  color: string;
  time: string;
  tag?: string;
};

const sampleNotifications: Note[] = [
  {
    id: 1,
    title: "YOUR PROFILE IS INCOMPLETE",
    desc: "Interested in receiving mentoring in community engagement",
    icon: "fa-id-badge",
    color: "text-orange-500",
    time: "9:43 am",
  },
  {
    id: 2,
    title: "ROADMAP COMPLETED BY JOHN AND 3 OTHERS",
    desc: "CCC Module 3: Mission Basics",
    icon: "fa-route",
    color: "text-green-500",
    time: "9:40 am",
    tag: "⭐",
  },
  {
    id: 3,
    title: "ROADMAP DUE",
    desc: "CCC Module 4: Leadership & Vision",
    icon: "fa-map",
    color: "text-red-500",
    time: "9:40 am",
  },
  {
    id: 4,
    title: "ROBERT SUBMITTED ROADMAP (GOD’S VISION FOR YOUR CHURCH)",
    desc: "Interested in receiving mentoring in community engagement",
    icon: "fa-file-signature",
    color: "text-blue-400",
    time: "9:38 am",
  },
  {
    id: 5,
    title: "JOHN COMMENTED ON TANYA’S ROADMAP",
    desc: "Interested in receiving mentoring in community engagement",
    icon: "fa-comment-dots",
    color: "text-sky-500",
    time: "9:37 am",
  },
  {
    id: 6,
    title: "ROBERT FOX HAS A NEW QUERY",
    desc: "Interested in receiving mentoring in community engagement",
    icon: "fa-question-circle",
    color: "text-yellow-500",
    time: "9:35 am",
  },
  {
    id: 7,
    title: "ASSIGNMENT SUBMITTED BY JOHN AND 2 OTHERS",
    desc: "Mentoring Conversations | CCC Module 4",
    icon: "fa-file-alt",
    color: "text-green-500",
    time: "9:33 am",
  },
  {
    id: 8,
    title: "ASSESSMENT DUE",
    desc: "CCC Module 4: Personal Growth Assessment",
    icon: "fa-clipboard-check",
    color: "text-red-500",
    time: "9:32 am",
  },
  {
    id: 9,
    title: "APPOINTMENT WITH JOHN SCHEDULED ON 20 NOV 2024",
    desc: "Mentoring Session | CCC Roadmap Discussion",
    icon: "fa-calendar-check",
    color: "text-yellow-600",
    time: "9:30 am",
  },
  {
    id: 10,
    title: "APPOINTMENT CANCELED",
    desc: "Your mentoring appointment with Robert was canceled",
    icon: "fa-calendar-xmark",
    color: "text-red-600",
    time: "9:28 am",
  },
  {
    id: 11,
    title: "NEW MENTEES HAVE BEEN ASSIGNED",
    desc: "2 new mentees added to your dashboard",
    icon: "fa-users",
    color: "text-green-500",
    time: "9:25 am",
  },
  {
    id: 12,
    title: "DAVID (DIRECTOR) REVIEWED YOU AS A MENTOR",
    desc: "Reviewed in mentoring & community engagement",
    icon: "fa-user-check",
    color: "text-blue-500",
    time: "9:23 am",
  },
];

export default function NotificationsPage() {
  const glassPanel =
    "rounded-2xl border border-white/15 bg-white/5 backdrop-blur-md shadow-[0_24px_56px_rgba(2,20,38,0.18)]";

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [notifications, setNotifications] = useState<Note[]>([]);

  const enabledBadgeText = useMemo(() => {
    return notificationsEnabled ? "Enabled" : "Disabled";
  }, [notificationsEnabled]);

  useEffect(() => {
    const enabledCookie = getCookie("mentor_notifications_enabled");
    const enabled = enabledCookie === null ? true : enabledCookie !== "false";
    setNotificationsEnabled(enabled);
    setNotifications(enabled ? sampleNotifications : []);
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),radial-gradient(circle_at_48%_56%,rgba(111,178,246,0.12),transparent_42%),radial-gradient(circle_at_90%_80%,rgba(8,52,85,0.4),transparent_40%),linear-gradient(180deg,#041f35_0%,#062946_100%)]" />

      <MentorHeader showFullHeader={true} />

      <main className="relative z-10 flex-1 px-4 md:px-20 py-10 text-white overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className={`${glassPanel} p-5 sm:p-6 mb-6`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold">Notifications</h1>
                <p className="mt-1 text-sm text-[#cde2f2]">
                  {notificationsEnabled
                    ? "You are receiving updates."
                    : "Notifications are currently turned off."}
                </p>
              </div>

              <span className="rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs text-[#cde2f2]/90 whitespace-nowrap">
                {enabledBadgeText}
              </span>
            </div>
          </div>

          {!notificationsEnabled ? (
            <div className="text-center py-14">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full border border-white/20 bg-white/5 flex items-center justify-center">
                <i className="fa-solid fa-bell-slash text-3xl text-[#cde2f2]" />
              </div>
              <p className="text-white/80">Turn notifications on from here.</p>
              <button
                type="button"
                onClick={() => {
                  setCookie("mentor_notifications_enabled", "true", 30);
                  setNotificationsEnabled(true);
                  setNotifications(sampleNotifications);
                }}
                className="mt-4 rounded-xl bg-[#8ec5eb]/90 px-6 py-2.5 text-sm font-semibold text-[#062946] hover:bg-[#8ec5eb]"
              >
                Turn On Notifications
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {notifications.map((note) => (
                <div
                  key={note.id}
                  className="rounded-xl border border-white/15 bg-white/5 p-4 flex justify-between items-start gap-4 hover:bg-white/10 transition"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`mt-1 text-lg ${note.color} w-10 h-10 flex items-center justify-center bg-white/5 rounded-full border border-white/10`}
                    >
                      <i className={`fa-solid ${note.icon}`} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm leading-tight">
                          {note.title}
                        </p>
                        {note.tag && (
                          <span className="text-yellow-300 text-xs">
                            {note.tag}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#cde2f2]/80 mt-1">
                        {note.desc}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-[#cde2f2]/70 whitespace-nowrap">
                    {note.time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
