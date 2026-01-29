import axiosInstance from "./config/axios-instance";
import {
  DirectorOverviewDto,
  UserOverallProgressDto,
  ProgressResponseDto,
} from "./types";
import { buildQueryString } from "./utils/queryBuilder";

// ===========================
// PROGRESS APIs
// ===========================

/**
 * Get director overview with stats and monthly completion data
 * @param period - 'yearly' | 'monthly' | 'weekly' (default: 'yearly')
 * @param year - Year number (default: current year)
 * @param includeUsers - Include user details in response (default: false)
 */
export const apiGetDirectorOverview = (params?: {
  period?: string;
  year?: number;
  includeUsers?: boolean;
}) => {
  const queryString = buildQueryString(params);
  return axiosInstance.get<{ success: boolean; data: DirectorOverviewDto }>(
    `/progress/overview/director${queryString}`
  );
};

/**
 * Get overall progress for users by roles
 * @param roles - Array of role strings or comma-separated string (default: all roles)
 */
export const apiGetOverallProgress = (roles?: string | string[]) => {
  const roleString = Array.isArray(roles) ? roles.join(",") : roles;
  const queryString = buildQueryString(roleString ? { roles: roleString } : undefined);
  return axiosInstance.get<{
    success: boolean;
    data: UserOverallProgressDto[];
  }>(`/progress/overview/all${queryString}`);
};

/**
 * Get progress for a specific user
 * @param userId - User ID
 */
export const apiGetUserProgress = (userId: string) => {
  return axiosInstance.get<{
    success: boolean;
    data: ProgressResponseDto | null;
  }>(`/progress/${userId}`);
};

/**
 * Assign roadmap(s) to user(s)
 */
export const apiAssignRoadmap = (data: {
  userIds: string[];
  roadMapIds: string[];
}) => {
  return axiosInstance.post<{
    success: boolean;
    data: ProgressResponseDto[];
  }>(`/progress/assign-roadmap`, data);
};

/**
 * Assign assessment to user
 */
export const apiAssignAssessment = (data: {
  userIds: string[];
  assessmentIds: string[];
}) => {
  return axiosInstance.post<{ success: boolean; data: ProgressResponseDto }>(
    `/progress/assign-assessment`,
    data
  );
};

/**
 * Update roadmap progress
 */
export const apiUpdateRoadmapProgress = (data: {
  userId: string;
  roadMapId: string;
  nestedRoadmapId?: string;
  completedSteps?: number;
  status?: string;
}) => {
  return axiosInstance.patch<{ success: boolean; data: ProgressResponseDto }>(
    `/progress/roadmap/update`,
    data
  );
};

/**
 * Update assessment progress
 */
export const apiUpdateAssessmentProgress = (data: {
  userId: string;
  assessmentId: string;
  completedSections?: number;
  status?: string;
}) => {
  return axiosInstance.patch<{ success: boolean; data: ProgressResponseDto }>(
    `/progress/assessment/update`,
    data
  );
};

/**
 * Add final comment
 */
export const apiAddFinalComment = (data: {
  userId: string;
  commentorId: string;
  comment: string;
}) => {
  return axiosInstance.post<{ success: boolean; data: ProgressResponseDto }>(
    `/progress/final-comments`,
    data
  );
};

/**
 * Get final comments for a user
 */
export const apiGetFinalComments = (userId: string) => {
  return axiosInstance.get<{
    success: boolean;
    data: ProgressResponseDto["finalComments"];
  }>(`/progress/${userId}/final-comments`);
};

/**
 * Update final comment
 */
export const apiUpdateFinalComment = (data: {
  userId: string;
  commentId: string;
  comment: string;
}) => {
  return axiosInstance.patch<{ success: boolean; data: ProgressResponseDto }>(
    `/progress/final-comments`,
    data
  );
};

/**
 * Delete final comment
 */
export const apiDeleteFinalComment = (data: {
  userId: string;
  commentId: string;
}) => {
  return axiosInstance.delete<{ success: boolean; data: ProgressResponseDto }>(
    `/progress/final-comments`,
    { data }
  );
};
