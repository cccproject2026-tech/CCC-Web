import axiosInstance from "./config/axios-instance";
import { User, CreateUserDto, InviteFieldMentorPayload } from "./types";
import { buildQueryString } from "./utils/queryBuilder";

export const apiCreateUser = (data: CreateUserDto) => {
  return axiosInstance.post<{ success: boolean; data: User }>(`/users`, data);
};

export const apiGetUserById = (userId: string) => {
  return axiosInstance.get<{ success: boolean; data: User }>(`/users/${userId}`);
};

export const apiGetAllUsers = (params?: {
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  roleMatch?: 'exact' | 'mixed';
}) => {
  const queryString = buildQueryString(params);
  return axiosInstance.get<{
    success: boolean;
    data: {
      users: User[];
      total: number;
      page: number;
      totalPages: number;
    };
  }>(`/users${queryString}`);
};

export const apiGetAssignedUsers = (userId: string) => {
  return axiosInstance.get<{ success: boolean; data: any[] }>(`/users/${userId}/assigned`);
};

export const apiAssignUsers = (userId: string, assignedIds: string[]) => {
  return axiosInstance.post<{ success: boolean; message: string; data: any }>(
    `/users/${userId}/assign`,
    { assignedId: assignedIds }
  );
};

export const apiCreateDirector = (payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}) => {
  return axiosInstance.post("/super-admin/directors", payload);
};

export const apiInviteFieldMentor = (
  payload: InviteFieldMentorPayload
) => {
  return axiosInstance.post("/users/invite-field-mentor", payload);
};