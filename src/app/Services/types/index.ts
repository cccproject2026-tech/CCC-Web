// Type definitions for API services

export interface Comment {
  _id: string;
  text: string;
  addedDate: string;
  mentorId: { _id: string };
}

export interface Query {
  _id: string;
  actualQueryText: string;
  createdDate: string;
  repliedAnswer?: string;
  repliedDate?: string;
  repliedMentorId?: { _id: string };
  status: 'pending' | 'answered';
}

export interface PersonInfo {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  profilePicture?: string;
  role?: string;
  roleId?: string;
  status?: string;
}

export interface Appointment {
  id: string;
  userId: string;
  mentorId: string;
  user: PersonInfo | null;
  mentor: PersonInfo | null;
  meetingDate: string;
  endTime: string;
  platform: string;
  meetingLink?: string;
  status: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Interest {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  title?: string;
  status: string;
  createdAt: string;
  user?: {
    _id: string;
    role: string;
    roleId?: string;
    isEmailVerified: boolean;
  };
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  profilePicture?: string;
  assignedId?: string[];
}

export interface MentorPastor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePicture?: string;
  menteeCount?: number;
  assignedId?: string[];
}

export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

// ===========================
// PROGRESS TYPES
// ===========================

export interface NestedRoadmapProgressDto {
  nestedRoadmapId: string;
  completedSteps: number;
  totalSteps: number;
  progressPercentage: number;
  status: string;
}

export interface ProgressRoadmapDto {
  roadMapId: string;
  completedSteps: number;
  totalSteps: number;
  progressPercentage: number;
  status: string;
  nestedRoadmaps: NestedRoadmapProgressDto[];
}

export interface ProgressAssessmentDto {
  assessmentId: string;
  completedSections: number;
  totalSections: number;
  progressPercentage: number;
  status: string;
}

export interface FinalCommentDto {
  _id: string;
  commentorId: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressResponseDto {
  _id: string;
  userId: string;
  roadmaps: ProgressRoadmapDto[];
  totalRoadmaps: number;
  completedRoadmaps: number;
  overallRoadmapProgress: number;
  assessments: ProgressAssessmentDto[];
  totalAssessments: number;
  completedAssessments: number;
  overallAssessmentProgress: number;
  totalItems: number;
  completedItems: number;
  overallProgress: number;
  overallCompleted: boolean;
  finalComments: FinalCommentDto[];
}

export interface UserOverallProgressDto {
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

export interface MonthlyCompletionDto {
  month: number;
  year: number;
  monthName: string;
  mentorsCompleted: number;
  pastorsCompleted: number;
}

export interface DirectorOverviewDto {
  totalMentors: number;
  completedMentors: number;
  mentorsOverallProgress: number;
  totalPastors: number;
  completedPastors: number;
  pastorsOverallProgress: number;
  totalUsers: number;
  completedUsers: number;
  overallCombinedProgress: number;
  monthlyData: MonthlyCompletionDto[];
  users?: UserOverallProgressDto[];
}

export interface MicroGrantApplication {
  _id: string;
  userId?: { _id: string; email: string } | null;
  formId?: { _id: string; title: string } | null;
  answers?: {
    [key: string]: string;
  };
  supportingDocs?: string[];  // <-- ONLY THIS
  status: string;
  createdAt: string;
  updatedAt: string;
}

export type MicroGrantResponse = {
  user: {
    _id: string;
    email: string;
    role: string;
  };
  application: {
    _id: string;
    userId: string;
    formId: {
      _id: string;
      title: string;
      description: string;
    };
    answers: Record<string, string>;
    supportingDocs: any[];
    status: string;
    createdAt: string;
    updatedAt: string;
  };
};