//api.ts
// Central export file for all API services

// Export all types
export * from './types';

// Export auth services
export {
  apiLogin,
  apiSetPassword,
} from './auth.service';

// Export appointment services
export {
  apiGetAppointments,
  apiGetTodaysAppointments,
  apiGetUserAppointments,
  apiGetMentorAppointments,
  apiCreateAppointment,
} from './appointments.service';

// Export interest services
export {
  apiCreateInterest,
  apiGetAllInterests,
  apiGetInterestById,
  apiGetInterestByEmail,
} from './interests.service';

// Export user services
export {
  apiCreateUser,
  apiGetUserById,
  apiGetAllUsers,
  apiUploadProfilePicture,
  apiUploadDocument,
  apiGetAssignedUsers,
} from './users.service';

// Export mentor/pastor services
export {
  apiGetMentors,
  apiGetPastors,
  apiGetMentees,
  apiGetMentorList,
  apiGetMentorByEmail,
} from './mentors.service';

// Export roadmap services
export {
  apiGetRoadmaps,
  apiGetRoadmapsByUser,
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
