import api from "./apiClient";

export const getPastorMedia = async () => {
  return api.get("/home/media");
};

export const getUserAppointments = (userId: string) => {
  return api.get(`/appointments/user/${userId}`);
};

export const getSingleUser = (userId: string) => {
  return api.get(`/users/${userId}`);
};

export const getUpcomingAppointments = (userId: string) => {
  return api.get(`/appointments/upcoming`, {
    params: { userId }
  });
};

export const getMentors = () => {
  return api.get("/home/mentors");
};

export const scheduleAppointment = (payload: any) => {
  return api.post("/appointments", payload);
};

export const rescheduleAppointment = (appointmentId: string, data: any) => {
  return api.patch(`/appointments/${appointmentId}/reschedule`, data);
};

export const updateAppointment = (appointmentId: string, data: any) => {
  return api.patch(`/appointments/${appointmentId}`, data);
};

export const cancelAppointment = (appointmentId: string) => {
  return api.patch(`/appointments/${appointmentId}/cancel`);
};

export const getNotifications = (userId: string) => {
  return api.get(`/home/notifications?userId=${userId}`);
};

export const updateUser = (userId: string, payload: any) => {
  return api.patch(`/users/${userId}`, payload);
};

export const updateInterestByEmail = (email: string, payload: any) => {
  return api.patch(`/interests/by-email/${email}`, payload);
};

export const uploadDocument = (userId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  return api.post(`/users/${userId}/documents`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getUserDocuments = (userId: string) => {
  return api.get(`/users/${userId}/documents`);
};
