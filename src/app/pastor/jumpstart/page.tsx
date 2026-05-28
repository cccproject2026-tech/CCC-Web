"use client";
import { useState, useEffect, useMemo, useCallback, useRef, Suspense, type DragEvent } from "react";
import Image from "next/image";
import { isAxiosError } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorSearchBar from "@/app/Components/pastor/PastorSearchBar";
import AvailabilityCalendar from "@/app/Components/AvailabilityCalendar";
import DirectorHero from "@/app/director/DirectorHero";
import axiosInstance from "@/app/Services/config/axios-instance";
import {
  apiGetUserAnswers,
  apiGetSectionRecommendations,
} from "@/app/Services/assessment.service";
import {
  apiCreateAppointment,
  apiGetAppointments,
  apiGetUserSchedule,
  apiGetWeeklyAvailability,
} from "@/app/Services/appointments.service";
import { apiGetAssignedUsers } from "@/app/Services/users.service";
import {
  extractApiErrorMessage,
  formatAvailabilitySlotLabel,
  meetingDateLocalYmd,
  parseSlotStartToIso,
  slotDateToYmd,
  uiMeetingModeToPlatform,
  unwrapAppointmentsAxiosData,
  unwrapMonthlyAvailabilityPayload,
} from "@/app/Services/appointment-utils";
import {
  filterSlotLabelsAgainstExternalCalendar,
  googleCalendarSuccessHintFromCreateResponse,
} from "@/app/Services/google-calendar-scheduling";
import { getStoredRecommendationsForPastorAssessment } from "@/app/utils/assessment-recommendations";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorPageContainer,
  directorSpinner,
} from "@/app/director/directorUi";
import {
  PastorRoadmapDashboardBody,
  pastorRoadmapDashboardPageRoot,
} from "@/app/pastor/pastor-roadmap-dashboard-shell";
import HeroBg from "@/app/Assets/jumpstart-hero.png";
import UserPlaceholder from "@/app/Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import {
  apiGetRoadmapById,
  apiGetNestedRoadmapItem,
  apiGetExtras,
  apiSaveExtras,
  apiUpdateExtras,
  apiUploadExtrasDocuments,
  apiGetExtrasDocuments,
  apiGetComments,
  apiAddQuery,
  apiGetQueries,
  apiUpdateRoadmapProgress,
  apiGetUserProgress,
  apiTriggerJumpstartComplete,
  apiUpdateNestedRoadmapItem,
  apiUpdateRoadmap,
  apiUpdatePastorQuery,
  apiDeletePastorQuery,
} from "@/app/Services/api";
import {
  deriveTaskStatusForList,
  normalizeRoadmapId,
  unwrapNestedRoadmapsArray,
  unwrapProgressData,
  type RoadmapAssignmentUi,
} from "@/app/Services/roadmap-assignments";
import {
  pastorDarkSelect,
  pastorFieldLabel,
  pastorPrimaryCta,
  pastorRoadmapDescriptionOverview,
} from "@/app/Components/pastor/pastor-theme";
import type { ProgressResponse } from "@/app/Services/types/progress.types";
import { getCookie } from "@/app/utils/cookies";
import { getPastorUserId } from "@/app/utils/pastor-auth";
import { emitProgressUpdated } from "@/app/utils/progress-sync";
import { filterSlotsAfter2Hours } from "@/app/Services/utils/helpers";
import type {
  CommentItem,
  QueryItem,
} from "@/app/Services/roadmaps.service";

function axiosMessage(err: unknown): string {
  if (isAxiosError(err)) {
    const d = err.response?.data as { message?: string | string[] } | undefined;
    const m = d?.message;
    if (typeof m === "string" && m.trim()) return m.trim();
    if (Array.isArray(m)) return m.filter((x) => typeof x === "string").join("; ");
    return err.message || "Request failed.";
  }
  if (err instanceof Error) return err.message;
  return "Request failed.";
}

/**
 * Unwraps GET roadmap / nested-item bodies: axios `res.data` may be
 * `{ success, data }`, nested `data` chains, or a raw document.
 */
function extractRoadmapDocumentFromResponse(res: { data?: unknown }): Record<string, unknown> | null {
  const unwrap = (input: unknown): unknown => {
    if (input == null || typeof input !== "object" || Array.isArray(input)) return input;
    const o = input as Record<string, unknown>;
    if (o.success === false) return null;
    if ("data" in o && o.data !== undefined) return unwrap(o.data);
    return o;
  };
  const doc = unwrap(res?.data);
  if (doc == null || typeof doc !== "object" || Array.isArray(doc)) return null;
  return doc as Record<string, unknown>;
}

/** Same labels as revitalization-roadmap list (progress-derived). */
function formatListStatusLabel(s: RoadmapAssignmentUi["status"]): string {
  if (s === "In-progress") return "In Progress";
  return s;
}

function listStatusBadgeClass(s: RoadmapAssignmentUi["status"]): string {
  switch (s) {
    case "Completed":
      return "border-emerald-400/50 bg-emerald-500/15 text-emerald-100";
    case "In-progress":
      return "border-amber-300/50 bg-amber-500/15 text-amber-100";
    case "Due":
      return "border-rose-400/50 bg-rose-500/15 text-rose-100";
    default:
      return "border-white/20 bg-white/10 text-[#cde2f2]";
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isMongoObjectId(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v.trim());
}

interface ExtraComponent {
  type:
    | "TEXT_DISPLAY"
    | "TEXT_AREA"
    | "TEXT_FIELD"
    | "DATE_PICKER"
    | "UPLOAD"
    | "CHECKBOX"
    | "ASSESSMENT"
    | "SECTION"
    | "SIGNATURE";
  name: string;
  assessmentId?: string;
  /** Populated assessment doc from API (fallback for id). */
  assessment?: unknown;
  /** Director form may store selected assessment object. */
  selectedAssessment?: unknown;
  navigateTo?: string;
  placeHolder?: string;
  buttonName?: string;
  date?: string;
  haveButton?: boolean;
  checkboxes?: ExtraComponent[];
  sections?: ExtraComponent[];
}

/** Director / API may send mixed-case or legacy type strings; jumpstart switch is strict. */
function normalizeExtraType(raw: unknown): ExtraComponent["type"] {
  const t = String(raw ?? "").trim();
  if (!t) return "TEXT_FIELD";
  const u = t.toUpperCase().replace(/\s+/g, "_");
  const aliases: Record<string, ExtraComponent["type"]> = {
    TEXTFIELD: "TEXT_FIELD",
    TEXTAREA: "TEXT_AREA",
    DATEPICKER: "DATE_PICKER",
    TEXTDISPLAY: "TEXT_DISPLAY",
    CHECKBOX_ITEM: "CHECKBOX",
    UPLOADER: "UPLOAD",
    DIGITAL_SIGNATURE: "SIGNATURE",
    SIGNATURE_FIELD: "SIGNATURE",
  };
  const next = aliases[u] ?? (u as ExtraComponent["type"]);
  const legal: ExtraComponent["type"][] = [
    "TEXT_DISPLAY",
    "TEXT_AREA",
    "TEXT_FIELD",
    "DATE_PICKER",
    "UPLOAD",
    "CHECKBOX",
    "ASSESSMENT",
    "SECTION",
    "SIGNATURE",
  ];
  return legal.includes(next) ? next : "TEXT_FIELD";
}

/**
 * Roadmap `extras` type ASSESSMENT may send:
 * - `assessmentId` (string)
 * - populated `assessment: { _id, id }`
 * - `selectedAssessment` from director builder
 */
function resolveAssessmentIdFromExtraShape(extra: ExtraComponent): string | null {
  // const raw = extra as Record<string, unknown>;
  const raw = extra as unknown as Record<string, unknown>;
  const direct = extra.assessmentId ?? raw.assessmentId;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const pickId = (obj: unknown): string | null => {
    if (!obj || typeof obj !== "object" || Array.isArray(obj)) return null;
    const o = obj as Record<string, unknown>;
    const id = o._id ?? o.id ?? o.assessmentId;
    if (id != null && String(id).trim()) return String(id).trim();
    return null;
  };

  const fromAssessment = pickId(raw.assessment) ?? pickId(extra.assessment);
  if (fromAssessment) return fromAssessment;

  const fromSelected = pickId(raw.selectedAssessment) ?? pickId(extra.selectedAssessment);
  if (fromSelected) return fromSelected;

  return null;
}

function normalizeExtraTree(extra: ExtraComponent): ExtraComponent {
  const type = normalizeExtraType((extra as { type?: unknown }).type);
  const out: ExtraComponent = { ...extra, type };
  if (Array.isArray(extra.checkboxes) && extra.checkboxes.length > 0) {
    out.checkboxes = extra.checkboxes.map((c) =>
      normalizeExtraTree({
        ...(c as ExtraComponent),
        type:
          ((c as { type?: unknown }).type != null ? (c as { type?: unknown }).type : "CHECKBOX") as ExtraComponent["type"],
      } as ExtraComponent),
    );
  }
  if (Array.isArray(extra.sections) && extra.sections.length > 0)
    out.sections = extra.sections.map((s) => normalizeExtraTree(s));
  if (out.type === "ASSESSMENT") {
    const id = resolveAssessmentIdFromExtraShape(out);
    if (id) return { ...out, assessmentId: id };
  }
  return out;
}

function findExtraByFieldName(items: ExtraComponent[] | undefined, name: string): ExtraComponent | undefined {
  if (!items?.length) return undefined;
  for (const e of items) {
    if (e.name === name) return e;
    const inSections = findExtraByFieldName(e.sections, name);
    if (inSections) return inSections;
  }
  return undefined;
}

// const UPLOAD_FIELD_ACCEPT =
//   ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const UPLOAD_FIELD_ACCEPT =
  ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.mp4,.mov,.avi,.mkv,.webm,video/*,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const UPLOAD_HINT_LINE =
  "Supported file types: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, PNG, JPG, MP4, MOV, WEBM · Max file size: 10 MB";

// const MAX_PASTOR_UPLOAD_BYTES = 25 * 1024 * 1024;
const MAX_PASTOR_UPLOAD_BYTES = 10 * 1024 * 1024;

function JumpStartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nestedItemId = searchParams.get("id")?.trim() || null;
  const parentRoadmapId = searchParams.get("parentId")?.trim() || null;
  // When coming from SelfRevitalizationPhasePage: id=nestedItemId, parentId=parentRoadmapId
  // For extras/comments/queries the roadmapId is always the parent roadmap ID
  const roadmapId = parentRoadmapId || nestedItemId;

  // Mobile parity (CCC-Mobile `DynamicFormTask.tsx`):
  // Only send `nestedRoadMapItemId` when it is a real Mongo ObjectId.
  const nestedRoadMapItemIdForExtras =
    parentRoadmapId && nestedItemId && isMongoObjectId(nestedItemId) ? nestedItemId : undefined;

  const [activeTab, setActiveTab] = useState("overview");
  const [queryTab, setQueryTab] = useState("New");
  const [roadmap, setRoadmap] = useState<any>(null);
  const [roadmapLoadError, setRoadmapLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [pendingUploadFiles, setPendingUploadFiles] = useState<Record<string, File[]>>({});
  const [savedUploadDocs, setSavedUploadDocs] = useState<
    Record<string, { fileName: string; fileUrl: string; uploadBatchId: string }[]>
  >({});
  const [uploadedNowDocs, setUploadedNowDocs] = useState<
  Record<string, { fileName: string; fileUrl: string; uploadBatchId: string }[]>
>({});
  const [extrasExist, setExtrasExist] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeFeedback, setCompleteFeedback] = useState<string | null>(null);
const [assessmentTaskState, setAssessmentTaskState] = useState<
  Record<
    string,
    {
      submitted: boolean;
      hasCdp: boolean;
    }
  >
>({});
  const today = new Date();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerStep, setDrawerStep] = useState<"mentor" | "schedule">("mentor");
  const [mentorSearch, setMentorSearch] = useState("");
  const [mentors, setMentors] = useState<any[]>([]);
  const [filteredMentors, setFilteredMentors] = useState<any[]>([]);
  const [selectedMentor, setSelectedMentor] = useState<any>(null);
  const [selectedTime, setSelectedTime] = useState("");
  const [schedulePlatform, setSchedulePlatform] = useState("Zoom");
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [availableTimesForBooking, setAvailableTimesForBooking] = useState<any[]>([]);
  const [monthlyAvailabilitySlots, setMonthlyAvailabilitySlots] = useState<any[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [calendarSlotSyncLoading, setCalendarSlotSyncLoading] = useState(false);
  const [calendarSlotSyncError, setCalendarSlotSyncError] = useState<string | null>(null);
  const [calendarSlotSyncSkipped, setCalendarSlotSyncSkipped] = useState(false);
  const [calendarBusyStripped, setCalendarBusyStripped] = useState(0);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [availabilityRefreshKey, setAvailabilityRefreshKey] = useState(0);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleContext, setScheduleContext] = useState<{
    assessmentId: string;
    checkboxKey?: string;
  } | null>(null);
  // Comments
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);

  // Queries
  const [queries, setQueries] = useState<QueryItem[]>([]);
  const [queriesLoading, setQueriesLoading] = useState(false);
  const [queriesCount, setQueriesCount] = useState(0);
  const [newQueryText, setNewQueryText] = useState("");
  const [querySubmitting, setQuerySubmitting] = useState(false);
  const [querySuccess, setQuerySuccess] = useState(false);
  const [pastorEditingQueryId, setPastorEditingQueryId] = useState<string | null>(null);
  const [pastorEditingQueryText, setPastorEditingQueryText] = useState("");
  const [queryActionLoadingId, setQueryActionLoadingId] = useState<string | null>(null);

  // Signature drawing state
  const [signatureModalOpen, setSignatureModalOpen] = useState(false);
  const [activeSignatureField, setActiveSignatureField] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  const [userId, setUserId] = useState("");
  const [sessionDisplayName, setSessionDisplayName] = useState<string | null>(null);
  const [parentPhaseLabel, setParentPhaseLabel] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);
  /** When PATCH succeeds but GET /progress lags or nested rows disagree, still show Completed. */
  const [statusUiOverride, setStatusUiOverride] = useState<RoadmapAssignmentUi["status"] | null>(null);

  /** Director “Insert field” extras: normalize types and keep nested SECTION trees intact. */
  const templateExtras = useMemo((): ExtraComponent[] => {
    const raw = roadmap?.extras;
    if (!Array.isArray(raw)) return [];
    return raw.map((e) => normalizeExtraTree(e as ExtraComponent));
  }, [roadmap?.extras]);

  /** Same as mobile `DynamicFormTask` — POST JUMPSTART_COMPLETE before first extras save. */
  const jumpstartTriggeredRef = useRef(false);
  /** Prevent "empty after save" when backend read is briefly stale. */
  const lastExtrasSaveAtRef = useRef<number>(0);

  useEffect(() => {
    jumpstartTriggeredRef.current = false;
  }, [nestedItemId, parentRoadmapId]);

  useEffect(() => {
    setStatusUiOverride(null);
  }, [nestedItemId, parentRoadmapId]);

  const refetchProgressData = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await apiGetUserProgress(userId);
      setProgressData(unwrapProgressData(res));
    } catch {
      setProgressData(null);
    }
  }, [userId]);

  useEffect(() => {
    const resolved = getPastorUserId()?.trim() || "";
    if (resolved) setUserId(resolved);
    try {
      const u = JSON.parse(getCookie("user") || "{}") as {
        id?: string;
        _id?: string;
        firstName?: string;
        lastName?: string;
        name?: string;
      };
      if (!resolved) setUserId(String(u?.id || u?._id || "").trim());
      const dn =
        [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
        (typeof u.name === "string" ? u.name.trim() : "");
      setSessionDisplayName(dn || null);
    } catch {
      if (!resolved) setUserId("");
      setSessionDisplayName(null);
    }
  }, []);

  useEffect(() => {
    if (!parentRoadmapId) {
      setParentPhaseLabel(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGetRoadmapById(parentRoadmapId);
        const data = extractRoadmapDocumentFromResponse(res);
        const name =
          data && typeof data.name === "string"
            ? data.name.trim()
            : "";
        if (!cancelled) setParentPhaseLabel(name || null);
      } catch {
        if (!cancelled) setParentPhaseLabel(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [parentRoadmapId]);

  useEffect(() => {
    void refetchProgressData();
  }, [refetchProgressData]);

  const listAlignedStatus = useMemo((): RoadmapAssignmentUi["status"] => {
    if (!nestedItemId) return "Not Started";
    if (statusUiOverride) return statusUiOverride;
    const parentId = parentRoadmapId || nestedItemId;
    const itemStatus =
      roadmap?.status != null && String(roadmap.status).trim() !== ""
        ? String(roadmap.status)
        : undefined;
    return deriveTaskStatusForList(progressData, {
      parentRoadmapId: parentId,
      taskId: nestedItemId,
      itemStatus,
      endDate: typeof roadmap?.endDate === "string" ? roadmap.endDate : undefined,
    });
  }, [statusUiOverride, progressData, nestedItemId, parentRoadmapId, roadmap?.status, roadmap?.endDate]);

  const ensureJumpstartTriggered = useCallback(async () => {
    if (!roadmapId || !userId) return;
    // If the extras row already exists, the backend may 400 this POST; no need to trigger.
    if (extrasExist) {
      jumpstartTriggeredRef.current = true;
      return;
    }
    if (jumpstartTriggeredRef.current) return;
    const nestedForExtras =
      parentRoadmapId && nestedItemId?.trim() ? nestedItemId.trim() : undefined;
    try {
      const r = await apiTriggerJumpstartComplete(roadmapId, userId, nestedForExtras);
      if (r?.success || r?.alreadyExists) {
        jumpstartTriggeredRef.current = true;
      }
    } catch (e) {
      console.warn("[Jumpstart trigger] non-blocking:", e);
    }
  }, [roadmapId, userId, parentRoadmapId, nestedItemId, extrasExist]);

  // Mobile parity: defaults only from the task definition itself.
  const buildDefaultFormDataFromTemplate = useCallback((): Record<string, any> => {
    const init: Record<string, any> = {};
    const walk = (list: ExtraComponent[]) => {
      for (const extra of list) {
        if (extra.type === "DATE_PICKER" && typeof extra.date === "string" && extra.date.trim()) {
          init[extra.name] = extra.date.trim().slice(0, 10);
        }
        if (Array.isArray(extra.sections) && extra.sections.length > 0) walk(extra.sections);
      }
    };
    walk(templateExtras);
    return init;
  }, [templateExtras]);

// Prevent roadmap completion when a required signature field is still empty.
  const hasRequiredSignature = useMemo(() => {
  const checkExtras = (
    items: ExtraComponent[] | undefined,
    parentFieldKey = "",
  ): boolean => {
    if (!items?.length) return true;

    for (const extra of items) {
      const fieldKey = extra.name;

      if (extra.type === "SIGNATURE") {
        if (!formData[fieldKey]) return false;
      }

      if (extra.checkboxes?.length) {
        if (!checkExtras(extra.checkboxes, fieldKey)) return false;
      }

      if (extra.type === "SECTION" && extra.sections?.length) {
        if (!checkExtras(extra.sections, fieldKey)) return false;
      }
    }

    return true;
  };

  return checkExtras(templateExtras, "extra");
}, [templateExtras, formData]);
// Prevent roadmap completion when a required upload field has no uploaded or saved file.
const hasRequiredUploads = useMemo(() => {
  const checkExtras = (
    items: ExtraComponent[] | undefined,
    parentFieldKey = "",
  ): boolean => {
    if (!items?.length) return true;

    for (const extra of items) {
      const fieldKey = extra.name;

      if (extra.type === "UPLOAD") {
        const hasPending = (pendingUploadFiles[fieldKey]?.length ?? 0) > 0;
        const hasUploadedFile = hasPending;
        const hasSavedUpload =
          formData[fieldKey] === true ||
          formData[fieldKey] === "true" ||
          (savedUploadDocs[fieldKey]?.length ?? 0) > 0;

        if (!hasUploadedFile && !hasSavedUpload) return false;
      }

      if (extra.checkboxes?.length) {
        if (!checkExtras(extra.checkboxes, fieldKey)) return false;
      }

      if (extra.type === "SECTION" && extra.sections?.length) {
        if (!checkExtras(extra.sections, fieldKey)) return false;
      }
    }

    return true;
  };

  return checkExtras(templateExtras, "extra");
}, [templateExtras, pendingUploadFiles, formData]);

// Prevent roadmap completion until required task submissions such as text fields,
// text areas, and checkboxes are completed.
const hasRequiredSubmissions = useMemo(() => {
  const checkExtras = (
    items: ExtraComponent[] | undefined,
    parentFieldKey = "",
  ): boolean => {
    if (!items?.length) return true;

    for (const extra of items) {
      const fieldKey = extra.name;
// const metaDateFields = new Set(["Allow pastor to select Date", "Show date on info card"]);

// if (metaDateFields.has(fieldKey)) {
//   continue;
// }
const normalizeMetaName = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const metaDateFields = new Set(["allow pastor to select date", "show date on info card"]);

if (metaDateFields.has(normalizeMetaName(fieldKey))) {
  continue;
}
      if (extra.type === "CHECKBOX") {
        if (!formData[fieldKey]) return false;
      }

      // if (extra.type === "ASSESSMENT") {
      //   if (!formData[fieldKey]) return false;
      // }

      if (extra.type === "TEXT_FIELD" || extra.type === "TEXT_AREA") {
  const value = formData[fieldKey];
  if (value == null || String(value).trim() === "") return false;
}
if (extra.type === "DATE_PICKER") {
  const value = formData[fieldKey];
  if (value == null || String(value).trim() === "") return false;
}

      if (extra.checkboxes?.length) {
        if (!checkExtras(extra.checkboxes, fieldKey)) return false;
      }

      if (extra.type === "SECTION" && extra.sections?.length) {
        if (!checkExtras(extra.sections, fieldKey)) return false;
      }
    }

    return true;
  };

  return checkExtras(templateExtras, "extra");
}, [templateExtras, formData]);

  useEffect(() => {
    if (!nestedItemId) return;
    const fetchRoadmap = async () => {
      try {
        setLoading(true);
        setRoadmapLoadError(null);
        let data: any;
        if (parentRoadmapId) {
          const res = await apiGetNestedRoadmapItem(parentRoadmapId, nestedItemId);
          data = extractRoadmapDocumentFromResponse(res);
          // Some backend deployments return partial nested docs (missing extras). Fallback: merge from parent.roadmaps[].
          const needsExtras =
            !data ||
            !("extras" in data) ||
            !Array.isArray((data as any).extras) ||
            (data as any).extras.length === 0;
          if (needsExtras) {
            try {
              const parentRes = await apiGetRoadmapById(parentRoadmapId);
              const parentDoc = extractRoadmapDocumentFromResponse(parentRes) as any;
              const fromParent = unwrapNestedRoadmapsArray(parentDoc).find(
                (r: any) =>
                  normalizeRoadmapId(r?._id ?? r?.id) === normalizeRoadmapId(nestedItemId),
              );
              if (fromParent && Array.isArray(fromParent.extras) && fromParent.extras.length > 0) {
                data = { ...(data || {}), extras: fromParent.extras };
              }
            } catch {
              // ignore fallback failures
            }
          }
        } else {
          const res = await apiGetRoadmapById(nestedItemId);
          data = extractRoadmapDocumentFromResponse(res);
        }
        if (!data) {
          setRoadmap(null);
          setRoadmapLoadError("This task could not be loaded.");
          return;
        }
        setRoadmap(data);
      } catch (err) {
        console.error("Failed to fetch roadmap", err);
        setRoadmap(null);
        setRoadmapLoadError(
          axiosMessage(err) ||
            "Couldn't load this task. Open it again from the revitalization roadmap.",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmap();
  }, [nestedItemId, parentRoadmapId]);

  // Load saved extras + merge task defaults (mobile-style: name / key / signatureData)
  useEffect(() => {
    if (!roadmapId || !userId || !roadmap) return;
    const loadExtras = async () => {
      const justSaved = Date.now() - lastExtrasSaveAtRef.current < 8_000;

      try {
        const nestedScopeId = nestedRoadMapItemIdForExtras;

        const unwrapExtrasDoc = (res: any): { exists: boolean; rows: any[] } => {
          const data = res?.data?.data || res?.data;
          const rows = data?.extras;
          const exists =
            Boolean(data) &&
            typeof data === "object" &&
            !Array.isArray(data) &&
            (typeof (data as any)?.id === "string" ||
              typeof (data as any)?._id === "string" ||
              typeof (data as any)?.roadMapId === "string");
          return { exists, rows: Array.isArray(rows) ? rows : [] };
        };

        const fetchRowsForScope = async (scope?: string) =>
          unwrapExtrasDoc(await apiGetExtras(roadmapId, userId, scope));

        // Mobile parity: single scope only.
        let fetched = await fetchRowsForScope(nestedScopeId);

        // Mobile parity: backend may take a moment before GET reflects the latest PATCH/POST.
        if (justSaved && fetched.rows.length === 0) {
          for (let attempt = 0; attempt < 2; attempt++) {
            await sleep(650);
            const retried = await fetchRowsForScope(nestedScopeId);
            if (retried.rows.length) {
              fetched = retried;
              break;
            }
          }
        }

        if (fetched.rows.length > 0) {
          // Mobile parity: defaults from template, then override with API extras by `item.name` only.
          const init: Record<string, any> = buildDefaultFormDataFromTemplate();
          fetched.rows.forEach((item: any) => {
            if (String(item.type || "").toUpperCase() === "JUMPSTART_COMPLETE") return;
            if (!item.name) return;
            if (item.type === "SIGNATURE" && item.signatureData != null) {
              init[item.name] = item.signatureData;
            } else if (item.value !== undefined) {
              init[item.name] = item.value;
            }
          });
          setFormData(init);
          setExtrasExist(true);
        } else {
          // Mobile parity + prevent wipe right after save:
          // initialize defaults on first load, but don't overwrite to empty during a stale read.
          if (!justSaved) {
            setFormData(buildDefaultFormDataFromTemplate());
          }
          // If server says an extras doc exists (even with empty extras), treat as update-mode.
          if (!justSaved) setExtrasExist(fetched.exists);
        }
      } catch {
        setFormData(buildDefaultFormDataFromTemplate());
      }
    };
    loadExtras();
  }, [roadmapId, userId, roadmap, nestedRoadMapItemIdForExtras, buildDefaultFormDataFromTemplate]);
  const scopedNestedId = nestedRoadMapItemIdForExtras;
  const queryNestedRoadMapItemId =
    parentRoadmapId && nestedItemId?.trim() ? nestedItemId.trim() : undefined;

  const fetchComments = useCallback(async (showLoader = false) => {
    if (!roadmapId || !userId) return;
    if (showLoader) setCommentsLoading(true);
    try {
      const res = await apiGetComments(roadmapId, userId);
      const thread = res.data?.data || res.data;
      const list = Array.isArray(thread?.comments) ? thread.comments : [];
      setComments(list);
      setCommentsCount(list.length);
    } catch {
      setComments([]);
      setCommentsCount(0);
    } finally {
      if (showLoader) setCommentsLoading(false);
    }
  }, [roadmapId, userId, scopedNestedId]);
  const fetchQueries = useCallback(async (status?: string, showLoader = false) => {
    if (!roadmapId || !userId) return;
    if (showLoader) setQueriesLoading(true);
    try {
      const res = await apiGetQueries(
        roadmapId,
        userId,
        status,
        queryNestedRoadMapItemId,
        "pastor",
      );
      const threads: any[] = res.data?.data || res.data || [];
      const allQueries = Array.isArray(threads)
        ? threads.flatMap((t: any) => t?.queries || [])
        : (threads as any)?.queries || [];
      const scopedQueries = queryNestedRoadMapItemId
        ? allQueries.filter((q: any) => {
            const qTaskId = String(q.nestedRoadMapItemId || q.nestedItemId || q.taskId || q.roadmapItemId || "");
            return qTaskId === queryNestedRoadMapItemId;
          })
        : allQueries;
      setQueries(scopedQueries);
      if (!status) setQueriesCount(scopedQueries.length);
    } catch {
      setQueries([]);
      if (!status) setQueriesCount(0);
    } finally {
      if (showLoader) setQueriesLoading(false);
    }
  }, [roadmapId, userId, queryNestedRoadMapItemId]);

  // Prefetch counts so the left rail matches mobile badges.
  useEffect(() => {
    if (!roadmapId || !userId) return;
    void fetchComments(false);
    void fetchQueries(undefined, false);
  }, [roadmapId, userId, fetchComments, fetchQueries]);

  // Load comments when Comments tab is opened
  useEffect(() => {
    if (activeTab !== "comments") return;
    void fetchComments(true);
  }, [activeTab, fetchComments]);

  // Load queries when Queries tab is opened or subtab changes
  // apiGetQueries returns an array of QueriesThread — flatten all queries from all threads
  useEffect(() => {
    if (activeTab !== "queries" || !roadmapId || !userId) return;
    const statusMap: Record<string, string | undefined> = {
      New: undefined,
      Answered: "answered",
      Pending: "pending",
    };
    void fetchQueries(statusMap[queryTab], true);
  }, [activeTab, queryTab, roadmapId, userId, fetchQueries]);

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const showScheduleFeedback = (message: string, duration = 3500) => {
    setCompleteFeedback(message);
    setTimeout(() => setCompleteFeedback(null), duration);
  };

  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  useEffect(() => {
    const max = getDaysInMonth(currentMonth, currentYear);
    setSelectedDate((day) => (day > max ? max : day));
  }, [currentMonth, currentYear]);

  const refreshAppointmentLists = useCallback(async (): Promise<any[]> => {
    if (!userId) return [];
    try {
      const [scheduleResult, upcomingResult] = await Promise.allSettled([
        apiGetUserSchedule(userId),
        apiGetAppointments({ userId, futureOnly: true }),
      ]);
      const scheduleData =
        scheduleResult.status === "fulfilled" ? unwrapAppointmentsAxiosData(scheduleResult.value) : [];
      const upcomingData =
        upcomingResult.status === "fulfilled" ? unwrapAppointmentsAxiosData(upcomingResult.value) : [];
      const combined = [...scheduleData, ...upcomingData];
      setAppointments(combined);
      return combined;
    } catch {
      setAppointments([]);
      return [];
    }
  }, [userId]);

  useEffect(() => {
    void refreshAppointmentLists();
  }, [refreshAppointmentLists]);

  useEffect(() => {
    async function fetchMentors() {
      if (!userId) {
        setMentors([]);
        setFilteredMentors([]);
        return;
      }

      try {
        const res = await apiGetAssignedUsers(userId);
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
      } catch {
        setMentors([]);
        setFilteredMentors([]);
      }
    }

    if (drawerOpen && drawerStep === "mentor") void fetchMentors();
  }, [drawerOpen, drawerStep, userId]);

  useEffect(() => {
    const q = mentorSearch.trim().toLowerCase();
    if (!q) {
      setFilteredMentors(mentors);
      return;
    }

    setFilteredMentors(
      mentors.filter((m) =>
        `${m.firstName ?? ""} ${m.lastName ?? ""} ${m.name ?? ""}`.toLowerCase().includes(q),
      ),
    );
  }, [mentorSearch, mentors]);

  useEffect(() => {
    if (drawerStep !== "schedule" || !selectedMentor) {
      setAvailableTimesForBooking([]);
      setMonthlyAvailabilitySlots([]);
      setAvailabilityLoading(false);
      setCalendarSlotSyncLoading(false);
      setCalendarSlotSyncError(null);
      setCalendarSlotSyncSkipped(false);
      setCalendarBusyStripped(0);
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
          const availRes = await axiosInstance.get(`/appointments/availability/${mentorId}/month`, {
            params: { year: currentYear, month: currentMonth + 1 },
          });
          const raw = availRes.data?.data ?? availRes.data;
          slots = Array.isArray(raw) ? raw : [];
        } catch {
          try {
            const wk = await apiGetWeeklyAvailability(mentorId, selectedYmdForWeek);
            const wRaw = unwrapMonthlyAvailabilityPayload(wk);
            slots = wRaw.length ? wRaw : Array.isArray((wk.data as any)?.data) ? (wk.data as any).data : [];
          } catch {
            slots = [];
          }
        }

        if (!cancelled) setMonthlyAvailabilitySlots(slots);

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

        const bookedMs = appointments
          .filter((a: any) => {
            const apptMentorId = String(a.mentor?._id ?? a.mentor?.id ?? a.mentorId ?? "");
            const status = String(a.status ?? "").toLowerCase();
            return (
              apptMentorId === mentorId &&
              !status.includes("cancel") &&
              meetingDateLocalYmd(String(a.meetingDate ?? "")) === selectedYmd
            );
          })
          .map((a: any) => new Date(a.meetingDate).getTime())
          .filter((ms: number) => !Number.isNaN(ms));

        times = times.filter((label) => {
          const slotMs = new Date(parseSlotStartToIso(selectedYmd, label)).getTime();
          return !bookedMs.some((bMs) => Math.abs(bMs - slotMs) < 30 * 60 * 1000);
        });

        setCalendarSlotSyncLoading(true);
        setCalendarSlotSyncError(null);

        let displayTimes = times;
        const participantUserIds = Array.from(new Set([userId, mentorId].filter(Boolean)));
        const gc = await filterSlotLabelsAgainstExternalCalendar({
          meetingDateYmd: selectedYmd,
          rawSlotLabels: times.map((lab) => String(lab).replace(/\u2013/g, "-").replace(/\u2014/g, "-")),
          participantUserIds,
          meetingDurationMinutes: 60,
          expandIntoGrid: true,
        });

        setCalendarSlotSyncSkipped(gc.skipped);
        setCalendarBusyStripped(gc.error ? 0 : gc.strippedCount);
        if (gc.error) {
          setCalendarSlotSyncError(gc.error);
          displayTimes = [];
        } else {
          displayTimes = gc.slots;
        }

        if (!cancelled) {
          setAvailableTimesForBooking(displayTimes);
          setSelectedTime((prev) => (prev && displayTimes.includes(prev) ? prev : ""));
          setAvailabilityLoading(false);
          setCalendarSlotSyncLoading(false);
        }
      } catch (error) {
        if (!cancelled) {
          setAvailableTimesForBooking([]);
          setMonthlyAvailabilitySlots([]);
          setAvailabilityLoading(false);
          setCalendarSlotSyncLoading(false);
          setCalendarSlotSyncError(extractApiErrorMessage(error));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [drawerStep, selectedMentor, currentYear, currentMonth, selectedDate, availabilityRefreshKey, appointments, userId]);

  // const scopedNestedId = nestedRoadMapItemIdForExtras;

  // Mobile parity: show server-saved upload documents after refresh.
  useEffect(() => {
    if (!roadmapId || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGetExtrasDocuments(roadmapId, userId, scopedNestedId);
        const list = (res?.data?.data || res?.data) as any[];
        const batches = Array.isArray(list) ? list : [];
        const byName: Record<string, { fileName: string; fileUrl: string; uploadBatchId: string }[]> = {};
        batches.forEach((b: any) => {
          const name = String(b?.name ?? "").trim().toLowerCase();
          const batchId = String(b?.uploadBatchId ?? "").trim();
          const files = Array.isArray(b?.files) ? b.files : [];
          if (!name || !batchId || files.length === 0) return;
          const mapped = files
            .map((f: any) => ({
              fileName: String(f?.fileName ?? "").trim(),
              fileUrl: String(f?.fileUrl ?? "").trim(),
              uploadBatchId: batchId,
            }))
            .filter((f: any) => f.fileName && f.fileUrl);
          if (!mapped.length) return;
          byName[name] = [...(byName[name] || []), ...mapped];
        });
        if (!cancelled) setSavedUploadDocs(byName);
      } catch {
        if (!cancelled) setSavedUploadDocs({});
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roadmapId, userId, scopedNestedId]);

  /** Reload nested item / roadmap. Optionally skip GET /progress so PATCH responses are not overwritten (stale read). */
  const refetchRoadmap = async (opts?: { skipProgressRefetch?: boolean }): Promise<Record<string, unknown> | null> => {
    if (!nestedItemId) return null;
    try {
      let data: Record<string, unknown> | null = null;
      if (parentRoadmapId) {
        const res = await apiGetNestedRoadmapItem(parentRoadmapId, nestedItemId);
        data = extractRoadmapDocumentFromResponse(res);
        const needsExtras =
          !data ||
          !("extras" in data) ||
          !Array.isArray((data as any).extras) ||
          (data as any).extras.length === 0;
        if (needsExtras) {
          try {
            const parentRes = await apiGetRoadmapById(parentRoadmapId);
            const parentDoc = extractRoadmapDocumentFromResponse(parentRes) as any;
            const fromParent = unwrapNestedRoadmapsArray(parentDoc).find(
              (r: any) =>
                normalizeRoadmapId(r?._id ?? r?.id) === normalizeRoadmapId(nestedItemId),
            );
            if (fromParent && Array.isArray(fromParent.extras) && fromParent.extras.length > 0) {
              data = { ...(data || {}), extras: fromParent.extras } as any;
            }
          } catch {
            // ignore fallback failures
          }
        }
      } else {
        const res = await apiGetRoadmapById(nestedItemId);
        data = extractRoadmapDocumentFromResponse(res);
      }
      if (data) {
        setRoadmap(data);
        if (!opts?.skipProgressRefetch) {
          await refetchProgressData();
        }
        return data;
      }
    } catch (e) {
      console.error("Refetch roadmap:", e);
    }
    return null;
  };

  const queuePendingUploads = (fieldKey: string, fileList: FileList | File[] | null) => {
    if (!fileList) return;
    const list = [...(Array.isArray(fileList) ? fileList : Array.from(fileList))].filter(Boolean);
    if (!list.length) return;
    const valid = list.filter((f) => {
      if (f.size <= MAX_PASTOR_UPLOAD_BYTES) return true;
      setSaveFeedback(`"${f.name}" is over 25 MB and was skipped.`);
      setTimeout(() => setSaveFeedback(null), 5000);
      return false;
    });
    if (!valid.length) return;
    setPendingUploadFiles((prev) => ({
      ...prev,
      [fieldKey]: [...(prev[fieldKey] ?? []), ...valid],
    }));
  };

  const removeQueuedUpload = (fieldKey: string, index: number) => {
    setPendingUploadFiles((prev) => {
      const row = [...(prev[fieldKey] ?? [])];
      row.splice(index, 1);
      const next = { ...prev };
      if (row.length) next[fieldKey] = row;
      else delete next[fieldKey];
      return next;
    });
  };

  const getAssessmentIdFromExtra = (extra: ExtraComponent): string | null => {
    const fromShape = resolveAssessmentIdFromExtraShape(extra);
    if (fromShape) return fromShape;
    const fromNav = String(extra.navigateTo || "");
    if (!fromNav) return null;
    const q = /[?&]assessmentId=([^&]+)/i.exec(fromNav);
    if (q?.[1]) return decodeURIComponent(q[1]).trim();
    return null;
  };

  const getAssessmentCheckboxKey = (extra: ExtraComponent): string | undefined => {
    const checkbox = extra.checkboxes?.find((cb) => cb.type === "CHECKBOX" && String(cb.name || "").trim());
    return checkbox?.name;
  };
//   const hasRoadmapAssessmentMeeting = (assessmentId: string) => {
//   return appointments.some((appt: any) => {
//     const notes = String(appt?.notes || "");
//     const status = String(appt?.status || "").toLowerCase();

//     return (
//       !status.includes("cancel") &&
//       notes.includes(`assessmentId:${assessmentId}`) &&
//       notes.includes(`taskId:${nestedItemId || ""}`) &&
//       notes.includes(`roadmapId:${roadmapId || ""}`)
//     );
//   });
// };
const getRoadmapAssessmentMeeting = (assessmentId: string) => {
  return appointments.find((appt: any) => {
    const notes = String(appt?.notes || "");
    const status = String(appt?.status || "").toLowerCase();

    return (
      !status.includes("cancel") &&
      notes.includes(`assessmentId:${assessmentId}`) &&
      notes.includes(`taskId:${nestedItemId || ""}`) &&
      notes.includes(`roadmapId:${roadmapId || ""}`)
    );
  });
};

  const openAssessmentMeetingDrawer = (extra: ExtraComponent) => {
    const assessmentId = getAssessmentIdFromExtra(extra);
    if (!assessmentId) {
      showScheduleFeedback("This survey is not linked to an assessment yet.");
      return;
    }

    setScheduleContext({
      assessmentId,
      checkboxKey: getAssessmentCheckboxKey(extra),
    });
    setDrawerStep("mentor");
    setDrawerOpen(true);
    setSelectedMentor(null);
    setSelectedTime("");
    setSchedulePlatform("Zoom");
  };

  const handleScheduleAssessmentMeeting = async () => {
    if (isScheduling || !scheduleContext) return;

    const mentorId = String(selectedMentor?.id ?? selectedMentor?._id ?? "").trim();
    if (!mentorId) {
      showScheduleFeedback("Please select a mentor.");
      return;
    }

    if (!selectedTime) {
      showScheduleFeedback("Please select a time.");
      return;
    }

    if (!userId) {
      showScheduleFeedback("Please sign in again.");
      return;
    }

    const yyyyMmDd = new Date(currentYear, currentMonth, selectedDate).toLocaleDateString("en-CA");
    const meetingDateISO = parseSlotStartToIso(yyyyMmDd, selectedTime.replace(/\u2013/g, "-"));
    const proposedMs = new Date(meetingDateISO).getTime();
    const hasOverlap = appointments.some((a: any) => {
      const t = new Date(String(a.meetingDate ?? "")).getTime();
      return !Number.isNaN(t) && Math.abs(t - proposedMs) < 60 * 60 * 1000;
    });

    if (hasOverlap) {
      showScheduleFeedback("This time slot overlaps with an existing appointment.");
      return;
    }

    setIsScheduling(true);
    try {
      const mentorDisplay =
        `${selectedMentor?.firstName ?? ""} ${selectedMentor?.lastName ?? ""}`.trim() || "Mentor";

      const res = await apiCreateAppointment({
        userId,
        mentorId,
        meetingDate: meetingDateISO,
        platform: uiMeetingModeToPlatform(schedulePlatform),
        notes: `Roadmap assessment meeting | assessmentId:${scheduleContext.assessmentId} | roadmapId:${roadmapId || ""} | taskId:${nestedItemId || ""} | parentId:${parentRoadmapId || ""}`,
        googleCalendarSync: true,
        googleCalendarTitle: `Meeting - pastor & ${mentorDisplay}`,
        googleCalendarDescription: `Scheduled in CCC - Platform: ${schedulePlatform}`,
      });

      const hint = googleCalendarSuccessHintFromCreateResponse(res?.data);
      if (scheduleContext.checkboxKey) {
        setFormData((prev) => ({ ...prev, [scheduleContext.checkboxKey as string]: true }));
      }

      setAvailabilityRefreshKey((prev) => prev + 1);
      setDrawerOpen(false);
      setSelectedTime("");
      await refreshAppointmentLists();
      showScheduleFeedback(hint ?? "New appointment has been scheduled.");
    } catch (error) {
      showScheduleFeedback(extractApiErrorMessage(error) || "Failed to schedule appointment.");
    } finally {
      setIsScheduling(false);
    }
  };

  const assessmentExtras = useMemo(() => {
  const found: ExtraComponent[] = [];

  const walk = (items: ExtraComponent[] | undefined) => {
    if (!items?.length) return;

    items.forEach((item) => {
      if (item.type === "ASSESSMENT") {
        found.push(item);
      }

      if (item.sections?.length) walk(item.sections);
      if (item.checkboxes?.length) walk(item.checkboxes);
    });
  };

  walk(templateExtras);

  return found;
}, [templateExtras]);
useEffect(() => {
  if (!userId || assessmentExtras.length === 0) {
    setAssessmentTaskState({});
    return;
  }

  let cancelled = false;

  const loadAssessmentTaskState = async () => {
    const next: Record<string, { submitted: boolean; hasCdp: boolean }> = {};

    await Promise.all(
      assessmentExtras.map(async (extra) => {
        const assessmentId = getAssessmentIdFromExtra(extra);
        if (!assessmentId) return;

        let submitted = false;
        let hasCdp = getStoredRecommendationsForPastorAssessment(
          userId,
          assessmentId,
        ).some((rec) => rec.sent === true);

        try {
          const answersRes = await apiGetUserAnswers(assessmentId, userId);
          submitted = Boolean((answersRes?.data as any)?.data?._id);
        } catch {
          submitted = false;
        }

        try {
          const recRes = await apiGetSectionRecommendations(assessmentId, userId);
          const data: any = (recRes?.data as any)?.data ?? recRes?.data;

          if (Array.isArray(data)) {
            hasCdp =
              hasCdp ||
              data.some((row: any) => row?.sent === true || row?.status === "sent");
          } else if (Array.isArray(data?.sections)) {
            hasCdp =
              hasCdp ||
              data.sections.some((section: any) =>
                Array.isArray(section?.recommendations) &&
                section.recommendations.some(
                  (rec: any) => rec?.sent === true || rec?.status === "sent",
                ),
              );
          }
        } catch {
          // Keep local CDP value.
        }

        next[assessmentId] = { submitted, hasCdp };
      }),
    );

    // if (!cancelled) {
    //   setAssessmentTaskState(next);
    // }
    if (!cancelled) {
  setAssessmentTaskState(next);

  const hasCompletedCdp = Object.values(next).some(
    (row) => row.submitted && row.hasCdp,
  );

  if (hasCompletedCdp) {
    setStatusUiOverride("Completed");
  }
}
  };

  void loadAssessmentTaskState();

  return () => {
    cancelled = true;
  };
}, [userId, assessmentExtras]);
  const openAssessment = (extra: ExtraComponent) => {
    const assessmentId = getAssessmentIdFromExtra(extra);
    if (!assessmentId) {
      setCompleteFeedback("This survey is not linked to an assessment yet.");
      setTimeout(() => setCompleteFeedback(null), 4000);
      return;
    }
    // router.push(
    //   `/pastor/Assessments/guidelines?assessmentId=${encodeURIComponent(assessmentId)}`,
    // );
    router.push(
  `/pastor/Assessments/guidelines?assessmentId=${encodeURIComponent(
    assessmentId,
  )}&roadmapId=${encodeURIComponent(roadmapId || "")}&taskId=${encodeURIComponent(
    nestedItemId || "",
  )}&parentId=${encodeURIComponent(parentRoadmapId || "")}`,
);
  };

  const handleSave = async () => {
    if (!roadmapId || !userId || !roadmap) {
      setSaveFeedback("Sign in again or open this task from your roadmap.");
      setTimeout(() => setSaveFeedback(null), 4000);
      return;
    }
    if (!hasRequiredSignature || !hasRequiredUploads || !hasRequiredSubmissions) {
  setSaveSuccess(false);
  setSaveFeedback("Please complete the task first.");
  setTimeout(() => setSaveFeedback(null), 4000);
  return;
}
    setSaving(true);
    setSaveFeedback(null);
    try {
      console.log("[Pastor Jumpstart] Save clicked", {
        roadmapId,
        userId,
        scopedNestedId,
        parentRoadmapId,
        nestedItemId,
        extrasExist,
        formKeys: Object.keys(formData || {}),
        uploadKeys: Object.keys(pendingUploadFiles || {}).filter((k) => (pendingUploadFiles[k]?.length ?? 0) > 0),
      });
      await ensureJumpstartTriggered();
      const mergedForm: Record<string, any> = { ...formData };
      // Mobile parity: only UPLOAD extras become boolean flags.
      // Do NOT overwrite SIGNATURE dataUrl with `true` (that breaks persistence + hydration).
      Object.keys(pendingUploadFiles).forEach((k) => {
        const extraDef = findExtraByFieldName(templateExtras, k);
        if (extraDef?.type === "UPLOAD" && (pendingUploadFiles[k]?.length ?? 0) > 0) mergedForm[k] = true;
      });

      // Mobile parity: build extrasArray from Object.entries(formData), no name transforms.
      const getExtraType = (fieldName: string, value: any): string => {
        const extraDef = findExtraByFieldName(templateExtras, fieldName);
        if (extraDef) return extraDef.type;

        if (typeof value === "boolean") return "CHECKBOX";
        if (typeof value === "object" && value?.uri) return "UPLOAD";
        if (fieldName.toLowerCase().includes("date")) return "DATE_PICKER";
        if (typeof value === "string" && value.length > 100) return "TEXT_AREA";
        return "TEXT_FIELD";
      };

      const extrasArray = Object.entries(mergedForm).map(([name, value]) => {
        const type = getExtraType(name, value);
        if (type === "SIGNATURE") {
          return { type: "SIGNATURE", name, signatureData: value };
        }
        return { type, name, value: type === "UPLOAD" ? true : value };
      });
      console.log("[Pastor Jumpstart] Built extrasArray", {
        count: extrasArray.length,
        sample: extrasArray.slice(0, 10),
      });
      const createPayload = {
        userId,
        roadMapId: roadmapId,
        ...(scopedNestedId?.trim() ? { nestedRoadMapItemId: scopedNestedId.trim() } : {}),
        extras: extrasArray,
      };
      console.log("[Pastor Jumpstart] Extras payload (create/update)", createPayload);
      if (extrasExist) {
        try {
          const res = await apiUpdateExtras(roadmapId, userId, { extras: extrasArray }, scopedNestedId);
          console.log("[Pastor Jumpstart] PATCH /extras ok", res?.data);
          try {
            const stored = await apiGetExtras(roadmapId, userId, scopedNestedId);
            console.log("[Pastor Jumpstart] GET /extras after PATCH", stored?.data);
          } catch (e) {
            console.warn("[Pastor Jumpstart] GET /extras after PATCH failed", e);
          }
        } catch (errUpdate) {
          // Mobile fallback: if update target is missing, create it.
          console.warn("[Pastor Jumpstart] PATCH /extras failed; falling back to POST", errUpdate);
          const res = await apiSaveExtras(roadmapId, createPayload);
          console.log("[Pastor Jumpstart] POST /extras ok (fallback)", res?.data);
          try {
            const stored = await apiGetExtras(roadmapId, userId, scopedNestedId);
            console.log("[Pastor Jumpstart] GET /extras after POST fallback", stored?.data);
          } catch (e) {
            console.warn("[Pastor Jumpstart] GET /extras after POST fallback failed", e);
          }
          setExtrasExist(true);
        }
      } else {
        try {
          const res = await apiSaveExtras(roadmapId, createPayload);
          console.log("[Pastor Jumpstart] POST /extras ok", res?.data);
          try {
            const stored = await apiGetExtras(roadmapId, userId, scopedNestedId);
            console.log("[Pastor Jumpstart] GET /extras after POST", stored?.data);
          } catch (e) {
            console.warn("[Pastor Jumpstart] GET /extras after POST failed", e);
          }
          setExtrasExist(true);
        } catch (errSave) {
          // If extras already exist, update instead.
          console.warn("[Pastor Jumpstart] POST /extras failed; falling back to PATCH", errSave);
          const res = await apiUpdateExtras(roadmapId, userId, { extras: extrasArray }, scopedNestedId);
          console.log("[Pastor Jumpstart] PATCH /extras ok (fallback)", res?.data);
          try {
            const stored = await apiGetExtras(roadmapId, userId, scopedNestedId);
            console.log("[Pastor Jumpstart] GET /extras after PATCH fallback", stored?.data);
          } catch (e) {
            console.warn("[Pastor Jumpstart] GET /extras after PATCH fallback failed", e);
          }
          setExtrasExist(true);
        }
      }
      // Mark save time so the extras loader can retry without wiping UI fields.
      lastExtrasSaveAtRef.current = Date.now();
      // for (const [key, files] of Object.entries(pendingUploadFiles)) {
      //   if (files?.length) await apiUploadExtrasDocuments(roadmapId, userId, files, scopedNestedId, key);
      // }
      // setPendingUploadFiles({});
      const uploadedNowNames: Record<string, { fileName: string; fileUrl: string; uploadBatchId: string }[]> = {};

for (const [key, files] of Object.entries(pendingUploadFiles)) {
  if (files?.length) {
    try {
      await apiUploadExtrasDocuments(roadmapId, userId, files, scopedNestedId, key);
    } catch (uploadErr) {
      console.error("Upload failed:", uploadErr);
      setSaveFeedback("Upload failed. Backend may not allow this file type or size.");
      setTimeout(() => setSaveFeedback(null), 5000);
      continue;
    }

    uploadedNowNames[key] = files.map((file) => ({
      fileName: file.name,
      fileUrl: "",
      uploadBatchId: "local-now",
    }));
  }
}

setUploadedNowDocs(uploadedNowNames);
setPendingUploadFiles({});
      // Refresh server uploads so the UI shows "uploaded" after reload.
      // try {
      //   const resDocs = await apiGetExtrasDocuments(roadmapId, userId, scopedNestedId);
      //   const list = (resDocs?.data?.data || resDocs?.data) as any[];
      //   const batches = Array.isArray(list) ? list : [];
      //   const byName: Record<string, { fileName: string; fileUrl: string; uploadBatchId: string }[]> = {};
      //   batches.forEach((b: any) => {
      //     const name = String(b?.name ?? "").trim();
      //     const batchId = String(b?.uploadBatchId ?? "").trim();
      //     const files = Array.isArray(b?.files) ? b.files : [];
      //     if (!name || !batchId || files.length === 0) return;
      //     const mapped = files
      //       .map((f: any) => ({
      //         fileName: String(f?.fileName ?? "").trim(),
      //         fileUrl: String(f?.fileUrl ?? "").trim(),
      //         uploadBatchId: batchId,
      //       }))
      //       .filter((f: any) => f.fileName && f.fileUrl);
      //     if (!mapped.length) return;
      //     byName[name] = [...(byName[name] || []), ...mapped];
      //   });
      //   setSavedUploadDocs(byName);
      // } catch {
      //   // ignore doc refresh failures; upload already succeeded
      // }
      await refetchRoadmap();
      await refetchProgressData();
      emitProgressUpdated(userId);
      await fetchComments(false);
      await fetchQueries(undefined, false);
      setSaveSuccess(true);
      setSaveFeedback(extrasExist ? "Progress updated." : "Progress saved.");
      await handleMarkComplete();
      setTimeout(() => {
        setSaveSuccess(false);
        setSaveFeedback(null);
      }, 1200);
    } catch (err) {
      console.error("Save error:", err);
      setSaveSuccess(false);
      setSaveFeedback(axiosMessage(err) || "Could not save progress. Try again.");
      setTimeout(() => setSaveFeedback(null), 7000);
    } finally {
      setSaving(false);
    }
  };
// Block completion unless all required roadmap inputs are satisfied.
  const handleMarkComplete = async () => {
    if (!userId || !nestedItemId) {
      setCompleteFeedback("Sign in again or open this task from your roadmap.");
      setTimeout(() => setCompleteFeedback(null), 4000);
      return;
    }
    if (!hasRequiredSignature) {
  setCompleteFeedback("Digital signature is required before marking this roadmap as completed.");
  setTimeout(() => setCompleteFeedback(null), 4000);
  return;
}

if (!hasRequiredUploads) {
  setCompleteFeedback("Required document upload is needed before marking this roadmap as completed.");
  setTimeout(() => setCompleteFeedback(null), 4000);
  return;
}

if (!hasRequiredSubmissions) {
  setCompleteFeedback("Please finish all required submissions before marking this roadmap as completed.");
  setTimeout(() => setCompleteFeedback(null), 4000);
  return;
}

    const roadMapId = parentRoadmapId || nestedItemId;
    const nestedRoadmapId = parentRoadmapId ? nestedItemId : undefined;
    const totalSteps = Math.max(1, Number(roadmap?.totalSteps) || 1);

    setCompleteLoading(true);
    setCompleteFeedback(null);
    const progressErrors: string[] = [];

    try {
      console.log("[Pastor Jumpstart] Mark complete clicked", {
        userId,
        roadMapId,
        nestedRoadmapId,
        nestedItemId,
      });
      await ensureJumpstartTriggered();
      // Use progress API as source of completion; nested roadmap PATCH is flaky (400 in prod).
      let progressOk = false;
      let progressUpdateAxios: Awaited<ReturnType<typeof apiUpdateRoadmapProgress>> | undefined;
      try {
        progressUpdateAxios = await apiUpdateRoadmapProgress({
          userId,
          roadMapId,
          nestedRoadmapId,
          completedSteps: totalSteps,
          status: "completed",
        });
        console.log("[Pastor Jumpstart] progress update response", progressUpdateAxios?.data);
        if ((progressUpdateAxios as any)?.data?.success === false) {
          throw new Error(String((progressUpdateAxios as any)?.data?.message || "Progress update failed"));
        }
        progressOk = true;
      } catch (e1) {
        try {
          progressUpdateAxios = await apiUpdateRoadmapProgress({
            userId,
            roadMapId,
            nestedRoadmapId,
            completedSteps: totalSteps,
          });
          console.log("[Pastor Jumpstart] progress update fallback response", progressUpdateAxios?.data);
          if ((progressUpdateAxios as any)?.data?.success === false) {
            throw new Error(String((progressUpdateAxios as any)?.data?.message || "Progress update failed"));
          }
          progressOk = true;
        } catch (e2) {
          console.error("Mark complete — progress:", e1, e2);
          progressErrors.push(axiosMessage(e1));
          progressErrors.push(axiosMessage(e2));
        }
      }

      if (!progressOk) {
        const completedOn = new Date().toISOString();
        try {
          if (parentRoadmapId?.trim() && nestedItemId?.trim()) {
            await apiUpdateNestedRoadmapItem(parentRoadmapId.trim(), nestedItemId.trim(), {
              status: "completed",
              completedOn,
            });
          } else if (nestedItemId?.trim()) {
            await apiUpdateRoadmap(nestedItemId.trim(), {
              status: "completed",
              completedOn,
            });
          }
          progressUpdateAxios = await apiUpdateRoadmapProgress({
            userId,
            roadMapId,
            nestedRoadmapId,
            completedSteps: totalSteps,
            status: "completed",
          });
          if ((progressUpdateAxios as { data?: { success?: boolean } })?.data?.success !== false) {
            progressOk = true;
          }
        } catch (e3) {
          console.error("Mark complete — template + progress retry:", e3);
          progressErrors.push(axiosMessage(e3));
        }
      }

      if (progressOk) {
        setStatusUiOverride("Completed");
        const nextProgress = progressUpdateAxios ? unwrapProgressData(progressUpdateAxios) : null;
        if (nextProgress) setProgressData(nextProgress);
        await refetchRoadmap({ skipProgressRefetch: true });
        setRoadmap((prev: any) => (prev ? { ...prev, status: "completed" } : prev));
        // Fresh GET /progress (cache-busted) so Revitalization Roadmap + phase lists match mobile.
        await refetchProgressData();

        // Ensure the backend progress read reflects the completion before navigating away.
        // This avoids "looks completed then reverts" when GET /progress lags behind PATCH.
        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            const res = await apiGetUserProgress(userId);
            const prog = unwrapProgressData(res);
            const derived = deriveTaskStatusForList(prog, {
              parentRoadmapId: roadMapId,
              taskId: nestedItemId,
              itemStatus: "completed",
              endDate: typeof roadmap?.endDate === "string" ? roadmap.endDate : undefined,
            });
            if (derived === "Completed") {
              setProgressData(prog);
              break;
            }
          } catch {
            // ignore; we'll retry
          }
          await sleep(650);
        }

        emitProgressUpdated(userId);
        setCompleteFeedback("Marked as completed.");
        setTimeout(() => {
          setCompleteFeedback(null);
          if (parentRoadmapId) {
            router.push(
              `/pastor/SelfRevitalizationPhasePage?id=${encodeURIComponent(parentRoadmapId)}&completedTaskId=${encodeURIComponent(nestedItemId)}`,
            );
          } else {
            router.push("/pastor/revitalization-roadmap");
          }
        }, 900);
      } else if (progressErrors.length > 0) {
        setCompleteFeedback(progressErrors.filter((s, i, a) => s && a.indexOf(s) === i).join(" — "));
        setTimeout(() => setCompleteFeedback(null), 9000);
      } else {
        setCompleteFeedback("Could not mark as completed. Try again.");
        setTimeout(() => setCompleteFeedback(null), 6000);
      }
    } finally {
      setCompleteLoading(false);
    }
  };

  const handleSubmitQuery = async () => {
    if (!roadmapId || !userId || !newQueryText.trim()) return;
    setQuerySubmitting(true);
    try {
      await apiAddQuery(
        roadmapId,
        {
          actualQueryText: newQueryText.trim(),
          userId,
          nestedRoadMapItemId: queryNestedRoadMapItemId,
        },
        "pastor",
      );
      setNewQueryText("");
      setQueryTab("Pending");
      setQuerySuccess(true);
      setTimeout(() => setQuerySuccess(false), 3000);
      await fetchQueries(undefined, false);
      await fetchQueries("pending", false);
    } catch (err) {
      console.error("Submit query error:", err);
      setCompleteFeedback(axiosMessage(err) || "Could not submit query. Try again.");
      setTimeout(() => setCompleteFeedback(null), 5000);
    } finally {
      setQuerySubmitting(false);
    }
  };

  const cancelPastorQueryEdit = () => {
    setPastorEditingQueryId(null);
    setPastorEditingQueryText("");
  };

  const beginPastorQueryEdit = (q: QueryItem) => {
    setPastorEditingQueryId(q._id);
    setPastorEditingQueryText(String(q.actualQueryText ?? ""));
  };

  const handleSavePastorQueryEdit = async (queryId: string) => {
    if (!roadmapId || !userId) return;
    const text = pastorEditingQueryText.trim();
    if (!text) return;
    setQueryActionLoadingId(queryId);
    try {
      await apiUpdatePastorQuery(
        roadmapId,
        queryId,
        {
          userId,
          actualQueryText: text,
          nestedRoadMapItemId: queryNestedRoadMapItemId,
        },
        "pastor",
      );
      cancelPastorQueryEdit();
      await fetchQueries(undefined, false);
      await fetchQueries("pending", false);
    } catch (err) {
      console.error("Update query error:", err);
      setCompleteFeedback(axiosMessage(err) || "Could not update query.");
      setTimeout(() => setCompleteFeedback(null), 5000);
    } finally {
      setQueryActionLoadingId(null);
    }
  };

  const handleDeletePastorQuery = async (queryId: string) => {
    if (!roadmapId || !userId) return;
    const ok = typeof window !== "undefined" ? window.confirm("Remove this query?") : false;
    if (!ok) return;
    setQueryActionLoadingId(queryId);
    try {
      await apiDeletePastorQuery(
        roadmapId,
        queryId,
        userId,
        queryNestedRoadMapItemId,
        "pastor",
      );
      cancelPastorQueryEdit();
      await fetchQueries(undefined, false);
      await fetchQueries("pending", false);
      await fetchQueries("answered", false);
    } catch (err) {
      console.error("Delete query error:", err);
      setCompleteFeedback(axiosMessage(err) || "Could not remove query.");
      setTimeout(() => setCompleteFeedback(null), 5000);
    } finally {
      setQueryActionLoadingId(null);
    }
  };

  // Signature drawing functions
  const openSignatureModal = (fieldKey: string) => {
    setActiveSignatureField(fieldKey);
    setSignatureModalOpen(true);
    setSignaturePreview(null);
    setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // ctx.fillStyle = "#ffffff";
          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }
    }, 100);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let x, y;

    if ("touches" in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#000000";
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // ctx.fillStyle = "#ffffff";
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeSignatureField) return;
    
    const dataUrl = canvas.toDataURL("image/png");
    setSignaturePreview(dataUrl);
    setFormData((prev) => ({
      ...prev,
      [activeSignatureField]: dataUrl,
    }));
  };

  const confirmSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeSignatureField) return;

    // Convert canvas to blob and upload
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `signature_${Date.now()}.png`, { type: "image/png" });
      queuePendingUploads(activeSignatureField, [file]);
      setSignatureModalOpen(false);
      setActiveSignatureField(null);
      setSignaturePreview(null);
    }, "image/png");
  };

  const renderExtraComponent = (
    extra: ExtraComponent,
    index: number,
    parentFieldKey = "",
  ) => {
    // Mobile parity: field key is the exact extra name (no section paths).
    const fieldKey = extra.name;

    switch (extra.type) {
      case "TEXT_DISPLAY":
        return (
          <div key={`${fieldKey}_${index}`} className="mb-4">
            <p className="text-[13px] text-white/90 leading-relaxed">{extra.name}</p>
          </div>
        );

      case "TEXT_AREA":
        return (
          <div key={`${fieldKey}_${index}`} className="mb-5">
            <h4 className="text-sm font-semibold text-white mb-2">{extra.name}</h4>
            <textarea
              placeholder={extra.placeHolder || "Write here..."}
              value={formData[fieldKey] ?? ""}
              onChange={(e) => handleInputChange(fieldKey, e.target.value)}
              className="w-full border border-[#5A8DCB] rounded-md p-3 text-sm text-white bg-transparent focus:outline-none focus:ring-1 focus:ring-[#00B3FF] resize-none h-24"
            />
          </div>
        );

      case "TEXT_FIELD":
        return (
          <div key={`${fieldKey}_${index}`} className="mb-5">
            <h4 className="text-sm font-semibold text-white mb-2">{extra.name}</h4>
            <input
              type="text"
              placeholder={extra.placeHolder || ""}
              value={formData[fieldKey] ?? ""}
              onChange={(e) => handleInputChange(fieldKey, e.target.value)}
              className="w-full border border-[#5A8DCB] rounded-md px-3 py-2 text-sm text-white bg-transparent focus:outline-none focus:ring-1 focus:ring-[#00B3FF]"
            />
          </div>
        );

      case "DATE_PICKER": {
        // const allowPastorSelect =
        //   Array.isArray(extra.checkboxes) &&
        //   extra.checkboxes.some((cb) => String((cb as ExtraComponent)?.name ?? "") === "Allow pastor to select Date");
        const normalizeMetaName = (value: unknown) =>
  String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const allowPastorSelect =
  Array.isArray(extra.checkboxes) &&
  extra.checkboxes.some(
    (cb) => normalizeMetaName((cb as ExtraComponent)?.name) === "allow pastor to select date",
  );
        const defaultDate =
          typeof extra.date === "string" && extra.date.trim() ? extra.date.trim().slice(0, 10) : "";
        const value = String(formData[fieldKey] ?? defaultDate ?? "");
        // const metaNames = new Set(["Allow pastor to select Date", "Show date on info card"]);
        // const displayCheckboxes =
        //   extra.checkboxes?.filter((cb) => !metaNames.has(String((cb as ExtraComponent)?.name ?? ""))) ?? [];
        const metaNames = new Set(["allow pastor to select date", "show date on info card"]);
const displayCheckboxes =
  extra.checkboxes?.filter(
    (cb) => !metaNames.has(normalizeMetaName((cb as ExtraComponent)?.name)),
  ) ?? [];

        return (
          <div key={`${fieldKey}_${index}`} className="mb-5">
            <h4 className="text-sm font-semibold text-white mb-2">{extra.name}</h4>
            {/* {allowPastorSelect ? (
              <input
                type="date"
                value={value.slice(0, 10)}
                onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                className="mb-3 w-full max-w-xs rounded-md border border-[#5A8DCB] bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark]"
              />
            ) : defaultDate ? (
              <p className="mb-3 text-sm text-white/85">{formatDate(defaultDate)}</p>
            ) : null} */}
            {allowPastorSelect || !defaultDate ? (
  <input
    type="date"
    value={value.slice(0, 10)}
    onChange={(e) => handleInputChange(fieldKey, e.target.value)}
    className="mb-3 w-full max-w-xs rounded-md border border-[#5A8DCB] bg-white/5 px-3 py-2 text-sm text-white [color-scheme:dark]"
  />
) : (
  <p className="mb-3 text-sm text-white/85">{formatDate(defaultDate)}</p>
)}
            {extra.buttonName ? (
              <button
                type="button"
                className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-5 py-2 rounded-md shadow"
              >
                {extra.buttonName}
              </button>
            ) : null}
            {displayCheckboxes.length > 0 && (
              <div className="mt-3 space-y-2 pl-1">
                {displayCheckboxes.map((cb, i) => renderExtraComponent(cb, i, fieldKey))}
              </div>
            )}
          </div>
        );
      }

      case "UPLOAD": {
        const pending = pendingUploadFiles[fieldKey] ?? [];
       const saved = savedUploadDocs[String(fieldKey).trim().toLowerCase()] ?? [];
        const uploadedNow = uploadedNowDocs[fieldKey] ?? [];
        const inputId = `upload-${fieldKey.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

        const onDropUpload = (e: DragEvent<HTMLDivElement>) => {
          e.preventDefault();
          e.stopPropagation();
          if (e.dataTransfer?.files?.length) queuePendingUploads(fieldKey, e.dataTransfer.files);
          e.dataTransfer.clearData();
        };

        return (
          <div key={`${fieldKey}_${index}`} className="mb-6">
            <h4 className="mb-2 text-sm font-semibold text-white">{extra.name}</h4>

           {saved.length > 0 ? (
  <div className="mb-4 rounded-xl border border-[#5A8DCB]/40 bg-white/[0.06] p-4">
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="flex items-center gap-4 border-b border-white/10 pb-4 md:border-b-0 md:border-r md:pb-0 md:pr-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-blue-300">
          <i className="fa-regular fa-folder" />
        </div>

        <div>
          <h5 className="text-sm font-semibold text-white">
            Required reference files
          </h5>
          <p className="mt-1 text-xs leading-relaxed text-white/60">
            Please check and review the reference files below before uploading your work.
          </p>
        </div>
      </div>

      <div className="min-w-0">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h5 className="text-sm font-semibold text-white">
            Uploaded files
          </h5>
        </div>

        <div className="max-h-[118px] space-y-2 overflow-y-auto pr-1">
          {saved.map((f) => (
            <div
              key={`${f.fileUrl}-${f.fileName}`}
              onClick={() => window.open(f.fileUrl, "_blank")}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white transition hover:bg-white/[0.08]"
            >
              <i className="fa-solid fa-file text-blue-300" />

              <span className="min-w-0 flex-1 truncate">
                {f.fileName}
              </span>

      <button
  type="button"
  onClick={async (e) => {
    e.stopPropagation();

    try {
      const response = await fetch(f.fileUrl);
      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = f.fileName || "download";
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(f.fileUrl, "_blank");
    }
  }}
  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-blue-200 hover:bg-white/15"
  title="Download"
>
  <i className="fa-solid fa-download" />
</button>

              <button
                type="button"
              onClick={async (e) => {
  e.stopPropagation();

  try {
    if (navigator.share && f.fileUrl) {
      await navigator.share({
        title: f.fileName,
        text: "Shared file",
        url: f.fileUrl,
      });
      return;
    }

    await navigator.clipboard.writeText(f.fileUrl);
    setSaveFeedback("File link copied.");
  } catch {
    setSaveFeedback("Could not share this file.");
  }

  setTimeout(() => setSaveFeedback(null), 2500);
}}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-emerald-300 hover:bg-white/15"
                title="Share"
              >
                <i className="fa-solid fa-share-nodes" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSaveFeedback("Delete API is not connected yet.");
                  setTimeout(() => setSaveFeedback(null), 3000);
                }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 text-red-300 hover:bg-red-500/15"
                title="Delete"
              >
                <i className="fa-solid fa-trash" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
) : null}

{uploadedNow.length > 0 ? (
  <div className="mb-4 rounded-lg border border-emerald-400/35 bg-emerald-500/10 p-3">
    <p className="mb-2 text-xs font-semibold text-emerald-200">
      Uploaded now
    </p>

    <ul className="space-y-2">
      {uploadedNow.map((f) => (
        <li
          key={`${f.fileName}-${f.uploadBatchId}`}
          className="flex items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
        >
          <i className="fa-solid fa-circle-check text-emerald-300" />
          <span className="min-w-0 flex-1 truncate">{f.fileName}</span>
          <span className="text-xs text-emerald-200">Uploaded</span>
        </li>
      ))}
    </ul>
  </div>
) : null}
            {pending.length > 0 ? (
              <div className="mb-4 space-y-2">
                <p className="text-xs font-medium text-white/70">Ready to upload</p>
                <ul className="space-y-2">
                  {pending.map((f, i) => (
                    <li
                      key={`${f.name}-${f.size}-${i}`}
                      className="flex items-center gap-2 rounded-md border border-white/15 bg-white/5 px-3 py-2 text-sm text-white"
                    >
                      <i className="fa-solid fa-file text-blue-300" />
                      <span className="min-w-0 flex-1 truncate">{f.name}</span>
                      <button
                        type="button"
                        onClick={() => removeQueuedUpload(fieldKey, i)}
                        className="shrink-0 text-white/50 hover:text-white"
                        aria-label={`Remove ${f.name}`}
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div
              className={`rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
                pending.length || saved.length
                  ? "border-[#5A8DCB]/55 bg-white/[0.04]"
                  : "border-white/25 bg-white/[0.03]"
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={onDropUpload}
            >
              <input
                type="file"
                multiple
                accept={UPLOAD_FIELD_ACCEPT}
                onChange={(e) => {
                  if (e.target.files?.length) queuePendingUploads(fieldKey, e.target.files);
                  e.target.value = "";
                }}
                className="hidden"
                id={inputId}
              />
              <label htmlFor={inputId} className="cursor-pointer">
                <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#103C8C]/90 text-xl text-white shadow-md">
                  <i className="fa-solid fa-cloud-arrow-up" />
                </span>
                <span className="block text-sm font-medium text-white">Click to upload files</span>
                <span className="mt-2 block text-xs text-white/55">or drag and drop your files here</span>
              </label>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-white/45">{UPLOAD_HINT_LINE}</p>
          </div>
        );
      }

      case "CHECKBOX":
        return (
          <div key={`${fieldKey}_${index}`} className="mb-4 flex items-start justify-between gap-4">
            <label className="flex items-start gap-2 text-sm text-white/90 cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData[fieldKey]}
                onChange={(e) => handleInputChange(fieldKey, e.target.checked)}
                className="mt-[3px] accent-[#103C8C] w-4 h-4"
              />
              <span>{extra.name}</span>
            </label>
            {extra.haveButton && extra.buttonName && (
              <button
                type="button"
                className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-5 py-2 rounded-md shadow shrink-0"
              >
                {extra.buttonName}
              </button>
            )}
          </div>
        );

      case "SIGNATURE":
        return (
          <div key={`${fieldKey}_${index}`} className="mb-5">
            <h4 className="text-sm font-semibold text-white mb-2">{extra.name}</h4>
            <div className="border border-[#5A8DCB] rounded-lg bg-white/5 p-4">
              {typeof formData[fieldKey] === "string" && String(formData[fieldKey]).trim() ? (
                <div className="space-y-3">
                  <img
                    src={String(formData[fieldKey]).trim()}
                    alt="Signature"
                    className="max-h-24 bg-white rounded"
                  />
                  <p className="text-white/60 text-xs">Signature captured</p>
                </div>
              ) : (
                <p className="text-white/40 text-xs italic mb-3">No signature yet</p>
              )}
              <button
                type="button"
                onClick={() => openSignatureModal(fieldKey)}
                className="w-full bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-5 py-2 rounded-md shadow mt-3"
              >
                {typeof formData[fieldKey] === "string" && String(formData[fieldKey]).trim()
                  ? "Redraw Signature"
                  : "Draw Signature"}
              </button>
            </div>
          </div>
        );

      // case "ASSESSMENT":
      //   return (
      //     <div key={`${fieldKey}_${index}`} className="mb-5">
      //       <h4 className="text-sm font-semibold text-white mb-2">{extra.name}</h4>
      //       {extra.buttonName && (
      //         <button
      //           type="button"
      //           onClick={() => openAssessment(extra)}
      //           className="mb-3 bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-5 py-2 rounded-md shadow"
      //         >
      //           {extra.buttonName}
      //         </button>
      //       )}
      //       {!extra.buttonName && (
      //         <button
      //           type="button"
      //           onClick={() => openAssessment(extra)}
      //           className="mb-3 rounded-md border border-white/25 bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/20"
      //         >
      //           Open Survey
      //         </button>
      //       )}
      //       {extra.checkboxes && extra.checkboxes.length > 0 && (
      //         <div className="space-y-2 pl-1">
      //           {extra.checkboxes.map((cb, i) => renderExtraComponent(cb, i, fieldKey))}
      //         </div>
      //       )}
      //     </div>
      //   );
      case "ASSESSMENT": {
  const assessmentId = getAssessmentIdFromExtra(extra);
  const state = assessmentId ? assessmentTaskState[assessmentId] : null;
const isSubmitted = state?.submitted === true;
// const hasScheduledMeeting = assessmentId
//   ? hasRoadmapAssessmentMeeting(assessmentId)
//   : false;
const scheduledMeeting = assessmentId
  ? getRoadmapAssessmentMeeting(assessmentId)
  : null;
  return (
    <div key={`${fieldKey}_${index}`} className="mb-5">
      <h4 className="mb-2 text-sm font-semibold text-white">{extra.name}</h4>

      {state?.submitted ? (
        <div className="mb-4 rounded-xl border border-[#5A8DCB]/40 bg-white/[0.06] p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                Assessment submitted
              </p>
              <p className="mt-1 text-xs text-white/60">
                You can view your submitted answers and CDP from this roadmap task.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    // `/pastor/Assessments/result?assessmentId=${assessmentId}&userId=${userId}&roadmapId=${roadmapId || ""}&taskId=${nestedItemId || ""}&parentId=${parentRoadmapId || ""}`,
                    `/pastor/Assessments/guidelines?assessmentId=${assessmentId}&roadmapId=${roadmapId || ""}&taskId=${nestedItemId || ""}&parentId=${parentRoadmapId || ""}`
                  )
                }
                className="rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/30"
              >
                View Submitted Answers
              </button>

              {state.hasCdp ? (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/pastor/Assessments/result/cdp?assessmentId=${assessmentId}&userId=${userId}&roadmapId=${roadmapId || ""}&taskId=${nestedItemId || ""}&parentId=${parentRoadmapId || ""}`,
                    )
                  }
                  className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  View CDP
                </button>
              ) : (
                // <button
                //   type="button"
                //   onClick={() => openAssessmentMeetingDrawer(extra)}
                //   className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
                // >
                //   Schedule Meeting
                // </button>
            <button
  type="button"
  onClick={() =>
    scheduledMeeting
      ? router.push(`/pastor/appointments/${scheduledMeeting._id || scheduledMeeting.id}`)
      : openAssessmentMeetingDrawer(extra)
  }
  className="rounded-lg border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
>
  {scheduledMeeting ? "View Meeting Details" : "Schedule Meeting"}
</button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => openAssessment(extra)}
          className="mb-3 rounded-md border border-white/25 bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/20"
        >
          {extra.buttonName || "Open Survey"}
        </button>
      )}

      {extra.checkboxes && extra.checkboxes.length > 0 && (
      
        <div className="space-y-2 pl-1">
          {extra.checkboxes.map((cb, i) => renderExtraComponent(cb, i, fieldKey))}
        </div>
      )}
    </div>
  );
}

      // case "SECTION":
      //   return (
      //     <div key={`${fieldKey}_${index}`} className="mb-5 border border-[#3B6EA0] rounded-lg p-4">
      //       <h4 className="text-sm font-semibold text-white mb-3">{extra.name}</h4>
      //       {extra.checkboxes && extra.checkboxes.length > 0 && (
      //         <div className="space-y-2 mb-3">
      //           {extra.checkboxes.map((cb, i) => renderExtraComponent(cb, i, fieldKey))}
      //         </div>
      //       )}
      //       {extra.sections && extra.sections.length > 0 && (
      //         <div className="space-y-3">
      //           {extra.sections.map((sec, i) => renderExtraComponent(sec, i, fieldKey))}
      //         </div>
      //       )}
      //     </div>
      //   );
case "SECTION":
  return (
    <div
      key={`${fieldKey}_${index}`}
      className="mb-6 rounded-2xl border border-[#5A8DCB]/60 bg-white/[0.04] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.12)]"
    >
      <div className="mb-4 border-b border-white/10 pb-3">
        <h4 className="text-base font-semibold text-white">
          {extra.name || "Section"}
        </h4>
        <p className="mt-1 text-xs text-[#cde2f2]/60">
          Section fields
        </p>
      </div>

      <div className="space-y-4">
        {extra.checkboxes && extra.checkboxes.length > 0 ? (
          <div className="space-y-2">
            {extra.checkboxes.map((cb, i) => renderExtraComponent(cb, i, fieldKey))}
          </div>
        ) : null}

        {extra.sections && extra.sections.length > 0 ? (
          <div className="space-y-3">
            {extra.sections.map((sec, i) => renderExtraComponent(sec, i, fieldKey))}
          </div>
        ) : null}
      </div>
    </div>
  );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (!nestedItemId) {
    return (
      <div className={pastorRoadmapDashboardPageRoot}>
        <PastorHeader showFullHeader={true} />
        <PastorRoadmapDashboardBody>
          <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center px-4 text-center">
            <div className={`${directorGlassCard} max-w-md p-6`}>
              <p className="text-white/80">
                Missing task link. Open a phase from{" "}
                <a
                  href="/pastor/revitalization-roadmap"
                  className="font-semibold text-[#aed6f1] underline underline-offset-2 hover:text-white"
                >
                  Revitalization Roadmap
                </a>{" "}
                and select a task.
              </p>
            </div>
          </div>
        </PastorRoadmapDashboardBody>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={pastorRoadmapDashboardPageRoot}>
        <PastorHeader showFullHeader={true} />
        <PastorRoadmapDashboardBody>
          <div className="flex min-h-[70vh] flex-1 items-center justify-center">
            <div className={directorSpinner} />
          </div>
        </PastorRoadmapDashboardBody>
      </div>
    );
  }

  if (roadmapLoadError || !roadmap) {
    return (
      <div className={pastorRoadmapDashboardPageRoot}>
        <PastorHeader showFullHeader={true} />
        <PastorRoadmapDashboardBody>
          <div className="flex min-h-[60vh] flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="max-w-md text-amber-100/95">{roadmapLoadError || "Task not found."}</p>
            <a href="/pastor/revitalization-roadmap" className={`${directorBtnPrimary} inline-flex no-underline`}>
              Back
            </a>
          </div>
        </PastorRoadmapDashboardBody>
      </div>
    );
  }

  const title = roadmap?.name || "Jump Start";
  const duration = roadmap?.duration || "";
  const description = roadmap?.description || roadmap?.roadMapDetails || "";
  const extras = templateExtras;
  const phaseTag = typeof roadmap?.phase === "string" ? roadmap.phase.trim() : "";

  const heroCoverSrc =
    typeof roadmap.imageUrl === "string" &&
    roadmap.imageUrl.trim() &&
    (roadmap.imageUrl.startsWith("http://") ||
      roadmap.imageUrl.startsWith("https://") ||
      roadmap.imageUrl.startsWith("/"))
      ? roadmap.imageUrl.trim()
      : HeroBg;

  const heroSubtitle = [
    `Status: ${formatListStatusLabel(listAlignedStatus)}`,
    duration ? `Completion time ${duration}` : "",
    roadmap?.startDate || roadmap?.endDate
      ? `${roadmap?.startDate ? formatDate(String(roadmap.startDate)) : "—"} — ${roadmap?.endDate ? formatDate(String(roadmap.endDate)) : "—"}`
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className={pastorRoadmapDashboardPageRoot}>
      <PastorHeader showFullHeader={true} />

      <PastorRoadmapDashboardBody>
        <DirectorHero
          title={title}
          subtitle={heroSubtitle}
          detail={phaseTag ? phaseTag : undefined}
          image={heroCoverSrc}
          breadcrumbItems={[
            { label: "Home", href: "/pastor/home" },
            { label: "Revitalization Roadmap", href: "/pastor/revitalization-roadmap" },
            ...(parentRoadmapId && parentPhaseLabel?.trim()
              ? [
                  {
                    label: parentPhaseLabel.trim(),
                    href: `/pastor/SelfRevitalizationPhasePage?id=${encodeURIComponent(parentRoadmapId)}`,
                  },
                ]
              : []),
            { label: title },
          ]}
        />

      <main className="flex-1 pb-12">
        <div className={`${directorPageContainer} max-w-7xl px-4 sm:px-6 lg:px-8`}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[250px_1fr] lg:gap-10">

          {/* LEFT PANEL */}
          <div className={`${directorGlassCard} flex h-fit w-full flex-col gap-2 p-3`}>
            {[
              { key: "overview", label: "Over View", count: 0 },
              { key: "comments", label: "Comments", count: commentsCount },
              { key: "queries", label: "Queries", count: queriesCount },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === item.key
                    ? "border-[#3498DB]/40 bg-[#3498DB]/15 text-white shadow-sm"
                    : "border-transparent text-[#d9ebf8] hover:bg-white/10"
                }`}
              >
                <span>{item.label}</span>
                {item.count > 0 ? (
                  <span
                    className={`rounded-full px-2 py-[1px] text-xs font-semibold ${
                      activeTab === item.key
                        ? "bg-[#0f4a76]/15 text-[#0f4a76]"
                        : "bg-white/15 text-white"
                    }`}
                  >
                    {item.count}
                  </span>
                ) : null}
              </button>
            ))}
          </div>

          {/* RIGHT CONTENT */}
          <div>
            {/* ── OVERVIEW ── */}
            {activeTab === "overview" && (
              <>
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold">Over View</h2>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold ${listStatusBadgeClass(
                        listAlignedStatus,
                      )}`}
                    >
                      {formatListStatusLabel(listAlignedStatus)}
                    </span>
                  </div>
                  {/* <button type="button" className="text-white/80 hover:text-white text-sm">
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                  </button> */}
                </div>

                {description && (
                  <div className="mb-6 rounded-lg border border-white/20 bg-white/10 p-4">
                    <h3 className="text-sm font-semibold text-white mb-2">Description</h3>
                    <p className={pastorRoadmapDescriptionOverview}>{description}</p>
                  </div>
                )}

                {extras.length > 0 && (
                  <div className="mb-6 rounded-lg border border-white/20 bg-white/10 p-5">
                    <h3 className="mb-4 flex items-center gap-3 text-sm font-semibold text-white">
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white/90"
                        aria-hidden
                      >
                        <i className="fa-regular fa-clipboard text-[15px]" />
                      </span>
                      {roadmap?.type === "single" ? "Form" : "Tasks"}
                    </h3>
                    <div>{extras.map((extra, i) => renderExtraComponent(extra, i, "extra"))}</div>
                  </div>
                )}

                <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6">
                  <div className="min-h-[1.25rem] text-sm">
                    {saveSuccess && (
                      <span className="inline-flex items-center gap-1 text-emerald-300">
                        <i className="fa-solid fa-circle-check" /> Saved
                      </span>
                    )}
                    {!saveSuccess && saveFeedback && (
                      <span className="inline-flex items-center gap-1 text-amber-200">{saveFeedback}</span>
                    )}
                    {completeFeedback && (
                      <span
                        className={`inline-flex items-center gap-1 ${saveSuccess ? "ml-3" : ""} ${
                          completeFeedback.startsWith("Marked") ? "text-emerald-300" : "text-amber-200"
                        }`}
                      >
                        {completeFeedback.startsWith("Marked") ? (
                          <i className="fa-solid fa-circle-check" />
                        ) : null}
                        {completeFeedback}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <button
                      type="button"
                      onClick={() => router.push("/pastor/revitalization-roadmap")}
                      className={`${directorBtnSecondary} w-full justify-center sm:w-auto`}
                    >
                      Back
                    </button>
                    <div className="flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || !roadmapId || !userId}
                        className="rounded-md border border-white/30 bg-white/10 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {saving ? "Saving…" : "Save and continue"}
                      </button>
                      {/* {listAlignedStatus !== "Completed" ? (
                        <button
                          type="button"
                          onClick={handleMarkComplete}
                          disabled={
                            completeLoading ||
                            !hasRequiredSignature ||
                            !hasRequiredUploads ||
                            !hasRequiredSubmissions
                          }
                          className="rounded-md bg-white px-6 py-2 text-sm font-semibold text-[#0f4a76] shadow transition hover:bg-[#e7f1fa] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {completeLoading ? "Submitting…" : "Submit"}
                        </button>
                      ) : null} */}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── COMMENTS ── */}
            {activeTab === "comments" && (
              <>
                <h2 className="text-xl font-semibold mb-6">Comments</h2>

                {commentsLoading ? (
                  <div className="flex justify-center py-16">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-16 text-white/50">
                    <i className="fa-regular fa-comments text-5xl mb-4 block"></i>
                    <p>No comments yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {comments.map((c) => {
                      const mentor = c.mentorId;
                      const name = mentor
                        ? `${mentor.firstName} ${mentor.lastName}`
                        : "Mentor";
                      const role = mentor?.role || "Mentor";
                      const avatar = mentor?.profilePicture || null;

                      return (
                        <div
                          key={c._id}
                          className="flex items-start justify-between rounded-lg border border-white/20 bg-white/10 p-4 text-[#d9ebf8] shadow-sm"
                        >
                          <div className="flex gap-3">
                            {avatar ? (
                              <img
                                src={avatar}
                                alt={name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <Image
                                src={UserPlaceholder}
                                alt={name}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-semibold text-white">{name}</h4>
                                <span className="text-xs text-white/60">
                                  {formatDate(c.addedDate)}
                                </span>
                              </div>
                              <p className="mb-1 text-xs capitalize text-white/70">{role}</p>
                              <p className="text-sm text-white">{c.text}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                            <div className="flex gap-4 text-[#103C8C] text-sm">
                              <i className="fa-regular fa-envelope cursor-pointer"></i>
                              <i className="fa-regular fa-comment cursor-pointer"></i>
                              <i className="fa-solid fa-phone cursor-pointer"></i>
                              <i className="fa-brands fa-whatsapp cursor-pointer"></i>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* ── QUERIES ── */}
            {activeTab === "queries" && (
              <>
                <h2 className="text-[20px] font-semibold mb-4 border-b border-white/30 pb-2">
                  Queries
                </h2>
                <div className="flex justify-end mb-5">
                    <div className="flex overflow-hidden rounded-lg border border-white/20 bg-white/10 shadow-sm">
                    {["New", "Answered", "Pending"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setQueryTab(tab)}
                        className={`px-6 py-[7px] text-sm font-medium transition-all duration-200 ${
                          queryTab === tab
                            ? "m-2 bg-white text-[#0f4a76]"
                            : "bg-transparent text-[#d9ebf8] hover:bg-white/15"
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>

                {/* New Query Form */}
                {queryTab === "New" && (
                  <div className="rounded-xl p-6">
                    <p className="text-[15px] font-semibold mb-2">Submit your question here.</p>
                    <div className="relative">
                      <textarea
                        placeholder="Write Your Questions..."
                        value={newQueryText}
                        onChange={(e) => setNewQueryText(e.target.value)}
                        maxLength={250}
                        className="w-full rounded-md bg-transparent border border-[#7FB6EA] text-white text-sm p-3 focus:outline-none focus:ring-1 focus:ring-[#00B3FF] resize-none h-28 mb-2"
                      />
                      <span className="text-xs text-white/60 absolute bottom-4 right-4">
                        ({newQueryText.length} Words)
                      </span>
                    </div>
                    {querySuccess && (
                      <p className="text-green-300 text-sm mb-2 flex items-center gap-1">
                        <i className="fa-solid fa-circle-check"></i> Query submitted successfully!
                      </p>
                    )}
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={handleSubmitQuery}
                        disabled={querySubmitting || !newQueryText.trim()}
                        className="rounded-md border border-white/20 bg-white px-8 py-[6px] text-sm font-semibold text-[#0f4a76] shadow-sm transition hover:bg-[#e7f1fa] disabled:opacity-60"
                      >
                        {querySubmitting ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Answered / Pending queries list */}
                {(queryTab === "Answered" || queryTab === "Pending") && (
                  <>
                    {queriesLoading ? (
                      <div className="flex justify-center py-16">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : queries.length === 0 ? (
                      <div className="text-center py-16 text-white/50">
                        <i className="fa-regular fa-circle-question text-5xl mb-4 block"></i>
                        <p>No {queryTab.toLowerCase()} queries.</p>
                      </div>
                    ) : (
                      <div className="space-y-8 mt-4">
                        {queries.map((q) => (
                          <div key={q._id} className="border-b border-white/20 pb-6">
                            {/* Pastor's question */}
                            <div className="flex items-start gap-3 mb-3">
                              <Image
                                src={UserPlaceholder}
                                alt={sessionDisplayName || "You"}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                              <div className="min-w-0">
                                <h4 className="font-semibold text-sm">{sessionDisplayName || "You"}</h4>
                                <p className="mb-1 text-xs text-white/70">{formatDate(q.createdDate)}</p>
                                {pastorEditingQueryId === q._id ? (
                                  <textarea
                                    value={pastorEditingQueryText}
                                    onChange={(e) => setPastorEditingQueryText(e.target.value)}
                                    maxLength={250}
                                    rows={3}
                                    className="mt-1 w-full resize-none rounded-md border border-[#7FB6EA] bg-transparent p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-[#00B3FF]"
                                  />
                                ) : (
                                  <p className="text-sm text-white/90">{q.actualQueryText}</p>
                                )}
                                {queryTab === "Pending" && q.status !== "answered" && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {pastorEditingQueryId === q._id ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => void handleSavePastorQueryEdit(q._id)}
                                          disabled={
                                            Boolean(queryActionLoadingId) ||
                                            !pastorEditingQueryText.trim()
                                          }
                                          className="rounded-md border border-white/25 bg-white px-4 py-1.5 text-xs font-semibold text-[#0f4a76] hover:bg-[#e7f1fa] disabled:opacity-50"
                                        >
                                          {queryActionLoadingId === q._id ? "Saving…" : "Save"}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={cancelPastorQueryEdit}
                                          disabled={Boolean(queryActionLoadingId)}
                                          className="rounded-md border border-white/20 bg-transparent px-4 py-1.5 text-xs font-semibold text-[#d9ebf8] hover:bg-white/10 disabled:opacity-50"
                                        >
                                          Cancel
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => beginPastorQueryEdit(q)}
                                          disabled={Boolean(queryActionLoadingId)}
                                          className="rounded-md border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white hover:bg-white/15 disabled:opacity-50"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => void handleDeletePastorQuery(q._id)}
                                          disabled={Boolean(queryActionLoadingId)}
                                          className="rounded-md border border-red-400/40 bg-red-500/15 px-4 py-1.5 text-xs font-semibold text-red-100 hover:bg-red-500/25 disabled:opacity-50"
                                        >
                                          {queryActionLoadingId === q._id ? "…" : "Delete"}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Mentor reply (Answered) */}
                            {q.status === "answered" && q.repliedAnswer ? (
                              <div className="ml-11 w-[90%] rounded-lg border border-white/20 bg-white/10 p-4">
                                <div className="flex items-start gap-3">
                                  {q.repliedMentorId?.profilePicture ? (
                                    <img
                                      src={q.repliedMentorId.profilePicture}
                                      alt="Mentor"
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  ) : (
                                    <Image
                                      src={UserPlaceholder}
                                      alt="Mentor"
                                      className="w-8 h-8 rounded-full object-cover"
                                    />
                                  )}
                                  <div>
                                    <h4 className="font-semibold text-sm">
                                      {q.repliedMentorId
                                        ? `${q.repliedMentorId.firstName} ${q.repliedMentorId.lastName}`
                                        : "Mentor"}
                                    </h4>
                                    {q.repliedDate && (
                                      <p className="text-xs text-white/70 mb-1">
                                        {formatDate(q.repliedDate)}
                                      </p>
                                    )}
                                    {q.repliedMentorId?.role && (
                                      <p className="text-xs text-white/70 mb-2 capitalize">
                                        {q.repliedMentorId.role}
                                      </p>
                                    )}
                                    <p className="text-sm text-white/90">{q.repliedAnswer}</p>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              /* Pending — waiting for response */
                              <div className="ml-11 flex w-[90%] items-center gap-2 rounded-lg border border-white/20 bg-white/10 p-4">
                                <i className="fa-solid fa-spinner animate-spin text-white/70 text-sm"></i>
                                <p className="text-sm text-white/80">Waiting for response</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
        </div>

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
                        value={mentorSearch}
                        onChange={setMentorSearch}
                        placeholder="Search mentors"
                        aria-label="Search mentors"
                        className="max-w-none"
                      />
                    </div>

                    <div className="space-y-2">
                      {filteredMentors.map((mentor) => {
                        const mentorId = String(mentor.id ?? mentor._id ?? "");
                        const selected = String(selectedMentor?.id ?? selectedMentor?._id ?? "") === mentorId;
                        return (
                          <div
                            key={mentorId}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedMentor(mentor)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setSelectedMentor(mentor);
                              }
                            }}
                            className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 transition ${
                              selected
                                ? "border-[#8ec5eb]/60 bg-white/10 shadow-[0_0_0_1px_rgba(142,197,235,0.25)]"
                                : "border-white/15 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Image
                                src={UserPlaceholder}
                                alt=""
                                width={32}
                                height={32}
                                className="rounded-full ring-2 ring-white/10"
                              />
                              <div>
                                <p className="text-sm font-medium text-white">
                                  {[mentor.firstName, mentor.lastName].filter(Boolean).join(" ").trim() ||
                                    String(mentor.name ?? "Mentor")}
                                </p>
                                <p className="text-xs capitalize text-[#cde2f2]/80">
                                  {String(mentor.role ?? "mentor").replace(/-/g, " ")}
                                </p>
                              </div>
                            </div>
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                selected ? "border-[#8ec5eb] bg-[#8ec5eb]" : "border-white/35"
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
                    <label className={pastorFieldLabel}>Mentor Availability</label>
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
                    {availabilityLoading || calendarSlotSyncLoading ? (
                      <div className="mb-4 flex items-center justify-center py-6">
                        <div className="flex items-center gap-2 text-xs text-[#cde2f2]">
                          <span className="h-2 w-2 animate-pulse rounded-full bg-[#8ec5eb]" />
                          Checking availability &amp; syncing Google Calendar...
                        </div>
                      </div>
                    ) : calendarSlotSyncError ? (
                      <p className="mb-4 rounded-lg border border-amber-400/35 bg-amber-500/10 px-3 py-2 text-xs text-amber-50">
                        {calendarSlotSyncError}
                      </p>
                    ) : availableTimesForBooking.length === 0 ? (
                      <p className="mb-4 text-xs text-[#cde2f2]/85">
                        No open slots on this date. Please try another day.
                      </p>
                    ) : (
                      <div className="mb-4 space-y-2">
                        {!calendarSlotSyncSkipped && calendarBusyStripped > 0 ? (
                          <p className="text-xs text-[#cde2f2]/80">
                            Some times are hidden because they overlap with Google Calendar events.
                          </p>
                        ) : null}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          {availableTimesForBooking.map((time: any) => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setSelectedTime(time)}
                              className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                                selectedTime === time
                                  ? "border-[#8ec5eb] bg-[#8ec5eb]/25 text-white shadow-[0_0_0_1px_rgba(142,197,235,0.35)]"
                                  : "border-[#8ec5eb]/30 bg-[#8ec5eb]/10 text-white hover:border-[#8ec5eb]/55 hover:bg-[#8ec5eb]/20"
                              }`}
                            >
                              {time}
                            </button>
                          ))}
                        </div>
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
                    </select>
                  </>
                )}
              </div>

              <div className="flex justify-between gap-3 border-t border-white/15 px-6 py-4">
                <button
                  type="button"
                  onClick={() => (drawerStep === "mentor" ? setDrawerOpen(false) : setDrawerStep("mentor"))}
                  className="text-sm font-medium text-[#8ec5eb] transition hover:text-white"
                >
                  {drawerStep === "mentor" ? "Cancel" : "Back"}
                </button>

                {drawerStep === "mentor" ? (
                  <button type="button" onClick={() => setDrawerStep("schedule")} className={pastorPrimaryCta}>
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleScheduleAssessmentMeeting}
                    disabled={isScheduling}
                    className={`${pastorPrimaryCta} ${isScheduling ? "cursor-not-allowed opacity-70" : ""}`}
                  >
                    {isScheduling ? "Scheduling..." : "Schedule"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Signature Drawing Modal */}
        {signatureModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-[#0F3A62] border border-[#5A8DCB] rounded-lg p-6 w-full max-w-2xl mx-4 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-4">Draw Your Signature</h3>
              
              <div className="mb-4">
                <p className="text-sm text-white/70 mb-3">Use your mouse or touch to sign in the box below:</p>
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={200}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  // className="w-full border-2 border-[#5A8DCB] rounded-md bg-white cursor-crosshair"
                  className="w-full border-2 border-[#8ec5eb] rounded-md bg-[#f8fafc] cursor-crosshair shadow-inner"
                />
              </div>

              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={clearSignature}
                  className="flex-1 bg-[#4A5F7F] hover:bg-[#3A4F6F] transition text-white text-sm font-medium px-4 py-2 rounded-md"
                >
                  <i className="fa-solid fa-rotate-left mr-2"></i>Clear
                </button>
                <button
                  type="button"
                  onClick={saveSignature}
                  className="flex-1 bg-[#1E5A96] hover:bg-[#154B7F] transition text-white text-sm font-medium px-4 py-2 rounded-md"
                >
                  <i className="fa-solid fa-image mr-2"></i>Preview
                </button>
              </div>

              {signaturePreview && (
                <div className="mb-4 p-3 bg-white/10 rounded-md">
                  <p className="text-xs text-white/60 mb-2">Signature Preview:</p>
                  <img src={signaturePreview} alt="Signature Preview" className="max-h-24 bg-white rounded" />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSignatureModalOpen(false);
                    setActiveSignatureField(null);
                    setSignaturePreview(null);
                  }}
                  className="flex-1 border border-white/25 hover:bg-white/10 transition text-white text-sm font-medium px-4 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmSignature}
                  disabled={!signaturePreview}
                  className="flex-1 bg-[#103C8C] hover:bg-[#0B2E72] disabled:opacity-50 transition text-white text-sm font-medium px-4 py-2 rounded-md"
                >
                  <i className="fa-solid fa-check mr-2"></i>Confirm & Save
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      </PastorRoadmapDashboardBody>
    </div>
  );
}

export default function JumpStartPage() {
  return (
    <Suspense
      fallback={
        <div className={pastorRoadmapDashboardPageRoot}>
          <div className="flex min-h-screen flex-1 items-center justify-center">
            <div className={directorSpinner} />
          </div>
        </div>
      }
    >
      <JumpStartContent />
    </Suspense>
  );
}
