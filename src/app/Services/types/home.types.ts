// Home / Notification / Media types matching CCC-Backend home module DTOs

// ─── Home ─────────────────────────────────────────────────────────────────────

export interface MentorResponse {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePicture?: string;
  menteeCount?: number;
  assignedId?: string[];
  conference?: string;
  churchDetails?: {
    churchName?: string;
    city?: string;
    state?: string;
    country?: string;
  }[];
}

export interface GetMentorsParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  state?: string;
  conference?: string;
  /** When supported by GET /users, limits results to active accounts. */
  status?: string;
}

export interface GetMenteesParams {
  page?: number;
  limit?: number;
  phase?: string;
  country?: string;
  search?: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export type NotificationModule =
  | 'appointments'
  | 'roadmaps'
  | 'assessments'
  | 'microgrant'
  | 'interests'
  | 'general';


export interface NotificationItem {
  _id: string;
  name: string;
  details: string;
  module: NotificationModule;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationResponse {
  _id: string;
  userId?: string;
  role?: string;
  notifications: NotificationItem[];
}

export interface AddNotificationPayload {
  name: string;
  details: string;
  module: NotificationModule;
  /** target specific user */
  userId?: string;
  /** target all users with this role */
  role?: string;
}

export interface DeviceTokenPayload {
  userId: string;
  token: string;
  type: 'fcm' | 'expo';
}

// ─── Media ────────────────────────────────────────────────────────────────────

export type MediaType = 'video' | 'image';

export interface MediaFile {
  url: string;
  type: MediaType;
  fileName: string;
  fileSize?: number;
  uploadedAt?: string;
}

export interface MediaResponse {
  _id: string;
  heading: string;
  subheading?: string;
  description?: string;
  mediaFiles: MediaFile[];
  createdAt: string;
  updatedAt?: string;
}

export interface CreateMediaPayload {
  heading: string;
  subheading?: string;
  description?: string;
  defaultType?: MediaType;
  files: File[];
}

export interface UpdateMediaPayload {
  heading?: string;
  subheading?: string;
  description?: string;
}

// ─── Legacy alias ─────────────────────────────────────────────────────────────
/** @deprecated use MediaResponse */
export type Media = MediaResponse;
