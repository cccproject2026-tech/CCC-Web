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

// GET /progress/:userId
export const apiGetUserProgress = (userId: string) =>
  axiosInstance.get<{ success: boolean; data: ProgressResponse | null }>(
    `/progress/${userId}`,
  );

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
