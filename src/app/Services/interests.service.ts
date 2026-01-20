import axiosInstance from "./config/axios-instance";
import { Interest } from "./types";
import { buildQueryString } from "./utils/queryBuilder";

export const apiGetAllInterests = (params?: { search?: string; status?: string }) => {
  const queryString = buildQueryString(params);
  return axiosInstance.get<{ success: boolean; data: Interest[] }>(
    `/interests${queryString}`
  );
};

export const apiGetInterestById = (id: string) => {
  return axiosInstance.get<{ success: boolean; data: Interest }>(`/interests/by-id/${id}`);
};

export const apiGetInterestByEmail = (email: string) => {
  return axiosInstance.get<{ success: boolean; data: Interest }>(`/interests/by-email/${email}`);
};

export const apiUpdateInterestStatus = (
  id: string,
  status: "accepted" | "rejected"
) => {
  return axiosInstance.patch(`/interests/request/${id}`, {
    status,
  });
};