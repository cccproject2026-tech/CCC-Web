import axiosInstance from "./config/axios-instance";
import type {
  CreateRoadMapPayload,
  UpdateRoadMapPayload,
  UpdateNestedRoadMapItemPayload,
  NestedRoadMapItem,
  AddCommentPayload,
  CreateQueryPayload,
  ReplyQueryPayload,
  CreateExtrasPayload,
  UpdateExtrasPayload,
} from "./types/roadmaps.types";

// Re-export all roadmap types so consumers can import from this file or from api.ts
export type {
  RoadmapStatus,
  ExtraType,
  ExtraItem,
  TextFieldExtra,
  TextAreaExtra,
  TextDisplayExtra,
  CheckboxExtra,
  UploadExtra,
  DatePickerExtra,
  AssessmentExtra,
  SignatureExtra,
  SectionExtra,
  NestedRoadMapItem,
  CreateRoadMapPayload,
  UpdateRoadMapPayload,
  UpdateNestedRoadMapItemPayload,
  RoadMapResponse,
  AddCommentPayload,
  CommentItem,
  CommentsThread,
  PopulatedUser,
  CreateQueryPayload,
  ReplyQueryPayload,
  QueryItem,
  QueriesThread,
  CreateExtrasPayload,
  UpdateExtrasPayload,
  FileData,
  ExtrasDocument,
  ExtrasResponse,
} from "./types/roadmaps.types";

// ─── Roadmap CRUD ─────────────────────────────────────────────────────────────

// GET /roadmaps?status=all&search=
export const apiGetRoadmaps = (status = 'all', search = '') =>
  axiosInstance.get(`/roadmaps`, { params: { status, search } });

// GET /roadmaps/user/:userId
export const apiGetRoadmapsByUser = (userId: string) =>
  axiosInstance.get(`/roadmaps/user/${userId}`, {
    params: { _cb: Date.now() },
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });

// GET /roadmaps/:id
export const apiGetRoadmapById = (id: string) =>
  axiosInstance.get(`/roadmaps/${id}`, {
    params: { _cb: Date.now() },
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });

// POST /roadmaps  (multipart/form-data when image provided)
export const apiCreateRoadmap = (payload: CreateRoadMapPayload, image?: File) => {
  if (image) {
    const formData = new FormData();
    formData.append('image', image);
    Object.entries(payload).forEach(([key, val]) => {
      if (val !== undefined) {
        formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
      }
    });
    return axiosInstance.post('/roadmaps', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return axiosInstance.post('/roadmaps', payload);
};

// PATCH /roadmaps/:id  (multipart/form-data when image provided)
export const apiUpdateRoadmap = (id: string, payload: UpdateRoadMapPayload, image?: File) => {
  if (image) {
    const formData = new FormData();
    formData.append('image', image);
    Object.entries(payload).forEach(([key, val]) => {
      if (val !== undefined) {
        formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
      }
    });
    return axiosInstance.patch(`/roadmaps/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return axiosInstance.patch(`/roadmaps/${id}`, payload);
};

// DELETE /roadmaps/:id
export const apiDeleteRoadmap = (id: string) =>
  axiosInstance.delete(`/roadmaps/${id}`);

// ─── Nested RoadMap Items ─────────────────────────────────────────────────────

// GET /roadmaps/:roadMapId/nested/:nestedItemId
export const apiGetNestedRoadmapItem = (roadMapId: string, nestedItemId: string) =>
  axiosInstance.get<{ success: boolean; data: any }>(`/roadmaps/${roadMapId}/nested/${nestedItemId}`);

// POST /roadmaps/:roadMapId/nested  (multipart/form-data when image provided)
export const apiAddNestedRoadmapItem = (roadMapId: string, payload: NestedRoadMapItem, image?: File) => {
  if (image) {
    const formData = new FormData();
    formData.append('image', image);
    Object.entries(payload).forEach(([key, val]) => {
      if (val !== undefined) {
        formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
      }
    });
    return axiosInstance.post(`/roadmaps/${roadMapId}/nested`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return axiosInstance.post(`/roadmaps/${roadMapId}/nested`, payload);
};

// PATCH /roadmaps/:roadMapId/nested/:nestedItemId  (multipart/form-data when image provided)
export const apiUpdateNestedRoadmapItem = (
  roadMapId: string,
  nestedItemId: string,
  payload: UpdateNestedRoadMapItemPayload,
  image?: File,
) => {
  if (image) {
    const formData = new FormData();
    formData.append('image', image);
    Object.entries(payload).forEach(([key, val]) => {
      if (val !== undefined) {
        formData.append(key, typeof val === 'object' ? JSON.stringify(val) : String(val));
      }
    });
    return axiosInstance.patch(`/roadmaps/${roadMapId}/nested/${nestedItemId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return axiosInstance.patch(`/roadmaps/${roadMapId}/nested/${nestedItemId}`, payload);
};

// ─── Comments ────────────────────────────────────────────────────────────────

// POST /roadmaps/:roadMapId/comments  body: { text, userId, mentorId }
export const apiAddComment = (roadMapId: string, payload: AddCommentPayload) =>
  axiosInstance.post(`/roadmaps/${roadMapId}/comments`, payload);

// GET /roadmaps/:roadMapId/comments?userId=
export const apiGetComments = (roadMapId: string, userId: string) =>
  axiosInstance.get(`/roadmaps/${roadMapId}/comments`, { params: { userId } });

// ─── Queries ─────────────────────────────────────────────────────────────────

// POST /roadmaps/:roadMapId/queries  body: { actualQueryText, userId }
export const apiAddQuery = (roadMapId: string, payload: CreateQueryPayload) =>
  axiosInstance.post(`/roadmaps/${roadMapId}/queries`, payload);

// GET /roadmaps/:roadMapId/queries?userId=&status=
export const apiGetQueries = (roadMapId: string, userId: string, status?: string) =>
  axiosInstance.get(`/roadmaps/${roadMapId}/queries`, {
    params: { userId, ...(status && { status }) },
  });

// PATCH /roadmaps/:roadMapId/queries/:queryItemId/reply  body: { repliedAnswer, repliedMentorId }
export const apiReplyToQuery = (roadMapId: string, queryItemId: string, payload: ReplyQueryPayload) =>
  axiosInstance.patch(`/roadmaps/${roadMapId}/queries/${queryItemId}/reply`, payload);

// ─── Extras ──────────────────────────────────────────────────────────────────

// GET /roadmaps/:roadMapId/extras?userId=&nestedRoadMapItemId=
function isObjectId(v?: string): v is string {
  return typeof v === "string" && /^[0-9a-fA-F]{24}$/.test(v.trim());
}

function cleanQueryIds(userId: string, nestedRoadMapItemId?: string): {
  userId: string;
  nestedRoadMapItemId?: string;
} {
  const out: { userId: string; nestedRoadMapItemId?: string } = { userId };
  if (isObjectId(nestedRoadMapItemId)) out.nestedRoadMapItemId = nestedRoadMapItemId.trim();
  return out;
}

export const apiGetExtras = (roadMapId: string, userId: string, nestedRoadMapItemId?: string) =>
  axiosInstance.get(`/roadmaps/${roadMapId}/extras`, {
    params: cleanQueryIds(userId, nestedRoadMapItemId),
  });

/**
 * Mobile parity: POST minimal extras row so PATCH/GET target the same document as nested tasks.
 * See CCC-Mobile `roadmapService.triggerJumpstartComplete`.
 */
export async function apiTriggerJumpstartComplete(
  roadmapId: string,
  userId: string,
  nestedRoadMapItemId?: string,
): Promise<{ success: boolean; message: string; alreadyExists?: boolean }> {
  if (!roadmapId?.trim()) throw new Error("roadmapId is required to trigger jumpstart completion");
  if (!userId?.trim()) throw new Error("userId is required to trigger jumpstart completion");

  const validNestedId =
    nestedRoadMapItemId &&
    nestedRoadMapItemId.trim() !== "" &&
    nestedRoadMapItemId.length === 24 &&
    /^[0-9a-fA-F]{24}$/.test(nestedRoadMapItemId)
      ? nestedRoadMapItemId
      : undefined;

  const body: {
    userId: string;
    extras: { type: string }[];
    nestedRoadMapItemId?: string;
  } = {
    userId,
    extras: [{ type: "JUMPSTART_COMPLETE" }],
  };
  if (validNestedId) body.nestedRoadMapItemId = validNestedId;

  try {
    const response = await axiosInstance.post<{ success: boolean; message?: string }>(
      `/roadmaps/${roadmapId}/extras`,
      body,
    );
    if (!response.data?.success) {
      throw new Error(response.data?.message || "Failed to trigger jumpstart completion");
    }
    return { success: true, message: response.data.message || "Jumpstart completion triggered." };
  } catch (error: unknown) {
    const err = error as {
      response?: { status?: number; data?: { message?: string } };
      message?: string;
    };
    const status = err?.response?.status;
    const message =
      err?.response?.data?.message || err?.message || "Failed to trigger jumpstart completion";
    if (
      status === 409 ||
      (status === 400 && /already exists|duplicate|already/i.test(String(message)))
    ) {
      return {
        success: true,
        message: "Jumpstart completion already recorded.",
        alreadyExists: true,
      };
    }
    throw error;
  }
}

// POST /roadmaps/:roadMapId/extras  body: { userId, nestedRoadMapItemId?, extras? }
export const apiSaveExtras = (roadMapId: string, payload: CreateExtrasPayload) =>
  axiosInstance.post(`/roadmaps/${roadMapId}/extras`, payload);

// PATCH /roadmaps/:roadMapId/extras?userId=&nestedRoadMapItemId=  body: { extras? }
export const apiUpdateExtras = (
  roadMapId: string,
  userId: string,
  payload: UpdateExtrasPayload,
  nestedRoadMapItemId?: string,
) =>
  axiosInstance.patch(`/roadmaps/${roadMapId}/extras`, payload, {
    params: cleanQueryIds(userId, nestedRoadMapItemId),
  });

// DELETE /roadmaps/:roadMapId/extras?userId=&nestedRoadMapItemId=
export const apiDeleteExtras = (roadMapId: string, userId: string, nestedRoadMapItemId?: string) =>
  axiosInstance.delete(`/roadmaps/${roadMapId}/extras`, {
    params: cleanQueryIds(userId, nestedRoadMapItemId),
  });

// ─── Extras Documents ────────────────────────────────────────────────────────

// POST /roadmaps/:roadMapId/extras/documents?userId=&nestedRoadMapItemId=&name=  (multipart, up to 10 files)
export const apiUploadExtrasDocuments = (
  roadMapId: string,
  userId: string,
  files: File[],
  nestedRoadMapItemId?: string,
  name?: string,
) => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  return axiosInstance.post(`/roadmaps/${roadMapId}/extras/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    params: {
      userId,
      ...(nestedRoadMapItemId && { nestedRoadMapItemId }),
      ...(name && { name }),
    },
  });
};

// GET /roadmaps/:roadMapId/extras/documents?userId=&nestedRoadMapItemId=
export const apiGetExtrasDocuments = (roadMapId: string, userId: string, nestedRoadMapItemId?: string) =>
  axiosInstance.get(`/roadmaps/${roadMapId}/extras/documents`, {
    params: { userId, ...(nestedRoadMapItemId && { nestedRoadMapItemId }) },
  });

// DELETE /roadmaps/:roadMapId/extras/documents?userId=&uploadBatchId=&nestedRoadMapItemId=
export const apiDeleteExtrasDocumentBatch = (
  roadMapId: string,
  userId: string,
  uploadBatchId: string,
  nestedRoadMapItemId?: string,
) =>
  axiosInstance.delete(`/roadmaps/${roadMapId}/extras/documents`, {
    params: { userId, uploadBatchId, ...(nestedRoadMapItemId && { nestedRoadMapItemId }) },
  });

// DELETE /roadmaps/:roadMapId/extras/documents/file?userId=&uploadBatchId=&fileUrl=&nestedRoadMapItemId=
export const apiDeleteExtrasDocumentFile = (
  roadMapId: string,
  userId: string,
  uploadBatchId: string,
  fileUrl: string,
  nestedRoadMapItemId?: string,
) =>
  axiosInstance.delete(`/roadmaps/${roadMapId}/extras/documents/file`, {
    params: { userId, uploadBatchId, fileUrl, ...(nestedRoadMapItemId && { nestedRoadMapItemId }) },
  });

// ─── Mentoring Sessions ────────────────────────────────────────────────────────

// GET /roadmaps/sessions/:userId
export const apiGetMentorshipSessions = (userId: string) =>
  axiosInstance.get(`/roadmaps/sessions/${userId}`);

export type MentorshipSessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "MISSED";

export type MentorshipSession = {
  id: string;
  sessionNumber: number;
  title: string;
  status: MentorshipSessionStatus;
  scheduledDate: string;
  mentorNote?: string;
  pastorNote?: string;
  appointmentId?: string;
  mentorshipInsights?: unknown;
};

function normalizeSessionsPayload(responseData: unknown): any[] {
  if (Array.isArray(responseData)) return responseData;
  if (responseData && typeof responseData === "object") {
    const wrap = responseData as { success?: boolean; data?: unknown; message?: string };
    if (wrap.success === false && wrap.message) {
      throw new Error(wrap.message);
    }
    if (Array.isArray(wrap.data)) return wrap.data;
  }
  return [];
}

export async function apiGetMentorshipSessionsNormalized(userId: string): Promise<MentorshipSession[]> {
  if (!userId?.trim()) throw new Error("userId is required");
  const res = await apiGetMentorshipSessions(userId);
  const raw = normalizeSessionsPayload(res.data);
  return raw.map((item: any, index: number) => {
    const id = String(item?._id ?? item?.id ?? `session-${index + 1}`);
    const numberValue = Number(item?.sessionNumber ?? item?.sessionNo ?? item?.session ?? item?.sequence ?? index + 1);
    const sessionNumber = Number.isFinite(numberValue) && numberValue > 0 ? numberValue : index + 1;
    const scheduledDate = String(item?.scheduledDate ?? item?.meetingDate ?? item?.date ?? item?.createdAt ?? "");
    const statusRaw = String(item?.status ?? "SCHEDULED").toUpperCase();
    const status: MentorshipSessionStatus =
      statusRaw === "COMPLETED" ? "COMPLETED" : statusRaw === "CANCELLED" ? "CANCELLED" : statusRaw === "MISSED" ? "MISSED" : "SCHEDULED";
    const title = String(item?.title ?? item?.mentorNote ?? `Session ${sessionNumber}`);
    const appointmentId = item?.appointmentId
      ? String(item.appointmentId)
      : item?.appointment?._id
        ? String(item.appointment._id)
        : undefined;
    return {
      id,
      sessionNumber,
      title,
      status,
      scheduledDate,
      mentorNote: item?.mentorNote ? String(item.mentorNote) : undefined,
      pastorNote: item?.pastorNote ? String(item.pastorNote) : undefined,
      appointmentId,
      mentorshipInsights: item?.mentorshipInsights,
    };
  });
}

// POST /roadmaps/complete-session  body: { appointmentId }
export async function apiCompleteMentorshipSession(
  appointmentId: string,
): Promise<{ success: boolean; message: string }> {
  if (!appointmentId?.trim()) {
    throw new Error("appointmentId is required to complete a session");
  }
  const response = await axiosInstance.post<{ success?: boolean; message?: string }>(
    `/roadmaps/complete-session`,
    { appointmentId },
  );
  if (response.status >= 200 && response.status < 300) {
    if (response.data && typeof response.data === "object" && response.data.success === false) {
      throw new Error(response.data.message || "Failed to complete session");
    }
    return {
      success: true,
      message:
        (typeof response.data?.message === "string" && response.data.message.trim()
          ? response.data.message.trim()
          : "Session completed successfully."),
    };
  }
  throw new Error("Failed to complete session");
}

// POST /roadmaps/redo-session  body: { appointmentId }
export async function apiRedoMentorshipSession(
  appointmentId: string,
): Promise<{ success: boolean; message: string }> {
  if (!appointmentId?.trim()) {
    throw new Error("appointmentId is required to redo a session");
  }
  const response = await axiosInstance.post<{ success?: boolean; message?: string }>(
    `/roadmaps/redo-session`,
    { appointmentId },
  );
  if (response.status >= 200 && response.status < 300) {
    if (response.data && typeof response.data === "object" && response.data.success === false) {
      throw new Error(response.data.message || "Failed to redo session");
    }
    return {
      success: true,
      message:
        (typeof response.data?.message === "string" && response.data.message.trim()
          ? response.data.message.trim()
          : "Session marked for redo."),
    };
  }
  throw new Error("Failed to redo session");
}
// ─── Legacy aliases ───────────────────────────────────────────────────────────
/** @deprecated use apiUpdateRoadmap */
export const apiUpdateRoadmapData = apiUpdateRoadmap;
/** @deprecated use apiGetRoadmapsByUser */
export const apiGetUserRoadmaps = apiGetRoadmapsByUser;
/** @deprecated use apiUploadExtrasDocuments — /roadmaps/:id/upload does not exist in backend */
export const apiUploadRoadmapFile = (id: string, formData: FormData) =>
  apiUploadExtrasDocuments(id, '', []); // stub — callers should migrate to apiUploadExtrasDocuments
