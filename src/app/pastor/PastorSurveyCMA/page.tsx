"use client";
import { useEffect, useState, Suspense } from "react";
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
import { getCookie } from "@/app/utils/cookies";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import {
  apiCreateAppointment,
  apiGetMonthlyAvailability,
} from "@/app/Services/appointments.service";
import axiosInstance from "@/app/Services/config/axios-instance";
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
  const head = s.match(/^(\d{4}-\d{2}-\d{2})/);
  if (head) return head[1];
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-CA");
}

function unwrapMonthlyAvailabilityPayload(availRes: { data?: unknown }): any[] {
  const body = availRes?.data as Record<string, unknown> | undefined;
  if (!body) return [];
  const inner = body.data;
  if (Array.isArray(inner)) return inner;
  if (inner && typeof inner === "object") {
    const o = inner as Record<string, unknown>;
    if (Array.isArray(o.days)) return o.days as any[];
    if (Array.isArray(o.slots)) return o.slots as any[];
  }
  return [];
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
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("assessmentId");
  const reviewUserId = (searchParams.get("userId") || "").trim();
  /** Mentor opened a review link: ?viewOnly=1&userId=<pastorId> */
  const viewOnlyParam =
    searchParams.get("viewOnly") === "1" ||
    searchParams.get("viewOnly") === "true" ||
    searchParams.get("mode") === "review";
  /** Pastor viewing their own submitted survey (guidelines "View response") — not mentor review */
  const readOnlySelf =
    searchParams.get("readOnly") === "1" || searchParams.get("readOnly") === "true";
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
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);

  // ✅ Added new state for submit & schedule popup flow
  const [showSubmitPopup, setShowSubmitPopup] = useState(false);
  const [showSchedulePrompt, setShowSchedulePrompt] = useState(false);
  const [showMentorSidebar, setShowMentorSidebar] = useState(false);
  const [mentorStep, setMentorStep] = useState(1);
  const [showFinalPopup, setShowFinalPopup] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  /** Mentor Customized Development Plan (CDP) text per layer — from answers doc + GET recommendations. */
  const [mentorLayerCdp, setMentorLayerCdp] = useState<Record<string, string>>({});

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
          const userCookie = getCookie("user");
          if (userCookie) {
            const user = JSON.parse(userCookie) as { id?: string; _id?: string };
            answersUserId = String(user.id || user._id || "");
            if (answersUserId) {
              const mentorsRes = await apiGetAssignedUsers(answersUserId);
              setMentors(mentorsRes.data?.data || []);
            }
          }
        }

        const cdpMap: Record<string, string> = {};

        if (answersUserId) {
          try {
            const answersRes = await apiGetUserAnswers(assessmentId, answersUserId);
            const body = answersRes.data as Record<string, unknown>;
            const inner = (body?.data as Record<string, unknown>) || body;
            const sectionsData = inner?.sections as unknown;
            if (Array.isArray(sectionsData)) {
              const userAnswers: Record<string, string> = {};
              sectionsData.forEach((section: any, sectionIndex: number) => {
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
  }, [assessmentId, viewOnlyParam, reviewUserId]);

  useEffect(() => {
    if (!selectedMentor) {
      setAvailability([]);
      return;
    }
    const fetchAvailability = async () => {
      try {
        const monthStart = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
        let slots: any[] = [];
        try {
          const availRes = await apiGetMonthlyAvailability(selectedMentor, monthStart);
          slots = unwrapMonthlyAvailabilityPayload(availRes);
        } catch {
          const legacy = await axiosInstance.get(`/appointments/availability/${selectedMentor}/month`, {
            params: { year: currentYear, month: currentMonth },
          });
          const raw = legacy.data?.data;
          slots = Array.isArray(raw) ? raw : [];
        }
        setAvailability(slots);
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
        const ymd = slotDateToYmd(slot?.date);
        return ymd === selectedDate;
      });
      if (dateSlot && dateSlot.slots) {
        const times = dateSlot.slots.map((raw: any) => {
          const start = `${raw.startTime} ${String(raw.startPeriod ?? "").toLowerCase()}`;
          const end = `${raw.endTime} ${String(raw.endPeriod ?? "").toLowerCase()}`;
          return `${start} – ${end}`;
        });
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
    }
  };

  const handlePrev = () => {
    if (activeSection > 0) setActiveSection((prev) => prev - 1);
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

    setShowSubmitPopup(true);
    setTimeout(() => {
      setShowSubmitPopup(false);
      setShowSchedulePrompt(true);
    }, 2500);
  };

  const submitAllSectionAnswers = async () => {
    if (uiReadOnly) return;
    const userCookie = getCookie("user");
    if (!userCookie || !assessmentId) return;

    const user = JSON.parse(userCookie) as { id?: string; _id?: string };
    const uid = String(user.id || user._id || "");
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
            selectedChoice: String(selectedValue),
          };
        })
        .filter((layer): layer is { layerId: string; selectedChoice: string } => layer != null);

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

  const handleScheduleMeeting = () => {
    setShowSchedulePrompt(false);
    setShowMentorSidebar(true);
    setSelectedDate("");
    setSelectedTime("");
    setAvailableTimes([]);
  };
  const handleFinalSchedule = async () => {
    if (!selectedDate || !selectedTime || !selectedMentor) {
      setToast("Please select date, time, and mentor");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    const userCookie = getCookie("user");
    if (!userCookie) return;

    const user = JSON.parse(userCookie);

    try {
      // Parse the selected time (format: "10:00 AM – 11:00 AM")
      const timeMatch = selectedTime.match(/^(\d{1,2}):(\d{2})\s+(AM|PM)/);
      if (!timeMatch) {
        setToast("Invalid time format");
        setTimeout(() => setToast(null), 3000);
        return;
      }

      const [, hours, minutes, period] = timeMatch;
      let hour24 = parseInt(hours);
      if (period === 'PM' && hour24 !== 12) hour24 += 12;
      if (period === 'AM' && hour24 === 12) hour24 = 0;

      // Create ISO date string
      const meetingDate = new Date(`${selectedDate}T${hour24.toString().padStart(2, '0')}:${minutes}:00.000Z`);

      const uid = String(user.id || user._id || "");
      if (!uid) return;

      const payload = {
        userId: uid,
        mentorId: selectedMentor,
        meetingDate: meetingDate.toISOString(),
        platform: "zoom",
        notes: "Assessment follow-up meeting",
      };

      await apiCreateAppointment(payload);
      setShowFinalPopup(true);
      setTimeout(() => {
        setShowFinalPopup(false);
        // router.push("/pastor/AssessmentEvaluation");
      }, 2500);
    } catch (err) {
      console.error("Failed to schedule appointment", err);
      setToast("Failed to schedule appointment");
      setTimeout(() => setToast(null), 3000);
    }
  };

  // ✅ Sections 1–5 (kept 100% original)
  // const sections = [
  //   {
  //     title:
  //       "Congregational Well being (biopsychosocial(BPS)/financial/spiritual filter)",
  //     questions: [
  //       {
  //         title: "Congregational age trend",
  //         options: [
  //           "The church has been aging for the last twenty years.",
  //           "The average age of church members is significantly higher than the surrounding community.",
  //           "The average age of the church has been declining for the last 3–5 years but membership has been on the rise.",
  //           "The church exhibits diversity of generations in attendance and community engagement (CE).",
  //         ],
  //       },
  //       {
  //         title: "Attendance and membership health",
  //         options: [
  //           "Many members are home bound due to illness.",
  //           "Church attendance has been dwindling, especially younger people.",
  //           "The church’s attendance has been increasing for the last three years.",
  //           "The congregation has grown significantly younger in the last few years.",
  //         ],
  //       },
  //       {
  //         title: "Geographic spread of members",
  //         options: [
  //           "Most of the members commute to the church 10+ miles.",
  //           "At least ½ of the church commutes 10+ miles.",
  //           "At least one half of the church members live within 10 miles of the church.",
  //           "The majority of church members live within 10 miles of the church.",
  //         ],
  //       },
  //       {
  //         title: "Weddings vs funerals balance",
  //         options: [
  //           "There are more funerals than weddings and child dedications.",
  //           "There has been about the same number of weddings and child dedications as funerals.",
  //           "In the last few years, there have been more weddings and child dedications than funerals.",
  //           "There are child dedications and weddings taking place almost every month.",
  //         ],
  //       },
  //       {
  //         title: "Volunteer participation (10/90 rule)",
  //         options: [
  //           "Many members feel burnt out (10/90 rule).",
  //           "The 10/90 rule of volunteer participation is very evident.",
  //           "The congregational volunteer participation ratio is about 20/80.",
  //           "The congregational volunteer participation is about 50%—at least half of members volunteer somewhere.",
  //         ],
  //       },
  //       {
  //         title: "Leadership feedback climate",
  //         options: [
  //           "Leaders hear a lot of complaints about the church and its leadership.",
  //           "Members are concerned about the future of the church.",
  //           "Members and attendees feel hopeful about the future of the church.",
  //           "Members and attendees are excited inviting friends to church services or events.",
  //         ],
  //       },
  //     ],
  //   },
  //   {
  //     title: "Leadership (Elders, CB, etc.) Style",
  //     questions: [
  //       {
  //         title: "CB focus and ministry orientation",
  //         options: [
  //           "The CB spends most of its time and energy focusing on operations instead of ministries or evangelism.",
  //           "The CB dedicates at least ½ its time and energy discussing ways to demonstrate Christ to neighboring communities.",
  //           "The CB dedicates most of its time and efforts to transformative methods of evangelism (CMA).",
  //         ],
  //       },
  //       {
  //         title: "CB meeting climate",
  //         options: [
  //           "The CB meetings are tense, reflecting divisions in the church.",
  //           "The CB meetings feel formal and uninspiring.",
  //           "The CB meetings always keep in mind the church’s vision and mission.",
  //           "The CB meetings are full of energy and grace—the board members look forward to spending time with one another.",
  //         ],
  //       },
  //       {
  //         title: "CB unity and representation",
  //         options: [
  //           "The CB is not representative of all of the church’s constituencies, and its members don’t share the same vision & mission.",
  //           "Not all CB members are subscribed to the church’s vision and mission.",
  //           "The CB is united regarding the church’s vision and mission.",
  //           "All board members are on the same page regarding the church’s vision and mission and have developed a CB playbook (practical implementation).",
  //         ],
  //       },
  //       {
  //         title: "Leadership representation & focus",
  //         options: [
  //           "The elders spend most of their time 'putting out fires'.",
  //           "The CB is not representative of younger members of the congregation.",
  //           "At least half of the church’s life is oriented toward serving the community.",
  //           "The overall focus of the leadership is directed toward transformative presence in the community.",
  //         ],
  //       },
  //     ],
  //   },
  //   {
  //     title: "Community Engagement History",
  //     questions: [
  //       {
  //         title: "CMA partnerships & understanding",
  //         options: [
  //           "The church has no consistent partnerships with non-Adventist organizations.",
  //           "Church does not fully understand the CMA approach in relationship to evangelism.",
  //           "The congregation fully embraces the CMA approach in ministry and evangelism.",
  //           "The church fully implements the CMA approach in all areas of its life— inwardly and outwardly.",
  //         ],
  //       },
  //       {
  //         title: "Community collaboration & outreach",
  //         options: [
  //           "The church solely focuses on addressing the needs of its members.",
  //           "Some sporadic relationships with local community influencers and players.",
  //           "The church conspicuously participates in the community life outside of the church.",
  //           "The church has a designated leadership role for organizing community life outside of the church—this leader conducts formal training classes/workshops on CE for other churches.",
  //         ],
  //       },
  //       {
  //         title: "Focus of community service",
  //         options: [
  //           "The church is too focused on addressing the needs of its members & does not participate in community engagement.",
  //           "The community services feel more like proselytizing through distribution of goods than fostering relationships.",
  //           "The community services provide ample volunteer opportunities for people outside of the church.",
  //           "Many unchurched community-service volunteers become interested in the life of the church.",
  //         ],
  //       },
  //       {
  //         title: "Church–community awareness",
  //         options: [
  //           "Church members can’t accurately name the most pressing community issues in the surrounding area.",
  //           "Only very few of the church’s members participate in the life of the community outside of the church.",
  //           "The church has good relationships with local businesses; a few church members hold prominent leadership roles in community service organizations outside the church.",
  //           "Engaged in joint ventures with local businesses, government entities, and other non-profits.",
  //         ],
  //       },
  //       {
  //         title: "Education partnerships",
  //         options: [
  //           "No active partnerships exist with neighboring educational institutions.",
  //           "Only a few students and faculty members from neighboring higher education institutions participate in the life of church.",
  //           "The church actively engages students and faculty from local higher education institutions.",
  //           "The church has formal partnerships/joint projects with neighboring higher education institutions.",
  //         ],
  //       },
  //       {
  //         title: "Community perception of the church",
  //         options: [
  //           "Neighbors have no knowledge or hold a negative view of the church.",
  //           "Neighbors barely recognize/are only vaguely aware of the church.",
  //           "Many neighbors are aware and hold a positive view of the church.",
  //           "The church does not see itself existing without being actively present in the lives of its neighbors.",
  //         ],
  //       },
  //     ],
  //   },
  //   {
  //     title: "Pastoral Leadership",
  //     questions: [
  //       {
  //         title: "Pastor–church relationship",
  //         options: [
  //           "The pastor feels they have to speak at (confronting) the congregation rather than for (inspiring) the congregation.",
  //           "The pastor feels they have to constantly mediate between factions at the church.",
  //           "The pastor spends most of their time empowering church leaders.",
  //           "The pastor spends most of their time mentoring and being mentored.",
  //         ],
  //       },
  //       {
  //         title: "Pastor support and team dynamics",
  //         options: [
  //           "The pastor doesn’t feel supported by the majority of the church leaders.",
  //           "Church members feel like the pastor is apathetic—it feels like the pastor does only what is required to tick off church metrics but their heart and soul do pastoral ministry.",
  //           "The church members feel the positive energy and passion exhibited by the pastor.",
  //           "The pastor inspires and leads other pastors and partners in community-transformation initiatives and projects.",
  //         ],
  //       },
  //       {
  //         title: "Pastor engagement and time usage",
  //         options: [
  //           "The pastor does not spend personal time with all of the church’s leaders, only engages those with whom they feel safe.",
  //           "The pastor interacts with a limited number of people.",
  //           "The pastor consistently seeks new ways to integrate CMA approach in their ministry; however, they do most of the work by themselves.",
  //           "The pastor is an exemplar of the CMA approach—they cultivate open, trusting, and nurturing social environments—always acknowledging opportunities for growth and celebrating achievements.",
  //         ],
  //       },
  //       {
  //         title: "Pastor’s focus and priorities",
  //         options: [
  //           "The most of the pastor’s time is spent on dealing with internal issues and conflicts.",
  //           "The pastor spends at least 75% of their time dealing with the internal church issues and conflicts.",
  //           "The pastor is intentional (dedicating at least 25% of their time) about fostering relationships within the church’s formal and informal leaders—they live very little socially in the church.",
  //           "The pastor is deeply involved in the life of the surrounding community, developing pastoral accountability circles inside and outside of church—they are accountable to lay members and denominational leadership while advising them on the issues of leadership and spiritual personal growth.",
  //         ],
  //       },
  //       {
  //         title: "Pastor’s community engagement",
  //         options: [
  //           "The pastor doesn’t have any formal community engagement/services training/certification.",
  //           "Very limited community engagement/services training/certification.",
  //           "The pastor is enrolled to obtain formal training in the area of CE.",
  //           "The pastor trains other pastors and leaders in the area of CE through the CMA.",
  //         ],
  //       },
  //       {
  //         title: "Pastor’s church growth vision",
  //         options: [
  //           "The pastor doesn’t have a clear church growth strategy.",
  //           "The pastor has a vision for the church but doesn’t have energy or support to adequately enact it.",
  //           "The pastor consistently makes efforts to communicate the church’s vision and mission in the light of the CMA.",
  //           "The pastor is committed to encompassing CMA and the Cycle of Evangelism.",
  //         ],
  //       },
  //       {
  //         title: "Preaching and motivation style",
  //         options: [
  //           "Preaching can be described as uninspiring and mostly moralistic (propositional and patronizing).",
  //           "Preaching can be described as 'speaking at (confronting)' people rather than 'for (inspiring)' the people.",
  //           "Preaching is Christ-centered, inspiring, and transformational rather than moralistic and prescriptive; the pastor speaks for the people, expressing a deep understanding of the needs of the community.",
  //           "Preaching intentionally incorporates the CMA and CE principles; the pastor raises and equips other pastors in the Christ-centered manner.",
  //         ],
  //       },
  //       {
  //         title: "Pastor’s calling and motivation",
  //         options: [
  //           "If called somewhere else the pastor would leave the church without hesitation.",
  //           "If called somewhere else the pastor would give it serious consideration.",
  //           "The pastor shows deep care for church leaders and community stakeholders.",
  //           "The pastor can’t see themselves being anywhere else but with the church and the community in which they currently serve.",
  //         ],
  //       },
  //     ],
  //   },
  //   {
  //     title: "Christ’s Method Alone (CMA) and Cycle of Evangelism",
  //     questions: [
  //       {
  //         title: "Understanding and practice of CMA",
  //         options: [
  //           "CMA is not embodied in the life of the church",
  //           "Church does not fully understanding the CMA approach in relationship to evangelism",
  //           "Congregation has a good grasp but has not fully implemented practices of CMA",
  //           "The church is fully committed to and practices the CMA approach",
  //         ],
  //       },
  //       {
  //         title: "Evangelism and community integration",
  //         options: [
  //           "Little variety in methods of evangelism over the last twenty years",
  //           "There is no connection between evangelism efforts and the community engagement",
  //           "The church sees CE as a transformative form of evangelism rather than a transactional activity",
  //           "The church has a clear plan for further growth and transformative development",
  //         ],
  //       },
  //       {
  //         title: "Service and mission alignment",
  //         options: [
  //           "Serving the community is not considered to be the focus of the church’s life and ministries",
  //           "Only a few members see the vitality of the service to the community as an integral part of evangelistic foci",
  //           "The church members share a vision of embodying CMA as the future of church",
  //           "The church is networked with other congregations, which embody the CMA as its primary guiding principle",
  //         ],
  //       },
  //       {
  //         title: "Community awareness and CE plan",
  //         options: [
  //           "The church has no functional awareness of the surrounding community’s needs",
  //           "The church has only observed some of the community’s needs",
  //           "The church has surveyed the community, assessing its needs and aspirations",
  //           "The church has a practical CE plan for serving its community",
  //         ],
  //       },
  //     ],
  //   },
  // ];

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

        <div className="relative z-10 max-w-4xl">
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
              <p className="mb-6 max-w-2xl text-sm leading-relaxed text-[#cde2f2]">
                Choose the option in each box that best matches how you feel and who you are. Your accuracy allows us
                to provide the best support and guidance.
              </p>

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
                        const isChecked =
                          answers[layerId] === choiceKey ||
                          (choice.value != null && answers[layerId] === String(choice.value)) ||
                          (choice.label != null && answers[layerId] === String(choice.label));
                        return (
                          <label
                            key={`${layerId}-${choiceKey}-${ci}`}
                            className={`flex items-start gap-3 rounded-lg border border-transparent px-1 py-0.5 transition hover:border-white/10 hover:bg-white/[0.04] ${uiReadOnly ? "cursor-default" : "cursor-pointer"}`}
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
                        const selectedAns = answers[layerId];
                        const fromApi =
                          mentorLayerCdp[layerId] ||
                          (layer.layerId != null && mentorLayerCdp[String(layer.layerId)]) ||
                          (layer._id != null && mentorLayerCdp[String(layer._id)]) ||
                          "";
                        const fromTemplate = pickCdpFromLayerTemplate(layer, selectedAns);
                        const cdp = (fromApi || fromTemplate).trim();
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

                {activeSection === sections.length - 1 ? (
                  uiReadOnly ? (
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-[#0f4a76] transition hover:bg-[#e7f1fa]"
                    >
                      Done
                    </button>
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

      {showSchedulePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,16,30,0.72)] backdrop-blur-sm">
          <div className="mx-4 w-full max-w-[480px] rounded-2xl border border-[#8ec5eb]/30 bg-[linear-gradient(180deg,#0f4a76_0%,#062946_100%)] px-8 py-8 text-center text-white shadow-[0_20px_60px_rgba(2,20,38,0.55)] sm:px-10">
            <p className="font-semibold text-lg mb-4">
              On completion of the PMP and CMA assessment tools please schedule
              a meeting with your mentor.
            </p>
            <button
              onClick={handleScheduleMeeting}
              className="rounded-xl bg-[#8ec5eb] px-8 py-2 text-sm font-semibold text-[#062946] transition hover:bg-[#a9d5f2]"
            >
              Schedule Meeting
            </button>
          </div>
        </div>
      )}

      {showMentorSidebar && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(2,16,30,0.72)] backdrop-blur-sm">
          <div className="h-full w-full max-w-[480px] overflow-y-auto border-l border-white/15 bg-[linear-gradient(180deg,#062946_0%,#041f35_100%)] p-6 text-white shadow-[-20px_0_50px_rgba(2,20,38,0.55)] sm:p-8">
            {mentorStep === 1 ? (
              <>
                <h2 className="text-xl font-semibold mb-6">
                  Choose Mentor for the Meeting
                </h2>
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
                <div className="flex justify-end">
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
                <h2 className="text-xl font-semibold mb-6">
                  Schedule a Meeting
                </h2>
                {selectedMentor && (
                  <p className="mb-4 text-sm text-[#cbe6f9]">
                    Scheduling meeting with {mentors.find(m => (m._id || m.id) === selectedMentor)?.name || mentors.find(m => (m._id || m.id) === selectedMentor)?.firstName + " " + mentors.find(m => (m._id || m.id) === selectedMentor)?.lastName || "Selected Mentor"}
                  </p>
                )}
                <div className="mb-6">
                  <label className="block text-sm mb-2">
                    Select Available Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => {
                      const newDate = e.target.value;
                      setSelectedDate(newDate);
                      setSelectedTime("");
                      const parts = parseYmdParts(newDate);
                      if (parts && (parts.y !== currentYear || parts.m !== currentMonth)) {
                        setCurrentYear(parts.y);
                        setCurrentMonth(parts.m);
                      }
                    }}
                    className="w-full rounded-xl border border-white/20 bg-white/5 p-2 text-white outline-none focus:border-[#8ec5eb]"
                  />
                </div>
                <div className="mb-6">
                  <label className="block text-sm mb-2">Select Time</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availableTimes.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedTime(t)}
                        className={`rounded-xl border py-2 text-sm transition ${selectedTime === t ? "border-[#8ec5eb] bg-[#8ec5eb]/20 text-white" : "border-white/20 bg-white/5 text-[#d8ecfa] hover:bg-white/10"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                  {selectedDate && availableTimes.length === 0 && (
                    <p className="mt-2 text-sm text-[#cbe6f9]">No available times for this date.</p>
                  )}
                </div>
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setMentorStep(1);
                      setSelectedDate("");
                      setSelectedTime("");
                      setAvailableTimes([]);
                    }}
                    className="rounded-xl border border-white/30 px-5 py-2 text-[#d8ecfa] transition hover:bg-white/10"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleFinalSchedule}
                    disabled={!selectedDate || !selectedTime}
                    className={`rounded-xl px-6 py-2 text-sm font-semibold ${selectedDate && selectedTime ? "bg-[#8ec5eb] text-[#062946] hover:bg-[#a9d5f2]" : "cursor-not-allowed bg-white/20 text-white/60"}`}
                  >
                    Schedule
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showFinalPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[rgba(2,16,30,0.72)] backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-2xl border border-[#8ec5eb]/30 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] px-10 py-6 text-white shadow-[0_20px_60px_rgba(2,20,38,0.55)]">
            <i className="fa-solid fa-circle-check text-[#7be495] text-2xl"></i>
            <p className="font-medium">New Appointment has been Scheduled</p>
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
