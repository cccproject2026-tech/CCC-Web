"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "../../Assets/appointment-bg.png";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import UserProfile from "../../Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import { Appointment } from "@/app/Services/types";
import { apiCreateAppointment, apiCreateAvailability, apiGetMentorAppointments, apiGetWeeklyAvailability } from "@/app/Services/appointments.service";
import { convertToMinutes, getMentorFromCookie, isOverlapping, timeOptions } from "@/app/Services/utils/helpers";
import { apiGetAssignedUsers } from "@/app/Services/api";

export default function MentorSchedule() {
  const [activeTab, setActiveTab] = useState<
    "Appointments" | "Availability" | "Schedule"
  >("Appointments");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<1 | 2>(1);
  const [showMenu, setShowMenu] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [pastors, setPastors] = useState<any[]>([]);
  const [selectedPastor, setSelectedPastor] = useState<any | null>(null);
  const [meetingDate, setMeetingDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("zoom");
  const [currentDate, setCurrentDate] = useState(new Date());

  const [weekStart, setWeekStart] = useState(new Date());
  const [weeklyAvailability, setWeeklyAvailability] = useState<any>(null);

  const [availability, setAvailability] = useState<any[]>([]);

  const weekDates =
    weeklyAvailability
      ?.slice()
      .sort((a: any, b: any) => a.day - b.day)
      .map((slot: any) => new Date(slot.date)) || [];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const daysInMonth = lastDayOfMonth.getDate();
  const startDay = firstDayOfMonth.getDay();

  const calendarDays = [
    ...Array(startDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const appointmentDates = appointments.map((appt) => {
    const d = new Date(appt.meetingDate);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  });

  useEffect(() => {
    const mentor = getMentorFromCookie();

    if (mentor?.id) {
      setMentorId(mentor.id);
    }
  }, []);

  useEffect(() => {
    if (!mentorId) return;

    const fetchAppointments = async () => {
      try {
        const res = await apiGetMentorAppointments(mentorId);
        setAppointments(res.data.data);
      } catch (err) {
        console.error("Failed to fetch appointments", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [mentorId]);

  useEffect(() => {
    if (!mentorId) return;
    const fetchAssignedPastors = async () => {
      try {
        const res = await apiGetAssignedUsers(mentorId);
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setPastors(list);
      } catch (err) {
        console.error("Failed to fetch assigned pastors", err);
        setPastors([]);
      }
    };
    fetchAssignedPastors();
  }, [mentorId]);

  useEffect(() => {
    if (!mentorId) return;

    const fetchWeeklyAvailability = async () => {
      try {
        const sunday = new Date(weekStart);
        sunday.setDate(sunday.getDate() - sunday.getDay());

        const date = sunday.toISOString().split("T")[0];

        const res = await apiGetWeeklyAvailability(mentorId, date);
        const data = res.data.data || [];

        setWeeklyAvailability(data);

        const formatted = data.map((d: any) => ({
          date: d.date,
          day: d.day,
          enabled: d.slots.length > 0,
          slots: d.slots.length
            ? d.slots
            : [
              {
                startTime: "09:00",
                startPeriod: "AM",
                endTime: "05:00",
                endPeriod: "PM",
              },
            ],
        }));

        setAvailability(formatted);
      } catch (err) {
        console.error("Weekly availability error", err);
      }
    };

    fetchWeeklyAvailability();
  }, [mentorId, weekStart]);

  const todayAppointments = appointments.filter((appt) => {
    const today = new Date();
    const meetingDate = new Date(appt.meetingDate);

    return (
      meetingDate.getDate() === today.getDate() &&
      meetingDate.getMonth() === today.getMonth() &&
      meetingDate.getFullYear() === today.getFullYear()
    );
  });

  const handleReschedule = () => {
    setShowMenu(null);
    setToastMessage("The Appointment has been Rescheduled");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const buildAvailabilityPayload = () => {
    return {
      mentorId: mentorId,
      weeklySlots: availability
        .filter((d) => d.enabled)
        .map((d) => ({
          date: d.date,
          slots: d.slots
        })),
      meetingDuration: 60,
      minSchedulingNoticeHours: 2,
      maxBookingsPerDay: 5
    };
  };

  const handleSaveAvailability = async () => {
    if (!mentorId) return;

    const hasValidSlots = availability.some(
      (day) => day.enabled && day.slots && day.slots.length > 0
    );

    if (!hasValidSlots) {
      setToastMessage("Please add at least one availability slot");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    try {
      const payload = buildAvailabilityPayload();

      await apiCreateAvailability(payload);

      setToastMessage("Availability updated successfully");
    } catch (error) {
      console.error(error);
      setToastMessage("Failed to update availability");
    }

    setTimeout(() => setToastMessage(null), 3000);
  };

  const toIsoFromDateAndSlot = (dateStr: string, slot: string) => {
    // Example slot: "09:00 am - 10:00 am"
    const [start] = slot.split(" - ");
    const [time, period] = start.split(" ");
    const [h, m] = time.split(":").map(Number);
    let hours = h;
    if (period.toLowerCase() === "pm" && hours !== 12) hours += 12;
    if (period.toLowerCase() === "am" && hours === 12) hours = 0;
    const date = new Date(dateStr);
    date.setHours(hours, m, 0, 0);
    return date.toISOString();
  };

  const handleCreateAppointment = async () => {
    if (!mentorId) return;
    if (!selectedPastor?._id && !selectedPastor?.id) {
      setToastMessage("Please select a pastor");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    if (!meetingDate || !selectedSlot) {
      setToastMessage("Please select date and time");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    try {
      await apiCreateAppointment({
        userId: selectedPastor._id || selectedPastor.id,
        mentorId,
        meetingDate: toIsoFromDateAndSlot(meetingDate, selectedSlot),
        platform: selectedPlatform,
        notes: "Scheduled by mentor",
      });

      const refresh = await apiGetMentorAppointments(mentorId);
      setAppointments(refresh.data?.data || []);
      setIsDrawerOpen(false);
      setDrawerStep(1);
      setSelectedPastor(null);
      setMeetingDate("");
      setSelectedSlot("");
      setToastMessage("Appointment created successfully");
    } catch (error) {
      console.error("Failed to create appointment", error);
      setToastMessage("Failed to create appointment");
    }

    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white relative">
      <MentorHeader showFullHeader={true} />

      {/* 🟦 HERO SECTION */}
      <section
        className="relative h-[260px] flex flex-col justify-center px-4 md:px-20 text-white bg-cover bg-center"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,31,53,0.68)_0%,rgba(6,41,70,0.6)_50%,rgba(6,41,70,1)_100%)]" />
        <h1 className="relative z-10 text-3xl sm:text-4xl font-semibold tracking-wide">
          Mentor Appointments
        </h1>
      </section>

      {/* 🟩 TAB CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 md:px-20 py-8 gap-5">
        <input
          type="text"
          placeholder="Enter a date (dd-mm-yyyy)"
          className="w-full sm:w-[320px] bg-white/10 border border-white/20 rounded-md px-4 py-2 text-sm text-white placeholder:text-white/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#8ec5eb]/40"
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
              className={`px-3 sm:px-5 py-2 text-sm rounded-md font-medium transition-all ${activeTab === tab
                ? "bg-[#8ec5eb]/25 text-white border border-[#8ec5eb]/35 shadow-sm"
                : "bg-white/10 text-[#cde2f2] border border-white/15 hover:bg-white/15"
                }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 🟦 TAB CONTENT */}
      <main className="flex-1 px-4 md:px-20 pb-20">
        {/* 🟨 APPOINTMENTS TAB */}
        {activeTab === "Appointments" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Calendar */}
            <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-white shadow-sm">
              <h3 className="text-[15px] font-medium mb-4 flex items-center gap-2">
                <i className="fa-regular fa-calendar"></i> Monthly Meeting
                Calendar
              </h3>

              <div className="bg-[#103C8C] rounded-xl p-5 text-center">

                {/* Month Navigation */}
                <div className="flex justify-between items-center mb-4">
                  <button
                    onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                    className="text-white px-2"
                  >
                    ◀
                  </button>

                  <p className="text-sm text-white/80 font-medium">
                    {currentDate.toLocaleString("default", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>

                  <button
                    onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                    className="text-white px-2"
                  >
                    ▶
                  </button>
                </div>

                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-2 text-[13px] mb-2">
                  {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                    <div key={`${d}-${i}`} className="font-medium text-white/70">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-2 text-[13px]">
                  {calendarDays.map((day, index) => {
                    if (!day) return <div key={index}></div>;

                    const d = new Date(year, month, day);

                    const dateStr = `${d.getFullYear()}-${String(
                      d.getMonth() + 1
                    ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

                    const hasAppointment = appointmentDates.includes(dateStr);

                    const isToday =
                      day === new Date().getDate() &&
                      month === new Date().getMonth() &&
                      year === new Date().getFullYear();

                    return (
                      <div
                        key={index}
                        className={`py-1 rounded-md cursor-pointer
          ${isToday ? "bg-[#00B3FF] text-white font-bold" : ""}
          ${hasAppointment ? "border border-yellow-400" : ""}
          hover:bg-[#00B3FF]/40`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Appointments List */}
            <div>
              <h3 className="text-[15px] font-semibold mb-4 text-white">
                You have {todayAppointments.length} Appointments Today
              </h3>

              <div className="flex flex-col gap-6">
                {todayAppointments.map((appt, index) => {
                  const meetingDate = new Date(appt.meetingDate);

                  return (
                    <div
                      key={appt.id}
                      className="bg-white rounded-xl p-5 shadow-sm border border-[#E5E7EB] flex items-center gap-5 relative"
                    >
                      <div className="bg-[#F3F6FB] w-[100px] h-[100px] rounded-xl flex items-center justify-center">
                        <Image
                          src={appt.platform === "zoom" ? MeetIcon : DuoIcon}
                          alt={appt.platform}
                          className="w-[55px] h-[55px]"
                        />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Image
                            src={appt.user?.profilePicture || UserProfile}
                            alt="User"
                            width={36}
                            height={36}
                            className="rounded-full"
                          />

                          <div>
                            <h4 className="font-semibold text-[#0B1C58] text-sm">
                              {appt.user?.firstName} {appt.user?.lastName}
                            </h4>

                            <p className="text-[12px] text-gray-500">Pastor</p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-3 mb-2">
                          <div className="flex items-center gap-2 bg-[#E8EFFB] px-3 py-[4px] rounded-md text-[12px] text-[#103C8C] font-medium">
                            <i className="fa-regular fa-calendar text-[#103C8C]"></i>
                            Date: {meetingDate.toLocaleDateString()}
                          </div>

                          <div className="flex items-center gap-2 bg-[#E8EFFB] px-3 py-[4px] rounded-md text-[12px] text-[#103C8C] font-medium">
                            <i className="fa-regular fa-clock text-[#103C8C]"></i>
                            Time:{" "}
                            {meetingDate.toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </div>

                        <p className="text-[12px] text-[#6B7280] mb-2">
                          Mode:
                          <span className="text-[#103C8C] font-semibold ml-1">
                            {appt.platform}
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
                  );
                })}
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
                <p className="text-sm text-white/70 mb-2">
                  {weekDates.length
                    ? weekDates[0].toLocaleDateString("default", {
                      month: "long",
                      year: "numeric",
                    })
                    : ""}
                </p>
                <div className="grid grid-cols-7 gap-2 text-[13px]">
                  {weekDates.map((date) => {
                    const day = date.toLocaleDateString("default", { weekday: "short" });

                    return (
                      <div
                        key={date.toISOString()}
                        className="py-2 rounded-md text-white/80 hover:bg-[#00B3FF]/40 cursor-pointer text-center"
                      >
                        <div>{day}</div>
                        <div className="text-xs">{date.getDate()}</div>
                      </div>
                    );
                  })}
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
              {[
                { label: "Sunday", index: 0 },
                { label: "Monday", index: 1 },
                { label: "Tuesday", index: 2 },
                { label: "Wednesday", index: 3 },
                { label: "Thursday", index: 4 },
                { label: "Friday", index: 5 },
                { label: "Saturday", index: 6 }
              ].map((dayObj) => {

                const dayData = availability.find((d) => d.day === dayObj.index);
                const slots = dayData?.slots || [];
                const firstSlot = slots[0];

                return (
                  <div
                    key={dayObj.label}
                    className="flex items-center gap-3 mb-3 border-b border-white/20 pb-2"
                  >
                    <input
                      type="checkbox"
                      checked={availability.find(d => d.day === dayObj.index)?.enabled || false}
                      onChange={() => {
                        setAvailability(prev =>
                          prev.map(d =>
                            d.day === dayObj.index
                              ? { ...d, enabled: !d.enabled }
                              : d
                          )
                        );
                      }}
                      className="accent-[#103C8C]"
                    />

                    <p className="w-[100px]">{dayObj.label}</p>

                    {slots.map((slot, slotIndex) => (
                      <div key={slotIndex} className="flex gap-3">

                        <select
                          className="bg-white text-[#0B1C58] rounded-md text-xs px-2 py-1"
                          value={`${slot.startTime}-${slot.startPeriod}`}
                          onChange={(e) => {
                            const [time, period] = e.target.value.split("-");

                            setAvailability(prev =>
                              prev.map(d =>
                                d.day === dayObj.index
                                  ? {
                                    ...d,
                                    slots: d.slots.map((s, i) =>
                                      i === slotIndex
                                        ? { ...s, startTime: time, startPeriod: period }
                                        : s
                                    )
                                  }
                                  : d
                              )
                            );
                          }}
                        >
                          {timeOptions.map(t => (
                            <option key={`${t.time}-${t.period}`} value={`${t.time}-${t.period}`}>
                              {t.label}
                            </option>
                          ))}
                        </select>

                        <span>to</span>

                        <select
                          className="bg-white text-[#0B1C58] rounded-md text-xs px-2 py-1"
                          value={`${slot.endTime}-${slot.endPeriod}`}
                          onChange={(e) => {
                            const [time, period] = e.target.value.split("-");

                            setAvailability(prev =>
                              prev.map(d =>
                                d.day === dayObj.index
                                  ? {
                                    ...d,
                                    slots: d.slots.map((s, i) =>
                                      i === slotIndex
                                        ? { ...s, endTime: time, endPeriod: period }
                                        : s
                                    )
                                  }
                                  : d
                              )
                            );
                          }}
                        >
                          {timeOptions.map(t => (
                            <option key={`${t.time}-${t.period}`} value={`${t.time}-${t.period}`}>
                              {t.label}
                            </option>
                          ))}
                        </select>

                      </div>
                    ))}

                    <button
                      className="bg-white text-[#103C8C] text-xs px-3 py-[4px] rounded-md ml-2"
                      onClick={() => {
                        const lastSlot = slots[slots.length - 1];

                        const start = convertToMinutes(lastSlot.endTime, lastSlot.endPeriod);
                        const end = start + 60;

                        if (end > 24 * 60) {
                          setToastMessage("Cannot add more slots in this day");
                          setTimeout(() => setToastMessage(null), 3000);
                          return;
                        }

                        const newSlot = {
                          startTime: "09:00",
                          startPeriod: "AM",
                          endTime: "10:00",
                          endPeriod: "AM",
                        };

                        setAvailability((prev) =>
                          prev.map((d) =>
                            d.day === dayObj.index
                              ? {
                                ...d,
                                slots: [...d.slots, newSlot],
                              }
                              : d
                          )
                        );
                      }}
                    >
                      + Add
                    </button>
                  </div>
                );
              })}

              <div className="mt-6">
                <button
                  onClick={handleSaveAvailability}
                  className="bg-white text-[#103C8C] px-6 py-2 rounded-md font-medium"
                >
                  Submit
                </button>
              </div>
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
          <div className="fixed top-0 right-0 h-full w-full sm:w-[480px] bg-[#062946] text-white z-50 border-l border-white/15 shadow-2xl transition-transform duration-300">
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
                  {pastors.length === 0 && (
                    <p className="text-sm text-gray-500 px-2 py-4">No assigned pastors found.</p>
                  )}
                  {pastors.map((pastor: any) => {
                    const pastorId = pastor._id || pastor.id;
                    const isSelected = (selectedPastor?._id || selectedPastor?.id) === pastorId;
                    return (
                      <div
                        key={pastorId}
                        onClick={() => setSelectedPastor(pastor)}
                        className={`flex items-center justify-between gap-4 rounded-md border px-4 py-2 cursor-pointer transition ${
                          isSelected
                            ? "border-[#103C8C] bg-[#F3F6FF]"
                            : "border-gray-200 hover:bg-[#F5F8FF]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Image
                            src={pastor.profilePicture || UserProfile}
                            alt="User"
                            width={36}
                            height={36}
                            className="rounded-full"
                          />
                          <span className="font-medium text-sm">
                            {pastor.firstName} {pastor.lastName}
                          </span>
                        </div>
                        <input type="radio" checked={isSelected} readOnly className="accent-[#103C8C]" />
                      </div>
                    );
                  })}
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
                    onClick={() => {
                      if (!selectedPastor) {
                        setToastMessage("Please select a pastor first");
                        setTimeout(() => setToastMessage(null), 3000);
                        return;
                      }
                      setDrawerStep(2);
                    }}
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
                  <p className="text-sm mb-2 text-white/70">Select Date</p>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full rounded-md border border-white/30 bg-transparent px-3 py-2 text-sm text-white"
                  />
                </div>

                {/* Times */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => setSelectedSlot("09:00 am - 10:00 am")}
                    className={`border text-sm font-medium px-3 py-2 rounded-md ${
                      selectedSlot === "09:00 am - 10:00 am"
                        ? "bg-[#103C8C] text-white border-[#103C8C]"
                        : "border-[#103C8C] text-[#103C8C] hover:bg-[#F5F8FF]"
                    }`}
                  >
                    09:00 am - 10:00 am
                  </button>
                  <button
                    onClick={() => setSelectedSlot("11:00 am - 12:00 pm")}
                    className={`border text-sm font-medium px-3 py-2 rounded-md ${
                      selectedSlot === "11:00 am - 12:00 pm"
                        ? "bg-[#103C8C] text-white border-[#103C8C]"
                        : "border-[#103C8C] text-[#103C8C] hover:bg-[#F5F8FF]"
                    }`}
                  >
                    11:00 am - 12:00 pm
                  </button>
                  <button
                    onClick={() => setSelectedSlot("01:00 pm - 02:00 pm")}
                    className={`border text-sm font-medium px-3 py-2 rounded-md ${
                      selectedSlot === "01:00 pm - 02:00 pm"
                        ? "bg-[#103C8C] text-white border-[#103C8C]"
                        : "border-[#103C8C] text-[#103C8C] hover:bg-[#F5F8FF]"
                    }`}
                  >
                    01:00 pm - 02:00 pm
                  </button>
                  <button
                    onClick={() => setSelectedSlot("03:00 pm - 04:00 pm")}
                    className={`border text-sm font-medium px-3 py-2 rounded-md ${
                      selectedSlot === "03:00 pm - 04:00 pm"
                        ? "bg-[#103C8C] text-white border-[#103C8C]"
                        : "border-[#103C8C] text-[#103C8C] hover:bg-[#F5F8FF]"
                    }`}
                  >
                    03:00 pm - 04:00 pm
                  </button>
                  <button
                    onClick={() => setSelectedSlot("05:00 pm - 06:00 pm")}
                    className={`border text-sm font-medium px-3 py-2 rounded-md ${
                      selectedSlot === "05:00 pm - 06:00 pm"
                        ? "bg-[#103C8C] text-white border-[#103C8C]"
                        : "border-[#103C8C] text-[#103C8C] hover:bg-[#F5F8FF]"
                    }`}
                  >
                    05:00 pm - 06:00 pm
                  </button>
                </div>

                {/* Preferred meeting option */}
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="w-full border border-[#D1D5DB] text-sm rounded-md px-3 py-2 text-[#0B1C58] mb-8"
                >
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
                    onClick={handleCreateAppointment}
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
      {toastMessage && (
        <div className="fixed inset-0 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-xl shadow-lg px-10 py-5 flex items-center gap-3 animate-fade-in">
            <div className="text-red-500 text-2xl">
              <i className="fa-solid fa-circle-exclamation"></i>
            </div>
            <p className="text-[#0B1C58] font-medium text-[15px]">
              {toastMessage}
            </p>
          </div>
        </div>
      )}

      <PastorFooter />
    </div>
  );
}
