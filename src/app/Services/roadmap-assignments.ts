import { apiGetRoadmaps, apiGetRoadmapsByUser, apiGetRoadmapById } from "./roadmaps.service";
import { apiGetUserProgress, unwrapUserProgressDetail } from "./progress.service";
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
  if (Array.isArray(o.roadMaps)) return o.roadMaps;
  if (Array.isArray(o.items)) return o.items;
  if (Array.isArray(o.results)) return o.results;

  if (o.data && typeof o.data === "object") {
    const d = o.data as Record<string, unknown>;
    if (Array.isArray(d.data)) return d.data;
    if (Array.isArray(d.roadmaps)) return d.roadmaps;
    if (Array.isArray(d.roadMaps)) return d.roadMaps;
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

/** Match progress ↔ catalogue docs when ids are strings, numbers, or `{ $oid }`. */
export function normalizeRoadmapId(raw: unknown): string {
  return (coerceMongoId(raw) ?? String(raw ?? "").trim()).trim();
}

/** Nested template rows under a phase: API may return `roadmaps: []` or `roadmaps: { items: [] }`. */
export function unwrapNestedRoadmapsArray(roadmap: { roadmaps?: unknown } | null | undefined): NestedRoadMapItem[] {
  if (!roadmap || typeof roadmap !== "object") return [];
  const raw = (roadmap as { roadmaps?: unknown }).roadmaps;
  if (Array.isArray(raw)) return raw as NestedRoadMapItem[];
  if (raw && typeof raw === "object" && Array.isArray((raw as { items?: unknown }).items)) {
    return (raw as { items: NestedRoadMapItem[] }).items;
  }
  return [];
}

/** Resolve Mongo id for a nested phase task (handles populated `roadmap` / alternate id fields). */
export function resolveNestedTemplateItemId(item: unknown): string {
  if (!item || typeof item !== "object" || Array.isArray(item)) return "";
  const r = item as Record<string, unknown>;
  const nestedDoc = r.roadmap ?? r.roadMap;
  const fromPopulated =
    nestedDoc && typeof nestedDoc === "object" && !Array.isArray(nestedDoc)
      ? normalizeRoadmapId(
          (nestedDoc as Record<string, unknown>)._id ?? (nestedDoc as Record<string, unknown>).id,
        )
      : "";
  return (
    normalizeRoadmapId(r._id ?? r.id) ||
    normalizeRoadmapId(r.roadMapId ?? r.roadmapId ?? r.nestedRoadmapId) ||
    fromPopulated ||
    ""
  );
}

/**
 * Mentor revitalization: where to send the user when they open a pastor’s assigned roadmap.
 * Phases with exactly one nested task go straight to the task screen; otherwise phase overview or jump-start.
 */
export function buildMentorRoadmapViewUrl(
  userId: string,
  roadmap: RoadMapResponse | Record<string, unknown>,
): string | null {
  const uid = String(userId ?? "").trim();
  if (!uid) return null;
  const r = roadmap as Record<string, unknown>;
  const rid = normalizeRoadmapId(r._id ?? r.id);
  if (!rid) return null;

  const type = String(r.type ?? "").toLowerCase();
  const nested = unwrapNestedRoadmapsArray(roadmap as { roadmaps?: unknown });
  const isPhase =
    type === "phase" || r.haveNextedRoadMaps === true || nested.length > 0;

  if (!isPhase) {
    return `/mentor/RevitalizationRoadmap/home/jump-start?userId=${encodeURIComponent(uid)}&roadmapId=${encodeURIComponent(rid)}`;
  }

  if (nested.length === 1) {
    const taskId = resolveNestedTemplateItemId(nested[0]);
    if (taskId) {
      return `/mentor/RevitalizationRoadmap/task?userId=${encodeURIComponent(uid)}&roadmapId=${encodeURIComponent(rid)}&taskId=${encodeURIComponent(taskId)}`;
    }
  }

  return `/mentor/RevitalizationRoadmap/phase?userId=${encodeURIComponent(uid)}&roadmapId=${encodeURIComponent(rid)}`;
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

  /** Assignment/list wrappers often put audit fields on the outer row, not on nested `roadmap`. */
  const pickAudit = <T,>(inner: T | null | undefined, outer: T | null | undefined): T | undefined => {
    if (inner !== undefined && inner !== null) return inner;
    if (outer !== undefined && outer !== null) return outer;
    return undefined;
  };

  const pickAuditString = (
    inner?: string | null,
    outer?: string | null,
  ): string | undefined => {
    const i = typeof inner === "string" ? inner.trim() : "";
    if (i) return inner ?? undefined;
    const o = typeof outer === "string" ? outer.trim() : "";
    if (o) return outer ?? undefined;
    return undefined;
  };

  const createdAt =
    pickAuditString(
      (base as Record<string, unknown>).createdAt as string | undefined,
      (r as Record<string, unknown>).createdAt as string | undefined,
    ) ??
    pickAuditString(
      (base as Record<string, unknown>).created_at as string | undefined,
      (r as Record<string, unknown>).created_at as string | undefined,
    );
  if (createdAt != null && String(createdAt).trim() !== "") {
    (merged as Record<string, unknown>).createdAt = createdAt;
  }

  const updatedAt =
    pickAuditString(
      (base as Record<string, unknown>).updatedAt as string | undefined,
      (r as Record<string, unknown>).updatedAt as string | undefined,
    ) ??
    pickAuditString(
      (base as Record<string, unknown>).updated_at as string | undefined,
      (r as Record<string, unknown>).updated_at as string | undefined,
    );
  if (updatedAt != null && String(updatedAt).trim() !== "") {
    (merged as Record<string, unknown>).updatedAt = updatedAt;
  }

  const createdBy =
    pickAudit(
      (base as Record<string, unknown>).createdBy as unknown,
      (r as Record<string, unknown>).createdBy as unknown,
    ) ??
    pickAudit(
      (base as Record<string, unknown>).created_by as unknown,
      (r as Record<string, unknown>).created_by as unknown,
    );
  if (createdBy !== undefined && createdBy !== null) {
    (merged as Record<string, unknown>).createdBy = createdBy;
  }

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
  const detail = unwrapUserProgressDetail(res as { data?: unknown });
  return normalizeProgressResponse(detail);
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

/** Parent id on progress rows — backend may use roadMapId, roadmapId, or _id. */
function progressRowParentId(p: ProgressRoadmap | Record<string, unknown>): string {
  const r = p as Record<string, unknown>;
  return normalizeRoadmapId(r.roadMapId ?? r.roadmapId ?? r.roadMapID ?? r._id);
}

/**
 * Matches CCC-Mobile `useAssignedRoadmaps`: `progressData.roadmaps.items[].roadMapId`
 * (web normalizes `items` onto `roadmaps` first).
 */
function assignedRoadmapIdsFromProgress(progress: ProgressResponse | null | undefined): string[] {
  const norm = normalizeProgressResponse(progress);
  const rows = norm?.roadmaps;
  if (!rows?.length) return [];
  const ids = rows.map((p) => progressRowParentId(p)).filter(Boolean);
  return [...new Set(ids)];
}

function roadmapDocId(rm: RoadMapResponse): string {
  const raw =
    (rm as { _id?: unknown })._id ??
    (rm as { id?: unknown }).id ??
    (rm as { roadMapId?: unknown }).roadMapId ??
    (rm as { roadmapId?: unknown }).roadmapId;
  return normalizeRoadmapId(raw);
}

function filterRoadmapsByAssignedIds(all: RoadMapResponse[], assignedIds: string[]): RoadMapResponse[] {
  if (!assignedIds.length) return [];
  const want = new Set(assignedIds.map((id) => normalizeRoadmapId(id)).filter(Boolean));
  return all.filter((rm) => {
    const id = roadmapDocId(rm);
    return id && want.has(id);
  });
}

/** Nested task id on progress rows — backend may use nestedRoadmapId, _id, or id. */
function nestedRowTaskId(n: NestedRoadmapProgress | Record<string, unknown>): string {
  const r = n as Record<string, unknown>;
  return normalizeRoadmapId(r.nestedRoadmapId ?? r.nestedItemId ?? r._id ?? r.id);
}

/** Trimmed string compare — backend may add whitespace or mix id field shapes. */
function sameId(a: unknown, b: unknown): boolean {
  const ca = normalizeRoadmapId(a);
  const cb = normalizeRoadmapId(b);
  return ca !== "" && cb !== "" && ca === cb;
}

/** Find parent progress row when roadMapId does not strictly equal phase _id (API quirks). */
export function findProgressRoadmapForParent(
  progress: ProgressResponse | null | undefined,
  parentRoadmapId: string,
): ProgressRoadmap | undefined {
  const pid = normalizeRoadmapId(parentRoadmapId);
  const list = normalizeProgressResponse(progress)?.roadmaps;
  if (!list?.length || !pid) return undefined;
  return list.find((p) => sameId(progressRowParentId(p), pid));
}

/**
 * Find nested progress for a task: prefer the parent’s nested list, then scan all progress parents
 * (nested row is sometimes stored under a mismatched roadMapId).
 */
export function findNestedProgressForTask(
  progress: ProgressResponse | null | undefined,
  parentRoadmapId: string,
  taskId: string,
): NestedRoadmapProgress | undefined {
  const tid = normalizeRoadmapId(taskId);
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
  if (!np && pr && parentPhaseCompletedWithoutNestedBreakdown(pr)) {
    return "Completed";
  }
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
    const parentId = normalizeRoadmapId(rm._id ?? (rm as { id?: string }).id);
    if (!parentId) continue;
    const pr = findProgressRoadmapForParent(progress, parentId);
    const parentProgressStatus = pr?.status;
    const phaseCompleteNoNestedTasks = parentPhaseCompletedWithoutNestedBreakdown(pr);

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
        const cid = normalizeRoadmapId(child._id ?? (child as { id?: string }).id);
        if (!cid) continue;
        const np = findNestedProgressForTask(progress, parentId, cid);
        const status: RoadmapAssignmentUi["status"] = np
          ? mapNestedStatus(np, {
              itemStatus: child.status,
              endDate: resolveItemEndDate(child as unknown as Record<string, unknown>) ?? child.endDate,
              parentProgressStatus,
            })
          : phaseCompleteNoNestedTasks
            ? "Completed"
            : mapNestedStatus(undefined, {
                itemStatus: child.status,
                endDate: resolveItemEndDate(child as unknown as Record<string, unknown>) ?? child.endDate,
                parentProgressStatus,
              });
        out.push({
          id: cid,
          parentRoadmapId: parentId,
          parentRoadmapName: rm.name,
          title: child.name,
          desc: child.roadMapDetails || child.description || "",
          status,
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
    const pid = normalizeRoadmapId(it.parentRoadmapId ?? it.id);
    if (!pid) continue;
    const list = byParent.get(pid) ?? [];
    list.push(it);
    byParent.set(pid, list);
  }
  const out: RoadmapAssignmentUi[] = [];
  for (const [parentId, group] of byParent) {
    if (group.length === 1 && normalizeRoadmapId(group[0].id) === normalizeRoadmapId(parentId)) {
      out.push({ ...group[0], hasNestedTasks: false });
      continue;
    }
    const name = (group[0]?.parentRoadmapName || "").trim() || group[0]?.title || "Roadmap";
    const mergedStatus = mergeGroupStatus(group.map((g) => g.status));
    const firstMeeting = group.map((g) => g.meetings?.[0]).find((m) => m && String(m).trim());
    const img = group.find((g) => g.imageUrl && String(g.imageUrl).trim())?.imageUrl;
    const descFromNestedOnly =
      group.length > 1 || normalizeRoadmapId(group[0]?.id) !== normalizeRoadmapId(parentId)
        ? ""
        : group[0]?.desc ?? "";
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
    nestedRoadmapId: normalizeRoadmapId(pr.roadMapId),
    completedSteps: pr.completedSteps ?? 0,
    totalSteps: pr.totalSteps ?? 0,
    progressPercentage: pr.progressPercentage ?? 0,
    status: pr.status ?? "",
  };
}

/**
 * Some APIs mark an entire phase complete on the parent progress row only and omit `nestedRoadmaps[]`.
 * Without this, every nested template task stays "not started" even though the phase is done.
 */
function parentPhaseCompletedWithoutNestedBreakdown(pr: ProgressRoadmap | undefined): boolean {
  if (!pr) return false;
  if (nestedProgressList(pr).length > 0) return false;
  return (
    mapNestedStatus(mapNestedProgressSelf(pr), {
      itemStatus: typeof pr.status === "string" ? pr.status : undefined,
      endDate: undefined,
      parentProgressStatus: undefined,
    }) === "Completed"
  );
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
    const rid = normalizeRoadmapId(r._id ?? (r as { id?: string }).id);
    if (!rid) return r;
    const pr = progressNorm.roadmaps.find((p) => sameId(progressRowParentId(p), rid));
    if (!pr) return r;

    const parentProgressStatus = pr.status;
    const phaseCompleteNoNestedTasks = parentPhaseCompletedWithoutNestedBreakdown(pr);
    const rawRm = (r as { roadmaps?: unknown }).roadmaps;
    const children: NestedRoadMapItem[] = unwrapNestedRoadmapsArray(r);

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
      const cid = resolveNestedTemplateItemId(child);
      if (!cid) return child;
      const np = findNestedProgressForTask(progressNorm, rid, cid);
      const derived: RoadmapAssignmentUi["status"] = np
        ? mapNestedStatus(np, {
            itemStatus: child.status,
            endDate: resolveItemEndDate(child as unknown as Record<string, unknown>) ?? child.endDate,
            parentProgressStatus,
          })
        : phaseCompleteNoNestedTasks
          ? "Completed"
          : mapNestedStatus(undefined, {
              itemStatus: child.status,
              endDate: resolveItemEndDate(child as unknown as Record<string, unknown>) ?? child.endDate,
              parentProgressStatus,
            });
      return {
        ...child,
        status: uiStatusToRoadmapDocStatus(derived),
      } as NestedRoadMapItem;
    });

    const nextRoadmapsField: NestedRoadMapItem[] | Record<string, unknown> =
      rawRm && typeof rawRm === "object" && !Array.isArray(rawRm) && Array.isArray((rawRm as { items?: unknown }).items)
        ? { ...(rawRm as Record<string, unknown>), items: updatedChildren }
        : updatedChildren;

    return {
      ...r,
      roadmaps: nextRoadmapsField as RoadMapResponse["roadmaps"],
      progress: {
        status: pr.status,
        completedSteps: pr.completedSteps,
        totalSteps: pr.totalSteps,
      },
    } as RoadMapResponse;
  });
}

/** Parse Nest/throttler `Retry-After` (seconds). Cap to avoid blocking the UI forever. */
function retryAfterDelayMs(headers: unknown): number | null {
  if (headers == null) return null;
  const h = headers as { get?: (key: string) => string | undefined } & Record<string, unknown>;
  const raw =
    typeof h.get === "function"
      ? h.get("retry-after") ?? h.get("Retry-After")
      : String(h["retry-after"] ?? h["Retry-After"] ?? "").trim();
  if (!raw) return null;
  const sec = Number.parseInt(raw, 10);
  if (!Number.isFinite(sec)) return null;
  return Math.min(Math.max(sec, 1), 60) * 1000;
}

/** Retry transient rate limits; honors `Retry-After` when present. */
async function axiosCallWith429Retry<T>(fn: () => Promise<T>, maxAttempts = 7): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e: unknown) {
      lastErr = e;
      const ax = e as { response?: { status?: number; headers?: unknown } };
      if (ax.response?.status !== 429 || attempt === maxAttempts - 1) throw e;
      const fromHeader = retryAfterDelayMs(ax.response.headers);
      const exponential = Math.min(1100 * 2 ** attempt + Math.floor(Math.random() * 500), 28_000);
      const backoff = fromHeader ?? exponential;
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
  throw lastErr;
}

/** Avoid firing two user-specific GETs in the same throttler window when possible. */
function staggerBetweenUserRoadmapCalls(): Promise<void> {
  return new Promise((r) => setTimeout(r, 520));
}

/** Coalesce concurrent loads per user + strategy (pastor vs mentor catalog). */
const roadmapAssignmentsInflight = new Map<string, Promise<RoadmapAssignmentUi[]>>();

export type FetchRoadmapAssignmentsMode = "pastor" | "mentor-catalog";

/** When GET /roadmaps/user/:id returns an empty list, build cards from GET /progress/:id roadMapIds + GET /roadmaps/:id */
async function hydrateRoadmapsFromProgress(progress: ProgressResponse): Promise<RoadMapResponse[]> {
  const ids = [...new Set(progress.roadmaps.map((p) => progressRowParentId(p)).filter(Boolean))];
  if (ids.length === 0) return [];
  const out: RoadMapResponse[] = [];
  for (let i = 0; i < ids.length; i++) {
    const id = String(ids[i] ?? "").trim();
    if (!id) continue;
    if (i > 0) await new Promise((r) => setTimeout(r, 240));
    try {
      const ax = await axiosCallWith429Retry(() => apiGetRoadmapById(id));
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
    } catch {
      /* skip missing roadmap doc */
    }
  }
  return out;
}

/**
 * Pastor / mentee parity with CCC-Mobile `useAssignedRoadmaps`:
 * progress-derived IDs → full catalog filtered → `/roadmaps/user` → hydrate by id.
 */
async function loadPastorParityRoadmapsAndProgress(userId: string): Promise<{
  roadmaps: RoadMapResponse[];
  progressNorm: ProgressResponse | null;
}> {
  const uid = String(userId).trim();

  const progRes = await axiosCallWith429Retry(() => apiGetUserProgress(uid));
  assertRoadmapsEnvelopeSuccess(progRes.data);
  const progress = unwrapProgressData(progRes);
  const progressNorm = normalizeProgressResponse(progress);

  await staggerBetweenUserRoadmapCalls();

  let roadmaps: RoadMapResponse[] = [];
  const assignedIds = assignedRoadmapIdsFromProgress(progressNorm);

  if (assignedIds.length > 0) {
    const allRes = await axiosCallWith429Retry(() => apiGetRoadmaps("all", ""));
    assertRoadmapsEnvelopeSuccess(allRes.data);
    roadmaps = filterRoadmapsByAssignedIds(unwrapRoadmapsList(allRes), assignedIds);
  }

  if (roadmaps.length === 0) {
    const rmUserRes = await axiosCallWith429Retry(() => apiGetRoadmapsByUser(uid));
    assertRoadmapsEnvelopeSuccess(rmUserRes.data);
    roadmaps = unwrapRoadmapsList(rmUserRes);
  }

  if (roadmaps.length === 0 && progressNorm?.roadmaps?.length) {
    roadmaps = await hydrateRoadmapsFromProgress(progressNorm);
  }

  roadmaps = mergeProgressOntoRoadmaps(roadmaps, progressNorm);
  return { roadmaps, progressNorm };
}

/** Mentor hub: merged roadmap docs for a pastor/mentee `userId` (same loading rules as pastor revitalization). */
const mergedAssignedRoadmapsInflight = new Map<string, Promise<RoadMapResponse[]>>();

export async function fetchMergedRoadmapsForAssignedUser(userId: string): Promise<RoadMapResponse[]> {
  const uid = String(userId ?? "").trim();
  if (!uid) return [];

  const existing = mergedAssignedRoadmapsInflight.get(uid);
  if (existing) return existing;

  const promise = loadPastorParityRoadmapsAndProgress(uid)
    .then(({ roadmaps }) => roadmaps)
    .finally(() => {
      mergedAssignedRoadmapsInflight.delete(uid);
    });

  mergedAssignedRoadmapsInflight.set(uid, promise);
  return promise;
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

/**
 * Pastor: matches CCC-Mobile `useAssignedRoadmaps` — progress IDs → `GET /roadmaps` → filter,
 * then `/roadmaps/user` + per-id hydrate fallbacks when needed.
 * Mentor list: matches `useRoadmaps('mentor')` / `useAllRoadmaps` — full catalog merged with that user’s progress.
 */
async function fetchRoadmapAssignmentsForUserUncached(
  userId: string,
  mode: FetchRoadmapAssignmentsMode,
): Promise<RoadmapAssignmentUi[]> {
  const uid = String(userId).trim();

  if (mode === "mentor-catalog") {
    const progRes = await axiosCallWith429Retry(() => apiGetUserProgress(uid));
    assertRoadmapsEnvelopeSuccess(progRes.data);
    const progress = unwrapProgressData(progRes);
    const progressNorm = normalizeProgressResponse(progress);

    await staggerBetweenUserRoadmapCalls();

    const allRes = await axiosCallWith429Retry(() => apiGetRoadmaps("all", ""));
    assertRoadmapsEnvelopeSuccess(allRes.data);
    let roadmaps = unwrapRoadmapsList(allRes);
    roadmaps = mergeProgressOntoRoadmaps(roadmaps, progressNorm);
    return buildRoadmapAssignments(roadmaps, progressNorm);
  }

  const { roadmaps, progressNorm } = await loadPastorParityRoadmapsAndProgress(uid);
  return buildRoadmapAssignments(roadmaps, progressNorm);
}

export async function fetchRoadmapAssignmentsForUser(
  userId: string,
  options?: { mode?: FetchRoadmapAssignmentsMode },
): Promise<RoadmapAssignmentUi[]> {
  const uid = String(userId ?? "").trim();
  const mode = options?.mode ?? "pastor";
  if (!uid) return [];

  const inflightKey = `${uid}:${mode}`;
  const existing = roadmapAssignmentsInflight.get(inflightKey);
  if (existing) return existing;

  const promise = fetchRoadmapAssignmentsForUserUncached(uid, mode).finally(() => {
    roadmapAssignmentsInflight.delete(inflightKey);
  });

  roadmapAssignmentsInflight.set(inflightKey, promise);
  return promise;
}
