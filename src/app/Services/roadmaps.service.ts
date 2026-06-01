import axiosInstance from "./config/axios-instance";
import type { ReorderRoadmapsPayload } from "./types/roadmaps.types";
import type {
  CreateRoadMapPayload,
  UpdateRoadMapPayload,
  UpdateNestedRoadMapItemPayload,
  NestedRoadMapItem,
  AddCommentPayload,
  CreateQueryPayload,
  ReplyQueryPayload,
  UpdatePastorQueryPayload,
  CreateExtrasPayload,
  UpdateExtrasPayload,
  RoadmapSubmissionActivity,
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
  UpdatePastorQueryPayload,
  QueryItem,
  QueriesThread,
  CreateExtrasPayload,
  UpdateExtrasPayload,
  FileData,
  ExtrasDocument,
  ExtrasResponse,
  RoadmapSubmissionActivity,
} from "./types/roadmaps.types";

// ─── Roadmap CRUD ─────────────────────────────────────────────────────────────

// GET /roadmaps?status=all&search=
export const apiGetRoadmaps = (status = "all", search = "") =>
  axiosInstance.get(`/roadmaps`, {
    params: { status, search, _cb: Date.now() },
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });

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

/**
 * Nested roadmap items use the same Nest/Multer bracket syntax as parent roadmaps.
 * IMPORTANT: Do NOT JSON.stringify arrays/objects into FormData, because the backend DTO expects
 * indexed keys like `extras[0][type]`, `meetings[0]`, etc.
 */
function appendNestedRoadmapItemToFormData(
  formData: FormData,
  payload: NestedRoadMapItem | UpdateNestedRoadMapItemPayload,
) {
  const p = payload as Record<string, unknown>;

  const add = (k: string, v: unknown) => {
    if (v === undefined || v === null) return;
    const s = typeof v === "string" ? v : typeof v === "number" ? String(v) : typeof v === "boolean" ? String(v) : null;
    if (s === null) return;
    if (s.trim() === "") return;
    formData.append(k, s);
  };

  add("name", p.name);
  add("duration", p.duration);
  add("roadMapDetails", p.roadMapDetails);
  add("description", p.description);
  add("status", p.status);
  add("phase", p.phase);
  add("totalSteps", p.totalSteps);
  add("startDate", p.startDate);
  add("endDate", p.endDate);
  add("completedOn", p.completedOn);
  add("imageUrl", p.imageUrl);

  const meetings = p.meetings;
  if (Array.isArray(meetings) && meetings.length) {
    meetings.forEach((m, i) => {
      if (m != null && String(m).trim() !== "") {
        formData.append(`meetings[${i}]`, String(m));
      }
    });
  }

  const extras = p.extras;
  if (Array.isArray(extras) && extras.length) {
    extras.forEach((extra, i) => {
      if (!extra || typeof extra !== "object") return;
      const e = extra as Record<string, unknown>;
      const b = `extras[${i}]`;
      if (e.type != null) formData.append(`${b}[type]`, String(e.type));
      if (e.name != null) formData.append(`${b}[name]`, String(e.name));
      if (e.placeHolder) formData.append(`${b}[placeHolder]`, String(e.placeHolder));
      if (e.buttonName) formData.append(`${b}[buttonName]`, String(e.buttonName));
      if (e.haveButton !== undefined) formData.append(`${b}[haveButton]`, String(e.haveButton));
      if (String(e.type) === "ASSESSMENT" && e.assessmentId) {
        formData.append(`${b}[assessmentId]`, String(e.assessmentId));
      }
      // If backend supports nested checkbox lists on certain extras, send them with bracket paths.
      const checkboxes = e.checkboxes;
      if (Array.isArray(checkboxes) && checkboxes.length) {
        checkboxes.forEach((cb, j) => {
          if (!cb || typeof cb !== "object") return;
          const c = cb as Record<string, unknown>;
          const cbBase = `${b}[checkboxes][${j}]`;
          if (c.type != null) formData.append(`${cbBase}[type]`, String(c.type));
          if (c.name != null) formData.append(`${cbBase}[name]`, String(c.name));
          if (c.haveButton !== undefined) formData.append(`${cbBase}[haveButton]`, String(c.haveButton));
          if (c.buttonName) formData.append(`${cbBase}[buttonName]`, String(c.buttonName));
        });
      }
      const sections = e.sections;
      if (Array.isArray(sections) && sections.length) {
        sections.forEach((sec, j) => {
          if (!sec || typeof sec !== "object") return;
          const s = sec as Record<string, unknown>;
          const secBase = `${b}[sections][${j}]`;
          if (s.type != null) formData.append(`${secBase}[type]`, String(s.type));
          if (s.name != null) formData.append(`${secBase}[name]`, String(s.name));
          if (s.placeHolder) formData.append(`${secBase}[placeHolder]`, String(s.placeHolder));
          if (s.buttonName) formData.append(`${secBase}[buttonName]`, String(s.buttonName));
          if (s.haveButton !== undefined) formData.append(`${secBase}[haveButton]`, String(s.haveButton));
          if (String(s.type) === "ASSESSMENT" && s.assessmentId) {
            formData.append(`${secBase}[assessmentId]`, String(s.assessmentId));
          }
        });
      }
    });
  }
}

/**
 * Nest/Multer: arrays must be sent as `divisions[0]`, `extras[0][type]`, etc.
 * Stringifying `[]` to `"[]"` breaks ValidationPipe (400).
 * Matches `CreateRoadmapModal` + mobile multipart shape.
 */
function appendRoadmapWritePayloadToFormData(
  formData: FormData,
  payload: CreateRoadMapPayload | UpdateRoadMapPayload,
) {
  const p = payload as CreateRoadMapPayload;
  if (p.type != null) formData.append("type", String(p.type));
  if (p.name != null) formData.append("name", String(p.name));
  if (p.duration != null) formData.append("duration", String(p.duration));
  if (p.roadMapDetails != null && String(p.roadMapDetails).trim() !== "") {
    formData.append("roadMapDetails", String(p.roadMapDetails).trim());
  }
  if (p.description != null && String(p.description).trim() !== "") {
    formData.append("description", String(p.description).trim());
  }
  if (p.status != null) formData.append("status", String(p.status));
  if (p.phase != null) formData.append("phase", String(p.phase));
  if (p.assesmentId != null) formData.append("assesmentId", String(p.assesmentId));
  if (p.totalSteps != null) formData.append("totalSteps", String(p.totalSteps));
  if (p.imageUrl != null) formData.append("imageUrl", String(p.imageUrl));
  if (p.startDate != null) formData.append("startDate", String(p.startDate));
  if (p.endDate != null) formData.append("endDate", String(p.endDate));
  if (p.completedOn != null) formData.append("completedOn", String(p.completedOn));
  if (Array.isArray(p.meetings) && p.meetings.length) {
    p.meetings.forEach((m, i) => {
      formData.append(`meetings[${i}]`, m);
    });
  }
  if (Array.isArray(p.divisions) && p.divisions.length) {
    p.divisions.forEach((d, i) => {
      formData.append(`divisions[${i}]`, d);
    });
  }
  if (Array.isArray(p.extras) && p.extras.length) {
    p.extras.forEach((extra, i) => {
      const b = `extras[${i}]`;
      formData.append(`${b}[type]`, String(extra.type));
      formData.append(`${b}[name]`, String(extra.name));
      const e = extra as unknown as Record<string, unknown>;
      if (e.placeHolder) formData.append(`${b}[placeHolder]`, String(e.placeHolder));
      if (e.buttonName) formData.append(`${b}[buttonName]`, String(e.buttonName));
      if (e.haveButton !== undefined) formData.append(`${b}[haveButton]`, String(e.haveButton));
      if (String(extra.type) === "ASSESSMENT" && e.assessmentId) {
        formData.append(`${b}[assessmentId]`, String(e.assessmentId));
      }
    });
  }
  if (Array.isArray(p.roadmaps) && p.roadmaps.length) {
    p.roadmaps.forEach((item, i) => {
      const b = `roadmaps[${i}]`;
      formData.append(`${b}[name]`, String(item.name ?? ""));
      formData.append(`${b}[duration]`, String(item.duration ?? ""));
      if (item.description?.trim()) {
        formData.append(`${b}[description]`, item.description.trim());
      }
      if (item.roadMapDetails?.trim()) {
        formData.append(`${b}[roadMapDetails]`, item.roadMapDetails.trim());
      }
      const nestedExtras = item.extras ?? [];
      nestedExtras.forEach((extra, j) => {
        const e = `roadmaps[${i}][extras][${j}]`;
        formData.append(`${e}[type]`, String(extra.type));
        formData.append(`${e}[name]`, String(extra.name));
        const ex = extra as unknown as Record<string, unknown>;
        if (ex.placeHolder) formData.append(`${e}[placeHolder]`, String(ex.placeHolder));
        if (ex.buttonName) formData.append(`${e}[buttonName]`, String(ex.buttonName));
        if (ex.haveButton !== undefined) formData.append(`${e}[haveButton]`, String(ex.haveButton));
        if (String(extra.type) === "ASSESSMENT" && ex.assessmentId) {
          formData.append(`${e}[assessmentId]`, String(ex.assessmentId));
        }
      });
    });
  }
}

function shouldUseMultipartForRoadmapPatch(payload: UpdateRoadMapPayload): boolean {
  const p = payload as Record<string, unknown>;
  // Backend (Nest + Multer) expects bracket-indexed fields for arrays/objects.
  // Sending JSON for these updates can silently drop nested array fields (e.g. extras).
  const keysThatOftenRequireMultipart = ["extras", "divisions", "meetings", "roadmaps"];
  return keysThatOftenRequireMultipart.some((k) => Array.isArray(p[k]) && (p[k] as unknown[]).length > 0);
}

function shouldUseMultipartForNestedPatch(payload: UpdateNestedRoadMapItemPayload): boolean {
  const p = payload as Record<string, unknown>;
  return (
    (Array.isArray(p.extras) && (p.extras as unknown[]).length > 0) ||
    (Array.isArray(p.meetings) && (p.meetings as unknown[]).length > 0)
  );
}

// POST /roadmaps — always multipart (parity with CreateRoadmapModal; server expects indexed fields, not JSON-stringified arrays)
export const apiCreateRoadmap = (payload: CreateRoadMapPayload, image?: File) => {
  const formData = new FormData();
  if (image) formData.append("image", image);
  appendRoadmapWritePayloadToFormData(formData, payload);
  return axiosInstance.post("/roadmaps", formData);
};

// PATCH /roadmaps/:id  (multipart/form-data when image provided)
export const apiUpdateRoadmap = (id: string, payload: UpdateRoadMapPayload, image?: File) => {
  if (image || shouldUseMultipartForRoadmapPatch(payload)) {
    const formData = new FormData();
    if (image) formData.append("image", image);
    appendRoadmapWritePayloadToFormData(formData, payload);
    return axiosInstance.patch(`/roadmaps/${id}`, formData);
  }
  return axiosInstance.patch(`/roadmaps/${id}`, payload);
};

// DELETE /roadmaps/:id
export const apiDeleteRoadmap = (id: string) =>
  axiosInstance.delete(`/roadmaps/${id}`);
// PATCH /roadmaps/reorder
export const apiReorderRoadmaps = (orderedRoadmapIds: string[]) =>
  axiosInstance.patch("/roadmaps/reorder", {
    orderedRoadmapIds,
  } satisfies ReorderRoadmapsPayload);
// ─── Nested RoadMap Items ─────────────────────────────────────────────────────

// GET /roadmaps/:roadMapId/nested/:nestedItemId
export const apiGetNestedRoadmapItem = (roadMapId: string, nestedItemId: string) =>
  axiosInstance.get<{ success: boolean; data: any }>(`/roadmaps/${roadMapId}/nested/${nestedItemId}`);

// POST /roadmaps/:roadMapId/nested  (multipart/form-data when image provided)
export const apiAddNestedRoadmapItem = (roadMapId: string, payload: NestedRoadMapItem, image?: File) => {
  if (image) {
    const formData = new FormData();
    formData.append('image', image);
    appendNestedRoadmapItemToFormData(formData, payload);
    return axiosInstance.post(`/roadmaps/${roadMapId}/nested`, formData);
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
  if (image || shouldUseMultipartForNestedPatch(payload)) {
    const formData = new FormData();
    if (image) formData.append("image", image);
    appendNestedRoadmapItemToFormData(formData, payload);
    return axiosInstance.patch(`/roadmaps/${roadMapId}/nested/${nestedItemId}`, formData);
  }
  return axiosInstance.patch(`/roadmaps/${roadMapId}/nested/${nestedItemId}`, payload);
};

// ─── Comments ────────────────────────────────────────────────────────────────

// POST /roadmaps/:roadMapId/comments  (`/api/v1/...` via proxy) — body: { text, userId, mentorId }
export const apiAddComment = (roadMapId: string, payload: AddCommentPayload) =>
  axiosInstance.post(`/roadmaps/${roadMapId}/comments`, payload);

// GET /roadmaps/:roadMapId/comments?userId=
export const apiGetComments = (roadMapId: string, userId: string) =>
  axiosInstance.get(`/roadmaps/${roadMapId}/comments`, { params: { userId } });

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Use `pastor` for mentor-facing pastor roadmap threads (`/roadmaps/pastor/:id/...`): matches CCC-Backend inbox / email branching. `default` is `/roadmaps/:id/...`. */
export type RoadmapQueriesScope = "default" | "pastor";

function roadmapQueriesRoot(roadMapId: string, scope: RoadmapQueriesScope): string {
  const id = encodeURIComponent(String(roadMapId ?? "").trim());
  return scope === "pastor" ? `/roadmaps/pastor/${id}` : `/roadmaps/${id}`;
}

/** POST `/roadmaps/pastor/:roadMapId/queries` when `scope` is pastor; else POST `/roadmaps/:roadMapId/queries`. */
export const apiAddQuery = (
  roadMapId: string,
  payload: CreateQueryPayload,
  scope: RoadmapQueriesScope = "default",
) => axiosInstance.post(`${roadmapQueriesRoot(roadMapId, scope)}/queries`, payload);

/** GET queries — same pastor vs root prefix split as POST. */
export const apiGetQueries = (
  roadMapId: string,
  userId: string,
  status?: string,
  nestedRoadMapItemId?: string,
  scope: RoadmapQueriesScope = "default",
) =>
  axiosInstance.get(`${roadmapQueriesRoot(roadMapId, scope)}/queries`, {
    params: {
      userId,
      ...(status && { status }),
      ...(nestedRoadMapItemId && { nestedRoadMapItemId }),
    },
  });

/** PATCH `…/queries/:queryItemId/reply` — pastor or default prefix must match thread where query was created. */
export const apiReplyToQuery = (
  roadMapId: string,
  queryItemId: string,
  payload: ReplyQueryPayload,
  scope: RoadmapQueriesScope = "default",
) =>
  axiosInstance.patch(
    `${roadmapQueriesRoot(roadMapId, scope)}/queries/${encodeURIComponent(queryItemId)}/reply`,
    payload,
  );

/** PATCH pastor query body — same prefix as create. */
export const apiUpdatePastorQuery = (
  roadMapId: string,
  queryItemId: string,
  payload: UpdatePastorQueryPayload,
  scope: RoadmapQueriesScope = "default",
) =>
  axiosInstance.patch(
    `${roadmapQueriesRoot(roadMapId, scope)}/queries/${encodeURIComponent(queryItemId)}`,
    payload,
  );

/** DELETE query — prefix must match create. */
export const apiDeletePastorQuery = (
  roadMapId: string,
  queryItemId: string,
  userId: string,
  nestedRoadMapItemId?: string,
  scope: RoadmapQueriesScope = "default",
) =>
  axiosInstance.delete(
    `${roadmapQueriesRoot(roadMapId, scope)}/queries/${encodeURIComponent(queryItemId)}`,
    {
      params: { userId, ...(nestedRoadMapItemId && { nestedRoadMapItemId }) },
    },
  );

/** DELETE mentor reply — prefix must match query thread. */
export const apiDeleteQueryReply = (
  roadMapId: string,
  queryItemId: string,
  repliedMentorId: string,
  scope: RoadmapQueriesScope = "default",
) =>
  axiosInstance.delete(
    `${roadmapQueriesRoot(roadMapId, scope)}/queries/${encodeURIComponent(queryItemId)}/reply`,
    {
      params: { repliedMentorId },
    },
  );

// ─── Extras ──────────────────────────────────────────────────────────────────

/** Mongo ObjectId or other backend ids (query-safe alphanumeric / hyphen). */
function isRoadmapScopeId(v?: string): v is string {
  const t = typeof v === "string" ? v.trim() : "";
  if (!t || t.length > 80) return false;
  if (/^[0-9a-fA-F]{24}$/.test(t)) return true;
  return /^[a-zA-Z0-9_-]+$/.test(t) && t.length >= 8;
}

function cleanQueryIds(userId: string, nestedRoadMapItemId?: string): {
  userId: string;
  nestedRoadMapItemId?: string;
} {
  const out: { userId: string; nestedRoadMapItemId?: string } = { userId };
  if (isRoadmapScopeId(nestedRoadMapItemId)) out.nestedRoadMapItemId = nestedRoadMapItemId!.trim();
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
    nestedRoadMapItemId && isRoadmapScopeId(nestedRoadMapItemId)
      ? nestedRoadMapItemId.trim()
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
      (status === 400 &&
        /already exists|duplicate|already|Extras already exist for this roadmap/i.test(
          String(message),
        ))
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
  axiosInstance.post(`/roadmaps/${roadMapId}/extras`, { ...payload, roadMapId });

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
    params: {
      ...cleanQueryIds(userId, nestedRoadMapItemId),
      ...(name && { name }),
    },
  });
};

// GET /roadmaps/:roadMapId/extras/documents?userId=&nestedRoadMapItemId=
export const apiGetExtrasDocuments = (roadMapId: string, userId: string, nestedRoadMapItemId?: string) =>
  axiosInstance.get(`/roadmaps/${roadMapId}/extras/documents`, {
    params: cleanQueryIds(userId, nestedRoadMapItemId),
  });

function roadmapSubmissionsRoot(roadMapId: string, nestedRoadMapItemId?: string): string {
  return nestedRoadMapItemId
    ? `/roadmaps/${roadMapId}/nested/${nestedRoadMapItemId}/submissions`
    : `/roadmaps/${roadMapId}/submissions`;
}

// POST /roadmaps/:roadMapId[/nested/:nestedRoadMapItemId]/submissions
export const apiCreateRoadmapSubmission = (roadMapId: string, payload: CreateExtrasPayload) =>
  axiosInstance.post(roadmapSubmissionsRoot(roadMapId, payload.nestedRoadMapItemId), payload);

// GET /roadmaps/:roadMapId[/nested/:nestedRoadMapItemId]/submissions?userId=&nestedRoadMapItemId=
export const apiGetRoadmapSubmissions = (roadMapId: string, userId: string, nestedRoadMapItemId?: string) =>
  axiosInstance.get(roadmapSubmissionsRoot(roadMapId, nestedRoadMapItemId), {
    params: cleanQueryIds(userId, nestedRoadMapItemId),
  });

// GET /roadmaps/:roadMapId[/nested/:nestedRoadMapItemId]/submissions/latest?userId=&nestedRoadMapItemId=
export const apiGetLatestRoadmapSubmission = (roadMapId: string, userId: string, nestedRoadMapItemId?: string) =>
  axiosInstance.get(`${roadmapSubmissionsRoot(roadMapId, nestedRoadMapItemId)}/latest`, {
    params: cleanQueryIds(userId, nestedRoadMapItemId),
  });

export const apiGetRoadmapSubmissionActivity = (
  userId: string,
  from: string,
  to: string,
) =>
  axiosInstance.get<{ success: boolean; data: RoadmapSubmissionActivity[] }>(
    "/roadmaps/submissions/activity",
    {
      params: { userId, from, to },
    },
  );

// GET /roadmaps/submissions/:submissionId
export const apiGetRoadmapSubmissionById = (submissionId: string) =>
  axiosInstance.get(`/roadmaps/submissions/${encodeURIComponent(submissionId)}`);

// POST /roadmaps/submissions/:submissionId/documents?name=  (multipart)
export const apiUploadRoadmapSubmissionDocuments = (
  submissionId: string,
  files: File[],
  name?: string,
) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  return axiosInstance.post(
    `/roadmaps/submissions/${encodeURIComponent(submissionId)}/documents`,
    formData,
    { params: { ...(name && { name }) } },
  );
};

// DELETE /roadmaps/:roadMapId/extras/documents?userId=&uploadBatchId=&nestedRoadMapItemId=
export const apiDeleteExtrasDocumentBatch = (
  roadMapId: string,
  userId: string,
  uploadBatchId: string,
  nestedRoadMapItemId?: string,
) =>
  axiosInstance.delete(`/roadmaps/${roadMapId}/extras/documents`, {
    params: { ...cleanQueryIds(userId, nestedRoadMapItemId), uploadBatchId },
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
    params: { ...cleanQueryIds(userId, nestedRoadMapItemId), uploadBatchId, fileUrl },
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
