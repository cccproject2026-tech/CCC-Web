import { apiGetRoadmapsByUser, apiGetRoadmapById } from "./roadmaps.service";
import { apiGetUserProgress } from "./progress.service";
import type { ProgressResponse, ProgressRoadmap, NestedRoadmapProgress } from "./types/progress.types";
import type { RoadMapResponse, NestedRoadMapItem } from "./types/roadmaps.types";

export type RoadmapAssignmentUi = {
  id: string;
  parentRoadmapId: string;
  parentRoadmapName: string;
  title: string;
  desc: string;
  status: "Not Started" | "In-progress" | "Due" | "Completed";
  months: string;
  imageUrl?: string;
  meetings?: string[];
  /** True when this roadmap has nested `roadmaps` tasks — open phase overview, not jumpstart-only. */
  hasNestedTasks?: boolean;
};

/**
 * Extract roadmap rows from GET /roadmaps/user/:id (or similar) response bodies.
 * Handles: raw array, { data: [] }, { data: { roadmaps } }, assignment rows with nested `roadmap`, etc.
 */
function extractRoadmapArrayFromAxiosData(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (!body || typeof body !== "object") return [];
  const o = body as Record<string, unknown>;

  if (Array.isArray(o.data)) return o.data;
  if (Array.isArray(o.roadmaps)) return o.roadmaps;
  if (Array.isArray(o.items)) return o.items;
  if (Array.isArray(o.results)) return o.results;

  if (o.data && typeof o.data === "object") {
    const d = o.data as Record<string, unknown>;
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d.roadmaps)) return d.roadmaps;
    if (Array.isArray(d.items)) return d.items;
    if (Array.isArray(d.rows)) return d.rows;
    if (Array.isArray(d.assignments)) return d.assignments;
    if (Array.isArray(d.userRoadmaps)) return d.userRoadmaps;
    if (Array.isArray(d.assignedRoadmaps)) return d.assignedRoadmaps;
    if (Array.isArray(d.list)) return d.list;
    const singleRoadmap = d.roadmap ?? d.roadMap;
    if (singleRoadmap && typeof singleRoadmap === "object" && !Array.isArray(singleRoadmap)) {
      return [singleRoadmap];
    }
  }

  if (Array.isArray(o.userRoadmaps)) return o.userRoadmaps;
  if (Array.isArray(o.assignedRoadmaps)) return o.assignedRoadmaps;

  if (o._id != null && (typeof o.name === "string" || o.roadMapDetails != null || Array.isArray(o.roadmaps))) {
    return [body];
  }

  return [];
}

function coerceMongoId(raw: unknown): string | null {
  if (raw == null) return null;
  if (typeof raw === "string" || typeof raw === "number") return String(raw);
  if (typeof raw === "object" && "$oid" in (raw as object)) {
    return String((raw as { $oid: string }).$oid);
  }
  return null;
}

/** Merge assignment-style row `{ roadmap, progress }` into a single object for list UIs. */
export function normalizeUserRoadmapListItem(row: unknown): RoadMapResponse | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const nested = (r.roadmap ?? r.roadMap) as Record<string, unknown> | undefined;
  const base = (nested && typeof nested === "object" ? nested : r) as Record<string, unknown>;
  const id =
    coerceMongoId(base._id) ??
    coerceMongoId(base.id) ??
    coerceMongoId(r._id) ??
    coerceMongoId(r.roadmapId) ??
    coerceMongoId(r.roadMapId) ??
    coerceMongoId(base.roadMapId);
  if (id == null) return null;
  const progress = r.progress ?? r.userProgress ?? base.progress;
  const roadmaps = Array.isArray(base.roadmaps) ? (base.roadmaps as NestedRoadMapItem[]) : [];
  const merged: RoadMapResponse = {
    ...(base as Partial<RoadMapResponse>),
    _id: String(id),
    name: String(base.name ?? r.name ?? "Roadmap"),
    type: String(base.type ?? "standard"),
    status: String(base.status ?? r.status ?? "not started"),
    duration: String(base.duration ?? r.duration ?? ""),
    roadmaps,
    haveNextedRoadMaps: Boolean(
      base.haveNextedRoadMaps ?? (roadmaps.length > 0),
    ),
  };
  if (progress != null && typeof progress === "object") {
    (merged as RoadMapResponse & { progress?: unknown }).progress = progress;
  }
  return merged;
}

/** Normalize axios body to roadmap array (envelope or raw array). */
export function unwrapRoadmapsList(res: { data: unknown }): RoadMapResponse[] {
  const rows = extractRoadmapArrayFromAxiosData(res.data);
  const out: RoadMapResponse[] = [];
  for (const row of rows) {
    const n = normalizeUserRoadmapListItem(row);
    if (n) {
      out.push(n);
      continue;
    }
    if (row && typeof row === "object") {
      const o = row as Record<string, unknown>;
      if (o._id != null || o.id != null) {
        out.push(row as RoadMapResponse);
      }
    }
  }
  return out;
}

export function unwrapProgressData(res: { data: unknown }): ProgressResponse | null {
  const body = res.data;
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (o.success === false) return null;
  if (o.data && typeof o.data === "object") return normalizeProgressResponse(o.data as ProgressResponse);
  return normalizeProgressResponse(body as ProgressResponse);
}

/** Backend may nest `roadmaps` or `nestedRoadmaps` as `{ items: [...] }`. */
function normalizeProgressResponse(p: ProgressResponse | null | undefined): ProgressResponse | null {
  if (!p || typeof p !== "object") return null;
  const any = p as unknown as Record<string, unknown>;
  let roadmaps = any.roadmaps as unknown;
  if (!Array.isArray(roadmaps) && roadmaps && typeof roadmaps === "object") {
    const items = (roadmaps as { items?: unknown }).items;
    if (Array.isArray(items)) roadmaps = items;
  }
  if (!Array.isArray(roadmaps)) roadmaps = [];
  return { ...(p as ProgressResponse), roadmaps: roadmaps as ProgressRoadmap[] };
}

function nestedProgressList(pr: ProgressRoadmap | undefined): NestedRoadmapProgress[] {
  if (!pr) return [];
  const raw = pr.nestedRoadmaps as unknown;
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown }).items)) {
    return (raw as { items: NestedRoadmapProgress[] }).items;
  }
  return [];
}

/** Trimmed string compare — backend may add whitespace or mix id field shapes. */
function sameId(a: unknown, b: unknown): boolean {
  return String(a ?? "").trim() === String(b ?? "").trim();
}

/** Parent id on progress rows — backend may use roadMapId, roadmapId, or _id. */
function progressRowParentId(p: ProgressRoadmap | Record<string, unknown>): string {
  const r = p as Record<string, unknown>;
  return String(r.roadMapId ?? r.roadmapId ?? r.roadMapID ?? r._id ?? "").trim();
}

/** Nested task id on progress rows — backend may use nestedRoadmapId, _id, or id. */
function nestedRowTaskId(n: NestedRoadmapProgress | Record<string, unknown>): string {
  const r = n as Record<string, unknown>;
  return String(r.nestedRoadmapId ?? r.nestedItemId ?? r._id ?? r.id ?? "").trim();
}

/** Find parent progress row when roadMapId does not strictly equal phase _id (API quirks). */
function findProgressRoadmapForParent(
  progress: ProgressResponse | null | undefined,
  parentRoadmapId: string,
): ProgressRoadmap | undefined {
  const pid = String(parentRoadmapId).trim();
  const list = normalizeProgressResponse(progress)?.roadmaps;
  if (!list?.length) return undefined;
  return list.find((p) => sameId(progressRowParentId(p), pid));
}

/**
 * Find nested progress for a task: prefer the parent’s nested list, then scan all progress parents
 * (nested row is sometimes stored under a mismatched roadMapId).
 */
function findNestedProgressForTask(
  progress: ProgressResponse | null | undefined,
  parentRoadmapId: string,
  taskId: string,
): NestedRoadmapProgress | undefined {
  const tid = String(taskId).trim();
  if (!tid) return undefined;

  const pr = findProgressRoadmapForParent(progress, parentRoadmapId);
  const fromParent = nestedProgressList(pr).find((n) => sameId(nestedRowTaskId(n), tid));
  if (fromParent) return fromParent;

  const all = normalizeProgressResponse(progress)?.roadmaps;
  if (!all?.length) return undefined;
  for (const p of all) {
    const hit = nestedProgressList(p).find((n) => sameId(nestedRowTaskId(n), tid));
    if (hit) return hit;
  }
  return undefined;
}

function isEndDatePast(endDate?: string): boolean {
  if (!endDate || typeof endDate !== "string") return false;
  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return false;
  const today = new Date();
  const a = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const b = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  return b < a;
}

/** Backend may send `dueDate` / snake_case instead of `endDate`. */
function resolveItemEndDate(obj: Record<string, unknown> | undefined | null): string | undefined {
  if (!obj || typeof obj !== "object") return undefined;
  const v = obj.endDate ?? obj.dueDate ?? obj.due_date ?? obj.end_date;
  return typeof v === "string" && v.trim() ? v : undefined;
}

/**
 * Aligns with mobile-style rules: completed / in-progress from steps & %,
 * "Due" mainly for overdue endDate or explicit due/blocked, not as a catch-all.
 */
function mapNestedStatus(
  np: NestedRoadmapProgress | undefined,
  opts: { itemStatus?: string; endDate?: string; parentProgressStatus?: string },
): "Not Started" | "In-progress" | "Due" | "Completed" {
  const { itemStatus, endDate, parentProgressStatus } = opts;
  const totalSteps = Math.max(0, Number(np?.totalSteps) || 0);
  const completedSteps = Math.max(0, Number(np?.completedSteps) || 0);
  const pct = Number(np?.progressPercentage) || 0;

  const npSt = String(np?.status ?? "").toLowerCase().replace(/_/g, " ").trim();
  const itemSt = String(itemStatus ?? "").toLowerCase().replace(/_/g, " ").trim();
  const parSt = String(parentProgressStatus ?? "").toLowerCase().replace(/_/g, " ").trim();
  // Task document / optimistic UI can be "completed" while GET /progress still has a stale nested row.
  if (itemSt === "completed") return "Completed";
  // Meaningful item/template status must win over parent row and over stale `np` strings.
  const nonDefaultItem =
    itemSt && !itemSt.includes("not started") && itemSt !== "initial" ? itemSt : "";
  const merged = (nonDefaultItem || npSt || parSt || itemSt).trim();
  const m = merged.toLowerCase();

  if (pct >= 100) return "Completed";
  if (totalSteps > 0 && completedSteps >= totalSteps) return "Completed";
  // Backend sometimes sends totalSteps:0 when only status/% are maintained
  if (totalSteps === 0 && completedSteps > 0 && pct >= 100) return "Completed";
  if (m.includes("complete")) return "Completed";

  // Due before in-progress so overdue / past end-date work still appears under "Due", not only "In Progress".
  if (m.includes("blocked") || m.includes("overdue")) return "Due";
  if (/\bdue\b/.test(m) && !m.includes("not due")) return "Due";
  if (isEndDatePast(endDate)) return "Due";

  if (totalSteps > 0 && completedSteps > 0 && completedSteps < totalSteps) return "In-progress";
  if (pct > 0 && pct < 100) return "In-progress";
  if (m.includes("progress")) return "In-progress";

  if (!m || m.includes("not started") || m === "initial") return "Not Started";

  return "Not Started";
}

/** Map list UI status to template `status` strings merged onto roadmap docs (all tasks, not only jumpstart). */
function uiStatusToRoadmapDocStatus(s: RoadmapAssignmentUi["status"]): string {
  switch (s) {
    case "Completed":
      return "completed";
    case "In-progress":
      return "in-progress";
    case "Due":
      return "due";
    case "Not Started":
    default:
      return "not started";
  }
}

/**
 * Same status as `/pastor/revitalization-roadmap` cards — derived from GET /progress/:userId
 * plus nested item fallbacks (matches mobile mergeRoadmapWithProgress behavior).
 */
export function deriveTaskStatusForList(
  progress: ProgressResponse | null,
  args: {
    parentRoadmapId: string;
    taskId: string;
    itemStatus?: string;
    endDate?: string;
  },
): RoadmapAssignmentUi["status"] {
  const { parentRoadmapId, taskId, itemStatus, endDate } = args;
  const pr = findProgressRoadmapForParent(progress, parentRoadmapId);
  const np = findNestedProgressForTask(progress, parentRoadmapId, taskId);
  return mapNestedStatus(np, {
    itemStatus,
    endDate,
    parentProgressStatus: pr?.status,
  });
}

/**
 * Flatten nested roadmap tasks (assignments) and merge progress from GET /progress/:userId.
 */
export function buildRoadmapAssignments(
  roadmaps: RoadMapResponse[],
  progress: ProgressResponse | null,
): RoadmapAssignmentUi[] {
  const out: RoadmapAssignmentUi[] = [];

  for (const rm of roadmaps) {
    const parentId = String(rm._id ?? (rm as { id?: string }).id ?? "").trim();
    const pr = findProgressRoadmapForParent(progress, parentId);
    const parentProgressStatus = pr?.status;

    const children: NestedRoadMapItem[] = Array.isArray(rm.roadmaps) ? rm.roadmaps : [];

    if (children.length === 0) {
      const np = pr ? mapNestedProgressSelf(pr) : undefined;
      out.push({
        id: parentId,
        parentRoadmapId: parentId,
        parentRoadmapName: rm.name,
        title: rm.name,
        desc: rm.roadMapDetails || rm.description || "",
        status: mapNestedStatus(np, {
          itemStatus: rm.status,
          endDate: resolveItemEndDate(rm as unknown as Record<string, unknown>) ?? rm.endDate,
          parentProgressStatus,
        }),
        months: rm.duration || "—",
        imageUrl: rm.imageUrl,
        meetings: rm.meetings,
      });
    } else {
      for (const child of children) {
        const cid = String(child._id ?? (child as { id?: string }).id ?? "").trim();
        if (!cid) continue;
        const np = findNestedProgressForTask(progress, parentId, cid);
        out.push({
          id: cid,
          parentRoadmapId: parentId,
          parentRoadmapName: rm.name,
          title: child.name,
          desc: child.roadMapDetails || child.description || "",
          status: mapNestedStatus(np, {
            itemStatus: child.status,
            endDate: resolveItemEndDate(child as unknown as Record<string, unknown>) ?? child.endDate,
            parentProgressStatus,
          }),
          months: child.duration || rm.duration || "—",
          imageUrl: child.imageUrl,
          meetings: child.meetings,
        });
      }
    }
  }

  return out;
}

function mergeGroupStatus(statuses: RoadmapAssignmentUi["status"][]): RoadmapAssignmentUi["status"] {
  if (statuses.length === 0) return "Not Started";
  if (statuses.every((s) => s === "Completed")) return "Completed";
  if (statuses.some((s) => s === "Due")) return "Due";
  if (statuses.some((s) => s === "In-progress")) return "In-progress";
  if (statuses.some((s) => s === "Completed") && statuses.some((s) => s !== "Completed")) {
    return "In-progress";
  }
  return "Not Started";
}

/**
 * One list row per assigned roadmap. Nested tasks stay under jumpstart; the API list is flattened
 * per task — collapse so the revitalization page matches the previous “parent roadmap only” cards.
 */
export function collapseRoadmapAssignmentsToParents(items: RoadmapAssignmentUi[]): RoadmapAssignmentUi[] {
  const byParent = new Map<string, RoadmapAssignmentUi[]>();
  for (const it of items) {
    const pid = String(it.parentRoadmapId ?? it.id ?? "").trim();
    if (!pid) continue;
    const list = byParent.get(pid) ?? [];
    list.push(it);
    byParent.set(pid, list);
  }
  const out: RoadmapAssignmentUi[] = [];
  for (const [parentId, group] of byParent) {
    if (group.length === 1 && String(group[0].id ?? "").trim() === parentId) {
      out.push({ ...group[0], hasNestedTasks: false });
      continue;
    }
    const name = (group[0]?.parentRoadmapName || "").trim() || group[0]?.title || "Roadmap";
    const mergedStatus = mergeGroupStatus(group.map((g) => g.status));
    const firstMeeting = group.map((g) => g.meetings?.[0]).find((m) => m && String(m).trim());
    const img = group.find((g) => g.imageUrl && String(g.imageUrl).trim())?.imageUrl;
    const descFromNestedOnly =
      group.length > 1 || String(group[0]?.id ?? "").trim() !== parentId ? "" : group[0]?.desc ?? "";
    out.push({
      id: parentId,
      parentRoadmapId: parentId,
      parentRoadmapName: name,
      title: name,
      desc: descFromNestedOnly,
      status: mergedStatus,
      months: group[0]?.months || "—",
      imageUrl: img,
      meetings: firstMeeting ? [String(firstMeeting)] : group[0]?.meetings,
      hasNestedTasks: true,
    });
  }
  return out;
}

/** When there are no nested children, map parent-level progress row to pseudo nested metrics. */
function mapNestedProgressSelf(pr: ProgressRoadmap): NestedRoadmapProgress | undefined {
  return {
    nestedRoadmapId: pr.roadMapId,
    completedSteps: pr.completedSteps ?? 0,
    totalSteps: pr.totalSteps ?? 0,
    progressPercentage: pr.progressPercentage ?? 0,
    status: pr.status ?? "",
  };
}

/** Throw when API returns { success: false, message? } with HTTP 200 */
function assertRoadmapsEnvelopeSuccess(body: unknown): void {
  if (!body || typeof body !== "object") return;
  const o = body as Record<string, unknown>;
  if (o.success === false) {
    const msg =
      (typeof o.message === "string" && o.message) ||
      (typeof o.error === "string" && o.error) ||
      "Could not load roadmaps.";
    throw new Error(msg);
  }
}

export function mergeProgressOntoRoadmaps(
  roadmaps: RoadMapResponse[],
  progress: ProgressResponse | null,
): RoadMapResponse[] {
  const progressNorm = normalizeProgressResponse(progress);
  if (!progressNorm?.roadmaps?.length) return roadmaps;

  return roadmaps.map((r) => {
    const rid = String(r._id ?? (r as { id?: string }).id ?? "").trim();
    const pr = progressNorm.roadmaps.find((p) => sameId(progressRowParentId(p), rid));
    if (!pr) return r;

    const parentProgressStatus = pr.status;
    const children: NestedRoadMapItem[] = Array.isArray(r.roadmaps) ? r.roadmaps : [];

    if (children.length === 0) {
      const np = mapNestedProgressSelf(pr);
      const derived = mapNestedStatus(np, {
        itemStatus: r.status,
        endDate: resolveItemEndDate(r as unknown as Record<string, unknown>) ?? r.endDate,
        parentProgressStatus,
      });
      return {
        ...r,
        status: uiStatusToRoadmapDocStatus(derived),
        progress: {
          status: pr.status,
          completedSteps: pr.completedSteps,
          totalSteps: pr.totalSteps,
        },
      } as RoadMapResponse;
    }

    const updatedChildren = children.map((child) => {
      const cid = String(child._id ?? (child as { id?: string }).id ?? "").trim();
      if (!cid) return child;
      const np = findNestedProgressForTask(progressNorm, rid, cid);
      const derived = mapNestedStatus(np, {
        itemStatus: child.status,
        endDate: resolveItemEndDate(child as unknown as Record<string, unknown>) ?? child.endDate,
        parentProgressStatus,
      });
      return {
        ...child,
        status: uiStatusToRoadmapDocStatus(derived),
      } as NestedRoadMapItem;
    });

    return {
      ...r,
      roadmaps: updatedChildren,
      progress: {
        status: pr.status,
        completedSteps: pr.completedSteps,
        totalSteps: pr.totalSteps,
      },
    } as RoadMapResponse;
  });
}

/** When GET /roadmaps/user/:id returns an empty list, build cards from GET /progress/:id roadMapIds + GET /roadmaps/:id */
async function hydrateRoadmapsFromProgress(progress: ProgressResponse): Promise<RoadMapResponse[]> {
  const ids = [...new Set(progress.roadmaps.map((p) => p.roadMapId).filter(Boolean))];
  if (ids.length === 0) return [];
  const settled = await Promise.allSettled(ids.map((id) => apiGetRoadmapById(id)));
  const out: RoadMapResponse[] = [];
  for (const s of settled) {
    if (s.status !== "fulfilled") continue;
    const ax = s.value;
    const rawBody = ax.data as Record<string, unknown> | undefined;
    const doc = (rawBody?.data ?? ax.data) as unknown;
    const n = normalizeUserRoadmapListItem(doc);
    if (n) {
      out.push(n);
      continue;
    }
    if (doc && typeof doc === "object") {
      const o = doc as Record<string, unknown>;
      if (o._id != null || o.id != null) {
        out.push(doc as RoadMapResponse);
      }
    }
  }
  return out;
}

/**
 * List roadmaps for a pastor on the mentor revitalization home page.
 * Parses flexible API shapes; if the user-roadmaps endpoint is empty, hydrates from progress + roadmap-by-id.
 */
export async function resolveMentorUserRoadmapsList(
  roadmapsAxiosRes: { data: unknown },
  progress: ProgressResponse | null,
): Promise<RoadMapResponse[]> {
  assertRoadmapsEnvelopeSuccess(roadmapsAxiosRes.data);
  const progressNorm = normalizeProgressResponse(progress);
  let list = unwrapRoadmapsList(roadmapsAxiosRes);
  if (list.length === 0 && progressNorm?.roadmaps?.length) {
    list = await hydrateRoadmapsFromProgress(progressNorm);
  }
  return mergeProgressOntoRoadmaps(list, progressNorm);
}

export async function fetchRoadmapAssignmentsForUser(userId: string): Promise<RoadmapAssignmentUi[]> {
  const [rmRes, progRes] = await Promise.all([
    apiGetRoadmapsByUser(userId),
    apiGetUserProgress(userId),
  ]);
  assertRoadmapsEnvelopeSuccess(rmRes.data);
  let roadmaps = unwrapRoadmapsList(rmRes);
  const progress = unwrapProgressData(progRes);
  if (roadmaps.length === 0 && progress?.roadmaps?.length) {
    roadmaps = await hydrateRoadmapsFromProgress(progress);
  }
  roadmaps = mergeProgressOntoRoadmaps(roadmaps, progress);
  return buildRoadmapAssignments(roadmaps, progress);
}
