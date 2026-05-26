"use client";
import { Suspense, useEffect, useLayoutEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import HeroBg from "../../Assets/appointment-bg.png";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import ZoomIcon from "../../Assets/zoom.png";
import TeamsIcon from "../../Assets/teams.png";
import PhoneIcon from "../../Assets/phone.png";
import UserProfile from "../../Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import MentorHeader from "@/app/Components/MentorHeader";
import MentorAvailabilityRecurringWorkspace from "@/app/mentor/MentorSchedule/MentorAvailabilityRecurringWorkspace";
import MentorFilterTabGroup from "@/app/Components/mentor/MentorFilterTabGroup";
import AvailabilityCalendar from "@/app/Components/AvailabilityCalendar";
import GoogleCalendarConnectButton from "@/app/Components/GoogleCalendarConnectButton";
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
  apiGetAppointments,
  apiCancelAppointment,
  apiCreateAppointment,
  apiGetWeeklyAvailability,
  apiRescheduleAppointment,
  apiMarkAppointmentMissed,
} from "@/app/Services/appointments.service";
import axiosInstance from "@/app/Services/config/axios-instance";
import {
  appointmentEntityId,
  extractApiErrorMessage,
  isAppointmentMissed,
  isAppointmentScheduled,
  normalizeAppointmentStatus,
  parseSlotStartToIso,
  uiMeetingModeToPlatform,
  unwrapAppointmentsAxiosData,
} from "@/app/Services/appointment-utils";
import { getMentorFromCookie } from "@/app/Services/utils/helpers";
import { apiGetAllUsers, apiGetAssignedUsers } from "@/app/Services/api";
import {
  extractGoogleCalendarCreateOutcome,
  filterSlotLabelsAgainstExternalCalendar,
  googleCalendarSuccessHintFromCreateResponse,
} from "@/app/Services/google-calendar-scheduling";

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

function convertTo24Hour(time12: string, period: string): string {
  let [hours, minutes] = time12.split(":").map(Number);

  if (period.toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

// function getPlatformIcon(platform?: string) {
//   const value = String(platform || "").toLowerCase().trim();

//   if (value.includes("zoom")) return ZoomIcon;

//   if (
//     value.includes("meet") ||
//     value.includes("gmeet") ||
//     value.includes("google")
//   ) {
//     return MeetIcon;
//   }

//   if (value.includes("duo")) return DuoIcon;

//   return ZoomIcon;
// }
function getPlatformIcon(platform?: string) {
  const value = String(platform || "").toLowerCase().trim();

  if (value.includes("zoom")) return ZoomIcon;

  if (
    value.includes("meet") ||
    value.includes("gmeet") ||
    value.includes("google")
  ) {
    return MeetIcon;
  }

  if (value.includes("team")) return TeamsIcon;

  if (value.includes("phone") || value.includes("call")) return PhoneIcon;

  if (value.includes("duo")) return DuoIcon;

  return ZoomIcon;
}

const getInitialsAvatar = (
  firstName?: string,
  lastName?: string,
  fallback = "User"
) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(
    `${firstName || ""} ${lastName || ""}`.trim() || fallback
  )}&background=173653&color=ffffff`;
/**
 * Given a mentor's own ID and an appointment, returns the OTHER party (pastor/director).
 * The API is queried with mentorId so `appt.mentor` could be populated with the logged-in
 * mentor. We compare IDs to find which populated object is NOT the current user.
 */
function resolveOtherPerson(
  appt: Appointment,
  currentMentorId: string | null,
): import("@/app/Services/types/appointments.types").PersonInfo | undefined {
  const mid = currentMentorId ?? "";
  const userObj: import("@/app/Services/types/appointments.types").PersonInfo | undefined =
    appt.user ??
    (appt.userId && typeof appt.userId === "object"
      ? (appt.userId as import("@/app/Services/types/appointments.types").PersonInfo)
      : undefined);
  const mentorObj: import("@/app/Services/types/appointments.types").PersonInfo | undefined =
    appt.mentor ??
    (appt.mentorId && typeof appt.mentorId === "object"
      ? (appt.mentorId as import("@/app/Services/types/appointments.types").PersonInfo)
      : undefined);

  // If userObj is the logged-in mentor, the other person is mentorObj (and vice-versa)
  if (userObj && (userObj._id === mid || (userObj as any).id === mid)) return mentorObj;
  // userObj is the other party
  if (userObj) return userObj;
  // Only mentorObj available — if it's us, no other info; otherwise return it
  if (mentorObj && mentorObj._id !== mid && (mentorObj as any).id !== mid) return mentorObj;
  return undefined;
}

function MentorScheduleContent() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const rescheduleAppointmentId = searchParams.get("appointmentId");
const shouldOpenReschedule = searchParams.get("reschedule") === "1";
  const [activeTab, setActiveTab] = useState<
    "Appointments" | "Availability" | "Schedule" | "Appointment History"
  >(() => tabFromQueryParam(searchParams.get("tab")) ?? "Appointments");
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [historyPage, setHistoryPage] = useState(1);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<1 | 2>(1);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const router = useRouter();
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
  const [isScheduling, setIsScheduling] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [calendarSlotSyncLoading, setCalendarSlotSyncLoading] = useState(false);
  const [calendarSlotSyncError, setCalendarSlotSyncError] = useState<string | null>(null);
  const [calendarSlotSyncSkipped, setCalendarSlotSyncSkipped] = useState(false);
  const [calendarBusyStripped, setCalendarBusyStripped] = useState(0);
  const [calendarConnectBanners, setCalendarConnectBanners] = useState<string[]>([]);

  // schedule drawer calendar state
  const today = new Date();
  const [scheduleMonth, setScheduleMonth] = useState(today.getMonth());
  const [scheduleYear, setScheduleYear] = useState(today.getFullYear());
  const [scheduleSelectedDate, setScheduleSelectedDate] = useState(today.getDate());
  const [scheduleMonthlyAvailabilitySlots, setScheduleMonthlyAvailabilitySlots] = useState<any[]>([]);
  const [scheduleAvailabilityLoading, setScheduleAvailabilityLoading] = useState(false);

  // reschedule state
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<Appointment | null>(null);
  const [rescheduleRecipientType, setRescheduleRecipientType] = useState<"director" | "pastor" | null>(null);
  const [rescheduleMonth, setRescheduleMonth] = useState(today.getMonth());
  const [rescheduleYear, setRescheduleYear] = useState(today.getFullYear());
  const [rescheduleSelectedDate, setRescheduleSelectedDate] = useState(today.getDate());
  const [rescheduleMonthlyAvailabilitySlots, setRescheduleMonthlyAvailabilitySlots] = useState<any[]>([]);
  const [rescheduleAvailabilityLoading, setRescheduleAvailabilityLoading] = useState(false);
  const [rescheduleSelectedSlot, setRescheduleSelectedSlot] = useState("");
  const [rescheduleDateTime, setRescheduleDateTime] = useState("");
  const [reschedulePlatform, setReschedulePlatform] = useState("zoom");
  const [isRescheduling, setIsRescheduling] = useState(false);

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

  /** After Google OAuth: ?googleCalendar=linked | error&reason= */
  useEffect(() => {
    const linked = searchParams.get("googleCalendar");
    if (!linked) return;

    const reasonRaw = searchParams.get("reason");
    const reason =
      reasonRaw && reasonRaw.trim()
        ? (() => {
            try {
              return decodeURIComponent(reasonRaw.replace(/\+/g, " "));
            } catch {
              return reasonRaw;
            }
          })()
        : "";

    if (linked === "linked" || linked === "1") {
      setToastMessage("Google Calendar connected.");
    } else if (linked === "error") {
      setToastMessage(reason ? `Google Calendar: ${reason}` : "Google Calendar linking failed.");
    } else {
      return;
    }
    setTimeout(() => setToastMessage(null), linked === "error" ? 6000 : 4500);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("googleCalendar");
    next.delete("reason");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [searchParams, pathname, router]);

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
        const res = await apiGetAppointments({ userId: mentorId, mentorId, futureOnly: false });
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
  if (!shouldOpenReschedule || !rescheduleAppointmentId || appointments.length === 0) return;

  const appt = appointments.find(
    (item) => appointmentEntityId(item) === rescheduleAppointmentId,
  );

  if (!appt) return;

  setActiveTab("Appointments");
  openRescheduleModal(appt);
}, [shouldOpenReschedule, rescheduleAppointmentId, appointments]);
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
  const recipientType = searchParams.get("recipientType");
  const pastorId = searchParams.get("pastorId");

  if (recipientType !== "pastor" || !pastorId || pastors.length === 0) return;

  const matchedPastor = pastors.find(
    (pastor: any) => String(pastor._id || pastor.id) === String(pastorId)
  );

  if (!matchedPastor) return;

  setActiveTab("Schedule");
  setScheduleRecipientType("pastor");
  setSelectedRecipient(matchedPastor);
  setIsDrawerOpen(true);
  setDrawerStep(2);
}, [searchParams, pastors]);

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

    const targetId =
      scheduleRecipientType === "director"
        ? (selectedRecipient?._id || selectedRecipient?.id || null)
        : mentorId;
    if (!targetId) return;

    let cancelled = false;

    void (async () => {
      setCalendarSlotSyncLoading(true);
      setCalendarSlotSyncError(null);
      setCalendarConnectBanners([]);
      try {
        const res = await apiGetWeeklyAvailability(targetId, meetingDate);
        const data = res.data?.data || [];
        const busyRes = await apiGetAppointments({
          mentorId: String(targetId),
          futureOnly: true,
        });
        const busyAppointments = unwrapAppointmentsAxiosData(busyRes);

        const dayData = data.find((d: any) => d.date?.startsWith(meetingDate));

        if (!dayData?.slots) {
          if (!cancelled) {
            setAvailableSlots([]);
            setCalendarBusyStripped(0);
            setCalendarSlotSyncSkipped(false);
          }
          return;
        }
        const normalize = (t: string) => t.replace(/\s+/g, "").toLowerCase();

        const bookedSlots = busyAppointments
          .filter(
            (a) =>
              a.meetingDate.startsWith(meetingDate) &&
              !["cancelled", "canceled", "missed"].includes((a.status || "").toLowerCase()),
          )
          .map((a) => {
            const d = new Date(a.meetingDate);
            return normalize(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
          });

        const formatted = dayData.slots
          .map((s: any) => {
            return `${s.startTime} ${s.startPeriod.toLowerCase()} - ${s.endTime} ${s.endPeriod.toLowerCase()}`;
          })
          .filter((slot: string) => {
            const startTime = normalize(slot.split(" - ")[0]);
            return !bookedSlots.includes(startTime);
          });

        const participantUserIds = Array.from(
          new Set([String(targetId), String(mentorId)].filter(Boolean)),
        );
        const recipientCalId =
          scheduleRecipientType === "director"
            ? String(mentorId)
            : String(selectedRecipient?._id || selectedRecipient?.id || "").trim() || undefined;

        const gc = await filterSlotLabelsAgainstExternalCalendar({
          meetingDateYmd: meetingDate.slice(0, 10),
          rawSlotLabels: formatted,
          participantUserIds,
          meetingDurationMinutes: 60,
          expandIntoGrid: true,
          availabilityMentorUserId: String(targetId),
          availabilityParticipantUserId: recipientCalId,
        });

        if (cancelled) return;
        setCalendarConnectBanners(gc.connectGoogleBanners ?? []);
        setCalendarSlotSyncSkipped(gc.skipped);
        setCalendarBusyStripped(gc.error ? 0 : gc.strippedCount);
        if (gc.error) {
          setCalendarSlotSyncError(gc.error);
          setAvailableSlots([]);
        } else {
          setCalendarSlotSyncError(null);
          setAvailableSlots(gc.slots);
        }
        setSelectedSlot((prev) => (prev && !gc.error && gc.slots.includes(prev) ? prev : ""));
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setAvailableSlots([]);
          setCalendarSlotSyncError(extractApiErrorMessage(e));
        }
      } finally {
        if (!cancelled) setCalendarSlotSyncLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mentorId, meetingDate, availabilityRefreshKey, scheduleRecipientType, selectedRecipient]);

  // ── Schedule drawer calendar navigation handlers ──────────────────────────────
  const handleSchedulePrevMonth = () => {
    if (scheduleMonth === 0) {
      setScheduleMonth(11);
      setScheduleYear(scheduleYear - 1);
    } else {
      setScheduleMonth(scheduleMonth - 1);
    }
  };

  const handleScheduleNextMonth = () => {
    if (scheduleMonth === 11) {
      setScheduleMonth(0);
      setScheduleYear(scheduleYear + 1);
    } else {
      setScheduleMonth(scheduleMonth + 1);
    }
  };

  // ── Fetch availability for schedule calendar ──────────────────────────────────
  // Pastor → fetch mentor's own availability; Director → fetch that director's availability.
  useEffect(() => {
    if (drawerStep !== 2 || !mentorId || !scheduleRecipientType) {
      setScheduleMonthlyAvailabilitySlots([]);
      setScheduleAvailabilityLoading(false);
      return;
    }

    const targetId =
      scheduleRecipientType === "director"
        ? (selectedRecipient?._id || selectedRecipient?.id || null)
        : mentorId;

    if (!targetId) {
      setScheduleMonthlyAvailabilitySlots([]);
      setScheduleAvailabilityLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setScheduleAvailabilityLoading(true);
        // Use year/month parameters format
        const res = await axiosInstance.get(`/appointments/availability/${targetId}/month`, {
          params: {
            year: scheduleYear,
            month: scheduleMonth + 1,
          },
        });
        const raw = res.data?.data ?? res.data;
        const slots = Array.isArray(raw) ? raw : [];

        if (!cancelled) {
          setScheduleMonthlyAvailabilitySlots(slots);
          // Convert schedule calendar date to YYYY-MM-DD format and update meetingDate
          const selectedDateStr = `${scheduleYear}-${String(scheduleMonth + 1).padStart(2, "0")}-${String(scheduleSelectedDate).padStart(2, "0")}`;
          setMeetingDate(selectedDateStr);
        }
        setScheduleAvailabilityLoading(false);
      } catch (error) {
        console.error("Error fetching schedule availability:", error);
        if (!cancelled) {
          setScheduleMonthlyAvailabilitySlots([]);
          setScheduleAvailabilityLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [drawerStep, mentorId, scheduleYear, scheduleMonth, scheduleSelectedDate, scheduleRecipientType, selectedRecipient]);

  const todayKey = new Date().toISOString().split("T")[0];

  const selectedDayAppointments = appointments
    .filter((a) => a.meetingDate.startsWith(selectedAppointmentDate))
    .filter((a) => {
      if (selectedAppointmentDate !== todayKey) return true;
      const t = new Date(a.meetingDate).getTime();
      if (t >= Date.now()) return true;
      return normalizeAppointmentStatus(a) === "missed";
    })
    .sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime());
  const appointmentHistory = appointments
    .filter((a) => {
      const ms = new Date(a.meetingDate).getTime();
      return ms < Date.now() || normalizeAppointmentStatus(a) === "missed";
    })
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

  // ── Fetch availability for reschedule calendar (director only) ──────────────────
  useEffect(() => {
    if (!isRescheduleModalOpen || !rescheduleTarget) return;

    const fetchAvailability = async () => {
      if (rescheduleRecipientType === "director") {
        // Fetch director's availability
        const directorId = (rescheduleTarget.mentor as any)?._id || (rescheduleTarget.mentor as any)?.id;
        if (!directorId) {
          console.warn("No director ID available for reschedule");
          return;
        }

        setRescheduleAvailabilityLoading(true);
        try {
          const url = `/appointments/availability/${directorId}/month`;
          const params = { year: rescheduleYear, month: rescheduleMonth + 1 };
          console.log("Fetching director availability for reschedule:", { url, params, directorId });

          const response = await axiosInstance.get(url, { params });
          console.log("Director availability response:", response.data);

          if (response.data?.data) {
            console.log("Setting rescheduleMonthlyAvailabilitySlots with:", response.data.data);
            setRescheduleMonthlyAvailabilitySlots(response.data.data);
          } else {
            console.warn("No data in director availability response:", response.data);
            setRescheduleMonthlyAvailabilitySlots([]);
          }
        } catch (e) {
          console.error("Failed to fetch director availability for reschedule:", e);
          setRescheduleMonthlyAvailabilitySlots([]);
        } finally {
          setRescheduleAvailabilityLoading(false);
        }
      } else if (rescheduleRecipientType === "pastor") {
        // Fetch mentor's own availability for pastor reschedule
        if (!mentorId) {
          console.warn("No mentorId available for reschedule");
          return;
        }

        setScheduleAvailabilityLoading(true);
        try {
          const url = `/appointments/availability/${mentorId}/month`;
          const params = { year: rescheduleYear, month: rescheduleMonth + 1 };
          console.log("Fetching mentor availability for pastor reschedule:", { url, params, mentorId });

          const response = await axiosInstance.get(url, { params });
          console.log("Mentor availability response:", response.data);

          if (response.data?.data) {
            console.log("Setting scheduleMonthlyAvailabilitySlots with:", response.data.data);
            setScheduleMonthlyAvailabilitySlots(response.data.data);
          } else {
            console.warn("No data in mentor availability response:", response.data);
            setScheduleMonthlyAvailabilitySlots([]);
          }
        } catch (e) {
          console.error("Failed to fetch mentor availability for pastor reschedule:", e);
          setScheduleMonthlyAvailabilitySlots([]);
        } finally {
          setScheduleAvailabilityLoading(false);
        }
      } else {
        console.warn("Unknown rescheduleRecipientType:", rescheduleRecipientType);
      }
    };

    fetchAvailability();
  }, [isRescheduleModalOpen, rescheduleTarget, rescheduleRecipientType, rescheduleYear, rescheduleMonth, mentorId]);

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

    const targetMentorId =
      scheduleRecipientType === "director"
        ? String(selectedRecipient._id || selectedRecipient.id)
        : String(mentorId);

    // Overlap check against target availability owner
    const proposedIso = toIsoFromDateAndSlot(meetingDate, selectedSlot);
    const proposedMs = new Date(proposedIso).getTime();
    if (meetingDate === new Date().toISOString().split("T")[0] && proposedMs <= Date.now()) {
      setToastMessage("For today, please choose a time after the current time.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }
    const busyRes = await apiGetAppointments({
      mentorId: targetMentorId,
      futureOnly: true,
    });
    const busyAppointments = unwrapAppointmentsAxiosData(busyRes);
    const hasOverlap = busyAppointments.some((a) => {
      const t = new Date(String(a.meetingDate ?? "")).getTime();
      return !Number.isNaN(t) && Math.abs(t - proposedMs) < 60 * 60 * 1000;
    });
    if (hasOverlap) {
      setToastMessage("This time slot overlaps with an existing appointment.");
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const participantUserIdsForCalendar = Array.from(
      new Set([String(targetMentorId), String(mentorId)].filter(Boolean)),
    );
    const gcRecheck = await filterSlotLabelsAgainstExternalCalendar({
      meetingDateYmd: meetingDate.slice(0, 10),
      rawSlotLabels: availableSlots,
      participantUserIds: participantUserIdsForCalendar,
      meetingDurationMinutes: 60,
      expandIntoGrid: true,
      availabilityMentorUserId: String(targetMentorId),
      availabilityParticipantUserId:
        scheduleRecipientType === "director"
          ? String(mentorId)
          : String(selectedRecipient?._id || selectedRecipient?.id || "").trim() || undefined,
    });
    if (!gcRecheck.skipped) {
      if (gcRecheck.error) {
        setToastMessage(gcRecheck.error);
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }
      if (!gcRecheck.slots.includes(selectedSlot)) {
        setToastMessage(
          "That time conflicts with someone's Google Calendar. Pick another slot and try again.",
        );
        setTimeout(() => setToastMessage(null), 5000);
        return;
      }
    }

    setIsScheduling(true);

    let mentorToastDismissMs = 3000;

    try {
      const recipientLabel =
        `${(selectedRecipient as any)?.firstName ?? ""} ${(selectedRecipient as any)?.lastName ?? ""}`.trim() ||
        (scheduleRecipientType === "pastor" ? "Pastor" : "Director");

      const res = await apiCreateAppointment({
        userId:
          scheduleRecipientType === "director"
            ? mentorId
            : String(selectedRecipient._id || selectedRecipient.id),
        mentorId: targetMentorId,
        meetingDate: proposedIso,
        platform: uiMeetingModeToPlatform(selectedPlatform),
        notes: `Scheduled by mentor (${uiMeetingModeToPlatform(selectedPlatform)})`,
        googleCalendarSync: true,
        googleCalendarTitle: `Meeting · mentor & ${recipientLabel}`,
        googleCalendarDescription: `Scheduled in CCC · Platform: ${selectedPlatform}`,
        initiatorRole: "mentor",
      });

      const gHint = googleCalendarSuccessHintFromCreateResponse(res?.data);
      const outcome = extractGoogleCalendarCreateOutcome(res?.data);
      if (gHint) mentorToastDismissMs = 7000;
      if (outcome.warnings.length) {
        mentorToastDismissMs = Math.max(mentorToastDismissMs, 9000);
      }

      setAvailableSlots((prev) => prev.filter((s) => s !== selectedSlot));
      setAvailabilityRefreshKey((prev) => prev + 1);
      const refresh = await apiGetAppointments({ userId: mentorId, mentorId, futureOnly: false });
      setAppointments(unwrapAppointmentsAxiosData(refresh));
      setIsDrawerOpen(false);
      setDrawerStep(1);
      setSelectedRecipient(null);
      setMeetingDate("");
      setSelectedSlot("");
      const warningSuffix =
        outcome.warnings.length > 0 ? ` Note: ${outcome.warnings.join(" · ")}` : "";
      setToastMessage(
        (gHint ? `Appointment created. ${gHint}` : "Appointment created successfully") +
          warningSuffix,
      );
    } catch (error) {
      console.error("Failed to create appointment", error);
      setToastMessage("Failed to create appointment");
    } finally {
      setIsScheduling(false);
    }

    setTimeout(() => setToastMessage(null), mentorToastDismissMs);
  };

  const handleCancelMentorAppointment = async (appt: Appointment) => {
    const id = appointmentEntityId(appt);
    if (!id || !mentorId) return;

    try {
      await apiCancelAppointment(id);
    } catch (e) {
      console.error(e);
    }

    try {
      const refresh = await apiGetAppointments({ userId: mentorId, mentorId, futureOnly: false });
      const freshList = unwrapAppointmentsAxiosData(refresh);
      setAppointments(freshList);
      setShowMenu(null);
      const stillActive = freshList.find(
        (a: Appointment) =>
          appointmentEntityId(a) === id &&
          !["cancelled", "canceled"].includes((a.status || "").toLowerCase()),
      );
      setToastMessage(stillActive ? "Failed to cancel appointment" : "Appointment cancelled");
    } catch (_) {
      setToastMessage("Failed to cancel appointment");
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleMarkMentorAppointmentMissed = async (appt: Appointment) => {
    const id = appointmentEntityId(appt);
    if (!id || !mentorId) return;

    setShowMenu(null);
    if (
      !window.confirm(
        "Mark this appointment as missed? Join links will be cleared for everyone, and CCC can notify participants.",
      )
    ) {
      return;
    }

    try {
      await apiMarkAppointmentMissed(id);
    } catch (e) {
      console.error(e);
      setToastMessage(extractApiErrorMessage(e) || "Failed to mark appointment as missed");
      setTimeout(() => setToastMessage(null), 4000);
      return;
    }

    try {
      const refresh = await apiGetAppointments({ userId: mentorId, mentorId, futureOnly: false });
      setAppointments(unwrapAppointmentsAxiosData(refresh));
      setToastMessage("Appointment marked as missed");
    } catch (_) {
      setToastMessage("Marked as missed but list could not be refreshed — please reload.");
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  // ── Open reschedule modal ──────────────────────────────────────────────────────
  const openRescheduleModal = (appt: Appointment) => {
    setRescheduleTarget(appt);
    setReschedulePlatform(String(appt.platform || "zoom").toLowerCase());
    setShowMenu(null);

    // Determine recipient type (director or pastor)
    const recipientRole = (appt.mentor as any)?.role || (appt.user as any)?.role || "pastor";
    const isDirector = recipientRole?.toLowerCase().includes("director");
    setRescheduleRecipientType(isDirector ? "director" : "pastor");

    // Reset states
    const today = new Date();
    setRescheduleMonth(today.getMonth());
    setRescheduleYear(today.getFullYear());
    setRescheduleSelectedDate(today.getDate());
    setRescheduleSelectedSlot("");
    setRescheduleDateTime("");
    setRescheduleMonthlyAvailabilitySlots([]);
    setScheduleMonthlyAvailabilitySlots([]);
    setIsRescheduleModalOpen(true);
  };

  // ── Reschedule calendar navigation ─────────────────────────────────────────────
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

  // ── Handle reschedule appointment ──────────────────────────────────────────────
  const handleRescheduleAppointment = async () => {
    const appt = rescheduleTarget;
    const id = appt ? appointmentEntityId(appt) : "";
    if (!id || !mentorId) return;

    // Validate based on recipient type
    if (rescheduleRecipientType === "director") {
      if (!rescheduleSelectedSlot) {
        setToastMessage("Please select an available time slot");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
    } else {
      if (!rescheduleDateTime) {
        setToastMessage("Please select date and time");
        setTimeout(() => setToastMessage(null), 3000);
        return;
      }
    }

    if (isRescheduling) return;
    setIsRescheduling(true);

    try {
      const newDate = rescheduleRecipientType === "director"
        ? rescheduleSelectedSlot
        : rescheduleDateTime;

      // Extract startTime/startPeriod from the resolved ISO
      const _d = new Date(newDate);
      const _h24 = _d.getHours();
      const _min = _d.getMinutes();
      const startPeriod = _h24 < 12 ? "AM" : "PM";
      const _h12 = _h24 % 12 === 0 ? 12 : _h24 % 12;
      const startTime = `${_h12}:${String(_min).padStart(2, "0")}`;

      await apiRescheduleAppointment(id, {
        newDate,
        startTime,
        startPeriod,
        platform: reschedulePlatform as any,
      });
      const refresh = await apiGetAppointments({ userId: mentorId, mentorId, futureOnly: false });
      setAppointments(unwrapAppointmentsAxiosData(refresh));
      setIsRescheduleModalOpen(false);
      setRescheduleTarget(null);
      setToastMessage("Appointment rescheduled successfully");
    } catch (e) {
      console.error(e);
      setToastMessage(extractApiErrorMessage(e) || "Failed to reschedule appointment");
    } finally {
      setIsRescheduling(false);
    }
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className={mentorPageRoot}>
      <MentorHeader showFullHeader={true} />

      <section
        className="relative flex min-h-[200px] flex-col justify-center bg-cover bg-center px-0 py-10 text-white sm:min-h-[240px]"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className={mentorHeroOverlay} />
        <div className="relative z-10 max-w-4xl">
          <h1 className="text-2xl font-semibold sm:text-3xl md:text-4xl">Mentor schedule</h1>
          <p className={`mt-2 max-w-2xl ${mentorBodyText}`}>
            View appointments, manage recurring availability, or schedule a new meeting with an assigned pastor — same look
            as pastor appointments.
          </p>
        </div>
      </section>

      <main className={`${mentorMainGradient} flex-1 px-0 pb-20 pt-8`}>
        <div className="w-full">
          <div className={`${mentorFilterPanel} mb-8`}>
            <div className="flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center">
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
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#cde2f2]/85">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-sm bg-[#8ec5eb]/35 ring-1 ring-[#8ec5eb]/50" />
                    Selected date
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-3 w-3 rounded-sm ring-1 ring-amber-300/80" />
                    Existing appointments
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
                    <div className={`${mentorEmptyPanel} text-center`}>
                      <p className="text-base font-medium text-white/75">No meetings scheduled for this day.</p>
                      <p className="mt-2 text-sm leading-relaxed text-[#cde2f2]/90">
                        Tip: Use the Schedule tab to book meetings with pastor and director users, and keep your Availability settings updated.
                      </p>
                    </div>
                  ) : null}
                  {selectedDayAppointments.map((appt, index) => {
                    const meetingDate = new Date(appt.meetingDate);
                    const apptKey = appointmentEntityId(appt) || String(index);
                    const missed = isAppointmentMissed(appt);
                    const sched = isAppointmentScheduled(appt);
                    const otherPerson = resolveOtherPerson(appt, mentorId);
                    const displayName = otherPerson
                      ? `${otherPerson.firstName ?? ""} ${otherPerson.lastName ?? ""}`.trim() || "Unknown"
                      : "Unknown";
                    const rawRole = otherPerson?.role ?? "pastor";
                    const displayRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
                    const otherPersonProfile = otherPerson as any;

                    return (
                      <div
                        key={apptKey}
                        className={`${mentorGlassCardRoadmap} relative items-stretch gap-0 overflow-visible p-4 sm:items-center sm:p-5 ${showMenu === apptKey ? "z-[60]" : ""} ${missed ? "ring-1 ring-amber-500/30 opacity-90" : ""}`}
                      >
                        <div className="flex w-full shrink-0 items-center justify-center border-b border-white/10 py-4 sm:w-[120px] sm:border-b-0 sm:border-r sm:py-0">
                          <div className="flex h-[100px] w-[100px] items-center justify-center rounded-xl border border-white/15 bg-white/5">
                            <Image
                              // src={appt.platform === "zoom" ? MeetIcon : DuoIcon}
                              src={getPlatformIcon(appt.platform)}
                              alt={appt.platform}
                              className="h-[52px] w-[52px]"
                            />
                          </div>
                        </div>

                        <div className="min-w-0 flex-1 px-0 pt-4 sm:px-5 sm:pt-0">
                          <div className="mb-2 flex items-center gap-3">
                            {/* <Image
                              src={otherPerson?.profilePicture || UserProfile}
                              alt="User"
                              width={36}
                              height={36}
                              className="rounded-full border border-white/20"
                            /> */}
                            <img
                              src={
                                String(otherPersonProfile?.profilePicture || "").trim() ||
                                getInitialsAvatar(
                                  otherPersonProfile?.firstName,
                                  otherPersonProfile?.lastName,
                                  displayRole
                                )
                              }
                              alt={displayName}
                              className="h-9 w-9 rounded-full border border-white/20 object-cover"
                            />

                            <div>
                              <h4 className="text-sm font-semibold text-white">
                                {displayName}
                              </h4>

                              <p className="text-[12px] text-[#cde2f2]/90">{displayRole}</p>
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
                                hour: "numeric",
                                minute: "2-digit",
                                hour12: true,
                              })}
                            </div>
                            {missed ? (
                              <span className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-100">
                                Missed
                              </span>
                            ) : null}
                          </div>

                          <p className="mb-2 text-[12px] text-[#cde2f2]">
                            Mode:{" "}
                            <span className="font-semibold text-[#8ec5eb]">{appt.platform}</span>
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex gap-3 text-[15px] text-[#8ec5eb]">
                              <a href={(otherPerson as any)?.phoneNumber ? `tel:${(otherPerson as any).phoneNumber}` : undefined} aria-label="Call" className="transition hover:text-white"><i className="fa-solid fa-phone" /></a>
                              <a href={(otherPerson as any)?.phoneNumber ? `sms:${(otherPerson as any).phoneNumber}` : undefined} aria-label="Text" className="transition hover:text-white"><i className="fa-regular fa-comment" /></a>
                              <a href={(otherPerson as any)?.phoneNumber ? `https://wa.me/${String((otherPerson as any).phoneNumber).replace(/\D/g, "")}` : undefined} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="transition hover:text-white"><i className="fa-brands fa-whatsapp" /></a>
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
                                <div className="absolute right-0 top-9 z-[50] w-[220px] overflow-hidden rounded-xl border border-white/20 bg-[#0a3558]/95 py-1 text-sm text-[#d9ebf8] shadow-xl backdrop-blur-md">
                                  <button
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                                    onClick={() => { setShowMenu(null); router.push(`/mentor/MentorSchedule/${encodeURIComponent(appointmentEntityId(appt))}`); }}
                                  >
                                    <i className="fa-regular fa-eye mr-2 text-[#8ec5eb]" />
                                    View details
                                  </button>

                                  {sched ? (
                                    <button
                                      type="button"
                                      className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                                      onClick={() => void handleMarkMentorAppointmentMissed(appt)}
                                    >
                                      <i className="fa-regular fa-user-clock mr-2 text-amber-200" />
                                      Mark as missed
                                    </button>
                                  ) : null}

                                  {sched ? (
                                  <button
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                                    onClick={() => openRescheduleModal(appt)}
                                  >
                                    <i className="fa-regular fa-calendar-check mr-2 text-[#8ec5eb]" />
                                    Reschedule meeting
                                  </button>
                                  ) : null}

                                  {sched ? (
                                  <button
                                    type="button"
                                    className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                                    onClick={() => handleCancelMentorAppointment(appt)}
                                  >
                                    <i className="fa-regular fa-circle-xmark mr-2 text-red-300" />
                                    Cancel meeting
                                  </button>
                                  ) : null}

                                  {sched ? (
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
                                  ) : null}
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
                    const missed = isAppointmentMissed(appt);
                    const otherPerson = resolveOtherPerson(appt, mentorId);
                    const displayName = otherPerson
                      ? `${otherPerson.firstName ?? ""} ${otherPerson.lastName ?? ""}`.trim() || "Unknown"
                      : "Unknown";
                    const rawRole = otherPerson?.role ?? "pastor";
                    const displayRole = rawRole.charAt(0).toUpperCase() + rawRole.slice(1).toLowerCase();
                    const otherPersonProfile = otherPerson as any;
                    return (
                      <div key={apptKey} className={`${mentorGlassCardRoadmap} relative items-stretch gap-0 p-4 sm:items-center sm:p-5 ${missed ? "ring-1 ring-amber-500/25" : ""}`}>
                        <div className="flex w-full shrink-0 items-center justify-center border-b border-white/10 py-4 sm:w-[120px] sm:border-b-0 sm:border-r sm:py-0">
                          <div className="flex h-[100px] w-[100px] items-center justify-center rounded-xl border border-white/15 bg-white/5">
                            <Image
                              // src={appt.platform === "zoom" ? MeetIcon : DuoIcon}
                              src={getPlatformIcon(appt.platform)}
                              alt={appt.platform}
                              className="h-[52px] w-[52px]"
                            />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1 px-0 pt-4 sm:px-5 sm:pt-0">
                          <div className="mb-2 flex items-center gap-3">
                            {/* <Image
                              src={otherPerson?.profilePicture || UserProfile}
                              alt="User"
                              width={36}
                              height={36}
                              className="rounded-full border border-white/20"
                            /> */}
                            <img
                              src={
                                String(otherPersonProfile?.profilePicture || "").trim() ||
                                getInitialsAvatar(
                                  otherPersonProfile?.firstName,
                                  otherPersonProfile?.lastName,
                                  displayRole
                                )
                              }
                              alt={displayName}
                              className="h-9 w-9 rounded-full border border-white/20 object-cover"
                            />
                            <div>
                              <h4 className="text-sm font-semibold text-white">{displayName}</h4>
                              <p className="text-[12px] text-[#cde2f2]/90">{displayRole}</p>
                            </div>
                          </div>
                          <div className="mb-2 flex flex-wrap gap-2">
                            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium text-[#d9ebf8]">
                              <i className="fa-regular fa-calendar text-[#8ec5eb]" />
                              {meetingDate.toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3 py-1 text-[12px] font-medium text-[#d9ebf8]">
                              <i className="fa-regular fa-clock text-[#8ec5eb]" />
                              {meetingDate.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
                            </div>
                            {missed ? (
                              <span className="rounded-lg border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-100">
                                Missed
                              </span>
                            ) : null}
                          </div>
                          <p className="mb-2 text-[12px] text-[#cde2f2]">Mode: <span className="font-semibold text-[#8ec5eb]">{appt.platform}</span></p>
                          <button
                            type="button"
                            onClick={() => router.push(`/mentor/MentorSchedule/${encodeURIComponent(appointmentEntityId(appt))}`)}
                            className={`${mentorPrimaryCta} mt-1 px-4 py-1.5 text-xs`}
                          >
                            Details
                          </button>
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
            <MentorAvailabilityRecurringWorkspace
              mentorId={mentorId}
              onToast={(message, kind) => {
                setToastMessage(message);
                const ms = kind === "err" ? 5000 : 4000;
                setTimeout(() => setToastMessage(null), ms);
              }}
              onAvailabilitySaved={() => setAvailabilityRefreshKey((k) => k + 1)}
            />
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
                          {/* <Image
                            src={person.profilePicture || UserProfile}
                            alt=""
                            width={36}
                            height={36}
                            className="shrink-0 rounded-full border border-white/20"
                          /> */}
                          <img
                            src={
                              String(person?.profilePicture || "").trim() ||
                              getInitialsAvatar(person?.firstName, person?.lastName, scheduleRecipientType)
                            }
                            alt={`${person?.firstName || ""} ${person?.lastName || ""}`.trim() || scheduleRecipientType}
                            className="h-9 w-9 shrink-0 rounded-full border border-white/20 object-cover"
                          />
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate text-sm font-medium text-white">
                              {person.firstName} {person.lastName}
                            </span>
                            <span className="text-[12px] capitalize text-white/50">
                              {scheduleRecipientType}
                            </span>
                          </div>
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
                <div className="mb-6 flex items-center justify-between shrink-0">
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

                <div className="flex-1 overflow-y-auto pr-3 mb-6">
                  <div className="mb-6 rounded-xl border border-white/15 bg-white/5 p-4">
                    <p className="mb-3 text-sm text-[#cde2f2]">Mentor Availability</p>
                    <AvailabilityCalendar
                      mentorId={mentorId || ""}
                      currentMonth={scheduleMonth}
                      currentYear={scheduleYear}
                      selectedDate={scheduleSelectedDate}
                      onDateSelect={setScheduleSelectedDate}
                      onPrevMonth={handleSchedulePrevMonth}
                      onNextMonth={handleScheduleNextMonth}
                      availabilitySlots={scheduleMonthlyAvailabilitySlots}
                      isLoading={scheduleAvailabilityLoading}
                    />
                  </div>

                  <div className="mb-4 flex flex-col gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <GoogleCalendarConnectButton label="Link my Google Calendar" />
                      <span className="text-[11px] leading-snug text-[#cde2f2]/75">
                        Connect Google so busy times hide automatically and bookings create Calendar events after OAuth.
                      </span>
                    </div>
                    {calendarConnectBanners.map((msg) => (
                      <p key={msg.slice(0, 80)} className="text-[11px] text-amber-100/95">
                        {msg}
                      </p>
                    ))}
                  </div>

                  <div className="mb-6 grid grid-cols-2 gap-3">
                    {(calendarSlotSyncLoading || scheduleAvailabilityLoading) && (
                      <p className="col-span-2 flex items-center gap-2 text-xs text-[#8ec5eb]">
                        <i className="fa-solid fa-spinner fa-spin" aria-hidden />
                        Syncing Google Calendar availability…
                      </p>
                    )}
                    {calendarSlotSyncError ? (
                      <p className="col-span-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-50">
                        {calendarSlotSyncError} Time slots cannot be validated until calendar access works.
                      </p>
                    ) : null}
                    {!calendarSlotSyncSkipped && calendarBusyStripped > 0 && !calendarSlotSyncError ? (
                      <p className="col-span-2 text-xs text-[#cde2f2]/80">
                        Some times are hidden due to conflicting events on linked Google Calendars.
                      </p>
                    ) : null}
                    {availableSlots.length === 0 && !calendarSlotSyncLoading && !scheduleAvailabilityLoading ? (
                      <p className="text-sm text-[#cde2f2]">No slots available</p>
                    ) : (
                      availableSlots.map((label, slotIdx) => (
                        <button
                          key={`${label}-${slotIdx}`}
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
                    className={`${mentorSelectDark} w-full`}
                  >
                    <option className="bg-[#062946]" value="zoom">
                      Zoom
                    </option>
                    {/* <option className="bg-[#062946]" value="google meet">
                      Google Meet
                    </option>
                    <option className="bg-[#062946]" value="teams">
                      Microsoft Teams
                    </option>
                    <option className="bg-[#062946]" value="phone">
                      Phone
                    </option> */}
                  </select>
                </div>

                <div className="flex justify-end gap-3 border-t border-white/10 pt-6 shrink-0">
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

      {/* ── Reschedule Drawer (Right Side) ── */}
      {isRescheduleModalOpen && rescheduleTarget && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
            onClick={() => { if (!isRescheduling) setIsRescheduleModalOpen(false); }}
            aria-hidden
          />
          <div className="fixed right-0 top-0 z-50 h-full w-full border-l border-white/15 bg-[#041f35] text-white shadow-2xl sm:max-w-[480px] sm:w-[480px]">
            {/* ── Director: Show availability calendar ── */}
            {rescheduleRecipientType === "director" ? (
              <div className="flex h-full flex-col p-6">
                <div className="mb-6 flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <i className="fa-regular fa-calendar-days text-[#8ec5eb]" />
                      Reschedule meeting
                    </h2>
                    {((rescheduleTarget.user as any)?.firstName || (rescheduleTarget.user as any)?.lastName) && (
                      <p className="mt-1 text-sm text-[#8ec5eb] font-medium pl-7">
                        {[(rescheduleTarget.user as any)?.firstName, (rescheduleTarget.user as any)?.lastName].filter(Boolean).join(" ")}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRescheduleModalOpen(false)}
                    className="rounded-lg p-2 text-[#cde2f2] transition hover:bg-white/10 hover:text-white"
                    aria-label="Close"
                  >
                    <i className="fa-solid fa-xmark text-xl" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-3 mb-6">
                  {/* Next Availability Info */}
                  {rescheduleMonthlyAvailabilitySlots.length > 0 && (
                    <div className="mb-6 rounded-xl border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 p-4">
                      <p className="text-xs text-[#cde2f2] font-semibold mb-2">Next Available</p>
                      <p className="text-sm font-medium text-[#8ec5eb]">
                        {rescheduleMonthlyAvailabilitySlots[0]?.date && rescheduleMonthlyAvailabilitySlots[0]?.times?.[0]
                          ? `${new Date(rescheduleMonthlyAvailabilitySlots[0].date).toLocaleDateString()} at ${rescheduleMonthlyAvailabilitySlots[0].times[0]}`
                          : "No availability found"}
                      </p>
                    </div>
                  )}

                  <div className="mb-6 rounded-xl border border-white/15 bg-white/5 p-4">
                    <p className="mb-3 text-sm text-[#cde2f2]">Director Availability</p>
                    {rescheduleAvailabilityLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-r-white" />
                      </div>
                    ) : (
                      <AvailabilityCalendar
                        mentorId={(rescheduleTarget.mentor as any)?._id || (rescheduleTarget.mentor as any)?.id || ""}
                        currentMonth={rescheduleMonth}
                        currentYear={rescheduleYear}
                        selectedDate={rescheduleSelectedDate}
                        onDateSelect={setRescheduleSelectedDate}
                        onPrevMonth={handleReschedulePrevMonth}
                        onNextMonth={handleRescheduleNextMonth}
                        availabilitySlots={rescheduleMonthlyAvailabilitySlots}
                        isLoading={rescheduleAvailabilityLoading}
                      />
                    )}
                  </div>

                  {/* Time slots for selected date */}
                  <div className="mb-6">
                    <label className="block text-sm text-[#cde2f2] font-semibold mb-3">
                      Available times on {new Date(rescheduleYear, rescheduleMonth, rescheduleSelectedDate).toLocaleDateString()}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(() => {
                        const selectedDateSlots = rescheduleMonthlyAvailabilitySlots.find(
                          (slot: any) => new Date(slot.date).getDate() === rescheduleSelectedDate
                        );

                        // Filter to only hourly slots (ending with :00)
                        const timeSlots = (selectedDateSlots?.slots || []).filter(
                          (slot: any) => slot.startTime.endsWith(":00")
                        );

                        if (timeSlots.length === 0) {
                          return <p className="text-sm text-[#cde2f2]">No slots available on this date</p>;
                        }

                        return timeSlots.map((slot: any, idx: number) => {
                          const timeLabel = `${slot.startTime} ${slot.startPeriod}`;
                          const isoString = new Date(`${selectedDateSlots.date}T${convertTo24Hour(slot.startTime, slot.startPeriod)}`).toISOString();

                          return (
                            <button
                              key={idx}
                              onClick={() => setRescheduleSelectedSlot(isoString)}
                              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${rescheduleSelectedSlot === isoString
                                ? "bg-blue-600 text-white border-blue-500"
                                : "border-white/20 text-white hover:bg-white/10"
                                }`}
                            >
                              {timeLabel}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Platform selector */}
                  <select
                    value={reschedulePlatform}
                    onChange={(e) => setReschedulePlatform(e.target.value)}
                    className={`${mentorSelectDark} w-full`}
                  >
                    <option className="bg-[#062946]" value="zoom">Zoom</option>
                    {/* <option className="bg-[#062946]" value="google-meet">Google Meet</option>
                    <option className="bg-[#062946]" value="teams">Microsoft Teams</option>
                    <option className="bg-[#062946]" value="phone">Phone</option>
                    <option className="bg-[#062946]" value="in-person">In person</option> */}
                  </select>
                </div>

                <div className="flex justify-end gap-3 shrink-0 border-t border-white/10 pt-6">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-white/20 text-xs text-white transition hover:bg-white/10"
                    onClick={() => setIsRescheduleModalOpen(false)}
                    disabled={isRescheduling}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`px-6 py-2 rounded-lg bg-blue-600 text-xs font-medium text-white transition ${isRescheduling ? "cursor-not-allowed opacity-70" : "hover:bg-blue-700"}`}
                    onClick={handleRescheduleAppointment}
                    disabled={isRescheduling}
                  >
                    {isRescheduling ? "Saving..." : "Save changes"}
                  </button>
                </div>
              </div>
            ) : (
              /* ── Pastor: Show simple datetime input ── */
              <div className="flex h-full flex-col p-6">
                <div className="mb-6 flex items-center justify-between shrink-0">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-semibold">
                      <i className="fa-regular fa-calendar-days text-[#8ec5eb]" />
                      Reschedule meeting
                    </h2>
                    {((rescheduleTarget.user as any)?.firstName || (rescheduleTarget.user as any)?.lastName) && (
                      <p className="mt-1 text-sm text-[#8ec5eb] font-medium pl-7">
                        {[(rescheduleTarget.user as any)?.firstName, (rescheduleTarget.user as any)?.lastName].filter(Boolean).join(" ")}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsRescheduleModalOpen(false)}
                    className="rounded-lg p-2 text-[#cde2f2] transition hover:bg-white/10 hover:text-white"
                    aria-label="Close"
                  >
                    <i className="fa-solid fa-xmark text-xl" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto pr-3 mb-6">
                  <div className="mb-6 rounded-xl border border-white/15 bg-white/5 p-4">
                    <p className="mb-3 text-sm text-[#cde2f2]">Mentor Availability</p>
                    {scheduleAvailabilityLoading ? (
                      <div className="flex justify-center py-8">
                        <div className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-r-white" />
                      </div>
                    ) : (
                      <AvailabilityCalendar
                        mentorId={mentorId || ""}
                        currentMonth={rescheduleMonth}
                        currentYear={rescheduleYear}
                        selectedDate={rescheduleSelectedDate}
                        onDateSelect={setRescheduleSelectedDate}
                        onPrevMonth={handleReschedulePrevMonth}
                        onNextMonth={handleRescheduleNextMonth}
                        availabilitySlots={scheduleMonthlyAvailabilitySlots}
                        isLoading={scheduleAvailabilityLoading}
                      />
                    )}
                  </div>

                  {/* Time slots for selected date */}
                  <div className="mb-6">
                    <label className="block text-sm text-[#cde2f2] font-semibold mb-3">
                      Available times on {new Date(rescheduleYear, rescheduleMonth, rescheduleSelectedDate).toLocaleDateString()}
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {(() => {
                        const selectedDateSlots = scheduleMonthlyAvailabilitySlots.find(
                          (slot: any) => new Date(slot.date).getDate() === rescheduleSelectedDate
                        );

                        // Filter to only hourly slots (ending with :00)
                        const timeSlots = (selectedDateSlots?.slots || []).filter(
                          (slot: any) => slot.startTime.endsWith(":00")
                        );

                        if (timeSlots.length === 0) {
                          return <p className="text-sm text-[#cde2f2]">No slots available on this date</p>;
                        }

                        return timeSlots.map((slot: any, idx: number) => {
                          const timeLabel = `${slot.startTime} ${slot.startPeriod}`;
                          const isoString = new Date(`${selectedDateSlots.date}T${convertTo24Hour(slot.startTime, slot.startPeriod)}`).toISOString();

                          return (
                            <button
                              key={idx}
                              onClick={() => setRescheduleDateTime(isoString)}
                              className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${rescheduleDateTime === isoString
                                ? "bg-blue-600 text-white border-blue-500"
                                : "border-white/20 text-white hover:bg-white/10"
                                }`}
                            >
                              {timeLabel}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Platform selector */}
                  <select
                    value={reschedulePlatform}
                    onChange={(e) => setReschedulePlatform(e.target.value)}
                    className={`${mentorSelectDark} w-full`}
                  >
                    <option className="bg-[#062946]" value="zoom">Zoom</option>
                    {/* <option className="bg-[#062946]" value="google-meet">Google Meet</option>
                    <option className="bg-[#062946]" value="teams">Microsoft Teams</option>
                    <option className="bg-[#062946]" value="phone">Phone</option>
                    <option className="bg-[#062946]" value="in-person">In person</option> */}
                  </select>
                </div>

                <div className="flex justify-end gap-3 shrink-0 border-t border-white/10 pt-6">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-lg border border-white/20 text-xs text-white transition hover:bg-white/10"
                    onClick={() => setIsRescheduleModalOpen(false)}
                    disabled={isRescheduling}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={`px-6 py-2 rounded-lg bg-blue-600 text-xs font-medium text-white transition ${isRescheduling ? "cursor-not-allowed opacity-70" : "hover:bg-blue-700"}`}
                    onClick={handleRescheduleAppointment}
                    disabled={isRescheduling}
                  >
                    {isRescheduling ? "Saving..." : "Save changes"}
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
