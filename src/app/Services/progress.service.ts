import axiosInstance from "./config/axios-instance";
import type {
  DirectorOverview,
  MonthlyCompletion,
  UserOverallProgress,
  ProgressResponse,
  ProgressRoadmap,
  FinalComment,
  AssignRoadmapPayload,
  AssignAssessmentPayload,
  UpdateRoadmapProgressPayload,
  UpdateAssessmentProgressPayload,
  AddFinalCommentPayload,
  UpdateFinalCommentPayload,
  DeleteFinalCommentPayload,
  GetDirectorOverviewParams,
} from "./types/progress.types";

function numFromApi(v: unknown, fallback = 0): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return fallback;
}

function mapMonthlyRow(m: Record<string, unknown>): MonthlyCompletion {
  return {
    month: numFromApi(m.month),
    year: numFromApi(m.year),
    monthName: String(m.monthName ?? m.month_name ?? m.label ?? ""),
    mentorsCompleted: numFromApi(
      m.mentorsCompleted ?? m.mentors_completed ?? m.mentorCount ?? m.mentor_count,
    ),
    pastorsCompleted: numFromApi(
      m.pastorsCompleted ?? m.pastors_completed ?? m.pastorCount ?? m.pastor_count,
    ),
  };
}

function recordLooksLikeDirectorOverview(o: Record<string, unknown>): boolean {
  if ("totalMentors" in o || "total_mentors" in o) return true;
  if ("monthlyData" in o || "monthly_data" in o) return true;
  if ("overallCombinedProgress" in o || "overall_combined_progress" in o) return true;
  if ("totalPastors" in o || "total_pastors" in o) return true;
  return false;
}

/**
 * Normalizes GET `/progress/overview/director` — envelope + camelCase/snake_case field names.
 */
export function unwrapDirectorOverview(
  res: { data?: unknown } | null | undefined,
): DirectorOverview | null {
  const axiosBody = res?.data;
  if (axiosBody == null || typeof axiosBody !== "object") return null;

  const pickOverview = (raw: unknown): Record<string, unknown> | null => {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
    const o = raw as Record<string, unknown>;
    if (recordLooksLikeDirectorOverview(o)) return o;
    if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
      const inner = o.data as Record<string, unknown>;
      if (recordLooksLikeDirectorOverview(inner)) return inner;
      const deep = inner.data;
      if (deep && typeof deep === "object" && !Array.isArray(deep)) {
        const d = deep as Record<string, unknown>;
        if (recordLooksLikeDirectorOverview(d)) return d;
      }
    }
    return null;
  };

  let root = pickOverview(axiosBody);
  if (!root) {
    root = pickOverview((axiosBody as Record<string, unknown>).data);
  }
  if (!root) return null;

  const monthlyRaw = (root.monthlyData ?? root.monthly_data) as unknown;
  const monthlyData: MonthlyCompletion[] = Array.isArray(monthlyRaw)
    ? monthlyRaw.map((row) =>
        row && typeof row === "object"
          ? mapMonthlyRow(row as Record<string, unknown>)
          : mapMonthlyRow({}),
      )
    : [];

  const totalMentors = numFromApi(root.totalMentors ?? root.total_mentors);
  const totalPastors = numFromApi(root.totalPastors ?? root.total_pastors);
  const totalUsers = numFromApi(root.totalUsers ?? root.total_users);
  const completedMentors = numFromApi(root.completedMentors ?? root.completed_mentors);
  const completedPastors = numFromApi(root.completedPastors ?? root.completed_pastors);
  const completedUsers = numFromApi(root.completedUsers ?? root.completed_users);
  const mentorsOverallProgress = numFromApi(
    root.mentorsOverallProgress ?? root.mentors_overall_progress,
  );
  const pastorsOverallProgress = numFromApi(
    root.pastorsOverallProgress ?? root.pastors_overall_progress,
  );

  let overallCombinedProgress = numFromApi(
    root.overallCombinedProgress ?? root.overall_combined_progress,
  );
  if (overallCombinedProgress === 0 && totalUsers > 0) {
    overallCombinedProgress = (completedUsers / totalUsers) * 100;
  }
  if (overallCombinedProgress === 0 && (mentorsOverallProgress > 0 || pastorsOverallProgress > 0)) {
    overallCombinedProgress = (mentorsOverallProgress + pastorsOverallProgress) / 2;
  }

  const users = root.users;
  const out: DirectorOverview = {
    totalMentors,
    completedMentors,
    mentorsOverallProgress,
    totalPastors,
    completedPastors,
    pastorsOverallProgress,
    totalUsers,
    completedUsers,
    overallCombinedProgress: Math.min(100, Math.max(0, overallCombinedProgress)),
    monthlyData,
  };
  if (Array.isArray(users)) {
    (out as { users?: UserOverallProgress[] }).users = users as UserOverallProgress[];
  }
  return out;
}

function readRoleString(o: Record<string, unknown>): string {
  const r = o.role ?? o.userRole ?? o.user_role ?? o.type ?? o.userType;
  if (typeof r === "string") return r;
  if (r && typeof r === "object") {
    const ro = r as Record<string, unknown>;
    if (typeof ro.name === "string") return ro.name;
    if (typeof ro.role === "string") return ro.role;
  }
  const u = o.user;
  if (u && typeof u === "object" && !Array.isArray(u)) {
    const ur = (u as Record<string, unknown>).role;
    if (typeof ur === "string") return ur;
  }
  return "";
}

function roleBucketForAggregate(role: string): "mentor" | "pastor" | "other" {
  const r = (role || "").toLowerCase();
  if (r.includes("pastor")) return "pastor";
  if (r.includes("mentor") || r.includes("field-mentor")) return "mentor";
  return "other";
}

function readUserOverallRow(row: UserOverallProgress | Record<string, unknown>) {
  const o = row as Record<string, unknown>;
  const overallProgress = numFromApi(
    o.overallProgress ?? o.overall_progress,
  );
  const oc = o.overallCompleted ?? o.overall_completed;
  let overallCompleted = oc === true || oc === "true" || oc === 1;
  if (!overallCompleted) {
    const tr = numFromApi(o.totalRoadmaps ?? o.total_roadmaps);
    const cr = numFromApi(o.completedRoadmaps ?? o.completed_roadmaps);
    const ta = numFromApi(o.totalAssessments ?? o.total_assessments);
    const ca = numFromApi(o.completedAssessments ?? o.completed_assessments);
    const ti = numFromApi(o.totalItems ?? o.total_items);
    const ci = numFromApi(o.completedItems ?? o.completed_items);
    if (overallProgress >= 99) overallCompleted = true;
    else if (tr > 0 && cr >= tr) overallCompleted = true;
    else if (ta > 0 && ca >= ta) overallCompleted = true;
    else if (ti > 0 && ci >= ti) overallCompleted = true;
  }
  return {
    role: readRoleString(o),
    overallProgress: Math.min(100, Math.max(0, overallProgress)),
    overallCompleted,
  };
}

function parseIsoDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? null : v;
  if (typeof v === "number") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "string" && v.trim() !== "") {
    const d = new Date(v.trim());
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/** Calendar months ending in `ref` month, oldest first (for chart left-to-right). */
function lastNYearMonths(n: number, ref: Date = new Date()): { year: number; month: number }[] {
  const out: { year: number; month: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return out;
}

function getCompletionOrActivityDate(
  o: Record<string, unknown>,
): { year: number; month: number } | null {
  const tryObj = (obj: Record<string, unknown> | null): Date | null => {
    if (!obj) return null;
    const keys = [
      "completedAt",
      "completed_at",
      "courseCompletedAt",
      "course_completed_at",
      "lastCompletedAt",
      "last_completed_at",
      "completionDate",
      "completion_date",
      "roadmapCompletedAt",
      "roadmap_completed_at",
      "assessmentCompletedAt",
      "assessment_completed_at",
      "updatedAt",
      "updated_at",
      "lastModified",
      "last_modified",
      "createdAt",
      "created_at",
    ] as const;
    for (const k of keys) {
      const d = parseIsoDate(obj[k as string]);
      if (d) return d;
    }
    return null;
  };

  let d = tryObj(o);
  if (d) return { year: d.getFullYear(), month: d.getMonth() + 1 };
  const p = o.progress;
  if (p && typeof p === "object" && !Array.isArray(p)) {
    d = tryObj(p as Record<string, unknown>);
    if (d) return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }
  return null;
}

/**
 * Count mentor/pastor completions per calendar month for the last `months` months.
 * Uses completion/activity timestamps when present; completed users with no in-range
 * date are counted in the latest month in view.
 */
export function buildMonthlyCompletionsFromUserProgressRows(
  rows: UserOverallProgress[],
  months = 6,
  refDate = new Date(),
): MonthlyCompletion[] {
  const grid = lastNYearMonths(months, refDate);
  const key = (y: number, m: number) => y * 100 + m;
  const bucket = new Map<number, { mentors: number; pastors: number }>();
  for (const p of grid) {
    bucket.set(key(p.year, p.month), { mentors: 0, pastors: 0 });
  }

  const lastInView = grid[grid.length - 1];
  const keyLast = key(lastInView.year, lastInView.month);

  for (const row of rows) {
    const o = row as Record<string, unknown>;
    const { role, overallCompleted } = readUserOverallRow(row);
    if (!overallCompleted) continue;
    const b = roleBucketForAggregate(role);
    if (b === "other") continue;

    const dt = getCompletionOrActivityDate(o);
    let assignKey: number | null = null;
    if (dt) {
      const kk = key(dt.year, dt.month);
      if (bucket.has(kk)) assignKey = kk;
    }
    if (assignKey == null) assignKey = keyLast;

    const cell = bucket.get(assignKey)!;
    if (b === "mentor") cell.mentors += 1;
    else cell.pastors += 1;
  }

  return grid.map((p) => {
    const k = key(p.year, p.month);
    const c = bucket.get(k)!;
    const d = new Date(p.year, p.month - 1, 1);
    return {
      month: p.month,
      year: p.year,
      monthName: d.toLocaleString("en-US", { month: "short" }),
      mentorsCompleted: c.mentors,
      pastorsCompleted: c.pastors,
    };
  });
}

function monthlySeriesIsAllZeros(data: MonthlyCompletion[] | null | undefined): boolean {
  if (!data || !data.length) return true;
  return data.every(
    (r) => (r.mentorsCompleted ?? 0) === 0 && (r.pastorsCompleted ?? 0) === 0,
  );
}

/** When strict "completions" yield no per-month counts, show active mentor/pastor users by last activity month. */
function buildMonthlyEngagementFromUserProgressRows(
  rows: UserOverallProgress[],
  months = 6,
  refDate = new Date(),
): MonthlyCompletion[] {
  const grid = lastNYearMonths(months, refDate);
  const key = (y: number, m: number) => y * 100 + m;
  const bucket = new Map<number, { mentors: number; pastors: number }>();
  for (const p of grid) {
    bucket.set(key(p.year, p.month), { mentors: 0, pastors: 0 });
  }
  const keyLast = key(grid[grid.length - 1].year, grid[grid.length - 1].month);

  for (const row of rows) {
    const o = row as Record<string, unknown>;
    const { role, overallProgress } = readUserOverallRow(row);
    const b = roleBucketForAggregate(role);
    if (b === "other") continue;
    if (overallProgress <= 0) continue;

    const dt = getCompletionOrActivityDate(o);
    let assignKey: number | null = null;
    if (dt) {
      const kk = key(dt.year, dt.month);
      if (bucket.has(kk)) assignKey = kk;
    }
    if (assignKey == null) assignKey = keyLast;

    const cell = bucket.get(assignKey)!;
    if (b === "mentor") cell.mentors += 1;
    else cell.pastors += 1;
  }

  return grid.map((p) => {
    const k = key(p.year, p.month);
    const c = bucket.get(k)!;
    const d = new Date(p.year, p.month - 1, 1);
    return {
      month: p.month,
      year: p.year,
      monthName: d.toLocaleString("en-US", { month: "short" }),
      mentorsCompleted: c.mentors,
      pastorsCompleted: c.pastors,
    };
  });
}

/**
 * Build director overview card + donut values from `GET /progress/overview/all` when
 * `/progress/overview/director` returns empty or zeros.
 */
export function aggregateDirectorOverviewFromUsers(
  rows: UserOverallProgress[],
): DirectorOverview {
  const mentors: UserOverallProgress[] = [];
  const pastors: UserOverallProgress[] = [];
  for (const row of rows) {
    const { role } = readUserOverallRow(row);
    const b = roleBucketForAggregate(role);
    if (b === "mentor") mentors.push(row);
    else if (b === "pastor") pastors.push(row);
  }

  const avg = (arr: UserOverallProgress[]) => {
    if (!arr.length) return 0;
    let s = 0;
    for (const row of arr) s += readUserOverallRow(row).overallProgress;
    return Math.min(100, Math.round((s / arr.length) * 10) / 10);
  };
  const countCompleted = (arr: UserOverallProgress[]) =>
    arr.filter((row) => readUserOverallRow(row).overallCompleted).length;

  const all = [...mentors, ...pastors];
  let overallCombinedProgress = 0;
  if (all.length) {
    let s = 0;
    for (const row of all) s += readUserOverallRow(row).overallProgress;
    overallCombinedProgress = Math.min(100, Math.round((s / all.length) * 10) / 10);
  }

  return {
    totalMentors: mentors.length,
    completedMentors: countCompleted(mentors),
    mentorsOverallProgress: avg(mentors),
    totalPastors: pastors.length,
    completedPastors: countCompleted(pastors),
    pastorsOverallProgress: avg(pastors),
    totalUsers: all.length,
    completedUsers: countCompleted(all),
    overallCombinedProgress,
    monthlyData: (() => {
      const maxMonths = 12;
      const byDone = buildMonthlyCompletionsFromUserProgressRows(all, maxMonths);
      if (!monthlySeriesIsAllZeros(byDone)) return byDone;
      return buildMonthlyEngagementFromUserProgressRows(all, maxMonths);
    })(),
  };
}

/**
 * Prefer non-empty director overview API monthly series; fill progress + headcounts from
 * `/overview/all` when the overview endpoint returns zeros.
 */
export function mergeDirectorOverviewWithUserAggregate(
  api: DirectorOverview | null,
  fromUsers: DirectorOverview | null,
): DirectorOverview | null {
  if (!fromUsers || (fromUsers.totalUsers === 0 && !fromUsers.totalMentors && !fromUsers.totalPastors)) {
    return api;
  }
  if (!api) return fromUsers;

  const pick = (a: number, b: number) => (a > 0 ? a : b);

  const apiM = api.monthlyData ?? [];
  const uM = fromUsers.monthlyData ?? [];
  const useUserMonthly =
    uM.length > 0 &&
    (apiM.length === 0 || monthlySeriesIsAllZeros(apiM));

  return {
    ...api,
    totalMentors: Math.max(api.totalMentors, fromUsers.totalMentors),
    totalPastors: Math.max(api.totalPastors, fromUsers.totalPastors),
    completedMentors: Math.max(api.completedMentors, fromUsers.completedMentors),
    completedPastors: Math.max(api.completedPastors, fromUsers.completedPastors),
    totalUsers: Math.max(api.totalUsers, fromUsers.totalUsers),
    completedUsers: Math.max(api.completedUsers, fromUsers.completedUsers),
    mentorsOverallProgress: pick(api.mentorsOverallProgress, fromUsers.mentorsOverallProgress),
    pastorsOverallProgress: pick(api.pastorsOverallProgress, fromUsers.pastorsOverallProgress),
    overallCombinedProgress: pick(api.overallCombinedProgress, fromUsers.overallCombinedProgress),
    monthlyData: useUserMonthly ? uM : apiM.length > 0 ? apiM : uM,
  };
}

// GET /progress/overview/director?period=&year=&includeUsers=
export const apiGetDirectorOverview = (params?: GetDirectorOverviewParams) =>
  axiosInstance.get<{ success: boolean; data: DirectorOverview }>(
    "/progress/overview/director",
    {
      params: { ...params, _cb: Date.now() },
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    },
  );

// GET /progress/overview/all?roles=
export const apiGetOverallProgress = (roles?: string | string[]) => {
  const rolesParam = Array.isArray(roles) ? roles.join(",") : roles;
  return axiosInstance.get<{ success: boolean; data: UserOverallProgress[] }>(
    "/progress/overview/all",
    {
      params: {
        ...(rolesParam ? { roles: rolesParam } : {}),
        _cb: Date.now(),
      },
      headers: {
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
    },
  );
};

// GET /progress/:userId — bust HTTP caches (304) so list/phase pages match latest PATCH.
export const apiGetUserProgress = (userId: string) =>
  axiosInstance.get<{ success: boolean; data: ProgressResponse | null }>(`/progress/${userId}`, {
    params: { _cb: Date.now() },
    headers: {
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  });

export type BulkProgressDetail = {
  userId: string;
  roadmapProgressPercent: number | null;
  roadmaps?: ProgressRoadmap[];
  failed?: boolean;
  [key: string]: unknown;
};

export type BulkProgressByUserId = Record<string, number | null>;

function parseBulkProgressPercent(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.min(100, Math.max(0, raw));
  }
  if (typeof raw === "string" && raw.trim() !== "" && Number.isFinite(Number(raw))) {
    const value = Number(raw);
    return Math.min(100, Math.max(0, value));
  }
  return null;
}

function unwrapBulkProgressPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const body = raw as Record<string, unknown>;
  if ("data" in body && (Array.isArray(body.data) || (body.data && typeof body.data === "object"))) {
    return body.data;
  }
  return raw;
}

function bulkProgressRowLooksLikeSingleRow(row: Record<string, unknown>): boolean {
  return (
    "userId" in row ||
    "user_id" in row ||
    "userID" in row ||
    "roadmapProgressPercent" in row ||
    "roadmap_progress_percent" in row ||
    "progressPercentage" in row ||
    "progress_percentage" in row ||
    "overallProgress" in row ||
    "overall_progress" in row
  );
}

function unwrapBulkRoadmaps(raw: unknown): ProgressRoadmap[] | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const o = raw as Record<string, unknown>;
  const roadmaps = o.roadmaps ?? o.roadmapsItems ?? o.items;
  if (Array.isArray(roadmaps)) return roadmaps as ProgressRoadmap[];
  if (roadmaps && typeof roadmaps === "object" && Array.isArray((roadmaps as { items?: unknown }).items)) {
    return (roadmaps as { items: ProgressRoadmap[] }).items;
  }
  return undefined;
}

function bulkProgressRowToDetail(row: unknown, fallbackUserId = ""): [string, BulkProgressDetail] | null {
  if (!row || typeof row !== "object" || Array.isArray(row)) return null;
  const r = row as Record<string, unknown>;
  const userId = coerceProgressUserId(r.userId ?? r.user_id ?? r.userID ?? fallbackUserId ?? r.id ?? r._id);
  if (!userId) return null;

  const failed =
    r.success === false ||
    r.error != null ||
    r.message != null ||
    r.failed === true ||
    r.status === false ||
    r.statusCode === 429 ||
    r.code === 429;

  const roadmapProgressPercent = parseBulkProgressPercent(
    r.roadmapProgressPercent ??
      r.roadmap_progress_percent ??
      r.progressPercentage ??
      r.progress_percentage ??
      r.overallProgress ??
      r.overall_progress ??
      r.progress,
  );

  const detail: BulkProgressDetail = {
    ...r,
    userId,
    roadmapProgressPercent,
  };
  const roadmaps = unwrapBulkRoadmaps(r.roadmaps ?? r.progress ?? r.data);
  if (roadmaps) detail.roadmaps = roadmaps;
  if (failed) detail.failed = true;
  return [userId, detail];
}

/**
 * Normalize POST `/progress/bulk` into a userId -> full row map.
 * Supports both `{ data: { [userId]: row } }` and `{ data: row[] }` shapes.
 */
export function unwrapBulkProgressDetails(res: { data?: unknown }): Record<string, BulkProgressDetail> {
  const raw = unwrapBulkProgressPayload(res?.data);
  if (raw == null) return {};

  if (Array.isArray(raw)) {
    const out: Record<string, BulkProgressDetail> = {};
    for (const row of raw) {
      const entry = bulkProgressRowToDetail(row);
      if (!entry) continue;
      out[entry[0]] = entry[1];
    }
    return out;
  }

  if (typeof raw !== "object") return {};

  const body = raw as Record<string, unknown>;
  if (bulkProgressRowLooksLikeSingleRow(body)) {
    const entry = bulkProgressRowToDetail(body);
    return entry ? { [entry[0]]: entry[1] } : {};
  }

  const out: Record<string, BulkProgressDetail> = {};
  for (const [userId, value] of Object.entries(body)) {
    if (!userId.trim()) continue;
    if (value == null) {
      out[userId] = { userId, roadmapProgressPercent: null, failed: true };
      continue;
    }
    if (typeof value === "number" || typeof value === "string") {
      out[userId] = { userId, roadmapProgressPercent: parseBulkProgressPercent(value) };
      continue;
    }
    if (typeof value === "object" && !Array.isArray(value)) {
      const entry = bulkProgressRowToDetail(value, userId);
      if (entry) {
        out[userId] = entry[1];
      }
    }
  }
  return out;
}

/**
 * Normalize POST `/progress/bulk` into a userId -> progress percent map.
 * This is the lightweight helper for UI surfaces that only need the number.
 */
export function unwrapBulkProgressMap(res: { data?: unknown }): BulkProgressByUserId {
  const details = unwrapBulkProgressDetails(res);
  const out: BulkProgressByUserId = {};
  for (const [userId, detail] of Object.entries(details)) {
    out[userId] = detail.roadmapProgressPercent ?? null;
  }
  return out;
}

// POST /progress/bulk  body: { userIds: string[] }
export const apiGetBulkProgress = (userIds: string[]) =>
  axiosInstance.post<{ success: boolean; data: unknown }>("/progress/bulk", { userIds });

// POST /progress/assign-roadmap  body: { userIds, roadMapIds }
export const apiAssignRoadmap = (payload: AssignRoadmapPayload) =>
  axiosInstance.post<{ success: boolean; data: ProgressResponse[] }>(
    "/progress/assign-roadmap",
    payload,
  );

// POST /progress/assign-assessment  body: { userIds, assessmentIds }
export const apiAssignAssessment = (payload: AssignAssessmentPayload) =>
  axiosInstance.post<{ success: boolean; data: ProgressResponse }>(
    "/progress/assign-assessment",
    payload,
  );

// PATCH /progress/roadmap/update
export const apiUpdateRoadmapProgress = (payload: UpdateRoadmapProgressPayload) => {
  const nested = payload.nestedRoadmapId?.trim();
  const body: Record<string, unknown> = {
    userId: payload.userId,
    roadMapId: payload.roadMapId,
  };
  if (payload.completedSteps !== undefined) body.completedSteps = payload.completedSteps;
  if (payload.status !== undefined) body.status = payload.status;
  if (nested) {
    body.nestedRoadmapId = nested;
    body.nestedRoadMapItemId = nested;
  }
  return axiosInstance.patch<{ success: boolean; data: ProgressResponse }>(
    "/progress/roadmap/update",
    body,
  );
};

// PATCH /progress/assessment/update
export const apiUpdateAssessmentProgress = (payload: UpdateAssessmentProgressPayload) =>
  axiosInstance.patch<{ success: boolean; data: ProgressResponse }>(
    "/progress/assessment/update",
    payload,
  );

// POST /progress/final-comments  body: { userId, commentorId, comment }
export const apiAddFinalComment = (payload: AddFinalCommentPayload) =>
  axiosInstance.post<{ success: boolean; data: ProgressResponse }>(
    "/progress/final-comments",
    payload,
  );

// GET /progress/:userId/final-comments
export const apiGetFinalComments = (userId: string) =>
  axiosInstance.get<{ success: boolean; data: FinalComment[] }>(
    `/progress/${userId}/final-comments`,
  );

// PATCH /progress/final-comments  body: { userId, commentId, comment }
export const apiUpdateFinalComment = (payload: UpdateFinalCommentPayload) =>
  axiosInstance.patch<{ success: boolean; data: ProgressResponse }>(
    "/progress/final-comments",
    payload,
  );

// DELETE /progress/final-comments  body: { userId, commentId }
export const apiDeleteFinalComment = (payload: DeleteFinalCommentPayload) =>
  axiosInstance.delete<{ success: boolean; data: ProgressResponse }>(
    "/progress/final-comments",
    { data: payload },
  );

// PATCH /users/:userId/mark-completed — program completion (same URL as apiMarkUserCompleted in users.service)
export const apiMarkProgramComplete = (userId: string) =>
  axiosInstance.patch<{ success: boolean; data: ProgressResponse }>(
    `/users/${userId}/mark-completed`,
  );

const OVERVIEW_LIST_KEYS = [
  "data",
  "users",
  "items",
  "records",
  "result",
  "rows",
  "list",
  "progress",
  "overview",
] as const;

function arrayFromProgressOverviewObject(obj: Record<string, unknown>): UserOverallProgress[] | null {
  for (const key of OVERVIEW_LIST_KEYS) {
    const v = obj[key];
    if (Array.isArray(v)) return v as UserOverallProgress[];
  }
  return null;
}

/** Normalize GET `/progress/overview/all` — envelope shapes differ by deploy/version. */
export function unwrapOverallProgressList(res: { data?: unknown }): UserOverallProgress[] {
  const raw = res?.data;
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as UserOverallProgress[];

  if (typeof raw !== "object") return [];

  const body = raw as Record<string, unknown>;
  const top = arrayFromProgressOverviewObject(body);
  if (top) return top;

  const inner = body.data;
  if (inner && typeof inner === "object" && !Array.isArray(inner)) {
    const mid = arrayFromProgressOverviewObject(inner as Record<string, unknown>);
    if (mid) return mid;
    const deep = (inner as Record<string, unknown>).data;
    if (Array.isArray(deep)) return deep as UserOverallProgress[];
    if (deep && typeof deep === "object" && !Array.isArray(deep)) {
      const d = arrayFromProgressOverviewObject(deep as Record<string, unknown>);
      if (d) return d;
    }
  }

  return [];
}

/** Normalize ids returned from overview/list payloads (string, number, Mongo $oid). */
function coerceProgressUserId(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") return raw.trim();
  if (typeof raw === "number") return String(raw);
  if (typeof raw === "object" && raw !== null && "$oid" in (raw as object)) {
    return String((raw as { $oid: string }).$oid);
  }
  if (typeof raw === "object" && raw !== null && "_id" in (raw as object)) {
    return coerceProgressUserId((raw as { _id: unknown })._id);
  }
  return "";
}

/**
 * Row `userId` may be a string id or a populated `{ _id }` (some API versions).
 */
export function extractUserIdFromOverallProgressRow(
  item: UserOverallProgress | Record<string, unknown>,
): string | undefined {
  const row = item as Record<string, unknown>;
  const u = row.userId as unknown;
  if (typeof u === "string" && u.trim()) return u.trim();
  if (u && typeof u === "object") {
    const nested = coerceProgressUserId(
      (u as Record<string, unknown>)._id ?? (u as Record<string, unknown>).id,
    );
    if (nested) return nested;
  }
  const fromVariants = coerceProgressUserId(
    row.userID ?? row.user_id ?? row.userid ?? row.memberId ?? row.member_id,
  );
  if (fromVariants) return fromVariants;

  const nu = row.user;
  if (nu && typeof nu === "object" && !Array.isArray(nu)) {
    const userRec = nu as Record<string, unknown>;
    const fromNestedUser = coerceProgressUserId(
      userRec._id ?? userRec.id ?? userRec.userId ?? userRec.user_id,
    );
    if (fromNestedUser) return fromNestedUser;
  }

  const fromId = coerceProgressUserId(row.id ?? row._id);
  if (fromId) return fromId;
  return undefined;
}

/** Normalize GET `/progress/:userId` — envelope shapes differ by deploy/version. */
export function unwrapUserProgressDetail(res: { data?: unknown }): ProgressResponse | null {
  const root = res?.data;
  if (root == null || typeof root !== "object") return null;
  const r = root as Record<string, unknown>;
  const inner = r.data;
  if (inner === null) return null;
  if (inner && typeof inner === "object") {
    const p = inner as Record<string, unknown>;
    const nested = p.data ?? p.progress;
    if (nested && typeof nested === "object") return nested as ProgressResponse;
    return inner as ProgressResponse;
  }
  if (
    "roadmaps" in r ||
    "assessments" in r ||
    "overallProgress" in r ||
    "userId" in r ||
    "_id" in r
  ) {
    return r as unknown as ProgressResponse;
  }
  return null;
}
