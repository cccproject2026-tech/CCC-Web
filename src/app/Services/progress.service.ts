import axiosInstance from "./config/axios-instance";
import type {
  DirectorOverview,
  UserOverallProgress,
  ProgressResponse,
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

// GET /progress/overview/director?period=&year=&includeUsers=
export const apiGetDirectorOverview = (params?: GetDirectorOverviewParams) =>
  axiosInstance.get<{ success: boolean; data: DirectorOverview }>(
    "/progress/overview/director",
    { params },
  );

// GET /progress/overview/all?roles=
export const apiGetOverallProgress = (roles?: string | string[]) => {
  const rolesParam = Array.isArray(roles) ? roles.join(",") : roles;
  return axiosInstance.get<{ success: boolean; data: UserOverallProgress[] }>(
    "/progress/overview/all",
    { params: rolesParam ? { roles: rolesParam } : undefined },
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
export const apiUpdateRoadmapProgress = (payload: UpdateRoadmapProgressPayload) =>
  axiosInstance.patch<{ success: boolean; data: ProgressResponse }>(
    "/progress/roadmap/update",
    payload,
  );

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

/** Normalize GET `/progress/overview/all` — envelope shapes differ by deploy/version. */
export function unwrapOverallProgressList(res: { data?: unknown }): UserOverallProgress[] {
  const body = res?.data as Record<string, unknown> | unknown[] | null | undefined;
  if (body == null) return [];
  if (Array.isArray(body)) return body as UserOverallProgress[];

  const inner = body.data;
  if (Array.isArray(inner)) return inner as UserOverallProgress[];
  if (inner && typeof inner === "object") {
    const o = inner as Record<string, unknown>;
    for (const key of ["users", "items", "records", "data"] as const) {
      const arr = o[key];
      if (Array.isArray(arr)) return arr as UserOverallProgress[];
    }
  }
  for (const key of ["users", "items", "records"] as const) {
    const arr = body[key];
    if (Array.isArray(arr)) return arr as UserOverallProgress[];
  }
  return [];
}

/**
 * Row `userId` may be a string id or a populated `{ _id }` (some API versions).
 */
export function extractUserIdFromOverallProgressRow(
  item: UserOverallProgress | Record<string, unknown>,
): string | undefined {
  const u = (item as Record<string, unknown>).userId as unknown;
  if (typeof u === "string" && u.trim()) return u.trim();
  if (u && typeof u === "object" && "_id" in (u as object)) {
    const id = (u as { _id?: string })._id;
    if (id != null && String(id).trim() !== "") return String(id);
  }
  const id = (item as Record<string, unknown>)._id;
  if (typeof id === "string" && id.trim()) return id.trim();
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
