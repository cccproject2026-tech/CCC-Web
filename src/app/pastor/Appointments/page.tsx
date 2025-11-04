"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "../../Assets/appointment-bg.png";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import UserProfile from "../../Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function PastorAppointmentsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<"mentor" | "schedule">("mentor");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState("John Ross");
  const [selectedTime, setSelectedTime] = useState("");

  const appointmentsToday = [
    {
      mode: "Duo",
      date: "04 Aug 24",
      time: "11:30 hrs EST",
      mentor: "John Ross",
      role: "Mentor",
      icon: DuoIcon,
    },
    {
      mode: "Google Meet",
      date: "04 Aug 24",
      time: "11:30 hrs EST",
      mentor: "John Ross",
      role: "Mentor",
      icon: MeetIcon,
    },
  ];

  const mentors = [
    { name: "John Ross", role: "Mentor" },
    { name: "John Ross", role: "Field Mentor" },
    { name: "John Ross", role: "Mentor" },
    { name: "John Ross", role: "Mentor" },
    { name: "John Ross", role: "Field Mentor" },
    { name: "John Ross", role: "Mentor" },
  ];

  const handleSchedule = () => {
    setDrawerOpen(false);
    setShowPopup(true);
  };

  useEffect(() => {
    if (showPopup) {
      const t = setTimeout(() => setShowPopup(false), 2000);
      return () => clearTimeout(t);
    }
  }, [showPopup]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB] text-[#0B1C58] relative overflow-hidden">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative bg-cover bg-center h-[260px] flex flex-col justify-center px-20 text-white"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A3C8C]/90 to-[#052860]/70"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-semibold tracking-wide mt-30">
            Appointments
          </h1>
        </div>
      </section>

      {/* MAIN SECTION */}
      <main className="px-20 py-12 bg-[#176192]">
        {/* SEARCH + BUTTON */}
        <div className="flex justify-between items-center mb-10">
          <input
            type="text"
            placeholder="Enter a date (dd-mm-yyyy)"
            className="w-[320px] border bg-[white] border-[#DDE2EB] rounded-md px-4 py-2 text-sm text-gray-600 shadow-sm focus:outline-none focus:border-[#103C8C]"
          />
          <button
            onClick={() => {
              setDrawerOpen(true);
              setDrawerStep("mentor");
            }}
            className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm flex items-center gap-2"
          >
            <i className="fa-solid fa-plus text-xs"></i> New Meeting
          </button>
        </div>

        {/* CALENDAR + TODAY APPOINTMENTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Calendar */}
          <div className="bg-[#0C4A85] rounded-2xl p-6 text-white shadow-md">
            <h3 className="text-[15px] font-medium mb-4 flex items-center gap-2">
              <i className="fa-regular fa-calendar"></i> Monthly Meeting Calendar
            </h3>
            <div className="bg-[#103C8C] rounded-xl p-5 text-center">
              <p className="text-sm text-white/70 mb-2">August 2024</p>
              <div className="grid grid-cols-7 gap-2 text-[13px]">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={i} className="font-medium text-white/70">
                    {d}
                  </div>
                ))}
                {Array.from({ length: 31 }).map((_, i) => (
                  <div
                    key={i}
                    className={`py-1 rounded-md ${
                      i + 1 === 4
                        ? "bg-[#00B3FF] text-white font-bold"
                        : "text-white/80 hover:bg-[#00B3FF]/40 cursor-pointer"
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Today Appointments */}
          <div>
            <h3 className="text-[15px] font-semibold mb-4 text-[white]">
              You have {appointmentsToday.length} Appointments Today
            </h3>

            <div className="flex flex-col gap-6">
              {appointmentsToday.map((appt, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] flex items-center gap-5 hover:shadow-md transition-all"
                >
                  <div className="bg-[#F3F6FB] w-[100px] h-[100px] rounded-xl flex items-center justify-center">
                    <Image
                      src={appt.icon}
                      alt={appt.mode}
                      className="w-[55px] h-[55px]"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Image
                        src={UserProfile}
                        alt="Mentor"
                        width={36}
                        height={36}
                        className="rounded-full"
                      />
                      <div>
                        <h4 className="font-semibold text-[#0B1C58] text-sm">
                          {appt.mentor}
                        </h4>
                        <p className="text-[12px] text-gray-500">{appt.role}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-2">
                      <div className="flex items-center gap-2 bg-[#E8EFFB] px-3 py-[4px] rounded-md text-[12px] text-[#103C8C] font-medium">
                        <i className="fa-regular fa-calendar text-[#103C8C]"></i>
                        Date: {appt.date}
                      </div>
                      <div className="flex items-center gap-2 bg-[#E8EFFB] px-3 py-[4px] rounded-md text-[12px] text-[#103C8C] font-medium">
                        <i className="fa-regular fa-clock text-[#103C8C]"></i>
                        Time: {appt.time}
                      </div>
                    </div>

                    <p className="text-[12px] text-[#6B7280] mb-2">
                      Mode:{" "}
                      <span className="text-[#103C8C] font-semibold">
                        {appt.mode}
                      </span>
                    </p>

                    <div className="flex justify-between items-center">
                      <div className="flex gap-3 text-[#103C8C] text-[14px]">
                        <i className="fa-solid fa-phone cursor-pointer hover:text-[#0B1C58]"></i>
                        <i className="fa-regular fa-comment cursor-pointer hover:text-[#0B1C58]"></i>
                        <i className="fa-brands fa-whatsapp cursor-pointer hover:text-[#0B1C58]"></i>
                      </div>

                      <button className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-[12px] px-5 py-[6px] rounded-md font-medium">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* ✅ RIGHT DRAWER (Mentor / Schedule steps) */}
      {drawerOpen && (
        <div className="fixed top-0 right-0 w-[440px] h-full bg-white shadow-2xl z-50 flex flex-col animate-slide-left">
          {/* HEADER */}
          <div className="flex justify-between items-center px-6 py-5 border-b">
            <h2 className="text-[18px] font-semibold text-[#0B1C58] flex items-center gap-2">
              {drawerStep === "mentor" ? (
                <>Choose Mentor for the Meeting</>
              ) : (
                <>
                  <i className="fa-regular fa-calendar text-[#103C8C]"></i>
                  Schedule a Meeting
                </>
              )}
            </h2>
            <button
              onClick={() => setDrawerOpen(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {drawerStep === "mentor" ? (
              <>
                {/* Search */}
                <div className="relative mb-4">
                  <i className="fa-solid fa-magnifying-glass text-gray-400 absolute left-3 top-3"></i>
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#103C8C]"
                  />
                </div>

                {/* Mentor List */}
                <div className="space-y-2">
                  {mentors.map((m, i) => (
                    <div
                      key={i}
                      onClick={() => setSelectedMentor(m.name)}
                      className={`flex items-center justify-between px-4 py-3 border rounded-md cursor-pointer ${
                        selectedMentor === m.name
                          ? "border-[#103C8C] bg-[#F3F6FF]"
                          : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Image
                          src={UserProfile}
                          alt="mentor"
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                        <div>
                          <p className="text-sm font-medium text-[#0B1C58]">
                            {m.name}
                          </p>
                          <p className="text-xs text-gray-500">{m.role}</p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={selectedMentor === m.name}
                        readOnly
                        className="accent-[#103C8C]"
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Calendar */}
                <p className="text-sm font-medium mb-2 text-[#0B1C58]">
                  Select Available Date
                </p>
                <div className="bg-[#103C8C] rounded-xl p-4 text-white text-center mb-6">
                  <p className="text-sm text-white/70 mb-2">August 2024</p>
                  <div className="grid grid-cols-7 gap-2 text-[13px]">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={i} className="font-medium text-white/70">
                        {d}
                      </div>
                    ))}
                    {Array.from({ length: 31 }).map((_, i) => (
                      <div
                        key={i}
                        className={`py-1 rounded-md ${
                          i + 1 === 4
                            ? "bg-[#00B3FF] text-white font-bold"
                            : "text-white/80 hover:bg-[#00B3FF]/40 cursor-pointer"
                        }`}
                      >
                        {i + 1}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Time Slots */}
                <p className="text-sm font-medium mb-2 text-[#0B1C58]">
                  Select a Time
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    "09:00 am – 10:00 am",
                    "11:00 am – 12:00 pm",
                    "01:00 pm – 02:00 pm",
                    "03:00 pm – 04:00 pm",
                    "05:00 pm – 06:00 pm",
                  ].map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`px-3 py-2 rounded-md border text-sm ${
                        selectedTime === t
                          ? "bg-[#103C8C] text-white border-[#103C8C]"
                          : "border-gray-300 text-gray-700 hover:bg-[#F8FAFF]"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                {/* Dropdown */}
                <select className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:ring-1 focus:ring-[#103C8C] mb-6">
                  <option>Preferred meeting option</option>
                  <option>Duo</option>
                  <option>Google Meet</option>
                </select>
              </>
            )}
          </div>

          {/* FOOTER */}
          <div className="border-t px-6 py-4 flex justify-between">
            <button
              onClick={() =>
                drawerStep === "mentor"
                  ? setDrawerOpen(false)
                  : setDrawerStep("mentor")
              }
              className="text-[#103C8C] font-medium text-sm"
            >
              {drawerStep === "mentor" ? "Cancel" : "Back"}
            </button>

            {drawerStep === "mentor" ? (
              <button
                onClick={() => setDrawerStep("schedule")}
                className="bg-[#103C8C] hover:bg-[#0B2E72] text-white px-6 py-2 rounded-md text-sm font-medium"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSchedule}
                className="bg-[#103C8C] hover:bg-[#0B2E72] text-white px-6 py-2 rounded-md text-sm font-medium"
              >
                Schedule
              </button>
            )}
          </div>
        </div>
      )}

      {/* ✅ SUCCESS POPUP */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 animate-fade-in">
          <div className="bg-white rounded-lg shadow-lg px-10 py-6 flex items-center gap-3 text-[#0B1C58] font-medium text-[15px]">
            <i className="fa-solid fa-check text-green-600 text-xl"></i>
            New Appointment has been Scheduled
          </div>
        </div>
      )}
    </div>
  );
}
