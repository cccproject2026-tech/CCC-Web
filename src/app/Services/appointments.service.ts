import axiosInstance from "./config/axios-instance";
import type {
  AppointmentResponse,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
  CancelAppointmentPayload,
  RescheduleAppointmentPayload,
  AvailabilityPayload,
  CreateRecurringAvailabilityPayload,
  UpdateMentorAvailabilitySettingsPayload,
  PatchMentorAvailabilityDayPayload,
  GetAppointmentsParams,
  TranscriptSummaryResponseDto,
} from "./types/appointments.types";

// GET /appointments/upcoming?userId=&mentorId=&status=&futureOnly=
export const apiGetAppointments = (params?: GetAppointmentsParams) =>
  axiosInstance.get<{ success: boolean; data: AppointmentResponse[] }>(
    "/appointments/upcoming",
    { params, timeout: 30_000 },
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

// GET /appointments/:id — appointment details (works even when not in "schedule" lists)
export const apiGetAppointmentById = (id: string) =>
  axiosInstance.get<{ success: boolean; data: AppointmentResponse }>(
    `/appointments/${id}`,
    { timeout: 30_000 },
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

/** GET `/appointments/availability/:mentorId/month` — prefer `year` + `month` (1–12) per backend. */
export const apiGetMonthlyAvailability = (
  mentorId: string,
  paramsOrDate:
    | { year: number; month: number; participantUserId?: string }
    | string,
  maybeParticipant?: string,
) => {
  const id = encodeURIComponent(mentorId);
  if (typeof paramsOrDate === "string") {
    const d = paramsOrDate.slice(0, 10);
    return axiosInstance.get(`/appointments/availability/${id}/month`, {
      params: { date: d, ...(maybeParticipant ? { participantUserId: maybeParticipant } : {}) },
    });
  }
  return axiosInstance.get(`/appointments/availability/${id}/month`, {
    params: {
      year: paramsOrDate.year,
      month: paramsOrDate.month,
      ...(paramsOrDate.participantUserId
        ? { participantUserId: paramsOrDate.participantUserId }
        : {}),
    },
  });
};

/** GET `/appointments/availability/:mentorId/week?date=` (+ optional participant). */
export const apiGetWeeklyAvailabilityWithParticipant = (
  mentorId: string,
  dateYmd: string,
  participantUserId?: string,
) =>
  axiosInstance.get(`/appointments/availability/${encodeURIComponent(mentorId)}/week`, {
    params: {
      date: dateYmd.slice(0, 10),
      ...(participantUserId ? { participantUserId } : {}),
    },
  });

/** POST `/appointments/availability/recurring` — recurring pattern + horizon (backend materializes concrete days). */
export const apiCreateRecurringAvailability = (payload: CreateRecurringAvailabilityPayload) =>
  axiosInstance.post<{ success: boolean; message?: string }>("/appointments/availability/recurring", payload);

/** PATCH `/appointments/availability/:mentorId/day` — one concrete date override. */
export const apiPatchAvailabilityDay = (mentorId: string, body: PatchMentorAvailabilityDayPayload) =>
  axiosInstance.patch<{ success: boolean; message?: string }>(
    `/appointments/availability/${encodeURIComponent(mentorId)}/day`,
    body,
  );

/** DELETE `/appointments/availability/:mentorId/day/:date` — remove materialized overrides for `YYYY-MM-DD`. */
export const apiDeleteAvailabilityDayOccurrence = (mentorId: string, dateYmd: string) =>
  axiosInstance.delete<{ success: boolean; message?: string }>(
    `/appointments/availability/${encodeURIComponent(mentorId)}/day/${encodeURIComponent(dateYmd.slice(0, 10))}`,
  );

/** POST block whole day unavailable. */
export const apiMarkAvailabilityDayUnavailable = (mentorId: string, dateYmd: string) =>
  axiosInstance.post<{ success: boolean; message?: string }>(
    `/appointments/availability/${encodeURIComponent(mentorId)}/day/unavailable`,
    { date: dateYmd.slice(0, 10) },
  );

/** POST re-open blocked day with explicit slots (UTC calendar date string). */
export const apiMarkAvailabilityDayAvailable = (
  mentorId: string,
  body: PatchMentorAvailabilityDayPayload,
) =>
  axiosInstance.post<{ success: boolean; message?: string }>(
    `/appointments/availability/${encodeURIComponent(mentorId)}/day/available`,
    { ...body, date: body.date.slice(0, 10) },
  );

/** PATCH mentor-level defaults shown when booking / booking rules. */
export const apiPatchMentorAvailabilitySettings = (
  mentorId: string,
  body: UpdateMentorAvailabilitySettingsPayload,
) =>
  axiosInstance.patch<{ success: boolean; message?: string }>(
    `/appointments/availability/${encodeURIComponent(mentorId)}/settings`,
    body,
  );

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
