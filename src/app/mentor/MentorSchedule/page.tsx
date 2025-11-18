"use client";
import { useState } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "../../Assets/appointment-bg.png";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import UserProfile from "../../Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";

export default function MentorSchedule() {
  const [activeTab, setActiveTab] = useState<
    "Appointments" | "Availability" | "Schedule"
  >("Appointments");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<1 | 2>(1);
  const [showMenu, setShowMenu] = useState<number | null>(null);
  const [showToast, setShowToast] = useState(false);

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

  const handleReschedule = () => {
    setShowMenu(null);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FB] text-[#0B1C58] relative">
      <MentorHeader showFullHeader={true} />

      {/* 🟦 HERO SECTION */}
      <section
        className="relative h-[260px] flex flex-col justify-center px-4 md:px-20 text-white bg-cover bg-center"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A3C8C]/90 to-[#052860]/70"></div>
        <h1 className="relative z-10 text-4xl font-semibold tracking-wide">
          Schedule
        </h1>
      </section>

      {/* 🟩 TAB CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 md:px-20 py-8 bg-[#176192] gap-5">
        <input
          type="text"
          placeholder="Enter a date (dd-mm-yyyy)"
          className="w-full sm:w-[320px] border bg-white border-[#DDE2EB] rounded-md px-4 py-2 text-sm text-gray-600 shadow-sm focus:outline-none focus:border-[#103C8C]"
        />
        <div className="flex gap-3 flex-wrap">
          {["Appointments", "Availability", "Schedule"].map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab as any);
                if (tab === "Schedule") {
                  // setDrawerStep(1);
                  setIsDrawerOpen(true);
                }
              }}
              className={`px-3 sm:px-5 py-2 text-sm rounded-md font-medium transition-all ${
                activeTab === tab
                  ? "bg-[#103C8C] text-white shadow-sm"
                  : "bg-white text-[#103C8C] border border-[#103C8C] hover:bg-[#F5F8FF]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 🟦 TAB CONTENT */}
      <main className="flex-1 bg-[#176192] text-white px-4 md:px-20 pb-20">
        {/* 🟨 APPOINTMENTS TAB */}
        {activeTab === "Appointments" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Calendar */}
            <div className="bg-[#0C4A85] rounded-2xl p-6 text-white shadow-md">
              <h3 className="text-[15px] font-medium mb-4 flex items-center gap-2">
                <i className="fa-regular fa-calendar"></i> Monthly Meeting
                Calendar
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

            {/* Appointments List */}
            <div>
              <h3 className="text-[15px] font-semibold mb-4 text-white">
                You have {appointmentsToday.length} Appointments Today
              </h3>

              <div className="flex flex-col gap-6">
                {appointmentsToday.map((appt, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] flex items-center gap-5 relative"
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
                          <p className="text-[12px] text-gray-500">
                            {appt.role}
                          </p>
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

                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowMenu(showMenu === index ? null : index)
                            }
                            className="text-[#103C8C] px-3 py-1 hover:text-[#0B2E72]"
                          >
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                          </button>
                          {showMenu === index && (
                            <div className="absolute right-0 top-8 bg-white text-[#0B1C58] text-sm rounded-md shadow-md border z-10 w-[200px]">
                              <button
                                onClick={handleReschedule}
                                className="w-full text-left px-4 py-2 hover:bg-[#F5F8FF]"
                              >
                                <i className="fa-regular fa-calendar-check mr-2 text-[#103C8C]"></i>
                                Reschedule Meeting
                              </button>
                              <button className="w-full text-left px-4 py-2 hover:bg-[#F5F8FF]">
                                <i className="fa-regular fa-circle-xmark mr-2 text-[#B91C1C]"></i>
                                Cancel Meeting
                              </button>
                              <button className="w-full text-left px-4 py-2 hover:bg-[#F5F8FF]">
                                <i className="fa-regular fa-clock mr-2 text-[#0B1C58]"></i>
                                Change Meeting Mode
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 🟧 AVAILABILITY TAB */}
        {activeTab === "Availability" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="bg-[#0C4A85] p-6 rounded-2xl text-white shadow-md">
              <h3 className="text-[15px] font-medium mb-5">
                My Weekly Availability
              </h3>
              <div className="bg-[#103C8C] rounded-xl p-5 text-center mb-6">
                <p className="text-sm text-white/70 mb-2">August 2024</p>
                <div className="grid grid-cols-7 gap-2 text-[13px]">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (d) => (
                      <div
                        key={d}
                        className={`py-2 rounded-md ${
                          d === "Wed"
                            ? "bg-[#00B3FF] text-white font-bold"
                            : "text-white/80 hover:bg-[#00B3FF]/40 cursor-pointer"
                        }`}
                      >
                        {d}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Dropdowns */}
              <div className="grid grid-cols-2 gap-4">
                <select className="bg-white text-[#0B1C58] px-3 py-2 rounded-md text-sm">
                  <option>60 Minutes</option>
                  <option>30 Minutes</option>
                </select>
                <select className="bg-white text-[#0B1C58] px-3 py-2 rounded-md text-sm">
                  <option>5</option>
                  <option>10</option>
                </select>
                <select className="bg-white text-[#0B1C58] px-3 py-2 rounded-md text-sm">
                  <option>2 Days</option>
                  <option>1 Day</option>
                </select>
                <select className="bg-white text-[#0B1C58] px-3 py-2 rounded-md text-sm">
                  <option>Zoom</option>
                  <option>Google Meet</option>
                </select>
              </div>
            </div>

            {/* Available Hours */}
            <div className="text-white">
              <h3 className="text-[15px] font-medium mb-3">Available Hours</h3>
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                (day) => (
                  <div
                    key={day}
                    className="flex items-center gap-3 mb-3 border-b border-white/20 pb-2"
                  >
                    <input
                      type="checkbox"
                      defaultChecked
                      className="accent-[#103C8C]"
                    />
                    <p className="w-[100px]">{day}</p>
                    <select className="bg-white text-[#0B1C58] rounded-md text-xs px-2 py-1">
                      <option>10:00 AM</option>
                      <option>03:00 PM</option>
                    </select>
                    <span>to</span>
                    <select className="bg-white text-[#0B1C58] rounded-md text-xs px-2 py-1">
                      <option>07:00 PM</option>
                      <option>09:00 PM</option>
                    </select>
                    <button className="bg-white text-[#103C8C] text-xs px-3 py-[4px] rounded-md ml-2">
                      + Add
                    </button>
                  </div>
                )
              )}
            </div>
          </div>
        )}
      </main>

      {/* 🟩 SCHEDULE DRAWER */}
      {activeTab === "Schedule" && isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-[1px] z-40"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-white text-[#0B1C58] z-50 shadow-2xl transition-transform duration-300">
            {/* Step 1: Select Pastor/Director */}
            {drawerStep === 1 && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold">New Meeting</h2>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="text-gray-400 hover:text-[#103C8C]"
                  >
                    <i className="fa-solid fa-xmark text-xl"></i>
                  </button>
                </div>

                {/* Tabs */}
                <div className="flex gap-3 mb-4">
                  <button className="bg-[#103C8C] text-white text-sm font-medium px-4 py-2 rounded-md">
                    Pastor
                  </button>
                  <button className="bg-white border border-[#103C8C] text-[#103C8C] text-sm font-medium px-4 py-2 rounded-md">
                    Director
                  </button>
                </div>

                {/* Search */}
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full border border-[#D1D5DB] rounded-md px-4 py-2 text-sm mb-4"
                />

                {/* List */}
                <div className="flex flex-col gap-3 overflow-y-auto max-h-[380px]">
                  {Array(6)
                    .fill(0)
                    .map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-4 border border-gray-200 rounded-md px-4 py-2 hover:bg-[#F5F8FF] cursor-pointer"
                      >
                        <Image
                          src={UserProfile}
                          alt="User"
                          width={36}
                          height={36}
                          className="rounded-full"
                        />
                        <span className="font-medium text-sm">John Ross</span>
                      </div>
                    ))}
                </div>

                {/* Buttons */}
                <div className="flex justify-end gap-4 mt-6">
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="border border-[#103C8C] text-[#103C8C] text-sm font-medium px-6 py-[6px] rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setDrawerStep(2)}
                    className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-sm font-medium px-8 py-[6px] rounded-md"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Schedule Meeting */}
            {drawerStep === 2 && (
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <i className="fa-regular fa-calendar-days text-[#103C8C]"></i>
                    Schedule a Meeting
                  </h2>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="text-gray-400 hover:text-[#103C8C]"
                  >
                    <i className="fa-solid fa-xmark text-xl"></i>
                  </button>
                </div>

                {/* Calendar */}
                <div className="bg-[#0C4A85] text-white rounded-xl p-5 mb-6 text-center">
                  <p className="text-sm mb-2 text-white/70">August 2024</p>
                  <div className="grid grid-cols-7 gap-2 text-[13px]">
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

                {/* Times */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button className="border border-[#103C8C] text-[#103C8C] text-sm font-medium px-3 py-2 rounded-md hover:bg-[#F5F8FF]">
                    09:00 am - 10:00 am
                  </button>
                  <button className="border border-[#103C8C] text-[#103C8C] text-sm font-medium px-3 py-2 rounded-md hover:bg-[#F5F8FF]">
                    11:00 am - 12:00 pm
                  </button>
                  <button className="border border-[#103C8C] text-[#103C8C] text-sm font-medium px-3 py-2 rounded-md hover:bg-[#F5F8FF]">
                    01:00 pm - 02:00 pm
                  </button>
                  <button className="border border-[#103C8C] text-[#103C8C] text-sm font-medium px-3 py-2 rounded-md hover:bg-[#F5F8FF]">
                    03:00 pm - 04:00 pm
                  </button>
                  <button className="border border-[#103C8C] text-[#103C8C] text-sm font-medium px-3 py-2 rounded-md hover:bg-[#F5F8FF]">
                    05:00 pm - 06:00 pm
                  </button>
                </div>

                {/* Preferred meeting option */}
                <select className="w-full border border-[#D1D5DB] text-sm rounded-md px-3 py-2 text-[#0B1C58] mb-8">
                  <option>Preferred meeting option</option>
                  <option>Zoom</option>
                  <option>Google Meet</option>
                  <option>Duo</option>
                </select>

                {/* Buttons */}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="border border-[#103C8C] text-[#103C8C] text-sm font-medium px-6 py-[6px] rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      setIsDrawerOpen(false);
                      setDrawerStep(1);
                      setShowToast(true);
                      setTimeout(() => setShowToast(false), 3000);
                    }}
                    className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-sm font-medium px-8 py-[6px] rounded-md"
                  >
                    Schedule
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ✅ SUCCESS TOAST */}
      {showToast && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-lg px-10 py-5 flex items-center gap-3 animate-fade-in">
            <div className="text-green-600 text-2xl">✔</div>
            <p className="text-[#0B1C58] font-medium text-[15px]">
              The Appointment has been Rescheduled
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
