"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import DirectorHero from "../../DirectorHero";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorInputClass,
  directorLabelClass,
  directorPageContainer,
  directorPageRoot,
} from "../../directorUi";
import {
  apiGetNestedRoadmapItem,
  apiGetRoadmapById,
  apiUpdateNestedRoadmapItem,
  apiUpdateRoadmap,
} from "@/app/Services/api";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";

type RoadmapDoc = {
  _id?: string;
  name?: string;
  /** Some API responses use `title` for the display name. */
  title?: string;
  /** Parent roadmap card copy (e.g. Self Revitalization Phase library card). */
  description?: string;
  roadMapDetails?: string;
  duration?: string;
  imageUrl?: string;
  divisions?: string[];
  roadmaps?: any[];
};

/**
 * Unwraps GET /roadmaps/:id (and similar) bodies — same rules as `create/page.tsx`, plus
 * avoid treating `data: [...]` as a nested document.
 */
function unwrapRoadmap(res: unknown): RoadmapDoc | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  const data = r.data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const inner = data as Record<string, unknown>;
    if (
      inner.data != null &&
      typeof inner.data === "object" &&
      !Array.isArray(inner.data)
    ) {
      return inner.data as RoadmapDoc;
    }
    return data as RoadmapDoc;
  }
  if ("_id" in r || "name" in r || "title" in r) return r as RoadmapDoc;
  return null;
}

/** Backend sometimes returns `roadmaps: { items: [...] }` or nested `title` instead of `name`. */
function normalizeParentRoadmapDoc(doc: RoadmapDoc | null): RoadmapDoc | null {
  if (!doc) return null;
  const nameFromTitle = (o: any) => safeString(o?.name) || safeString(o?.title);
  let roadmaps: any[] = [];
  const raw = doc.roadmaps as any;
  if (Array.isArray(raw)) roadmaps = raw;
  else if (raw && typeof raw === "object" && Array.isArray(raw.items)) roadmaps = raw.items;

  const withNames = roadmaps.map((n) => ({
    ...n,
    name: nameFromTitle(n) || n?.name,
  }));

  return {
    ...doc,
    name: nameFromTitle(doc) || safeString((doc as any).title) || doc.name,
    roadmaps: withNames,
  };
}

/** GET /roadmaps/:id/nested/:nestedId — canonical nested item when parent list is stale or partial. */
function unwrapNestedRoadmapItem(res: unknown): any | null {
  if (!res || typeof res !== "object") return null;
  const r = res as Record<string, unknown>;
  const data = (r as any).data;
  if (data && typeof data === "object" && !Array.isArray(data)) {
    const inner = data as Record<string, unknown>;
    if (inner.data && typeof inner.data === "object") return inner.data;
    return data;
  }
  return (r as any).data ?? null;
}

function safeString(s: unknown): string {
  if (s == null) return "";
  return String(s).trim();
}

/**
 * Some APIs return `roadMapDetails` as a string, others as `{ en: "..." }` or similar.
 * Used for form prefill so description/subheading show reliably.
 */
function roadmapDetailText(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "object" && raw !== null) {
    const o = raw as Record<string, unknown>;
    if (typeof o.en === "string" && o.en.trim()) return o.en.trim();
    if (typeof o.text === "string" && o.text.trim()) return o.text.trim();
    if (typeof o.value === "string" && o.value.trim()) return o.value.trim();
  }
  try {
    const s = String(raw).trim();
    return s && s !== "[object Object]" ? s : "";
  } catch {
    return "";
  }
}

function safeDecodeURIComponent(s: string): string {
  if (!s) return "";
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

function normalizeNestedStatus(s: unknown): "in progress" | "not started" | "completed" {
  const v = safeString(s).toLowerCase();
  if (v === "in progress" || v === "in_progress" || v === "inprogress") return "in progress";
  if (v === "completed" || v === "complete") return "completed";
  return "not started";
}

/** Appended to `directorInputClass` when a field failed validation (red outline). */
const directorInputErrorClass =
  "border-red-400/80 ring-2 ring-red-400/45 focus:border-red-400/80 focus:ring-red-400/50";

function formatAxiosError(e: unknown): string {
  const err = e as { response?: { data?: unknown }; message?: string };
  const data = err?.response?.data;
  if (data && typeof data === "object" && data !== null) {
    const m = (data as Record<string, unknown>).message;
    if (typeof m === "string") return m;
    if (Array.isArray(m)) {
      return m
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object" && "constraints" in (item as object)) {
            return Object.values(item as Record<string, unknown>).join(" ");
          }
          return JSON.stringify(item);
        })
        .join(" ");
    }
    if (typeof (data as Record<string, unknown>).error === "string")
      return String((data as Record<string, unknown>).error);
  }
  if (typeof data === "string") return data;
  return err?.message || "Request failed.";
}

function normalizeUrlForCompare(url: string): string {
  const t = url.trim();
  if (!t) return "";
  try {
    const u = new URL(t.startsWith("//") ? `https:${t}` : t);
    return u.href.replace(/\/+$/, "");
  } catch {
    return t;
  }
}

/** True when we do not need to fetch and multipart-upload a new banner (same URL or non-http preview). */
function bannerUrlsEquivalent(preview: string | null, nested: Record<string, unknown>): boolean {
  if (!preview || !preview.startsWith("http")) return true;
  const fromNested = resolveApiMediaUrl(nested.imageUrl) || safeString(nested.imageUrl);
  if (!fromNested) return false;
  return (
    normalizeUrlForCompare(preview) === normalizeUrlForCompare(fromNested)
  );
}

/** Fetch remote banner for multipart PATCH — APIs often reject client-supplied JSON `imageUrl`. */
async function tryFetchBannerFile(url: string): Promise<File | null> {
  try {
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (!blob.size) return null;
    const ext = blob.type?.includes("png") ? "png" : "jpg";
    return new File([blob], `banner.${ext}`, { type: blob.type || "image/jpeg" });
  } catch {
    return null;
  }
}

/**
 * PATCH /nested/:id — never send _id.
 * Template-only updates: omit meetings/extras (API data can fail validation if re-posted).
 * Omit phase when "All" (sentinel, not always a valid stored division value).
 * Omit empty description.
 */
function buildNestedPatchPayload(
  nested: Record<string, unknown>,
  fields: {
    name: string;
    roadMapDetails: string;
    duration: string;
    phase: string;
  },
  opts?: { includeMeetingsExtras?: boolean; omitPhaseWhenAll?: boolean },
): Record<string, unknown> {
  const includeMeetingsExtras = opts?.includeMeetingsExtras === true;
  const omitPhaseWhenAll = opts?.omitPhaseWhenAll !== false;
  const duration = fields.duration.trim() || safeString(nested.duration) || "1";
  const copy = safeString(fields.roadMapDetails);
  const body: Record<string, unknown> = {
    name: fields.name,
    roadMapDetails: copy,
    duration,
    status: normalizeNestedStatus(nested.status),
  };
  /* Many deployments mirror marketing copy in `description`; keep it aligned with the editor. */
  if (copy) body.description = copy;

  const phaseVal = (fields.phase || "").trim();
  if (!omitPhaseWhenAll || (phaseVal && phaseVal.toLowerCase() !== "all")) {
    body.phase = phaseVal || "All";
  }

  if (includeMeetingsExtras) {
    const meetings = nested.meetings;
    if (Array.isArray(meetings) && meetings.length > 0) body.meetings = meetings;
    const extras = nested.extras;
    if (Array.isArray(extras) && extras.length > 0) {
      try {
        body.extras = JSON.parse(JSON.stringify(extras));
      } catch {
        body.extras = extras;
      }
    }
  }
  return body;
}

export default function DirectorRoadmapCreationPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const roadmapId = sp.get("roadmapId")?.trim() || "";
  const roadmapType = (sp.get("type") as "single" | "phase" | null) || "single";
  const isEditMode = sp.get("isEditMode") === "true";
  const nestedRoadmapIdParam = sp.get("nestedRoadmapId")?.trim() || "";

  const urlSeedKey = sp.toString();

  const [parent, setParent] = useState<RoadmapDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  /** Set when Next/Save fails client-side required checks; drives red outlines. */
  const [fieldErrors, setFieldErrors] = useState<{
    name: boolean;
    subheading: boolean;
    completionTime: boolean;
    parentName: boolean;
  }>({ name: false, subheading: false, completionTime: false, parentName: false });
  /** Parent (library) card when editing a phase under a parent roadmap — not the same as the nested phase title. */
  const [parentLibraryName, setParentLibraryName] = useState("");
  const [parentLibraryDescription, setParentLibraryDescription] = useState("");
  /** Centered dialog when required fields are missing (with red outlines on fields). */
  const [requiredFieldsOpen, setRequiredFieldsOpen] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [subheading, setSubheading] = useState("");
  const [completionTime, setCompletionTime] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("All");
  /** Divisions typed/added by the user when not already on the parent roadmap. */
  const [extraDivisions, setExtraDivisions] = useState<string[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const bannerBlobUrlRef = useRef<string | null>(null);
  const bannerFileRef = useRef<File | null>(null);
  const saveRedirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Nested phase card title (e.g. 12-Month…); kept when Name input shows parent roadmap title. */
  const nestedPhaseNameForApiRef = useRef<string>("");
  /** Nested phase from GET /roadmaps/:id/nested/:nestedId (source of truth with parent fetch). */
  const [nestedDetailDoc, setNestedDetailDoc] = useState<any | null>(null);
  useEffect(() => {
    if (!roadmapId) {
      setError("Missing roadmapId.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiGetRoadmapById(roadmapId);
        const doc = normalizeParentRoadmapDoc(unwrapRoadmap(res.data));
        if (cancelled) return;
        setParent(doc);
      } catch (e) {
        console.error(e);
        if (!cancelled) setError("Could not load roadmap.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roadmapId]);

  useEffect(() => {
    setParentLibraryName("");
    setParentLibraryDescription("");
  }, [roadmapId]);

  useEffect(() => {
    if (!parent || !isEditMode || roadmapType !== "phase") return;
    if (String((parent as { _id?: string })._id || "") !== String(roadmapId)) return;
    const t = safeString(parent.name) || safeString((parent as { title?: string }).title);
    const d =
      roadmapDetailText(parent.description) ||
      roadmapDetailText(parent.roadMapDetails) ||
      "";
    setParentLibraryName(t);
    setParentLibraryDescription(d);
  }, [parent, isEditMode, roadmapType, roadmapId]);

  useEffect(() => {
    if (!roadmapId || !nestedRoadmapIdParam || (roadmapType !== "phase" && roadmapType !== "single")) {
      setNestedDetailDoc(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGetNestedRoadmapItem(roadmapId, nestedRoadmapIdParam);
        const doc = unwrapNestedRoadmapItem(res.data);
        if (cancelled) return;
        if (doc && typeof doc === "object") setNestedDetailDoc(doc);
        else setNestedDetailDoc(null);
      } catch (e) {
        console.error(e);
        if (!cancelled) setNestedDetailDoc(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roadmapId, nestedRoadmapIdParam, roadmapType]);

  const nestedForPhase = useMemo(() => {
    if (roadmapType !== "phase") return null;
    if (
      nestedDetailDoc &&
      nestedRoadmapIdParam &&
      String(nestedDetailDoc._id) === String(nestedRoadmapIdParam)
    ) {
      return nestedDetailDoc;
    }
    if (!parent) return null;
    const list = parent.roadmaps || [];
    if (nestedRoadmapIdParam) {
      const found = list.find((r: any) => String(r?._id) === String(nestedRoadmapIdParam));
      return found ?? null;
    }
    return list[0] ?? null;
  }, [parent, roadmapType, nestedRoadmapIdParam, nestedDetailDoc]);

  /** Single roadmap template row (e.g. Jump-Start nested under parent). */
  const nestedForSingle = useMemo(() => {
    if (roadmapType !== "single") return null;
    if (
      nestedDetailDoc &&
      nestedRoadmapIdParam &&
      String(nestedDetailDoc._id) === String(nestedRoadmapIdParam)
    ) {
      return nestedDetailDoc;
    }
    if (!parent) return null;
    const list = parent.roadmaps || [];
    if (nestedRoadmapIdParam) {
      const found = list.find((r: any) => String(r?._id) === String(nestedRoadmapIdParam));
      return found ?? null;
    }
    return list[0] ?? null;
  }, [parent, roadmapType, nestedRoadmapIdParam, nestedDetailDoc]);

  const effectiveNestedId = useMemo(() => {
    if (nestedRoadmapIdParam) return nestedRoadmapIdParam;
    if (roadmapType === "phase") {
      const id = nestedForPhase?._id;
      return id != null ? String(id) : "";
    }
    if (roadmapType === "single") {
      const id = nestedForSingle?._id;
      return id != null ? String(id) : "";
    }
    return "";
  }, [nestedRoadmapIdParam, roadmapType, nestedForPhase, nestedForSingle]);

  // Prefill: server data first (parent + nested GET), query string only when API field is missing.
  useEffect(() => {
    if (!parent) return;
    if (roadmapType !== "phase") return;

    /** New phase task: empty form + upload banner — do not copy first nested phase or parent marketing copy. */
    if (!isEditMode) {
      nestedPhaseNameForApiRef.current = "";
      setName("");
      setSubheading("");
      setCompletionTime("");
      setSelectedDivision("All");
      setExtraDivisions([]);
      if (!bannerFileRef.current) {
        if (bannerBlobUrlRef.current) {
          URL.revokeObjectURL(bannerBlobUrlRef.current);
          bannerBlobUrlRef.current = null;
        }
        bannerFileRef.current = null;
        setBannerFile(null);
        setBannerPreview(null);
      }
      return;
    }

    const urlSeed = {
      name: safeDecodeURIComponent(safeString(sp.get("name"))),
      subheading: safeDecodeURIComponent(safeString(sp.get("subheading"))),
      completionTime: safeDecodeURIComponent(safeString(sp.get("completionTime"))),
      selectedDivision: safeString(sp.get("selectedDivision")) || "All",
      bannerImage: safeDecodeURIComponent(safeString(sp.get("bannerImage"))),
    };

    const nested = nestedForPhase;
    const fromApi = nested
      ? {
          name: safeString(nested.name || (nested as { title?: string }).title),
          subheading: roadmapDetailText(
            (nested as { roadMapDetails?: unknown }).roadMapDetails,
          ) ||
            roadmapDetailText((nested as { description?: unknown }).description) ||
            roadmapDetailText((nested as { road_map_details?: unknown }).road_map_details),
          completionTime: safeString(nested.duration),
          selectedDivision: safeString(nested.phase) || "All",
          bannerImage: resolveApiMediaUrl(nested.imageUrl) || "",
        }
      : null;

    /** Phase roadmap parent (library card) — preferred for description, duration, banner when present. */
    const fromParent = {
      subheading:
        roadmapDetailText(parent.description) ||
        roadmapDetailText(parent.roadMapDetails) ||
        "",
      completionTime: safeString(parent.duration || ""),
      bannerImage: resolveApiMediaUrl(parent.imageUrl) || "",
    };

    /** Nested phase card title — must match `name` state so Save persists what the director edits (not parent library title). */
    nestedPhaseNameForApiRef.current = fromApi?.name || urlSeed.name || "";
    setName(nestedPhaseNameForApiRef.current);

    // Nested phase copy must win over parent library card — otherwise saves look "lost" after refetch.
    const phaseDescription =
      (fromApi?.subheading && fromApi.subheading.trim() ? fromApi.subheading : "") ||
      (fromParent.subheading.trim() ? fromParent.subheading : "") ||
      urlSeed.subheading ||
      "";
    setSubheading(phaseDescription);
    setCompletionTime(
      safeString(fromApi?.completionTime) ||
        (fromParent.completionTime.trim() ? fromParent.completionTime : "") ||
        urlSeed.completionTime ||
        "",
    );
    setSelectedDivision(fromApi?.selectedDivision || urlSeed.selectedDivision || "All");

    if (!bannerFileRef.current) {
      const bannerFromUrl = urlSeed.bannerImage ? resolveApiMediaUrl(urlSeed.bannerImage) || urlSeed.bannerImage : "";
      const img =
        (fromApi?.bannerImage && fromApi.bannerImage.trim() ? fromApi.bannerImage : "") ||
        (fromParent.bannerImage.trim() ? fromParent.bannerImage : "") ||
        bannerFromUrl;
      if (img) setBannerPreview(img);
      else setBannerPreview(null);
    }
  }, [parent, roadmapType, nestedForPhase, nestedDetailDoc, urlSeedKey, isEditMode]);

  // Prefill single roadmap edit (e.g. Jump-Start): parent title + nested template row for copy/duration/banner.
  useEffect(() => {
    if (!parent) return;
    if (roadmapType !== "single" || !isEditMode) return;

    const urlSeed = {
      name: safeDecodeURIComponent(safeString(sp.get("name"))),
      subheading: safeDecodeURIComponent(safeString(sp.get("subheading"))),
      completionTime: safeDecodeURIComponent(safeString(sp.get("completionTime"))),
      selectedDivision: safeString(sp.get("selectedDivision")) || "All",
      bannerImage: safeDecodeURIComponent(safeString(sp.get("bannerImage"))),
    };

    const nested = nestedForSingle;
    const parentTitle =
      safeString(parent.name) || safeString((parent as { title?: string }).title);
    const nestedTitle = nested
      ? safeString(nested.name || (nested as { title?: string }).title)
      : "";
    nestedPhaseNameForApiRef.current = nested ? nestedTitle || parentTitle : "";

    /** Library parent name, else nested template title, else query (some APIs omit parent.name). */
    setName((parentTitle || nestedTitle || urlSeed.name || "").trim());

    const fromNested = nested
      ? {
          subheading:
            roadmapDetailText(
              (nested as { roadMapDetails?: unknown }).roadMapDetails,
            ) ||
            roadmapDetailText((nested as { description?: unknown }).description) ||
            roadmapDetailText((nested as { road_map_details?: unknown }).road_map_details),
          completionTime: safeString(nested.duration),
          selectedDivision: safeString(nested.phase) || "All",
          bannerImage: resolveApiMediaUrl(nested.imageUrl) || "",
        }
      : null;

    const fromParent = {
      subheading:
        roadmapDetailText(parent.description) ||
        roadmapDetailText(parent.roadMapDetails) ||
        "",
      completionTime: safeString(parent.duration || ""),
      bannerImage: resolveApiMediaUrl(parent.imageUrl) || "",
    };

    setSubheading(
      (fromNested?.subheading && fromNested.subheading.trim() ? fromNested.subheading : "") ||
        (fromParent.subheading.trim() ? fromParent.subheading : "") ||
        urlSeed.subheading ||
        "",
    );
    setCompletionTime(
      safeString(fromNested?.completionTime) ||
        (fromParent.completionTime.trim() ? fromParent.completionTime : "") ||
        urlSeed.completionTime ||
        "",
    );
    setSelectedDivision(fromNested?.selectedDivision || urlSeed.selectedDivision || "All");

    if (!bannerFileRef.current) {
      const bannerFromUrl = urlSeed.bannerImage ? resolveApiMediaUrl(urlSeed.bannerImage) || urlSeed.bannerImage : "";
      const img =
        (fromNested?.bannerImage && fromNested.bannerImage.trim() ? fromNested.bannerImage : "") ||
        (fromParent.bannerImage.trim() ? fromParent.bannerImage : "") ||
        bannerFromUrl;
      if (img) setBannerPreview(img);
      else setBannerPreview(null);
    }
  }, [parent, roadmapType, nestedForSingle, nestedDetailDoc, urlSeedKey, isEditMode]);



  useEffect(() => {
    return () => {
      if (saveRedirectTimeoutRef.current) {
        clearTimeout(saveRedirectTimeoutRef.current);
        saveRedirectTimeoutRef.current = null;
      }
      if (bannerBlobUrlRef.current) {
        URL.revokeObjectURL(bannerBlobUrlRef.current);
        bannerBlobUrlRef.current = null;
      }
    };
  }, []);

  /** Divisions from the parent roadmap API (excludes sentinel “All”). */
  const parentDivisionList = useMemo(() => {
    const list = Array.isArray(parent?.divisions) ? parent!.divisions! : [];
    return list
      .map((d) => String(d || "").trim())
      .filter(Boolean)
      .filter((d) => d.toLowerCase() !== "all");
  }, [parent?.divisions]);

  /** “All” + parent divisions for first-step radio UI. */
  const divisionRadioOptions = useMemo(() => {
    const p = parentDivisionList;
    const opts = [{ value: "All", label: "All" }];
    for (const d of p) {
      if (!opts.some((o) => o.value.toLowerCase() === d.toLowerCase())) opts.push({ value: d, label: d });
    }
    return opts;
  }, [parentDivisionList]);

  const handleAddDivision = useCallback(() => {
    const t = selectedDivision.trim();
    if (!t) return;
    if (t.toLowerCase() === "all") return;
    const lower = t.toLowerCase();
    if (parentDivisionList.some((d) => d.toLowerCase() === lower)) return;
    setExtraDivisions((prev) => (prev.some((d) => d.toLowerCase() === lower) ? prev : [...prev, t]));
  }, [selectedDivision, parentDivisionList]);

  const handleRemoveExtraDivision = useCallback((division: string) => {
    setExtraDivisions((prev) => prev.filter((x) => x !== division));
    setSelectedDivision((cur) => (cur === division ? "All" : cur));
  }, []);

  /** Banner strip: preview, then parent roadmap image (library card), then query, then nested. */
  const phaseContextBannerUrl = useMemo(() => {
    if (bannerPreview) return bannerPreview;
    const raw = safeDecodeURIComponent(safeString(sp.get("bannerImage")));
    const fromQuery = raw ? resolveApiMediaUrl(raw) || raw : "";
    if (fromQuery) return fromQuery;
    const parentImg = resolveApiMediaUrl(parent?.imageUrl) || "";
    if (parentImg) return parentImg;
    const nested =
      roadmapType === "phase" ? nestedForPhase : roadmapType === "single" ? nestedForSingle : null;
    return resolveApiMediaUrl((nested as { imageUrl?: string } | null)?.imageUrl) || "";
  }, [bannerPreview, nestedForPhase, nestedForSingle, parent?.imageUrl, roadmapType, urlSeedKey]);

  const goToTaskEditor = useCallback(() => {
    const nameForFlow = name.trim();
    const nameOk = Boolean(nameForFlow);
    const subOk = Boolean(subheading.trim());
    const timeOk = Boolean(completionTime.trim());
    const parentNameOk = !(isEditMode && roadmapType === "phase") || Boolean(parentLibraryName.trim());
    if (!nameOk || !subOk || !timeOk || !parentNameOk) {
      setFieldErrors({
        name: !nameOk,
        subheading: !subOk,
        completionTime: !timeOk,
        parentName: !parentNameOk,
      });
      setError(null);
      setRequiredFieldsOpen(true);
      return;
    }
    setFieldErrors({ name: false, subheading: false, completionTime: false, parentName: false });
    const qp = new URLSearchParams();
    qp.set("roadmapId", roadmapId);
    qp.set("type", roadmapType);
    qp.set("isEditMode", isEditMode ? "true" : "false");
    if (effectiveNestedId) qp.set("nestedRoadmapId", effectiveNestedId);
    qp.set("name", nameForFlow);
    qp.set("subheading", subheading.trim());
    qp.set("completionTime", completionTime.trim());
    qp.set("selectedDivision", selectedDivision || "All");
    if (bannerPreview) qp.set("bannerImage", bannerPreview);
    router.push(`/director/revitalization-roadmap/roadmap-form?${qp.toString()}`);
  }, [
    name,
    roadmapType,
    isEditMode,
    subheading,
    completionTime,
    selectedDivision,
    bannerPreview,
    roadmapId,
    effectiveNestedId,
    router,
    parentLibraryName,
  ]);

  const handleSave = async () => {
    if (saveRedirectTimeoutRef.current) {
      clearTimeout(saveRedirectTimeoutRef.current);
      saveRedirectTimeoutRef.current = null;
    }
    setSaveFeedback(null);
    setError(null);
    const nameToPersist = name.trim();
    const nameOk = Boolean(nameToPersist);
    const subOk = Boolean(subheading.trim());
    const timeOk = Boolean(completionTime.trim());
    const parentNameOk = !(isEditMode && roadmapType === "phase") || Boolean(parentLibraryName.trim());
    if (!nameOk || !subOk || !timeOk || !parentNameOk) {
      setFieldErrors({
        name: !nameOk,
        subheading: !subOk,
        completionTime: !timeOk,
        parentName: !parentNameOk,
      });
      setRequiredFieldsOpen(true);
      return;
    }
    setFieldErrors({ name: false, subheading: false, completionTime: false, parentName: false });
    if (!roadmapId || !parent) return;
    if (!(roadmapType === "phase" || roadmapType === "single") || !effectiveNestedId) {
      setError("Save applies when editing a roadmap with a valid nested template id.");
      return;
    }
    const fromList = parent.roadmaps?.find((r: any) => String(r?._id) === String(effectiveNestedId));
    const fromDetail =
      nestedDetailDoc && String(nestedDetailDoc._id) === String(effectiveNestedId) ? nestedDetailDoc : null;
    /** Prefer GET /nested/:id (fromDetail) over parent.roadmaps[] so imageUrl and copy stay fresh after PATCH. */
    const nested =
      fromList && fromDetail
        ? { ...fromList, ...fromDetail }
        : fromList ?? fromDetail;
    if (!nested || typeof nested !== "object") {
      setError("Could not find this nested roadmap to update.");
      return;
    }

    setSaving(true);
    try {
      // if (isEditMode && roadmapType === "phase") {
      if (isEditMode && (roadmapType === "phase" || roadmapType === "single")) {


        const libName =
  roadmapType === "single" ? nameToPersist : parentLibraryName.trim();

const libDesc =
  roadmapType === "single" ? subheading.trim() : parentLibraryDescription.trim();
        const parentType = safeString((parent as { type?: string }).type);
        await apiUpdateRoadmap(
          roadmapId,
          {
            name: libName,
            description: libDesc,
            roadMapDetails: libDesc,
            ...(parentType ? { type: parentType } : {}),
            ...(Array.isArray(parent.divisions) ? { divisions: parent.divisions } : {}),
          } as any,
        );
      }

      const patchBody = buildNestedPatchPayload(
        nested as Record<string, unknown>,
        {
          name: nameToPersist,
          roadMapDetails: subheading.trim(),
          duration: completionTime.trim(),
          phase: selectedDivision || "All",
        },
        { includeMeetingsExtras: false, omitPhaseWhenAll: true },
      );

      let fileToSend: File | null = bannerFile ?? bannerFileRef.current;
      if (
        !fileToSend &&
        bannerPreview?.startsWith("http") &&
        !bannerUrlsEquivalent(bannerPreview, nested as Record<string, unknown>)
      ) {
        fileToSend = await tryFetchBannerFile(bannerPreview);
      }

      if (fileToSend) {
        await apiUpdateNestedRoadmapItem(roadmapId, effectiveNestedId, patchBody as any, fileToSend);
      } else {
        await apiUpdateNestedRoadmapItem(roadmapId, effectiveNestedId, patchBody as any);
      }


      setSaveFeedback(
        roadmapType === "phase"
          ? "The main roadmap (library) title and this phase are saved."
          : "Roadmap library will show this roadmap’s updated info.",
      );

      if (isEditMode) {
        saveRedirectTimeoutRef.current = setTimeout(() => {
          saveRedirectTimeoutRef.current = null;
          router.push("/director/revitalization-roadmap");
        }, 2000);
      }

      bannerFileRef.current = null;
      setBannerFile(null);
      const res = await apiGetRoadmapById(roadmapId);
      const doc = normalizeParentRoadmapDoc(unwrapRoadmap(res.data));
      if (doc) setParent(doc);
      if (effectiveNestedId) {
        try {
          const nr = await apiGetNestedRoadmapItem(roadmapId, effectiveNestedId);
          const nd = unwrapNestedRoadmapItem(nr.data);
          if (nd && typeof nd === "object") setNestedDetailDoc(nd);
        } catch {
          /* keep existing nested detail */
        }
      }
    } catch (e: unknown) {
      console.error(e);
      setError(formatAxiosError(e) || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const typeLabel = roadmapType === "phase" ? "Phase" : "Single";
  /** New phase task (first step): match library create form — radios, banner upload, no hero. */
  const isPhaseCreateFirst = roadmapType === "phase" && !isEditMode;
  /** Parent + (phase roadmap, or single in edit mode e.g. Jump-Start): hero banner like phase list editor. */
  const showReferenceHero =
    Boolean(parent) && (roadmapType === "phase" || (roadmapType === "single" && isEditMode));
  const showEditTasksShortcut =
    Boolean(roadmapId.trim()) &&
    !isPhaseCreateFirst &&
    (roadmapType === "phase" || (roadmapType === "single" && isEditMode));
  const goToPhaseList = useCallback(() => {
    router.push(`/director/revitalization-roadmap/phase-list?roadmapId=${encodeURIComponent(roadmapId)}`);
  }, [router, roadmapId]);
  const cardTitle = isEditMode ? "Edit Roadmap" : "Create Roadmap";
  const heroTitle = showReferenceHero
    ? isEditMode && roadmapType === "phase" && parentLibraryName.trim()
      ? parentLibraryName.trim()
      : safeString(parent?.name) || "Roadmap"
    : isEditMode
      ? "Edit roadmap"
      : "Create roadmap";
  const heroSubtitle = showReferenceHero
    ? `${completionTime.trim() || "—"} · ${roadmapType === "phase" ? "Phase roadmap" : "Single roadmap"}`
    : isEditMode
      ? "Update roadmap details, save, or open the task editor below."
      : "Info-card fields — continue to the task editor when ready.";
  const heroImageSrc =
    showReferenceHero && phaseContextBannerUrl && String(phaseContextBannerUrl).trim()
      ? phaseContextBannerUrl
      : null;

  if (loading) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero
          title={isEditMode ? "Edit roadmap" : "Create roadmap"}
          subtitle="Loading…"
          image={null as any}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
            { label: isEditMode ? "Edit roadmap" : "Roadmap creation" },
          ]}
        />
        <main className="flex flex-1 items-center justify-center px-4 pb-24">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[#8ec5eb]" />
        </main>
      </div>
    );
  }

  return (
    <div className={directorPageRoot}>
      {!isPhaseCreateFirst ? (
        <div className={`${directorPageContainer} px-4 pt-3 sm:px-6 lg:px-10 sm:pt-5`}>
          <DirectorHero
            title={heroTitle}
            subtitle={heroSubtitle}
            image={heroImageSrc}
            compact={!showReferenceHero}
            // topRight={
            //   showReferenceHero ? (
            //     <label
            //       htmlFor={roadmapType === "single" ? "phase-task-banner-single" : "phase-task-banner"}
            //       className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/35 bg-black/45 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-black/60 sm:text-sm"
            //     >
            //       <i className="fa-solid fa-camera text-[#8ec5eb]" aria-hidden />
            //       Change image
            //     </label>
            //   ) : undefined
            // }
            breadcrumbItems={[
              { label: "Home", href: "/director/home" },
              { label: "Revitalization Roadmap", href: "/director/revitalization-roadmap" },
              { label: isEditMode ? "Edit roadmap" : "Roadmap creation" },
            ]}
            
            
          />
          {showReferenceHero ? (
  <div className="relative -mt-20 mb-6 flex justify-end px-6 sm:px-10">
    <label
      htmlFor={roadmapType === "single" ? "phase-task-banner-single" : "phase-task-banner"}
      className="z-[5] inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/35 bg-black/45 px-3 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-black/60 sm:text-sm"
    >
      <i className="fa-solid fa-camera text-[#8ec5eb]" aria-hidden />
      Change image
    </label>
  </div>
) : null}
        </div>
      ) : null}

      <main
        className={`flex flex-1 flex-col pb-10 sm:pb-14 ${isPhaseCreateFirst ? "pt-6 sm:pt-8" : "pt-2 sm:pt-3"}`}
      >
        <div className={`${directorPageContainer} flex w-full flex-1 flex-col px-4 sm:px-6 lg:px-10`}>
          {error ? (
            <div
              className={`${directorGlassCard} mb-5 border border-red-400/25 p-4 text-sm text-red-100 sm:mb-6`}
              role="alert"
            >
              {error}
            </div>
          ) : null}

          <input
            type="file"
            accept="image/*"
            className="sr-only"
            id="phase-task-banner"
            onChange={(e) => {
              const f = e.target.files?.[0] || null;
              e.target.value = "";
              bannerFileRef.current = f;
              setBannerFile(f);
              if (!f) return;
              const next = URL.createObjectURL(f);
              if (bannerBlobUrlRef.current) URL.revokeObjectURL(bannerBlobUrlRef.current);
              bannerBlobUrlRef.current = next;
              setBannerPreview(next);
            }}
          />

          <div
            className={`${directorGlassCard} p-0 ${isPhaseCreateFirst ? "mx-auto w-full max-w-5xl" : ""}`}
          >
            {!showReferenceHero ? (
              <div className="bg-gradient-to-r from-[#1b598f] to-[#2876AC] px-6 py-4 shadow-inner">
                <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">{cardTitle}</h2>
              </div>
            ) : null}

            <div
              className={`px-5 py-6 sm:px-8 sm:py-8 ${isPhaseCreateFirst ? "mx-auto max-w-3xl" : ""}`}
            >
              <div className="space-y-6 sm:space-y-7">
                {isPhaseCreateFirst ? (
                  <>
                    <div>
                      <label className={directorLabelClass}>
                        Roadmap Name <span className="text-red-300">*</span>
                      </label>
                      <input
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setFieldErrors((f) => ({ ...f, name: false }));
                        }}
                        className={`${directorInputClass} ${fieldErrors.name ? directorInputErrorClass : ""}`}
                        placeholder="Enter roadmap name"
                        aria-invalid={fieldErrors.name}
                      />
                    </div>

                    <div>
                      <label className={directorLabelClass}>
                        Description <span className="text-red-300">*</span>
                      </label>
                      <textarea
                        value={subheading}
                        onChange={(e) => {
                          setSubheading(e.target.value);
                          setFieldErrors((f) => ({ ...f, subheading: false }));
                        }}
                        rows={5}
                        className={`${directorInputClass} min-h-[120px] resize-y ${fieldErrors.subheading ? directorInputErrorClass : ""}`}
                        placeholder="Enter description"
                        aria-invalid={fieldErrors.subheading}
                      />
                    </div>

                    <div>
                      <label className={directorLabelClass}>
                        Completion Time <span className="text-red-300">*</span>
                      </label>
                      <input
                        value={completionTime}
                        onChange={(e) => {
                          setCompletionTime(e.target.value);
                          setFieldErrors((f) => ({ ...f, completionTime: false }));
                        }}
                        className={`${directorInputClass} ${fieldErrors.completionTime ? directorInputErrorClass : ""}`}
                        placeholder="Months : 1 - 2"
                        aria-invalid={fieldErrors.completionTime}
                      />
                    </div>

                    <fieldset className="min-w-0 border-0 p-0">
                      <legend className={`${directorLabelClass} mb-3 w-full`}>
                        Select the Division in which this Roadmap belongs to :
                      </legend>
                      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-8 sm:gap-y-3">
                        {divisionRadioOptions.map((opt) => {
                          const sel = String(selectedDivision || "").trim().toLowerCase();
                          const val = opt.value.trim().toLowerCase();
                          const checked =
                            sel === val || (opt.value === "All" && (!sel || sel === "all"));
                          return (
                            <label
                              key={opt.value}
                              className="inline-flex cursor-pointer items-center gap-3 text-[15px] font-medium text-white/95"
                            >
                              <input
                                type="radio"
                                name="phase-division-create"
                                value={opt.value}
                                checked={checked}
                                onChange={() => setSelectedDivision(opt.value)}
                                className="h-4 w-4 shrink-0 cursor-pointer accent-emerald-500"
                              />
                              <span>{opt.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </fieldset>

                    <div>
                      <label className={`${directorLabelClass} flex items-center gap-2`}>
                        <i className="fa-solid fa-cloud-arrow-up text-[#8ec5eb]/90" aria-hidden />
                        Upload Banner Image
                      </label>

                      {bannerPreview ? (
                        <div className="mt-2 overflow-hidden rounded-xl border border-white/20 bg-white/5">
                          <div className="relative h-[220px] w-full sm:h-[240px]">
                            <Image
                              src={bannerPreview}
                              alt=""
                              fill
                              className="object-cover"
                              unoptimized={isRemoteImageSrc(bannerPreview) || bannerPreview.startsWith("blob:")}
                            />
                            <label
                              htmlFor="phase-task-banner"
                              className="absolute bottom-3 left-1/2 z-[1] -translate-x-1/2 cursor-pointer rounded-md border border-white/25 bg-white px-4 py-2 text-sm font-semibold text-[#1b598f] shadow-md transition hover:bg-white/95"
                            >
                              Change Image
                            </label>
                          </div>
                        </div>
                      ) : (
                        <label
                          htmlFor="phase-task-banner"
                          className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/25 bg-white/5 px-4 py-10 text-white transition hover:border-[#8ec5eb]/40 hover:bg-white/10"
                        >
                          <i className="fa-solid fa-cloud-arrow-up text-2xl text-[#8ec5eb]" aria-hidden />
                          <span className="text-sm font-semibold">Drag &amp; drop or click to upload</span>
                          <span className="text-xs text-white/45">PNG, JPG — optional</span>
                        </label>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {isEditMode && roadmapType === "phase" ? (
                      <div className="rounded-xl border border-[#8ec5eb]/20 bg-white/[0.04] p-4 sm:p-5">
                        {/* <p className="text-sm font-semibold text-white/95">Roadmap (main list)</p>
                        <p className="mt-1 text-xs leading-relaxed text-white/50">
                          Name and text on the revitalization library card — the container for all phases, not
                          the individual phase below.
                        </p> */}
                        <div className="mt-4 space-y-4">
                          <div>
                            <label className={directorLabelClass}>
                              Roadmap name <span className="text-red-300">*</span>
                            </label>
                            <input
                              value={parentLibraryName}
                              onChange={(e) => {
                                setParentLibraryName(e.target.value);
                                setFieldErrors((f) => ({ ...f, parentName: false }));
                              }}
                              className={`${directorInputClass} ${
                                fieldErrors.parentName ? directorInputErrorClass : ""
                              }`}
                              placeholder="e.g. Self Revitalization"
                              aria-invalid={fieldErrors.parentName}
                            />
                          </div>
                          <div>
                            <label className={directorLabelClass}>Description</label>
                            {/* <p className="mb-1.5 text-xs text-white/45">Optional; shown with the name on the main list.</p> */}
                            <textarea
                              value={parentLibraryDescription}
                              onChange={(e) => setParentLibraryDescription(e.target.value)}
                              rows={3}
                              className={`${directorInputClass} min-h-[88px] resize-y`}
                              placeholder="Summary for the roadmap card"
                            />
                          </div>
                        </div>
                      </div>
                    ) : null}

                    <div>
                      <label className={directorLabelClass}>Type</label>
                      <select
                        disabled
                        value={typeLabel}
                        className={`${directorInputClass} cursor-not-allowed opacity-90 pr-8 sm:pr-9`}
                      >
                        <option value="Phase">Phase</option>
                        <option value="Single">Single</option>
                      </select>
                    </div>

                    {!(isEditMode && roadmapType === "phase") ? (
                      <>
                        <div>
                          <label className={directorLabelClass}>
                            Name <span className="text-red-300">*</span>
                          </label>
                          <input
                            value={name}
                            onChange={(e) => {
                              const v = e.target.value;
                              setName(v);
                              if (roadmapType === "phase") nestedPhaseNameForApiRef.current = v;
                              setFieldErrors((f) => ({ ...f, name: false }));
                            }}
                            className={`${directorInputClass} ${fieldErrors.name ? directorInputErrorClass : ""}`}
                            placeholder="Enter name"
                            aria-invalid={fieldErrors.name}
                          />
                        </div>

                        <div>
                          <label className={directorLabelClass}>
                            Description <span className="text-red-300">*</span>
                          </label>
                          <textarea
                            value={subheading}
                            onChange={(e) => {
                              setSubheading(e.target.value);
                              setFieldErrors((f) => ({ ...f, subheading: false }));
                            }}
                            rows={4}
                            className={`${directorInputClass} min-h-[100px] resize-y ${fieldErrors.subheading ? directorInputErrorClass : ""}`}
                            placeholder="Enter description"
                            aria-invalid={fieldErrors.subheading}
                          />
                        </div>
                      </>
                    ) : (
                      // <p className="text-sm leading-relaxed text-white/60">
                      //   Edit this phase&rsquo;s <span className="text-white/85">name and description</span> in{" "}
                      //   <span className="font-semibold text-white/90">Edit tasks</span> (task editor) — not on this
                      //   page.
                      // </p>
                      null
                    )}

                    <div>
                      <label className={directorLabelClass}>
                        Completion time <span className="text-red-300">*</span>
                      </label>
                      <input
                        value={completionTime}
                        onChange={(e) => {
                          setCompletionTime(e.target.value);
                          setFieldErrors((f) => ({ ...f, completionTime: false }));
                        }}
                        className={`${directorInputClass} ${fieldErrors.completionTime ? directorInputErrorClass : ""}`}
                        placeholder="e.g. Months : 1–2"
                        aria-invalid={fieldErrors.completionTime}
                      />
                    </div>

                    {roadmapType === "phase" ? (
                      <div>
                        {/* <label className={directorLabelClass} htmlFor="phase-division-input">
                          Division
                        </label> */}
                        <label className={directorLabelClass} htmlFor="phase-division-input">
  {isEditMode ? (
    <>
      Divisions <span className="text-white/45">(choose the required division)</span>
    </>
  ) : (
    <>
      Divisions of Phase <span className="text-white/45">(add required divisions)</span>
    </>
  )}
</label>
                        <div className="mt-1 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
                          <div className="min-w-0 flex-1">
                            <input
                              id="phase-division-input"
                              name="division"
                              value={selectedDivision}
                              onChange={(e) => setSelectedDivision(e.target.value)}
                              autoComplete="off"
                              placeholder="All or type a division"
                              className={directorInputClass}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={handleAddDivision}
                            className={`${directorBtnSecondary} shrink-0 whitespace-nowrap sm:self-auto`}
                          >
                            <i className="fa-solid fa-plus mr-2 text-xs" aria-hidden />
                            Add
                          </button>
                        </div>
                        <div className="mt-3">
                          <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-white/45">
                            Divisions on this roadmap
                          </p>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedDivision("All")}
                              className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                                selectedDivision === "All" || !selectedDivision
                                  ? "border-[#8ec5eb]/50 bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                                  : "border-white/15 bg-white/10 text-white/90 hover:bg-white/15"
                              }`}
                            >
                              All
                            </button>
                            {parentDivisionList.map((d) => (
                              <button
                                key={`parent-${d}`}
                                type="button"
                                onClick={() => setSelectedDivision(d)}
                                className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                                  selectedDivision === d
                                    ? "border-[#8ec5eb]/50 bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                                    : "border-white/15 bg-white/10 text-white/90 hover:bg-white/15"
                                }`}
                              >
                                {d}
                              </button>
                            ))}
                            {extraDivisions.map((d) => (
                              <span
                                key={`extra-${d}`}
                                className={`inline-flex max-w-full items-center gap-0.5 rounded-full border text-sm font-semibold transition ${
                                  selectedDivision === d
                                    ? "border-[#8ec5eb]/50 bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                                    : "border-white/15 bg-white/10 text-white/90"
                                }`}
                              >
                                <button
                                  type="button"
                                  onClick={() => setSelectedDivision(d)}
                                  className="min-w-0 max-w-[200px] truncate py-1.5 pl-3 pr-1 text-left sm:max-w-[280px]"
                                >
                                  {d}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExtraDivision(d)}
                                  className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white/55 transition hover:bg-white/15 hover:text-white"
                                  aria-label={`Remove division ${d}`}
                                >
                                  <i className="fa-solid fa-xmark text-xs" aria-hidden />
                                </button>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {roadmapType !== "phase" ? (
                      <div>
                        <label className={`${directorLabelClass} flex items-center gap-2`}>
                          <i className="fa-solid fa-cloud-arrow-up text-[#8ec5eb]/90" />
                          Upload banner
                        </label>

                        <input
                          type="file"
                          accept="image/*"
                          className="sr-only"
                          id="phase-task-banner-single"
                          onChange={(e) => {
                            const f = e.target.files?.[0] || null;
                            e.target.value = "";
                            bannerFileRef.current = f;
                            setBannerFile(f);
                            if (!f) return;
                            const next = URL.createObjectURL(f);
                            if (bannerBlobUrlRef.current) URL.revokeObjectURL(bannerBlobUrlRef.current);
                            bannerBlobUrlRef.current = next;
                            setBannerPreview(next);
                          }}
                        />

                        {bannerPreview ? (
                          <div className="overflow-hidden rounded-xl border border-white/20 bg-white/5">
                            <div className="relative h-[200px] w-full">
                              <Image
                                src={bannerPreview}
                                alt=""
                                fill
                                className="object-cover"
                                unoptimized={isRemoteImageSrc(bannerPreview) || bannerPreview.startsWith("blob:")}
                              />
                            </div>
                            <label
                              htmlFor="phase-task-banner-single"
                              className="block cursor-pointer border-t border-white/15 bg-white/10 px-4 py-3 text-center text-sm font-semibold text-[#8ec5eb] transition hover:bg-white/15"
                            >
                              Change image
                            </label>
                          </div>
                        ) : (
                          <label
                            htmlFor="phase-task-banner-single"
                            className="mt-2 flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-white/25 bg-white/5 px-4 py-8 text-white transition hover:border-[#8ec5eb]/40 hover:bg-white/10"
                          >
                            <i className="fa-solid fa-cloud-arrow-up text-[#8ec5eb]" />
                            <span className="text-sm font-semibold">Drag &amp; drop or click to upload</span>
                          </label>
                        )}
                        <p className="mt-2 text-xs text-white/45">PNG, JPG — optional</p>
                      </div>
                    ) : null}
                  </>
                )}
              </div>
{showEditTasksShortcut ? (
  <p className="mt-6 text-right text-xs leading-relaxed text-white/55">
    Tip: To edit individual roadmap tasks, save your changes first, then click{" "}
    <span className="font-semibold text-white/85">Edit tasks</span>.
  </p>
) : null}
              {/* <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-white/10 pt-7 sm:mt-10"> */}
              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-7 sm:mt-10">
  <div>
    {showEditTasksShortcut ? (
      <button
        type="button"
        onClick={roadmapType === "phase" ? goToPhaseList : goToTaskEditor}
        className={`${directorBtnPrimary} !px-6 !py-3 !text-sm`}
      >
        <i className="fa-solid fa-list-check mr-2 text-sm" aria-hidden />
        Edit tasks
      </button>
    ) : null}
  </div>

  <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:justify-end"></div>
                <div className="flex w-full flex-col-reverse gap-3 sm:w-auto sm:flex-row sm:justify-end">
                 {/* <button
  type="button"
  onClick={() => router.push("/director/revitalization-roadmap")}
  className={`${directorBtnSecondary} w-full sm:w-auto`}
  disabled={saving}
>
  Back to Roadmaps
</button> */}
                  <button
                    type="button"
                    onClick={() => router.back()}
                    className={`${directorBtnSecondary} w-full sm:w-auto`}
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  {isEditMode && effectiveNestedId && (roadmapType === "phase" || roadmapType === "single") ? (
                    <button
                      type="button"
                      onClick={() => void handleSave()}
                      className={`${directorBtnPrimary} w-full sm:w-auto`}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Save changes"}
                    </button>
                  ) : (
                    <button type="button" onClick={goToTaskEditor} className={`${directorBtnPrimary} w-full sm:w-auto`}>
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* {showEditTasksShortcut ? (
            <div className="mt-8 flex justify-center sm:mt-10">
              <button
                type="button"
                onClick={roadmapType === "phase" ? goToPhaseList : goToTaskEditor}
                className={`${directorBtnPrimary} !px-6 !py-3 !text-sm`}
              >
                <i className="fa-solid fa-list-check mr-2 text-sm" aria-hidden />
                Edit tasks
              </button>
            </div>
          ) : null} */}
        </div>
      </main>

      {saveFeedback ? (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 z-[90] flex justify-center px-4 pb-6 pt-10 sm:pb-8"
          aria-live="polite"
        >
          <div
            role="status"
            className="pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border border-emerald-400/35 bg-[#041f35]/98 px-4 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:items-center sm:gap-4 sm:px-5"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
              <i className="fa-solid fa-check text-base" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-[15px] font-semibold text-white">Saved</p>
              <p className="mt-1 text-sm leading-snug text-white/75">{saveFeedback}</p>
            </div>
            <button
              type="button"
              onClick={() => setSaveFeedback(null)}
              className="shrink-0 rounded-lg p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              aria-label="Dismiss"
            >
              <i className="fa-solid fa-xmark text-lg" />
            </button>
          </div>
        </div>
      ) : null}

      {requiredFieldsOpen ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="presentation"
          onClick={() => setRequiredFieldsOpen(false)}
        >
          <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" aria-hidden />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="required-fields-dialog-title"
            className="relative z-[1] w-full max-w-md rounded-2xl border border-red-400/35 bg-[#041f35]/98 px-6 py-6 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/20 text-red-300">
                <i className="fa-solid fa-circle-exclamation text-xl" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="required-fields-dialog-title" className="text-lg font-semibold text-white">
                  Fill required fields
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/80">
                  Please complete all fields marked with <span className="text-red-300">*</span> before continuing.
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRequiredFieldsOpen(false)}
                className={`${directorBtnPrimary} px-6`}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
