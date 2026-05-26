"use client";

import { Fragment, Suspense, useEffect, useLayoutEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCookie } from "@/app/utils/cookies";
import axiosInstance from "@/app/Services/config/axios-instance";
import DirectorHero from "../DirectorHero";
import AvailabilityCalendar from "@/app/Components/AvailabilityCalendar";
import GoogleCalendarConnectButton from "@/app/Components/GoogleCalendarConnectButton";
import MentorAvailabilityRecurringWorkspace from "@/app/mentor/MentorSchedule/MentorAvailabilityRecurringWorkspace";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
} from "../directorUi";
import { DirectorFilterSection } from "../ui";
import ProgressBg from "../../Assets/progress-bg.jpg";
import DuoIcon from "../../Assets/duo.png";
import MeetIcon from "../../Assets/meet.png";
import ZoomIcon from "../../Assets/zoom.png";
import TeamsIcon from "../../Assets/teams.png";
import PhoneIcon from "../../Assets/phone.png";
import UserProfile from "../../Assets/user-profile.png";
import {
  apiCancelAppointment,
  apiCreateAppointment,
  apiGetAppointments,
  apiMarkAppointmentMissed,
  apiRescheduleAppointment,
  apiGetWeeklyAvailability,
} from "@/app/Services/appointments.service";
import {
  appointmentEntityId,
  extractApiErrorMessage,
  formatAvailabilitySlotLabel,
  isAppointmentMissed,
  isAppointmentScheduled,
  parseSlotStartToIso,
  slotDateToYmd,
  uiMeetingModeToPlatform,
  unwrapAppointmentsAxiosData,
} from "@/app/Services/appointment-utils";
import {
  extractGoogleCalendarCreateOutcome,
  filterSlotLabelsAgainstExternalCalendar,
  googleCalendarSuccessHintFromCreateResponse,
} from "@/app/Services/google-calendar-scheduling";
import { apiGetAllUsers } from "@/app/Services/api";
import type { AppointmentResponse, PersonInfo } from "@/app/Services/types";
import { isRemoteImageSrc } from "@/app/utils/image";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function labelPerson(p: string | PersonInfo | undefined, fallback: string): string {
  if (p == null) return fallback;
  if (typeof p === "string") return fallback;
  const n = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
  return n || p.email || fallback;
}

function resolvePersonId(ref: string | PersonInfo | undefined | null): string {
  if (ref == null) return "";
  if (typeof ref === "string") return ref.trim();
  return String(ref._id || "").trim();
}

function normalizeIdentityText(value: string | undefined | null): string {
  return String(value || "").trim().toLowerCase();
}

function appointmentUserIdString(a: AppointmentResponse): string {
  return resolvePersonId(a.user as PersonInfo) || resolvePersonId(a.userId as string | PersonInfo);
}

function appointmentMentorIdString(a: AppointmentResponse): string {
  return resolvePersonId(a.mentor as PersonInfo) || resolvePersonId(a.mentorId as string | PersonInfo);
}

function asPerson(ref: string | PersonInfo | undefined | null): PersonInfo | undefined {
  if (!ref || typeof ref === "string") return undefined;
  return ref;
}

function appointmentNotCancelled(a: AppointmentResponse): boolean {
  return !["cancelled", "canceled"].includes((a.status || "").toLowerCase());
}

function localYmdFromMs(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function localYmdToday(): string {
  return localYmdFromMs(Date.now());
}
function getInitialsAvatar(firstName?: string, lastName?: string, fallback = "User") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    `${firstName || ""} ${lastName || ""}`.trim() || fallback
  )}&background=173653&color=ffffff`;
}
function isTodayDate(iso: string) {
  const d = new Date(iso);
  const t = new Date();
  return (
    d.getDate() === t.getDate() &&
    d.getMonth() === t.getMonth() &&
    d.getFullYear() === t.getFullYear()
  );
}

function tabFromParam(raw: string | null): "Appointments" | "Availability" | "Schedule" | "Appointment History" | null {
  if (!raw) return null;
  const t = raw.trim().toLowerCase();
  if (t === "appointments") return "Appointments";
  if (t === "availability") return "Availability";
  if (t === "schedule") return "Schedule";
  if (t === "appointment-history" || t === "appointmenthistory" || t === "history") return "Appointment History";
  return null;
}

/** Convert a time string ("09:00") + period ("AM"/"PM") to total minutes since midnight */
const slotToMins = (time: string, p: string): number => {
  const [hStr, mStr] = (time || "00:00").split(":");
  let h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  const isPM = p.toUpperCase() === "PM";
  if (isPM && h !== 12) h += 12;
  if (!isPM && h === 12) h = 0;
  return h * 60 + m;
};

// ─── Check if a date is in the past ───────────────────────────────────────────
function isPastDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

function toLocalDateTimeInput(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

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

// ─── Inner content (needs useSearchParams — wrapped in Suspense) ──────────────

function DirectorScheduleContent() {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"Appointments" | "Availability" | "Schedule" | "Appointment History">(
    () => tabFromParam(searchParams.get("tab")) ?? "Appointments",
  );
  const [historyMyPage, setHistoryMyPage] = useState(1);
  const [historyHostedPage, setHistoryHostedPage] = useState(1);

  // director identity
  const [directorId, setDirectorId] = useState<string | null>(null);
  const [directorIdentity, setDirectorIdentity] = useState<{
    firstName: string;
    lastName: string;
    email: string;
  }>({ firstName: "", lastName: "", email: "" });
  const router = useRouter();
  const pathname = usePathname();

  // shared state
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [showHistoryMenu, setShowHistoryMenu] = useState<string | null>(null);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentResponse | null>(null);
  const [rescheduleDateTime, setRescheduleDateTime] = useState("");
  const [reschedulePlatform, setReschedulePlatform] = useState("zoom");
  const [isRescheduling, setIsRescheduling] = useState(false);

  // reschedule calendar state (for mentor availability)
  const [rescheduleMonth, setRescheduleMonth] = useState(new Date().getMonth());
  const [rescheduleYear, setRescheduleYear] = useState(new Date().getFullYear());
  const [rescheduleSelectedDate, setRescheduleSelectedDate] = useState(new Date().getDate());
  const [rescheduleMonthlyAvailabilitySlots, setRescheduleMonthlyAvailabilitySlots] = useState<any[]>([]);
  const [rescheduleAvailabilityLoading, setRescheduleAvailabilityLoading] = useState(false);
  const [rescheduleSelectedSlot, setRescheduleSelectedSlot] = useState("");

  // calendar (Appointments tab)
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState(() => localYmdToday());
  const [selectedDateView, setSelectedDateView] = useState<"my" | "other">("my");

  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);

  // schedule drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<1 | 2>(1);
  const [scheduleRecipientType, setScheduleRecipientType] = useState<"pastor" | "mentor">("pastor");
  const [pastors, setPastors] = useState<any[]>([]);
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null);
  const [recipientSearch, setRecipientSearch] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("zoom");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [calendarSlotSyncLoading, setCalendarSlotSyncLoading] = useState(false);
  const [calendarSlotSyncError, setCalendarSlotSyncError] = useState<string | null>(null);
  const [calendarSlotSyncSkipped, setCalendarSlotSyncSkipped] = useState(false);
  const [calendarBusyStripped, setCalendarBusyStripped] = useState(0);
  const [calendarConnectBanners, setCalendarConnectBanners] = useState<string[]>([]);
  const [isScheduling, setIsScheduling] = useState(false);

  // schedule drawer calendar state
  const [scheduleMonth, setScheduleMonth] = useState(new Date().getMonth());
  const [scheduleYear, setScheduleYear] = useState(new Date().getFullYear());
  const [scheduleSelectedDate, setScheduleSelectedDate] = useState(new Date().getDate());
  const [scheduleMonthlyAvailabilitySlots, setScheduleMonthlyAvailabilitySlots] = useState<any[]>([]);
  const [scheduleAvailabilityLoading, setScheduleAvailabilityLoading] = useState(false);

  // mentor today-availability preview (Schedule drawer)
  const [mentorTodaySlots, setMentorTodaySlots] = useState<string[] | null>(null);
  const [mentorTodayLoading, setMentorTodayLoading] = useState(false);

  // ── Resolve director ID from cookie ──────────────────────────────────────────
  useEffect(() => {
    const uid = getCookie("userId") as string | undefined;
    const rawUser = getCookie("user");
    let cookieId = "";
    try {
      if (rawUser) {
        const parsed = JSON.parse(rawUser) as {
          _id?: string;
          id?: string;
          firstName?: string;
          lastName?: string;
          email?: string;
        };
        cookieId = String(parsed._id || parsed.id || "").trim();
        setDirectorIdentity({
          firstName: String(parsed.firstName || "").trim(),
          lastName: String(parsed.lastName || "").trim(),
          email: String(parsed.email || "").trim(),
        });
      }
    } catch {
      // Ignore malformed user cookie.
    }
    const resolvedDirectorId = cookieId || String(uid || "").trim();
    if (resolvedDirectorId) setDirectorId(resolvedDirectorId);
  }, []);

  // ── Close action menu on outside click ───────────────────────────────────────
  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;
      if (!target.closest('[data-appointment-menu-root="true"]')) {
        setShowMenu(null);
        setShowHistoryMenu(null);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  // ── Sync tab from URL params ──────────────────────────────────────────────────
  useLayoutEffect(() => {
    const next = tabFromParam(searchParams.get("tab"));
    if (next) setActiveTab(next);
  }, [searchParams]);

  /** After Google OAuth redirects back to the SPA */
  useEffect(() => {
    const linked = searchParams.get("googleCalendar");
    if (linked !== "linked" && linked !== "1") return;
    setToastMessage("Google Calendar connected.");
    setTimeout(() => setToastMessage(null), 4500);
    const next = new URLSearchParams(searchParams.toString());
    next.delete("googleCalendar");
    const q = next.toString();
    router.replace(q ? `${pathname}?${q}` : pathname);
  }, [searchParams, pathname, router]);

  // ── Fetch all appointments ────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await apiGetAppointments({ futureOnly: false });
        const list = unwrapAppointmentsAxiosData(res);
        const sorted = [...list].sort(
          (a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime(),
        );
        if (!cancelled) setAppointments(sorted);
      } catch {
        if (!cancelled) setAppointments([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Fetch pastors ─────────────────────────────────────────────────────────────
  useEffect(() => {
    apiGetAllUsers({ role: "pastor", roleMatch: "mixed", limit: 9999 })
      .then((res) => {
        const list = Array.isArray(res.data?.data?.users) ? res.data.data.users : [];
        setPastors(list);
      })
      .catch(() => setPastors([]));
  }, []);

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

  // ── Fetch mentors ─────────────────────────────────────────────────────────────
  useEffect(() => {
    apiGetAllUsers({ role: "mentor", roleMatch: "mixed", limit: 9999 })
      .then((res) => {
        const list = Array.isArray(res.data?.data?.users) ? res.data.data.users : [];
        setMentors(list);
      })
      .catch(() => setMentors([]));
  }, []);
  useEffect(() => {
  const recipientType = searchParams.get("recipientType");
  const mentorId = searchParams.get("mentorId");

  if (recipientType !== "mentor" || !mentorId || mentors.length === 0) return;

  const matchedMentor = mentors.find(
    (mentor: any) => String(mentor._id || mentor.id) === String(mentorId)
  );

  if (!matchedMentor) return;

  setActiveTab("Schedule");
  setScheduleRecipientType("mentor");
  setSelectedRecipient(matchedMentor);
  setIsDrawerOpen(true);
  setDrawerStep(2);
}, [searchParams, mentors]);

  // ── Fetch available slots for schedule step 2 (CCC availability ∩ Google Calendar busy) ─────────────────
  useEffect(() => {
    if (!meetingDate || !directorId) return;

    let cancelled = false;

    void (async () => {
      setCalendarSlotSyncLoading(true);
      setCalendarSlotSyncError(null);
      setCalendarConnectBanners([]);

      try {
        let formatted: string[] = [];

        if (scheduleRecipientType === "pastor") {
          const normalize = (t: string) => t.replace(/\s+/g, "").toLowerCase();
          const bookedSlots = appointments
            .filter(
              (a) =>
                a.meetingDate.startsWith(meetingDate) &&
                !["cancelled", "canceled", "missed"].includes((a.status || "").toLowerCase()),
            )
            .map((a) => {
              const d = new Date(a.meetingDate);
              return normalize(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
            });
          const daySlots = scheduleMonthlyAvailabilitySlots.filter((s: any) => {
            const ymd = slotDateToYmd(s?.date ?? s?.day ?? s?.calendarDate ?? s?.meetingDate ?? s?.dateString);
            return ymd === meetingDate;
          });
          formatted = daySlots
            .flatMap((s: any) =>
              (s.slots || []).map(
                (slot: any) =>
                  `${slot.startTime ?? "00:00"} ${(slot.startPeriod ?? "AM").toUpperCase()} - ${slot.endTime ?? "00:00"} ${(slot.endPeriod ?? "PM").toUpperCase()}`,
              ),
            )
            .filter((slot: string) => !bookedSlots.includes(normalize(slot.split(" - ")[0])));
        } else if (scheduleRecipientType === "mentor" && (selectedRecipient?._id || selectedRecipient?.id)) {
          const mentorWeeklyId = selectedRecipient._id || selectedRecipient.id;
          const meetingDateObj = new Date(`${meetingDate}T12:00:00`);
          const dayOfWeek = meetingDateObj.getDay();
          const sunday = new Date(meetingDateObj);
          sunday.setDate(meetingDateObj.getDate() - dayOfWeek);
          const apiDate = sunday.toISOString().split("T")[0];

          try {
            const res = await apiGetWeeklyAvailability(mentorWeeklyId, apiDate);
            const raw = res.data?.data ?? res.data;
            const data = Array.isArray(raw) ? raw : [];
            const dayData = data.find((d: any) => {
              if (typeof d.date === "string" && d.date.length >= 10 && d.date.startsWith(meetingDate)) return true;
              const dNum = typeof d.day === "number" ? d.day : Number(d.day);
              return dNum === dayOfWeek;
            });

            if (dayData?.slots?.length) {
              const normalize = (t: string) => t.replace(/\s+/g, "").toLowerCase();
              const bookedSlots = appointments
                .filter(
                  (a) =>
                    a.meetingDate.startsWith(meetingDate) &&
                    !["cancelled", "canceled", "missed"].includes((a.status || "").toLowerCase()),
                )
                .map((a) => {
                  const d = new Date(a.meetingDate);
                  return normalize(d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
                });

              formatted = dayData.slots
                .map(
                  (s: any) =>
                    `${s.startTime ?? "00:00"} ${(s.startPeriod ?? "AM").toUpperCase()} - ${s.endTime ?? "00:00"} ${(s.endPeriod ?? "PM").toUpperCase()}`,
                )
                .filter((slot: string) => !bookedSlots.includes(normalize(slot.split(" - ")[0])));
            }
          } catch (err) {
            console.error("Failed to fetch mentor availability:", err);
          }
        } else if (!cancelled) {
          setAvailableSlots([]);
          setCalendarBusyStripped(0);
          setCalendarSlotSyncSkipped(false);
          setCalendarSlotSyncError(null);
          return;
        }

        const recipientId = String(selectedRecipient?._id || selectedRecipient?.id || "").trim();

        let mergeMentorId = "";
        let mergeParticipantId: string | undefined;
        if (scheduleRecipientType === "pastor") {
          mergeMentorId = String(directorId);
          mergeParticipantId = recipientId || undefined;
        } else if (recipientId) {
          /** Mentor-only picker: host availability is the mentor's document; omit participantUserId (Director Google enforced on POST). */
          mergeMentorId = recipientId;
          mergeParticipantId = undefined;
        }

        const participantUserIds =
          scheduleRecipientType === "mentor" && recipientId
            ? [recipientId]
            : Array.from(new Set([String(directorId), recipientId].filter(Boolean)));

        const gc = await filterSlotLabelsAgainstExternalCalendar({
          meetingDateYmd: meetingDate.slice(0, 10),
          rawSlotLabels: formatted,
          participantUserIds,
          meetingDurationMinutes: 60,
          expandIntoGrid: true,
          availabilityMentorUserId: mergeMentorId || undefined,
          availabilityParticipantUserId: mergeParticipantId,
        });

        if (cancelled) return;
        setCalendarConnectBanners(gc.connectGoogleBanners ?? []);
        setCalendarSlotSyncSkipped(gc.skipped);
        setCalendarBusyStripped(gc.error ? 0 : gc.strippedCount);
        if (gc.error) {
          setCalendarSlotSyncError(gc.error);
          setAvailableSlots([]);
          setSelectedSlot("");
        } else {
          setCalendarSlotSyncError(null);
          setAvailableSlots(gc.slots);
          setSelectedSlot((prev) => (prev && gc.slots.includes(prev) ? prev : ""));
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setAvailableSlots([]);
          setCalendarSlotSyncError(extractApiErrorMessage(err) || "Could not refresh Google Calendar.");
          setSelectedSlot("");
        }
      } finally {
        if (!cancelled) setCalendarSlotSyncLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    meetingDate,
    scheduleRecipientType,
    selectedRecipient,
    appointments,
    scheduleMonthlyAvailabilitySlots,
    directorId,
  ]);

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

  // ── Fetch availability for schedule calendar (mentor: mentor's slots; pastor: director's own slots) ──
  useEffect(() => {
    if (drawerStep !== 2) {
      setScheduleMonthlyAvailabilitySlots([]);
      setScheduleAvailabilityLoading(false);
      return;
    }

    let targetId: string;
    if (scheduleRecipientType === "mentor") {
      if (!selectedRecipient) {
        setScheduleMonthlyAvailabilitySlots([]);
        setScheduleAvailabilityLoading(false);
        return;
      }
      targetId = String(selectedRecipient._id || selectedRecipient.id || "").trim();
    } else {
      // pastor: show director's own available dates/slots
      if (!directorId) return;
      targetId = directorId;
    }

    if (!targetId) return;

    let cancelled = false;
    (async () => {
      try {
        setScheduleAvailabilityLoading(true);
        const res = await axiosInstance.get(`/appointments/availability/${targetId}/month`, {
          params: {
            year: scheduleYear,
            month: scheduleMonth + 1,
            ...(scheduleRecipientType === "pastor" && selectedRecipient
              ? { participantUserId: String(selectedRecipient._id || selectedRecipient.id) }
              : {}),
          },
        });
        const raw = res.data?.data ?? res.data;
        const slots = Array.isArray(raw) ? raw : [];

        if (!cancelled) {
          setScheduleMonthlyAvailabilitySlots(slots);
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
  }, [drawerStep, scheduleRecipientType, selectedRecipient, directorId, scheduleYear, scheduleMonth, scheduleSelectedDate]);

  // ── Fetch selected mentor's availability for today ────────────────────────────
  useEffect(() => {
    if (scheduleRecipientType !== "mentor" || !selectedRecipient) {
      setMentorTodaySlots(null);
      return;
    }
    const mentorId = selectedRecipient._id || selectedRecipient.id;
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay());
    const sundayStr = sunday.toISOString().split("T")[0];

    let cancelled = false;
    setMentorTodayLoading(true);
    setMentorTodaySlots(null);
    apiGetWeeklyAvailability(mentorId, sundayStr)
      .then((res) => {
        if (cancelled) return;
        const data = Array.isArray(res.data?.data) ? res.data.data : [];
        const todayDayOfWeek = today.getDay();
        const dayData = data.find((d: any) => {
          // Match by specific date first, then fall back to day-of-week
          if (typeof d.date === "string" && d.date.startsWith(todayStr)) return true;
          const dNum = typeof d.day === "number" ? d.day : Number(d.day);
          return dNum === todayDayOfWeek;
        });
        if (!dayData?.slots?.length) { setMentorTodaySlots([]); return; }
        setMentorTodaySlots(
          dayData.slots.map((s: any) => `${s.startTime} ${s.startPeriod} – ${s.endTime} ${s.endPeriod}`)
        );
      })
      .catch(() => { if (!cancelled) setMentorTodaySlots([]); })
      .finally(() => { if (!cancelled) setMentorTodayLoading(false); });
    return () => { cancelled = true; };
  }, [selectedRecipient, scheduleRecipientType]);

  // ── Derived calendar values ───────────────────────────────────────────────────
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDay = new Date(year, month, 1).getDay();
  const calendarDays = [...Array(startDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const appointmentDates = appointments.map((appt) => {
    const d = new Date(appt.meetingDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const todayLocalYmd = localYmdToday();

  const selectedDateMyAppointments = useMemo(() => {
    if (!directorId) return [];
    const normalizedDirectorName = normalizeIdentityText(
      `${directorIdentity.firstName} ${directorIdentity.lastName}`.trim(),
    );
    const normalizedDirectorEmail = normalizeIdentityText(directorIdentity.email);
    return appointments
      .filter((a) => {
        if (!appointmentNotCancelled(a)) return false;
        if (new Date(a.meetingDate).toISOString().slice(0, 10) !== selectedAppointmentDate) return false;
        const userPerson = asPerson(a.user) ?? asPerson(a.userId as string | PersonInfo);
        const mentorPerson = asPerson(a.mentor) ?? asPerson(a.mentorId as string | PersonInfo);

        const matchesById =
          appointmentUserIdString(a) === directorId || appointmentMentorIdString(a) === directorId;
        if (matchesById) return true;

        const matchesByEmail =
          !!normalizedDirectorEmail &&
          [userPerson?.email, mentorPerson?.email].some(
            (email) => normalizeIdentityText(email) === normalizedDirectorEmail,
          );
        if (matchesByEmail) return true;

        const nameMatches = (person: PersonInfo | undefined): boolean => {
          if (!person || !normalizedDirectorName) return false;
          const personName = normalizeIdentityText(`${person.firstName || ""} ${person.lastName || ""}`.trim());
          return !!personName && personName === normalizedDirectorName;
        };

        return nameMatches(userPerson) || nameMatches(mentorPerson);
      })
      .sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime());
  }, [appointments, directorId, directorIdentity, selectedAppointmentDate]);

  const selectedDateOtherAppointments = useMemo(() => {
    if (!directorId) return [];
    const myIds = new Set(
      selectedDateMyAppointments.map((a) => appointmentEntityId(a) || `${a.meetingDate}-${appointmentUserIdString(a)}-${appointmentMentorIdString(a)}`),
    );
    return appointments
      .filter((a) => {
        if (!appointmentNotCancelled(a)) return false;
        if (new Date(a.meetingDate).toISOString().slice(0, 10) !== selectedAppointmentDate) return false;
        const apptId = appointmentEntityId(a) || `${a.meetingDate}-${appointmentUserIdString(a)}-${appointmentMentorIdString(a)}`;
        return !myIds.has(apptId);
      })
      .sort((a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime());
  }, [appointments, directorId, selectedAppointmentDate, selectedDateMyAppointments]);

  const myAppointmentHistory = useMemo(() => {
    if (!directorId) return [];
    const nowMs = Date.now();
    return appointments
      .filter((a) => {
        const st = (a.status || "").toLowerCase();
        if (appointmentUserIdString(a) !== directorId) return false;
        if (st === "missed") return true;
        const t = new Date(a.meetingDate).getTime();
        return !Number.isNaN(t) && t < nowMs;
      })
      .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());
  }, [appointments, directorId]);

  const hostedAppointmentHistory = useMemo(() => {
    if (!directorId) return [];
    const nowMs = Date.now();
    return appointments
      .filter((a) => {
        const uid = appointmentUserIdString(a);
        const mid = appointmentMentorIdString(a);
        const st = (a.status || "").toLowerCase();
        if (mid !== directorId || uid === directorId) return false;
        if (st === "missed") return true;
        const t = new Date(a.meetingDate).getTime();
        return !Number.isNaN(t) && t < nowMs;
      })
      .sort((a, b) => new Date(b.meetingDate).getTime() - new Date(a.meetingDate).getTime());
  }, [appointments, directorId]);

  const historyPageSize = 10;
  const totalMyHistoryPages = Math.max(1, Math.ceil(myAppointmentHistory.length / historyPageSize));
  const totalHostedHistoryPages = Math.max(1, Math.ceil(hostedAppointmentHistory.length / historyPageSize));
  const pagedMyHistory = myAppointmentHistory.slice(
    (historyMyPage - 1) * historyPageSize,
    historyMyPage * historyPageSize,
  );
  const pagedHostedHistory = hostedAppointmentHistory.slice(
    (historyHostedPage - 1) * historyPageSize,
    historyHostedPage * historyPageSize,
  );

  useEffect(() => {
    setHistoryMyPage((prev) => Math.min(prev, totalMyHistoryPages));
  }, [totalMyHistoryPages]);

  useEffect(() => {
    setHistoryHostedPage((prev) => Math.min(prev, totalHostedHistoryPages));
  }, [totalHostedHistoryPages]);

  // ── Fetch availability for reschedule calendar (mentor only) ───────────────────
  useEffect(() => {
    if (!isRescheduleModalOpen || !rescheduleTarget) return;

    const mentorId =
      rescheduleTarget.mentor?._id ||
      (typeof (rescheduleTarget as any).mentorId === "string"
        ? (rescheduleTarget as any).mentorId
        : (rescheduleTarget as any).mentorId?._id) ||
      "";
    if (!mentorId) return;

    const fetchAvailability = async () => {
      setRescheduleAvailabilityLoading(true);
      try {
        const response = await axiosInstance.get(
          `/appointments/availability/${mentorId}/month`,
          { params: { year: rescheduleYear, month: rescheduleMonth + 1 } }
        );
        if (response.data?.data) {
          const slots = response.data.data;
          setRescheduleMonthlyAvailabilitySlots(slots);
        }
      } catch (e) {
        console.error("Failed to fetch reschedule availability:", e);
        setRescheduleMonthlyAvailabilitySlots([]);
      } finally {
        setRescheduleAvailabilityLoading(false);
      }
    };

    fetchAvailability();
  }, [isRescheduleModalOpen, rescheduleTarget, rescheduleYear, rescheduleMonth, directorId]);

  // ── Create appointment (Schedule tab) ────────────────────────────────────────
  const handleCreateAppointment = async () => {
    if (!directorId) return;
    if (!selectedRecipient?._id && !selectedRecipient?.id) {
      showToast(`Please select a ${scheduleRecipientType}`);
      return;
    }
    if (!meetingDate || !selectedSlot) {
      showToast("Please select date and time");
      return;
    }
    const scheduledIso = parseSlotStartToIso(meetingDate, selectedSlot.replace(/\u2013/g, "-"));
    if (meetingDate === new Date().toISOString().split("T")[0] && new Date(scheduledIso).getTime() <= Date.now()) {
      showToast("For today, please choose a time after the current time.");
      return;
    }
    if (isScheduling) return;

    const proposedMs = new Date(scheduledIso).getTime();

    try {
      const upcoming = await apiGetAppointments({
        mentorId: directorId,
        futureOnly: true,
        status: "scheduled",
      });
      const busyAppointments = unwrapAppointmentsAxiosData(upcoming);
      const hasOverlap = busyAppointments.some((a) => {
        const t = new Date(String(a.meetingDate ?? "")).getTime();
        return !Number.isNaN(t) && Math.abs(t - proposedMs) < 60 * 60 * 1000;
      });
      if (hasOverlap) {
        showToast("This time slot overlaps with an existing appointment.");
        return;
      }
    } catch (_) {
      // continue to Google recheck — server may still enforce conflicts
    }

    const recipientIdCal = String(selectedRecipient._id || selectedRecipient.id || "").trim();
    let mergeMentorRecheck = "";
    let mergeParticipantRecheck: string | undefined;
    if (scheduleRecipientType === "pastor") {
      mergeMentorRecheck = String(directorId);
      mergeParticipantRecheck = recipientIdCal || undefined;
    } else {
      mergeMentorRecheck = recipientIdCal;
      mergeParticipantRecheck = undefined;
    }

    const participantUserIdsRecheck =
      scheduleRecipientType === "mentor" ? [recipientIdCal] : Array.from(new Set([String(directorId), recipientIdCal]));

    const gcRecheck = await filterSlotLabelsAgainstExternalCalendar({
      meetingDateYmd: meetingDate.slice(0, 10),
      rawSlotLabels: availableSlots,
      participantUserIds: participantUserIdsRecheck,
      meetingDurationMinutes: 60,
      expandIntoGrid: true,
      availabilityMentorUserId: mergeMentorRecheck || undefined,
      availabilityParticipantUserId: mergeParticipantRecheck,
    });
    if (!gcRecheck.skipped) {
      if (gcRecheck.error) {
        showToast(gcRecheck.error, 5500);
        return;
      }
      if (!gcRecheck.slots.includes(selectedSlot)) {
        showToast(
          "That time conflicts with someone's Google Calendar. Pick another slot and try again.",
          5500,
        );
        return;
      }
    }

    let successToastMs = 3500;
    setIsScheduling(true);
    try {
      const recipientLabel =
        `${selectedRecipient.firstName ?? ""} ${selectedRecipient.lastName ?? ""}`.trim() ||
        scheduleRecipientType;
      const res = await apiCreateAppointment({
        userId: selectedRecipient._id || selectedRecipient.id,
        mentorId: directorId,
        meetingDate: scheduledIso,
        platform: uiMeetingModeToPlatform(selectedPlatform),
        notes: "Scheduled by director",
        googleCalendarSync: true,
        googleCalendarTitle: `Meeting · director & ${recipientLabel}`,
        googleCalendarDescription: `Scheduled in CCC · Platform: ${selectedPlatform}`,
        initiatorRole: "director",
      });

      const gHint = googleCalendarSuccessHintFromCreateResponse(res?.data);
      const outcome = extractGoogleCalendarCreateOutcome(res?.data);
      if (gHint) successToastMs = 7000;
      if (outcome.warnings.length) successToastMs = Math.max(successToastMs, 9000);

      const refresh = await apiGetAppointments({ futureOnly: false });
      setAppointments(
        unwrapAppointmentsAxiosData(refresh).sort(
          (a: any, b: any) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime(),
        ),
      );
      setIsDrawerOpen(false);
      setDrawerStep(1);
      setSelectedRecipient(null);
      setMeetingDate("");
      setSelectedSlot("");
      setAvailabilityRefreshKey((k) => k + 1);
      showToast(
        (gHint ? `Meeting scheduled successfully. ${gHint}` : "Meeting scheduled successfully") +
          (outcome.warnings.length > 0 ? ` Note: ${outcome.warnings.join(" · ")}` : ""),
        successToastMs,
      );
    } catch (e) {
      showToast(extractApiErrorMessage(e) || "Failed to schedule meeting");
    } finally {
      setIsScheduling(false);
    }
  };

  // ── Cancel appointment ────────────────────────────────────────────────────────
  const handleCancelAppointment = async (appt: AppointmentResponse) => {
    const id = appointmentEntityId(appt);
    if (!id) return;

    try {
      await apiCancelAppointment(id);
    } catch (e) {
      console.error(e);
    }

    try {
      const res = await apiGetAppointments({ futureOnly: false });
      const freshList = unwrapAppointmentsAxiosData(res);
      setAppointments(freshList);
      setShowMenu(null);
      const stillActive = freshList.find(
        (a: AppointmentResponse) =>
          appointmentEntityId(a) === id &&
          !["cancelled", "canceled"].includes((a.status || "").toLowerCase()),
      );
      showToast(stillActive ? "Failed to cancel appointment" : "Appointment cancelled");
    } catch (_) {
      showToast("Failed to cancel appointment");
    }
  };

  const handleMarkAppointmentMissedDirector = async (appt: AppointmentResponse) => {
    const id = appointmentEntityId(appt);
    if (!id) return;

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
      showToast(extractApiErrorMessage(e) || "Failed to mark appointment as missed");
      return;
    }

    try {
      const res = await apiGetAppointments({ futureOnly: false });
      const sorted = unwrapAppointmentsAxiosData(res).sort(
        (a, b) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime(),
      );
      setAppointments(sorted);
      showToast("Appointment marked as missed");
    } catch (_) {
      showToast("Marked as missed but list could not be refreshed — please reload.");
    }
  };

  const openRescheduleModal = (appt: AppointmentResponse) => {
    setRescheduleTarget(appt);
    setRescheduleDateTime(toLocalDateTimeInput(appt.meetingDate));
    setReschedulePlatform(String(appt.platform || "zoom").toLowerCase());
    setShowMenu(null);
    // Reset reschedule calendar states
    const today = new Date();
    setRescheduleMonth(today.getMonth());
    setRescheduleYear(today.getFullYear());
    setRescheduleSelectedDate(today.getDate());
    setRescheduleSelectedSlot("");
    setRescheduleMonthlyAvailabilitySlots([]);
    setIsRescheduleModalOpen(true);
  };

  // ── Reschedule calendar navigation ───────────────────────────────────────────
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

  const handleRescheduleAppointment = async () => {
    const appt = rescheduleTarget;
    const id = appt ? appointmentEntityId(appt) : "";
    if (!id) return;

    // Determine if recipient is a mentor (by presence of a mentor ID)
    const isMentorRecipient = !!(
      appt?.mentor?._id ||
      (typeof (appt as any).mentorId === "string" ? (appt as any).mentorId : (appt as any).mentorId?._id)
    );

    // Validate based on recipient type
    if (isMentorRecipient) {
      if (!rescheduleSelectedSlot) {
        showToast("Please select an available time slot");
        return;
      }
    } else {
      if (!rescheduleDateTime) {
        showToast("Please select date and time");
        return;
      }
    }

    if (isRescheduling) return;
    setIsRescheduling(true);

    try {
      const newDate = isMentorRecipient
        ? rescheduleSelectedSlot
        : new Date(rescheduleDateTime).toISOString();

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
      const refresh = await apiGetAppointments({ futureOnly: false });
      const list = unwrapAppointmentsAxiosData(refresh).sort(
        (a: any, b: any) => new Date(a.meetingDate).getTime() - new Date(b.meetingDate).getTime(),
      );
      setAppointments(list);
      setIsRescheduleModalOpen(false);
      setRescheduleTarget(null);
      showToast("Appointment rescheduled successfully");
    } catch (e) {
      showToast(extractApiErrorMessage(e) || "Failed to reschedule appointment");
    } finally {
      setIsRescheduling(false);
    }
  };

  const showToast = (msg: string, dismissMs = 3500) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), dismissMs);
  };

  const renderHistoryAppointmentCard = (appt: AppointmentResponse, index: number, listPage: number, keyPrefix: string) => {
    const md = new Date(appt.meetingDate);
    const apptKey = appointmentEntityId(appt) || `${keyPrefix}-${listPage}-${index}`;
    const mentor = appt.mentor ?? (typeof appt.mentorId === "object" ? appt.mentorId : undefined);
    const mentee = appt.user ?? (typeof appt.userId === "object" ? appt.userId : undefined);
    const mentorName = labelPerson(mentor, "Unknown");
    const menteeName = labelPerson(mentee, "Unknown");
    const mentorRole = mentor?.role ? mentor.role.charAt(0).toUpperCase() + mentor.role.slice(1).toLowerCase() : "Mentor";
    const menteeRole = mentee?.role ? mentee.role.charAt(0).toUpperCase() + mentee.role.slice(1).toLowerCase() : "Pastor";
    const mentorId = typeof appt.mentorId === "string" ? appt.mentorId : appt.mentorId?._id ?? appt.mentor?._id;
    const menteeId = typeof appt.userId === "string" ? appt.userId : appt.userId?._id ?? appt.user?._id;
    const missedHist = isAppointmentMissed(appt);

    return (
      <div
        className={`${directorGlassCard} relative overflow-hidden border border-white/15 bg-[linear-gradient(180deg,rgba(10,53,88,0.9)_0%,rgba(6,41,70,0.92)_100%)] shadow-[0_16px_40px_rgba(0,0,0,0.25)] flex flex-col items-stretch gap-0 p-0 sm:flex-row sm:items-center ${showHistoryMenu === apptKey ? "z-[60]" : ""} ${missedHist ? "ring-1 ring-amber-500/25" : ""}`}
        style={showHistoryMenu === apptKey ? { overflow: "visible" } : undefined}
      >
        <div className="flex w-full shrink-0 items-center justify-center border-b border-white/10 bg-white/[0.03] py-5 sm:w-[132px] sm:border-b-0 sm:border-r sm:py-7">
          <div className="flex h-[82px] w-[82px] items-center justify-center rounded-2xl border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 shadow-inner">
            <Image src={getPlatformIcon(appt.platform)} alt={appt.platform || "Meeting platform"} className="h-10 w-10" />
          </div>
        </div>
        <div className="relative min-w-0 flex-1 px-4 py-4 sm:px-5">
          <div className="absolute right-4 top-4 z-10 sm:right-5">
            <div className="relative" data-appointment-menu-root="true">
              <button
                type="button"
                onClick={() => setShowHistoryMenu(showHistoryMenu === apptKey ? null : apptKey)}
                className="rounded-lg px-3 py-1 text-[#8ec5eb] transition hover:bg-white/10 hover:text-white"
                aria-label="Appointment actions"
              >
                <i className="fa-solid fa-ellipsis-vertical" />
              </button>
              {showHistoryMenu === apptKey && (
                <div className="absolute right-0 top-9 z-[100] w-[200px] overflow-hidden rounded-xl border border-white/20 bg-[#0a3558]/95 py-1 text-sm text-[#d9ebf8] shadow-xl backdrop-blur-md">
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                    onClick={() => {
                      router.push(`/director/schedule/${encodeURIComponent(apptKey)}`);
                      setShowHistoryMenu(null);
                    }}
                  >
                    <i className="fa-regular fa-eye mr-2 text-[#8ec5eb]" />
                    View Details
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <img
              src={
                String((mentor as any)?.profilePicture || "").trim() ||
                getInitialsAvatar((mentor as any)?.firstName, (mentor as any)?.lastName, "Mentor")
              }
              alt={mentorName}
              className="h-9 w-9 rounded-full border border-white/20 object-cover"
            />
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#8ec5eb]/85">Mentor</p>
              <h4 className="pr-10 text-sm font-semibold text-white">
                {mentorId ? (
                  <Link href={`/director/mentors/profile/${encodeURIComponent(String(mentorId))}`} className="hover:text-[#8ec5eb]">
                    {mentorName}
                  </Link>
                ) : (
                  mentorName
                )}
              </h4>
              <p className="text-[12px] text-[#cde2f2]/90">{mentorRole}</p>
            </div>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <img
              src={
                String((mentee as any)?.profilePicture || "").trim() ||
                getInitialsAvatar((mentee as any)?.firstName, (mentee as any)?.lastName, "Pastor")
              }
              alt={menteeName}
              className="h-9 w-9 rounded-full border border-white/20 object-cover"
            />
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#8ec5eb]/85">Pastor</p>
              <h4 className="text-sm font-semibold text-white">
                {menteeId ? (
                  <Link href={`/director/mentees/profile/${encodeURIComponent(String(menteeId))}`} className="hover:text-[#8ec5eb]">
                    {menteeName}
                  </Link>
                ) : (
                  menteeName
                )}
              </h4>
              <p className="text-[12px] text-[#cde2f2]/90">{menteeRole}</p>
            </div>
          </div>
          <div className="mb-1 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 px-3 py-1 text-[12px] text-[#e7f4ff]">
              <i className="fa-regular fa-calendar text-[#8ec5eb]" />
              {md.toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 px-3 py-1 text-[12px] text-[#e7f4ff]">
              <i className="fa-regular fa-clock text-[#8ec5eb]" />
              {md.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
            </span>
            {missedHist ? (
              <span className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-600/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-100">
                Missed
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  const renderActiveAppointmentCard = (appt: AppointmentResponse) => {
    const apptKey = appointmentEntityId(appt) || "";
    const md = new Date(appt.meetingDate);
    const missed = isAppointmentMissed(appt);
    const sched = isAppointmentScheduled(appt);
    const mentor = appt.mentor ?? (typeof appt.mentorId === "object" ? appt.mentorId : undefined);
    const mentee = appt.user ?? (typeof appt.userId === "object" ? appt.userId : undefined);
    const mentorName = labelPerson(mentor, "Unknown");
    const menteeName = labelPerson(mentee, "Unknown");
    const mentorRole = mentor?.role ? mentor.role.charAt(0).toUpperCase() + mentor.role.slice(1).toLowerCase() : "Mentor";
    const menteeRole = mentee?.role ? mentee.role.charAt(0).toUpperCase() + mentee.role.slice(1).toLowerCase() : "Pastor";
    const mentorId = typeof appt.mentorId === "string" ? appt.mentorId : appt.mentorId?._id ?? appt.mentor?._id;
    const menteeId = typeof appt.userId === "string" ? appt.userId : appt.userId?._id ?? appt.user?._id;

    return (
      <div
        className={`${directorGlassCard} relative overflow-hidden border border-white/15 bg-[linear-gradient(180deg,rgba(10,53,88,0.9)_0%,rgba(6,41,70,0.92)_100%)] shadow-[0_16px_40px_rgba(0,0,0,0.25)] flex flex-col items-stretch gap-0 p-0 sm:flex-row sm:items-center ${showMenu === apptKey ? "z-[60]" : ""} ${missed ? "ring-1 ring-amber-500/25" : ""}`}
        style={showMenu === apptKey ? { overflow: "visible" } : undefined}
      >
        <div className="flex w-full shrink-0 items-center justify-center border-b border-white/10 bg-white/[0.03] py-5 sm:w-[132px] sm:border-b-0 sm:border-r sm:py-7">
          <div className="flex h-[82px] w-[82px] items-center justify-center rounded-2xl border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 shadow-inner">
            <Image src={getPlatformIcon(appt.platform)} alt={appt.platform || "Meeting platform"} className="h-10 w-10" />
          </div>
        </div>
        <div className="relative min-w-0 flex-1 px-4 py-4 sm:px-5">
          <div className="absolute right-4 top-4 z-10 sm:right-5">
            <div className="relative" data-appointment-menu-root="true">
              <button
                type="button"
                onClick={() => setShowMenu(showMenu === apptKey ? null : apptKey)}
                className="rounded-lg px-3 py-1 text-[#8ec5eb] transition hover:bg-white/10 hover:text-white"
                aria-label="Appointment actions"
              >
                <i className="fa-solid fa-ellipsis-vertical" />
              </button>
              {showMenu === apptKey && (
                <div className="absolute right-0 top-9 z-[100] w-[220px] overflow-hidden rounded-xl border border-white/20 bg-[#0a3558]/95 py-1 text-sm text-[#d9ebf8] shadow-xl backdrop-blur-md">
                  <button
                    type="button"
                    className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                    onClick={() => {
                      router.push(`/director/schedule/${encodeURIComponent(apptKey)}`);
                      setShowMenu(null);
                    }}
                  >
                    <i className="fa-regular fa-eye mr-2 text-[#8ec5eb]" />
                    View Details
                  </button>
                  {sched ? (
                    <button
                      type="button"
                      className="w-full px-4 py-2.5 text-left transition hover:bg-white/10"
                      onClick={() => void handleMarkAppointmentMissedDirector(appt)}
                    >
                      <i className="fa-regular fa-user-clock mr-2 text-amber-200" />
                      Mark as missed
                    </button>
                  ) : null}
                  {sched ? (
                  <button type="button" className="w-full px-4 py-2.5 text-left transition hover:bg-white/10" onClick={() => openRescheduleModal(appt)}>
                    <i className="fa-regular fa-calendar mr-2 text-[#8ec5eb]" />
                    Reschedule meeting
                  </button>
                  ) : null}
                  {sched ? (
                  <button type="button" className="w-full px-4 py-2.5 text-left transition hover:bg-white/10" onClick={() => handleCancelAppointment(appt)}>
                    <i className="fa-regular fa-circle-xmark mr-2 text-red-300" />
                    Cancel meeting
                  </button>
                  ) : null}
                </div>
              )}
            </div>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <img
              src={
                String((mentor as any)?.profilePicture || "").trim() ||
                getInitialsAvatar((mentor as any)?.firstName, (mentor as any)?.lastName, "Mentor")
              }
              alt={mentorName}
              className="h-9 w-9 rounded-full border border-white/20 object-cover"
            />
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#8ec5eb]/85">Mentor</p>
              <h4 className="pr-10 text-sm font-semibold text-white">
                {mentorId ? (
                  <Link href={`/director/mentors/profile/${encodeURIComponent(String(mentorId))}`} className="hover:text-[#8ec5eb]">
                    {mentorName}
                  </Link>
                ) : (
                  mentorName
                )}
              </h4>
              <p className="text-[12px] text-[#cde2f2]/90">{mentorRole}</p>
            </div>
          </div>
          <div className="mb-3 flex items-center gap-3">
            <img
              src={
                String((mentee as any)?.profilePicture || "").trim() ||
                getInitialsAvatar((mentee as any)?.firstName, (mentee as any)?.lastName, "Pastor")
              }
              alt={menteeName}
              className="h-9 w-9 rounded-full border border-white/20 object-cover"
            />
            <div>
              <p className="text-[11px] uppercase tracking-wide text-[#8ec5eb]/85">Pastor</p>
              <h4 className="text-sm font-semibold text-white">
                {menteeId ? (
                  <Link href={`/director/mentees/profile/${encodeURIComponent(String(menteeId))}`} className="hover:text-[#8ec5eb]">
                    {menteeName}
                  </Link>
                ) : (
                  menteeName
                )}
              </h4>
              <p className="text-[12px] text-[#cde2f2]/90">{menteeRole}</p>
            </div>
          </div>
          <div className="mb-1 flex flex-wrap gap-2">
            <span className="flex items-center gap-1.5 rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 px-3 py-1 text-[12px] text-[#e7f4ff]">
              <i className="fa-regular fa-calendar text-[#8ec5eb]" />
              {md.toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 px-3 py-1 text-[12px] text-[#e7f4ff]">
              <i className="fa-regular fa-clock text-[#8ec5eb]" />
              {md.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
            </span>
            {missed ? (
              <span className="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-600/20 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-100">
                Missed
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  // ── Filtered recipients for schedule drawer ───────────────────────────────────
  const scheduleRecipients = (scheduleRecipientType === "pastor" ? pastors : mentors).filter((p: any) => {
    if (!recipientSearch.trim()) return true;
    const q = recipientSearch.toLowerCase();
    return `${p.firstName ?? ""} ${p.lastName ?? ""} ${p.email ?? ""}`.toLowerCase().includes(q);
  });

  // ── Glass select style (director tokens) ─────────────────────────────────────
  const directorSelectDark =
    "w-full rounded-lg border border-white/15 bg-[#062946] px-3 py-2 text-sm text-white outline-none focus:border-[#8ec5eb]/50 focus:ring-1 focus:ring-[#8ec5eb]/30 [&>option]:bg-[#062946] [&>option]:text-white";

  const directorDateInput =
    "w-full rounded-lg border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white outline-none focus:border-[#8ec5eb]/50 focus:ring-1 focus:ring-[#8ec5eb]/30 [color-scheme:dark]";

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Schedule"
        subtitle="Manage your appointments, set availability, and schedule meetings."
        image={ProgressBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Schedule" },
        ]}
      />

      <section className="relative flex-1 px-4 pb-20 pt-8 md:px-4 lg:px-5">
        <div className={directorPageContainer}>

          {/* ── Tab bar ── */}
          <DirectorFilterSection className="!p-4 sm:!p-5">
            <div
              className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-1"
              role="tablist"
            >
              {(["Appointments", "Availability", "Schedule", "Appointment History"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setShowMenu(null);
                    setShowHistoryMenu(null);
                    if (tab === "Appointment History") {
                      setHistoryMyPage(1);
                      setHistoryHostedPage(1);
                    }
                    if (tab === "Schedule") { setIsDrawerOpen(true); setDrawerStep(1); }
                    else setIsDrawerOpen(false);
                  }}
                  className={`relative h-8 rounded-md px-5 text-sm font-semibold transition-all ${activeTab === tab
                    ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                    : "bg-transparent text-white/70 hover:text-white"
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </DirectorFilterSection>

          {/* ── Loading spinner ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className={directorSpinner} />
              <p className="text-sm text-white/60">Loading…</p>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              APPOINTMENT HISTORY TAB
          ══════════════════════════════════════════════ */}
          {!loading && activeTab === "Appointment History" && (
            <div className="flex flex-col gap-10">
              <div>
                <h3 className="text-[15px] font-semibold text-white">
                  My appointment history — {myAppointmentHistory.length} meeting{myAppointmentHistory.length === 1 ? "" : "s"}
                </h3>
                <p className="mt-1 text-xs text-[#cde2f2]/80">Past meetings where you were the attendee (for example, sessions with your mentor).</p>
                {myAppointmentHistory.length === 0 ? (
                  <div className={`${directorGlassCard} mt-3 flex items-center justify-center p-8`}>
                    <p className="text-sm text-white/60">No past meetings in this category yet.</p>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {pagedMyHistory.map((appt, index) => (
                      <Fragment key={appointmentEntityId(appt) || `my-${historyMyPage}-${index}`}>
                        {renderHistoryAppointmentCard(appt, index, historyMyPage, "my")}
                      </Fragment>
                    ))}
                  </div>
                )}
                {myAppointmentHistory.length > 0 && (
                  <div className="mt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      disabled={historyMyPage === 1}
                      onClick={() => setHistoryMyPage((p) => Math.max(1, p - 1))}
                      className={`${directorBtnSecondary} px-3 py-1.5 text-xs ${historyMyPage === 1 ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      Previous
                    </button>
                    <p className="text-xs text-[#cde2f2]">
                      Page {historyMyPage} of {totalMyHistoryPages}
                    </p>
                    <button
                      type="button"
                      disabled={historyMyPage >= totalMyHistoryPages}
                      onClick={() => setHistoryMyPage((p) => Math.min(totalMyHistoryPages, p + 1))}
                      className={`${directorBtnSecondary} px-3 py-1.5 text-xs ${historyMyPage >= totalMyHistoryPages ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-8">
                <h3 className="text-[15px] font-semibold text-white">
                  Pastor &amp; mentor meetings you hosted — {hostedAppointmentHistory.length} meeting
                  {hostedAppointmentHistory.length === 1 ? "" : "s"}
                </h3>
                <p className="mt-1 text-xs text-[#cde2f2]/80">Past meetings where you were the host (mentor) for a pastor or mentor.</p>
                {hostedAppointmentHistory.length === 0 ? (
                  <div className={`${directorGlassCard} mt-3 flex items-center justify-center p-8`}>
                    <p className="text-sm text-white/60">No past hosted meetings yet.</p>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-1 gap-5 xl:grid-cols-2">
                    {pagedHostedHistory.map((appt, index) => (
                      <Fragment key={appointmentEntityId(appt) || `hosted-${historyHostedPage}-${index}`}>
                        {renderHistoryAppointmentCard(appt, index, historyHostedPage, "hosted")}
                      </Fragment>
                    ))}
                  </div>
                )}
                {hostedAppointmentHistory.length > 0 && (
                  <div className="mt-4 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      disabled={historyHostedPage === 1}
                      onClick={() => setHistoryHostedPage((p) => Math.max(1, p - 1))}
                      className={`${directorBtnSecondary} px-3 py-1.5 text-xs ${historyHostedPage === 1 ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      Previous
                    </button>
                    <p className="text-xs text-[#cde2f2]">
                      Page {historyHostedPage} of {totalHostedHistoryPages}
                    </p>
                    <button
                      type="button"
                      disabled={historyHostedPage >= totalHostedHistoryPages}
                      onClick={() => setHistoryHostedPage((p) => Math.min(totalHostedHistoryPages, p + 1))}
                      className={`${directorBtnSecondary} px-3 py-1.5 text-xs ${historyHostedPage >= totalHostedHistoryPages ? "cursor-not-allowed opacity-60" : ""}`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════
              APPOINTMENTS TAB
          ══════════════════════════════════════════════ */}
          {!loading && activeTab === "Appointments" && (
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-12">

              {/* Left: Monthly calendar */}
              <div className={`${directorGlassCard} p-5 sm:p-6`}>
                <h3 className="mb-4 flex items-center gap-2 text-[15px] font-medium text-white">
                  <i className="fa-regular fa-calendar text-[#8ec5eb]" />
                  Monthly meeting calendar
                </h3>
                <div className="rounded-xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.85)_0%,rgba(10,53,88,0.92)_100%)] p-5 text-center shadow-inner">
                  <div className="mb-4 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
                      className="rounded-lg px-2 py-1 text-white/90 transition hover:bg-white/10"
                      aria-label="Previous month"
                    >◀</button>
                    <p className="text-sm font-medium text-white/90">
                      {currentDate.toLocaleString("default", { month: "long", year: "numeric" })}
                    </p>
                    <button
                      type="button"
                      onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                      className="rounded-lg px-2 py-1 text-white/90 transition hover:bg-white/10"
                      aria-label="Next month"
                    >▶</button>
                  </div>
                  <div className="mb-2 grid grid-cols-7 gap-2 text-[13px]">
                    {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                      <div key={`${d}-${i}`} className="font-medium text-[#cde2f2]/80">{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2 text-[13px]">
                    {calendarDays.map((day, index) => {
                      if (!day) return <div key={index} />;
                      const d = new Date(year, month, day);
                      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                      const hasAppointment = appointmentDates.includes(dateStr);
                      const isT =
                        day === new Date().getDate() &&
                        month === new Date().getMonth() &&
                        year === new Date().getFullYear();
                      const isSelected = selectedAppointmentDate === dateStr;
                      const isPast = isPastDate(dateStr);
                      return (
                        <div
                          key={index}
                          onClick={() => !isPast && setSelectedAppointmentDate(dateStr)}
                          className={`rounded-md py-1 transition ${isPast ? "opacity-40 cursor-not-allowed pointer-events-none" : "cursor-pointer"} ${isSelected || isT
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

              {/* Right: split lists — today, my upcoming, hosted upcoming, selected other day */}
              <div className="flex max-h-[calc(100vh-220px)] flex-col gap-8 overflow-y-auto pr-1">
                <section>
                  <h3 className="mb-2 text-[15px] font-semibold text-white">
                    {selectedAppointmentDate === todayLocalYmd
                      ? "Today"
                      : new Date(`${selectedAppointmentDate}T12:00:00`).toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                  </h3>
                  <div className="mb-3 inline-flex rounded-xl border border-white/15 bg-white/5 p-1">
                    <button
                      type="button"
                      onClick={() => setSelectedDateView("my")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${selectedDateView === "my"
                        ? "bg-[#8ec5eb]/30 text-white"
                        : "text-[#cde2f2]/85 hover:bg-white/10"
                        }`}
                    >
                      My Appointments
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDateView("other")}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${selectedDateView === "other"
                        ? "bg-[#8ec5eb]/30 text-white"
                        : "text-[#cde2f2]/85 hover:bg-white/10"
                        }`}
                    >
                      Other Appointments
                    </button>
                  </div>
                  <div className="flex flex-col gap-4">
                    {(selectedDateView === "my" ? selectedDateMyAppointments : selectedDateOtherAppointments).length === 0 ? (
                      <div className={`${directorGlassCard} flex flex-col items-center justify-center gap-3 p-6 text-center`}>
                        <p className="text-base font-medium text-white/70">
                          {selectedDateView === "my"
                            ? "No meetings scheduled for you on this date."
                            : "No other meetings scheduled on this date."}
                        </p>
                        {selectedDateView === "my" && (
                          <p className="text-sm leading-relaxed text-[#cde2f2]/90">
                            Tip: Use the Schedule tab to book a meeting, and update your Availability settings so others can reserve time slots.
                          </p>
                        )}
                      </div>
                    ) : (
                      (selectedDateView === "my" ? selectedDateMyAppointments : selectedDateOtherAppointments).map((appt) => (
                        <Fragment key={appointmentEntityId(appt) || `${selectedDateView}-selected-date-${appt.meetingDate}`}>
                          {renderActiveAppointmentCard(appt)}
                        </Fragment>
                      ))
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {!loading && directorId && activeTab === "Availability" && (
            <MentorAvailabilityRecurringWorkspace
              mentorId={directorId}
              onToast={(message, kind) => {
                if (message) {
                  setToastMessage(message);
                  const ms = kind === "err" ? 5200 : 3800;
                  setTimeout(() => setToastMessage(null), ms);
                }
              }}
              onAvailabilitySaved={() => setAvailabilityRefreshKey((k) => k + 1)}
            />
          )}

          {/* ══════════════════════════════════════════════
              SCHEDULE TAB — empty state (drawer closed)
          ══════════════════════════════════════════════ */}
          {!loading && activeTab === "Schedule" && !isDrawerOpen && (
            <div className={`${directorGlassCard} flex flex-col items-center justify-center gap-4 py-16`}>
              <i className="fa-regular fa-calendar-plus text-4xl text-[#8ec5eb]" />
              <p className="text-sm text-white/70">
                Open the panel to pick a pastor or mentor and set a time.
              </p>
              <button
                type="button"
                className={directorBtnPrimary}
                onClick={() => { setDrawerStep(1); setIsDrawerOpen(true); }}
              >
                New meeting
              </button>
            </div>
          )}

        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SCHEDULE DRAWER (slide-over)
      ══════════════════════════════════════════════ */}
      {activeTab === "Schedule" && isDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setIsDrawerOpen(false)}
            aria-hidden
          />
          <div className="fixed right-0 top-0 z-50 h-full w-full border-l border-white/15 bg-[#041f35] text-white shadow-2xl sm:w-[480px] sm:max-w-[480px]">

            {/* Step 1: Pick recipient */}
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

                {/* Recipient type toggle */}
                <div className="mb-4 flex gap-2">
                  {(["pastor", "mentor"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setScheduleRecipientType(type); setSelectedRecipient(null); }}
                      className={`rounded-lg px-4 py-2 text-sm font-medium capitalize transition ${scheduleRecipientType === type
                        ? "bg-white/15 text-white ring-1 ring-[#8ec5eb]/40"
                        : "border border-white/20 bg-white/5 text-[#cde2f2] hover:bg-white/10"
                        }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Search by name…"
                  value={recipientSearch}
                  onChange={(e) => setRecipientSearch(e.target.value)}
                  className="mb-4 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-[#cde2f2] outline-none focus:border-[#8ec5eb]/50 focus:ring-2 focus:ring-[#8ec5eb]/30"
                />

                <div className="flex max-h-[min(380px,50vh)] flex-col gap-3 overflow-y-auto pr-1">
                  {scheduleRecipients.length === 0 && (
                    <p className="px-2 py-4 text-sm text-white/60">No {scheduleRecipientType}s found.</p>
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
                            unoptimized={person.profilePicture ? isRemoteImageSrc(person.profilePicture) : false}
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
                            <span className="text-[11px] capitalize text-[#8ec5eb]/80">
                              {person.role || scheduleRecipientType}
                            </span>
                          </div>
                        </div>
                        <input type="radio" checked={isSelected} readOnly className="accent-[#8ec5eb]" aria-hidden />
                      </button>
                    );
                  })}
                </div>

                {/* Today's availability preview for selected mentor */}
                {scheduleRecipientType === "mentor" && selectedRecipient && (
                  <div className="mt-4 shrink-0 rounded-xl border border-white/15 bg-white/[0.04] p-4">
                    <p className="mb-2 text-xs font-semibold text-[#cde2f2]">
                      Today&apos;s availability —{" "}
                      {new Date().toLocaleDateString("default", { weekday: "long", month: "short", day: "numeric" })}
                    </p>
                    {mentorTodayLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
                        <span className="text-xs text-white/50">Fetching slots…</span>
                      </div>
                    ) : !mentorTodaySlots || mentorTodaySlots.length === 0 ? (
                      <p className="text-xs text-white/50">No availability set for today.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {mentorTodaySlots.map((slot) => (
                          <span
                            key={slot}
                            className="rounded-lg border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-2.5 py-1 text-xs text-[#d9ebf8]"
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-auto flex justify-end gap-3 border-t border-white/10 pt-6">
                  <button type="button" onClick={() => setIsDrawerOpen(false)} className={directorBtnSecondary}>Cancel</button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!selectedRecipient) { showToast(`Please select a ${scheduleRecipientType} first`); return; }
                      setDrawerStep(2);
                    }}
                    className={directorBtnPrimary}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Pick date / slot / platform */}
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
                  {selectedRecipient && (
                    <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setDrawerStep(1)}
                        className="text-[#8ec5eb] hover:text-white"
                        aria-label="Back"
                      >
                        <i className="fa-solid fa-arrow-left" />
                      </button>
                      <Image
                        src={selectedRecipient.profilePicture || UserProfile}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded-full border border-white/20"
                      />
                      <span className="text-sm font-medium text-white">
                        {selectedRecipient.firstName} {selectedRecipient.lastName}
                      </span>
                      <span className="ml-auto rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[11px] capitalize text-[#cde2f2]">
                        {scheduleRecipientType}
                      </span>
                    </div>
                  )}

                  <div className="mb-5 rounded-xl border border-white/15 bg-white/5 p-4">
                    {scheduleRecipientType === "mentor" ? (
                      <>
                        <p className="mb-3 text-sm text-[#cde2f2]">Mentor Availability</p>
                        <AvailabilityCalendar
                          mentorId={String(selectedRecipient?._id || selectedRecipient?.id || "")}
                          currentMonth={scheduleMonth}
                          currentYear={scheduleYear}
                          selectedDate={scheduleSelectedDate}
                          onDateSelect={setScheduleSelectedDate}
                          onPrevMonth={handleSchedulePrevMonth}
                          onNextMonth={handleScheduleNextMonth}
                          availabilitySlots={scheduleMonthlyAvailabilitySlots}
                          isLoading={scheduleAvailabilityLoading}
                        />
                      </>
                    ) : (
                      <>
                        <p className="mb-3 text-sm text-[#cde2f2]">Your Availability</p>
                        <AvailabilityCalendar
                          mentorId={directorId ?? ""}
                          currentMonth={scheduleMonth}
                          currentYear={scheduleYear}
                          selectedDate={scheduleSelectedDate}
                          onDateSelect={(day) => {
                            setScheduleSelectedDate(day);
                            const dateStr = `${scheduleYear}-${String(scheduleMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                            setMeetingDate(dateStr);
                            setSelectedSlot("");
                          }}
                          onPrevMonth={handleSchedulePrevMonth}
                          onNextMonth={handleScheduleNextMonth}
                          availabilitySlots={scheduleMonthlyAvailabilitySlots}
                          isLoading={scheduleAvailabilityLoading}
                        />
                      </>
                    )}
                  </div>

                  {meetingDate && (
                    <div className="mb-5">
                      <div className="mb-3 flex flex-col gap-2 rounded-lg border border-white/10 bg-white/5 p-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <GoogleCalendarConnectButton userId={directorId} label="Link my Google Calendar" />
                          <span className="text-[11px] leading-snug text-[#cde2f2]/75">
                            Connect Google so busy intervals apply and bookings can mirror to Calendar when OAuth is complete.
                          </span>
                        </div>
                        {calendarConnectBanners.map((msg) => (
                          <p key={msg.slice(0, 88)} className="text-[11px] text-amber-100/95">
                            {msg}
                          </p>
                        ))}
                      </div>
                      <p className="mb-2 text-sm text-[#cde2f2]">Available time slots</p>
                      {(calendarSlotSyncLoading || scheduleAvailabilityLoading) && (
                        <p className="mb-2 flex items-center gap-2 text-xs text-[#8ec5eb]">
                          <span className="inline-flex h-3 w-3 animate-spin rounded-full border border-[#8ec5eb]/30 border-t-[#8ec5eb]" />
                          Syncing Google Calendar availability…
                        </p>
                      )}
                      {calendarSlotSyncError ? (
                        <p className="mb-2 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-50">
                          {calendarSlotSyncError} Time slots cannot be validated until calendar access works.
                        </p>
                      ) : null}
                      {!calendarSlotSyncSkipped && calendarBusyStripped > 0 && !calendarSlotSyncError ? (
                        <p className="mb-2 text-xs text-[#cde2f2]/80">
                          Some times are hidden due to conflicting events on linked Google Calendars.
                        </p>
                      ) : null}
                      {availableSlots.length === 0 &&
                      !calendarSlotSyncLoading &&
                      !scheduleAvailabilityLoading ? (
                        <p className="text-sm text-white/50">No slots available for selected date.</p>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          {availableSlots.map((label) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setSelectedSlot(label)}
                              className={`rounded-lg border px-3 py-2 text-sm transition ${selectedSlot === label
                                ? "border-[#8ec5eb]/50 bg-[#8ec5eb]/20 text-white"
                                : "border-white/15 bg-white/5 text-[#d9ebf8] hover:bg-white/10"
                                }`}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-6">
                    <p className="mb-2 text-sm text-[#cde2f2]">Meeting platform</p>
                    <select
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className={directorSelectDark}
                    >
                      <option value="zoom">Zoom</option>
                      {/* <option value="google meet">Google Meet</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="phone">Phone</option> */}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-white/10 pt-6 shrink-0">
                  <button type="button" onClick={() => setIsDrawerOpen(false)} className={directorBtnSecondary}>Cancel</button>
                  <button
                    type="button"
                    disabled={isScheduling}
                    onClick={handleCreateAppointment}
                    className={`${directorBtnPrimary} ${isScheduling ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    {isScheduling ? "Scheduling…" : "Schedule"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Toast ── */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl border border-white/20 bg-[#062946]/90 px-5 py-3 text-sm text-white shadow-xl backdrop-blur-md">
          {toastMessage}
        </div>
      )}

      {/* ── Reschedule Drawer ── */}
      {isRescheduleModalOpen && rescheduleTarget && (
        <>
          <div
            className="fixed inset-0 z-[70] bg-black/45 backdrop-blur-[2px]"
            onClick={() => { if (!isRescheduling) setIsRescheduleModalOpen(false); }}
            aria-hidden
          />
          <div className="fixed right-0 top-0 z-[71] h-full w-full border-l border-white/15 bg-[#041f35] text-white shadow-2xl flex flex-col sm:max-w-[480px]">
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-white/15 px-6 py-5">
              <div>
                <h3 className="flex items-center gap-2 text-[18px] font-semibold text-white">
                  <i className="fa-regular fa-calendar text-[#8ec5eb]" />
                  Reschedule meeting
                </h3>
                {(() => {
                  const m = rescheduleTarget.mentor ?? (typeof (rescheduleTarget as any).mentorId === "object" ? (rescheduleTarget as any).mentorId : undefined);
                  const name = labelPerson(m, "");
                  return name ? <p className="mt-1 pl-6 text-sm font-medium text-[#8ec5eb]">{name}</p> : null;
                })()}
              </div>
              <button
                type="button"
                onClick={() => { if (!isRescheduling) setIsRescheduleModalOpen(false); }}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#d9ebf8] transition hover:bg-white/20"
              >
                <i className="fa-solid fa-xmark text-sm" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-6 mb-0">
              {/* Show availability calendar if appointment has a mentor, else simple datetime */}
              {(() => {
                const resolvedMentorId =
                  rescheduleTarget.mentor?._id ||
                  (typeof (rescheduleTarget as any).mentorId === "string"
                    ? (rescheduleTarget as any).mentorId
                    : (rescheduleTarget as any).mentorId?._id) ||
                  "";
                return resolvedMentorId;
              })() ? (
                // ── Mentor: Show availability calendar ──
                <>
                  <p className="text-sm mb-2 font-medium text-[#d9ebf8]">Mentor Availability</p>
                  <AvailabilityCalendar
                    mentorId={(() => {
                      return (
                        rescheduleTarget.mentor?._id ||
                        (typeof (rescheduleTarget as any).mentorId === "string"
                          ? (rescheduleTarget as any).mentorId
                          : (rescheduleTarget as any).mentorId?._id) ||
                        ""
                      );
                    })()}
                    currentMonth={rescheduleMonth}
                    currentYear={rescheduleYear}
                    selectedDate={rescheduleSelectedDate}
                    onDateSelect={setRescheduleSelectedDate}
                    onPrevMonth={handleReschedulePrevMonth}
                    onNextMonth={handleRescheduleNextMonth}
                    availabilitySlots={rescheduleMonthlyAvailabilitySlots}
                    isLoading={rescheduleAvailabilityLoading}
                  />

                  {/* Time slots for selected date */}
                  <p className="text-sm mt-5 mb-2 font-medium text-[#d9ebf8]">Select a Time</p>
                  {rescheduleAvailabilityLoading ? (
                    <div className="flex justify-center py-4">
                      <div className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-r-white" />
                    </div>
                  ) : (() => {
                    const slots = rescheduleMonthlyAvailabilitySlots
                      .filter((s) => new Date(s.date).getDate() === rescheduleSelectedDate)
                      .flatMap((s) =>
                        (s.slots || []).map((raw: any) => {
                          const label = formatAvailabilitySlotLabel(raw);
                          const iso = parseSlotStartToIso((s.date as string).slice(0, 10), label);
                          return { label, iso };
                        })
                      )
                      .filter((item) => item.label);
                    return slots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-3">
                        {slots.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => setRescheduleSelectedSlot(item.iso)}
                            className={`px-3 py-2 rounded-xl border text-sm transition ${rescheduleSelectedSlot === item.iso
                              ? "bg-blue-600 text-white font-semibold border-blue-500"
                              : "border-white/20 bg-white/10 text-white hover:bg-white/20"
                              }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-[#cde2f2]/70 mb-4">No available time slots for the selected date. Please choose a different day.</p>
                    );
                  })()}
                </>
              ) : (
                // ── Pastor/Default: Show simple datetime input ──
                <>
                  <div className="mb-4">
                    <label className="mb-1 block text-xs text-[#cde2f2]">Date and time</label>
                    <input
                      type="datetime-local"
                      value={rescheduleDateTime}
                      min={toLocalDateTimeInput(new Date().toISOString())}
                      onChange={(e) => setRescheduleDateTime(e.target.value)}
                      className={directorDateInput}
                    />
                  </div>
                </>
              )}

              {/* Platform selector (always visible) */}
              <div className="mb-6">
                <label className="mb-1 block text-xs text-[#cde2f2]">Platform</label>
                <select
                  value={reschedulePlatform}
                  onChange={(e) => setReschedulePlatform(e.target.value)}
                  className={directorSelectDark}
                >
                  <option value="zoom">Zoom</option>
                  {/* <option value="google-meet">Google Meet</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="phone">Phone</option>
                  <option value="in-person">In person</option> */}
                </select>
              </div>
            </div>

            {/* Action buttons (fixed at bottom) */}
            <div className="flex justify-end gap-3 shrink-0 border-t border-white/10 px-6 py-4">
              <button
                type="button"
                className={directorBtnSecondary}
                onClick={() => setIsRescheduleModalOpen(false)}
                disabled={isRescheduling}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${directorBtnPrimary} ${isRescheduling ? "cursor-not-allowed opacity-70" : ""}`}
                onClick={handleRescheduleAppointment}
                disabled={isRescheduling}
              >
                {isRescheduling ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Page export (wraps in Suspense for useSearchParams) ──────────────────────
export default function DirectorSchedulePage() {
  return (
    <Suspense
      fallback={
        <div className={directorPageRoot}>
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
            <div className={directorSpinner} />
            <p className="text-sm text-white/60">Loading schedule…</p>
          </div>
        </div>
      }
    >
      <DirectorScheduleContent />
    </Suspense>
  );
}
