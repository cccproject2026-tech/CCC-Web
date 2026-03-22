import axiosInstance from "./config/axios-instance";
import type { UserResponse, GetUsersParams } from "./types/users.types";
import type { MentorResponse, GetMentorsParams, GetMenteesParams } from "./types/home.types";
import { apiGetAllUsers } from "./users.service";

// ─── /users shortcuts by role ─────────────────────────────────────────────────

// GET /users?role=mentor&...
export const apiGetMentors = (params?: GetUsersParams) =>
  apiGetAllUsers({ ...params, role: params?.role || 'mentor' });

// GET /users?role=pastor&...
export const apiGetPastors = (params?: GetUsersParams) =>
  apiGetAllUsers({ ...params, role: 'pastor' });

// GET /users?role=field-mentor&...
export const apiGetFieldMentors = (params?: GetUsersParams) =>
  apiGetAllUsers({ ...params, role: 'field-mentor' });

// ─── /home endpoints ──────────────────────────────────────────────────────────

// GET /home/mentors?page=&limit=&search=&country=&state=&conference=
export const apiGetMentorList = (params?: GetMentorsParams) =>
  axiosInstance.get<{ success: boolean; data: { mentors: MentorResponse[]; total?: number } }>(
    "/home/mentors",
    { params },
  );

// GET /home/mentor/:email
export const apiGetMentorByEmail = (email: string) =>
  axiosInstance.get<{ success: boolean; data: MentorResponse }>(`/home/mentor/${email}`);

// GET /home/mentees?page=&limit=&phase=&country=&search=
export const apiGetMenteeList = (params?: GetMenteesParams) =>
  axiosInstance.get<{ success: boolean; data: { mentees: UserResponse[]; total?: number } }>(
    "/home/mentees",
    { params },
  );

// GET /home/mentee/:email
export const apiGetMenteeByEmail = (email: string) =>
  axiosInstance.get<{ success: boolean; data: UserResponse }>(`/home/mentee/${email}`);

// ─── Legacy helpers (kept for backwards compatibility) ────────────────────────
/** @deprecated use apiGetUserById from users.service */
export const getUserById = (id: string) =>
  axiosInstance.get<{ success: boolean; data: UserResponse }>(`/users/${id}`);

/** @deprecated use apiUpdateUserById from users.service */
export const updateUserById = (id: string, payload: any) =>
  axiosInstance.patch<{ success: boolean; data: UserResponse }>(`/users/${id}`, payload);

/** @deprecated use apiGetMenteeList */
export const apiGetMentees = (params?: GetMenteesParams) => apiGetMenteeList(params);
