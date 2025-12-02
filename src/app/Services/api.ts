//api.ts
// Central export file for all API services

// Export all types
export * from './types';

// Export appointment services
export {
  apiGetAppointments,
  apiGetTodaysAppointments,
  apiGetUserAppointments,
  apiGetMentorAppointments,
} from './appointments.service';

// Export interest services
export {
  apiGetAllInterests,
  apiGetInterestById,
  apiGetInterestByEmail,
} from './interests.service';

// Export user services
export {
  apiCreateUser,
  apiGetUserById,
  apiGetAllUsers,
} from './users.service';

// Export mentor/pastor services
export {
  apiGetMentors,
  apiGetPastors,
  apiGetMentees,
} from './mentors.service';

// Export roadmap services
export {
  apiGetRoadmaps,
  apiGetRoadmapById,
  apiUpdateRoadmapData,
  apiUploadRoadmapFile,
  apiAddComment,
  apiGetComments,
  apiAddQuery,
  apiGetQueries,
  apiReplyToQuery,
} from './roadmaps.service';

// Export progress services
export {
  apiGetDirectorOverview,
  apiGetOverallProgress,
  apiGetUserProgress,
  apiAssignRoadmap,
  apiAssignAssessment,
  apiUpdateRoadmapProgress,
  apiUpdateAssessmentProgress,
  apiAddFinalComment,
  apiGetFinalComments,
  apiUpdateFinalComment,
  apiDeleteFinalComment,
} from './progress.service';

// Re-export axios instance for direct usage if needed
export { default as axiosInstance } from './config/axios-instance';
