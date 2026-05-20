import axiosInstance from "./config/axios-instance";
export const apiGetPastorMentoringSessions = (pastorId: string) =>
  axiosInstance.get(`/mentoring-sessions/pastor/${pastorId}`);

export const apiGetMentorMentoringSessionsGrouped = (mentorId: string) =>
  axiosInstance.get(`/mentoring-sessions/mentor/${mentorId}/grouped`);

export const apiGetDirectorMentoringJourneys = () =>
  axiosInstance.get(`/mentoring-sessions/director/journeys`);

export const apiGetMentoringSessionById = (sessionId: string) =>
  axiosInstance.get(`/mentoring-sessions/${sessionId}`);

export const apiRequestMentoringSessionReschedule = (sessionId: string) =>
  axiosInstance.post(`/mentoring-sessions/${sessionId}/reschedule-request`);

export const apiGetMentorRescheduleRequests = (mentorId: string) =>
  axiosInstance.get(`/mentoring-sessions/mentor/${mentorId}/reschedule-requests`);

export const apiRescheduleMentoringSession = (
  sessionId: string,
  payload: {
    scheduledDate: string;
    endTime?: string;
    platform?: string;
    meetingLink?: string;
    notes?: string;
  },
) => axiosInstance.patch(`/mentoring-sessions/${sessionId}/reschedule`, payload);

export const apiCompleteMentoringSession = (sessionId: string, payload?: { mentorNote?: string }) =>
  axiosInstance.patch(`/mentoring-sessions/${sessionId}/complete`, payload || {});

export const apiCancelMentoringSession = (sessionId: string, payload?: { reason?: string }) =>
  axiosInstance.patch(`/mentoring-sessions/${sessionId}/cancel`, payload || {});