// Progress types matching CCC-Backend progress module DTOs

export interface NestedRoadmapProgress {
  nestedRoadmapId: string;
  completedSteps: number;
  totalSteps: number;
  progressPercentage: number;
  status: string;
}

export interface ProgressRoadmap {
  roadMapId: string;
  completedSteps: number;
  totalSteps: number;
  progressPercentage: number;
  status: string;
  nestedRoadmaps: NestedRoadmapProgress[];
}

export interface ProgressAssessment {
  assessmentId: string;
  completedSections: number;
  totalSections: number;
  progressPercentage: number;
  status: string;
}

export interface FinalComment {
  _id: string;
  commentorId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressResponse {
  _id: string;
  userId: string;
  roadmaps: ProgressRoadmap[];
  totalRoadmaps: number;
  completedRoadmaps: number;
  overallRoadmapProgress: number;
  assessments: ProgressAssessment[];
  totalAssessments: number;
  completedAssessments: number;
  overallAssessmentProgress: number;
  totalItems: number;
  completedItems: number;
  overallProgress: number;
  overallCompleted: boolean;
  finalComments: FinalComment[];
}

export interface UserOverallProgress {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePicture?: string;
  totalRoadmaps: number;
  completedRoadmaps: number;
  overallRoadmapProgress: number;
  totalAssessments: number;
  completedAssessments: number;
  overallAssessmentProgress: number;
  totalItems: number;
  completedItems: number;
  overallProgress: number;
  overallCompleted: boolean;
}

export interface MonthlyCompletion {
  month: number;
  year: number;
  monthName: string;
  mentorsCompleted: number;
  pastorsCompleted: number;
}

export interface DirectorOverview {
  totalMentors: number;
  completedMentors: number;
  mentorsOverallProgress: number;
  totalPastors: number;
  completedPastors: number;
  pastorsOverallProgress: number;
  totalUsers: number;
  completedUsers: number;
  overallCombinedProgress: number;
  monthlyData: MonthlyCompletion[];
  users?: UserOverallProgress[];
}

// Payloads
export interface AssignRoadmapPayload {
  userIds: string[];
  roadMapIds: string[];
}

export interface AssignAssessmentPayload {
  userIds: string[];
  assessmentIds: string[];
}

export interface UpdateRoadmapProgressPayload {
  userId: string;
  roadMapId: string;
  nestedRoadmapId?: string;
  completedSteps?: number;
  status?: string;
}

export interface UpdateAssessmentProgressPayload {
  userId: string;
  assessmentId: string;
  completedSections?: number;
  status?: string;
}

export interface AddFinalCommentPayload {
  userId: string;
  commentorId: string;
  comment: string;
}

export interface UpdateFinalCommentPayload {
  userId: string;
  commentId: string;
  comment: string;
}

export interface DeleteFinalCommentPayload {
  userId: string;
  commentId: string;
}

export interface GetDirectorOverviewParams {
  period?: 'yearly' | 'monthly' | 'weekly';
  year?: number;
  includeUsers?: boolean;
}

// ─── Legacy aliases (Dto suffix) ─────────────────────────────────────────────
export type DirectorOverviewDto = DirectorOverview;
export type UserOverallProgressDto = UserOverallProgress;
export type ProgressResponseDto = ProgressResponse;
export type NestedRoadmapProgressDto = NestedRoadmapProgress;
export type ProgressRoadmapDto = ProgressRoadmap;
export type ProgressAssessmentDto = ProgressAssessment;
export type FinalCommentDto = FinalComment;
export type MonthlyCompletionDto = MonthlyCompletion;
