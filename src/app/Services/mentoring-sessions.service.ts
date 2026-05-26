import axiosInstance from "./config/axios-instance";

export type MentoringSessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "MISSED" | string;

export type MentoringSession = {
  id?: string;
  _id?: string;
  sessionNumber?: number;
  title?: string;
  status?: MentoringSessionStatus;
  scheduledDate?: string;
  appointmentId?: string;
  pastorId?: string;
  mentorId?: string;
  mentorNote?: string;
  pastorNote?: string;
  platform?: string;
  meetingPlatform?: string;
  meetingLink?: string;
  joinUrl?: string;
  appointment?: unknown;
  transcriptSummary?: unknown;
  mentorshipInsights?: unknown;
};

export type MentoringSessionGroup = {
  pastorId?: string;
  pastorName?: string;
  pastorEmail?: string;
  sessions?: MentoringSession[];
};

export type DirectorMentoringJourney = {
  pastor?: unknown;
  mentor?: unknown;
  sessions?: MentoringSession[];
  currentSessionNumber?: number;
  completedCount?: number;
  status?: string;
};

export type MentoringRescheduleRequest = {
  id?: string;
  _id?: string;
  sessionId?: string;
  sessionNumber?: number;
  pastorId?: string;
  mentorId?: string;
  status?: string;
  requestedAt?: string;
};

export type RescheduleMentoringSessionPayload = {
  scheduledDate: string;
  endTime?: string;
  platform?: string;
  meetingLink?: string;
  notes?: string;
};

export type CompleteMentoringSessionPayload = {
  mentorNote?: string;
};

export type CancelMentoringSessionPayload = {
  reason?: string;
};

export type TranscriptSummaryResponse = {
  appointmentId?: string;
  transcript?: string;
  transcriptSavedAt?: string | Date;
  summary?: unknown;
  generatedAt?: string | Date;
  model?: string;
  cached?: boolean;
};

export const apiGetPastorMentoringSessions = (pastorId: string) =>
  axiosInstance.get<MentoringSession[]>(`/mentoring-sessions/pastor/${pastorId}`);

export const apiGetMentorMentoringSessionsGrouped = (mentorId: string) =>
  axiosInstance.get<MentoringSessionGroup[]>(`/mentoring-sessions/mentor/${mentorId}/grouped`);

export const apiGetDirectorMentoringJourneys = () =>
  axiosInstance.get<DirectorMentoringJourney[]>(`/mentoring-sessions/director/journeys`);

export const apiGetMentoringSessionById = (sessionId: string) =>
  axiosInstance.get<MentoringSession>(`/mentoring-sessions/${sessionId}`);

export const apiRequestMentoringSessionReschedule = (sessionId: string) =>
  axiosInstance.post<MentoringRescheduleRequest>(`/mentoring-sessions/${sessionId}/reschedule-request`);

export const apiGetMentorRescheduleRequests = (mentorId: string) =>
  axiosInstance.get<MentoringRescheduleRequest[]>(`/mentoring-sessions/mentor/${mentorId}/reschedule-requests`);

export const apiRescheduleMentoringSession = (
  sessionId: string,
  payload: RescheduleMentoringSessionPayload,
) => axiosInstance.patch<MentoringSession>(`/mentoring-sessions/${sessionId}/reschedule`, payload);

export const apiCompleteMentoringSession = (sessionId: string, payload?: CompleteMentoringSessionPayload) =>
  axiosInstance.patch<MentoringSession>(`/mentoring-sessions/${sessionId}/complete`, payload || {});

export const apiCancelMentoringSession = (sessionId: string, payload?: CancelMentoringSessionPayload) =>
  axiosInstance.patch<MentoringSession>(`/mentoring-sessions/${sessionId}/cancel`, payload || {});

export const apiGetMentoringSessionTranscriptSummary = (appointmentId: string) =>
  axiosInstance.get<TranscriptSummaryResponse>(`/appointments/${appointmentId}/transcript-summary`);
