"use client";
import { useState } from "react";
import AppHeader from "@/app/Components/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import Mentor1 from "../../Assets/mentor1.png";
import DuoLogo from "../../Assets/duo.png";
import MeetLogo from "../../Assets/meet.png";
import UserProfile from "../../Assets/user-profile.png";
import Image from "next/image";

export default function SchedulePage() {
  const [activeTab, setActiveTab] = useState("appointments");
  const [selectedDate, setSelectedDate] = useState(11);
  const [currentMonth, setCurrentMonth] = useState("August");
  const [currentYear] = useState(2024);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [toast, setToast] = useState(null);

  // Modals
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showChangeModeModal, setShowChangeModeModal] = useState(false);
  const [showNewMeetingModal, setShowNewMeetingModal] = useState(false);
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Form state
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedMeetingMode, setSelectedMeetingMode] = useState("Zoom");
  const [activeFilterTab, setActiveFilterTab] = useState("Mentor");
  const [calendarDate, setCalendarDate] = useState(4);

  const appointments = [
    {
      id: 1,
      mode: "Duo",
      logo: DuoLogo,
      name: "John Ross",
      role: "Mentor",
      date: "04 Aug 24",
      time: "11:30 hrs EST",
      avatar: UserProfile,
    },
    {
      id: 2,
      mode: "Google Meet",
      logo: MeetLogo,
      name: "John Ross",
      role: "Mentor",
      date: "04 Aug 24",
      time: "11:30 hrs EST",
      avatar: UserProfile,
    },
  ];

  const nextAppointments = [
    {
      id: 3,
      mode: "Duo",
      logo: DuoLogo,
      name: "John Ross",
      role: "Pastor",
      date: "04 Aug 24",
      time: "11:30 hrs EST",
      avatar: UserProfile,
    },
    {
      id: 4,
      mode: "Google Meet",
      logo: MeetLogo,
      name: "John Ross",
      role: "Mentor",
      date: "04 Aug 24",
      time: "11:30 hrs EST",
      avatar: UserProfile,
    },
  ];

  const mentors = [
    { id: 1, name: "John Ross", role: "Mentor", avatar: UserProfile },
    { id: 2, name: "John Ross", role: "Mentor", avatar: UserProfile },
    { id: 3, name: "John Ross", role: "Mentor", avatar: UserProfile },
    { id: 4, name: "John Ross", role: "Mentor", avatar: UserProfile },
    { id: 5, name: "John Ross", role: "Mentor", avatar: UserProfile },
    { id: 6, name: "John Ross", role: "Mentor", avatar: UserProfile },
    { id: 7, name: "John Ross", role: "Mentor", avatar: UserProfile },
  ];

  const fieldMentors = [
    { id: 1, name: "John Ross", role: "Field Mentor", avatar: UserProfile },
    { id: 2, name: "John Ross", role: "Field Mentor", avatar: UserProfile },
  ];

  const pastors = [
    { id: 1, name: "John Ross", role: "Pastor", avatar: UserProfile },
    { id: 2, name: "John Ross", role: "Pastor", avatar: UserProfile },
  ];

  // Dates with appointments (bold dates)
  const appointmentDates = [4, 11, 14, 17, 19, 22, 27, 30];

  const timeSlots = [
    "09:00 am - 10:00 am",
    "11:00 am - 12:00 pm",
    "01:00 pm - 02:00 pm",
    "03:00 pm - 04:00 pm",
    "05:00 pm - 06:00 pm",
    "06:00 pm - 07:00 pm",
  ];

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setShowSuccessNotification(true);
    setTimeout(() => setShowSuccessNotification(false), 3000);
  };

  const handleSchedule = () => {
    setShowScheduleModal(false);
    showSuccess("New Appointment has been Scheduled");
  };

  const handleReschedule = () => {
    setShowRescheduleModal(false);
    showSuccess("The Appointment has been Rescheduled");
  };

  const handleCancel = () => {
    setShowCancelModal(false);
    showSuccess("Meeting has been Canceled");
  };

  const handleChangeModeSubmit = () => {
    setShowChangeModeModal(false);
    showSuccess(`Meeting Mode has been Changed to ${selectedMeetingMode}`);
  };

  const handleMentorNext = () => {
    if (selectedMentor) {
      setShowNewMeetingModal(false);
      setShowScheduleModal(true);
    }
  };

  const getDaysInMonth = () => 31;

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b from-[#2868A0] via-[#2876AC] to-[#2884B8]"
      onClick={() => setOpenMenuId(null)}
    >
      {/* Hero Section with Wave Pattern */}
      <div className="relative bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg
            className="w-full h-full"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 1440 320"
            preserveAspectRatio="none"
          >
            <path
              fill="rgba(255,255,255,0.15)"
              fillOpacity="1"
              d="M0,96L48,112C96,128,192,160,288,165.3C384,171,480,149,576,144C672,139,768,149,864,165.3C960,181,1056,203,1152,186.7C1248,171,1344,117,1392,90.7L1440,64L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            ></path>
            <path
              fill="rgba(255,255,255,0.1)"
              fillOpacity="1"
              d="M0,160L48,170.7C96,181,192,203,288,202.7C384,203,480,181,576,154.7C672,128,768,96,864,96C960,96,1056,128,1152,149.3C1248,171,1344,181,1392,186.7L1440,192L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"
            ></path>
          </svg>
        </div>
        <div className="relative z-10 px-6 md:px-12 lg:px-20">
          <h1 className="text-[56px] font-bold text-white">Schedule</h1>
        </div>
      </div>

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-8">
        <div className="max-w-[1600px] mx-auto">
          {/* Search and Tabs */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
            {/* Search Bar */}
            <div className="relative w-full max-w-md">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Enter a date (dd-mm-yyyy)"
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50 shadow-md"
              />
            </div>

            {/* Tabs and Schedule Button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/90 rounded-lg p-1 shadow-md">
                <button
                  onClick={() => setActiveTab("appointments")}
                  className={`px-6 py-2.5 rounded-md font-semibold text-sm transition-all ${
                    activeTab === "appointments"
                      ? "bg-[#1F2A6E] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Appointments
                </button>
                <button
                  onClick={() => setActiveTab("availability")}
                  className={`px-6 py-2.5 rounded-md font-semibold text-sm transition-all ${
                    activeTab === "availability"
                      ? "bg-[#1F2A6E] text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  Availability
                </button>
              </div>
              <button
                onClick={() => setShowNewMeetingModal(true)}
                className="px-6 py-2.5 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-50 flex items-center gap-2 shadow-md"
              >
                <i className="fa-solid fa-plus"></i>
                Schedule
              </button>
            </div>
          </div>

          {/* Content Based on Tab */}
          {activeTab === "appointments" ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
                {/* Monthly Meeting Calendar */}
                <div className="lg:col-span-1 bg-[#375E8C] rounded-2xl p-6 shadow-xl border border-[#4A6FA5]">
                  <div className="flex items-center gap-2 mb-6">
                    <i className="fa-regular fa-calendar text-white text-xl"></i>
                    <h3 className="text-lg font-bold text-white">
                      Monthly Meeting Calendar
                    </h3>
                  </div>

                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-6">
                    <button className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white">
                      <i className="fa-solid fa-chevron-left"></i>
                    </button>
                    <h4 className="text-base font-semibold text-white">
                      {currentMonth} {currentYear}
                    </h4>
                    <button className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white">
                      <i className="fa-solid fa-chevron-right"></i>
                    </button>
                  </div>

                  {/* Calendar Header */}
                  <div className="grid grid-cols-7 gap-2 mb-3">
                    {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                      <div
                        key={i}
                        className="text-center text-sm font-semibold text-white/80"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: getDaysInMonth() }, (_, i) => {
                      const date = i + 1;
                      const hasAppointment = appointmentDates.includes(date);
                      return (
                        <button
                          key={date}
                          onClick={() => setSelectedDate(date)}
                          className={`aspect-square flex items-center justify-center rounded-lg text-sm transition-all ${
                            date === selectedDate
                              ? "bg-white text-[#2E3B8E] font-bold ring-2 ring-white/50"
                              : hasAppointment
                              ? "bg-transparent text-white font-bold hover:bg-white/10"
                              : "text-white/60 hover:bg-white/5"
                          }`}
                        >
                          {date}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Today's Appointments */}
                <div className="lg:col-span-2">
                  <h3 className="text-xl font-bold text-white mb-6">
                    You have{" "}
                    <span className="text-[#FFD700]">
                      {appointments.length}
                    </span>{" "}
                    Appointments Today
                  </h3>
                  <div className="space-y-4">
                    {appointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-[#2E5A8E] rounded-2xl p-5 relative border border-[#4A6FA5]"
                      >
                        {/* Three-dot Menu */}
                        <div className="absolute top-4 right-4 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === apt.id ? null : apt.id
                              );
                            }}
                            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white"
                          >
                            <i className="fa-solid fa-ellipsis-vertical"></i>
                          </button>
                          {openMenuId === apt.id && (
                            <div className="absolute top-10 right-0 bg-white/95 backdrop-blur-md rounded-lg shadow-xl w-56 py-2 border border-white/20 z-20 animate-slide-down">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setShowRescheduleModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 text-gray-800 border-b border-gray-100"
                              >
                                <i className="fa-solid fa-calendar text-[#2E3B8E]"></i>
                                <span className="font-medium">
                                  Reschedule Meeting
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setShowCancelModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 text-gray-800 border-b border-gray-100"
                              >
                                <i className="fa-solid fa-calendar-xmark text-red-600"></i>
                                <span className="font-medium">
                                  Cancel Meeting
                                </span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setShowChangeModeModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 text-gray-800"
                              >
                                <i className="fa-solid fa-arrows-rotate text-green-600"></i>
                                <span className="font-medium">
                                  Change Meeting Mode
                                </span>
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-5">
                          {/* Meeting Platform Icon */}
                          <div className="w-32 h-32 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                            <Image
                              src={apt.logo}
                              alt={apt.mode}
                              className="w-20 h-20 object-contain"
                            />
                          </div>

                          {/* Appointment Details */}
                          <div className="flex-1">
                            {/* Person Info */}
                            <div className="flex items-center gap-3 mb-3">
                              <Image
                                src={apt.avatar}
                                alt={apt.name}
                                width={40}
                                height={40}
                                className="rounded-full border-2 border-white/30"
                              />
                              <div>
                                <h4 className="text-white font-semibold text-base">
                                  {apt.name}
                                </h4>
                                <p className="text-white/70 text-sm">
                                  {apt.role}
                                </p>
                              </div>
                            </div>

                            {/* Date and Time Badges */}
                            <div className="flex flex-wrap gap-2 mb-3">
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1F2A6E]/60 border border-white/20 rounded-md">
                                <i className="fa-regular fa-calendar text-[#FFD700]"></i>
                                <span className="text-white text-sm">
                                  Date : {apt.date}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1F2A6E]/60 border border-white/20 rounded-md">
                                <i className="fa-regular fa-clock text-[#22D3EE]"></i>
                                <span className="text-white text-sm">
                                  Time : {apt.time}
                                </span>
                              </div>
                            </div>

                            {/* Mode and Contact Row */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <p className="text-sm text-white/90">
                                  Mode :{" "}
                                  <span className="underline font-medium">
                                    {apt.mode}
                                  </span>
                                </p>
                                <div className="flex gap-3 text-white text-base">
                                  <button className="hover:text-[#FFD700] transition-colors">
                                    <i className="fa-solid fa-phone"></i>
                                  </button>
                                  <button className="hover:text-[#FFD700] transition-colors">
                                    <i className="fa-regular fa-comment"></i>
                                  </button>
                                  <button className="hover:text-[#FFD700] transition-colors">
                                    <i className="fa-solid fa-envelope"></i>
                                  </button>
                                  <button className="hover:text-[#FFD700] transition-colors">
                                    <i className="fa-brands fa-whatsapp"></i>
                                  </button>
                                </div>
                              </div>

                              <button className="px-6 py-2 bg-[#0B1C58] hover:bg-[#1a2d6b] transition text-white rounded-md font-semibold text-sm shadow-md">
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

              {/* Next Appointment Section */}
              <div className="bg-white rounded-3xl p-8 shadow-xl">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Next Appointment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {nextAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-[#2E5A8E] rounded-2xl p-5 border-4 border-[#1F3A5F] shadow-lg"
                    >
                      <div className="flex items-center gap-5 mb-4">
                        {/* Meeting Platform Icon */}
                        <div className="w-28 h-28 rounded-xl bg-white flex items-center justify-center flex-shrink-0 shadow-md">
                          <Image
                            src={apt.logo}
                            alt={apt.mode}
                            className="w-16 h-16 object-contain"
                          />
                        </div>

                        {/* Person Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Image
                              src={apt.avatar}
                              alt={apt.name}
                              width={32}
                              height={32}
                              className="rounded-full border-2 border-white/30"
                            />
                            <div>
                              <h4 className="text-white font-semibold text-sm">
                                {apt.name}
                              </h4>
                              <p className="text-white/70 text-xs">
                                {apt.role}
                              </p>
                            </div>
                          </div>

                          {/* Date and Time */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <i className="fa-regular fa-calendar text-[#FFD700] text-xs"></i>
                              <span className="text-white text-xs">
                                Date : {apt.date}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <i className="fa-regular fa-clock text-[#22D3EE] text-xs"></i>
                              <span className="text-white text-xs">
                                Time : {apt.time}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mode Label */}
                      <div className="mb-3">
                        <span className="text-white/90 text-xs">
                          Mode :{" "}
                          <span className="font-semibold">{apt.mode}</span>
                        </span>
                      </div>

                      {/* Bottom Actions */}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-3 text-white text-sm">
                          <button className="hover:text-[#FFD700] transition-colors">
                            <i className="fa-solid fa-phone"></i>
                          </button>
                          <button className="hover:text-[#FFD700] transition-colors">
                            <i className="fa-regular fa-comment"></i>
                          </button>
                          <button className="hover:text-[#FFD700] transition-colors">
                            <i className="fa-solid fa-envelope"></i>
                          </button>
                          <button className="hover:text-[#FFD700] transition-colors">
                            <i className="fa-brands fa-whatsapp"></i>
                          </button>
                        </div>

                        <button className="px-5 py-2 bg-[#0B1C58] hover:bg-[#1a2d6b] transition text-white rounded-md font-semibold text-sm shadow-md border border-white/20">
                          Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            // Availability Tab
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* My Weekly Availability - Calendar */}
              <div className="space-y-6">
                <div className="bg-[#375E8C] rounded-2xl p-6 shadow-xl border border-[#4A6FA5]">
                  <h3 className="text-xl font-bold text-white mb-6">
                    My Weekly Availability
                  </h3>

                  {/* Calendar */}
                  <div className="bg-[#2E5A8E] rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <button className="text-white hover:bg-white/10 rounded p-1">
                        <i className="fa-solid fa-chevron-left"></i>
                      </button>
                      <h4 className="text-white font-semibold">
                        {currentMonth} {currentYear}
                      </h4>
                      <button className="text-white hover:bg-white/10 rounded p-1">
                        <i className="fa-solid fa-chevron-right"></i>
                      </button>
                    </div>

                    {/* Calendar Days */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                        (day, i) => (
                          <div
                            key={i}
                            className="text-center text-xs font-semibold text-white/80 py-1"
                          >
                            {day}
                          </div>
                        )
                      )}
                    </div>

                    {/* Calendar Dates */}
                    <div className="grid grid-cols-7 gap-1">
                      {["01", "02", "03", "04", "05", "06", "07"].map(
                        (date, i) => (
                          <div
                            key={i}
                            className={`text-center py-2 text-sm rounded ${
                              date === "04"
                                ? "bg-white text-[#2E3B8E] font-bold"
                                : "text-white/60"
                            }`}
                          >
                            {date}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Settings */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white text-sm mb-2">
                        Meeting Duration
                      </label>
                      <select className="w-full px-3 py-2 rounded-lg bg-[#2E5A8E] text-white border border-white/20">
                        <option>60 Minutes</option>
                        <option>30 Minutes</option>
                        <option>90 Minutes</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-2">
                        Max. Booking per Day
                      </label>
                      <select className="w-full px-3 py-2 rounded-lg bg-[#2E5A8E] text-white border border-white/20">
                        <option>5</option>
                        <option>3</option>
                        <option>10</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-2">
                        Min. Scheduling Notice
                      </label>
                      <select className="w-full px-3 py-2 rounded-lg bg-[#2E5A8E] text-white border border-white/20">
                        <option>2 Days</option>
                        <option>1 Day</option>
                        <option>3 Days</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-white text-sm mb-2">
                        Preferred Meeting Option
                      </label>
                      <select className="w-full px-3 py-2 rounded-lg bg-[#2E5A8E] text-white border border-white/20">
                        <option>Zoom</option>
                        <option>Google Meet</option>
                        <option>Teams</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Hours */}
              <div className="bg-[#375E8C] rounded-2xl p-6 shadow-xl border border-[#4A6FA5]">
                <h3 className="text-xl font-bold text-white mb-6">
                  Available Hours
                </h3>
                <div className="space-y-3">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map(
                    (day, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-3 mb-2">
                          <input
                            type="checkbox"
                            defaultChecked
                            className="w-5 h-5"
                          />
                          <span className="font-semibold text-white text-sm">
                            {day}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <select className="flex-1 px-3 py-2 rounded-lg bg-[#2E5A8E] text-white border border-white/20 text-sm">
                            <option>10 : 00 AM</option>
                            <option>09 : 00 AM</option>
                            <option>11 : 00 AM</option>
                          </select>
                          <span className="text-white text-sm">to</span>
                          <select className="flex-1 px-3 py-2 rounded-lg bg-[#2E5A8E] text-white border border-white/20 text-sm">
                            <option>02 : 00 PM</option>
                            <option>01 : 00 PM</option>
                            <option>03 : 00 PM</option>
                          </select>
                          <button className="px-4 py-2 bg-white text-[#2E3B8E] rounded-lg font-semibold text-sm hover:bg-gray-100 flex items-center gap-1">
                            <i className="fa-solid fa-plus"></i>
                            Add
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <select className="flex-1 px-3 py-2 rounded-lg bg-[#2E5A8E] text-white border border-white/20 text-sm">
                            <option>03 : 00 PM</option>
                            <option>02 : 00 PM</option>
                            <option>04 : 00 PM</option>
                          </select>
                          <span className="text-white text-sm">to</span>
                          <select className="flex-1 px-3 py-2 rounded-lg bg-[#2E5A8E] text-white border border-white/20 text-sm">
                            <option>07 : 00 PM</option>
                            <option>06 : 00 PM</option>
                            <option>08 : 00 PM</option>
                          </select>
                          <button className="w-8 h-8 bg-white/20 text-white rounded-lg hover:bg-white/30 flex items-center justify-center">
                            <i className="fa-solid fa-xmark"></i>
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
                <button className="mt-6 w-full py-3 bg-white text-[#2E3B8E] rounded-lg font-bold hover:bg-gray-100 shadow-md">
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* New Meeting Modal - Select Mentor */}
      {showNewMeetingModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => setShowNewMeetingModal(false)}
          ></div>
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto animate-fade-in">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-gray-900">
                    New Meeting
                  </h3>
                  <button
                    onClick={() => setShowNewMeetingModal(false)}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                  >
                    <i className="fa-solid fa-xmark text-gray-600"></i>
                  </button>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 mb-4">
                  {["Mentor", "Field Mentor", "Pastor"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveFilterTab(tab)}
                      className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                        activeFilterTab === tab
                          ? "bg-[#1F2A6E] text-white"
                          : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Search"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3B8E] text-gray-900 placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Mentor List */}
              <div className="p-6 max-h-[400px] overflow-y-auto">
                <div className="space-y-2">
                  {(activeFilterTab === "Mentor"
                    ? mentors
                    : activeFilterTab === "Field Mentor"
                    ? fieldMentors
                    : pastors
                  ).map((mentor) => (
                    <label
                      key={mentor.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <div className="relative">
                        <input
                          type="radio"
                          name="mentor"
                          checked={selectedMentor === mentor.id}
                          onChange={() => setSelectedMentor(mentor.id)}
                          className="w-5 h-5 text-[#2E3B8E] cursor-pointer"
                        />
                        {selectedMentor === mentor.id && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <Image
                        src={mentor.avatar}
                        alt={mentor.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {mentor.name}
                        </div>
                        <div className="text-xs text-gray-600">
                          {mentor.role}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t flex justify-between gap-4">
                <button
                  onClick={() => setShowNewMeetingModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMentorNext}
                  disabled={!selectedMentor}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold ${
                    selectedMentor
                      ? "bg-[#1F2A6E] text-white hover:bg-[#0F1A5E]"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Schedule/Reschedule Modal */}
      {(showScheduleModal || showRescheduleModal) && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => {
              setShowScheduleModal(false);
              setShowRescheduleModal(false);
            }}
          ></div>
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto animate-fade-in">
              <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <i className="fa-regular fa-calendar text-[#2E3B8E] text-xl"></i>
                  <h3 className="text-xl font-bold text-gray-900">
                    {showRescheduleModal
                      ? "Reschedule Meeting"
                      : "Schedule a Meeting"}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setShowRescheduleModal(false);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center"
                >
                  <i className="fa-solid fa-xmark text-gray-600"></i>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Calendar */}
                <div>
                  <label className="block font-semibold text-gray-900 mb-3">
                    Choose Available Date
                  </label>
                  <div className="bg-[#2E5A8E] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <button className="text-white">
                        <i className="fa-solid fa-chevron-left"></i>
                      </button>
                      <span className="text-white font-semibold">
                        {currentMonth} {currentYear}
                      </span>
                      <button className="text-white">
                        <i className="fa-solid fa-chevron-right"></i>
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                        <div
                          key={i}
                          className="text-center text-xs text-white/80 font-semibold"
                        >
                          {day}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(
                        (date) => (
                          <button
                            key={date}
                            onClick={() => setCalendarDate(date)}
                            className={`aspect-square flex items-center justify-center text-sm rounded-lg ${
                              date === calendarDate
                                ? "bg-white text-[#2E3B8E] font-bold"
                                : "text-white/70 hover:bg-white/10"
                            }`}
                          >
                            {date}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>

                {/* Time Slots */}
                <div>
                  <label className="block font-semibold text-gray-900 mb-3">
                    Choose a Time
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                          selectedTime === time
                            ? "border-[#1F2A6E] bg-[#1F2A6E] text-white"
                            : "border-gray-300 text-gray-700 hover:border-[#2E3B8E]/50 bg-white"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preferred Meeting Option */}
                <div>
                  <label className="block font-semibold text-gray-900 mb-3">
                    Preferred meeting option
                  </label>
                  <div className="px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700">
                    {selectedMeetingMode}
                  </div>
                </div>
              </div>

              <div className="p-6 border-t flex justify-between gap-4">
                <button
                  onClick={() => {
                    setShowScheduleModal(false);
                    setShowRescheduleModal(false);
                  }}
                  className="flex-1 px-6 py-3 border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-blue-50"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    showRescheduleModal ? handleReschedule : handleSchedule
                  }
                  className="flex-1 px-6 py-3 bg-[#1F2A6E] text-white rounded-lg font-semibold hover:bg-[#0F1A5E]"
                >
                  {showRescheduleModal ? "Reschedule" : "Schedule"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => setShowCancelModal(false)}
          ></div>
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm pointer-events-auto animate-fade-in p-8 text-center">
              <h3 className="text-xl font-bold text-[#2E3B8E] mb-8">
                Are you sure want to
                <br />
                Cancel the Appointment ?
              </h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-blue-50"
                >
                  No
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 bg-[#1F2A6E] text-white rounded-lg font-semibold hover:bg-[#0F1A5E]"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Change Meeting Mode Modal */}
      {showChangeModeModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[100]"
            onClick={() => setShowChangeModeModal(false)}
          ></div>
          <div className="fixed inset-0 z-[101] flex items-center justify-center pointer-events-none p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto animate-fade-in">
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 underline decoration-[#2E3B8E] underline-offset-4">
                  Choose your meeting option
                </h3>
                <div className="space-y-3">
                  {[
                    "Zoom",
                    "Google Meet",
                    "Teams",
                    "Whatsapp",
                    "Phone call",
                  ].map((mode) => (
                    <label
                      key={mode}
                      className="flex items-center gap-3 cursor-pointer"
                    >
                      <div className="relative">
                        <input
                          type="radio"
                          name="meeting-mode"
                          value={mode}
                          checked={selectedMeetingMode === mode}
                          onChange={(e) =>
                            setSelectedMeetingMode(e.target.value)
                          }
                          className="w-5 h-5 text-[#2E3B8E] cursor-pointer appearance-none border-2 border-gray-300 rounded-full checked:border-green-500"
                        />
                        {selectedMeetingMode === mode && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <span className="font-semibold text-gray-900">
                        {mode}
                      </span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => setShowChangeModeModal(false)}
                    className="flex-1 px-6 py-3 border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-blue-50"
                  >
                    No
                  </button>
                  <button
                    onClick={handleChangeModeSubmit}
                    className="flex-1 px-6 py-3 bg-[#1F2A6E] text-white rounded-lg font-semibold hover:bg-[#0F1A5E]"
                  >
                    Yes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Success Notification */}
      {showSuccessNotification && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[110] animate-fade-in">
          <div className="bg-white rounded-xl px-8 py-4 shadow-2xl flex items-center gap-3 border-l-4 border-green-500">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-check text-white text-sm"></i>
            </div>
            <span className="text-[#2E3B8E] font-bold text-base">
              {successMessage}
            </span>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
