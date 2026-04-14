"use client";
import { Suspense, useEffect, useLayoutEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import HeroBg from "../../Assets/appointment-bg.png";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import UserProfile from "../../Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import MentorFilterTabGroup from "@/app/Components/mentor/MentorFilterTabGroup";
import {
  mentorBodyText,
  mentorDateInputDark,
  mentorEmptyPanel,
  mentorGlassCardFrost,
  mentorGlassCardRoadmap,
  mentorHeroOverlay,
  mentorMainGradient,
  mentorPageRoot,
  mentorPrimaryCta,
  mentorSecondaryCta,
  mentorFilterPanel,
  mentorSelectDark,
  mentorSpinner,
} from "@/app/Components/mentor/mentor-theme";
import { Appointment } from "@/app/Services/types";
import {
  apiCancelAppointment,
  apiCreateAppointment,
  apiCreateAvailability,
  apiGetMentorAppointments,
  apiGetWeeklyAvailability,
} from "@/app/Services/appointments.service";
import {
  appointmentEntityId,
  extractApiErrorMessage,
  parseSlotStartToIso,
  slotToHHmm,
  uiMeetingModeToPlatform,
  unwrapAppointmentsAxiosData,
} from "@/app/Services/appointment-utils";
import { convertToMinutes, getMentorFromCookie, isOverlapping, timeOptions } from "@/app/Services/utils/helpers";
import { apiGetAllUsers, apiGetAssignedUsers } from "@/app/Services/api";

function tabFromQueryParam(raw: string | null): "Appointments" | "Availability" | "Schedule" | "Appointment History" | null {
  if (!raw) return null;
  const t = raw.trim().toLowerCase();
  if (t === "appointments") return "Appointments";
  if (t === "availability") return "Availability";
  if (t === "schedule") return "Schedule";
  if (t === "appointment-history" || t === "appointmenthistory" || t === "history") return "Appointment History";
  return null;
}

function isPastDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

function MentorScheduleContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<
    "Appointments" | "Availability" | "Schedule" | "Appointment History"
  >(() => tabFromQueryParam(searchParams.get("tab")) ?? "Appointments");
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [historyPage, setHistoryPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<1 | 2>(1);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [pastors, setPastors] = useState<any[]>([]);
  const [directors, setDirectors] = useState<any[]>([]);
  const [scheduleRecipientType, setScheduleRecipientType] = useState<"pastor" | "director">("pastor");
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
  const [meetingDate, setMeetingDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("zoom");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);
  const [weekStart, setWeekStart] = useState(new Date());
  const [isScheduling, setIsScheduling] = useState(false);
  const [availability, setAvailability] = useState<any[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedAvailabilityDay, setSelectedAvailabilityDay] = useState<number | null>(null);
  const [isAddSlotModalOpen, setIsAddSlotModalOpen] = useState(false);
  const [newSlot, setNewSlot] = useState<any>(null);

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
    const id = mentor?.id ?? mentor?._id;
    if (id) setMentorId(String(id));
  }, []);

  /** Deep-link from mentor home (?tab=appointments|availability|schedule) — sync before paint + on back/forward */
  useLayoutEffect(() => {
    const next = tabFromQueryParam(searchParams.get("tab"));
    if (next) setActiveTab(next);
  }, [searchParams]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest("[data-mentor-appointment-menu]")) {
        setShowMenu(null);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!mentorId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const fetchAppointments = async () => {
      try {
        const res = await apiGetMentorAppointments(mentorId);
        if (!cancelled) setAppointments(unwrapAppointmentsAxiosData(res));
      } catch (err) {
        console.error("Failed to fetch appointments", err);
        if (!cancelled) setAppointments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchAppointments();
    return () => {
      cancelled = true;
    };
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
    const fetchDirectors = async () => {
      try {
        const res = await apiGetAllUsers({ role: "director", roleMatch: "mixed", limit: 9999 });
        const list = Array.isArray(res.data?.data?.users) ? res.data.data.users : [];
        setDirectors(list);
      } catch (err) {
        console.error("Failed to fetch directors", err);
        setDirectors([]);
      }
    };
    fetchDirectors();
  }, [mentorId]);

  const scheduleRecipients = scheduleRecipientType === "pastor" ? pastors : directors;

  useEffect(() => {
    if (!mentorId || !meetingDate) return;

    const fetchSlots = async () => {
      try {
        const res = await apiGetWeeklyAvailability(mentorId, meetingDate);
        const data = res.data?.data || [];

        const dayData = data.find((d: any) =>
          d.date?.startsWith(meetingDate)
        );

        if (!dayData?.slots) {
          setAvailableSlots([]);
          return;
        }
        const normalize = (t: string) =>
          t.replace(/\s+/g, "").toLowerCase();

        const bookedSlots = appointments
          .filter(a => a.meetingDate.startsWith(meetingDate))
          .map(a => {
            const d = new Date(a.meetingDate);
            return normalize(
              d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            );
          });

        const formatted = dayData.slots
          .map((s: any) => {
            return `${s.startTime} ${s.startPeriod.toLowerCase()} - ${s.endTime} ${s.endPeriod.toLowerCase()}`;
          })
          .filter((slot: string) => {
            const startTime = normalize(slot.split(" - ")[0]);
            return !bookedSlots.includes(startTime);
          });

        setAvailableSlots(formatted);
      } catch (e) {
        console.error(e);
        setAvailableSlots([]);
      }
    };

    fetchSlots();
  }, [mentorId, meetingDate, availabilityRefreshKey, appointments]);

  useEffect(() => {
    if (!mentorId) return;

    const fetchWeeklyAvailability = async () => {
      try {
        const sunday = new Date(weekStart);
        sunday.setDate(sunday.getDate() - sunday.getDay());

        const date = sunday.toISOString().split("T")[0];

        const res = await apiGetWeeklyAvailability(mentorId, date);
        const raw = res.data?.data ?? res.data;
        const data = Array.isArray(raw) ? raw : [];
        console.log(res)

        if (data.length === 0) {
          setAvailability(
            [0, 1, 2, 3, 4, 5, 6].map((day) => ({
              date: "",
              day,
              enabled: false,
              slots: [],
            })),
          );
        } else {
          const formatted = data.map((d: any) => ({
            date: d.date,
            day: typeof d.day === "number" ? d.day : Number(d.day) || 0,
            enabled: Array.isArray(d.slots) && d.slots.length > 0,
            slots:
              Array.isArray(d.slots) && d.slots.length > 0
                ? d.slots.map((s: any) => ({
                  startTime: s.startTime || s.start?.split(":")?.slice(0, 2).join(":") || "09:00",
                  startPeriod: s.startPeriod || "AM",
                  endTime: s.endTime || s.end?.split(":")?.slice(0, 2).join(":") || "05:00",
                  endPeriod: s.endPeriod || "PM",
                }))
                : [],
          }));

          setAvailability(formatted);
        }
      } catch (err) {
        console.error("Weekly availability error", err);
      }
    };

    fetchWeeklyAvailability();
  }, [mentorId, weekStart, availabilityRefreshKey]);

  const today = new Date();

  const todayKey = new Date().toISOString().split("T")[0];
  const selectedDayAppointments = appointments
    .filter((a) => a.meetingDate.startsWith(selectedAppointmentDate))
    .filter((a) => selectedAppointmentDate !== todayKey || new Date(a.meetingDate).getTime() >= Date.now())
    .sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime());
  const appointmentHistory = appointments
    .filter((a) => new Date(a.meetingDate).getTime() < Date.now())
    .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());
  const historyPageSize = 10;
  const totalHistoryPages = Math.max(1, Math.ceil(appointmentHistory.length / historyPageSize));
  const pagedAppointmentHistory = appointmentHistory.slice(
    (historyPage - 1) * historyPageSize,
    historyPage * historyPageSize,
  );

  useEffect(() => {
    setHistoryPage((prev) => Math.min(prev, totalHistoryPages));
  }, [totalHistoryPages]);

  const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const;
  const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

  /** YYYY-MM-DD for each row: use API date when present, else derive from weekStart + day index. */
  const resolveAvailabilityRowDate = (d: any): string => {
    const raw = typeof d.date === "string" ? d.date.trim() : "";
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
    const anchor = new Date(weekStart);
    anchor.setHours(12, 0, 0, 0);
    const sunday = new Date(anchor);
    sunday.setDate(anchor.getDate() - anchor.getDay());
    const di = Number(d.day ?? 0) % 7;
    const dt = new Date(sunday);
    dt.setDate(sunday.getDate() + di);
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, "0");
    const day = String(dt.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    if (availability.length === 0) {
      setSelectedAvailabilityDay(null);
      return;
    }

    setSelectedAvailabilityDay((prev) => {
      if (prev !== null && availability.some((d) => d.day === prev)) return prev;
      const firstEnabledDay = availability.find((d) => d.enabled)?.day;
      return typeof firstEnabledDay === "number" ? firstEnabledDay : availability[0]?.day ?? 0;
    });
  }, [availability]);

  const weekCalendarDates = Array.from({ length: 7 }, (_, dayIndex) => {
    const dayData = availability.find((d) => d.day === dayIndex);
    const dateKey = resolveAvailabilityRowDate(dayData ?? { day: dayIndex });
    const date = new Date(`${dateKey}T12:00:00`);

    return {
      dayIndex,
      date,
      hasSlots: Boolean(dayData?.enabled && Array.isArray(dayData?.slots) && dayData.slots.length > 0),
    };
  });

  const weekMonthYearLabel =
    weekCalendarDates.length > 0
      ? weekCalendarDates[0].date.toLocaleDateString("default", {
        month: "long",
        year: "numeric",
      })
      : "—";

  const selectedDayData =
    selectedAvailabilityDay === null
      ? null
      : availability.find((d) => d.day === selectedAvailabilityDay) || null;

  const period = (p: unknown, fallback: "AM" | "PM"): "AM" | "PM" => {
    const s = String(p ?? "").trim().toUpperCase();
    if (s === "PM" || s.startsWith("P")) return "PM";
    if (s === "AM" || s.startsWith("A")) return "AM";
    return fallback;
  };

  /**
   * Backend shapes differ; try several payloads (date-based like GET /week, then HH:mm, then weekday template).
   */
  const buildAvailabilityPayloadVariants = (): Record<string, unknown>[] => {
    const enabled = availability.filter(
      (d) => d.enabled && Array.isArray(d.slots) && d.slots.length > 0,
    );
    if (!mentorId || enabled.length === 0) return [];

    const baseMeta = {
      meetingDuration: 60,
      bufferTime: 15,
      advanceNotice: 2,
      maxBookingsPerDay: 5,
    };

    const dated = enabled.map((d) => ({
      date: resolveAvailabilityRowDate(d),
      uiSlots: d.slots || [],
    }));

    const variants: Record<string, unknown>[] = [];

    // Minimal body (some APIs reject extra fields)
    variants.push({
      mentorId,
      meetingDuration: 60,
      weeklySlots: dated.map(({ date, uiSlots }) => ({
        date,
        slots: uiSlots.map((s: any) => ({
          startTime: String(s.startTime || "09:00").replace(/\s*(AM|PM)\s*/gi, "").trim() || "09:00",
          startPeriod: period(s.startPeriod, "AM"),
          endTime: String(s.endTime || "05:00").replace(/\s*(AM|PM)\s*/gi, "").trim() || "05:00",
          endPeriod: period(s.endPeriod, "PM"),
        })),
      })),
    });

    variants.push({
      mentorId,
      ...baseMeta,
      weeklySlots: dated.map(({ date, uiSlots }) => ({
        date,
        slots: uiSlots.map((s: any) => ({
          startTime: String(s.startTime || "09:00").replace(/\s*(AM|PM)\s*/gi, "").trim() || "09:00",
          startPeriod: period(s.startPeriod, "AM"),
          endTime: String(s.endTime || "05:00").replace(/\s*(AM|PM)\s*/gi, "").trim() || "05:00",
          endPeriod: period(s.endPeriod, "PM"),
        })),
      })),
    });

    variants.push({
      mentorId,
      ...baseMeta,
      weeklySlots: dated.map(({ date, uiSlots }) => ({
        date,
        slots: uiSlots.map((s: any) => ({
          start: slotToHHmm(s.startTime, s.startPeriod),
          end: slotToHHmm(s.endTime, s.endPeriod),
        })),
      })),
    });

    variants.push({
      mentorId,
      ...baseMeta,
      weeklySlots: enabled.map((d) => ({
        day: DAY_NAMES[Number(d.day ?? 0) % 7],
        isAvailable: true,
        slots: (d.slots || []).map((s: any) => ({
          start: slotToHHmm(s.startTime, s.startPeriod),
          end: slotToHHmm(s.endTime, s.endPeriod),
        })),
      })),
    });

    variants.push({
      mentorId,
      meetingDuration: 60,
      availability: dated.map(({ date, uiSlots }) => ({
        date,
        slots: uiSlots.map((s: any) => ({
          startTime: String(s.startTime || "09:00").replace(/\s*(AM|PM)\s*/gi, "").trim() || "09:00",
          startPeriod: period(s.startPeriod, "AM"),
          endTime: String(s.endTime || "05:00").replace(/\s*(AM|PM)\s*/gi, "").trim() || "05:00",
          endPeriod: period(s.endPeriod, "PM"),
        })),
      })),
    });

    const seen = new Set<string>();
    return variants.filter((v) => {
      const k = JSON.stringify(v);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  };

  const handleSaveAvailability = async () => {
    if (!mentorId) return;

    const hasValidSlots = availability.some(
      (day) => day.enabled && day.slots && day.slots.length > 0,
    );

    if (!hasValidSlots) {
      setToastMessage("Please add at least one availability slot");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const variants = buildAvailabilityPayloadVariants();
    let lastError: unknown = null;

    try {
      for (const body of variants) {
        try {
          await apiCreateAvailability(body as any);
          setToastMessage("Availability updated successfully");
          lastError = null;
          break;
        } catch (e) {
          lastError = e;
          console.warn("Availability save attempt failed, trying next shape…", e);
        }
      }

      if (lastError) {
        throw lastError;
      }

      const sunday = new Date(weekStart);
      sunday.setDate(sunday.getDate() - sunday.getDay());
      const date = sunday.toISOString().split("T")[0];
      const res = await apiGetWeeklyAvailability(mentorId, date);
      const raw = res.data?.data ?? res.data;
      const data = Array.isArray(raw) ? raw : [];
      if (data.length > 0) {
        const formatted = data.map((d: any) => ({
          date: d.date,
          day: typeof d.day === "number" ? d.day : Number(d.day) || 0,
          enabled: Array.isArray(d.slots) && d.slots.length > 0,
          slots:
            Array.isArray(d.slots) && d.slots.length > 0
              ? d.slots.map((s: any) => ({
                startTime: s.startTime || "09:00",
                startPeriod: s.startPeriod || "AM",
                endTime: s.endTime || "05:00",
                endPeriod: s.endPeriod || "PM",
              }))
              : [],
        }));
        setAvailability(formatted);
      }
    } catch (error) {
      console.error(error);
      setToastMessage(extractApiErrorMessage(error));
    }

    setTimeout(() => setToastMessage(null), 4000);
  };

  const toIsoFromDateAndSlot = (dateStr: string, slot: string) => {
    return parseSlotStartToIso(dateStr, slot.replace(/\u2013/g, "-"));
  };

  const handleCreateAppointment = async () => {
    if (!mentorId) return;
    if (!selectedRecipient?._id && !selectedRecipient?.id) {
      setToastMessage(`Please select a ${scheduleRecipientType}`);
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    if (!meetingDate || !selectedSlot) {
      setToastMessage("Please select date and time");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    if (isScheduling) return;
    setIsScheduling(true);

    try {
      await apiCreateAppointment({
        userId: selectedRecipient._id || selectedRecipient.id,
        mentorId,
        meetingDate: toIsoFromDateAndSlot(meetingDate, selectedSlot),
        platform: uiMeetingModeToPlatform(selectedPlatform),
        notes: "Scheduled by mentor",
      });

      setAvailableSlots(prev => prev.filter(s => s !== selectedSlot));
      setAvailabilityRefreshKey(prev => prev + 1);
      const refresh = await apiGetMentorAppointments(mentorId);
      setAppointments(unwrapAppointmentsAxiosData(refresh));
      setIsDrawerOpen(false);
      setDrawerStep(1);
      setSelectedRecipient(null);
      setMeetingDate("");
      setSelectedSlot("");
      setToastMessage("Appointment created successfully");
    } catch (error) {
      console.error("Failed to create appointment", error);
      setToastMessage("Failed to create appointment");
    }
    finally {
      setIsScheduling(false);
    }

    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCancelMentorAppointment = async (appt: Appointment) => {
    const id = appointmentEntityId(appt);
    if (!id || !mentorId) return;
    try {
      await apiCancelAppointment(id);
      const refresh = await apiGetMentorAppointments(mentorId);
      setAppointments(unwrapAppointmentsAxiosData(refresh));
      setShowMenu(null);
      setToastMessage("Appointment cancelled");
    } catch (e) {
      console.error(e);
      setToastMessage("Failed to cancel appointment");
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <section
        className="relative flex min-h-[200px] flex-col justify-center bg-cover bg-center px-4 py-10 text-white sm:min-h-[240px] md:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className={mentorHeroOverlay} />
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-2xl font-semibold sm:text-3xl md:text-4xl">Mentor schedule</h1>
          <p className={`mt-2 max-w-2xl ${mentorBodyText}`}>
            View appointments, set weekly availability, or schedule a new meeting with an assigned pastor — same look
            as pastor appointments.
          </p>
        </div>
      </section>

      <main className={`${mentorMainGradient} flex-1 px-4 pb-20 pt-8 md:px-16 lg:px-20`}>
        <div className="mx-auto max-w-7xl">
          <div className={`${mentorFilterPanel} mb-8`}>
            <div className="flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
              <input
                type="text"
                placeholder="Jump to date (dd-mm-yyyy)"
                className={`w-full max-w-none rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-[#cde2f2] outline-none focus:border-[#8ec5eb]/50 focus:ring-2 focus:ring-[#8ec5eb]/30 lg:max-w-sm`}
              />
              <MentorFilterTabGroup
                tabs={["Appointments", "Availability", "Schedule", "Appointment History"] as const}
                active={activeTab}
                onChange={(tab) => {
                  setActiveTab(tab);
                  if (tab === "Appointment History") setHistoryPage(1);
                  if (tab === "Schedule") {
                    setIsDrawerOpen(true);
                    setDrawerStep(1);
                  } else {
                    setIsDrawerOpen(false);
                  }
                }}
                aria-label="Schedule section"
                className="w-full lg:w-auto"
              />
            </div>
          </div>

          {!mentorId && !loading ? (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100">
              Sign in as a mentor to manage your schedule.
            </div>
          ) : null}

          {loading && mentorId ? (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className={mentorSpinner} />
              <p className={`text-sm ${mentorBodyText}`}>Loading appointments…</p>
            </div>
          ) : null}

          {mentorId && !loading && activeTab === "Appointments" && (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">
              <div className={`${mentorGlassCardFrost} p-5 sm:p-6`}>
                <h3 className="mb-4 flex items-center gap-2 text-[15px] font-medium text-white">
                  <i className="fa-regular fa-calendar text-[#8ec5eb]" /> Monthly meeting calendar
                </h3>

                <div className="rounded-xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.85)_0%,rgba(10,53,88,0.92)_100%)] p-5 text-center shadow-inner">
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                      className="rounded-lg px-2 py-1 text-white/90 transition hover:bg-white/10"
                      aria-label="Previous month"
                    >
                      ◀
                    </button>

                    <p className="text-sm font-medium text-white/90">
                      {currentDate.toLocaleString("default", {
                        month: "long",
                        year: "numeric",
                      })}
                    </p>

                    <button
                      type="button"
                      onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                      className="rounded-lg px-2 py-1 text-white/90 transition hover:bg-white/10"
                      aria-label="Next month"
                    >
                      ▶
                    </button>
                  </div>

                  <div className="mb-2 grid grid-cols-7 gap-2 text-[13px]">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={`${d}-${i}`} className="font-medium text-[#cde2f2]/80">
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2 text-[13px]">
                    {calendarDays.map((day, index) => {
                      if (!day) return <div key={index} />;

                      const d = new Date(year, month, day);

                      const dateStr = `${d.getFullYear()}-${String(
                        d.getMonth() + 1
                      ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

                      const hasAppointment = appointmentDates.includes(dateStr);
                      const isPast = isPastDate(dateStr);
                      const isSelected = selectedAppointmentDate === dateStr;

                      const isToday =
                        day === new Date().getDate() &&
                        month === new Date().getMonth() &&
                        year === new Date().getFullYear();

                      return (
                        <div
                          key={index}
                          onClick={() => !isPast && setSelectedAppointmentDate(dateStr)}
                          className={`rounded-md py-1 transition ${isPast ? "cursor-not-allowed pointer-events-none opacity-40" : "cursor-pointer"
                            } ${isSelected || isToday
                            ? "bg-[#8ec5eb]/35 font-semibold text-white ring-1 ring-[#8ec5eb]/50"
                            : "text-[#d9ebf8] hover:bg-white/10"
                            } ${hasAppointment && !isPast ? "ring-1 ring-amber-300/60" : ""}`}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-[15px] font-semibold text-white">
                  {selectedAppointmentDate === todayKey
                    ? "Today"
                    : new Date(`${selectedAppointmentDate}T12:00:00`).toLocaleDateString()} — {selectedDayAppointments.length} appointment
                  {selectedDayAppointments.length === 1 ? "" : "s"}
                </h3>

                <div className="flex flex-col gap-5">
                  {selectedDayAppointments.length === 0 ? (
                    <div className={mentorEmptyPanel}>
                      <p className={mentorBodyText}>No meetings scheduled for this day.</p>
                    </div>
                  ) : null}
                  {selectedDayAppointments.map((appt, index) => {
                    const meetingDate = new Date(appt.meetingDate);
                    const apptKey = appointmentEntityId(appt) || String(index);

                    return (
                      <div
                        key={apptKey}
                        className={`${mentorGlassCardRoadmap} relative items-stretch gap-0 overflow-visible p-4 sm:items-center sm:p-5`}
                      >
                        <div className="flex w-full shrink-0 items-center justify-center border-b border-white/10 py-4 sm:w-[120px] sm:border-b-0 sm:border-r sm:py-0">
                          <div className="flex h-[100px] w-[100px] items-center justify-center rounded-xl border border-white/15 bg-white/5">
                            <Image
                              src={appt.platform === "zoom" ? MeetIcon : DuoIcon}
                              alt={appt.platform}
                              className="h-[52px] w-[52px]"
                            />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 px-0 pt-4 sm:px-5 sm:pt-0">
                          <div className="mb-2 flex items-center gap-3">
                            <Image
                              src={appt.user?.profilePicture || UserProfile}
                              alt="User"
                              width={36}
                              height={36}
                              className="rounded-full border border-white/20"
                            />

                            <div>
                              <h4 className="text-sm font-semibold text-white">
                                {appt.user?.firstName} {appt.user?.lastName}
                              </h4>

                              <p className="text-[12px] text-[#cde2f2]/90">Pastor</p>
                            </div>
                          </div>

                          <div className="mb-2 flex flex-wrap gap-2">
                            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium text-[#d9ebf8]">
                              <i className="fa-regular fa-calendar text-[#8ec5eb]" />
                              {meetingDate.toLocaleDateString()}
                            </div>

                            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium text-[#d9ebf8]">
                              <i className="fa-regular fa-clock text-[#8ec5eb]" />
                              {meetingDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>

                          <p className="mb-2 text-[12px] text-[#cde2f2]">
                            Mode:{" "}
                            <span className="font-semibold text-[#8ec5eb]">{appt.platform}</span>
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex gap-3 text-[15px] text-[#8ec5eb]">
                              <i className="fa-solid fa-phone cursor-pointer transition hover:text-white" />
                              <i className="fa-regular fa-comment cursor-pointer transition hover:text-white" />
                              <i className="fa-brands fa-whatsapp cursor-pointer transition hover:text-white" />
                            </div>

                            <div className="relative" data-mentor-appointment-menu>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowMenu(showMenu === apptKey ? null : apptKey)
                                }
                                className="rounded-lg px-3 py-1 text-[#8ec5eb] transition hover:bg-white/10 hover:text-white"
                                aria-label="Appointment actions"
                              >
                                <i className="fa-solid fa-ellipsis-vertical" />
                              </button>

                              {showMenu === apptKey && (
                                <div className="absolute right-0 top-9 z-30 w-[220px] overflow-hidden rounded-xl border border-white/20 bg-[#0a3558]/95 py-1 text-sm text-[#d9ebf8] shadow-xl backdrop-blur-md">
                                  <button
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                                    onClick={() => {
                                      setShowMenu(null);
                                      setToastMessage(
                                        "Use pastor’s calendar or reschedule from their account when supported."
                                      );
                                      setTimeout(() => setToastMessage(null), 4000);
                                    }}
                                  >
                                    <i className="fa-regular fa-calendar-check mr-2 text-[#8ec5eb]" />
                                    Reschedule meeting
                                  </button>

                                  <button
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                                    onClick={() => handleCancelMentorAppointment(appt)}
                                  >
                                    <i className="fa-regular fa-circle-xmark mr-2 text-red-300" />
                                    Cancel meeting
                                  </button>

                                  <button
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                                    onClick={() => {
                                      setShowMenu(null);
                                      setToastMessage(
                                        "Open appointment details on web admin or ask pastor to change platform."
                                      );
                                      setTimeout(() => setToastMessage(null), 4000);
                                    }}
                                  >
                                    <i className="fa-regular fa-clock mr-2 text-[#cde2f2]" />
                                    Change meeting mode
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

          {mentorId && !loading && activeTab === "Appointment History" && (
            <div className="flex flex-col gap-5">
              <h3 className="text-[15px] font-semibold text-white">
                Appointment history — {appointmentHistory.length} meeting{appointmentHistory.length === 1 ? "" : "s"}
              </h3>
              {appointmentHistory.length === 0 ? (
                <div className={mentorEmptyPanel}>
                  <p className={mentorBodyText}>No past meetings yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                  {pagedAppointmentHistory.map((appt, index) => {
                    const meetingDate = new Date(appt.meetingDate);
                    const apptKey = appointmentEntityId(appt) || `history-${historyPage}-${index}`;
                    return (
                      <div key={apptKey} className={`${mentorGlassCardRoadmap} relative items-stretch gap-0 p-4 sm:items-center sm:p-5`}>
                        <div className="flex w-full shrink-0 items-center justify-center border-b border-white/10 py-4 sm:w-[120px] sm:border-b-0 sm:border-r sm:py-0">
                          <div className="flex h-[100px] w-[100px] items-center justify-center rounded-xl border border-white/15 bg-white/5">
                            <Image
                              src={appt.platform === "zoom" ? MeetIcon : DuoIcon}
                              alt={appt.platform}
                              className="h-[52px] w-[52px]"
                            />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 px-0 pt-4 sm:px-5 sm:pt-0">
                          <div className="mb-2 flex items-center gap-3">
                            <Image
                              src={appt.user?.profilePicture || UserProfile}
                              alt="User"
                              width={36}
                              height={36}
                              className="rounded-full border border-white/20"
                            />
                            <div>
                              <h4 className="text-sm font-semibold text-white">{appt.user?.firstName} {appt.user?.lastName}</h4>
                              <p className="text-[12px] text-[#cde2f2]/90">Pastor</p>
                            </div>
                          </div>
                          <div className="mb-2 flex flex-wrap gap-2">
                            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium text-[#d9ebf8]">
                              <i className="fa-regular fa-calendar text-[#8ec5eb]" />
                              {meetingDate.toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium text-[#d9ebf8]">
                              <i className="fa-regular fa-clock text-[#8ec5eb]" />
                              {meetingDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                          <p className="mb-2 text-[12px] text-[#cde2f2]">Mode: <span className="font-semibold text-[#8ec5eb]">{appt.platform}</span></p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {appointmentHistory.length > 0 && (
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    disabled={historyPage === 1}
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    className={`${mentorSecondaryCta} px-3 py-1.5 text-xs ${historyPage === 1 ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    Previous
                  </button>
                  <p className="text-xs text-[#cde2f2]">Page {historyPage} of {totalHistoryPages}</p>
                  <button
                    type="button"
                    disabled={historyPage >= totalHistoryPages}
                    onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                    className={`${mentorSecondaryCta} px-3 py-1.5 text-xs ${historyPage >= totalHistoryPages ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {mentorId && !loading && activeTab === "Availability" && (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
              <div className={`${mentorGlassCardFrost} p-5 text-white sm:p-6`}>
                <h3 className="mb-5 text-[15px] font-medium">My weekly availability</h3>
                <div className="mb-6 rounded-xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.85)_0%,rgba(10,53,88,0.92)_100%)] p-5 text-center shadow-inner">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setWeekStart((prev) => {
                          const next = new Date(prev);
                          next.setDate(next.getDate() - 7);
                          return next;
                        });
                      }}
                      className="rounded-lg px-2 py-1 text-white/90 transition hover:bg-white/10"
                      aria-label="Previous week"
                    >
                      ◀
                    </button>

                    <p className="text-sm font-medium text-[#d9ebf8]">{weekMonthYearLabel}</p>

                    <button
                      type="button"
                      onClick={() => {
                        setWeekStart((prev) => {
                          const next = new Date(prev);
                          next.setDate(next.getDate() + 7);
                          return next;
                        });
                      }}
                      className="rounded-lg px-2 py-1 text-white/90 transition hover:bg-white/10"
                      aria-label="Next week"
                    >
                      ▶
                    </button>
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-[13px]">
                    {weekCalendarDates.map(({ dayIndex, date, hasSlots }) => {
                      const day = date.toLocaleDateString("default", { weekday: "short" });
                      const isSelected = selectedAvailabilityDay === dayIndex;
                      const isPast = isPastDate(date.toISOString().split("T")[0]);

                      return (
                        <div
                          key={date.toISOString()}
                          onClick={() => !isPast && setSelectedAvailabilityDay(dayIndex)}
                          className={`rounded-md py-2 text-center transition ${isPast ? "cursor-not-allowed pointer-events-none opacity-40" : "cursor-pointer"
                            } ${isSelected
                            ? "bg-[#8ec5eb]/30 font-semibold text-white ring-1 ring-[#8ec5eb]/55"
                            : "text-[#d9ebf8] hover:bg-white/10"
                            } ${hasSlots && !isPast ? "ring-1 ring-amber-300/55" : ""}`}
                        >
                          <div>{day}</div>
                          <div className="text-xs text-white/80">{date.getDate()}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs text-[#cde2f2]">Meeting Duration</label>
                    <select className={mentorSelectDark}>
                      <option className="bg-[#062946]">60 Minutes</option>
                      <option className="bg-[#062946]">30 Minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#cde2f2]">Max. Booking per Day</label>
                    <select className={mentorSelectDark}>
                      <option className="bg-[#062946]">5</option>
                      <option className="bg-[#062946]">10</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#cde2f2]">Min. Scheduling Notice</label>
                    <select className={mentorSelectDark}>
                      <option className="bg-[#062946]">2 Days</option>
                      <option className="bg-[#062946]">1 Day</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-[#cde2f2]">Preferred Meeting Option</label>
                    <select className={mentorSelectDark}>
                      <option className="bg-[#062946]">Zoom</option>
                      <option className="bg-[#062946]">Google Meet</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="text-white">
                <h3 className="mb-3 text-[15px] font-medium">Available hours</h3>
                {!selectedDayData ? (
                  <div className={mentorEmptyPanel}>
                    <p className={mentorBodyText}>Select a date from the weekly calendar to edit that day.</p>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 sm:p-5">
                    <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-white/15 pb-4">
                      <input
                        type="checkbox"
                        checked={selectedDayData.enabled || false}
                        onChange={() => {
                          setAvailability((prev) =>
                            prev.map((d) =>
                              d.day === selectedAvailabilityDay
                                ? { ...d, enabled: !d.enabled }
                                : d,
                            ),
                          );
                        }}
                        className="accent-[#8ec5eb]"
                      />
                      <p className="text-sm font-medium text-[#d9ebf8]">
                        {DAY_LABELS[selectedDayData.day as number]} - {new Date(`${resolveAvailabilityRowDate(selectedDayData)}T12:00:00`).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-2">
                      {(selectedDayData.slots || []).map((slot: any, i: number) => (
                        <div key={i} className="rounded-lg border border-white/15 bg-white/[0.03] p-2">
                          <div className="mb-1 text-[11px] text-[#cde2f2]">Slot {i + 1}</div>
                          <div className="flex items-center gap-1.5">
                          <select
                            className={`${mentorSelectDark} min-h-[34px] px-2 py-1 text-[11px]`}
                            value={`${slot.startTime}-${slot.startPeriod}`}
                            onChange={(e) => {
                              const [time, slotPeriod] = e.target.value.split("-");
                              setAvailability((prev) =>
                                prev.map((d) =>
                                  d.day === selectedAvailabilityDay
                                    ? {
                                      ...d,
                                      slots: d.slots.map((s: any, idx: number) =>
                                        idx === i ? { ...s, startTime: time, startPeriod: slotPeriod } : s,
                                      ),
                                    }
                                    : d,
                                ),
                              );
                            }}
                          >
                            {timeOptions.map((t) => (
                              <option key={t.label} value={`${t.time}-${t.period}`}>
                                {t.label}
                              </option>
                            ))}
                          </select>

                          <span className="text-[11px] text-[#d9ebf8]">to</span>

                          <select
                            className={`${mentorSelectDark} min-h-[34px] px-2 py-1 text-[11px]`}
                            value={`${slot.endTime}-${slot.endPeriod}`}
                            onChange={(e) => {
                              const [time, slotPeriod] = e.target.value.split("-");
                              setAvailability((prev) =>
                                prev.map((d) =>
                                  d.day === selectedAvailabilityDay
                                    ? {
                                      ...d,
                                      slots: d.slots.map((s: any, idx: number) =>
                                        idx === i ? { ...s, endTime: time, endPeriod: slotPeriod } : s,
                                      ),
                                    }
                                    : d,
                                ),
                              );
                            }}
                          >
                            {timeOptions.map((t) => (
                              <option key={t.label} value={`${t.time}-${t.period}`}>
                                {t.label}
                              </option>
                            ))}
                          </select>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4">
                      <button
                        type="button"
                        className={`${mentorSecondaryCta} px-3 py-1.5 text-xs`}
                        onClick={() => {
                          setNewSlot({
                            startTime: "09:00",
                            startPeriod: "AM",
                            endTime: "10:00",
                            endPeriod: "AM",
                          });
                          setIsAddSlotModalOpen(true);
                        }}
                      >
                        + Add slot
                      </button>
                    </div>
                  </div>
                )}

                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleSaveAvailability}
                    className={mentorPrimaryCta}
                  >
                    Save availability
                  </button>
                </div>
              </div>
            </div>
          )}

          {mentorId && !loading && activeTab === "Availability" && isAddSlotModalOpen && newSlot && (
            <>
              <div
                className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
                onClick={() => {
                  setIsAddSlotModalOpen(false);
                  setNewSlot(null);
                }}
                aria-hidden
              />
              <div className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/20 bg-[#041f35] p-5 text-white shadow-2xl">
                <h3 className="mb-4 text-base font-semibold">Add new slot</h3>

                <div className="mb-5 flex items-center gap-2">
                  <select
                    className={`${mentorSelectDark} text-xs`}
                    value={`${newSlot.startTime}-${newSlot.startPeriod}`}
                    onChange={(e) => {
                      const [time, slotPeriod] = e.target.value.split("-");
                      setNewSlot((prev: any) => ({ ...prev, startTime: time, startPeriod: slotPeriod }));
                    }}
                  >
                    {timeOptions.map((t) => (
                      <option key={t.label} value={`${t.time}-${t.period}`}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  <span className="text-sm text-[#d9ebf8]">to</span>

                  <select
                    className={`${mentorSelectDark} text-xs`}
                    value={`${newSlot.endTime}-${newSlot.endPeriod}`}
                    onChange={(e) => {
                      const [time, slotPeriod] = e.target.value.split("-");
                      setNewSlot((prev: any) => ({ ...prev, endTime: time, endPeriod: slotPeriod }));
                    }}
                  >
                    {timeOptions.map((t) => (
                      <option key={t.label} value={`${t.time}-${t.period}`}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    className={mentorSecondaryCta}
                    onClick={() => {
                      setIsAddSlotModalOpen(false);
                      setNewSlot(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={mentorPrimaryCta}
                    onClick={() => {
                      setAvailability((prev) =>
                        prev.map((d) =>
                          d.day === selectedAvailabilityDay
                            ? { ...d, enabled: true, slots: [...(d.slots || []), newSlot] }
                            : d,
                        ),
                      );
                      setIsAddSlotModalOpen(false);
                      setNewSlot(null);
                    }}
                  >
                    Save slot
                  </button>
                </div>
              </div>
            </>
          )}

          {mentorId && !loading && activeTab === "Schedule" && !isDrawerOpen && (
            <div className={mentorEmptyPanel}>
              <p className={`${mentorBodyText} mb-4`}>
                Open the panel on the right to pick a pastor or director and choose a time — or tap{" "}
                <span className="font-semibold text-white">Schedule</span> in the tabs above.
              </p>
              <button
                type="button"
                className={mentorPrimaryCta}
                onClick={() => {
                  setDrawerStep(1);
                  setIsDrawerOpen(true);
                }}
              >
                New meeting
              </button>
            </div>
          )}
        </div>
      </main>

      {activeTab === "Schedule" && isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden
          />
          <div className="fixed right-0 top-0 z-50 h-full w-full border-l border-white/15 bg-[#041f35] text-white shadow-2xl sm:max-w-[480px] sm:w-[480px]">
            {drawerStep === 1 && (
              <div className="flex h-full flex-col p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-lg font-semibold">New meeting</h2>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="rounded-lg p-2 text-[#cde2f2] transition hover:bg-white/10 hover:text-white"
                    aria-label="Close"
                  >
                    <i className="fa-solid fa-xmark text-xl" />
                  </button>
                </div>

                <div className="mb-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleRecipientType("pastor");
                      setSelectedRecipient(null);
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${scheduleRecipientType === "pastor"
                      ? "bg-white/15 text-white ring-1 ring-[#8ec5eb]/40"
                      : "border border-white/20 bg-white/5 text-[#cde2f2] hover:bg-white/10"
                      }`}
                  >
                    Pastor
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setScheduleRecipientType("director");
                      setSelectedRecipient(null);
                    }}
                    className={`rounded-lg px-4 py-2 text-sm font-medium transition ${scheduleRecipientType === "director"
                      ? "bg-white/15 text-white ring-1 ring-[#8ec5eb]/40"
                      : "border border-white/20 bg-white/5 text-[#cde2f2] hover:bg-white/10"
                      }`}
                  >
                    Director
                  </button>
                </div>

                <input
                  type="text"
                  placeholder="Search"
                  className="mb-4 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-[#cde2f2] outline-none focus:border-[#8ec5eb]/50 focus:ring-2 focus:ring-[#8ec5eb]/30"
                />

                <div className="flex max-h-[min(380px,50vh)] flex-col gap-3 overflow-y-auto pr-1">
                  {scheduleRecipients.length === 0 && (
                    <p className={`px-2 py-4 text-sm ${mentorBodyText}`}>
                      {scheduleRecipientType === "pastor" ? "No assigned pastors found." : "No directors found."}
                    </p>
                  )}
                  {scheduleRecipients.map((person: any) => {
                    const personId = person._id || person.id;
                    const isSelected = (selectedRecipient?._id || selectedRecipient?.id) === personId;
                    return (
                      <button
                        type="button"
                        key={personId}
                        onClick={() => setSelectedRecipient(person)}
                        className={`flex w-full items-center justify-between gap-4 rounded-xl border px-4 py-3 text-left transition ${isSelected
                          ? "border-[#8ec5eb]/45 bg-[#8ec5eb]/15"
                          : "border-white/15 bg-white/5 hover:border-white/25 hover:bg-white/10"
                          }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <Image
                            src={person.profilePicture || UserProfile}
                            alt=""
                            width={36}
                            height={36}
                            className="shrink-0 rounded-full border border-white/20"
                          />
                          <span className="truncate text-sm font-medium text-white">
                            {person.firstName} {person.lastName}
                          </span>
                        </div>
                        <input
                          type="radio"
                          checked={isSelected}
                          readOnly
                          className="accent-[#8ec5eb]"
                          aria-hidden
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="mt-auto flex justify-end gap-3 border-t border-white/10 pt-6">
                  <button type="button" onClick={() => setIsDrawerOpen(false)} className={mentorSecondaryCta}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedRecipient) {
                        setToastMessage(`Please select a ${scheduleRecipientType} first`);
                        setTimeout(() => setToastMessage(null), 3000);
                        return;
                      }
                      setDrawerStep(2);
                    }}
                    className={mentorPrimaryCta}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {drawerStep === 2 && (
              <div className="flex h-full flex-col p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-semibold">
                    <i className="fa-regular fa-calendar-days text-[#8ec5eb]" />
                    Schedule a meeting
                  </h2>
                  <button
                    type="button"
                    onClick={() => setIsDrawerOpen(false)}
                    className="rounded-lg p-2 text-[#cde2f2] transition hover:bg-white/10 hover:text-white"
                    aria-label="Close"
                  >
                    <i className="fa-solid fa-xmark text-xl" />
                  </button>
                </div>

                <div className="mb-6 rounded-xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.85)_0%,rgba(10,53,88,0.92)_100%)] p-5 text-center">
                  <p className="mb-2 text-sm text-[#cde2f2]">Select date</p>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className={mentorDateInputDark}
                  />
                </div>

                <div className="mb-6 grid grid-cols-2 gap-3">
                  {availableSlots.length === 0 ? (
                    <p className="text-sm text-[#cde2f2]">No slots available</p>
                  ) : (
                    availableSlots.map((label) => (
                      <button
                        key={label}
                        onClick={() => setSelectedSlot(label)}
                        className={`rounded-lg border px-3 py-2.5 text-sm ${selectedSlot === label ? "bg-blue-500 text-white" : ""
                          }`}
                      >
                        {label}
                      </button>
                    ))
                  )}
                </div>

                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className={`${mentorSelectDark} mb-8`}
                >
                  <option className="bg-[#062946]" value="zoom">
                    Zoom
                  </option>
                  <option className="bg-[#062946]" value="google meet">
                    Google Meet
                  </option>
                  <option className="bg-[#062946]" value="teams">
                    Microsoft Teams
                  </option>
                  <option className="bg-[#062946]" value="phone">
                    Phone
                  </option>
                </select>

                <div className="mt-auto flex justify-end gap-3 border-t border-white/10 pt-6">
                  <button type="button" onClick={() => setIsDrawerOpen(false)} className={mentorSecondaryCta}>
                    Cancel
                  </button>
                  <button
                    disabled={isScheduling}
                    onClick={handleCreateAppointment}
                    className={`${mentorPrimaryCta} ${isScheduling ? "opacity-70 cursor-not-allowed" : ""}`}
                  >
                    {isScheduling ? "Scheduling..." : "Schedule"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
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

export default function MentorSchedule() {
  return (
    <Suspense
      fallback={
        <div className={mentorPageRoot}>
          <MentorHeader showFullHeader />
          <div className={`flex flex-1 flex-col items-center justify-center gap-4 py-24 ${mentorMainGradient}`}>
            <div className={mentorSpinner} />
            <p className={`text-sm ${mentorBodyText}`}>Loading schedule…</p>
          </div>
        </div>
      }
    >
      <MentorScheduleContent />
    </Suspense>
  );
}
