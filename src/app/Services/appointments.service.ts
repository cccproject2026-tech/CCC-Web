import axiosInstance from "./config/axios-instance";
import { Appointment } from "./types";
import { buildQueryString } from "./utils/queryBuilder";

export const apiGetAppointments = (params?: {
  userId?: string;
  mentorId?: string;
  status?: string;
  futureOnly?: boolean;
}) => {
  const queryString = buildQueryString(params);
  return axiosInstance.get<{ success: boolean; data: Appointment[] }>(
    `/appointments/upcoming${queryString}`
  );
};

export const apiGetWeeklyAvailability = (mentorId: string, date: string) => {
  return axiosInstance.get(
    `/appointments/availability/${mentorId}/week?date=${date}`
  );
};

export const apiGetTodaysAppointments = () => {
  return apiGetAppointments({ futureOnly: true, status: 'scheduled' });
};

export const apiGetUserAppointments = (userId: string, futureOnly = true) => {
  return apiGetAppointments({ userId, futureOnly });
};

export const apiGetMentorAppointments = (mentorId: string, futureOnly = true) => {
  return apiGetAppointments({ mentorId, futureOnly });
};

export const apiCreateAvailability = (data: any) => {
  return axiosInstance.post(`/appointments/availability`, data);
};