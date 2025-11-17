"use client";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "request",
      title: "DAVID (DIRECTOR) HAS REQUESTED YOU TO BE A FIELD MENTOR",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      actions: ["Not Interested", "Accept"],
      icon: "fa-user-plus",
      color: "text-green-600",
    },
    {
      id: 2,
      type: "warning",
      title: "YOUR PROFILE IS INCOMPLETE",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-id-badge",
      color: "text-orange-500",
    },
    {
      id: 3,
      type: "update",
      title: "NEW ROADMAP ASSIGNED",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-map",
      color: "text-green-500",
    },
    {
      id: 4,
      type: "alert",
      title: "ROADMAP DUE TODAY",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-calendar-day",
      color: "text-red-500",
    },
    {
      id: 5,
      type: "info",
      title:
        "ROBERT HAS REQUESTED YOU TO SUBMIT ROADMAP (GOD’S VISION FOR YOUR CHURCH)",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-file-signature",
      color: "text-yellow-500",
    },
    {
      id: 6,
      type: "comment",
      title: "YOU HAVE A NEW COMMENT",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-comment",
      color: "text-blue-500",
    },
    {
      id: 7,
      type: "reply",
      title: "ROBERT FOX ANSWERED YOUR QUERY",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-reply",
      color: "text-sky-400",
    },
    {
      id: 8,
      type: "assignment",
      title: "YOU HAVE A NEW ASSIGNMENT",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-file-alt",
      color: "text-green-500",
    },
    {
      id: 9,
      type: "alert",
      title: "ASSIGNMENT DUE TODAY",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-exclamation-triangle",
      color: "text-red-500",
    },
    {
      id: 10,
      type: "assignment",
      title:
        "ROBERT HAS REQUESTED YOU TO SUBMIT ASSIGNMENT (MENTORING CONVERSATIONS)",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-file-pen",
      color: "text-yellow-500",
    },
    {
      id: 11,
      title:
        "ROBERT HAS REQUESTED YOU TO SUBMIT ASSIGNMENT (MENTORING CONVERSATIONS)",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-file-pen",
      color: "text-yellow-500",
      category: "Assignments",
    },
    {
      id: 12,
      title: "YOU HAVE A NEW ASSESSMENT",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-clipboard-check",
      color: "text-blue-500",
      category: "Assessments",
    },
    {
      id: 13,
      title: "ASSESSMENT DUE TODAY",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-calendar-day",
      color: "text-red-500",
      category: "Assessments",
    },
    {
      id: 14,
      title: "APPOINTMENT RESCHEDULED ON 20 NOV 2024",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-calendar-check",
      color: "text-yellow-600",
      category: "Appointments",
    },
    {
      id: 15,
      title: "APPOINTMENT CANCELED",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-calendar-xmark",
      color: "text-red-600",
      category: "Appointments",
    },
    {
      id: 16,
      title: "YOUR APPLICATION FOR GRANT APPROVED",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-circle-check",
      color: "text-green-500",
      category: "General",
    },
    {
      id: 17,
      title: "YOUR APPLICATION FOR GRANT NOT ACCEPTED",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-circle-xmark",
      color: "text-red-500",
      category: "General",
    },
    {
      id: 18,
      title: "YOUR CERTIFICATE HAS BEEN ISSUED",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-certificate",
      color: "text-green-500",
      category: "General",
    },
    {
      id: 19,
      title: "DAVID (DIRECTOR) ASSIGNED JOHN AS YOUR NEW MENTOR",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: "fa-user-tie",
      color: "text-blue-500",
      category: "Mentorship",
    },
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0E458A] to-[#1B5FA9]">
      {/* Header */}
      <PastorHeader showFullHeader={true} />

      {/* Main Section */}
      <main className="flex-1 px-4 sm:px-10 md:px-20 py-5 sm:py-8 md:py-10 text-white">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 border-b border-white/30 pb-2">
            Notifications
          </h1>

          {/* Notification List */}
          <div className="flex flex-col gap-4">
            {notifications.map((note) => (
              <div
                key={note.id}
                className="bg-white text-gray-800 rounded-md shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 hover:shadow-md transition"
              >
                {/* Left Side */}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div
                    className={`mt-1 text-base sm:text-lg ${note.color} w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-100 rounded-full`}
                  >
                    <i className={`fa-solid ${note.icon}`}></i>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{note.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{note.desc}</p>

                    {/* Optional buttons */}
                    {note.actions && (
                      <div className="flex gap-3 mt-3">
                        {note.actions.map((btn, idx) => (
                          <button
                            key={idx}
                            className={`px-3 py-[4px] rounded-md text-xs font-medium border ${
                              btn === "Accept"
                                ? "bg-[#103C8C] text-white border-[#103C8C] hover:bg-[#0D2E6E]"
                                : "border-gray-300 text-gray-700 hover:bg-gray-100"
                            } transition`}
                          >
                            {btn}
                          </button>
                        ))}
                      </div>
                    )}
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
