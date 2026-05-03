import axiosInstance from "./config/axios-instance";
import type {
  NotificationResponse,
  AddNotificationPayload,
  DeviceTokenPayload,
} from "./types/home.types";

// GET /home/notifications?userId=
// export const getNotification = (userId?: string) =>
//   axiosInstance.get<{ success: boolean; data: NotificationResponse }>(
//     "/home/notifications",
//     { params: userId ? { userId } : undefined },
//   );
// GET /home/notifications?userId= or ?role=
export const getNotification = (
  input?: string | { userId?: string; role?: string }
) => {
  const params =
    typeof input === "string"
      ? { userId: input }
      : input;

  return axiosInstance.get<{ success: boolean; data: NotificationResponse }>(
    "/home/notifications",
    { params },
  );
};
// POST /home/notifications
export const addNotification = (payload: AddNotificationPayload) =>
  axiosInstance.post<{ success: boolean; data: NotificationResponse }>(
    "/home/notifications",
    payload,
  );

// DELETE /home/notifications/user/:userId/:notificationId
export const deleteUserNotification = (userId: string, notificationId: string) =>
  axiosInstance.delete<{ success: boolean; message: string }>(
    `/home/notifications/user/${userId}/${notificationId}`,
  );

// DELETE /home/notifications/role/:role/:notificationId
export const deleteRoleNotification = (role: string, notificationId: string) =>
  axiosInstance.delete<{ success: boolean; message: string }>(
    `/home/notifications/role/${role}/${notificationId}`,
  );

// POST /home/device-token
export const saveDeviceToken = (payload: DeviceTokenPayload) =>
  axiosInstance.post<{ success: boolean; message: string }>("/home/device-token", payload);
