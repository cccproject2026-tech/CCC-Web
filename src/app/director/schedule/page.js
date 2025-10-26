"use client";
import { useState } from "react";
import AppHeader from "@/app/Components/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import MentorBg from "../../Assets/mentor-bg.png";
import Mentor1 from "../../Assets/mentor1.png";
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
    setShowScheduleModal(true);
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
      className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]"
      onClick={() => setOpenMenuId(null)}
    >
      <AppHeader showFullHeader={true} />

      <div className="bg-gradient-to-r from-blue-600 to-blue-400 p-12 text-center mb-8">
        <h1 className="text-4xl font-bold text-white">Schedule</h1>
      </div>

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Search and Tabs */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
            {/* Search Bar */}
            <div className="relative w-full max-w-md">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Enter a date (dd-mm-yyyy)"
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-white text-gray-900 placeholder-gray-400 shadow-md"
              />
            </div>

            {/* Tabs and Schedule Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab("appointments")}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === "appointments"
                    ? "bg-[#2E3B8E] text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                Appointments
              </button>
              <button
                onClick={() => setActiveTab("availability")}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === "availability"
                    ? "bg-[#2E3B8E] text-white"
                    : "bg-white text-gray-700"
                }`}
              >
                Availability
              </button>
              <button
                onClick={() => setShowChangeModeModal(true)}
                className="px-6 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] flex items-center gap-2"
              >
                <i className="fa-solid fa-plus"></i>
                Schedule
              </button>
            </div>
          </div>

          {/* Content Based on Tab */}
          {activeTab === "appointments" ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">
                  Monthly Meeting Calendar
                </h3>
                <div className="flex items-center justify-between mb-4">
                  <i className="fa-solid fa-chevron-left text-gray-600 cursor-pointer"></i>
                  <h4 className="text-base font-semibold text-gray-700">
                    August 2024
                  </h4>
                  <i className="fa-solid fa-chevron-right text-gray-600 cursor-pointer"></i>
                </div>
                <div className="grid grid-cols-7 gap-2 mb-2">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-semibold text-gray-600"
                    >
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {[...Array(31)].map((_, i) => {
                    const date = i + 1;
                    const hasAppointment = [
                      4, 11, 14, 17, 19, 22, 27, 30,
                    ].includes(date);
                    return (
                      <button
                        key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`p-2 rounded ${
                          date === selectedDate
                            ? "bg-[#2E3B8E] text-white"
                            : hasAppointment
                            ? "font-bold text-gray-800"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {date}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Appointments */}
              <div className="lg:col-span-2">
                <h3 className="text-xl font-bold text-white mb-4">
                  You have <span className="text-yellow-400">2</span>{" "}
                  Appointments Today
                </h3>
                <div className="space-y-4">
                  {appointments.map((apt) => (
                    <div
                      key={apt.id}
                      className="bg-white rounded-xl shadow-lg p-6 relative"
                    >
                      <div className="absolute top-4 right-4 z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(
                              openMenuId === apt.id ? null : apt.id
                            );
                          }}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          <i className="fa-solid fa-ellipsis-vertical text-xl"></i>
                        </button>
                        {openMenuId === apt.id && (
                          <div className="absolute top-8 right-0 mt-2 bg-white/30 backdrop-blur-md border border-white/20 rounded-lg shadow-xl w-64">
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setShowRescheduleModal(true);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-white/20 border-b border-white/10"
                            >
                              <i className="fa-solid fa-calendar text-[#2E3B8E]"></i>
                              <span>Reschedule Meeting</span>
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setShowCancelModal(true);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-white/20 border-b border-white/10"
                            >
                              <i className="fa-solid fa-calendar-xmark text-red-600"></i>
                              <span>Cancel Meeting</span>
                            </button>
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                setShowChangeModeModal(true);
                              }}
                              className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-white/20"
                            >
                              <i className="fa-solid fa-arrows-rotate text-green-600"></i>
                              <span>Change Meeting Mode</span>
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-28 h-28 rounded-xl flex items-center justify-center ${
                            apt.mode === "Duo"
                              ? "bg-[#2E3B8E]"
                              : "bg-gradient-to-br from-green-400 to-blue-600"
                          }`}
                        >
                          {apt.mode === "Duo" ? (
                            <i className="fa-solid fa-video text-white text-5xl"></i>
                          ) : (
                            <i className="fa-solid fa-video text-white text-5xl"></i>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Image
                              src={Mentor1}
                              alt={apt.name}
                              width={35}
                              height={35}
                              className="rounded-full"
                            />
                            <div>
                              <h4 className="font-bold text-gray-900 text-base">
                                {apt.name}
                              </h4>
                              <p className="text-xs text-gray-600">
                                {apt.role}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                            <span>
                              <i className="fa-solid fa-calendar-days mr-1"></i>
                              Date: {apt.date}
                            </span>
                            <span>
                              <i className="fa-solid fa-clock mr-1"></i>
                              Time: {apt.time}
                            </span>
                          </div>
                          <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-3">
                            Mode: {apt.mode}
                          </span>
                          <div className="flex items-center gap-3 text-gray-400 text-base">
                            <i className="fa-solid fa-phone hover:text-[#2E3B8E] cursor-pointer"></i>
                            <i className="fa-solid fa-video hover:text-[#2E3B8E] cursor-pointer"></i>
                            <i className="fa-regular fa-message hover:text-[#2E3B8E] cursor-pointer"></i>
                            <i className="fa-regular fa-envelope hover:text-[#2E3B8E] cursor-pointer"></i>
                          </div>
                          <button className="mt-3 px-4 py-2 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] text-sm">
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Next Appointment Section */}
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-white mb-4">
                    Next Appointment
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {nextAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className="bg-white rounded-xl shadow-lg p-6 relative"
                      >
                        <div className="absolute top-4 right-4 z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(
                                openMenuId === apt.id ? null : apt.id
                              );
                            }}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <i className="fa-solid fa-ellipsis-vertical text-xl"></i>
                          </button>
                          {openMenuId === apt.id && (
                            <div className="absolute top-8 right-0 mt-2 bg-white/30 backdrop-blur-md border border-white/20 rounded-lg shadow-xl w-64">
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setShowRescheduleModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-white/20 border-b border-white/10"
                              >
                                <i className="fa-solid fa-calendar text-[#2E3B8E]"></i>
                                <span>Reschedule Meeting</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setShowCancelModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-white/20 border-b border-white/10"
                              >
                                <i className="fa-solid fa-calendar-xmark text-red-600"></i>
                                <span>Cancel Meeting</span>
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setShowChangeModeModal(true);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-white/20"
                              >
                                <i className="fa-solid fa-arrows-rotate text-green-600"></i>
                                <span>Change Meeting Mode</span>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-28 h-28 rounded-xl flex items-center justify-center ${
                              apt.mode === "Duo"
                                ? "bg-[#2E3B8E]"
                                : "bg-gradient-to-br from-green-400 to-blue-600"
                            }`}
                          >
                            {apt.mode === "Duo" ? (
                              <i className="fa-solid fa-video text-white text-5xl"></i>
                            ) : (
                              <i className="fa-solid fa-video text-white text-5xl"></i>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Image
                                src={Mentor1}
                                alt={apt.name}
                                width={35}
                                height={35}
                                className="rounded-full"
                              />
                              <div>
                                <h4 className="font-bold text-gray-900 text-base">
                                  {apt.name}
                                </h4>
                                <p className="text-xs text-gray-600">
                                  {apt.role}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
                              <span>
                                <i className="fa-solid fa-calendar-days mr-1"></i>
                                Date: {apt.date}
                              </span>
                              <span>
                                <i className="fa-solid fa-clock mr-1"></i>
                                Time: {apt.time}
                              </span>
                            </div>
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-3">
                              Mode: {apt.mode}
                            </span>
                            <div className="flex items-center gap-3 text-gray-400 text-base">
                              <i className="fa-solid fa-phone hover:text-[#2E3B8E] cursor-pointer"></i>
                              <i className="fa-solid fa-video hover:text-[#2E3B8E] cursor-pointer"></i>
                              <i className="fa-regular fa-message hover:text-[#2E3B8E] cursor-pointer"></i>
                              <i className="fa-regular fa-envelope hover:text-[#2E3B8E] cursor-pointer"></i>
                            </div>
                            <button className="mt-3 px-4 py-2 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] text-sm">
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
        <div className="fixed top-6 right-6 z-50 animate-fade-in">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3">
            <i className="fa-solid fa-circle-check text-green-500 text-xl"></i>
            <span className="text-gray-800 font-semibold">{toast}</span>
          </div>
        </div>
      )}

      {/* Mentor Selection Modal */}
      {showMentorModal && (
        <div className="fixed inset-0 bg-white/90 backdrop-blur-lg flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="sticky top-0 bg-white/90 backdrop-blur-lg px-6 py-4 flex items-center justify-between border-b border-white/20 z-10">
              <h2 className="text-2xl font-bold text-gray-800">New Meeting</h2>
              <button
                onClick={() => setShowMentorModal(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6">
              {/* Filter Tabs */}
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setActiveFilterTab("Mentor")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    activeFilterTab === "Mentor"
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Mentor
                </button>
                <button
                  onClick={() => setActiveFilterTab("Field Mentor")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    activeFilterTab === "Field Mentor"
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Field Mentor
                </button>
                <button
                  onClick={() => setActiveFilterTab("Pastor")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    activeFilterTab === "Pastor"
                      ? "bg-[#2E3B8E] text-white"
                      : "bg-gray-200 text-gray-700"
                  }`}
                >
                  Pastor
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-12 pr-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#2E3B8E]"
                />
              </div>

              {/* Mentor List */}
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {(activeFilterTab === "Mentor"
                  ? mentors
                  : activeFilterTab === "Field Mentor"
                  ? fieldMentors
                  : pastors
                ).map((mentor) => (
                  <label
                    key={mentor.id}
                    className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="mentor"
                      value={mentor.id}
                      checked={selectedMentor === mentor.id}
                      onChange={() => setSelectedMentor(mentor.id)}
                      className="w-5 h-5 text-[#2E3B8E]"
                    />
                    <Image
                      src={Mentor1}
                      alt={mentor.name}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {mentor.name}
                      </div>
                      <div className="text-sm text-gray-600">{mentor.role}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/90 backdrop-blur-lg px-6 py-4 flex items-center justify-end gap-3 border-t border-white/20">
              <button
                onClick={() => setShowMentorModal(false)}
                className="px-6 py-2 border border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-[#2E3B8E]/10"
              >
                Cancel
              </button>
              <button
                onClick={handleMentorNext}
                disabled={!selectedMentor}
                className={`px-6 py-2 rounded-lg font-semibold ${
                  selectedMentor
                    ? "bg-[#2E3B8E] text-white hover:bg-[#1F2A6E]"
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
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/20">
            <div className="sticky top-0 bg-white/90 backdrop-blur-lg px-6 py-4 flex items-center justify-between border-b border-white/20 z-10">
              <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
                <i className="fa-regular fa-calendar"></i>
                Schedule a Meeting
              </h2>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Calendar */}
              <div>
                <label className="block font-semibold mb-2 text-gray-800">
                  Choose Available Date
                </label>
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <i className="fa-solid fa-chevron-left text-gray-600 cursor-pointer"></i>
                    <span className="font-semibold">August 2024</span>
                    <i className="fa-solid fa-chevron-right text-gray-600 cursor-pointer"></i>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-sm">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
                      <div
                        key={d}
                        className="text-center text-gray-600 font-semibold p-2"
                      >
                        {d}
                      </div>
                    ))}
                    {[...Array(31)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setSelectedDate(i + 1)}
                        className={`p-2 rounded ${
                          i + 1 === selectedDate
                            ? "bg-[#2E3B8E] text-white"
                            : "text-gray-700 hover:bg-gray-100"
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
                <label className="block font-semibold mb-2 text-gray-800">
                  Choose a Time
                </label>
                <div className="grid grid-cols-2 gap-2">
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
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        selectedTime === time
                          ? "border-[#2E3B8E] bg-[#2E3B8E]/10 text-[#2E3B8E]"
                          : "border-gray-300 text-gray-700 hover:border-[#2E3B8E]/50"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              {/* Meeting Option Display */}
              <div>
                <label className="block font-semibold mb-2 text-gray-800">
                  Preferred meeting option
                </label>
                <div className="w-full px-4 py-3 border rounded-lg bg-gray-50 text-gray-700">
                  {selectedMeetingMode}
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/90 backdrop-blur-lg px-6 py-4 flex items-center justify-end gap-3 border-t border-white/20">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="px-6 py-2 border border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-[#2E3B8E]/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSchedule}
                className="px-6 py-2 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E]"
              >
                Schedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 flex items-center justify-between border-b">
              <h2 className="text-2xl font-bold">Reschedule Meeting</h2>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="text-gray-600"
              >
                <i className="fa-solid fa-times text-xl"></i>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Same content as Schedule Modal */}
              <div className="text-center py-8">
                <p className="text-gray-600">Reschedule form content here...</p>
              </div>
            </div>

            <div className="px-6 py-4 flex justify-end gap-3 border-t">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-6 py-2 border border-[#2E3B8E] text-[#2E3B8E] rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReschedule}
                className="px-6 py-2 bg-[#2E3B8E] text-white rounded-lg"
              >
                Reschedule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Meeting Mode Modal */}
      {showChangeModeModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl max-w-md w-full mx-4 shadow-2xl border border-white/20">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-6 text-gray-800 underline decoration-blue-600 underline-offset-2">
                Choose Your Meeting Option
              </h3>
              <div className="space-y-2">
                {["Zoom", "Google Meet", "Teams", "Whatsapp", "Phone call"].map(
                  (mode) => (
                    <label
                      key={mode}
                      className="flex items-center gap-3 cursor-pointer px-3 py-2 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <input
                        type="radio"
                        name="meeting-mode"
                        value={mode}
                        checked={selectedMeetingMode === mode}
                        onChange={(e) => setSelectedMeetingMode(e.target.value)}
                        className="w-5 h-5 text-[#2E3B8E] focus:ring-2 focus:ring-[#2E3B8E]"
                      />
                      <span className="font-semibold text-gray-800">
                        {mode}
                      </span>
                    </label>
                  )
                )}
              </div>
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowChangeModeModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-[#2E3B8E]/10 transition-colors"
                >
                  No
                </button>
                <button
                  onClick={handleChangeMode}
                  className="flex-1 px-6 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] transition-colors"
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl max-w-md w-full mx-4 border-4 border-[#2E3B8E]">
            <div className="p-8 text-center">
              <h3 className="text-2xl font-bold mb-4">
                Are you sure want to Cancel the Appointment ?
              </h3>
              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-6 py-3 border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold"
                >
                  No
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold"
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
