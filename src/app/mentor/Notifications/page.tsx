"use client";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
// import PlaneIcon from "@/app/Assets/send-plane.png"; // add your paper-plane image here

export default function NotificationsPage() {
  const [notifications] = useState([
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
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#0E458A] to-[#1B5FA9] relative">
      {/* 🟣 HEADER */}
      <PastorHeader showFullHeader={true} />

      {/* 🟦 MAIN CONTENT */}
      <main className="flex-1 px-20 py-10 text-white overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-semibold mb-6 border-b border-white/30 pb-2">
            Notifications
          </h1>

          {/* LIST */}
          <div className="flex flex-col gap-3">
            {notifications.map((note) => (
              <div
                key={note.id}
                className="bg-white text-gray-800 rounded-md shadow-sm border border-gray-200 p-4 flex justify-between items-start hover:shadow-md transition"
              >
                {/* LEFT */}
                <div className="flex items-start gap-4">
                  <div
                    className={`mt-1 text-lg ${note.color} w-9 h-9 flex items-center justify-center bg-gray-100 rounded-full`}
                  >
                    <i className={`fa-solid ${note.icon}`}></i>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm leading-tight">
                        {note.title}
                      </p>
                      {note.tag && (
                        <span className="text-yellow-400 text-xs">{note.tag}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{note.desc}</p>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="text-xs text-gray-500 whitespace-nowrap ml-4">
                  {note.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 🟢 FIXED BOTTOM FLOAT BUTTON */}
      <button className="fixed bottom-6 right-6 w-[55px] h-[55px] rounded-full bg-gradient-to-r from-[#00B3FF] to-[#0057C2] flex items-center justify-center shadow-lg hover:scale-110 transition">
        <Image src="" alt="Send" width={24} height={24} />
      </button>
    </div>
  );
}
