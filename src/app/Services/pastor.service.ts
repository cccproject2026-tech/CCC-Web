import api from "./apiClient";

export const getPastorMedia = async () => {
  return api.get("/home/media");  // Base URL auto-attached from env
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

export const scheduleAppointment = (payload) => {
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
