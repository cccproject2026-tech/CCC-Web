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
  status: "Not Started" | "Due" | "Completed";
  months: string;
  imageUrl?: string;
  meetings?: string[];
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
  if (o.data && typeof o.data === "object") return o.data as ProgressResponse;
  return body as ProgressResponse;
}

function mapNestedStatus(
  np: NestedRoadmapProgress | undefined,
  itemStatus?: string,
): "Not Started" | "Due" | "Completed" {
  const pct = np?.progressPercentage ?? 0;
  if (pct >= 100) return "Completed";
  const s = (np?.status || itemStatus || "").toLowerCase();
  if (s.includes("complete")) return "Completed";
  if (s.includes("not started") || s === "" || s === "not started") return "Not Started";
  return "Due";
}

/**
 * Flatten nested roadmap tasks (assignments) and merge progress from GET /progress/:userId.
 */
export function buildRoadmapAssignments(
  roadmaps: RoadMapResponse[],
  progress: ProgressResponse | null,
): RoadmapAssignmentUi[] {
  const progressRoadmapById = new Map<string, ProgressRoadmap>();
  progress?.roadmaps?.forEach((pr) => progressRoadmapById.set(pr.roadMapId, pr));

  const out: RoadmapAssignmentUi[] = [];

  for (const rm of roadmaps) {
    const parentId = String(rm._id);
    const pr = progressRoadmapById.get(parentId);
    const nestedProgressById = new Map<string, NestedRoadmapProgress>();
    pr?.nestedRoadmaps?.forEach((n) => nestedProgressById.set(n.nestedRoadmapId, n));

    const children: NestedRoadMapItem[] = Array.isArray(rm.roadmaps) ? rm.roadmaps : [];

    if (children.length === 0) {
      const np = nestedProgressById.get(parentId);
      out.push({
        id: parentId,
        parentRoadmapId: parentId,
        parentRoadmapName: rm.name,
        title: rm.name,
        desc: rm.roadMapDetails || rm.description || "",
        status: mapNestedStatus(np, rm.status),
        months: rm.duration || "—",
        imageUrl: rm.imageUrl,
        meetings: rm.meetings,
      });
    } else {
      for (const child of children) {
        const cid = String(child._id || "");
        if (!cid) continue;
        const np = nestedProgressById.get(cid);
        out.push({
          id: cid,
          parentRoadmapId: parentId,
          parentRoadmapName: rm.name,
          title: child.name,
          desc: child.roadMapDetails || child.description || "",
          status: mapNestedStatus(np, child.status),
          months: child.duration || rm.duration || "—",
          imageUrl: child.imageUrl,
          meetings: child.meetings,
        });
      }
    }
  }

  return out;
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
  if (!progress?.roadmaps?.length) return roadmaps;
  const byRoadMapId = new Map(progress.roadmaps.map((p) => [p.roadMapId, p]));
  return roadmaps.map((r) => {
    const pr = byRoadMapId.get(r._id);
    if (!pr) return r;
    const existing = (r as RoadMapResponse & { progress?: unknown }).progress;
    if (existing && typeof existing === "object") return r;
    return {
      ...r,
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
  let list = unwrapRoadmapsList(roadmapsAxiosRes);
  if (list.length === 0 && progress?.roadmaps?.length) {
    list = await hydrateRoadmapsFromProgress(progress);
  }
  return mergeProgressOntoRoadmaps(list, progress);
}

export async function fetchRoadmapAssignmentsForUser(userId: string): Promise<RoadmapAssignmentUi[]> {
  const [rmRes, progRes] = await Promise.all([
    apiGetRoadmapsByUser(userId),
    apiGetUserProgress(userId),
  ]);
  const roadmaps = unwrapRoadmapsList(rmRes);
  const progress = unwrapProgressData(progRes);
  return buildRoadmapAssignments(roadmaps, progress);
}
