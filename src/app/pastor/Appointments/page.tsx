"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorSearchBar from "@/app/Components/pastor/PastorSearchBar";
import AvailabilityCalendar from "@/app/Components/AvailabilityCalendar";
import {
  pastorContainer,
  pastorControlsRow,
  pastorDarkSelect,
  pastorEyebrowDot,
  pastorEyebrowPill,
  pastorFieldLabel,
  pastorGlassCard,
  pastorHeroOverlay,
  pastorMainGradient,
  pastorPageRoot,
  pastorPrimaryCta,
} from "@/app/Components/pastor/pastor-theme";
import HeroBg from "@/app/Assets/roadmap-bg.png";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import UserProfile from "../../Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import axiosInstance from "@/app/Services/config/axios-instance";
import {
  apiCancelAppointment,
  apiCreateAppointment,
  apiGetAppointments,
  apiGetMonthlyAvailability,
  apiGetWeeklyAvailability,
  apiGetUserSchedule,
  apiRescheduleAppointment,
  apiUpdateAppointment,
} from "@/app/Services/appointments.service";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import {
  appointmentEntityId,
  formatAvailabilitySlotLabel,
  meetingDateLocalYmd,
  parseSlotStartToIso,
  slotDateToYmd,
  uiMeetingModeToPlatform,
  unwrapAppointmentsAxiosData,
  unwrapMonthlyAvailabilityPayload,
} from "@/app/Services/appointment-utils";
import { getCookie } from "@/app/utils/cookies";
import { filterSlotsAfter2Hours } from "@/app/Services/utils/helpers";




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
  const [schedulePlatform, setSchedulePlatform] = useState("Zoom");
  const [availableTimesForBooking, setAvailableTimesForBooking] = useState<any[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [appointmentsTab, setAppointmentsTab] = useState<"next" | "history">("next");
  const [monthlyAvailabilitySlots, setMonthlyAvailabilitySlots] = useState<any[]>([]);
  const router = useRouter();

  const showToast = (msg: string, duration = 3000) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), duration);
  };




  // Reschedule modal states

  const [rescheduleDay, setRescheduleDay] = useState(today.getDate());
  const [rescheduleMonth, setRescheduleMonth] = useState(today.getMonth());
  const [rescheduleYear, setRescheduleYear] = useState(today.getFullYear());
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleMode, setRescheduleMode] = useState("");

  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);
  const [rescheduleAvailableTimes, setRescheduleAvailableTimes] = useState<any[]>([]);
  const [rescheduleMonthlySlots, setRescheduleMonthlySlots] = useState<any[]>([]);
  const [rescheduleAvailabilityLoading, setRescheduleAvailabilityLoading] = useState(false);




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

  const handleReschedulePrevMonth = () => {
    if (rescheduleMonth === 0) {
      setRescheduleMonth(11);
      setRescheduleYear(rescheduleYear - 1);
    } else {
      setRescheduleMonth(rescheduleMonth - 1);
    }
  };

  const handleRescheduleNextMonth = () => {
    if (rescheduleMonth === 11) {
      setRescheduleMonth(0);
      setRescheduleYear(rescheduleYear + 1);
    } else {
      setRescheduleMonth(rescheduleMonth + 1);
    }
  };



  function getPastorUserId(): string | null {
    const direct = getCookie("userId")?.trim();
    if (direct) return direct;
    try {
      const c = getCookie("user");
      if (c) {
        const u = JSON.parse(c);
        const id = u?.id || u?._id;
        if (id) return String(id);
      }
    } catch {
      /* ignore */
    }
    try {
      const raw = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      if (raw) {
        const u = JSON.parse(raw);
        const id = u?.id || u?._id;
        if (id) return String(id);
      }
    } catch {
      /* ignore */
    }
    return null;
  }

  const refreshAppointmentLists = async (): Promise<any[]> => {
    const userId = getPastorUserId();
    if (!userId) return [];
    try {
      const [scheduleResult, upcomingResult] = await Promise.allSettled([
        apiGetUserSchedule(userId),
        apiGetAppointments({ userId, futureOnly: true }),
      ]);
      const scheduleData =
        scheduleResult.status === "fulfilled" ? unwrapAppointmentsAxiosData(scheduleResult.value) : [];
      setAppointments(scheduleData);

      const todayYmd = new Date().toLocaleDateString("en-CA");
      setAppointmentsToday(
        scheduleData.filter((a: any) => {
          if (!a?.meetingDate) return false;
          return meetingDateLocalYmd(String(a.meetingDate)) === todayYmd;
        }) as any,
      );

      if (upcomingResult.status === "fulfilled") {
        const upcomingData = unwrapAppointmentsAxiosData(upcomingResult.value);
        const nowMs = Date.now();
        const upcomingSorted = upcomingData
          .filter((a: any) => {
            if (!a?.meetingDate) return false;
            const t = new Date(a.meetingDate).getTime();
            return !Number.isNaN(t) && t >= nowMs - 60_000;
          })
          .sort(
            (a: any, b: any) =>
              new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime(),
          );
        setUpcomingAppointments((upcomingSorted.length ? upcomingSorted : upcomingData) as any);
      } else {
        setUpcomingAppointments([] as any);
      }

      return scheduleData;
    } catch (err) {
      console.error("Error fetching appointments:", err);
    }
    return [];
  };

  useEffect(() => {
    refreshAppointmentLists();
  }, []);

  /** Keep selected day valid when month/year changes (e.g. Jan 31 → Feb). */
  useEffect(() => {
    const max = getDaysInMonth(currentMonth, currentYear);
    setSelectedDate((d) => (d > max ? max : d));
  }, [currentMonth, currentYear]);





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
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  useEffect(() => {
    async function fetchMentors() {
      const uid = getPastorUserId();
      if (!uid) {
        setMentors([]);
        setFilteredMentors([]);
        return;
      }
      try {
        const res = await apiGetAssignedUsers(uid);
        const body = res.data as { data?: unknown };
        const raw = Array.isArray(body?.data) ? body.data : [];
        const list = (raw as Record<string, unknown>[]).map((m) => ({
          ...m,
          id: m.id ?? m._id,
          _id: m._id ?? m.id,
          firstName: m.firstName ?? "",
          lastName: m.lastName ?? "",
          role: m.role ?? "mentor",
        }));
        setMentors(list);
        setFilteredMentors(list);
      } catch (error) {
        console.error("Error fetching mentors", error);
        setMentors([]);
        setFilteredMentors([]);
      }
    }
    if (drawerStep === "mentor") {
      void fetchMentors();
    }
  }, [drawerStep]);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredMentors(mentors);
    } else {
      setFilteredMentors(
        mentors.filter((m) =>
          `${m.firstName ?? ""} ${m.lastName ?? ""} ${(m as { name?: string }).name ?? ""}`
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
      );
    }
  }, [search, mentors]);

  useEffect(() => {
    if (drawerStep !== "schedule" || !selectedMentor) {
      setAvailableTimesForBooking([]);
      setMonthlyAvailabilitySlots([]);
      setAvailabilityLoading(false);
      return;
    }
    const mentorId = String(selectedMentor.id ?? selectedMentor._id ?? "").trim();
    if (!mentorId) return;

    let cancelled = false;
    (async () => {
      try {
        setAvailabilityLoading(true);
        const selectedYmdForWeek = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
        const selectedYmd = new Date(currentYear, currentMonth, selectedDate).toLocaleDateString("en-CA");
        let slots: any[] = [];
        try {
          // Use year/month parameters format
          const availRes = await axiosInstance.get(`/appointments/availability/${mentorId}/month`, {
            params: { year: currentYear, month: currentMonth + 1 },
          });
          const raw = availRes.data?.data ?? availRes.data;
          slots = Array.isArray(raw) ? raw : [];
        } catch {
          try {
            const wk = await apiGetWeeklyAvailability(String(mentorId), selectedYmdForWeek);
            const wRaw = unwrapMonthlyAvailabilityPayload(wk);
            if (wRaw.length) slots = wRaw;
            else {
              const d = (wk.data as { data?: unknown })?.data;
              if (Array.isArray(d)) slots = d;
            }
          } catch {
            slots = [];
          }
        }

        // Store the monthly slots for the calendar
        if (!cancelled) {
          setMonthlyAvailabilitySlots(slots);
        }

        const dateSlot = slots.find((slot: any) => {
          const ymd = slotDateToYmd(
            slot?.date ?? slot?.day ?? slot?.calendarDate ?? slot?.meetingDate ?? slot?.dateString,
          );
          return ymd === selectedYmd;
        });

        let times: string[] = [];
        if (dateSlot?.slots?.length) {
          times = (dateSlot.slots as any[])
            .map((raw: any) => formatAvailabilitySlotLabel(raw))
            .filter((s: string) => s.length > 0);
          times = filterSlotsAfter2Hours(times, selectedYmd);
        }

        if (!times.length) {
          const dayData = slots.find((day: any) => day?.date === selectedYmd);
          if (dayData && Array.isArray(dayData.slots) && dayData.slots.length > 0) {
            const mapped = dayData.slots.map((slot: any) => {
              const start = `${slot.startTime} ${String(slot.startPeriod || "").toLowerCase()}`;
              const end = `${slot.endTime} ${String(slot.endPeriod || "").toLowerCase()}`;
              return `${start.trim()} – ${end.trim()}`;
            });
            times = filterSlotsAfter2Hours(mapped, selectedYmd);
          }
        }

        // Remove slots that are already booked (by any non-cancelled appointment on this day with this mentor)
        const mentorIdStr = String(selectedMentor.id ?? selectedMentor._id ?? "");
        const bookedMs = (appointments as any[])
          .filter((a: any) => {
            const apptMentorId = String(a.mentor?._id ?? a.mentor?.id ?? a.mentorId ?? "");
            const status = String(a.status ?? "").toLowerCase();
            return (
              apptMentorId === mentorIdStr &&
              !status.includes("cancel") &&
              typeof a.meetingDate === "string" &&
              a.meetingDate.startsWith(selectedYmd)
            );
          })
          .map((a: any) => new Date(a.meetingDate).getTime())
          .filter((ms: number) => !Number.isNaN(ms));

        times = times.filter((label: string) => {
          const slotMs = new Date(parseSlotStartToIso(selectedYmd, label)).getTime();
          return !bookedMs.some((bMs: number) => Math.abs(bMs - slotMs) < 30 * 60 * 1000);
        });

        if (!cancelled) {
          setAvailableTimesForBooking(times);
          setAvailabilityLoading(false);
        }
      } catch (error) {
        console.error("Error fetching availability:", error);
        if (!cancelled) {
          setAvailableTimesForBooking([]);
          setMonthlyAvailabilitySlots([]);
          setAvailabilityLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [drawerStep, selectedMentor, currentYear, currentMonth, selectedDate, availabilityRefreshKey, appointments]);

  const handleSchedule = async () => {
    if (isScheduling) return;
    const mid = selectedMentor?.id || selectedMentor?._id;
    if (!mid) {
      showToast("Please select a mentor");
      return;
    }

    if (!selectedTime) {
      showToast("Please select a time");
      return;
    }

    const userId = getPastorUserId();
    if (!userId) {
      showToast("Please sign in again.");
      return;
    }

    const yyyyMmDd = new Date(currentYear, currentMonth, selectedDate).toLocaleDateString("en-CA");
    const meetingDateISO = parseSlotStartToIso(yyyyMmDd, selectedTime);
    const proposedMs = new Date(meetingDateISO).getTime();
    const hasOverlap = (appointments as any[]).some((a: any) => {
      const t = new Date(String(a.meetingDate ?? "")).getTime();
      return !Number.isNaN(t) && Math.abs(t - proposedMs) < 60 * 60 * 1000;
    });
    if (hasOverlap) {
      showToast("This time slot overlaps with an existing appointment.");
      return;
    }

    setIsScheduling(true);

    const payload = {
      userId,
      mentorId: String(mid),
      meetingDate: meetingDateISO,
      platform: uiMeetingModeToPlatform(schedulePlatform),
      notes: "Mentorship session",
    };

    try {
      await apiCreateAppointment(payload);

      setAvailabilityRefreshKey(prev => prev + 1);
      setDrawerOpen(false);
      setShowPopup(true);
      setSelectedTime("");
      await refreshAppointmentLists();
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      showToast("Failed to schedule appointment.");
    } finally {
      setIsScheduling(false);
    }
  };
  const handleReschedule = async () => {
    if (!appointmentToEdit) return;
    const id = appointmentEntityId(appointmentToEdit);
    if (!id) return;
    if (!rescheduleTime) {
      showToast("Please select a time");
      return;
    }

    try {
      const dateObj = new Date(rescheduleYear, rescheduleMonth, rescheduleDay);
      const yyyyMMdd = dateObj.toLocaleDateString("en-CA");
      const newDate = parseSlotStartToIso(yyyyMMdd, rescheduleTime);

      // Extract startTime/startPeriod from slot label e.g. "3:00 PM - 4:00 PM"
      const firstPart = rescheduleTime.replace(/\u2013/g, "-").split("-")[0]?.trim() ?? "";
      const tMatch = firstPart.match(/^(\d{1,2}):(\d{2})\s*(am|pm)/i);
      const startTime = tMatch ? `${tMatch[1]}:${tMatch[2]}` : "12:00";
      const startPeriod = tMatch ? tMatch[3].toUpperCase() : "PM";

      await apiRescheduleAppointment(id, {
        newDate,
        startTime,
        startPeriod,
        ...(rescheduleMode ? { platform: uiMeetingModeToPlatform(rescheduleMode) as any } : {}),
      });

      setShowReschedule(false);
      setRescheduleSuccess(true);
      setTimeout(() => setRescheduleSuccess(false), 2000);
      await refreshAppointmentLists();
    } catch (err) {
      console.error("Reschedule API error:", err);
      showToast("Failed to reschedule appointment");
    }
  };

  useEffect(() => {
    if (!showReschedule || !appointmentToEdit) {
      setRescheduleAvailableTimes([]);
      setRescheduleMonthlySlots([]);
      return;
    }

    const mentorId = appointmentToEdit.mentor?.id || appointmentToEdit.mentor?._id;
    if (!mentorId) {
      setRescheduleAvailableTimes([]);
      setRescheduleMonthlySlots([]);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setRescheduleAvailabilityLoading(true);
        const res = await axiosInstance.get(`/appointments/availability/${mentorId}/month`, {
          params: { year: rescheduleYear, month: rescheduleMonth + 1 },
        });

        if (!cancelled) {
          const slots = res.data?.data || [];
          setRescheduleMonthlySlots(slots);

          const selectedYmd = `${rescheduleYear}-${String(rescheduleMonth + 1).padStart(2, "0")}-${String(rescheduleDay).padStart(2, "0")}`;
          const daySlots = slots.find((slot: any) => slot.date === selectedYmd);

          let times: string[] = [];
          if (daySlots?.slots?.length) {
            times = (daySlots.slots as any[])
              .map((raw: any) => formatAvailabilitySlotLabel(raw))
              .filter((s: string) => s.length > 0);
            times = filterSlotsAfter2Hours(times, selectedYmd);
          }
          setRescheduleAvailableTimes(times);
          setRescheduleAvailabilityLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch reschedule availability:", err);
          setRescheduleAvailableTimes([]);
          setRescheduleMonthlySlots([]);
          setRescheduleAvailabilityLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [showReschedule, appointmentToEdit, rescheduleYear, rescheduleMonth, rescheduleDay]);

  useEffect(() => {
    if (showPopup) {
      const t = setTimeout(() => setShowPopup(false), 2000);
      return () => clearTimeout(t);
    }
  }, [showPopup]);

  const handleChangeMode = async () => {
    if (!appointmentToEdit) return;
    const id = appointmentEntityId(appointmentToEdit);
    if (!id) return;

    try {
      const platform = uiMeetingModeToPlatform(selectedMode);
      await apiUpdateAppointment(id, {
        platform: platform as any,
        notes: `Meeting mode: ${selectedMode}`,
        status: "scheduled",
      });

      setShowChangeMode(false);
      setModeSuccess(true);
      setTimeout(() => setModeSuccess(false), 2000);
      await refreshAppointmentLists();
    } catch (err) {
      console.error("Change meeting mode error:", err);
      showToast("Failed to update meeting mode");
    }
  };

  const filteredAppointmentsToday = appointmentsToday as Record<string, unknown>[];

  const selectedCalendarYmd = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDate).padStart(2, "0")}`;
  const todayYmd = new Date().toLocaleDateString("en-CA");
  const filteredAppointmentsForSelectedDate = (appointments as Record<string, unknown>[]).filter((a) => {
    if (!a?.meetingDate) return false;
    return meetingDateLocalYmd(String(a.meetingDate)) === selectedCalendarYmd;
  });

  const filteredUpcoming = upcomingAppointments as Record<string, unknown>[];

  const filteredHistory = useMemo(() => {
    const nowMs = Date.now();
    return (appointments as Record<string, unknown>[])
      .filter((a) => {
        const raw = String(a.meetingDate ?? "");
        if (!raw) return false;
        const t = new Date(raw).getTime();
        return !Number.isNaN(t) && t < nowMs;
      })
      .sort(
        (a, b) =>
          new Date(String(b.meetingDate ?? "")).getTime() -
          new Date(String(a.meetingDate ?? "")).getTime(),
      );
  }, [appointments]);

  const handleCancelAppointment = async () => {
    if (!appointmentToCancel) return;
    const id = appointmentEntityId(appointmentToCancel);
    if (!id) return;

    try {
      await apiCancelAppointment(id);
    } catch (error) {
      console.error("Cancel API error:", error);
    }

    setShowCancelConfirm(false);
    const freshList = await refreshAppointmentLists();
    const stillActive = freshList?.find(
      (a: any) =>
        appointmentEntityId(a) === id &&
        !["cancelled", "canceled"].includes((a.status || "").toLowerCase()),
    );
    if (!stillActive) {
      setShowCancelSuccess(true);
      setTimeout(() => setShowCancelSuccess(false), 2000);
    } else {
      showToast("Failed to cancel appointment");
    }
  };




  return (
    <div className={pastorPageRoot}>
      <PastorHeader showFullHeader={true} />

      <section
        className="
          relative flex h-[180px] items-end bg-cover bg-bottom
          px-6 pb-6 text-white
          sm:h-[200px] sm:px-10 sm:pb-8
          md:h-[250px] md:px-20 md:pb-10
        "
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className={pastorHeroOverlay} />
        <div className="relative z-10">
          <p className={pastorEyebrowPill}>
            <span className={pastorEyebrowDot} />
            Leadership Support Network
          </p>
          <h1 className="text-2xl sm:text-3xl font-semibold">Appointments</h1>
          <p className="mt-2 max-w-xl text-sm text-[#d9ebf8] md:text-base">
            Manage your scheduled sessions and upcoming mentor meetings.
          </p>
        </div>
      </section>

      <main className={pastorMainGradient}>
        <div className={pastorContainer}>
          <div className={pastorControlsRow}>
            <div className="ml-auto">
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(true);
                  setDrawerStep("mentor");
                }}
                className={`flex shrink-0 items-center justify-center gap-2 ${pastorPrimaryCta}`}
              >
                <i className="fa-solid fa-plus text-xs" /> New Meeting
              </button>
            </div>
          </div>

          {/* CALENDAR + TODAY'S APPOINTMENTS */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">

            {/* LEFT — MONTHLY CALENDAR */}
            <div className={`${pastorGlassCard} !flex-col p-4 text-white md:p-6`}>
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
                    const dayDate = new Date(currentYear, currentMonth, day);
                    dayDate.setHours(0, 0, 0, 0);
                    const todayDate = new Date();
                    todayDate.setHours(0, 0, 0, 0);
                    const isPast = dayDate < todayDate;
                    const dayYmd = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const hasAppointment = (appointments as any[]).some((a) => {
                      if (!a?.meetingDate) return false;
                      return meetingDateLocalYmd(String(a.meetingDate)) === dayYmd;
                    });
                    const isSelected = day === selectedDate;

                    return (
                      <div
                        key={i}
                        onClick={() => setSelectedDate(day)}
                        className={`py-1 rounded-md transition cursor-pointer ${isPast
                          ? "opacity-50"
                          : ""
                          } ${isSelected
                            ? "bg-[#00B3FF] text-white font-bold"
                            : "text-white/80 hover:bg-[#00B3FF]/40"
                          } ${hasAppointment && !isPast ? "ring-1 ring-amber-300/70" : ""
                          }`}
                      >
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT — SELECTED DATE APPOINTMENTS */}
            <div>
              <h3 className="mb-4 text-sm font-semibold text-white md:text-[15px]">
                {selectedCalendarYmd === todayYmd
                  ? `You have ${filteredAppointmentsForSelectedDate.length} appointment${filteredAppointmentsForSelectedDate.length === 1 ? "" : "s"} today`
                  : `${new Date(`${selectedCalendarYmd}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} — ${filteredAppointmentsForSelectedDate.length} appointment${filteredAppointmentsForSelectedDate.length === 1 ? "" : "s"}`
                }
              </h3>

              <div className="flex flex-col gap-4 md:gap-6">

                {filteredAppointmentsForSelectedDate.length === 0 && (
                  <p className="text-sm text-[#cde2f2]/90">No appointments on this date.</p>
                )}

                {filteredAppointmentsForSelectedDate.map((appt) => {
                  const mentor = appt.mentor as { profilePicture?: string; firstName?: string; lastName?: string } | undefined;
                  const icon = getModeIcon(appt.platform);

                  const dateObj = new Date(String(appt.meetingDate ?? ""));
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
                      key={appointmentEntityId(appt)}
                      className={`relative flex flex-col items-start gap-5 p-4 md:flex-row md:items-center md:p-5 ${pastorGlassCard} ${menuOpenId === appointmentEntityId(appt) ? "z-[60]" : ""}`}
                      style={menuOpenId === appointmentEntityId(appt) ? { overflow: "visible" } : undefined}
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
                            <p className="text-[11px] capitalize text-[#8ec5eb]">{String((mentor as any)?.role ?? "Mentor")}</p>
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
                          <span className="font-semibold text-[#8ec5eb]"> {String(appt.platform ?? "")}</span>
                        </p>

                        {/* Actions row */}
                        <div className="flex justify-between items-center">

                          <div className="flex gap-4 text-sm text-[#8ec5eb]">
                            <a href={(appt.mentor as any)?.phoneNumber ? `tel:${(appt.mentor as any).phoneNumber}` : undefined} aria-label="Call mentor" className="hover:text-white transition"><i className="fa-solid fa-phone" /></a>
                            <a href={(appt.mentor as any)?.phoneNumber ? `sms:${(appt.mentor as any).phoneNumber}` : undefined} aria-label="Text mentor" className="hover:text-white transition"><i className="fa-regular fa-comment" /></a>
                            <a href={(appt.mentor as any)?.phoneNumber ? `https://wa.me/${String((appt.mentor as any).phoneNumber).replace(/\D/g, "")}` : undefined} target="_blank" rel="noreferrer" aria-label="WhatsApp mentor" className="hover:text-white transition"><i className="fa-brands fa-whatsapp" /></a>
                          </div>

                          <button type="button" onClick={() => router.push(`/pastor/appointments/${encodeURIComponent(appointmentEntityId(appt))}`)} className={pastorPrimaryCta}>
                            Details
                          </button>
                        </div>
                      </div>

                      {/* 3 DOT MENU */}
                      <div className="absolute top-3 right-3">
                        <button
                          onClick={() =>
                            setMenuOpenId(menuOpenId === appointmentEntityId(appt) ? null : appointmentEntityId(appt))
                          }
                          className="text-[#d9ebf8] hover:text-white"
                        >
                          <i className="fa-solid fa-ellipsis-vertical"></i>
                        </button>

                        {menuOpenId === appointmentEntityId(appt) && (
                          <div className="absolute right-0 top-9 z-[50] w-[220px] overflow-hidden rounded-xl border border-white/20 bg-[#0a3558]/95 py-1 text-sm text-[#d9ebf8] shadow-xl backdrop-blur-md">

                            <button
                              type="button"
                              className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                              onClick={() => {
                                setAppointmentToEdit(appt);
                                setShowReschedule(true);
                                setMenuOpenId(null);
                              }}
                            >
                              <i className="fa-regular fa-calendar mr-2 text-[#8ec5eb]" /> Reschedule Meeting
                            </button>

                            <button
                              type="button"
                              className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                              onClick={() => {
                                setAppointmentToCancel(appt);
                                setShowCancelConfirm(true);
                                setMenuOpenId(null);
                              }}
                            >
                              <i className="fa-regular fa-calendar-xmark mr-2 text-red-300" />
                              Cancel Meeting
                            </button>

                            <button
                              type="button"
                              className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                              onClick={() => {
                                setAppointmentToEdit(appt);  // <-- VERY IMPORTANT
                                setSelectedMode(appt.platform || "zoom");
                                setShowChangeMode(true);
                                setMenuOpenId(null);
                              }}
                            >
                              <i className="fa-regular fa-pen-to-square mr-2 text-[#8ec5eb]" />
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

          <section className="mt-10 border-t border-white/10 pt-10 md:mt-14 md:pt-12">
            <div className="mb-4 flex items-center gap-2 md:mb-6">
              <button
                type="button"
                onClick={() => setAppointmentsTab("next")}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${appointmentsTab === "next"
                    ? "border-[#8ec5eb]/60 bg-[#8ec5eb]/20 text-white"
                    : "border-white/20 bg-white/5 text-[#cde2f2] hover:bg-white/10"
                  }`}
              >
                Next appointments
              </button>
              <button
                type="button"
                onClick={() => setAppointmentsTab("history")}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${appointmentsTab === "history"
                    ? "border-[#8ec5eb]/60 bg-[#8ec5eb]/20 text-white"
                    : "border-white/20 bg-white/5 text-[#cde2f2] hover:bg-white/10"
                  }`}
              >
                Appointment history
              </button>
            </div>

            {appointmentsTab === "next" ? (
              <div className="grid grid-cols-1 gap-6 md:gap-10 lg:grid-cols-2">
                {filteredUpcoming.length === 0 && (
                  <p className="text-sm text-[#cde2f2]/90">No upcoming appointments.</p>
                )}

                {filteredUpcoming.map((appt) => {
                  const mode = String(appt.platform ?? "Duo");
                  const icon = getModeIcon(mode);
                  const mentor = appt.mentor as { profilePicture?: string; firstName?: string; lastName?: string } | undefined;

                  return (
                    <div
                      key={appointmentEntityId(appt)}
                      className={`relative flex flex-col items-start gap-4 p-4 md:flex-row md:items-center md:gap-5 md:p-6 ${pastorGlassCard} ${menuOpenId === appointmentEntityId(appt) ? "z-[60]" : ""}`}
                      style={menuOpenId === appointmentEntityId(appt) ? { overflow: "visible" } : undefined}
                    >
                      <div className="absolute right-3 top-3 z-20">
                        <button
                          type="button"
                          onClick={() =>
                            setMenuOpenId(
                              menuOpenId === appointmentEntityId(appt) ? null : appointmentEntityId(appt),
                            )
                          }
                          className="text-[#d9ebf8] hover:text-white"
                        >
                          <i className="fa-solid fa-ellipsis-vertical text-lg" />
                        </button>

                        {menuOpenId === appointmentEntityId(appt) && (
                          <div className="absolute right-0 top-9 z-[50] w-[220px] overflow-hidden rounded-xl border border-white/20 bg-[#0a3558]/95 py-1 text-sm text-[#d9ebf8] shadow-xl backdrop-blur-md">
                            <button
                              type="button"
                              className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                              onClick={() => {
                                setAppointmentToEdit(appt);
                                setShowReschedule(true);
                                setMenuOpenId(null);
                              }}
                            >
                              <i className="fa-regular fa-calendar mr-2 text-[#8ec5eb]" /> Reschedule Meeting
                            </button>

                            <button
                              type="button"
                              className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                              onClick={() => {
                                setAppointmentToCancel(appt);
                                setShowCancelConfirm(true);
                                setMenuOpenId(null);
                              }}
                            >
                              <i className="fa-regular fa-calendar-xmark mr-2 text-red-300" />
                              Cancel Meeting
                            </button>

                            <button
                              type="button"
                              className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                              onClick={() => {
                                setAppointmentToEdit(appt);
                                setSelectedMode(appt.platform || "zoom");
                                setShowChangeMode(true);
                                setMenuOpenId(null);
                              }}
                            >
                              <i className="fa-regular fa-pen-to-square mr-2 text-[#8ec5eb]" />
                              Change Meeting Mode
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-xl bg-white/95 md:h-[140px] md:w-[140px]">
                        <Image src={icon} alt={String(mode)} className="h-[50px] w-[50px] md:h-[60px] md:w-[60px]" />
                      </div>

                      <div className="flex w-full flex-col text-white">
                        <div className="mb-3 flex items-center gap-3">
                          <Image
                            src={mentor?.profilePicture || UserProfile}
                            alt="Mentor"
                            width={32}
                            height={32}
                            className="rounded-full border border-white/30 md:h-9 md:w-9"
                          />
                          <div>
                            <h4 className="text-sm font-semibold">
                              {mentor?.firstName} {mentor?.lastName}
                            </h4>
                            <p className="text-xs capitalize text-[#8ec5eb]">{String((mentor as any)?.role ?? "Mentor")}</p>
                          </div>
                        </div>

                        <div className="mb-3 flex flex-col flex-wrap gap-2 md:flex-row">
                          <div className="flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-2 py-[3px] text-xs text-[#d9ebf8] md:px-3">
                            <i className="fa-regular fa-calendar text-[#E3D247]" />
                            <span>Date: {formatDate(String(appt.meetingDate ?? ""))}</span>
                          </div>

                          <div className="flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-[3px] text-xs text-[#d9ebf8]">
                            <i className="fa-regular fa-clock text-[#24E0C2]" />
                            <span>Time: {formatTime(String(appt.meetingDate ?? ""))}</span>
                          </div>
                        </div>

                        <div className="flex items-end justify-between">
                          <div>
                            <p className="mb-2 text-xs text-[#d9ebf8]">
                              Mode:{" "}
                              <span className="font-medium text-[#8ec5eb] underline underline-offset-2">
                                {mode}
                              </span>
                            </p>

                            <div className="flex gap-4 text-sm text-[#cde2f2]">
                              <a href={(appt.mentor as any)?.phoneNumber ? `tel:${(appt.mentor as any).phoneNumber}` : undefined} aria-label="Call mentor" className="opacity-80 hover:opacity-100 transition"><i className="fa-solid fa-phone" /></a>
                              <a href={(appt.mentor as any)?.phoneNumber ? `sms:${(appt.mentor as any).phoneNumber}` : undefined} aria-label="Text mentor" className="opacity-80 hover:opacity-100 transition"><i className="fa-regular fa-comment" /></a>
                              <a href={(appt.mentor as any)?.phoneNumber ? `https://wa.me/${String((appt.mentor as any).phoneNumber).replace(/\D/g, "")}` : undefined} target="_blank" rel="noreferrer" aria-label="WhatsApp mentor" className="opacity-80 hover:opacity-100 transition"><i className="fa-brands fa-whatsapp" /></a>
                            </div>
                          </div>

                          <button type="button" onClick={() => router.push(`/pastor/appointments/${encodeURIComponent(appointmentEntityId(appt))}`)} className={pastorPrimaryCta}>
                            Details
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-6 md:gap-10 lg:grid-cols-2">
                {filteredHistory.length === 0 && (
                  <p className="text-sm text-[#cde2f2]/90">No appointment history yet.</p>
                )}

                {filteredHistory.map((appt) => {
                  const mode = String(appt.platform ?? "Duo");
                  const icon = getModeIcon(mode);
                  const mentor = appt.mentor as { profilePicture?: string; firstName?: string; lastName?: string } | undefined;

                  return (
                    <div
                      key={`history-${appointmentEntityId(appt as any)}`}
                      className={`relative flex flex-col items-start gap-4 p-4 md:flex-row md:items-center md:gap-5 md:p-6 ${pastorGlassCard}`}
                    >
                      <div className="flex h-[100px] w-[100px] shrink-0 items-center justify-center rounded-xl bg-white/95 md:h-[140px] md:w-[140px]">
                        <Image src={icon} alt={String(mode)} className="h-[50px] w-[50px] md:h-[60px] md:w-[60px]" />
                      </div>

                      <div className="flex w-full flex-col text-white">
                        <div className="mb-3 flex items-center gap-3">
                          <Image
                            src={mentor?.profilePicture || UserProfile}
                            alt="Mentor"
                            width={32}
                            height={32}
                            className="rounded-full border border-white/30 md:h-9 md:w-9"
                          />
                          <div>
                            <h4 className="text-sm font-semibold">
                              {mentor?.firstName} {mentor?.lastName}
                            </h4>
                            <p className="text-xs capitalize text-[#8ec5eb]">{String((mentor as any)?.role ?? "Mentor")}</p>
                          </div>
                        </div>

                        <div className="mb-3 flex flex-col flex-wrap gap-2 md:flex-row">
                          <div className="flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-2 py-[3px] text-xs text-[#d9ebf8] md:px-3">
                            <i className="fa-regular fa-calendar text-[#E3D247]" />
                            <span>Date: {formatDate(String(appt.meetingDate ?? ""))}</span>
                          </div>

                          <div className="flex items-center gap-2 rounded-md border border-white/20 bg-white/10 px-3 py-[3px] text-xs text-[#d9ebf8]">
                            <i className="fa-regular fa-clock text-[#24E0C2]" />
                            <span>Time: {formatTime(String(appt.meetingDate ?? ""))}</span>
                          </div>
                        </div>

                        <p className="mb-2 text-xs text-[#d9ebf8]">
                          Mode:{" "}
                          <span className="font-medium text-[#8ec5eb] underline underline-offset-2">
                            {mode}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* RESCHEDULE POPUP */}
      {showReschedule && (
        <div className="fixed inset-0 bg-[#041f35]/70 backdrop-blur-sm z-50">
          {/* Right Drawer */}
          <div className="absolute top-0 right-0 w-[440px] h-full bg-[linear-gradient(180deg,rgba(10,52,88,0.97)_0%,rgba(4,28,48,0.99)_100%)] border-l border-[#8ec5eb]/30 shadow-[-20px_0_48px_rgba(2,12,28,0.65)] animate-slide-left flex flex-col text-white">

            {/* Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-white/15">
              <h2 className="text-[18px] font-semibold flex items-center gap-2 text-white">
                <i className="fa-regular fa-calendar text-[#8ec5eb]"></i>
                Reschedule Meeting
              </h2>
              <button onClick={() => setShowReschedule(false)} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#d9ebf8] hover:bg-white/20 transition">
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* DATE PICKER */}
              <p className="text-sm mb-2 font-medium text-[#d9ebf8]">Mentor Availability</p>

              <AvailabilityCalendar
                mentorId={String(appointmentToEdit?.mentor?.id || appointmentToEdit?.mentor?._id || "")}
                currentMonth={rescheduleMonth}
                currentYear={rescheduleYear}
                selectedDate={rescheduleDay}
                onDateSelect={setRescheduleDay}
                onPrevMonth={handleReschedulePrevMonth}
                onNextMonth={handleRescheduleNextMonth}
                availabilitySlots={rescheduleMonthlySlots}
                isLoading={rescheduleAvailabilityLoading}
              />

              {/* TIME PICKER */}
              <p className="text-sm mt-5 mb-2 font-medium text-[#d9ebf8]">Select a Time</p>

              {rescheduleAvailableTimes.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {rescheduleAvailableTimes.map((slot: any) => (
                    <button
                      key={slot}
                      onClick={() => setRescheduleTime(slot)}
                      className={`px-3 py-2 rounded-xl border text-sm transition ${rescheduleTime === slot
                          ? "bg-blue-600 text-white font-semibold border-blue-500"
                          : "border-white/20 bg-white/10 text-white hover:bg-white/20"
                        }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[#cde2f2]/70 mb-4">No available time slots for the selected date. Please choose a different day.</p>
              )}

              {/* MODE PICKER */}
              <p className="text-sm mt-5 mb-2 font-medium text-[#d9ebf8]">Meeting Option</p>
              <select
                className="w-full rounded-xl border border-white/20 bg-[#062946] px-3 py-2.5 text-sm text-white outline-none focus:border-[#8ec5eb]/50 focus:ring-2 focus:ring-[#8ec5eb]/30 [&>option]:bg-[#062946] [&>option]:text-white"
                value={rescheduleMode}
                onChange={(e) => setRescheduleMode(e.target.value)}
              >
                <option value="">Preferred meeting option</option>
                {/* <option value="Duo">Duo</option>
                <option value="Google Meet">Google Meet</option> */}
                <option value="Zoom">Zoom</option>
              </select>
            </div>

            {/* FOOTER */}
            <div className="border-t border-white/15 px-6 py-4 flex justify-between gap-3">
              <button
                className="px-5 py-2 rounded-lg border border-white/25 bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15"
                onClick={() => setShowReschedule(false)}
              >
                Cancel
              </button>

              <button
                className="px-6 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold transition hover:bg-blue-700"
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


      {/* ✅ New Meeting — glass drawer (pastor module palette) */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-labelledby="new-meeting-drawer-title">
          <button
            type="button"
            className="absolute inset-0 bg-[#041f35]/70 backdrop-blur-sm"
            aria-label="Close panel"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative ml-auto flex h-full w-full max-w-[440px] flex-col border-l border-[#8ec5eb]/30 bg-[linear-gradient(180deg,rgba(10,52,88,0.97)_0%,rgba(4,28,48,0.99)_100%)] shadow-[-20px_0_48px_rgba(2,12,28,0.65)] animate-slide-left">
            <div className="flex items-start justify-between gap-3 border-b border-white/15 px-6 py-5">
              <div>
                <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#8ec5eb]/90">
                  New meeting
                </p>
                <h2 id="new-meeting-drawer-title" className="flex items-center gap-2 text-lg font-semibold text-white">
                  {drawerStep === "mentor" ? (
                    <>Choose a mentor</>
                  ) : (
                    <>
                      <i className="fa-regular fa-calendar text-[#8ec5eb]" aria-hidden />
                      Schedule
                    </>
                  )}
                </h2>
                <p className="mt-1 text-xs text-[#cde2f2]/90">
                  {drawerStep === "mentor"
                    ? "Select who you would like to meet with."
                    : "Pick a date, time, and platform."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="shrink-0 rounded-lg p-2 text-[#d9ebf8] transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {drawerStep === "mentor" ? (
                <>
                  <div className="mb-4 max-w-none">
                    <PastorSearchBar
                      value={search}
                      onChange={setSearch}
                      placeholder="Search mentors"
                      aria-label="Search mentors"
                      className="max-w-none"
                    />
                  </div>

                  <div className="space-y-2">
                    {filteredMentors.map((m) => {
                      const mid = m.id || m._id;
                      const selected = (selectedMentor?.id || selectedMentor?._id) === mid;
                      return (
                        <div
                          key={mid}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedMentor(m)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedMentor(m);
                            }
                          }}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition ${selected
                            ? "border-[#8ec5eb]/60 bg-white/10 shadow-[0_0_0_1px_rgba(142,197,235,0.25)]"
                            : "border-white/15 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
                            }`}
                        >
                          <div className="flex items-center gap-3">
                            <Image
                              src={UserProfile}
                              alt=""
                              width={32}
                              height={32}
                              className="rounded-full ring-2 ring-white/10"
                            />
                            <div>
                              <p className="text-sm font-medium text-white">
                                {[m.firstName, m.lastName].filter(Boolean).join(" ").trim() ||
                                  String((m as { name?: string }).name ?? "Mentor")}
                              </p>
                              <p className="text-xs capitalize text-[#cde2f2]/80">
                                {String(m.role ?? "mentor").replace(/-/g, " ")}
                              </p>
                            </div>
                          </div>
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? "border-[#8ec5eb] bg-[#8ec5eb]" : "border-white/35"
                              }`}
                            aria-hidden
                          >
                            {selected ? <i className="fa-solid fa-check text-[10px] text-[#062946]" /> : null}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <label className={pastorFieldLabel} htmlFor="new-meeting-date">
                    Mentor Availability
                  </label>
                  <AvailabilityCalendar
                    mentorId={String(selectedMentor?.id || selectedMentor?._id || "")}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                    selectedDate={selectedDate}
                    onDateSelect={setSelectedDate}
                    onPrevMonth={handlePrevMonth}
                    onNextMonth={handleNextMonth}
                    availabilitySlots={monthlyAvailabilitySlots}
                    isLoading={availabilityLoading}
                  />

                  <label className={pastorFieldLabel} htmlFor="time-slot" style={{ marginTop: "1.5rem" }}>
                    Select a time
                    <span className="ml-1 font-normal text-[#cde2f2]">
                      ({new Date(currentYear, currentMonth, selectedDate).toLocaleDateString()})
                    </span>
                  </label>
                  {availabilityLoading ? (
                    <div className="mb-4 flex items-center justify-center py-6">
                      <div className="flex items-center gap-2 text-xs text-[#cde2f2]">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-[#8ec5eb]" />
                        Loading available times…
                      </div>
                    </div>
                  ) : availableTimesForBooking.length === 0 ? (
                    <p className="mb-4 text-xs text-[#cde2f2]/85">
                      No open slots on this date. Please try another day.
                    </p>
                  ) : (
                    <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3">
                      {availableTimesForBooking.map((t: any) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setSelectedTime(t)}
                          className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${selectedTime === t
                            ? "border-[#8ec5eb] bg-[#8ec5eb]/25 text-white shadow-[0_0_0_1px_rgba(142,197,235,0.35)]"
                            : "border-[#8ec5eb]/30 bg-[#8ec5eb]/10 text-white hover:border-[#8ec5eb]/55 hover:bg-[#8ec5eb]/20"
                            }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  )}

                  <label className={pastorFieldLabel} htmlFor="new-meeting-platform">
                    Platform
                  </label>
                  <select
                    id="new-meeting-platform"
                    value={schedulePlatform}
                    onChange={(e) => setSchedulePlatform(e.target.value)}
                    className={`${pastorDarkSelect} mb-2 text-white`}
                  >
                    <option value="Zoom" className="bg-[#062946] text-white">
                      Zoom
                    </option>
                    {/* <option value="Google Meet" className="bg-[#062946] text-white">
                      Google Meet
                    </option>
                    <option value="Microsoft Teams" className="bg-[#062946] text-white">
                      Microsoft Teams
                    </option>
                    <option value="Phone call" className="bg-[#062946] text-white">
                      Phone call
                    </option> */}
                  </select>
                </>
              )}
            </div>

            <div className="flex justify-between gap-3 border-t border-white/15 px-6 py-4">
              <button
                type="button"
                onClick={() =>
                  drawerStep === "mentor" ? setDrawerOpen(false) : setDrawerStep("mentor")
                }
                className="text-sm font-medium text-[#8ec5eb] transition hover:text-white"
              >
                {drawerStep === "mentor" ? "Cancel" : "Back"}
              </button>

              {drawerStep === "mentor" ? (
                <button
                  type="button"
                  onClick={() => setDrawerStep("schedule")}
                  className={pastorPrimaryCta}
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSchedule}
                  disabled={isScheduling}
                  className={`${pastorPrimaryCta} ${isScheduling ? "opacity-70 cursor-not-allowed" : ""}`}
                >
                  {isScheduling ? (
                    <span className="flex items-center gap-2">
                      <i className="fa-solid fa-spinner fa-spin"></i>
                      Scheduling...
                    </span>
                  ) : (
                    "Schedule"
                  )}
                </button>
              )}
            </div>
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
        <div className="fixed inset-0 z-[90] bg-[#041f35]/70 backdrop-blur-sm flex items-center justify-center">

          <div className="w-[420px] rounded-2xl border border-[#8ec5eb]/25 bg-[linear-gradient(180deg,rgba(10,52,88,0.97)_0%,rgba(4,28,48,0.99)_100%)] shadow-2xl p-6 animate-fade-in text-white">

            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-white flex items-center gap-2">
                <i className="fa-regular fa-pen-to-square text-[#8ec5eb]"></i>
                Choose your meeting option
              </h2>
              <button
                onClick={() => setShowChangeMode(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#d9ebf8] hover:bg-white/20 transition"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            {/* Divider */}
            <hr className="mb-4 border-white/15" />

            {/* OPTIONS */}
            <div className="space-y-3 text-[14px] text-[#d9ebf8]">

              {[
                "Zoom",
                // "Google Meet",
                // "Teams",
                // "Whatsapp",
                // "Phone call",
              ].map((mode) => (
                <label key={mode} className="flex items-center gap-3 cursor-pointer hover:text-white transition">
                  <input
                    type="radio"
                    name="meetingMode"
                    checked={selectedMode === mode}
                    onChange={() => setSelectedMode(mode)}
                    className="w-4 h-4 accent-[#8ec5eb]"
                  />
                  <span>{mode}</span>
                </label>
              ))}

            </div>

            {/* FOOTER BUTTONS */}
            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() => setShowChangeMode(false)}
                className="px-5 py-2 rounded-lg border border-white/25 bg-white/10 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Cancel
              </button>

              <button
                onClick={handleChangeMode}
                className="px-6 py-2 rounded-lg bg-[#8ec5eb] text-[#041f35] text-sm font-semibold transition hover:bg-[#a8d4f0]"
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

      {toastMessage ? (
        <div
          className="fixed bottom-6 right-4 z-[60] max-w-md rounded-2xl border border-white/20 bg-[#0a3558]/95 px-5 py-4 shadow-2xl backdrop-blur-md sm:right-8"
          role="status"
        >
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-circle-info mt-0.5 text-lg text-[#8ec5eb]" aria-hidden />
            <p className="text-[15px] font-medium leading-snug text-white">{toastMessage}</p>
          </div>
        </div>
      ) : null}




    </div>
  );
}
