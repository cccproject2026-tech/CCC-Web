"use client";
import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from "react";
import Image from "next/image";
import { isAxiosError } from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
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
} from "@/app/Services/api";
import {
  deriveTaskStatusForList,
  unwrapProgressData,
  type RoadmapAssignmentUi,
} from "@/app/Services/roadmap-assignments";
import { pastorRoadmapDescriptionOverview } from "@/app/Components/pastor/pastor-theme";
import type { ProgressResponse } from "@/app/Services/types/progress.types";
import { getCookie } from "@/app/utils/cookies";
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

/** Stable field id aligned with mobile (name-based paths under parent `::`). */
function fieldKeyFor(parentKey: string, extra: ExtraComponent): string {
  return parentKey ? `${parentKey}::${extra.name}` : extra.name;
}

/** Walk task extras tree: fieldKey → definition + default dates (dynamic from roadmap JSON). */
function collectExtraFieldMeta(
  list: ExtraComponent[] | undefined,
  parentKey = "",
): { meta: Map<string, ExtraComponent>; defaults: Record<string, unknown> } {
  const meta = new Map<string, ExtraComponent>();
  const defaults: Record<string, unknown> = {};
  if (!list?.length) return { meta, defaults };
  for (const e of list) {
    const fk = fieldKeyFor(parentKey, e);
    meta.set(fk, e);
    if (e.type === "DATE_PICKER" && e.date) defaults[fk] = e.date;
    if (e.checkboxes?.length) {
      const inner = collectExtraFieldMeta(e.checkboxes, fk);
      inner.meta.forEach((v, k) => meta.set(k, v));
      Object.assign(defaults, inner.defaults);
    }
    if (e.type === "SECTION" && e.sections?.length) {
      const inner = collectExtraFieldMeta(e.sections, fk);
      inner.meta.forEach((v, k) => meta.set(k, v));
      Object.assign(defaults, inner.defaults);
    }
  }
  return { meta, defaults };
}

function resolveFieldKeyFromApiName(apiName: string, validKeys: string[]): string | null {
  if (validKeys.includes(apiName)) return apiName;
  const matches = validKeys.filter((k) => k.endsWith(`::${apiName}`));
  if (matches.length >= 1) return matches[matches.length - 1];
  return null;
}

function leafNameFromFieldKey(fieldKey: string): string {
  const parts = fieldKey.split("::");
  return parts[parts.length - 1] || fieldKey;
}

function buildTypedExtrasPayload(
  formData: Record<string, any>,
  roots: ExtraComponent[] | undefined,
): Record<string, any>[] {
  const { meta } = collectExtraFieldMeta(roots);
  const out: Record<string, any>[] = [];
  for (const [fieldKey, raw] of Object.entries(formData)) {
    if (raw === undefined) continue;
    const def = meta.get(fieldKey);
    if (!def) continue;
    const leaf = leafNameFromFieldKey(fieldKey);
    if (def.type === "SIGNATURE") {
      out.push({
        type: "SIGNATURE",
        name: leaf,
        key: leaf,
        signatureData: raw,
      });
      continue;
    }
    if (def.type === "UPLOAD") {
      out.push({
        type: "UPLOAD",
        name: leaf,
        key: leaf,
        value: raw === true || raw === "true" ? true : raw,
      });
      continue;
    }
    if (def.type === "TEXT_DISPLAY") continue;
    out.push({
      type: def.type,
      name: leaf,
      key: leaf,
      value: raw,
    });
  }
  return out;
}

function JumpStartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nestedItemId = searchParams.get("id")?.trim() || null;
  const parentRoadmapId = searchParams.get("parentId")?.trim() || null;
  // When coming from SelfRevitalizationPhasePage: id=nestedItemId, parentId=parentRoadmapId
  // For extras/comments/queries the roadmapId is always the parent roadmap ID
  const roadmapId = parentRoadmapId || nestedItemId;

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

  const [userId, setUserId] = useState("");
  const [sessionDisplayName, setSessionDisplayName] = useState<string | null>(null);
  const [parentPhaseLabel, setParentPhaseLabel] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<ProgressResponse | null>(null);
  /** When PATCH succeeds but GET /progress lags or nested rows disagree, still show Completed. */
  const [statusUiOverride, setStatusUiOverride] = useState<RoadmapAssignmentUi["status"] | null>(null);

  /** Same as mobile `DynamicFormTask` — POST JUMPSTART_COMPLETE before first extras save. */
  const jumpstartTriggeredRef = useRef(false);

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
    const fromCookie = getCookie("userId")?.trim();
    if (fromCookie) {
      setUserId(fromCookie);
    }
    try {
      const u = JSON.parse(getCookie("user") || "{}") as {
        id?: string;
        _id?: string;
        firstName?: string;
        lastName?: string;
        name?: string;
      };
      if (!fromCookie) setUserId((u?.id || u?._id || "") as string);
      const dn =
        [u.firstName, u.lastName].filter(Boolean).join(" ").trim() ||
        (typeof u.name === "string" ? u.name.trim() : "");
      setSessionDisplayName(dn || null);
    } catch {
      if (!fromCookie) setUserId("");
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
    if (jumpstartTriggeredRef.current) return;
    const nestedForExtras =
      parentRoadmapId && nestedItemId && /^[0-9a-fA-F]{24}$/.test(nestedItemId)
        ? nestedItemId
        : undefined;
    try {
      const r = await apiTriggerJumpstartComplete(roadmapId, userId, nestedForExtras);
      if (r?.success || r?.alreadyExists) {
        jumpstartTriggeredRef.current = true;
      }
    } catch (e) {
      console.warn("[Jumpstart trigger] non-blocking:", e);
    }
  }, [roadmapId, userId, parentRoadmapId, nestedItemId]);

  const extraFieldMeta = useMemo(
    () => collectExtraFieldMeta(roadmap?.extras as ExtraComponent[] | undefined),
    [roadmap?.extras],
  );

  const heroBackgroundStyle = useMemo(() => {
    const u = roadmap?.imageUrl;
    if (
      typeof u === "string" &&
      u.trim() &&
      (u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/"))
    ) {
      return `url(${u})`;
    }
    return `url(${HeroBg.src})`;
  }, [roadmap?.imageUrl]);

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
      const defaults = extraFieldMeta.defaults;
      const validKeys = [...extraFieldMeta.meta.keys()];

      try {
        const res = await apiGetExtras(roadmapId, userId, parentRoadmapId ? nestedItemId! : undefined);
        const data = res.data?.data || res.data;
        const rows = data?.extras;
        const saved: Record<string, any> = { ...defaults };

        if (rows && Array.isArray(rows) && rows.length > 0) {
          rows.forEach((item: any) => {
            if (String(item.type || "").toUpperCase() === "JUMPSTART_COMPLETE") return;
            const rawName = item.name ?? item.key;
            if (rawName === undefined || rawName === null) return;
            const nm = String(rawName);
            const fieldKey = resolveFieldKeyFromApiName(nm, validKeys) || nm;
            if (item.type === "SIGNATURE" && item.signatureData != null) {
              saved[fieldKey] = item.signatureData;
            } else if (item.value !== undefined) {
              saved[fieldKey] = item.value;
            }
          });
          setFormData(saved);
          setExtrasExist(true);
        } else {
          setFormData((prev) => ({ ...defaults, ...prev }));
          setExtrasExist(false);
        }
      } catch {
        setFormData((prev) => ({ ...extraFieldMeta.defaults, ...prev }));
      }
    };
    loadExtras();
  }, [roadmapId, userId, nestedItemId, parentRoadmapId, roadmap, extraFieldMeta]);

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

  const scopedNestedId = parentRoadmapId ? nestedItemId! : undefined;

  /** Reload nested item / roadmap. Optionally skip GET /progress so PATCH responses are not overwritten (stale read). */
  const refetchRoadmap = async (opts?: { skipProgressRefetch?: boolean }): Promise<Record<string, unknown> | null> => {
    if (!nestedItemId) return null;
    try {
      let data: Record<string, unknown> | null = null;
      if (parentRoadmapId) {
        const res = await apiGetNestedRoadmapItem(parentRoadmapId, nestedItemId);
        data = extractRoadmapDocumentFromResponse(res);
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
      await ensureJumpstartTriggered();
      const mergedForm: Record<string, any> = { ...formData };
      Object.keys(uploadedFiles).forEach((k) => {
        mergedForm[k] = true;
      });
      const extrasArray = buildTypedExtrasPayload(mergedForm, roadmap.extras as ExtraComponent[] | undefined);
      const createPayload = {
        userId,
        ...(scopedNestedId && /^[0-9a-fA-F]{24}$/.test(scopedNestedId)
          ? { nestedRoadMapItemId: scopedNestedId }
          : {}),
        extras: extrasArray,
      };
      if (extrasExist) {
        try {
          await apiUpdateExtras(roadmapId, userId, { extras: extrasArray }, scopedNestedId);
        } catch (errUpdate) {
          // Mobile fallback: if update target is missing, create it.
          await apiSaveExtras(roadmapId, createPayload);
          setExtrasExist(true);
        }
      } else {
        try {
          await apiSaveExtras(roadmapId, createPayload);
          setExtrasExist(true);
        } catch (errSave) {
          // If extras already exist, update instead.
          await apiUpdateExtras(roadmapId, userId, { extras: extrasArray }, scopedNestedId);
          setExtrasExist(true);
        }
      }
      for (const [key, file] of Object.entries(uploadedFiles)) {
        await apiUploadExtrasDocuments(roadmapId, userId, [file], scopedNestedId, key);
      }
      await refetchRoadmap();
      await refetchProgressData();
      emitProgressUpdated(userId);
      await fetchComments(false);
      await fetchQueries(undefined, false);
      setSaveSuccess(true);
      setSaveFeedback("Progress saved.");
      setTimeout(() => {
        setSaveSuccess(false);
        setSaveFeedback(null);
        if (parentRoadmapId) {
          router.push(
            `/pastor/SelfRevitalizationPhasePage?id=${encodeURIComponent(parentRoadmapId)}`,
          );
        } else {
          router.push("/pastor/revitalization-roadmap");
        }
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

  const handleMarkComplete = async () => {
    if (!userId || !nestedItemId) {
      setCompleteFeedback("Sign in again or open this task from your roadmap.");
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

  const renderExtraComponent = (
    extra: ExtraComponent,
    index: number,
    parentFieldKey = "",
  ) => {
    const fieldKey = fieldKeyFor(parentFieldKey, extra);

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
              <input
                type="text"
                placeholder={extra.placeHolder || "Sign here (your name)"}
                value={formData[fieldKey] ?? ""}
                onChange={(e) => handleInputChange(fieldKey, e.target.value)}
                className="w-full bg-transparent border-b border-[#5A8DCB] text-white text-sm pb-2 focus:outline-none italic"
              />
              <p className="text-white/40 text-xs mt-2">Digital signature</p>
            </div>
            {extra.buttonName && (
              <button
                type="button"
                className="mt-2 bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-5 py-2 rounded-md shadow"
              >
                {extra.buttonName}
              </button>
            )}
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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-[#062946] px-6 text-center text-white">
        <PastorHeader showFullHeader={true} />
        <p className="max-w-md text-white/80">
          Missing task link. Open a phase from{" "}
          <a href="/pastor/revitalization-roadmap" className="text-[#8ec5eb] underline">
            Revitalization Roadmap
          </a>{" "}
          and select a task.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#062946]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent"></div>
      </div>
    );
  }

  if (roadmapLoadError || !roadmap) {
    return (
      <div className="min-h-screen flex flex-col bg-[#062946] text-white">
        <PastorHeader showFullHeader={true} />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="max-w-md text-amber-100/95">{roadmapLoadError || "Task not found."}</p>
          <a
            href="/pastor/revitalization-roadmap"
            className="rounded-md border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white hover:bg-white/15"
          >
            Back to Revitalization Roadmap
          </a>
        </div>
      </div>
    );
  }

  const title = roadmap?.name || "Jump Start";
  const duration = roadmap?.duration || "";
  const description = roadmap?.description || roadmap?.roadMapDetails || "";
  const extras: ExtraComponent[] = roadmap?.extras || [];
  const phaseTag = typeof roadmap?.phase === "string" ? roadmap.phase.trim() : "";
  const breadcrumbParent = parentPhaseLabel?.trim() || "Revitalization Roadmap";

  return (
    <div className="min-h-screen flex flex-col bg-[#062946] text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative flex h-[320px] flex-col justify-end bg-cover bg-center px-6 pb-10 text-white md:px-12 lg:px-20"
        style={{ backgroundImage: heroBackgroundStyle }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]"></div>
        <div className="relative z-10">
          <p className="text-sm text-white/80 mb-2">
            {breadcrumbParent} &gt; <span className="text-white">{title}</span>
          </p>
          <h1 className="text-3xl font-semibold">{title}</h1>
          {phaseTag && (
            <p className="text-white/60 text-sm mt-1 capitalize">{phaseTag}</p>
          )}
          {duration && (
            <p className="text-white/70 text-sm mt-1">Completion Time {duration}</p>
          )}
          {(roadmap?.startDate || roadmap?.endDate) && (
            <p className="text-white/60 text-sm mt-1">
              {roadmap?.startDate ? formatDate(String(roadmap.startDate)) : "—"}
              {" — "}
              {roadmap?.endDate ? formatDate(String(roadmap.endDate)) : "—"}
            </p>
          )}
          <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-white/70">Status</span>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-semibold ${listStatusBadgeClass(
                listAlignedStatus,
              )}`}
            >
              {formatListStatusLabel(listAlignedStatus)}
            </span>
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 py-12 md:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">

          {/* LEFT PANEL */}
          <div className="h-fit w-full rounded-xl border border-white/20 bg-white/10 p-4 shadow-md backdrop-blur flex flex-col gap-2">
            {[
              { key: "overview", label: "Over View", count: 0 },
              { key: "comments", label: "Comments", count: commentsCount },
              { key: "queries", label: "Queries", count: queriesCount },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex justify-between items-center px-4 py-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === item.key
                    ? "bg-white text-[#0f4a76] shadow-sm"
                    : "bg-transparent text-[#d9ebf8] hover:bg-white/15"
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
                      {saving ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={handleMarkComplete}
                      disabled={completeLoading || listAlignedStatus === "Completed"}
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
      </main>
    </div>
  );
}

export default function JumpStartPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#062946]">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent"></div>
        </div>
      }
    >
      <JumpStartContent />
    </Suspense>
  );
}
