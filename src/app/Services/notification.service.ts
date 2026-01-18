import api from "./apiClient";

export const getNotification = async (data: string) => {
    return api.get("/home/notifications");
}