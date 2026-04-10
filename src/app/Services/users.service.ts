import axiosInstance from "./config/axios-instance";
import type {
  UserResponse,
  CreateUserPayload,
  UpdateUserPayload,
  AssignUsersPayload,
  RemoveUsersPayload,
  InviteFieldMentorPayload,
  AcceptInvitationPayload,
  GetUsersParams,
  GetUsersResponse,
  CreateNotePayload,
  UpdateNotePayload,
  Note,
  UploadedDocument,
} from "./types/users.types";

// POST /users
export const apiCreateUser = (payload: CreateUserPayload) =>
  axiosInstance.post<{ success: boolean; data: UserResponse }>("/users", payload);

/** Default axios timeout is 10s; user lists are often slower (large DB / cold API). */
const GET_USERS_TIMEOUT_MS = 60_000;

// GET /users?role=&status=&page=&limit=&search=&roleMatch=
export const apiGetAllUsers = (params?: GetUsersParams) =>
  axiosInstance.get<{ success: boolean; data: GetUsersResponse }>("/users", {
    params,
    timeout: GET_USERS_TIMEOUT_MS,
  });

// GET /users/check-status/:id
export const apiCheckUserStatus = (id: string) =>
  axiosInstance.get<{ success: boolean; data: { status: string } }>(`/users/check-status/${id}`);

// GET /users/:id
export const apiGetUserById = (userId: string) =>
  axiosInstance.get<{ success: boolean; data: UserResponse }>(`/users/${userId}`);

// PATCH /users/:id
export const apiUpdateUserById = (userId: string, payload: UpdateUserPayload) =>
  axiosInstance.patch<{ success: boolean; data: UserResponse; message?: string }>(
    `/users/${userId}`,
    payload,
  );

// DELETE /users/:id
export const apiDeleteUser = (userId: string) =>
  axiosInstance.delete<{ success: boolean; message: string }>(`/users/${userId}`);

// PATCH /users/:userId/mark-completed
export const apiMarkUserCompleted = (userId: string) =>
  axiosInstance.patch<{ success: boolean; data: UserResponse }>(`/users/${userId}/mark-completed`);

// POST /users/:id/issue-certificate
export const apiIssueCertificate = (userId: string) =>
  axiosInstance.post<{ success: boolean; message: string }>(`/users/${userId}/issue-certificate`);

// ─── Assign / Remove ──────────────────────────────────────────────────────────

// POST /users/:userId/assign  body: { assignedId: string[] }
export const apiAssignUsers = (userId: string, assignedIds: string[]) =>
  axiosInstance.post<{ success: boolean; message: string; data: UserResponse }>(
    `/users/${userId}/assign`,
    { assignedId: assignedIds } as AssignUsersPayload,
  );

// PATCH /users/:userId/remove  body: { assignedId: string[] }
export const apiRemoveAssignedUsers = (userId: string, assignedIds: string[]) =>
  axiosInstance.patch<{ success: boolean; message: string; data: UserResponse }>(
    `/users/${userId}/remove`,
    { assignedId: assignedIds } as RemoveUsersPayload,
  );

// GET /users/:userId/assigned
export const apiGetAssignedUsers = (userId: string) =>
  axiosInstance.get<{ success: boolean; data: UserResponse[] }>(`/users/${userId}/assigned`);

// ─── Profile Picture & Documents ─────────────────────────────────────────────

// PATCH /users/:id/profile-picture  (multipart/form-data, field: image)
export const apiUploadProfilePicture = (userId: string, formData: FormData) =>
  axiosInstance.patch<{ success: boolean; data?: { profilePicture: string }; message?: string }>(
    `/users/${userId}/profile-picture`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

// POST /users/:id/documents  (multipart/form-data)
export const apiUploadDocument = (userId: string, formData: FormData) =>
  axiosInstance.post<{ success: boolean; message?: string }>(
    `/users/${userId}/documents`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

// GET /users/:id/documents
export const apiGetDocuments = (userId: string) =>
  axiosInstance.get<{ success: boolean; data: UploadedDocument[] }>(`/users/${userId}/documents`);

// DELETE /users/:id/documents?fileUrl=
export const apiDeleteDocument = (userId: string, fileUrl: string) =>
  axiosInstance.delete<{ success: boolean; message: string }>(
    `/users/${userId}/documents`,
    { params: { fileUrl } },
  );

// ─── Notes ────────────────────────────────────────────────────────────────────

// GET /users/:id/notes
export const apiGetNotes = (userId: string) =>
  axiosInstance.get<{ success: boolean; data: Note[] }>(`/users/${userId}/notes`);

// GET /users/:id/notes/:noteId
export const apiGetNoteById = (userId: string, noteId: string) =>
  axiosInstance.get<{ success: boolean; data: Note }>(`/users/${userId}/notes/${noteId}`);

// POST /users/:id/notes
export const apiAddNote = (userId: string, payload: CreateNotePayload) =>
  axiosInstance.post<{ success: boolean; data: Note }>(`/users/${userId}/notes`, payload);

// PATCH /users/:id/notes/:noteId
export const apiUpdateNote = (userId: string, noteId: string, payload: UpdateNotePayload) =>
  axiosInstance.patch<{ success: boolean; data: Note }>(
    `/users/${userId}/notes/${noteId}`,
    payload,
  );

// PUT /users/:id/notes/:noteId (some backends use PUT instead of PATCH)
export const apiPutNote = (userId: string, noteId: string, payload: UpdateNotePayload) =>
  axiosInstance.put<{ success: boolean; data: Note }>(
    `/users/${userId}/notes/${noteId}`,
    payload,
  );

// DELETE /users/:id/notes/:noteId
export const apiDeleteNote = (userId: string, noteId: string) =>
  axiosInstance.delete<{ success: boolean; message: string }>(`/users/${userId}/notes/${noteId}`);

// ─── Invitations ─────────────────────────────────────────────────────────────

// POST /users/invite-field-mentor
export const apiInviteFieldMentor = (payload: InviteFieldMentorPayload) =>
  axiosInstance.post<{ success: boolean; message: string }>("/users/invite-field-mentor", payload);

// POST /users/accept-invitation
export const apiAcceptInvitation = (payload: AcceptInvitationPayload) =>
  axiosInstance.post<{ success: boolean; message: string }>("/users/accept-invitation", payload);

/** Normalize GET `/users/:id` — envelope shapes differ by deploy/version. */
export function unwrapUserResponse(res: { data?: unknown }): UserResponse | null {
  const root = res?.data;
  if (root == null || typeof root !== "object") return null;
  const r = root as Record<string, unknown>;
  const inner = r.data;
  if (inner && typeof inner === "object") return inner as UserResponse;
  if (r._id != null || typeof r.email === "string") return r as unknown as UserResponse;
  return null;
}
