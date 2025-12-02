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
