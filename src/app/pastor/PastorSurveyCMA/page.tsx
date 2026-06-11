"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import headerBg from "../../Assets/CMA-hero-bg.png";
import { useRouter, useSearchParams } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import {
  apiGetAssessmentById,
  apiGetUserAnswers,
  apiGetSectionRecommendations,
  parseAssessmentDetailPayload,
  extractSurveySectionsForCma,
  apiSubmitSectionAnswers,
} from "@/app/Services/assessment.service";
import { apiGetRoadmapsByUser, apiTriggerJumpstartComplete } from "@/app/Services/api";
import { apiUpdateAssessmentProgress } from "@/app/Services/progress.service";
import { getCookie } from "@/app/utils/cookies";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import { apiCreateAppointment, apiGetAppointments } from "@/app/Services/appointments.service";
import axiosInstance from "@/app/Services/config/axios-instance";
import {
  formatAvailabilitySlotLabel,
  parseSlotStartToIso,
  unwrapAppointmentsList,
  unwrapMonthlyAvailabilityPayload,
} from "@/app/Services/appointment-utils";
import { isAxiosError } from "axios";

/** HTML `input[type=date]` value is YYYY-MM-DD — parse without UTC day-shift. */
function parseYmdParts(ymd: string): { y: number; m: number } | null {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]) };
}

/** Compare API slot.date to selectedDate (both calendar YYYY-MM-DD). */

function slotDateToYmd(raw: unknown): string | null {
  if (raw == null) return null;

  const s = String(raw).trim();

  // Handles: 2026-05-06, 2026-05-06T00:00:00.000Z
  const isoHead = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoHead) {
    return `${isoHead[1]}-${isoHead[2]}-${isoHead[3]}`;
  }

  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/** Ensure layers have question + choices the CMA UI can render (API may use title/text). */
function normalizeSectionsForCmaUi(raw: unknown[]): any[] {
  return raw.map((sec: any) => ({
    ...sec,
    name: sec.name ?? sec.title ?? "Section",
    layers: (Array.isArray(sec.layers) ? sec.layers : []).map((layer: any) => ({
      ...layer,
      question: layer.question ?? layer.title ?? layer.name ?? "",
      choices: Array.isArray(layer.choices)
        ? layer.choices.map((c: any, ci: number) =>
            typeof c === "string"
              ? { _id: `opt_${ci}`, label: c, value: c }
              : {
                  ...c,
                  _id: c._id ?? c.id ?? c.value ?? `opt_${ci}`,
                  label: c.label ?? c.text ?? String(c.value ?? ""),
                },
          )
        : [],
    })),
  }));
}

/** Match API + mobile: same id used when loading answers, in UI, and on submit. */
function resolveLayerKey(layer: any, sectionIndex: number, layerIndex: number): string {
  return String(layer?.layerId ?? layer?._id ?? `layer_${sectionIndex}_${layerIndex}`);
}

function choiceMatchesSelection(c: Record<string, unknown> | undefined, sel: string): boolean {
  if (!c) return false;
  const id = c._id != null ? String(c._id) : "";
  const cid = c.id != null ? String(c.id) : "";
  const val = c.value != null ? String(c.value) : "";
  const lab = c.label != null ? String(c.label) : "";
  const text = c.text != null ? String(c.text) : "";
  return sel === id || sel === cid || sel === val || sel === lab || sel === text;
}

/**
 * CMA assessments often store CDP as `layer.recommendations[]` parallel to `choices[]`, or as
 * score bands (minScore/maxScore). This does not require a separate mentor API field.
 */
function pickCdpFromLayerTemplate(layer: any, selectedAnswer: string | undefined): string {
  if (!layer || !selectedAnswer) return "";
  const sel = String(selectedAnswer).trim();
  if (!sel) return "";
  const choices: any[] = Array.isArray(layer.choices) ? layer.choices : [];
  const recs: any[] = Array.isArray(layer.recommendations) ? layer.recommendations : [];
  if (!recs.length) return "";

  const choice = choices.find((c: any) => choiceMatchesSelection(c, sel));
  const score = choice != null ? Number(choice.score) : NaN;
  if (Number.isFinite(score)) {
    for (const r of recs) {
      if (r && typeof r === "object" && !Array.isArray(r)) {
        const min = Number((r as { minScore?: number }).minScore);
        const max = Number((r as { maxScore?: number }).maxScore);
        if (Number.isFinite(min) && Number.isFinite(max) && score >= min && score <= max) {
          return String(
            (r as { message?: string }).message ??
              (r as { label?: string }).label ??
              (r as { text?: string }).text ??
              "",
          ).trim();
        }
      }
    }
  }

  const idx = choices.findIndex((c: any) => choiceMatchesSelection(c, sel));
  if (idx < 0 || idx >= recs.length) return "";
  const r = recs[idx];
  if (typeof r === "string") return r.trim();
  if (r && typeof r === "object") {
    return String(
      (r as { message?: string }).message ??
        (r as { label?: string }).label ??
        (r as { description?: string }).description ??
        (r as { text?: string }).text ??
        "",
    ).trim();
  }
  return "";
}

/** Mentor-written CDP / backend-computed text may live on answer layers under varying keys. */
function extractMentorCdpText(layer: Record<string, unknown> | null | undefined): string {
  if (!layer || typeof layer !== "object") return "";
  const keys = [
    "mentorCdp",
    "cdp",
    "customizedDevelopmentPlan",
    "customDevelopmentPlan",
    "mentorDevelopmentPlan",
    "developmentPlan",
    "mentorFeedback",
    "mentorMessage",
    "cdpText",
    "developmentPlanText",
    "recommendation",
    "recommendationMessage",
    "recommendationText",
    "matchedRecommendation",
    "appliedRecommendation",
    "selectedRecommendation",
    "personalizedPlan",
    "mentorNotes",
    "notes",
  ];
  for (const k of keys) {
    const v = layer[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  const rec = layer.recommendation;
  if (rec && typeof rec === "object" && !Array.isArray(rec)) {
    const o = rec as Record<string, unknown>;
    const m = o.message ?? o.text ?? o.label;
    if (m != null && String(m).trim()) return String(m).trim();
  }
  return "";
}

/** GET /assessment/:id/recommendations — unwrap and map CDP by layer key + raw ids. */
function parseRecommendationsCdpPayload(data: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (Array.isArray(data)) {
    data.forEach((r: Record<string, unknown>) => {
      const msg = r?.message ?? r?.text ?? r?.cdp ?? r?.mentorCdp;
      const lid = r?.layerId ?? r?.layer_id ?? r?._id;
      if (lid != null && msg != null && String(msg).trim()) {
        out[String(lid)] = String(msg).trim();
      }
    });
    return out;
  }
  let body: Record<string, unknown> | null = null;
  if (data && typeof data === "object") {
    body = data as Record<string, unknown>;
    if (body.data && typeof body.data === "object" && !Array.isArray(body.data)) {
      body = body.data as Record<string, unknown>;
    } else if (Array.isArray(body.data)) {
      return parseRecommendationsCdpPayload(body.data);
    }
  }
  if (!body) return out;

  const mergeFromSections = (secList: unknown) => {
    if (!Array.isArray(secList)) return;
    secList.forEach((section: any, si: number) => {
      const layers = section?.layers;
      if (!Array.isArray(layers)) return;
      layers.forEach((layer: any, li: number) => {
        const text = extractMentorCdpText(layer);
        if (!text) return;
        const layerId = resolveLayerKey(layer, si, li);
        out[layerId] = text;
        const id = layer.layerId ?? layer._id ?? layer.id;
        if (id != null) out[String(id)] = text;
      });
    });
  };

  mergeFromSections(body.sections);

  const rec = body.recommendations;
  if (Array.isArray(rec)) {
    rec.forEach((r: Record<string, unknown>) => {
      const msg =
        r.message ?? r.text ?? r.cdp ?? r.mentorCdp ?? r.mentorMessage ?? r.description;
      if (msg == null || !String(msg).trim()) return;
      const lid = r.layerId ?? r.layer_id ?? r.layerID ?? r._id;
      if (lid != null) out[String(lid)] = String(msg).trim();
    });
  }

  return out;
}

/** Try several URL shapes — backends differ on query vs path for mentor CDP / recommendations. */
async function fetchMentorRecommendationsPayload(
  assessmentId: string,
  userId: string,
): Promise<unknown | null> {
  const attempts: (() => Promise<unknown>)[] = [
    async () => (await apiGetSectionRecommendations(assessmentId, userId)).data,
    async () => (await axiosInstance.get(`/assessment/${assessmentId}/recommendations/${userId}`)).data,
    async () =>
      (await axiosInstance.get(`/assessments/${assessmentId}/recommendations`, { params: { userId } })).data,
    async () =>
      (await axiosInstance.get(`/assessment/recommendations`, { params: { assessmentId, userId } })).data,
  ];
  for (const run of attempts) {
    try {
      const data = await run();
      if (data != null) return data;
    } catch {
      /* try next */
    }
  }
  return null;
}

/** Get total days in a month */
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Get first day of month (0 = Sunday, 6 = Saturday) */
function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

/** Check if date is in the past */
function isPastDate(dateStr: string): boolean {
  const selected = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected < today;
}

/** Check if date has available slots */
function hasAvailability(dateStr: string, availability: any[]): boolean {
  return availability.some((slot: any) => {
    const ymd = slotDateToYmd(
      slot?.date ?? slot?.day ?? slot?.calendarDate ?? slot?.meetingDate ?? slot?.dateString,
    );
    if (ymd !== dateStr) return false;
    return Array.isArray(slot?.slots) && slot.slots.length > 0;
  });
}

/** Get available times for a specific date */
function getTimesForDate(dateStr: string, availability: any[]): string[] {
  const dateSlot = availability.find((slot: any) => {
    const ymd = slotDateToYmd(
      slot?.date ?? slot?.day ?? slot?.calendarDate ?? slot?.meetingDate ?? slot?.dateString,
    );
    return ymd === dateStr;
  });
  
  if (dateSlot && dateSlot.slots && Array.isArray(dateSlot.slots)) {
    return dateSlot.slots
      .map((raw: any) => formatAvailabilitySlotLabel(raw))
      .filter((label: string) => Boolean(label.trim()));
  }
  return [];
}

function getAppointmentMentorId(appt: any): string {
  return String(appt?.mentor?._id ?? appt?.mentor?.id ?? appt?.mentorId ?? "").trim();
}

function isBlockingBookedAppointment(appt: any, mentorId: string): boolean {
  const apptMentorId = getAppointmentMentorId(appt);
  const status = String(appt?.status ?? "").toLowerCase();
  return (
    apptMentorId === mentorId &&
    !status.includes("cancel") &&
    status !== "missed" &&
    typeof appt?.meetingDate === "string" &&
    !Number.isNaN(new Date(appt.meetingDate).getTime())
  );
}

function buildBookedSlotStartMsByDate(appointments: any[], mentorId: string): Map<string, number[]> {
  const bookedByDate = new Map<string, number[]>();

  appointments.forEach((appt) => {
    if (!isBlockingBookedAppointment(appt, mentorId)) return;
    const meetingDate = String(appt.meetingDate);
    const ymd = slotDateToYmd(meetingDate);
    const ms = new Date(meetingDate).getTime();
    if (!ymd || Number.isNaN(ms)) return;
    const existing = bookedByDate.get(ymd) ?? [];
    existing.push(ms);
    bookedByDate.set(ymd, existing);
  });

  return bookedByDate;
}

function filterBookedAvailabilitySlots(availabilitySlots: any[], appointments: any[], mentorId: string): any[] {
  const bookedByDate = buildBookedSlotStartMsByDate(appointments, mentorId);

  return availabilitySlots.map((slot: any) => {
    const ymd = slotDateToYmd(
      slot?.date ?? slot?.day ?? slot?.calendarDate ?? slot?.meetingDate ?? slot?.dateString,
    );
    const rawSlots = Array.isArray(slot?.slots) ? slot.slots : [];
    if (!ymd || rawSlots.length === 0) return slot;

    const bookedMs = bookedByDate.get(ymd) ?? [];
    if (bookedMs.length === 0) return slot;

    const openSlots = rawSlots.filter((raw: any) => {
      const label = formatAvailabilitySlotLabel(raw);
      if (!label.trim()) return false;
      const slotMs = new Date(parseSlotStartToIso(ymd, label)).getTime();
      if (Number.isNaN(slotMs)) return false;
      return !bookedMs.some((booked) => Math.abs(booked - slotMs) < 30 * 60 * 1000);
    });

    return { ...slot, slots: openSlots };
  });
}

/** Backend expects selectedChoice like "1", "2", ... based on option order. */
function toSelectedChoiceNumber(layer: any, selectedValue: string): string {
  const raw = String(selectedValue ?? "").trim();
  if (/^\d+$/.test(raw)) return raw;

  const choices = Array.isArray(layer?.choices) ? layer.choices : [];
  const idx = choices.findIndex((choice: any) => {
    const key = String(choice?._id ?? choice?.value ?? choice?.label ?? "").trim();
    const value = String(choice?.value ?? "").trim();
    const label = String(choice?.label ?? choice?.text ?? "").trim();
    return raw === key || raw === value || raw === label;
  });

  return idx >= 0 ? String(idx + 1) : raw;
}

/** Parse a time range like `10:30 am – 11:30 am` and return start time in 24h. */
function parseStartTimeFromRange(range: string): { hour24: number; minute: number } | null {
  const m = String(range).trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])\b/);
  if (!m) return null;

  const hour12 = Number(m[1]);
  const minute = Number(m[2]);
  const period = m[3].toLowerCase();

  if (!Number.isFinite(hour12) || hour12 < 1 || hour12 > 12) return null;
  if (!Number.isFinite(minute) || minute < 0 || minute > 59) return null;

  let hour24 = hour12 % 12;
  if (period === "pm") hour24 += 12;
  return { hour24, minute };
}

/** Build ISO timestamp expected by appointments API (UTC string). */
function buildMeetingDateIso(dateYmd: string, timeRange: string): string | null {
  const dateMatch = String(dateYmd).trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!dateMatch) return null;

  const parsed = parseStartTimeFromRange(timeRange);
  if (!parsed) return null;

  // Keep behavior aligned with other scheduling screens to avoid timezone slot mismatches.
  return parseSlotStartToIso(dateYmd, timeRange);
}

function resolveCookieUserId(): string | null {
  const rawUser = getCookie("user");
  if (rawUser) {
    try {
      const user = JSON.parse(rawUser) as { id?: string; _id?: string };
      const uid = String(user.id || user._id || "").trim();
      if (uid) return uid;
    } catch {
      // Ignore malformed `user` cookie and try `userId`.
    }
  }

  const rawUserId = getCookie("userId");
  if (rawUserId && String(rawUserId).trim()) {
    return String(rawUserId).trim();
  }

  return null;
}

/** CCC-Mobile: trigger jumpstart POST before assessment submit (non-blocking). */
async function ensureJumpstartTriggeredForAssessment(userId: string): Promise<void> {
  try {
    const res = await apiGetRoadmapsByUser(userId);
    const raw = res.data as unknown;
    const list = Array.isArray(raw) ? raw : (raw as { data?: unknown })?.data;
    const roadmaps = Array.isArray(list) ? list : [];
    const norm = (s: string) => s.toLowerCase().replace(/[\s-]+/g, "");
    const jump = roadmaps.find((r: { name?: string }) =>
      norm(String(r?.name ?? "")).includes("jumpstart"),
    ) as { _id?: string } | undefined;
    const roadmapId = jump?._id ?? (roadmaps[0] as { _id?: string } | undefined)?._id;
    if (!roadmapId) return;
    await apiTriggerJumpstartComplete(String(roadmapId), userId);
  } catch {
    /* non-blocking */
  }
}

function PastorSurveyCMAContent() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(0);
  const sectionTopRef = useRef<HTMLDivElement | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const scrollToSectionTop = () => {
    requestAnimationFrame(() => {
      if (sectionTopRef.current) {
        sectionTopRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
        return;
      }

      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId");
  const routeRoadmapId = searchParams.get("roadmapId")?.trim() || "";
  const routeTaskId = searchParams.get("taskId")?.trim() || "";
  const meetingId = searchParams.get("meetingId")?.trim() || "";
const meetingDate = searchParams.get("meetingDate")?.trim() || "";
const mentorName = searchParams.get("mentorName")?.trim() || "";
const meetingPlatform = searchParams.get("platform")?.trim() || "";
  const reviewUserId = (searchParams.get("userId") || "").trim();
  const [scheduledMeeting, setScheduledMeeting] = useState(false);


  /** Mentor opened a review link: ?viewOnly=1&userId=<pastorId> */
  const viewOnlyParam =
    searchParams.get("viewOnly") === "1" ||
    searchParams.get("viewOnly") === "true" ||
    searchParams.get("mode") === "review";
  /** Explicit retake: editable survey even if user previously submitted (guidelines / list). */
  const retakeMode = searchParams.get("retake") === "1";
  /** Pastor viewing their own submitted survey (guidelines "View response") — not mentor review */
  const readOnlySelf =
    !retakeMode &&
    (searchParams.get("readOnly") === "1" || searchParams.get("readOnly") === "true");

  const shouldOpenScheduleMeeting =
    searchParams.get("scheduleMeeting") === "1" && readOnlySelf;
  const mentorReviewMode = viewOnlyParam && !!reviewUserId;
  const selfReadOnlyMode = readOnlySelf && !mentorReviewMode;
  const uiReadOnly = mentorReviewMode || selfReadOnlyMode;
  const [sections, setSections] = useState<any[]>([]);
  const [assessmentTitle, setAssessmentTitle] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<string>("");
  const [availability, setAvailability] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDescription, setScheduleDescription] = useState("");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  // ✅ Added new state for submit & schedule popup flow
  const [showSubmitPopup, setShowSubmitPopup] = useState(false);
  const [showMentorSidebar, setShowMentorSidebar] = useState(false);
  const [mentorStep, setMentorStep] = useState(1);
  const [showFinalPopup, setShowFinalPopup] = useState(false);
  const [showMeetingDetails, setShowMeetingDetails] = useState(false);
  const [scheduledAppointmentId, setScheduledAppointmentId] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  /** Mentor Customized Development Plan (CDP) text per layer — from answers doc + GET recommendations. */
  const [mentorLayerCdp, setMentorLayerCdp] = useState<Record<string, string>>({});
  const [hasRecommendationsInAnswer, setHasRecommendationsInAnswer] = useState(false);
  const hasSentRecommendations = Object.keys(mentorLayerCdp).length > 0;
  const canShowPastorCdp = selfReadOnlyMode && (hasSentRecommendations || hasRecommendationsInAnswer);

  useEffect(() => {
    if (!assessmentId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        const res = await apiGetAssessmentById(assessmentId);
        const detail = parseAssessmentDetailPayload(res.data);
        const rawSections = extractSurveySectionsForCma(detail ?? undefined);
        setSections(normalizeSectionsForCmaUi(rawSections));
        setAssessmentTitle((detail?.name as string) || "");

        let answersUserId = "";
        if (viewOnlyParam && !reviewUserId) {
          /* Broken mentor review link (missing ?userId=) — not pastor readOnly=1 */
          setSections([]);
          setMentors([]);
          setLoading(false);
          return;
        }
        if (mentorReviewMode) {
          answersUserId = reviewUserId;
        } else {
          answersUserId = resolveCookieUserId() ?? "";
          if (answersUserId) {
            const mentorsRes = await apiGetAssignedUsers(answersUserId);
            setMentors(mentorsRes.data?.data || []);
          }
        }

        const cdpMap: Record<string, string> = {};
        const skipAnswerHydration = retakeMode && !mentorReviewMode;

        if (answersUserId) {
          if (skipAnswerHydration) {
            setAnswers({});
            setHasRecommendationsInAnswer(false);
            setMentorLayerCdp({});
          } else {
            try {
              const answersRes = await apiGetUserAnswers(assessmentId, answersUserId);
              const body = answersRes.data as Record<string, unknown>;
              const inner = (body?.data as Record<string, unknown>) || body;
              const sectionsData = inner?.sections as unknown;
              if (Array.isArray(sectionsData)) {
                const userAnswers: Record<string, string> = {};
                let hasRecs = false;

                sectionsData.forEach((section: any, sectionIndex: number) => {
                  if (Array.isArray(section?.recommendations) && section.recommendations.length > 0) {
                    hasRecs = true;
                  }

                  section.layers?.forEach((layer: any, layerIndex: number) => {
                    const layerId = resolveLayerKey(layer, sectionIndex, layerIndex);
                    const sel =
                      layer.selectedChoice ??
                      (Array.isArray(layer.selectedValues) ? layer.selectedValues[0] : undefined);
                    if (sel != null && String(sel) !== "") {
                      userAnswers[layerId] = String(sel);
                    }
                    const cdp = extractMentorCdpText(layer as Record<string, unknown>);
                    if (cdp) {
                      cdpMap[layerId] = cdp;
                      const id = layer.layerId ?? layer._id;
                      if (id != null) cdpMap[String(id)] = cdp;
                    }
                  });
                });
                setAnswers(userAnswers);
                setHasRecommendationsInAnswer(hasRecs);
              }
            } catch (err) {
              const status = isAxiosError(err) ? err.response?.status : undefined;
              if (status === 404) {
                setAnswers({});
              } else {
                console.error("Failed to fetch user answers", err);
              }
            }

            try {
              const recData = await fetchMentorRecommendationsPayload(assessmentId, answersUserId);
              if (recData != null) {
                Object.assign(cdpMap, parseRecommendationsCdpPayload(recData));
              }
            } catch {
              /* optional */
            }
            setMentorLayerCdp(cdpMap);
          }
        } else {
          setMentorLayerCdp({});
          if (!mentorReviewMode) {
            setMentors([]);
          }
        }
      } catch (err) {
        console.error(err);
        setSections([]);
        setMentors([]);
        setMentorLayerCdp({});
        setAssessmentTitle("");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [assessmentId, viewOnlyParam, reviewUserId, retakeMode]);

  useEffect(() => {
    if (retakeMode) setActiveSection(0);
  }, [retakeMode, assessmentId]);

  useEffect(() => {
  if (!shouldOpenScheduleMeeting) return;
  if (loading) return;

  setShowMentorSidebar(true);
  setMentorStep(1);
  setSelectedMentor("");
  setAvailability([]);
  setSelectedDate("");
  setSelectedTime("");
  setScheduleTitle("");
  setScheduleDescription("");
  setAvailableTimes([]);
}, [shouldOpenScheduleMeeting, loading]);

  useEffect(() => {
    if (!selectedMentor) {
      setAvailability([]);
      return;
    }
    const fetchAvailability = async () => {
      try {
        let slots: any[] = [];
        try {
          const availRes = await axiosInstance.get(`/appointments/availability/${selectedMentor}/month`, {
            params: { year: currentYear, month: currentMonth },
          });
          slots = unwrapMonthlyAvailabilityPayload(availRes as { data?: unknown });
          if (!slots.length) {
            const raw = availRes.data?.data ?? availRes.data;
            slots = Array.isArray(raw) ? raw : [];
          }
        } catch {
          const monthDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
          const weekRes = await axiosInstance.get(`/appointments/availability/${selectedMentor}/week`, {
            params: { date: monthDate },
          });
          slots = unwrapMonthlyAvailabilityPayload(weekRes as { data?: unknown });
          if (!slots.length) {
            const raw = weekRes.data?.data ?? weekRes.data;
            slots = Array.isArray(raw) ? raw : [];
          }
        }
        let bookedAppointments: any[] = [];
        try {
          const appointmentsRes = await apiGetAppointments({
            mentorId: selectedMentor,
            futureOnly: false,
          } as any);
          bookedAppointments = unwrapAppointmentsList(appointmentsRes.data);
        } catch (appointmentsErr) {
          console.error("Failed to fetch booked mentor appointments", appointmentsErr);
        }

        setAvailability(filterBookedAvailabilitySlots(slots, bookedAppointments, selectedMentor));
      } catch (err) {
        console.error("Failed to fetch availability", err);
        setAvailability([]);
      }
    };
    void fetchAvailability();
  }, [selectedMentor, currentYear, currentMonth]);

  useEffect(() => {
    if (selectedDate && availability.length > 0) {
      const dateSlot = availability.find((slot: any) => {
        const ymd = slotDateToYmd(
          slot?.date ?? slot?.day ?? slot?.calendarDate ?? slot?.meetingDate ?? slot?.dateString,
        );
        return ymd === selectedDate;
      });
      if (dateSlot && dateSlot.slots) {
        const times = dateSlot.slots
          .map((raw: any) => formatAvailabilitySlotLabel(raw))
          .filter((label: string) => Boolean(label.trim()));
        setAvailableTimes(times);
      } else {
        setAvailableTimes([]);
      }
    } else {
      setAvailableTimes([]);
    }
  }, [selectedDate, availability]);

  const handleCheck = (layerId: string, choiceId: string) => {
    if (uiReadOnly) return;
    setAnswers((prev) => ({ ...prev, [layerId]: choiceId }));
  };

  const isSectionComplete = (sectionIndex: number) => {
    if (uiReadOnly) return true;
    const section = sections[sectionIndex];
    if (!section?.layers?.length) return true;

    return section.layers.every((layer: any, layerIndex: number) => {
      const layerId = resolveLayerKey(layer, sectionIndex, layerIndex);
      return !!answers[layerId];
    });
  };

  const handleNext = () => {
    if (!isSectionComplete(activeSection)) {
      setToast("Please answer all questions in this section before proceeding.");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (activeSection < sections.length - 1) {
      setActiveSection((prev) => prev + 1);
      scrollToSectionTop();
    }
  };

  const handlePrev = () => {
    if (activeSection > 0) {
      setActiveSection((prev) => prev - 1);
      scrollToSectionTop();
    }
  };
 const handleClearResponses = () => {
  if (uiReadOnly) return;
  setShowClearConfirm(true);
};

const confirmClearResponses = () => {
  setAnswers({});
  setShowClearConfirm(false);
  setToast("Responses cleared.");
  setTimeout(() => setToast(null), 2500);
};

  // New Submit Flow
  const handleSubmitSurvey = async () => {
    if (uiReadOnly) return;
    const allComplete = sections.every((_, idx) => isSectionComplete(idx));
    if (!allComplete) {
      setToast("Please complete all questions in every section before submitting.");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
      await submitAllSectionAnswers();
    } catch (error) {
      console.error("Failed to submit survey answers", error);
      let msg = "Failed to submit survey answers.";
      if (isAxiosError(error)) {
        const d = error.response?.data as { message?: string | string[] } | undefined;
        const m = d?.message;
        if (typeof m === "string" && m.trim()) msg = m.trim();
        else if (Array.isArray(m) && m[0]) msg = String(m[0]);
      }
      setToast(msg);
      setTimeout(() => setToast(null), 5000);
      return;
    }

    const uidAfter = resolveCookieUserId() ?? "";
    if (assessmentId && uidAfter) {
      try {
        await apiUpdateAssessmentProgress({
          userId: uidAfter,
          assessmentId,
          status: "submitted",
          completedSections: Array.isArray(sections) ? sections.length : undefined,
        });
      } catch (progressErr) {
        console.error("Failed to persist submitted status after survey submit", progressErr);
      }
    }

    setShowSubmitPopup(true);
    setTimeout(() => {
      setShowSubmitPopup(false);
      if (assessmentId && routeRoadmapId && routeTaskId) {
        const q = new URLSearchParams({
          assessmentId,
          roadmapId: routeRoadmapId,
          taskId: routeTaskId,
        });
        router.push(`/pastor/Assessments/guidelines?${q.toString()}`);
        return;
      }
      router.push("/pastor/Assessments");
    }, 1800);
  };

  const submitAllSectionAnswers = async () => {
    if (uiReadOnly) return;
    if (!assessmentId) return;

    const uid = resolveCookieUserId() ?? "";
    if (!uid) return;

    const formattedAnswers = sections.map((section, sectionIndex) => {
      const sectionId = String(section._id ?? section.id ?? "");
      const layers = (section.layers || [])
        .map((layer: any, layerIndex: number) => {
          const layerId = resolveLayerKey(layer, sectionIndex, layerIndex);
          const selectedValue = answers[layerId];
          if (!selectedValue || String(selectedValue).trim() === "") return null;
          return {
            layerId,
            selectedChoice: toSelectedChoiceNumber(layer, String(selectedValue)),
          };
        })
        .filter((layer: any): layer is { layerId: string; selectedChoice: string } => layer != null);

      return { sectionId, layers };
    }).filter((sectionAnswer) => sectionAnswer.sectionId && sectionAnswer.layers.length > 0);

    if (!formattedAnswers.length) {
      return;
    }

    await ensureJumpstartTriggeredForAssessment(uid);

    await apiSubmitSectionAnswers(assessmentId, {
      userId: uid,
      answers: formattedAnswers,
    });
  };

  const handleFinalSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedMentor) {
      setToast("Please select date, time, and mentor");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const trimmedTitle = scheduleTitle.trim();
    const trimmedDescription = scheduleDescription.trim();
    if (!trimmedTitle) {
      setToast("Please enter a meeting title.");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const uid = resolveCookieUserId();
    if (!uid) {
      setToast("Unable to identify your account. Please sign in again.");
      setTimeout(() => setToast(null), 5000);
      return;
    }

    try {
      const meetingDateIso = buildMeetingDateIso(selectedDate, selectedTime);
      if (!meetingDateIso) {
        setToast("Invalid time format");
        setTimeout(() => setToast(null), 3000);
        return;
      }

  
      const notes = routeRoadmapId && routeTaskId
        ? `Roadmap assessment meeting | assessmentId:${assessmentId || ""} | roadmapId:${routeRoadmapId} | taskId:${routeTaskId}`
        : `Assessment meeting | assessmentId:${assessmentId || ""} | title:${assessmentTitle || "Assessment"}`;
      const payload = {
  userId: uid,
  mentorId: selectedMentor,
  meetingDate: meetingDateIso,
  platform: "zoom",
  title: trimmedTitle,
  description: trimmedDescription,
  notes,
  googleCalendarSync: true,
  googleCalendarTitle: trimmedTitle,
  googleCalendarDescription: trimmedDescription || notes,
};

      const createRes = await apiCreateAppointment(payload);
      const success = (createRes.data as { success?: boolean } | undefined)?.success;
      if (success === false) {
        throw new Error("Appointment API returned unsuccessful response");
      }

      if (assessmentId) {
        try {
          await apiUpdateAssessmentProgress({
            userId: uid,
            assessmentId,
            status: "completed",
            completedSections: Array.isArray(sections) ? sections.length : undefined,
          });
        } catch (progressErr) {
          console.error("Failed to mark assessment as completed after meeting", progressErr);
          // setToast("Meeting scheduled, but failed to mark assessment as completed. Please refresh.");
          setTimeout(() => setToast(null), 5000);
        }
      }

      const raw = createRes.data as any;
      const appointmentId = String(
        raw?.data?._id ??
        raw?.data?.id ??
        raw?._id ??
        raw?.id ??
        "",
      ).trim();
      setScheduledAppointmentId(appointmentId);
      setScheduledMeeting(true);
      setShowMeetingDetails(false);
      setShowFinalPopup(true);
    } catch (err) {
      console.error("Failed to schedule appointment", err);
      const msg = isAxiosError(err) ? (err.response?.data?.message ?? "Failed to schedule appointment") : "Failed to schedule appointment";
      setToast(msg);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const pageShell =
    "flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white antialiased";
  const mainBand =
    "relative z-10 flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)]";

  return (
    <div className={pageShell}>
      <PastorHeader showFullHeader={true} />

      <header
        className="relative flex min-h-[150px] items-center bg-cover bg-center bg-no-repeat px-4 py-8 text-white sm:min-h-[200px] sm:px-8 md:px-16 md:py-10"
        style={{
          backgroundImage: `url(${headerBg.src})`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.92)_100%)]" />

        {/* <div className="relative z-10 flex w-full max-w-5xl items-start justify-between gap-4">
          <div className="max-w-4xl">
            <h2 className="text-xl font-bold sm:text-2xl md:text-3xl">
              {assessmentTitle || "Church Assessment Evaluation (CMA)"}
            </h2>
            <p className="mt-2 max-w-full text-sm text-[#d9ebf8] sm:max-w-2xl">
              {mentorReviewMode
                ? "Read-only review of this pastor’s saved responses."
                : selfReadOnlyMode
                  ? "Read-only view of your saved responses."
                  : "Complete each section using the options that best reflect your church."}
            </p>
          </div>

          
        </div> */}
        <div className="relative z-10 flex w-full max-w-6xl flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
  <div className="max-w-4xl">
    <h2 className="text-xl font-bold sm:text-2xl md:text-3xl">
      {assessmentTitle || "Church Assessment Evaluation (CMA)"}
    </h2>

    <p className="mt-2 max-w-full text-sm text-[#d9ebf8] sm:max-w-2xl">
      {mentorReviewMode
        ? "Read-only review of this pastor’s saved responses."
        : selfReadOnlyMode
          ? "Read-only view of your saved responses."
          : "Complete each section using the options that best reflect your church."}
    </p>
  </div>

  {selfReadOnlyMode ? (
    meetingId || scheduledMeeting ? (
    <button
  type="button"
  onClick={() => {
    if (meetingId) {
      router.push(`/pastor/appointments/${encodeURIComponent(meetingId)}`);
    }
  }}
  className="w-full max-w-[520px] rounded-2xl border border-yellow-300/45 bg-[linear-gradient(135deg,rgba(250,204,21,0.18)_0%,rgba(245,158,11,0.12)_45%,rgba(15,74,118,0.28)_100%)] px-5 py-4 text-left shadow-[0_18px_45px_rgba(245,158,11,0.22)] backdrop-blur-md transition hover:border-yellow-300/65 hover:bg-yellow-400/20"
>
  <div className="flex items-center gap-3">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-300/25 text-yellow-100">
      <i className="fa-regular fa-calendar-check" />
    </span>

    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-yellow-200">
        Meeting scheduled
      </p>

      <p className="mt-1 text-sm font-semibold text-white">
        {meetingDate ? `Meeting on ${meetingDate}` : "Tap to open meeting details"}
      </p>

      {(mentorName || meetingPlatform) ? (
        <p className="mt-1 text-xs text-[#cde2f2]/80">
          {mentorName ? `Mentor: ${mentorName}` : ""}
          {mentorName && meetingPlatform ? " | " : ""}
          {meetingPlatform ? `Platform: ${meetingPlatform}` : ""}
        </p>
      ) : null}

      {meetingId ? (
        <p className="mt-2 text-xs font-medium text-[#8ec5eb] underline underline-offset-2">
          Open appointment →
        </p>
      ) : null}
    </div>
  </div>
</button>
    ) : (
      <button
  type="button"
  onClick={() => {
    setShowMentorSidebar(true);
    setMentorStep(1);
    setScheduleTitle("");
    setScheduleDescription("");
  }}
  className="w-full max-w-[520px] rounded-2xl border border-yellow-300/45 bg-[linear-gradient(135deg,rgba(250,204,21,0.18)_0%,rgba(245,158,11,0.12)_45%,rgba(15,74,118,0.28)_100%)] px-5 py-4 text-left shadow-[0_18px_45px_rgba(245,158,11,0.22)] backdrop-blur-md transition hover:border-yellow-300/65 hover:bg-yellow-400/20"
>
  <div className="flex items-center gap-3">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-yellow-300/25 text-yellow-100">
      <i className="fa-regular fa-calendar-plus" />
    </span>

    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-yellow-200">
        Mentor meeting required
      </p>
      <p className="mt-1 text-sm font-semibold text-white">Schedule meeting</p>
      <p className="mt-1 text-xs text-[#cde2f2]/80">
        Book a time with your mentor to complete this step.
      </p>
    </div>
  </div>
</button>
    )
  ) : null}
</div>
      </header>

      <main className={`${mainBand} flex flex-col gap-6 px-4 py-8 sm:flex-row sm:gap-8 md:px-16 md:py-10`}>
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
            <p className="text-sm text-[#cde2f2]">Loading assessment…</p>
          </div>
        ) : sections.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
            <p className="max-w-md text-[#cde2f2]">
              {viewOnlyParam && !reviewUserId
                ? "This review link is missing a pastor user id."
                : "No sections available for this assessment."}
            </p>
          </div>
        ) : (
          <>
            <aside className="h-auto w-full shrink-0 rounded-2xl border border-white/15 bg-white/5 p-4 shadow-[0_8px_40px_rgba(3,24,43,0.4)] backdrop-blur-md sm:h-[min(560px,70vh)] sm:w-[300px] md:w-[340px]">
              <h2 className="mb-4 text-base font-semibold text-white sm:mb-6 sm:text-lg">
                {mentorReviewMode ? "Sections" : "My Responses"}
              </h2>
              <div className="flex max-h-[min(480px,60vh)] flex-col gap-3 overflow-y-auto pr-1 sm:gap-4">
                {sections.map((sec, i) => (
                  <button
                    type="button"
                    key={sec._id || sec.id || i}
                    onClick={() => setActiveSection(i)}
                    className={`w-full rounded-xl border text-left transition-all ${
                      activeSection === i
                        ? "border-[#8ec5eb]/50 bg-[#8ec5eb]/15 text-white shadow-[0_0_0_1px_rgba(142,197,235,0.2)]"
                        : "border-white/15 bg-white/[0.06] text-[#cde2f2] hover:border-white/25 hover:bg-white/10"
                    }`}
                  >
                    <div className="px-3 py-2.5 sm:px-4 sm:py-3">
                      <p
                        className={`mb-1 text-xs font-semibold sm:text-sm ${
                          activeSection === i ? "text-[#8ec5eb]" : "text-[#8ec5eb]/90"
                        }`}
                      >
                        Section {i + 1}
                      </p>
                      <p className="text-xs leading-snug text-[#d9ebf8]/95">
                        {sec.name || sec.title || `Section ${i + 1}`}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </aside>

            <section className="min-w-0 flex-1">
              <div ref={sectionTopRef} className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <p className="max-w-2xl text-sm leading-relaxed text-[#cde2f2]">
                  Choose the option in each box that best matches how you feel and who you are. Your accuracy allows us
                  to provide the best support and guidance.
                </p>
                
                {selfReadOnlyMode && assessmentId && canShowPastorCdp ? (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/pastor/assessmentRecommendations?assessmentId=${encodeURIComponent(String(assessmentId || ""))}`,
                        )
                      }
                      className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 whitespace-nowrap"
                    >
                      View Customized Development Plans (CDP)
                    </button>
                    {/* Retake Survey — commented out per product request; restore if needed.
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/pastor/Assessments/guidelines?assessmentId=${encodeURIComponent(String(assessmentId || ""))}`,
                        )
                      }
                      className="rounded-lg border border-[#a78bfa]/50 bg-[#a78bfa]/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a78bfa]/30 whitespace-nowrap"
                    >
                      Retake Survey
                    </button>
                    */}
                  </div>
                ) : null}
              </div>

              <div className="space-y-5 text-sm sm:space-y-6 sm:text-[15px]">
                {sections[activeSection]?.layers?.map((layer: any, layerIndex: number) => {
                  const layerId = resolveLayerKey(layer, activeSection, layerIndex);
                  return (
                    <div
                      key={layerId}
                      className="space-y-3 rounded-2xl border border-[#8ec5eb]/25 bg-[linear-gradient(180deg,rgba(12,58,95,0.55)_0%,rgba(9,49,80,0.72)_100%)] p-4 sm:p-5 shadow-[0_8px_32px_rgba(2,20,40,0.35)]"
                    >
                      <h4 className="mb-1 text-base font-semibold text-white sm:text-lg">
                        {layer.question ||
                          layer.title ||
                          sections[activeSection].name ||
                          sections[activeSection].title ||
                          "Question"}
                      </h4>

                      {layer.choices?.map((choice: any, ci: number) => {
                        const choiceKey = String(choice._id ?? choice.value ?? choice.label ?? `c_${ci}`);
                        const choiceLabel = choice.label ?? choice.text ?? String(choice.value ?? "");
                        const ordinalValue = String(ci + 1);
                        const isChecked =
                          answers[layerId] === choiceKey ||
                          answers[layerId] === ordinalValue ||
                          (choice.value != null && answers[layerId] === String(choice.value)) ||
                          (choice.label != null && answers[layerId] === String(choice.label));
                        return (
                          <label
                            key={`${layerId}-${choiceKey}-${ci}`}
                            className={`flex items-start gap-3 rounded-lg border px-2 py-1 transition ${
                              isChecked
                                ? "border-[#8ec5eb]/60 bg-[#8ec5eb]/15 shadow-[0_0_0_1px_rgba(142,197,235,0.2)]"
                                : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                            } ${uiReadOnly ? "cursor-default" : "cursor-pointer"}`}
                          >
                            <input
                              type="radio"
                              name={layerId}
                              readOnly={uiReadOnly}
                              disabled={uiReadOnly}
                              checked={isChecked}
                              onChange={() => handleCheck(layerId, choiceKey)}
                              className="mt-1 h-4 w-4 shrink-0 accent-[#8ec5eb]"
                            />

                            <span className="leading-relaxed text-[#e8f4fc]">{choiceLabel}</span>
                          </label>
                        );
                      })}
                      {(() => {
                        if (!canShowPastorCdp) return null;
                        const cdp = (
                          mentorLayerCdp[layerId] ||
                          (layer.layerId != null && mentorLayerCdp[String(layer.layerId)]) ||
                          (layer._id != null && mentorLayerCdp[String(layer._id)]) ||
                          ""
                        ).trim();
                        if (!cdp) return null;
                        return (
                          <div className="mt-4 rounded-xl border border-[#8ec5eb]/35 bg-[#041f35]/80 p-3 text-sm sm:p-4">
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#8ec5eb]">
                              Customized Development Plan (CDP)
                            </p>
                            <p className="whitespace-pre-line leading-relaxed text-[#d9ebf8]">{cdp}</p>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>

              <div className="mt-10 flex flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* <button
                  type="button"
                  onClick={handlePrev}
                  disabled={activeSection === 0}
                  className={`rounded-lg border px-5 py-2.5 text-sm font-semibold transition sm:px-6 ${
                    activeSection === 0
                      ? "cursor-not-allowed border-white/10 text-[#cde2f2]/40"
                      : "border-white/25 bg-white/10 text-[#cde2f2] hover:bg-white/15"
                  }`}
                >
                  <i className="fa-solid fa-angle-left mr-2" aria-hidden />
                  View Previous Section
                </button> */}
                <div className="flex flex-col gap-3 sm:flex-row">
  <button
    type="button"
    onClick={handlePrev}
    disabled={activeSection === 0}
    className={`rounded-lg border px-5 py-2.5 text-sm font-semibold transition sm:px-6 ${
      activeSection === 0
        ? "cursor-not-allowed border-white/10 text-[#cde2f2]/40"
        : "border-white/25 bg-white/10 text-[#cde2f2] hover:bg-white/15"
    }`}
  >
    <i className="fa-solid fa-angle-left mr-2" aria-hidden />
    View Previous Section
  </button>

  {!uiReadOnly && (
    <button
      type="button"
      onClick={handleClearResponses}
      disabled={Object.keys(answers).length === 0}
      className="rounded-lg border border-red-300/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-40 sm:px-6"
    >
      Clear response
    </button>
  )}
</div>

                {activeSection === sections.length - 1 ? (
                  uiReadOnly ? (
                    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-end">
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-[#0f4a76] transition hover:bg-[#e7f1fa]"
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmitSurvey}
                      className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-[#0f4a76] transition hover:bg-[#e7f1fa]"
                    >
                      Submit Survey
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-[#0f4a76] transition hover:bg-[#e7f1fa]"
                  >
                    View Next Section <i className="fa-solid fa-angle-right ml-2" aria-hidden />
                  </button>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* ✅ New Popups & Side Drawer */}
      {showSubmitPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,16,30,0.72)] backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-[#8ec5eb]/30 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] px-10 py-6 text-white shadow-[0_20px_60px_rgba(2,20,38,0.55)]">
            <i className="fa-solid fa-circle-check text-[#7be495] text-2xl"></i>
            <p className="font-medium">Survey Submitted Successfully</p>
          </div>
        </div>
      )}

      {showMentorSidebar && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(2,16,30,0.72)] backdrop-blur-sm">
          <div className="h-full w-full max-w-[480px] overflow-y-auto border-l border-white/15 bg-[linear-gradient(180deg,#062946_0%,#041f35_100%)] p-6 text-white shadow-[-20px_0_50px_rgba(2,20,38,0.55)] sm:p-8">
            {mentorStep === 1 ? (
              <>
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Choose Mentor for the Meeting</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMentorSidebar(false);
                      setScheduleTitle("");
                      setScheduleDescription("");
                      router.push("/pastor/Assessments");
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-[#d8ecfa] transition hover:bg-white/10 hover:text-white"
                    aria-label="Close mentor chooser"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
                {mentors.length === 0 ? (
                  <p className="text-[#cbe6f9]">No mentors assigned.</p>
                ) : (
                  mentors.map((mentor) => (
                    <div
                      key={mentor._id || mentor.id}
                      className="mb-3 flex cursor-pointer items-center justify-between rounded-xl border border-white/15 bg-white/5 p-3 transition hover:bg-white/10"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={mentor.profilePicture || "/user-avatar.png"}
                          alt="mentor"
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-medium text-sm">{mentor.name || `${mentor.firstName || ''} ${mentor.lastName || ''}`.trim()}</p>
                          <p className="text-xs text-[#cbe6f9]">Mentor</p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="mentor"
                        checked={selectedMentor === (mentor._id || mentor.id)}
                        onChange={() => setSelectedMentor(mentor._id || mentor.id)}
                      />
                    </div>
                  ))
                )}
                <div className="flex justify-between gap-3">
                  {/* <button
                    onClick={() => { setShowMentorSidebar(false); router.push("/pastor/Assessments"); }}
                    className="rounded-xl border border-white/30 px-5 py-2 text-sm font-semibold text-[#d8ecfa] transition hover:bg-white/10"
                  >
                    Skip
                  </button> */}
                  <button
                    onClick={() => setMentorStep(2)}
                    disabled={!selectedMentor || mentors.length === 0}
                    className={`rounded-xl px-6 py-2 text-sm font-semibold ${selectedMentor && mentors.length > 0 ? "bg-[#8ec5eb] text-[#062946] hover:bg-[#a9d5f2]" : "cursor-not-allowed bg-white/20 text-white/60"}`}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Schedule a Meeting</h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMentorSidebar(false);
                      setScheduleTitle("");
                      setScheduleDescription("");
                      router.push("/pastor/Assessments");
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-[#d8ecfa] transition hover:bg-white/10 hover:text-white"
                    aria-label="Close schedule drawer"
                  >
                    <i className="fa-solid fa-xmark" />
                  </button>
                </div>
                {selectedMentor && (
                  <p className="mb-6 text-sm text-[#cbe6f9]">
                    Scheduling meeting with {mentors.find(m => (m._id || m.id) === selectedMentor)?.name || mentors.find(m => (m._id || m.id) === selectedMentor)?.firstName + " " + mentors.find(m => (m._id || m.id) === selectedMentor)?.lastName || "Selected Mentor"}
                  </p>
                )}

                <div className="mb-6">
                  <label htmlFor="assessment-meeting-title" className="block text-sm font-medium mb-3 text-white">
                    Meeting Title
                  </label>
                  <input
                    id="assessment-meeting-title"
                    type="text"
                    value={scheduleTitle}
                    onChange={(e) => setScheduleTitle(e.target.value)}
                    placeholder="Enter meeting title"
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/45 outline-none transition focus:border-[#8ec5eb]/60 focus:ring-2 focus:ring-[#8ec5eb]/25"
                  />
                </div>

                <div className="mb-6">
                  <label htmlFor="assessment-meeting-description" className="block text-sm font-medium mb-3 text-white">
                    Meeting Description <span className="font-normal text-white/50">(optional)</span>
                  </label>
                  <textarea
                    id="assessment-meeting-description"
                    value={scheduleDescription}
                    onChange={(e) => setScheduleDescription(e.target.value)}
                    placeholder="Add meeting details"
                    rows={3}
                    className="w-full resize-none rounded-xl border border-white/20 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/45 outline-none transition focus:border-[#8ec5eb]/60 focus:ring-2 focus:ring-[#8ec5eb]/25"
                  />
                </div>
                
                {/* Calendar Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3 text-white">Select Date</label>
                  
                  {/* Month/Year Navigation */}
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => {
                        if (currentMonth === 1) {
                          setCurrentMonth(12);
                          setCurrentYear(currentYear - 1);
                        } else {
                          setCurrentMonth(currentMonth - 1);
                        }
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition"
                    >
                      <i className="fa-solid fa-chevron-left text-[#8ec5eb]"></i>
                    </button>
                    <p className="text-sm font-semibold text-white">
                      {new Date(currentYear, currentMonth - 1).toLocaleDateString('en-US', { month: 'long' })}
                    </p>
                    <button
                      onClick={() => {
                        if (currentMonth === 12) {
                          setCurrentMonth(1);
                          setCurrentYear(currentYear + 1);
                        } else {
                          setCurrentMonth(currentMonth + 1);
                        }
                      }}
                      className="p-2 hover:bg-white/10 rounded-lg transition"
                    >
                      <i className="fa-solid fa-chevron-right text-[#8ec5eb]"></i>
                    </button>
                  </div>
                  
                  {/* Day Headers */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                      <div key={day} className="text-center text-xs font-semibold text-[#8ec5eb] py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const daysInMonth = getDaysInMonth(currentYear, currentMonth);
                      const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
                      const days = [];
                      
                      // Empty cells for days before month starts
                      for (let i = 0; i < firstDay; i++) {
                        days.push(<div key={`empty-${i}`} className="p-2"></div>);
                      }
                      
                      // Calendar days
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isPast = isPastDate(dateStr);
                        const isSelected = selectedDate === dateStr;
                        const hasSlots = hasAvailability(dateStr, availability);
                        
                        days.push(
                          <button
                            key={day}
                            onClick={() => {
                              if (!isPast) {
                                setSelectedDate(dateStr);
                                setSelectedTime("");
                                const times = getTimesForDate(dateStr, availability);
                                setAvailableTimes(times);
                              }
                            }}
                            disabled={isPast}
                            className={`relative p-2 rounded-lg text-sm font-medium transition ${
                              isPast
                                ? 'cursor-not-allowed text-white/30 bg-white/5'
                                : isSelected
                                ? 'bg-[#8ec5eb] text-[#062946] font-semibold shadow-lg shadow-[#8ec5eb]/40'
                                : hasSlots
                                ? 'border-2 border-[#8ec5eb] text-white bg-[#8ec5eb]/15 hover:bg-[#8ec5eb]/25 shadow-md shadow-[#8ec5eb]/20 font-semibold'
                                : 'text-[#cbe6f9] hover:bg-white/10 bg-white/5'
                            }`}
                          >
                            {day}
                            {hasSlots && !isSelected && (
                              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#7be495] rounded-full"></div>
                            )}
                          </button>
                        );
                      }
                      
                      return days;
                    })()}
                  </div>
                  
                  {availability.length === 0 && (
                    <p className="mt-4 text-xs text-[#cbe6f9] text-center">No availability data for this mentor.</p>
                  )}
                </div>
                
                {/* Time Selection */}
                {selectedDate && (
                  <div className="mb-6 p-3 rounded-xl border border-white/15 bg-white/5">
                    <label className="block text-sm font-medium mb-3 text-white">Select Time</label>
                    {availableTimes.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {availableTimes.map((t, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedTime(t)}
                            className={`rounded-lg border py-2 px-2 text-xs transition ${selectedTime === t ? "border-[#8ec5eb] bg-[#8ec5eb]/20 text-white font-medium" : "border-white/20 bg-white/5 text-[#d8ecfa] hover:bg-white/10"}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-[#cbe6f9]">No available times for this date. Please select another date.</p>
                    )}
                  </div>
                )}
                
                {/* <div className="flex justify-between gap-3">
                  <button
                    onClick={() => {
                      setMentorStep(1);
                      setSelectedDate("");
                      setSelectedTime("");
                      setAvailableTimes([]);
                    }}
                    className="flex-1 rounded-xl border border-white/30 px-5 py-2 text-[#d8ecfa] transition hover:bg-white/10"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => { setShowMentorSidebar(false); router.push("/pastor/Assessments"); }}
                    className="flex-1 rounded-xl border border-white/30 px-5 py-2 text-[#d8ecfa] transition hover:bg-white/10"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleFinalSchedule}
                    disabled={!selectedDate || !selectedTime}
                    className={`flex-1 rounded-xl px-6 py-2 text-sm font-semibold transition ${selectedDate && selectedTime ? "bg-[#8ec5eb] text-[#062946] hover:bg-[#a9d5f2]" : "cursor-not-allowed bg-white/20 text-white/60"}`}
                  >
                    Schedule Meeting
                  </button>
                </div> */}
                <div className="flex justify-end">
  <button
    onClick={handleFinalSchedule}
    disabled={!selectedDate || !selectedTime}
    className={`rounded-xl px-8 py-3 text-sm font-semibold transition ${
      selectedDate && selectedTime
        ? "bg-[#8ec5eb] text-[#062946] hover:bg-[#a9d5f2]"
        : "cursor-not-allowed bg-white/20 text-white/60"
    }`}
  >
    Schedule Meeting
  </button>
</div>
              </>
            )}
          </div>
        </div>
      )}

      {showFinalPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(2,16,30,0.72)] backdrop-blur-sm">
          <div className="mx-4 w-full max-w-[420px] rounded-2xl border border-[#8ec5eb]/30 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] px-8 py-8 text-center text-white shadow-[0_20px_60px_rgba(2,20,38,0.55)]">
            <div className="flex items-center justify-center gap-3 mb-4">
              <i className="fa-solid fa-circle-check text-[#7be495] text-2xl"></i>
              <p className="font-medium">New Appointment has been Scheduled</p>
            </div>
            <div className="mb-4 flex items-center justify-center gap-3">
              {/* <button
                onClick={() => setShowMeetingDetails((prev) => !prev)}
                className="rounded-xl border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                {showMeetingDetails ? "Hide Meeting Details" : "Meeting Details"}
              </button> */}
            </div>
            {showMeetingDetails && (
              <div className="mb-4 rounded-xl border border-white/20 bg-white/10 p-4 text-left text-sm text-[#d8ecfa]">
                <p><span className="font-semibold text-white">Mentor:</span> {mentors.find((m) => (m._id || m.id) === selectedMentor)?.name || `${mentors.find((m) => (m._id || m.id) === selectedMentor)?.firstName || ""} ${mentors.find((m) => (m._id || m.id) === selectedMentor)?.lastName || ""}`.trim() || "Selected Mentor"}</p>
                <p><span className="font-semibold text-white">Date:</span> {selectedDate || "N/A"}</p>
                <p><span className="font-semibold text-white">Time:</span> {selectedTime || "N/A"}</p>
                <p><span className="font-semibold text-white">Platform:</span> Zoom</p>
                {scheduledAppointmentId && (
                  <p><span className="font-semibold text-white">Appointment ID:</span> {scheduledAppointmentId}</p>
                )}
              </div>
            )}
            <button
              // onClick={() => {
              //   setShowFinalPopup(false);
              //   setShowMeetingDetails(false);
              //   setShowMentorSidebar(false);
              //   router.push("/pastor/Assessments");
              // }}
              onClick={() => {
  setShowFinalPopup(false);
  setShowMeetingDetails(false);
  setShowMentorSidebar(false);
  setScheduleTitle("");
  setScheduleDescription("");

  if (assessmentId && routeRoadmapId && routeTaskId) {
    const q = new URLSearchParams({
      assessmentId,
      roadmapId: routeRoadmapId,
      taskId: routeTaskId,
    });

    router.push(`/pastor/Assessments/guidelines?${q.toString()}`);
    return;
  }

  router.push("/pastor/Assessments");
}}
              className="w-full rounded-xl bg-[#8ec5eb] px-6 py-2 text-sm font-semibold text-[#062946] transition hover:bg-[#a9d5f2]"
            >
              Done
            </button>
          </div>
        </div>
      )}
{showClearConfirm && (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(2,16,30,0.72)] px-4 backdrop-blur-sm">
    <div className="w-full max-w-md rounded-2xl border border-[#8ec5eb]/30 bg-[linear-gradient(180deg,#0f4a76_0%,#062946_100%)] p-6 text-white shadow-[0_20px_60px_rgba(2,20,38,0.55)]">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-200">
          <i className="fa-solid fa-triangle-exclamation" />
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white">
            Clear responses?
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-[#cde2f2]">
            This will remove all selected answers on this screen. Saved answers will not change until you submit again.
          </p>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => setShowClearConfirm(false)}
          className="rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={confirmClearResponses}
          className="rounded-xl border border-red-300/30 bg-red-500/20 px-5 py-2.5 text-sm font-semibold text-red-50 transition hover:bg-red-500/30"
        >
          Clear response
        </button>
      </div>
    </div>
  </div>
)}
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 right-8 z-[70] animate-fade-in">
          <div className="flex items-center gap-3 rounded-xl border border-[#8ec5eb]/30 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] px-6 py-4 shadow-2xl">
            <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#d95d5d]">
              <i className="fa-solid fa-exclamation-triangle text-white text-xs"></i>
            </div>
            <span className="font-semibold text-white">{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PastorSurveyCMA() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-[#062946] text-white">
          <PastorHeader showFullHeader={true} />
          <div className="flex flex-1 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent" />
          </div>
        </div>
      }
    >
      <PastorSurveyCMAContent />
    </Suspense>
  );
}
