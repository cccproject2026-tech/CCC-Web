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
  apiCheckOnboardingStatus,
  apiGetGoogleCalendarAuthUrl,
  unwrapGoogleOAuthRedirectUrl,
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
  apiMarkAppointmentMissed,
  apiCreateAvailability,
  apiGetAvailability,
  apiGetWeeklyAvailability,
  apiGetMonthlyAvailability,
  apiGetWeeklyAvailabilityWithParticipant,
  apiCreateRecurringAvailability,
  apiPatchAvailabilityDay,
  apiDeleteAvailabilityDayOccurrence,
  apiMarkAvailabilityDayUnavailable,
  apiMarkAvailabilityDayAvailable,
  apiPatchMentorAvailabilitySettings,
  apiDeleteAvailabilitySlot,
  apiFetchExternalCalendarBusy,
  apiGetMergedAvailabilityRange,
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
  apiGetNoteById,
  apiAddNote,
  apiUpdateNote,
  apiPutNote,
  apiDeleteNote,
  apiInviteFieldMentor,
  apiAcceptInvitation,
  apiRejectInvitation,
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
  apiUpdatePastorQuery,
  apiDeletePastorQuery,
  apiDeleteQueryReply,
  apiGetExtras,
  apiTriggerJumpstartComplete,
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
export type { RoadmapQueriesScope } from './roadmaps.service';

// ─── Progress ─────────────────────────────────────────────────────────────────
export {
  apiGetDirectorOverview,
  apiGetOverallProgress,
  unwrapDirectorOverview,
  aggregateDirectorOverviewFromUsers,
  mergeDirectorOverviewWithUserAggregate,
  buildMonthlyCompletionsFromUserProgressRows,
  extractUserIdFromOverallProgressRow,
  unwrapOverallProgressList,
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
  apiAssignAssessmentViaModule,
  apiGetUserAnswers,
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
