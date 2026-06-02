// User types matching CCC-Backend users module DTOs

export type UserRole = 'pastor' | 'mentor' | 'field-mentor' | 'director' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'pending' | 'completed';
export type GoogleCalendarStatus = 'connected' | 'disconnected' | 'expired' | 'error';

export interface GoogleCalendarConnectionStatus {
  connected: boolean;
  status: GoogleCalendarStatus;
  email: string | null;
  connectedAt: string | null;
  lastSyncAt: string | null;
  lastError: string | null;
}

export interface UploadedDocument {
  fileName: string;
  fileUrl: string;
  fileType: string;
  uploadedAt: string;
}

export interface FieldMentorInvitation {
  _id?: string;
  invitedBy?: string | { _id?: string };
  invitedAt?: string;
  token?: string;
  expiresAt?: string;
}

export interface Note {
  _id: string;
  /** Primary body — some API versions use `content` instead */
  text?: string;
  content?: string;
  createdBy?: string;
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
  /** Set when the pastor is marked complete (mentor/director) or program completed. */
  hasCompleted?: boolean;
  hasIssuedCertificate?: boolean;
  completedAt?: string;
  certificates?: Array<Record<string, unknown>>;
  profilePicture?: string;
  assignedId?: string[];
  phoneNumber?: string;
  title?: string;
  conference?: string;
  yearsInMinistry?: string;
  bio?: string;
  interest?: any;
  uploadedDocuments?: UploadedDocument[];
  fieldMentorInvitation?: FieldMentorInvitation;
  churchDetails?: ChurchDetails[];
  isEmailVerified?: boolean;
  googleCalendarStatus?: GoogleCalendarStatus;
  googleCalendarConnectedAt?: string;
  googleCalendarLastSyncAt?: string;
  googleCalendarEmail?: string;
  googleCalendarLastError?: string;
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
}

export interface GetUsersParams {
  role?: UserRole | string;
  status?: UserStatus | string;
  hasCompleted?: boolean;
  page?: number;
  limit?: number;
  search?: string;
  roleMatch?: 'exact' | 'mixed';
  /** Cache buster (mobile sends `t` on mentor list) */
  t?: number;
}

export interface GetUsersResponse {
  users: UserResponse[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateNotePayload {
  text: string;
  /** Optional — some backends take author from JWT only */
  createdBy?: string;
}

export interface UpdateNotePayload {
  text?: string;
  content?: string;
}

// ─── Legacy / convenience aliases ─────────────────────────────────────────────
/** @deprecated use UserResponse */
export type User = UserResponse;
/** @deprecated use CreateUserPayload */
export type CreateUserDto = CreateUserPayload;
/** Mentor or Pastor user shape — same as UserResponse */
export type MentorPastor = Pick<
  UserResponse,
  "_id" | "firstName" | "lastName" | "email" | "role" | "profilePicture" | "assignedId" | "phoneNumber"
> & {
  menteeCount?: number;
  id?: string;
};
