"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "../../Assets/appointment-bg.png";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import UserProfile from "../../Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { cancelAppointment, getMentors, getUpcomingAppointments, getUserAppointments , rescheduleAppointment, scheduleAppointment, updateAppointment  } from "@/app/Services/pastor.service";




export default function PastorAppointmentsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<"mentor" | "schedule">("mentor");
  const [showPopup, setShowPopup] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [appointments, setAppointments] = useState([]);
const [appointmentsToday, setAppointmentsToday] = useState([]);
const [upcomingAppointments, setUpcomingAppointments] = useState([]);
const [mentors, setMentors] = useState([]);
const [filteredMentors, setFilteredMentors] = useState([]);
const [selectedMentor, setSelectedMentor] = useState(null);
const [search, setSearch] = useState("");
const today = new Date();
const [currentMonth, setCurrentMonth] = useState(today.getMonth());
const [currentYear, setCurrentYear] = useState(today.getFullYear());
const [selectedDate, setSelectedDate] = useState(today.getDate());
const [menuOpenId, setMenuOpenId] = useState(null); 
const [showReschedule, setShowReschedule] = useState(false);
const [appointmentToEdit, setAppointmentToEdit] = useState(null);
const [showCancelConfirm, setShowCancelConfirm] = useState(false);
const [showCancelSuccess, setShowCancelSuccess] = useState(false);
const [appointmentToCancel, setAppointmentToCancel] = useState(null);
const [showChangeMode, setShowChangeMode] = useState(false);
const [selectedMode, setSelectedMode] = useState("zoom");
const [modeSuccess, setModeSuccess] = useState(false);







// Reschedule modal states

const [rescheduleDay, setRescheduleDay] = useState(today.getDate());
const [rescheduleMonth, setRescheduleMonth] = useState(today.getMonth());
const [rescheduleYear, setRescheduleYear] = useState(today.getFullYear());
const [rescheduleTime, setRescheduleTime] = useState("");
const [rescheduleMode, setRescheduleMode] = useState("");

const [rescheduleSuccess, setRescheduleSuccess] = useState(false);




const getDaysInMonth = (month, year) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (month, year) => {
  return new Date(year, month, 1).getDay();
};


const handlePrevMonth = () => {
  if (currentMonth === 0) {
    setCurrentMonth(11);
    setCurrentYear(currentYear - 1);
  } else {
    setCurrentMonth(currentMonth - 1);
  }
};

const handleNextMonth = () => {
  if (currentMonth === 11) {
    setCurrentMonth(0);
    setCurrentYear(currentYear + 1);
  } else {
    setCurrentMonth(currentMonth + 1);
  }
};



useEffect(() => {
  const storedUser = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || "{}")
    : {};

  const userId = storedUser?.id;
  if (!userId) return;

  async function fetchAppointments() {
    try {
      const res = await getUserAppointments(userId);
      const data = res.data?.data || [];

      setAppointments(data);

      // filter today's appointments
      const today = new Date().toISOString().split("T")[0];
      const todayList = data.filter(a =>
        a.meetingDate.split("T")[0] === today
      );

      setAppointmentsToday(todayList);

    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
  }

  fetchAppointments();
}, []);

useEffect(() => {
  const storedUser = typeof window !== "undefined"
    ? JSON.parse(localStorage.getItem("user") || "{}")
    : {};

  const userId = storedUser?.id;

  if (!userId) return;

  async function fetchUpcoming() {
    try {
      const res = await getUpcomingAppointments(userId);
      setUpcomingAppointments(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error);
    }
  }

  fetchUpcoming();
}, []);





const getModeIcon = (mode) => {
  if (!mode) return DuoIcon;
  const m = mode.toLowerCase();
  if (m === "duo") return DuoIcon;
  if (m === "google meet" || m === "meet") return MeetIcon;
  if (m === "zoom") return MeetIcon;
  return DuoIcon;
};

const formatDate = (dateString) => {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "2-digit",
  });
};

const formatTime = (dateString) => {
  const d = new Date(dateString);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
useEffect(() => {
  async function fetchMentors() {
    try {
      const res = await getMentors();
      const list = res.data?.data?.mentors || [];

      setMentors(list);
      setFilteredMentors(list);
    } catch (error) {
      console.error("Error fetching mentors", error);
    }
  }

  if (drawerStep === "mentor") {
    fetchMentors();
  }
}, [drawerStep]);

useEffect(() => {
  if (!search.trim()) {
    setFilteredMentors(mentors);
  } else {
    setFilteredMentors(
      mentors.filter((m) =>
        `${m.firstName} ${m.lastName}`
          .toLowerCase()
          .includes(search.toLowerCase())
      )
    );
  }
}, [search, mentors]);


const handleSchedule = async () => {
  if (!selectedMentor?.id) {
    alert("Please select a mentor");
    return;
  }

  if (!selectedTime) {
    alert("Please select a time");
    return;
  }

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userId = storedUser.id;

  const meetingDateISO = convertToISO(selectedTime);

  const payload = {
    userId,
    mentorId: selectedMentor.id,
    meetingDate: meetingDateISO,
    platform: "zoom",
    meetingLink: "https://zoom.us/j/123456789",
    notes: "Initial mentorship session to review progress.",
  };

  try {
    await scheduleAppointment(payload);

    setDrawerOpen(false);
    setShowPopup(true);

    // refresh upcoming appointments instantly
    const result = await getUpcomingAppointments(userId);
    setUpcomingAppointments(result.data?.data || []);

  } catch (error) {
    console.error("Error scheduling appointment:", error);
    alert("Failed to schedule appointment!");
  }
};
const handleReschedule = async () => {
  if (!appointmentToEdit) return;

  try {
    // Extract start time from selected slot
    const start = rescheduleTime.split("–")[0].trim();

    // Build YYYY-MM-DD format
    const dateObj = new Date(rescheduleYear, rescheduleMonth, rescheduleDay);
    const yyyyMMdd = dateObj.toLocaleDateString("en-CA"); // → 2025-11-18

    // Final ISO date
    const newDateISO = new Date(`${yyyyMMdd} ${start}`).toISOString();

    // FINAL PAYLOAD (matches backend)
    const payload = {
      newDate: newDateISO,
      startTime: start.replace(/[^0-9:]/g, ""), 
      startPeriod: start.toLowerCase().includes("pm") ? "PM" : "AM",
    };

    console.log("📌 Sending Reschedule Payload:", payload);

    // API CALL
    await rescheduleAppointment(appointmentToEdit.id, payload);

    // Close drawer + show popup
    setShowReschedule(false);
    setRescheduleSuccess(true);

    // Auto-hide popup
    setTimeout(() => setRescheduleSuccess(false), 2000);

    // Refresh appointment lists (important)
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const resultToday = await getUserAppointments(storedUser.id);
    const resultUpcoming = await getUpcomingAppointments(storedUser.id);

    setAppointments(resultToday.data?.data || []);
    setUpcomingAppointments(resultUpcoming.data?.data || []);

  } catch (err) {
    console.error("❌ Reschedule API Error:", err);
    alert("Failed to reschedule appointment");
  }
};


  useEffect(() => {
    if (showPopup) {
      const t = setTimeout(() => setShowPopup(false), 2000);
      return () => clearTimeout(t);
    }
  }, [showPopup]);

const convertToISO = (timeString) => {
  const startTime = timeString.split("–")[0].trim(); // e.g. "01:00 pm"

  // Build the selected date (year-month-day)
  const dateObj = new Date(currentYear, currentMonth, selectedDate);

  // Format YYYY-MM-DD
  const dateStr = dateObj.toLocaleDateString("en-CA");

  // Final ISO string
  return new Date(`${dateStr} ${startTime}`).toISOString();
};

const handleChangeMode = async () => {
  if (!appointmentToEdit) return;

  try {
    const payload = {
      platform: selectedMode.toLowerCase(),
      meetingLink:
        selectedMode === "Zoom"
          ? "https://zoom.us/j/123456789"
          : selectedMode === "Google Meet"
          ? "https://meet.google.com/abc-defg-hij"
          : "",
      notes: `Meeting mode changed to ${selectedMode}`,
      status: "scheduled",
    };

    console.log("📌 Sending Change Mode Payload:", payload);

    // API Call
    await updateAppointment(appointmentToEdit.id, payload);

    // Close popup
    setShowChangeMode(false);
    setModeSuccess(true);

    // Auto-hide success popup
    setTimeout(() => setModeSuccess(false), 2000);

    // Refresh UI data
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const resultUpcoming = await getUpcomingAppointments(storedUser.id);
    setUpcomingAppointments(resultUpcoming.data?.data || []);

  } catch (err) {
    console.error("❌ Change Meeting Mode API error:", err);
    alert("Failed to update meeting mode");
  }
};

const handleCancelAppointment = async () => {
  if (!appointmentToCancel) return;

  try {
    // Call API
    await cancelAppointment(appointmentToCancel.id);

    setShowCancelConfirm(false);
    setShowCancelSuccess(true);

    // Refresh lists
    const storedUser = JSON.parse(localStorage.getItem("user"));
    const todayRes = await getUserAppointments(storedUser.id);
    const upcomingRes = await getUpcomingAppointments(storedUser.id);

    setAppointments(todayRes.data?.data || []);
    setUpcomingAppointments(upcomingRes.data?.data || []);

    // Auto-hide success popup
    setTimeout(() => setShowCancelSuccess(false), 2000);

  } catch (error) {
    console.error("❌ Cancel API Error:", error);
    alert("Failed to cancel appointment");
  }
};




  return (
    <div className="relative min-h-screen overflow-hidden bg-[#062946] text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative bg-cover bg-center h-[200px] md:h-[260px] flex flex-col justify-center px-4 md:px-8 lg:px-20 text-white"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]"></div>
        <div className="relative z-10">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]">
            <span className="h-2 w-2 rounded-full bg-[#8ec5eb]" />
            Leadership Support Network
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-wide md:text-4xl">
            Appointments
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[#d9ebf8] md:text-base">
            Manage your scheduled sessions and upcoming mentor meetings.
          </p>
        </div>
      </section>

  {/* MAIN SECTION */}
<main className="relative z-10 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 py-8 md:px-8 md:py-12 lg:px-20">

  {/* SEARCH + NEW MEETING BUTTON */}
  <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8 md:mb-10">
    <input
      type="text"
      placeholder="Enter a date (dd-mm-yyyy)"
      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm text-white shadow-sm backdrop-blur placeholder:text-[#cde2f2] focus:outline-none focus:border-[#8ec5eb] md:w-[320px]"
    />

    <button
      onClick={() => {
        setDrawerOpen(true);
        setDrawerStep("mentor");
      }}
      className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0f4a76] shadow-sm transition hover:bg-[#e7f1fa]"
    >
      <i className="fa-solid fa-plus text-xs"></i> New Meeting
    </button>
  </div>

  {/* CALENDAR + TODAY'S APPOINTMENTS */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">

    {/* LEFT — MONTHLY CALENDAR */}
    <div className="rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-4 text-white shadow-md md:p-6">
      <h3 className="text-sm md:text-[15px] font-medium mb-4 flex items-center gap-2">
        <i className="fa-regular fa-calendar"></i> Monthly Meeting Calendar
      </h3>

      {/* Calendar Box */}
      <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur md:p-5">

        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-3">
          <button onClick={handlePrevMonth} className="text-white/70 hover:text-white">
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          <p className="text-sm md:text-base font-semibold">
            {new Date(currentYear, currentMonth).toLocaleString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>

          <button onClick={handleNextMonth} className="text-white/70 hover:text-white">
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        {/* Week days */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 text-xs md:text-[13px] mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <div key={i} className="font-medium text-white/70 py-1">{d}</div>
          ))}
        </div>

        {/* Calendar Dates */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 text-xs md:text-[14px]">
          {Array(getFirstDayOfMonth(currentMonth, currentYear))
            .fill(null)
            .map((_, i) => (<div key={i}></div>))}

          {Array.from({ length: getDaysInMonth(currentMonth, currentYear) }).map((_, i) => {
            const day = i + 1;
            const isSelected = day === selectedDate;

            return (
              <div
                key={i}
                onClick={() => setSelectedDate(day)}
                className={`py-1 rounded-md cursor-pointer transition ${
                  isSelected
                    ? "bg-[#00B3FF] text-white font-bold"
                    : "text-white/80 hover:bg-[#00B3FF]/40"
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* RIGHT — TODAY'S APPOINTMENTS */}
    <div>
      <h3 className="mb-4 text-sm font-semibold text-white md:text-[15px]">
        You have {appointmentsToday.length} Appointments Today
      </h3>

      <div className="flex flex-col gap-4 md:gap-6">

        {appointmentsToday.length === 0 && (
          <p className="text-white/70">No appointments today</p>
        )}

        {appointmentsToday.map((appt) => {
          const mentor = appt.mentor;
          const icon = getModeIcon(appt.platform);

          const dateObj = new Date(appt.meetingDate);
          const dateStr = dateObj.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
            year: "2-digit",
          });

          const timeStr = dateObj.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={appt.id}
              className="relative flex flex-col items-start gap-5 rounded-xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-4 shadow-sm md:flex-row md:items-center md:p-5"
            >
              {/* Icon */}
              <div className="flex h-[80px] w-[80px] items-center justify-center rounded-xl bg-white/90 md:h-[100px] md:w-[100px]">
                <Image src={icon} alt="mode" className="w-[45px] md:w-[55px]" />
              </div>

              {/* Details */}
              <div className="flex-1">

                {/* Mentor Row */}
                <div className="flex items-center gap-3 mb-2">
                  <Image
                    src={mentor?.profilePicture || UserProfile}
                    width={32}
                    height={32}
                    alt="mentor"
                    className="rounded-full"
                  />
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {mentor?.firstName} {mentor?.lastName}
                    </h4>
                    <p className="text-[11px] text-[#cde2f2]">Mentor</p>
                  </div>
                </div>

                {/* Date/Time */}
                <div className="flex flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-[4px] text-[11px] font-medium text-[#d9ebf8]">
                    <i className="fa-regular fa-calendar"></i>
                    Date: {dateStr}
                  </div>

                  <div className="flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-[4px] text-[11px] font-medium text-[#d9ebf8]">
                    <i className="fa-regular fa-clock"></i>
                    Time: {timeStr}
                  </div>
                </div>

                {/* Mode */}
                <p className="mb-3 text-[11px] text-[#d9ebf8]">
                  Mode:
                  <span className="font-semibold text-[#8ec5eb]"> {appt.platform}</span>
                </p>

                {/* Actions row */}
                <div className="flex justify-between items-center">

                  <div className="flex gap-4 text-sm text-[#8ec5eb]">
                    <i className="fa-solid fa-phone cursor-pointer"></i>
                    <i className="fa-regular fa-comment cursor-pointer"></i>
                    <i className="fa-brands fa-whatsapp cursor-pointer"></i>
                  </div>

                  <button className="rounded-md bg-white px-5 py-[6px] text-sm font-semibold text-[#0f4a76] hover:bg-[#e7f1fa]">
                    Details
                  </button>
                </div>
              </div>

              {/* 3 DOT MENU */}
              <div className="absolute top-3 right-3">
                <button
                  onClick={() => setMenuOpenId(menuOpenId === appt.id ? null : appt.id)}
                  className="text-[#d9ebf8] hover:text-white"
                >
                  <i className="fa-solid fa-ellipsis-vertical"></i>
                </button>

                {menuOpenId === appt.id && (
                  <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg text-sm z-50">

                    <button
                      className="w-full px-4 py-2 flex gap-2 hover:bg-gray-100"
                      onClick={() => {
                        setAppointmentToEdit(appt);
                        setShowReschedule(true);
                        setMenuOpenId(null);
                      }}
                    >
                      <i className="fa-regular fa-calendar"></i> Reschedule Meeting
                    </button>

                    <button
        className="w-full px-4 py-2 flex items-center gap-2 hover:bg-gray-100"
        onClick={() => {
          setAppointmentToCancel(appt);
          setShowCancelConfirm(true);
          setMenuOpenId(null);
        }}
      >
        <i className="fa-regular fa-calendar-xmark"></i>
        Cancel Meeting
      </button>

            <button
  className="w-full px-4 py-2 flex gap-2 hover:bg-gray-100"
  onClick={() => {
    setAppointmentToEdit(appt);  // <-- VERY IMPORTANT
    setSelectedMode(appt.platform || "zoom");
    setShowChangeMode(true);
    setMenuOpenId(null);
  }}
>
  <i className="fa-regular fa-pen-to-square"></i>
  Change Meeting Mode
</button>


                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
</main>

{/* RESCHEDULE POPUP */}
{showReschedule && (
  <div className="fixed inset-0 bg-black/40 z-50">
    {/* Right Drawer */}
    <div className="absolute top-0 right-0 w-[440px] h-full bg-white shadow-2xl animate-slide-left flex flex-col">

      {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b">
        <h2 className="text-[18px] font-semibold flex items-center gap-2">
          <i className="fa-regular fa-calendar text-[#103C8C]"></i>
          Reschedule Meeting
        </h2>
        <button onClick={() => setShowReschedule(false)}>
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>
      </div>
<div className="flex-1 overflow-y-auto px-6 py-6">
      {/* DATE PICKER */}
      <p className="text-sm mb-2 font-medium">Select Available Date</p>

      <div className="bg-[#103C8C] rounded-xl p-4 text-center text-white">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-3">
          <button
            onClick={() =>
              setRescheduleMonth(rescheduleMonth === 0 ? 11 : rescheduleMonth - 1)
            }
            className="hover:text-white text-white/70"
          >
            <i className="fa-solid fa-chevron-left"></i>
          </button>

          <p className="font-semibold">
            {new Date(rescheduleYear, rescheduleMonth).toLocaleString("en-US", {
              month: "long",
              year: "numeric",
            })}
          </p>

          <button
            onClick={() =>
              setRescheduleMonth(rescheduleMonth === 11 ? 0 : rescheduleMonth + 1)
            }
            className="hover:text-white text-white/70"
          >
            <i className="fa-solid fa-chevron-right"></i>
          </button>
        </div>

        {/* Week days */}
        <div className="grid grid-cols-7 gap-1 text-xs mb-1">
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
            <div className="font-medium text-white/70">{d}</div>
          ))}
        </div>

        {/* DATES */}
        <div className="grid grid-cols-7 gap-1 text-xs">
          {Array(new Date(rescheduleYear, rescheduleMonth, 1).getDay())
            .fill(null)
            .map((_, i) => <div key={i}></div>)}

          {Array.from({
            length: new Date(rescheduleYear, rescheduleMonth + 1, 0).getDate(),
          }).map((_, i) => {
            const day = i + 1;

            return (
              <div
                key={i}
                onClick={() => setRescheduleDay(day)}
                className={`py-1 rounded-md cursor-pointer ${
                  rescheduleDay === day
                    ? "bg-[#00B3FF] text-white font-bold"
                    : "hover:bg-[#00B3FF]/40 text-white/80"
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>

      {/* TIME PICKER */}
      <p className="text-sm mt-4 mb-2 font-medium">Select a Time</p>

      <div className="grid grid-cols-2 gap-3">
        {[
          "09:00 am – 10:00 am",
          "11:00 am – 12:00 pm",
          "01:00 pm – 02:00 pm",
          "03:00 pm – 04:00 pm",
          "05:00 pm – 06:00 pm",
        ].map((slot) => (
          <button
            key={slot}
            onClick={() => setRescheduleTime(slot)}
            className={`px-3 py-2 rounded-md border text-sm ${
              rescheduleTime === slot
                ? "bg-[#103C8C] text-white border-[#103C8C]"
                : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            {slot}
          </button>
        ))}
      </div>

      {/* MODE PICKER */}
      <select
        className="w-full mt-4 px-3 py-2 border rounded-md text-sm"
        value={rescheduleMode}
        onChange={(e) => setRescheduleMode(e.target.value)}
      >
        <option value="">Preferred meeting option</option>
        <option value="Duo">Duo</option>
        <option value="Google Meet">Google Meet</option>
        <option value="Zoom">Zoom</option>
      </select>
      </div>

      {/* FOOTER */}
       <div className="border-t px-6 py-4 flex justify-between">
        <button
          className="px-5 py-2 rounded-md border"
          onClick={() => setShowReschedule(false)}
        >
          Cancel
        </button>

     <button
  className="px-6 py-2 bg-[#103C8C] text-white rounded-md"
  onClick={handleReschedule}
>
  Reschedule
</button>

      </div>
    </div>
  </div>
)}

{/* SUCCESS POPUP */}
{rescheduleSuccess && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/20 z-50">
    <div className="bg-white px-8 py-4 rounded-full shadow-lg flex items-center gap-3">
      <i className="fa-solid fa-check text-green-600 text-xl"></i>
      <span className="text-[#0B1C58] font-medium">
        The Appointment has been Rescheduled
      </span>
    </div>
  </div>
)}


    {/* NEXT APPOINTMENT SECTION */}
{/* NEXT APPOINTMENT SECTION */}
<div className="mt-12 px-4 py-8 md:mt-16 md:px-8 md:py-12 lg:px-20">
  <h2 className="mb-4 text-base font-semibold text-white md:mb-6 md:text-[18px]">
    Next Appointment
  </h2>

  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-10">

    {upcomingAppointments.length === 0 && (
      <p className="text-gray-500">No upcoming appointments</p>
    )}

    {upcomingAppointments.map((appt) => {
      const mode = appt.platform || "Duo";
      const icon = getModeIcon(mode);
      const mentor = appt.mentor;

      return (
        <div
          key={appt.id}
          className="relative bg-[#0C4A85] rounded-2xl p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-5 items-start md:items-center shadow-md"
        >
          {/* 3 DOT MENU BUTTON */}
          <div className="absolute top-3 right-3 z-20">
            <button
              onClick={() =>
                setMenuOpenId(menuOpenId === appt.id ? null : appt.id)
              }
              className="text-white/80 hover:text-white"
            >
              <i className="fa-solid fa-ellipsis-vertical text-lg"></i>
            </button>

            {/* 3 DOT MENU DROPDOWN */}
            {menuOpenId === appt.id && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg text-sm z-50">
                
                <button
                  className="w-full px-4 py-2 flex gap-2 hover:bg-gray-100"
                  onClick={() => {
                    setAppointmentToEdit(appt);
                    setShowReschedule(true);
                    setMenuOpenId(null);
                  }}
                >
                  <i className="fa-regular fa-calendar"></i>
                  Reschedule Meeting
                </button>

                <button
                  className="w-full px-4 py-2 flex gap-2 hover:bg-gray-100"
                   onClick={() => {
          setAppointmentToCancel(appt);
          setShowCancelConfirm(true);
          setMenuOpenId(null);
        }}
                >
                  <i className="fa-regular fa-calendar-xmark"></i>
                  Cancel Meeting
                </button>

               <button
  className="w-full px-4 py-2 flex gap-2 hover:bg-gray-100"
  onClick={() => {
    setAppointmentToEdit(appt);  // <-- VERY IMPORTANT
    setSelectedMode(appt.platform || "zoom");
    setShowChangeMode(true);
    setMenuOpenId(null);
  }}
>
  <i className="fa-regular fa-pen-to-square"></i>
  Change Meeting Mode
</button>


              </div>
            )}
          </div>

          {/* MODE ICON */}
          <div className="bg-white rounded-xl flex items-center justify-center w-[100px] md:w-[140px] h-[100px] md:h-[140px] shrink-0">
            <Image
              src={icon}
              alt={mode}
              className="w-[50px] md:w-[60px] h-[50px] md:h-[60px]"
            />
          </div>

          {/* RIGHT CONTENT */}
          <div className="flex flex-col text-white w-full">

            {/* MENTOR */}
            <div className="flex items-center gap-3 mb-3">
              <Image
                src={mentor?.profilePicture || UserProfile}
                alt="Mentor"
                width={32}
                height={32}
                className="rounded-full border border-white/30 md:w-9 md:h-9"
              />
              <div>
                <h4 className="font-semibold text-sm">
                  {mentor?.firstName} {mentor?.lastName}
                </h4>
                <p className="text-xs text-white/70">Mentor</p>
              </div>
            </div>

            {/* DATE + TIME */}
            <div className="flex flex-col md:flex-row flex-wrap gap-2 mb-3">
              <div className="bg-[#FFFFFF1A] border border-[#FFFFFF33] rounded-md px-2 md:px-3 py-[3px] text-xs flex items-center gap-2">
                <i className="fa-regular fa-calendar text-[#E3D247]"></i>
                <span>Date: {formatDate(appt.meetingDate)}</span>
              </div>

              <div className="bg-[#FFFFFF1A] border border-[#FFFFFF33] rounded-md px-3 py-[3px] text-xs flex items-center gap-2">
                <i className="fa-regular fa-clock text-[#24E0C2]"></i>
                <span>Time: {formatTime(appt.meetingDate)}</span>
              </div>
            </div>

            {/* MODE + ACTIONS */}
            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-white/90 mb-2">
                  Mode:{" "}
                  <span className="text-[#B8D4FF] underline underline-offset-2">
                    {mode}
                  </span>
                </p>

                <div className="flex gap-4 text-white text-sm">
                  <i className="fa-solid fa-phone opacity-80 hover:opacity-100 cursor-pointer"></i>
                  <i className="fa-regular fa-comment opacity-80 hover:opacity-100 cursor-pointer"></i>
                  <i className="fa-brands fa-whatsapp opacity-80 hover:opacity-100 cursor-pointer"></i>
                </div>
              </div>

              <button className="bg-[#0B1C58] hover:bg-[#122D80] transition px-6 py-[6px] rounded-md text-sm font-medium">
                Details
              </button>
            </div>
          </div>
        </div>
      );
    })}
  </div>
</div>



      {/* ✅ RIGHT DRAWER (Mentor/Schedule Steps) */}
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
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-[#103C8C]"
  />
</div>


                {/* Mentor List */}
                <div className="space-y-2">
               {filteredMentors.map((m) => (
  <div
    key={m.id}
    onClick={() => setSelectedMentor(m)}
    className={`flex items-center justify-between px-4 py-3 border rounded-md cursor-pointer ${
      selectedMentor?.id === m.id
        ? "border-[#103C8C] bg-[#F3F6FF]"
        : "border-gray-200"
    }`}
  >
    {/* Left Section */}
    <div className="flex items-center gap-3">

      {/* Profile Picture placeholder */}
      <Image
        src={UserProfile}
        alt="mentor"
        width={32}
        height={32}
        className="rounded-full"
      />

      <div>
        <p className="text-sm font-medium text-[#0B1C58]">
          {m.firstName} {m.lastName}
        </p>
        <p className="text-xs text-gray-500 capitalize">
          {m.role.replace("-", " ")}
        </p>
      </div>
    </div>

    {/* Radio */}
    <input
      type="radio"
      checked={selectedMentor?.id === m.id}
      readOnly
      className="accent-[#103C8C]"
    />
  </div>
))}

                </div>
              </>
            ) : (
              <>
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

  {showPopup && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
    <div className="bg-white rounded-lg shadow-lg px-10 py-6 flex items-center gap-3 text-[#0B1C58] font-medium text-[15px] animate-fade-in">
      <i className="fa-solid fa-check text-green-600 text-xl"></i>
      New Appointment has been Scheduled
    </div>
  </div>
)}

{/* CANCEL CONFIRMATION POPUP */}
{showCancelConfirm && (
  <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
    <div className="bg-white rounded-xl w-[420px] p-6 shadow-lg text-center">

      <p className="text-[#0B1C58] font-semibold text-lg mb-6 leading-snug">
        Are you sure want to <br /> Cancel the Appointment ?
      </p>

      <div className="flex justify-center gap-4 mt-4">
        <button
          className="px-6 py-2 border border-gray-300 rounded-lg text-[#0B1C58] font-medium hover:bg-gray-100"
          onClick={() => setShowCancelConfirm(false)}
        >
          No
        </button>

        <button
          className="px-6 py-2 bg-[#103C8C] text-white rounded-lg font-medium hover:bg-[#0A2F70]"
        onClick={handleCancelAppointment}

        >
          Yes
        </button>
      </div>
    </div>
  </div>
)}

{/* SUCCESS — APPOINTMENT CANCELED */}
{showCancelSuccess && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
    <div className="bg-white px-10 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in">

      <i className="fa-solid fa-check text-green-600 text-2xl"></i>

      <span className="text-[#0B1C58] font-medium text-[15px]">
        Appointment has been Canceled
      </span>
    </div>
  </div>
)}

{showChangeMode && (
  <div className="fixed inset-0 z-[90] bg-black/30 flex items-center justify-center">

    <div className="bg-white w-[420px] rounded-xl shadow-lg p-6 animate-fade-in">

      {/* Header */}
      <h2 className="text-[16px] font-semibold text-[#0B1C58] mb-4">
        Choose your meeting option
      </h2>

      {/* Divider */}
      <hr className="mb-4" />

      {/* OPTIONS */}
      <div className="space-y-3 text-[14px] text-[#0B1C58]">

        {[
          "Zoom",
          "Google Meet",
          "Teams",
          "Whatsapp",
          "Phone call",
        ].map((mode) => (
          <label key={mode} className="flex items-center gap-3 cursor-pointer">
            <input
              type="radio"
              name="meetingMode"
              checked={selectedMode === mode}
              onChange={() => setSelectedMode(mode)}
              className="w-4 h-4 text-[#103C8C] accent-[#103C8C]"
            />
            <span>{mode}</span>
          </label>
        ))}

      </div>

      {/* FOOTER BUTTONS */}
      <div className="flex justify-end gap-3 mt-6">

        <button
          onClick={() => setShowChangeMode(false)}
          className="px-5 py-2 rounded-md border border-gray-300 text-sm"
        >
          Cancel
        </button>

      <button
  onClick={handleChangeMode}
  className="px-6 py-2 bg-[#103C8C] text-white rounded-md text-sm"
>
  Save
</button>


      </div>
    </div>

  </div>
)}

{modeSuccess && (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20">
    <div className="bg-white px-10 py-4 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in">
      <i className="fa-solid fa-check text-green-600 text-2xl"></i>
      <span className="text-[#0B1C58] font-medium text-[15px]">
        Meeting Mode has been Changed to {selectedMode}
      </span>
    </div>
  </div>
)}




    </div>
  );
}
