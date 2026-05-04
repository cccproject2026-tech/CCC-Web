"use client";
import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import Image from "next/image";
import { isAxiosError } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import DirectorHero from "@/app/director/DirectorHero";
import {
  directorBtnPrimary,
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
  apiGetComments,
  apiAddQuery,
  apiGetQueries,
  apiUpdateRoadmapProgress,
  apiGetUserProgress,
  apiTriggerJumpstartComplete,
  apiUpdateNestedRoadmapItem,
  apiUpdateRoadmap,
} from "@/app/Services/api";
import {
  deriveTaskStatusForList,
  unwrapProgressData,
  type RoadmapAssignmentUi,
} from "@/app/Services/roadmap-assignments";
import { pastorRoadmapDescriptionOverview } from "@/app/Components/pastor/pastor-theme";
import type { ProgressResponse } from "@/app/Services/types/progress.types";
import { getCookie } from "@/app/utils/cookies";
import { getPastorUserId } from "@/app/utils/pastor-auth";
import { emitProgressUpdated } from "@/app/utils/progress-sync";
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
  navigateTo?: string;
  placeHolder?: string;
  buttonName?: string;
  date?: string;
  haveButton?: boolean;
  checkboxes?: ExtraComponent[];
  sections?: ExtraComponent[];
}

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
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [extrasExist, setExtrasExist] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [completeFeedback, setCompleteFeedback] = useState<string | null>(null);

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
    const extras = (roadmap?.extras as ExtraComponent[] | undefined) ?? [];
    extras.forEach((extra) => {
      if (extra?.date) init[extra.name] = extra.date;
    });
    return init;
  }, [roadmap?.extras]);

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

  return checkExtras(roadmap?.extras as ExtraComponent[] | undefined, "extra");
}, [roadmap?.extras, formData]);
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
        const hasUploadedFile = !!uploadedFiles[fieldKey];
        const hasSavedUpload =
          formData[fieldKey] === true || formData[fieldKey] === "true";

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

  return checkExtras(roadmap?.extras as ExtraComponent[] | undefined, "extra");
}, [roadmap?.extras, uploadedFiles, formData]);

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

      if (extra.checkboxes?.length) {
        if (!checkExtras(extra.checkboxes, fieldKey)) return false;
      }

      if (extra.type === "SECTION" && extra.sections?.length) {
        if (!checkExtras(extra.sections, fieldKey)) return false;
      }
    }

    return true;
  };

  return checkExtras(roadmap?.extras as ExtraComponent[] | undefined, "extra");
}, [roadmap?.extras, formData]);

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
              const fromParent = Array.isArray(parentDoc?.roadmaps)
                ? parentDoc.roadmaps.find((r: any) => String(r?._id) === String(nestedItemId))
                : null;
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
  }, [roadmapId, userId]);

  const fetchQueries = useCallback(async (status?: string, showLoader = false) => {
    if (!roadmapId || !userId) return;
    if (showLoader) setQueriesLoading(true);
    try {
      const res = await apiGetQueries(roadmapId, userId, status);
      const threads: any[] = res.data?.data || res.data || [];
      const allQueries = Array.isArray(threads)
        ? threads.flatMap((t: any) => t?.queries || [])
        : (threads as any)?.queries || [];
      setQueries(allQueries);
      if (!status) setQueriesCount(allQueries.length);
    } catch {
      setQueries([]);
      if (!status) setQueriesCount(0);
    } finally {
      if (showLoader) setQueriesLoading(false);
    }
  }, [roadmapId, userId]);

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

  const scopedNestedId = nestedRoadMapItemIdForExtras;

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
            const fromParent = Array.isArray(parentDoc?.roadmaps)
              ? parentDoc.roadmaps.find((r: any) => String(r?._id) === String(nestedItemId))
              : null;
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

  const handleFileUpload = async (key: string, file: File) => {
    setUploadedFiles((prev) => ({ ...prev, [key]: file }));
  };

  const getAssessmentIdFromExtra = (extra: ExtraComponent): string | null => {
    if (extra.assessmentId && String(extra.assessmentId).trim()) {
      return String(extra.assessmentId).trim();
    }
    const fromNav = String(extra.navigateTo || "");
    if (!fromNav) return null;
    const q = /[?&]assessmentId=([^&]+)/i.exec(fromNav);
    if (q?.[1]) return decodeURIComponent(q[1]).trim();
    return null;
  };

  const openAssessment = (extra: ExtraComponent) => {
    const assessmentId = getAssessmentIdFromExtra(extra);
    if (!assessmentId) {
      setCompleteFeedback("This survey is not linked to an assessment yet.");
      setTimeout(() => setCompleteFeedback(null), 4000);
      return;
    }
    router.push(
      `/pastor/Assessments/guidelines?assessmentId=${encodeURIComponent(assessmentId)}`,
    );
  };

  const handleSave = async () => {
    if (!roadmapId || !userId || !roadmap) {
      setSaveFeedback("Sign in again or open this task from your roadmap.");
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
        uploadKeys: Object.keys(uploadedFiles || {}),
      });
      await ensureJumpstartTriggered();
      const mergedForm: Record<string, any> = { ...formData };
      // Mobile parity: only UPLOAD extras become boolean flags.
      // Do NOT overwrite SIGNATURE dataUrl with `true` (that breaks persistence + hydration).
      Object.keys(uploadedFiles).forEach((k) => {
        const extraDef = (roadmap?.extras as ExtraComponent[] | undefined)?.find(
          (e) => e.name === k,
        );
        if (extraDef?.type === "UPLOAD") mergedForm[k] = true;
      });

      // Mobile parity: build extrasArray from Object.entries(formData), no name transforms.
      const getExtraType = (fieldName: string, value: any): string => {
        const extraDef = (roadmap?.extras as ExtraComponent[] | undefined)?.find(
          (e) => e.name === fieldName,
        );
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
      for (const [key, file] of Object.entries(uploadedFiles)) {
        await apiUploadExtrasDocuments(roadmapId, userId, [file], scopedNestedId, key);
      }
      await refetchRoadmap();
      await refetchProgressData();
      emitProgressUpdated(userId);
      await fetchComments(false);
      await fetchQueries(undefined, false);
      setSaveSuccess(true);
      setSaveFeedback(extrasExist ? "Progress updated." : "Progress saved.");
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
      await apiAddQuery(roadmapId, { actualQueryText: newQueryText.trim(), userId });
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
      await handleFileUpload(activeSignatureField, file);
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

      case "DATE_PICKER":
        return (
          <div key={`${fieldKey}_${index}`} className="mb-5">
            <h4 className="text-sm font-semibold text-white mb-2">{extra.name}</h4>
            {extra.buttonName ? (
              <button
                type="button"
                className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-5 py-2 rounded-md shadow"
              >
                {extra.buttonName}
              </button>
            ) : null}
            {extra.checkboxes && extra.checkboxes.length > 0 && (
              <div className="mt-3 space-y-2 pl-1">
                {extra.checkboxes.map((cb, i) => renderExtraComponent(cb, i, fieldKey))}
              </div>
            )}
          </div>
        );

      case "UPLOAD":
        return (
          <div key={`${fieldKey}_${index}`} className="mb-5">
            <h4 className="text-sm font-semibold text-white mb-2">{extra.name}</h4>
            {uploadedFiles[fieldKey] ? (
              <div className="bg-white/10 border border-[#5A8DCB] rounded-lg p-3 flex items-center gap-3">
                <i className="fa-solid fa-file text-blue-300"></i>
                <span className="text-sm text-white">{uploadedFiles[fieldKey].name}</span>
                <button
                  type="button"
                  onClick={() =>
                    setUploadedFiles((prev) => {
                      const n = { ...prev };
                      delete n[fieldKey];
                      return n;
                    })
                  }
                  className="ml-auto text-white/50 hover:text-white text-xs"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-[#5A8DCB] rounded-lg p-5 text-center">
                <input
                  type="file"
                  onChange={(e) =>
                    e.target.files?.[0] && handleFileUpload(fieldKey, e.target.files[0])
                  }
                  className="hidden"
                  id={`upload-${fieldKey}`}
                />
                <label htmlFor={`upload-${fieldKey}`} className="cursor-pointer">
                  <i className="fa-solid fa-cloud-arrow-up text-white/50 text-2xl mb-2 block"></i>
                  <span className="text-sm text-white/70">Click to upload file</span>
                </label>
              </div>
            )}
          </div>
        );

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

      case "ASSESSMENT":
        return (
          <div key={`${fieldKey}_${index}`} className="mb-5">
            <h4 className="text-sm font-semibold text-white mb-2">{extra.name}</h4>
            {extra.buttonName && (
              <button
                type="button"
                onClick={() => openAssessment(extra)}
                className="mb-3 bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-5 py-2 rounded-md shadow"
              >
                {extra.buttonName}
              </button>
            )}
            {!extra.buttonName && (
              <button
                type="button"
                onClick={() => openAssessment(extra)}
                className="mb-3 rounded-md border border-white/25 bg-white/10 px-5 py-2 text-sm font-medium text-white transition hover:bg-white/20"
              >
                Open Survey
              </button>
            )}
            {extra.checkboxes && extra.checkboxes.length > 0 && (
              <div className="space-y-2 pl-1">
                {extra.checkboxes.map((cb, i) => renderExtraComponent(cb, i, fieldKey))}
              </div>
            )}
          </div>
        );

      case "SECTION":
        return (
          <div key={`${fieldKey}_${index}`} className="mb-5 border border-[#3B6EA0] rounded-lg p-4">
            <h4 className="text-sm font-semibold text-white mb-3">{extra.name}</h4>
            {extra.checkboxes && extra.checkboxes.length > 0 && (
              <div className="space-y-2 mb-3">
                {extra.checkboxes.map((cb, i) => renderExtraComponent(cb, i, fieldKey))}
              </div>
            )}
            {extra.sections && extra.sections.length > 0 && (
              <div className="space-y-3">
                {extra.sections.map((sec, i) => renderExtraComponent(sec, i, fieldKey))}
              </div>
            )}
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
              Back to Revitalization Roadmap
            </a>
          </div>
        </PastorRoadmapDashboardBody>
      </div>
    );
  }

  const title = roadmap?.name || "Jump Start";
  const duration = roadmap?.duration || "";
  const description = roadmap?.description || roadmap?.roadMapDetails || "";
  const extras: ExtraComponent[] = roadmap?.extras || [];
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
          pill="Leadership Support Network"
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
                  <button type="button" className="text-white/80 hover:text-white text-sm">
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                  </button>
                </div>

                {description && (
                  <div className="mb-6 rounded-lg border border-white/20 bg-white/10 p-4">
                    <h3 className="text-sm font-semibold text-white mb-2">Description</h3>
                    <p className={pastorRoadmapDescriptionOverview}>{description}</p>
                  </div>
                )}

                {extras.length > 0 && (
                  <div className="mb-6 rounded-lg border border-white/20 bg-white/10 p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">
                      {roadmap?.type === "single" ? "Form" : "Tasks"}
                    </h3>
                    <div>
                      {extras.map((extra, i) => renderExtraComponent(extra, i, "extra"))}
                    </div>
                  </div>
                )}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-h-[1.25rem] text-sm">
                    {saveSuccess && (
                      <span className="inline-flex items-center gap-1 text-emerald-300">
                        <i className="fa-solid fa-circle-check" /> Saved
                      </span>
                    )}
                    {!saveSuccess && saveFeedback && (
                      <span className="inline-flex items-center gap-1 text-amber-200">
                        {saveFeedback}
                      </span>
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
                  <div className="flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={saving || !roadmapId || !userId}
                      className="rounded-md border border-white/30 bg-white/10 px-6 py-2 text-sm font-semibold text-white shadow transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {saving ? "Saving…" : extrasExist ? "Update" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={handleMarkComplete}
                      // disabled={completeLoading || listAlignedStatus === "Completed"}
                      // disabled={completeLoading || listAlignedStatus === "Completed" || !hasRequiredSignature}
//                       disabled={
//   completeLoading ||
//   listAlignedStatus === "Completed" ||
//   !hasRequiredSignature ||
//   !hasRequiredUploads
// }

disabled={
  completeLoading ||
  listAlignedStatus === "Completed" ||
  !hasRequiredSignature ||
  !hasRequiredUploads ||
  !hasRequiredSubmissions
}
                      className="rounded-md bg-white px-6 py-2 text-sm font-semibold text-[#0f4a76] shadow transition hover:bg-[#e7f1fa] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {completeLoading
                        ? "Updating…"
                        : listAlignedStatus === "Completed"
                          ? "Completed"
                          : "Mark as Completed"}
                    </button>
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
                              <div>
                                <h4 className="font-semibold text-sm">
                                  {sessionDisplayName || "You"}
                                </h4>
                                <p className="text-xs text-white/70 mb-1">
                                  {formatDate(q.createdDate)}
                                </p>
                                <p className="text-sm text-white/90">{q.actualQueryText}</p>
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
