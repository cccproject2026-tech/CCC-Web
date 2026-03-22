import api from "./apiClient";
import axiosInstance from "./config/axios-instance";
import { MentorPastor } from "./types";
import { apiGetAllUsers } from "./users.service";

export const apiGetMentors = (params?: {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  roleMatch?: 'exact' | 'mixed';
}) => {
  return apiGetAllUsers({
    ...params,
    role: params?.role || 'mentor',
    roleMatch: params?.roleMatch,
  }).then(response => ({
    ...response,
    data: {
      mentors: response.data.data.users,
      total: response.data.data.total,
    }
  }));
};

export const apiGetPastors = (params?: {
  page?: number;
  limit?: number;
  roleMatch?: 'exact' | 'mixed';
}) => {
  return apiGetAllUsers({
    ...params,
    role: 'pastor',
    roleMatch: params?.roleMatch,
  });
};

export const apiGetMentees = (params?: {
  page?: number;
  limit?: number;
  phase?: string;
  country?: string;
}) => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.phase) queryParams.append('phase', params.phase);
  if (params?.country) queryParams.append('country', params.country);

  const queryString = queryParams.toString();
  return axiosInstance.get<{
    success: boolean;
    data: { mentees: MentorPastor[]; total: number };
  }>(`/home/mentees${queryString ? `?${queryString}` : ''}`);
};

export const getUserById = (id: string) => {
  return api.get(`/users/${id}`);
};

export const updateUserById = (id: string, payload: any) => {
  return api.patch(`/users/${id}`, payload);
};

export const apiGetMentorList = () => {
  return axiosInstance.get<{ success: boolean; message?: string; data: { mentors: MentorPastor[] } }>("/home/mentors");
};

export const apiGetMentorByEmail = (email: string) => {
  return axiosInstance.get<{ success: boolean; data: MentorPastor }>(`/home/mentor/${email}`);
};