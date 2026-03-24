// api.ts — central export file for all API services and types

// ─── All types (re-exported from module type files via types/index.ts) ────────
export * from './types';

// ─── Auth ─────────────────────────────────────────────────────────────────────
export {
  apiLogin,
  apiSendOtp,
  apiVerifyOtp,
  apiSetPassword,
  apiForgotPassword,
  apiResetPassword,
  apiRefreshToken,
  apiLogout,
} from './auth.service';

// ─── Appointments ─────────────────────────────────────────────────────────────
export {
  apiGetAppointments,
  apiGetTodaysAppointments,
  apiGetUserAppointments,
  apiGetMentorAppointments,
  apiGetUserSchedule,
  apiGetMentorSchedule,
  apiCreateAppointment,
  apiUpdateAppointment,
  apiRescheduleAppointment,
  apiCancelAppointment,
  apiCreateAvailability,
  apiGetAvailability,
  apiGetWeeklyAvailability,
  apiGetMonthlyAvailability,
} from './appointments.service';

// ─── Interests ────────────────────────────────────────────────────────────────
export {
  apiCreateInterest,
  apiGetAllInterests,
  apiGetInterestMetadata,
  apiGetInterestFormFields,
  apiGetDynamicFields,
  apiAddDynamicField,
  apiRemoveDynamicField,
  apiReplaceDynamicFields,
  apiReorderDynamicFields,
  apiUpdateDynamicField,
  apiGetInterestsByStatus,
  apiUpdateInterestStatus,
  apiGetInterestById,
  apiGetInterestByEmail,
  apiUpdateInterestByEmail,
  apiUpdateInterestById,
} from './interests.service';

// ─── Users ────────────────────────────────────────────────────────────────────
export {
  apiCreateUser,
  apiGetAllUsers,
  apiCheckUserStatus,
  apiGetUserById,
  apiUpdateUserById,
  apiDeleteUser,
  apiMarkUserCompleted,
  apiIssueCertificate,
  apiAssignUsers,
  apiRemoveAssignedUsers,
  apiGetAssignedUsers,
  apiUploadProfilePicture,
  apiUploadDocument,
  apiGetDocuments,
  apiDeleteDocument,
  apiGetNotes,
  apiAddNote,
  apiUpdateNote,
  apiDeleteNote,
  apiInviteFieldMentor,
  apiAcceptInvitation,
} from './users.service';

// ─── Mentors / Home ───────────────────────────────────────────────────────────
export {
  apiGetMentors,
  apiGetPastors,
  apiGetFieldMentors,
  apiGetMentorList,
  apiGetMentorByEmail,
  apiGetMenteeList,
  apiGetMenteeByEmail,
} from './mentors.service';

// ─── Roadmaps ─────────────────────────────────────────────────────────────────
export {
  apiGetRoadmaps,
  apiGetRoadmapsByUser,
  apiGetRoadmapById,
  apiCreateRoadmap,
  apiUpdateRoadmap,
  apiDeleteRoadmap,
  apiGetNestedRoadmapItem,
  apiAddNestedRoadmapItem,
  apiUpdateNestedRoadmapItem,
  apiAddComment,
  apiGetComments,
  apiAddQuery,
  apiGetQueries,
  apiReplyToQuery,
  apiGetExtras,
  apiSaveExtras,
  apiUpdateExtras,
  apiDeleteExtras,
  apiUploadExtrasDocuments,
  apiGetExtrasDocuments,
  apiDeleteExtrasDocumentBatch,
  apiDeleteExtrasDocumentFile,
  // Legacy aliases
  apiUpdateRoadmapData,
  apiGetUserRoadmaps,
  apiUploadRoadmapFile,
} from './roadmaps.service';

// ─── Progress ─────────────────────────────────────────────────────────────────
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

// ─── Assessments ─────────────────────────────────────────────────────────────
export {
  apiCreateAssessment,
  apiGetAssessments,
  apiGetAssessmentById,
  apiDeleteAssessments,
  apiUpdateInstructions,
  apiUpdateSections,
  apiUploadAssessmentBanner,
  apiSubmitSectionAnswers,
  apiSubmitPreSurvey,
  apiSendSectionRecommendations,
  apiGetSectionRecommendations,
} from './assessment.service';

// ─── Media ────────────────────────────────────────────────────────────────────
export {
  getAllMedia,
  getMediaByType,
  getMediaById,
  createMedia,
  updateMedia,
  deleteMedia,
  deleteMultipleMedia,
} from './media.service';

// ─── MicroGrant ───────────────────────────────────────────────────────────────
export {
  getMicroGrantForm,
  createOrUpdateMicroGrantForm,
  getAllMicroGrand,
  getMicroGrantByUserId,
  applyMicroGrant,
  updateMicroGrantStatus,
} from './microGrand.service';

// ─── Notifications ────────────────────────────────────────────────────────────
export {
  getNotification,
  addNotification,
  deleteUserNotification,
  deleteRoleNotification,
  saveDeviceToken,
} from './notification.service';

// ─── Axios instance (direct usage if needed) ─────────────────────────────────
export { default as axiosInstance } from './config/axios-instance';
