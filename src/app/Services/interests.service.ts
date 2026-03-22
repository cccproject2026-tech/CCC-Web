import axiosInstance from "./config/axios-instance";
import { Interest } from "./types";
import { buildQueryString } from "./utils/queryBuilder";

export const apiCreateInterest = (payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  comments?: string;
  interests?: string[];
}) => {
  return axiosInstance.post<{ success: boolean; message?: string; data?: any }>(
    "/interests",
    payload
  );
};

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

export const apiUpdateInterestById = (
  id: string,
  payload: {
    churchDetails: {
      churchName: string;
      churchPhone: string;
      churchWebsite: string;
      churchAddress: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    }[];
  }
) => {
  return axiosInstance.patch<{ success: boolean; data: Interest }>(
    `/interests/${id}`,
    payload
  );
};