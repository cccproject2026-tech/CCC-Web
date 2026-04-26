import axiosInstance from "./config/axios-instance";
import type {
  AppointmentResponse,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
  CancelAppointmentPayload,
  RescheduleAppointmentPayload,
  AvailabilityPayload,
  GetAppointmentsParams,
  TranscriptSummaryResponseDto,
} from "./types/appointments.types";

// GET /appointments/upcoming?userId=&mentorId=&status=&futureOnly=
export const apiGetAppointments = (params?: GetAppointmentsParams) =>
  axiosInstance.get<{ success: boolean; data: AppointmentResponse[] }>(
    "/appointments/upcoming",
    { params },
  );

// Convenience: today's upcoming scheduled appointments
export const apiGetTodaysAppointments = (userId?: string) =>
  apiGetAppointments({ futureOnly: true, status: 'scheduled', ...(userId ? { userId } : {}) });

// Convenience: all upcoming for a user
export const apiGetUserAppointments = (userId: string, futureOnly = true) =>
  apiGetAppointments({ userId, futureOnly });

// Convenience: all upcoming for a mentor
export const apiGetMentorAppointments = (mentorId: string, futureOnly = true) =>
  apiGetAppointments({ mentorId, futureOnly });

// GET /appointments/user/:userId  — user's full schedule
export const apiGetUserSchedule = (userId: string) =>
  axiosInstance.get<{ success: boolean; data: AppointmentResponse[] }>(
    `/appointments/user/${userId}`,
  );

// GET /appointments/mentor/:userId  — mentor's full schedule
export const apiGetMentorSchedule = (mentorId: string) =>
  axiosInstance.get<{ success: boolean; data: AppointmentResponse[] }>(
    `/appointments/mentor/${mentorId}`,
  );

// POST /appointments
export const apiCreateAppointment = (payload: CreateAppointmentPayload) =>
  axiosInstance.post<{ success: boolean; message?: string; data: AppointmentResponse }>(
    "/appointments",
    payload,
  );

// PATCH /appointments/:id
export const apiUpdateAppointment = (id: string, payload: UpdateAppointmentPayload) =>
  axiosInstance.patch<{ success: boolean; data: AppointmentResponse }>(
    `/appointments/${id}`,
    payload,
  );

// PATCH /appointments/:id/reschedule
export const apiRescheduleAppointment = (id: string, payload: RescheduleAppointmentPayload) =>
  axiosInstance.patch<{ success: boolean; data: AppointmentResponse }>(
    `/appointments/${id}/reschedule`,
    payload,
  );

// PATCH /appointments/:id/cancel
export const apiCancelAppointment = (id: string, payload?: CancelAppointmentPayload) =>
  axiosInstance.patch<{ success: boolean; data: AppointmentResponse }>(
    `/appointments/${id}/cancel`,
    payload,
  );

// ─── Availability ─────────────────────────────────────────────────────────────

// POST /appointments/availability
export const apiCreateAvailability = (payload: AvailabilityPayload) =>
  axiosInstance.post("/appointments/availability", payload);

// GET /appointments/availability/:mentorId
export const apiGetAvailability = (mentorId: string) =>
  axiosInstance.get(`/appointments/availability/${mentorId}`);

// GET /appointments/availability/:mentorId/week?date=
export const apiGetWeeklyAvailability = (mentorId: string, date: string) =>
  axiosInstance.get(`/appointments/availability/${mentorId}/week`, { params: { date } });

// GET /appointments/availability/:mentorId/month?date=
export const apiGetMonthlyAvailability = (mentorId: string, date: string) =>
  axiosInstance.get(`/appointments/availability/${mentorId}/month`, { params: { date } });

type DeleteAvailabilitySlotPayload = {
  slotId: string;
  date: string;
};

// DELETE /appointments/availability/:mentorId/slot
export const apiDeleteAvailabilitySlot = (
  mentorId: string,
  payload: DeleteAvailabilitySlotPayload,
) =>
  axiosInstance.delete(`/appointments/availability/${mentorId}/slot`, {
    data: payload,
  });

// ─── Transcript Summary ─────────────────────────────────────────────────────────

// GET /appointments/pastor/:appointmentId/transcript-summary
export const apiGetTranscriptSummary = (appointmentId: string) =>
  axiosInstance.get<{ success: boolean; message: string; data: TranscriptSummaryResponseDto }>(
    `/appointments/pastor/${appointmentId}/transcript-summary`
  );

// POST /appointments/pastor/:appointmentId/transcript-summary (generate/refresh)
export const apiGenerateTranscriptSummary = (appointmentId: string, refresh: boolean = false) =>
  axiosInstance.post<{ success: boolean; message: string; data: TranscriptSummaryResponseDto }>(
    `/appointments/pastor/${appointmentId}/transcript-summary`,
    null,
    { params: { refresh: refresh ? 'true' : 'false' } }
  );
