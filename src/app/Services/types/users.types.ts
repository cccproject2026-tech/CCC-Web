// User types matching CCC-Backend users module DTOs

export type UserRole = 'pastor' | 'mentor' | 'field-mentor' | 'director' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'completed';

export interface UploadedDocument {
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

export interface Note {
  _id: string;
  text: string;
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
}

// ChurchDetails is defined in interests.types.ts and re-exported from types/index.ts
import type { ChurchDetails } from './interests.types';
export type { ChurchDetails };

export interface UserResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  profilePicture?: string;
  assignedId?: string[];
  phoneNumber?: string;
  title?: string;
  conference?: string;
  yearsInMinistry?: string;
  bio?: string;
  interest?: any;
  uploadedDocuments?: UploadedDocument[];
  churchDetails?: ChurchDetails[];
  isEmailVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

export interface UpdateUserPayload {
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  title?: string;
  yearsInMinistry?: string;
  conference?: string;
  bio?: string;
  churchDetails?: ChurchDetails[];
}

export interface AssignUsersPayload {
  assignedId: string[];
}

export interface RemoveUsersPayload {
  assignedId: string[];
}

export interface InviteFieldMentorPayload {
  email: string;
  invitedBy: string;
}

export interface AcceptInvitationPayload {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface GetUsersParams {
  role?: UserRole | string;
  status?: UserStatus | string;
  hasCompleted?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  roleMatch?: 'exact' | 'mixed';
}

export interface GetUsersResponse {
  users: UserResponse[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateNotePayload {
  text: string;
  createdBy: string;
}

export interface UpdateNotePayload {
  text: string;
}

// ─── Legacy / convenience aliases ─────────────────────────────────────────────
/** @deprecated use UserResponse */
export type User = UserResponse;
/** @deprecated use CreateUserPayload */
export type CreateUserDto = CreateUserPayload;
/** Mentor or Pastor user shape — same as UserResponse */
export type MentorPastor = Pick<UserResponse, '_id' | 'firstName' | 'lastName' | 'email' | 'role' | 'profilePicture' | 'assignedId'> & {
  menteeCount?: number;
};
