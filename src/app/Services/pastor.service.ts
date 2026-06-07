import axiosInstance from "./config/axios-instance";
import { getNotification } from "./notification.service";

export const getPastorMedia = async () => {
  return axiosInstance.get("/home/media");
};

export const getUserAppointments = (userId: string) => {
  return axiosInstance.get(`/appointments/user/${userId}`);
};



export const getSingleUser = (userId: string) => {
  return axiosInstance.get(`/users/${userId}`, {
    params: { t: Date.now() },
  });
};
export const getUpcomingAppointments = (userId: string) => {
  return axiosInstance.get(`/appointments/upcoming`, {
    params: { userId }
  });
};

export const getMentors = () => {
  return axiosInstance.get("/home/mentors");
};

export const scheduleAppointment = (payload: any) => {
  return axiosInstance.post("/appointments", payload);
};

export const rescheduleAppointment = (appointmentId: string, data: any) => {
  return axiosInstance.patch(`/appointments/${appointmentId}/reschedule`, data);
};

export const updateAppointment = (appointmentId: string, data: any) => {
  return axiosInstance.patch(`/appointments/${appointmentId}`, data);
};

export const cancelAppointment = (appointmentId: string) => {
  return axiosInstance.patch(`/appointments/${appointmentId}/cancel`);
};

/** Same as director — uses axios `/api-proxy` in the browser (avoids CORS / wrong base URL). */
export const getNotifications = (userId: string) => getNotification(userId);

export const updateUser = (userId: string, payload: any) => {
  return axiosInstance.patch(`/users/${userId}`, payload);
};

export const updateInterestByEmail = (email: string, payload: any) => {
  return axiosInstance.patch(`/interests/by-email/${email}`, payload);
};

export const uploadDocument = (userId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return axiosInstance.post(`/users/${userId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getUserDocuments = (userId: string) => {
  return axiosInstance.get(`/users/${userId}/documents`);
};
