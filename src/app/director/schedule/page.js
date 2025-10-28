"use client";
import { useState } from "react";
import AppHeader from "@/app/Components/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import Mentor1 from "../../Assets/mentor1.png";
import DuoLogo from "../../Assets/duo.png";
import MeetLogo from "../../Assets/meet.png";
import Image from "next/image";

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState("appointments");
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showChangeModeModal, setShowChangeModeModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(4);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedMeetingMode, setSelectedMeetingMode] = useState("Zoom");
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [activeFilterTab, setActiveFilterTab] = useState("Mentor");
  const [toast, setToast] = useState(null);
  const [currentMonth, setCurrentMonth] = useState("August 2024");

  const appointments = [
    {
      id: 1,
      mode: "Duo",
      name: "John Ross",
      role: "Mentor",
      date: "04 Aug 24",
      time: "11:30 hrs EST",
      icon: "📹",
    },
    {
      id: 2,
      mode: "Google Meet",
      name: "John Ross",
      role: "Field Mentor",
      date: "04 Aug 24",
      time: "11:30 hrs EST",
      icon: "📹",
    },
  ];

  const nextAppointments = [
    {
      id: 3,
      mode: "Duo",
      name: "John Ross",
      role: "Pastor",
      date: "04 Aug 24",
      time: "11:30 hrs EST",
      icon: "📹",
    },
    {
      id: 4,
      mode: "Google Meet",
      name: "John Ross",
      role: "Mentor",
      date: "04 Aug 24",
      time: "11:30 hrs EST",
      icon: "📹",
    },
  ];

  const mentors = [
    { id: 1, name: "John Ross", role: "Mentor" },
    { id: 2, name: "John Ross", role: "Mentor" },
    { id: 3, name: "John Ross", role: "Mentor" },
    { id: 4, name: "John Ross", role: "Mentor" },
    { id: 5, name: "John Ross", role: "Mentor" },
    { id: 6, name: "John Ross", role: "Mentor" },
    { id: 7, name: "John Ross", role: "Mentor" },
  ];

  const fieldMentors = [
    { id: 1, name: "John Ross", role: "Field Mentor" },
    { id: 2, name: "John Ross", role: "Field Mentor" },
  ];

  const pastors = [
    { id: 1, name: "John Ross", role: "Pastor" },
    { id: 2, name: "John Ross", role: "Pastor" },
  ];

  const handleSchedule = () => {
    setShowScheduleModal(false);
    setShowNewMeetingModal(true);
    setToast("New Appointment has been Scheduled");
    setTimeout(() => setToast(null), 3000);
  };

  const handleReschedule = () => {
    setShowRescheduleModal(false);
    setToast("The Appointment has been Rescheduled");
    setTimeout(() => setToast(null), 3000);
  };

  const handleChangeMode = () => {
    setShowChangeModeModal(false);
    setToast(`Meeting Mode has been Changed to ${selectedMeetingMode}`);
    setTimeout(() => setToast(null), 3000);
    setShowMentorModal(true);
  };

  const handleMentorNext = () => {
    if (selectedMentor) {
      setShowMentorModal(false);
      setShowScheduleModal(true);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(false);
    setToast("Meeting has been Canceled");
    setTimeout(() => setToast(null), 3000);
  };

  const handleNewMeeting = () => {
    setShowNewMeetingModal(false);
    setToast("New Meeting Created Successfully");
    setTimeout(() => setToast(null), 3000);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      onClick={() => setOpenMenuId(null)}
      style={{
        background:
          "linear-gradient(180deg, #1e5a8e 0%, #2566a0 50%, #2876AC 100%)",
      }}
    >
      <AppHeader showFullHeader={true} />

      {/* Hero Section with Wavy Background */}
      <div className="relative bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] overflow-hidden">
        {/* Wavy Pattern Overlay */}
        <div className="absolute inset-0 opacity-30">
          <svg
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="rgba(255,255,255,0.1)"
              fillOpacity="1"
              d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,128C672,107,768,85,864,90.7C960,96,1056,128,1152,138.7C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
            <path
              fill="rgba(255,255,255,0.1)"
              fillOpacity="1"
              d="M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,208C672,213,768,203,864,202.7C960,203,1056,213,1152,213.3C1248,213,1344,203,1392,197.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            ></path>
          </svg>
        </div>
        <div className="relative z-10 py-16 px-6 text-center">
          <h1 className="text-5xl font-bold text-white tracking-wide">
            Schedule
          </h1>
        </div>
      </div>

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Search and Tabs */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
            {/* Search Bar */}
            <div className="relative w-full max-w-md">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Enter a date (dd-mm-yyyy)"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white text-gray-900 placeholder-gray-500 shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
              />
            </div>

            {/* Tabs and Schedule Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("appointments")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${
                  activeTab === "appointments"
                    ? "bg-white text-gray-800"
                    : "bg-white/70 text-gray-600 hover:bg-white"
                }`}
              >
                Appointments
              </button>
              <button
                onClick={() => setActiveTab("availability")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all shadow-md ${
                  activeTab === "availability"
                    ? "bg-white text-gray-800"
                    : "bg-white/70 text-gray-600 hover:bg-white"
                }`}
              >
                Availability
              </button>
              <button
                onClick={() => setShowMentorModal(true)}
                className="px-6 py-3 bg-white text-[#1e3a8a] rounded-xl font-semibold hover:bg-white/90 flex items-center gap-2 shadow-md transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Schedule
              </button>
            </div>
          </div>

          {/* Content Based on Tab */}
          {activeTab === "appointments" ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-1">
                  <div
                    className="rounded-2xl shadow-2xl p-6"
                    style={{
                      background:
                        "linear-gradient(135deg, #2d3e7f 0%, #3b4b8f 100%)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-6">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <h3 className="text-lg font-bold text-white">
                        Monthly Meeting Calendar
                      </h3>
                    </div>

                    {/* Calendar Header */}
                    <div
                      className="rounded-xl p-5 mb-4"
                      style={{
                        background:
                          "linear-gradient(135deg, #3d4d8f 0%, #4a5a9f 100%)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <button className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15 19l-7-7 7-7"
                            />
                          </svg>
                        </button>
                        <h4 className="text-xl font-bold text-white">
                          {currentMonth}
                        </h4>
                        <button className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors">
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Week Days */}
                      <div className="grid grid-cols-7 gap-2 mb-3">
                        {["S", "M", "T", "W", "T", "F", "S"].map((day, idx) => (
                          <div
                            key={idx}
                            className="text-center text-sm font-bold text-white py-2"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar Grid */}
                      <div className="grid grid-cols-7 gap-2">
                        {[...Array(31)].map((_, i) => {
                          const date = i + 1;
                          const hasAppointment = [
                            4, 11, 14, 17, 19, 22, 27, 30,
                          ].includes(date);
                          const isToday = date === selectedDate;
                          return (
                            <button
                              key={date}
                              onClick={() => setSelectedDate(date)}
                              className={`aspect-square flex items-center justify-center rounded-lg text-sm font-semibold transition-all ${
                                isToday
                                  ? "bg-white text-[#1e3a8a] shadow-lg scale-110"
                                  : hasAppointment
                                  ? "bg-blue-700/50 text-white hover:bg-blue-700/70"
                                  : "text-white/80 hover:bg-white/10"
                              }`}
                            >
                              {date}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appointments */}
                <div className="lg:col-span-2">
                  <h3 className="text-2xl font-bold text-white mb-6">
                    You have <span className="text-yellow-300">2</span>{" "}
                    Appointments Today
                  </h3>
                  <div className="space-y-5">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="rounded-2xl shadow-2xl p-6 relative border-2"
                        style={{
                          background:
                            "linear-gradient(135deg, #0e4c6d 0%, #125f81 100%)",
                          borderColor: "#20a4c5",
                        }}
                      >
                        {/* Three Dots Menu */}
                        <div className="absolute top-6 right-6 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === apt.id ? null : apt.id
                              );
                            }}
                            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </button>
                          {openMenuId === apt.id && (
                            <div className="absolute top-12 right-0 bg-white rounded-xl shadow-2xl w-64 overflow-hidden">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setShowRescheduleModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-blue-50 border-b border-gray-100 transition-colors"
                              >
                                <svg
                                  className="w-5 h-5 text-[#1e3a8a]"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="font-medium">
                                  Reschedule Meeting
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setShowCancelModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-red-50 border-b border-gray-100 transition-colors"
                              >
                                <svg
                                  className="w-5 h-5 text-red-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                                <span className="font-medium">
                                  Cancel Meeting
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setShowChangeModeModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-green-50 transition-colors"
                              >
                                <svg
                                  className="w-5 h-5 text-green-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                                <span className="font-medium">
                                  Change Meeting Mode
                                </span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-start gap-5">
                          {/* Meeting Logo */}
                          <div className="bg-white rounded-2xl p-6 shadow-xl">
                            <Image
                              src={apt.mode === "Duo" ? DuoLogo : MeetLogo}
                              alt={apt.mode}
                              width={100}
                              height={100}
                              className="w-24 h-24 object-contain"
                            />
                          </div>

                          {/* Content */}
                          <div className="flex-1">
                            {/* Profile */}
                            <div className="flex items-center gap-3 mb-4">
                              <Image
                                src={Mentor1}
                                alt={apt.name}
                                width={45}
                                height={45}
                                className="rounded-full ring-2 ring-white"
                              />
                              <div>
                                <h4 className="font-bold text-white text-lg">
                                  {apt.name}
                                </h4>
                                <p className="text-sm text-blue-200">
                                  {apt.role}
                                </p>
                              </div>
                            </div>

                            {/* Date & Time */}
                            <div className="flex flex-wrap items-center gap-4 mb-3">
                              <span className="flex items-center gap-2 text-white text-sm bg-white/20 px-3 py-1.5 rounded-lg">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                Date : {apt.date}
                              </span>
                              <span className="flex items-center gap-2 text-white text-sm bg-white/20 px-3 py-1.5 rounded-lg">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Time : {apt.time}
                              </span>
                            </div>

                            {/* Mode Badge */}
                            <span className="inline-block px-4 py-1.5 bg-blue-500 text-white text-sm font-semibold rounded-full mb-4">
                              Mode : {apt.mode}
                            </span>

                            {/* Action Icons & Button */}
                            <div className="flex items-center justify-between mt-4">
                              <div className="flex items-center gap-4">
                                <button className="text-white hover:text-blue-200 transition-colors">
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                    />
                                  </svg>
                                </button>
                                <button className="text-white hover:text-blue-200 transition-colors">
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                    />
                                  </svg>
                                </button>
                                <button className="text-white hover:text-blue-200 transition-colors">
                                  <svg
                                    className="w-5 h-5"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                    />
                                  </svg>
                                </button>
                                <button className="text-white hover:text-blue-200 transition-colors">
                                  <svg
                                    className="w-5 h-5"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                  </svg>
                                </button>
                              </div>
                              <button className="px-6 py-2.5 bg-white text-[#1e3a8a] rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg">
                                Details
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Next Appointment Section - White Background */}
              <div className="bg-white py-12 -mx-4 sm:-mx-6 md:-mx-12 lg:-mx-20 px-4 sm:px-6 md:px-12 lg:px-20 mt-8">
                <div className="max-w-[1400px] mx-auto">
                  <h3 className="text-3xl font-bold text-gray-900 mb-8">
                    Next Appointment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {nextAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="rounded-2xl shadow-2xl p-6 relative border-2"
                        style={{
                          background:
                            "linear-gradient(135deg, #0e4c6d 0%, #125f81 100%)",
                          borderColor: "#20a4c5",
                        }}
                      >
                        {/* Three Dots Menu */}
                        <div className="absolute top-5 right-5 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === apt.id ? null : apt.id
                              );
                            }}
                            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                            </svg>
                          </button>
                          {openMenuId === apt.id && (
                            <div className="absolute top-12 right-0 bg-white rounded-xl shadow-2xl w-64 overflow-hidden z-20">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setShowRescheduleModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-blue-50 border-b border-gray-100 transition-colors"
                              >
                                <svg
                                  className="w-5 h-5 text-[#1e3a8a]"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="font-medium">
                                  Reschedule Meeting
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setShowCancelModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-red-50 border-b border-gray-100 transition-colors"
                              >
                                <svg
                                  className="w-5 h-5 text-red-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                                <span className="font-medium">
                                  Cancel Meeting
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setShowChangeModeModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-5 py-3.5 text-gray-700 hover:bg-green-50 transition-colors"
                              >
                                <svg
                                  className="w-5 h-5 text-green-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                  />
                                </svg>
                                <span className="font-medium">
                                  Change Meeting Mode
                                </span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Card Content */}
                        <div className="flex flex-col gap-4">
                          {/* Meeting Logo */}
                          <div className="bg-white rounded-2xl p-5 shadow-xl w-full flex items-center justify-center">
                            <Image
                              src={apt.mode === "Duo" ? DuoLogo : MeetLogo}
                              alt={apt.mode}
                              width={80}
                              height={80}
                              className="w-20 h-20 object-contain"
                            />
                          </div>

                          {/* Content */}
                          <div>
                            {/* Profile */}
                            <div className="flex items-center gap-3 mb-3">
                              <Image
                                src={Mentor1}
                                alt={apt.name}
                                width={40}
                                height={40}
                                className="rounded-full ring-2 ring-white"
                              />
                              <div>
                                <h4 className="font-bold text-white text-base">
                                  {apt.name}
                                </h4>
                                <p className="text-xs text-blue-200">
                                  {apt.role}
                                </p>
                              </div>
                            </div>

                            {/* Date & Time */}
                            <div className="flex flex-col gap-2 mb-3">
                              <span className="flex items-center gap-2 text-white text-xs bg-white/20 px-3 py-1.5 rounded-lg">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                Date : {apt.date}
                              </span>
                              <span className="flex items-center gap-2 text-white text-xs bg-white/20 px-3 py-1.5 rounded-lg">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                Time : {apt.time}
                              </span>
                            </div>

                            {/* Mode Badge */}
                            <span className="inline-block px-3 py-1 bg-blue-500 text-white text-xs font-semibold rounded-full mb-3">
                              Mode : {apt.mode}
                            </span>

                            {/* Action Icons & Button */}
                            <div className="flex items-center gap-3 mb-3">
                              <button className="text-white hover:text-blue-200 transition-colors">
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                  />
                                </svg>
                              </button>
                              <button className="text-white hover:text-blue-200 transition-colors">
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                  />
                                </svg>
                              </button>
                              <button className="text-white hover:text-blue-200 transition-colors">
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                  />
                                </svg>
                              </button>
                              <button className="text-white hover:text-blue-200 transition-colors">
                                <svg
                                  className="w-5 h-5"
                                  fill="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                </svg>
                              </button>
                            </div>

                            <button className="w-full px-5 py-2 bg-white text-[#1e3a8a] rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg">
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Availability */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  My Weekly Availability
                </h3>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                    <span className="font-semibold">Meeting Duration</span>
                    <select className="ml-auto px-3 py-2 border rounded-lg">
                      <option>60 Minutes</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                    <span className="font-semibold">
                      Min. Scheduling Notice
                    </span>
                    <select className="ml-auto px-3 py-2 border rounded-lg">
                      <option>2 Days</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                    <span className="font-semibold">Max. Booking per Day</span>
                    <select className="ml-auto px-3 py-2 border rounded-lg">
                      <option>5</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                    <span className="font-semibold">
                      Preferred Meeting Option
                    </span>
                    <select className="ml-auto px-3 py-2 border rounded-lg">
                      <option>Zoom</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Available Hours */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  Available Hours
                </h3>
                <div className="space-y-3">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                    (day, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          defaultChecked
                          className="w-5 h-5"
                        />
                        <span className="w-24 font-semibold">{day}</span>
                        <span className="flex-1">10:00 AM to 07:00 PM</span>
                        <button className="px-3 py-1 bg-[#2E3B8E] text-white rounded-lg text-sm hover:bg-[#1F2A6E]">
                          Add
                        </button>
                      </div>
                    )
                  )}
                </div>
                <button className="mt-6 w-full py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E]">
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 transform -translate-x-1/2 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl px-8 py-5 shadow-2xl flex items-center gap-4 border border-green-200">
            <svg
              className="w-8 h-8 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-[#1e3a8a] font-semibold text-lg">
              {toast}
            </span>
          </div>
        </div>
      )}

      {/* Mentor Selection Modal */}
      {showMentorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-8 py-6 flex items-center justify-between border-b-2 border-gray-200 z-10 rounded-t-3xl">
              <h2 className="text-2xl font-bold text-[#1e3a8a]">New Meeting</h2>
              <button
                onClick={() => setShowMentorModal(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-8">
              {/* Filter Tabs */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setActiveFilterTab("Mentor")}
                  className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                    activeFilterTab === "Mentor"
                      ? "bg-[#1e3a8a] text-white shadow-lg"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Mentor
                </button>
                <button
                  onClick={() => setActiveFilterTab("Field Mentor")}
                  className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                    activeFilterTab === "Field Mentor"
                      ? "bg-[#1e3a8a] text-white shadow-lg"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Field Mentor
                </button>
                <button
                  onClick={() => setActiveFilterTab("Pastor")}
                  className={`px-5 py-2.5 rounded-xl font-bold transition-all ${
                    activeFilterTab === "Pastor"
                      ? "bg-[#1e3a8a] text-white shadow-lg"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Pastor
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-6">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border-2 border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1e3a8a] focus:border-[#1e3a8a] transition-all"
                />
              </div>

              {/* Mentor List */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {(activeFilterTab === "Mentor"
                  ? mentors
                  : activeFilterTab === "Field Mentor"
                  ? fieldMentors
                  : pastors
                ).map((mentor) => (
                  <label
                    key={mentor.id}
                    className="flex items-center gap-4 p-4 hover:bg-blue-50 rounded-xl cursor-pointer transition-all border-2 border-transparent hover:border-blue-200"
                  >
                    <input
                      type="radio"
                      name="mentor"
                      value={mentor.id}
                      checked={selectedMentor === mentor.id}
                      onChange={() => setSelectedMentor(mentor.id)}
                      className="w-5 h-5 text-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a] cursor-pointer"
                    />
                    <Image
                      src={Mentor1}
                      alt={mentor.name}
                      width={50}
                      height={50}
                      className="rounded-full ring-2 ring-gray-200"
                    />
                    <div>
                      <div className="font-bold text-gray-900 text-lg">
                        {mentor.name}
                      </div>
                      <div className="text-sm text-gray-600">{mentor.role}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-8 py-6 flex items-center justify-end gap-4 border-t-2 border-gray-200 rounded-b-3xl">
              <button
                onClick={() => setShowMentorModal(false)}
                className="px-8 py-3 border-2 border-[#1e3a8a] text-[#1e3a8a] rounded-xl font-bold text-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleMentorNext}
                disabled={!selectedMentor}
                className={`px-8 py-3 rounded-xl font-bold text-lg transition-all shadow-lg ${
                  selectedMentor
                    ? "bg-[#1e3a8a] text-white hover:bg-[#1e40af]"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-8 py-6 flex items-center justify-between border-b-2 border-gray-200 rounded-t-3xl">
              <h2 className="text-2xl font-bold text-[#1e3a8a] flex items-center gap-3">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Schedule a Meeting
              </h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Calendar */}
              <div>
                <label className="block font-bold mb-3 text-gray-800 text-lg">
                  Choose Available Date
                </label>
                <div className="border-2 border-gray-200 rounded-2xl p-5 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <button className="text-gray-600 hover:bg-gray-200 p-2 rounded-lg transition-colors">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <span className="font-bold text-lg text-gray-800">
                      {currentMonth}
                    </span>
                    <button className="text-gray-600 hover:bg-gray-200 p-2 rounded-lg transition-colors">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-sm mb-3">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                      <div
                        key={idx}
                        className="text-center text-gray-600 font-bold p-2"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {[...Array(31)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setSelectedDate(i + 1)}
                        className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                          i + 1 === selectedDate
                            ? "bg-[#1e3a8a] text-white shadow-lg"
                            : "text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block font-bold mb-3 text-gray-800 text-lg">
                  Choose a Time
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "09:00 am - 10:00 am",
                    "11:00 am - 12:00 pm",
                    "01:00 pm - 02:00 pm",
                    "03:00 pm - 04:00 pm",
                    "05:00 pm - 06:00 pm",
                  ].map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`px-5 py-4 rounded-xl border-2 transition-all font-semibold ${
                        selectedTime === time
                          ? "border-[#1e3a8a] bg-[#1e3a8a] text-white shadow-lg"
                          : "border-gray-300 text-gray-700 hover:border-[#1e3a8a] hover:bg-blue-50"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meeting Mode Display */}
              <div>
                <label className="block font-bold mb-3 text-gray-800 text-lg">
                  Preferred meeting option
                </label>
                <div className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-semibold">
                  {selectedMeetingMode}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-8 py-6 flex items-center justify-end gap-4 border-t-2 border-gray-200 rounded-b-3xl">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-8 py-3 border-2 border-[#1e3a8a] text-[#1e3a8a] rounded-xl font-bold text-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                className="px-8 py-3 bg-[#1e3a8a] text-white rounded-xl font-bold text-lg hover:bg-[#1e40af] transition-all shadow-lg"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white px-8 py-6 flex items-center justify-between border-b-2 border-gray-200 rounded-t-3xl">
              <h2 className="text-2xl font-bold text-[#1e3a8a] flex items-center gap-3">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Reschedule Meeting
              </h2>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* Calendar */}
              <div>
                <label className="block font-bold mb-3 text-gray-800 text-lg">
                  Choose Available Date
                </label>
                <div className="border-2 border-gray-200 rounded-2xl p-5 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <button className="text-gray-600 hover:bg-gray-200 p-2 rounded-lg transition-colors">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <span className="font-bold text-lg text-gray-800">
                      {currentMonth}
                    </span>
                    <button className="text-gray-600 hover:bg-gray-200 p-2 rounded-lg transition-colors">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-sm mb-3">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, idx) => (
                      <div
                        key={idx}
                        className="text-center text-gray-600 font-bold p-2"
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {[...Array(31)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setSelectedDate(i + 1)}
                        className={`p-3 rounded-lg text-sm font-semibold transition-all ${
                          i + 1 === selectedDate
                            ? "bg-[#1e3a8a] text-white shadow-lg"
                            : "text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Time Slots */}
              <div>
                <label className="block font-bold mb-3 text-gray-800 text-lg">
                  Choose a Time
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    "09:00 am - 10:00 am",
                    "11:00 am - 12:00 pm",
                    "01:00 pm - 02:00 pm",
                    "03:00 pm - 04:00 pm",
                    "05:00 pm - 06:00 pm",
                  ].map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`px-5 py-4 rounded-xl border-2 transition-all font-semibold ${
                        selectedTime === time
                          ? "border-[#1e3a8a] bg-[#1e3a8a] text-white shadow-lg"
                          : "border-gray-300 text-gray-700 hover:border-[#1e3a8a] hover:bg-blue-50"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meeting Mode Display */}
              <div>
                <label className="block font-bold mb-3 text-gray-800 text-lg">
                  Preferred meeting option
                </label>
                <div className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-800 font-semibold">
                  {selectedMeetingMode}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white px-8 py-6 flex items-center justify-end gap-4 border-t-2 border-gray-200 rounded-b-3xl">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-8 py-3 border-2 border-[#1e3a8a] text-[#1e3a8a] rounded-xl font-bold text-lg hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                className="px-8 py-3 bg-[#1e3a8a] text-white rounded-xl font-bold text-lg hover:bg-[#1e40af] transition-all shadow-lg"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Meeting Mode Modal */}
      {showChangeModeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl max-w-md w-full mx-4 shadow-2xl">
            <div className="p-8">
              <h3 className="text-xl font-bold mb-6 text-gray-900 border-b-4 border-[#1e3a8a] pb-2 inline-block">
                Choose your meeting option
              </h3>
              <div className="space-y-3 mt-6">
                {["Zoom", "Google Meet", "Teams", "Whatsapp", "Phone call"].map(
                  (mode) => (
                    <label
                      key={mode}
                      className="flex items-center gap-3 cursor-pointer px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="relative flex items-center">
                        <input
                          type="radio"
                          name="meeting-mode"
                          value={mode}
                          checked={selectedMeetingMode === mode}
                          onChange={(e) =>
                            setSelectedMeetingMode(e.target.value)
                          }
                          className="w-5 h-5 text-[#1e3a8a] focus:ring-2 focus:ring-[#1e3a8a] cursor-pointer"
                        />
                      </div>
                      <span className="font-semibold text-gray-800 text-lg">
                        {mode}
                      </span>
                    </label>
                  )
                )}
              </div>
              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => setShowChangeModeModal(false)}
                  className="flex-1 px-8 py-4 border-2 border-[#1e3a8a] text-[#1e3a8a] rounded-xl font-bold text-lg hover:bg-gray-50 transition-all"
                >
                  No
                </button>
                <button
                  onClick={handleChangeMode}
                  className="flex-1 px-8 py-4 bg-[#1e3a8a] text-white rounded-xl font-bold text-lg hover:bg-[#1e40af] transition-all"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl max-w-md w-full mx-4 shadow-2xl">
            <div className="p-10 text-center">
              <h3 className="text-2xl font-bold mb-8 text-[#1e3a8a]">
                Are you sure want to
                <br />
                Cancel the Appointment ?
              </h3>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-8 py-4 border-2 border-[#1e3a8a] text-[#1e3a8a] rounded-xl font-bold text-lg hover:bg-gray-50 transition-all"
                >
                  No
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-8 py-4 bg-[#1e3a8a] text-white rounded-xl font-bold text-lg hover:bg-[#1e40af] transition-all"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Meeting Modal */}
      {showNewMeetingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 border-4 border-green-600">
            <div className="p-8 text-center">
              <div className="mb-4">
                <i className="fa-solid fa-circle-check text-green-600 text-6xl"></i>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-800">
                Meeting Scheduled Successfully!
              </h3>
              <p className="text-gray-600 mb-6">
                Your meeting has been scheduled for {selectedDate} August 2024
                at {selectedTime || "selected time"} via {selectedMeetingMode}.
              </p>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowNewMeetingModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-600 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={handleNewMeeting}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                >
                  Create Another Meeting
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
