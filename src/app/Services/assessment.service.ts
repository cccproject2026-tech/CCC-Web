import { isAxiosError } from "axios";
import axiosInstance from "./config/axios-instance";
import type {
  AssessmentResponse,
  AssignAssessmentUsersPayload,
  CreateAssessmentPayload,
  SendSectionRecommendationsPayload,
  SubmitPreSurveyPayload,
  SubmitSectionAnswersPayload,
  UpdateAssessmentPayload,
} from "./types/assessment.types";

/**
 * GET /assessment may return a JSON array, or { data: [...] }, or { assessments: [...] }.
 * Axios puts the HTTP body on `response.data`.
 */
export function parseAssessmentsListPayload(body: unknown): AssessmentResponse[] {
  if (Array.isArray(body)) return body as AssessmentResponse[];
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data as AssessmentResponse[];
    if (Array.isArray(o.assessments)) return o.assessments as AssessmentResponse[];
    if (Array.isArray(o.results)) return o.results as AssessmentResponse[];
    if (Array.isArray(o.items)) return o.items as AssessmentResponse[];
    if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
      const d = o.data as Record<string, unknown>;
      if (Array.isArray(d.assessments)) return d.assessments as AssessmentResponse[];
      if (Array.isArray(d.items)) return d.items as AssessmentResponse[];
      if (Array.isArray(d.rows)) return d.rows as AssessmentResponse[];
      if (Array.isArray(d.list)) return d.list as AssessmentResponse[];
      if (Array.isArray(d.data)) return d.data as AssessmentResponse[];
      if (Array.isArray(d.results)) return d.results as AssessmentResponse[];
      /** Nested e.g. { data: { data: [...] } } */
      if (d.data && typeof d.data === "object") {
        const inner = d.data as Record<string, unknown>;
        if (Array.isArray(inner.assessments)) return inner.assessments as AssessmentResponse[];
        if (Array.isArray(inner.items)) return inner.items as AssessmentResponse[];
        if (Array.isArray(inner.data)) return inner.data as AssessmentResponse[];
      }
    }
  }
  return [];
}

/**
 * GET /assessment/:id may return the document on the JSON root (axios `response.data`)
 * or wrapped as `{ data: assessment }` / `{ success, data }` / `{ data: { assessment } }`.
 */
export function parseAssessmentDetailPayload(body: unknown): AssessmentResponse | null {
  if (body == null || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  if (o.data != null && typeof o.data === "object" && !Array.isArray(o.data)) {
    const inner = o.data as Record<string, unknown>;
    if (inner.assessment != null && typeof inner.assessment === "object" && !Array.isArray(inner.assessment)) {
      return parseAssessmentDetailPayload(inner.assessment);
    }
    return parseAssessmentDetailPayload(o.data);
  }

  if (o.assessment != null && typeof o.assessment === "object" && !Array.isArray(o.assessment)) {
    return parseAssessmentDetailPayload(o.assessment);
  }
  if (o.document != null && typeof o.document === "object" && !Array.isArray(o.document)) {
    return parseAssessmentDetailPayload(o.document);
  }
  if (o.result != null && typeof o.result === "object" && !Array.isArray(o.result)) {
    return parseAssessmentDetailPayload(o.result);
  }

  if ("_id" in o || "name" in o || "sections" in o || "title" in o) {
    return body as AssessmentResponse;
  }
  return null;
}

/**
 * CMA survey UI expects `sections[].layers[].choices[]`. APIs may use alternate keys or JSON strings.
 */
export function extractSurveySectionsForCma(detail: AssessmentResponse | Record<string, unknown> | null | undefined): unknown[] {
  if (!detail || typeof detail !== "object") return [];
  const any = detail as Record<string, unknown>;

  let sections: unknown = any.sections;
  if (typeof sections === "string") {
    try {
      sections = JSON.parse(sections) as unknown;
    } catch {
      sections = [];
    }
  }
  if (Array.isArray(sections) && sections.length > 0) return sections;

  const fallbacks: unknown[] = [
    any.surveySections,
    any.cmaSections,
    (any.survey as Record<string, unknown> | undefined)?.sections,
    (any.content as Record<string, unknown> | undefined)?.sections,
  ];
  for (const fb of fallbacks) {
    if (Array.isArray(fb) && fb.length > 0) return fb;
  }

  return [];
}

/**
 * GET /assessment/assigned/:userId — response may be a raw array or wrapped in `data`,
 * `data.assignments`, `data.items`, etc.
 */
export function parseAssignedAssessmentsListBody(body: unknown): unknown[] {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const o = body as Record<string, unknown>;
    if (Array.isArray(o.data)) return o.data;
    if (o.data && typeof o.data === "object") {
      const d = o.data as Record<string, unknown>;
      if (Array.isArray(d.assignments)) return d.assignments;
      if (Array.isArray(d.items)) return d.items;
      if (Array.isArray(d.rows)) return d.rows;
    }
  }
  return [];
}

/** One row from assigned list: populated `assessment` or a flat assessment document. */
export type FlatAssignedAssessmentRow = {
  assessmentId: string;
  assignmentId?: string;
  assessment: Record<string, unknown>;
  dueDate?: string;
  meetingDate?: string;
  updatedAt?: string;
};

export function flattenAssignedAssessmentRow(item: unknown): FlatAssignedAssessmentRow | null {
  if (!item || typeof item !== "object") return null;
  const row = item as Record<string, unknown>;
  const nested = row.assessment;
  const hasNested = nested && typeof nested === "object" && !Array.isArray(nested);

  if (hasNested) {
    const assessment = nested as Record<string, unknown>;
    const assessmentId = String(assessment._id ?? assessment.id ?? row.assessmentId ?? "").trim();
    if (!assessmentId) return null;
    const assignmentId =
      row._id != null ? String(row._id) : row.assignmentId != null ? String(row.assignmentId) : undefined;
    return {
      assessmentId,
      assignmentId,
      assessment,
      dueDate: typeof row.dueDate === "string" ? row.dueDate : undefined,
      meetingDate: typeof row.meetingDate === "string" ? row.meetingDate : undefined,
      updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
    };
  }

  const assessmentId = String(row._id ?? row.id ?? row.assessmentId ?? "").trim();
  if (!assessmentId) return null;
  const hasShape = typeof row.name === "string" || Array.isArray(row.sections);
  if (!hasShape) return null;

  return {
    assessmentId,
    assignmentId: row.assignmentId != null ? String(row.assignmentId) : undefined,
    assessment: row as Record<string, unknown>,
    dueDate: typeof row.dueDate === "string" ? row.dueDate : undefined,
    meetingDate: typeof row.meetingDate === "string" ? row.meetingDate : undefined,
    updatedAt: typeof row.updatedAt === "string" ? row.updatedAt : undefined,
  };
}

/**
 * Human-readable message from failed create/update (Nest/class-validator often uses
 * `message: string[]` or nested `errors`).
 */
export function formatAssessmentApiErrorMessage(err: unknown): string {
  const ex = err as { response?: { status?: number; data?: unknown } };
  const status = ex.response?.status;
  const data = ex.response?.data;
  if (data == null) {
    return status ? `Request failed (HTTP ${status})` : "Request failed";
  }
  if (typeof data === "string") {
    const s = data.trim();
    return s ? (status ? `${s} (HTTP ${status})` : s) : status ? `Request failed (HTTP ${status})` : "Request failed";
  }
  if (typeof data !== "object" || data === null) {
    return status ? `Request failed (HTTP ${status})` : "Request failed";
  }
  const o = data as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof o.message === "string") parts.push(o.message);
  else if (Array.isArray(o.message)) parts.push(...o.message.map(String));
  if (typeof o.error === "string" && o.error !== "Bad Request") parts.push(o.error);
  if (Array.isArray(o.errors)) {
    for (const item of o.errors) {
      if (typeof item === "string") parts.push(item);
      else if (item && typeof item === "object" && item !== null) {
        const row = item as Record<string, unknown>;
        if (typeof row.message === "string") parts.push(row.message);
        const c = row.constraints;
        if (c && typeof c === "object" && c !== null) {
          parts.push(...Object.values(c as Record<string, string>).map(String));
        }
      }
    }
  }
  const msg = parts.filter(Boolean).join(" · ");
  const base = msg.trim() || (status && status >= 500 ? "Internal server error" : "Validation failed");
  return status ? `${base} (HTTP ${status})` : base;
}

// POST /assessment — same resource prefix as GET/PATCH (plural /assessments returns 404 on many backends)
export const apiCreateAssessment = (payload: CreateAssessmentPayload) =>
  axiosInstance.post<{ success: boolean; data: AssessmentResponse }>("/assessment", payload);

/** List calls can be slow on large datasets; avoid default 10s axios timeout. */
const GET_ASSESSMENTS_TIMEOUT_MS = 60_000;

// GET /assessment?search=  (optional _t to avoid stale list caches after editor save)
export const apiGetAssessments = (params?: { search?: string; _t?: number }) =>
  axiosInstance.get<{ success: boolean; data: AssessmentResponse[] }>("/assessment", {
    params: params ? { ...params, _t: params._t ?? Date.now() } : { _t: Date.now() },
    timeout: GET_ASSESSMENTS_TIMEOUT_MS,
    headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
  });

// GET /assessment/:id
export const apiGetAssessmentById = (id: string) => {
  if (!id) throw new Error("Assessment ID is required");
  return axiosInstance.get<{ success: boolean; data: AssessmentResponse }>(`/assessment/${id}`);
};

// POST /assessment/:assessmentId/assign  (assessment-module assign — keep distinct from `/progress/assign-assessment`)
export const apiAssignAssessmentViaModule = (assessmentId: string, payload: AssignAssessmentUsersPayload) =>
  axiosInstance.post<{ success: boolean; message?: string; data?: unknown }>(
    `/assessment/${encodeURIComponent(assessmentId)}/assign`,
    payload,
  );

// DELETE /assessment  body: { ids }
export const apiDeleteAssessments = (ids: string[]) =>
  axiosInstance.delete<{ success: boolean; message: string }>("/assessment", { data: { ids } });

// PATCH /assessment/:id/instructions — optional: name, description, type, preSurvey
export const apiPatchAssessment = (assessmentId: string, body: UpdateAssessmentPayload) =>
  axiosInstance.patch<{ success: boolean; data: AssessmentResponse }>(
    `/assessment/${assessmentId}/instructions`,
    body,
  );

// PATCH /assessment/:id/instructions  body: { instructions }
export const apiUpdateInstructions = (assessmentId: string, instructions: string[]) =>
  axiosInstance.patch<{ success: boolean; data: AssessmentResponse }>(
    `/assessment/${assessmentId}/instructions`,
    { instructions },
  );

/** Body shape for PATCH /assessment/:id/sections (director `buildSectionsPayload`). */
export type AssessmentSectionsPatch = {
  title: string;
  description: string;
  layers: {
    title: string;
    choices: { text: string }[];
    recommendations: string[];
  }[];
  /** CDP / action-plan levels 1–4, distinct from per-layer `layers[].recommendations`. */
  recommendations?: { level: 1 | 2 | 3 | 4; items: string[] }[];
}[];

// PATCH /assessment/:id/sections  body: { sections }
export const apiUpdateSections = (assessmentId: string, sections: AssessmentSectionsPatch) =>
  axiosInstance.patch<{ success: boolean; data: AssessmentResponse }>(
    `/assessment/${assessmentId}/sections`,
    { sections },
  );

// POST /assessment/:id/banner-image  (multipart, field: image)
// Do not set Content-Type manually — the boundary is required; axios/browser set it for FormData.
export const apiUploadAssessmentBanner = (assessmentId: string, file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  
  console.log("Banner upload attempt:", {
    assessmentId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    endpoint: `/assessment/${assessmentId}/banner-image`
  });

  return axiosInstance.patch<{ success: boolean; data: { bannerImage: string } }>(
    `/assessment/${assessmentId}/banner-image`,
    formData,
    { 
      timeout: 60_000,
      headers: {
        "Content-Type": undefined
      }
    },
  );
};

// POST /assessment/:id/answers
export const apiSubmitSectionAnswers = (assessmentId: string, payload: SubmitSectionAnswersPayload) =>
  axiosInstance.post(`/assessment/${assessmentId}/answers`, payload);

// POST /assessment/:id/section/:userId (single section save)
export const apiSaveSectionAnswers = (
  assessmentId: string,
  userId: string,
  sectionId: string,
  layers: { layerId: string; selectedChoice: string }[],
) => axiosInstance.post(`/assessment/${assessmentId}/section/${userId}`, { sectionId, layers });

/**
 * POST pre-survey answers — backend route name varies by deploy; retry alternate paths on 404.
 */
export async function apiSubmitPreSurvey(
  assessmentId: string,
  payload: SubmitPreSurveyPayload,
) {
  const id = encodeURIComponent(assessmentId);
  const pathCandidates = [
    `/assessment/${id}/submit-pre-survey`,
    `/assessment/${id}/pre-survey`,
    `/assessment/${id}/preSurvey`,
    `/assessments/${id}/submit-pre-survey`,
    `/assessments/${id}/pre-survey`,
  ];
  const bodyWithId = { assessmentId, ...payload };
  const bodyCandidates = [
    ["/assessment/submit-pre-survey", bodyWithId] as const,
    ["/assessments/submit-pre-survey", bodyWithId] as const,
  ];

  let lastError: unknown;
  for (const url of pathCandidates) {
    try {
      return await axiosInstance.post(url, payload);
    } catch (err) {
      lastError = err;
      if (isAxiosError(err) && err.response?.status === 404) continue;
      throw err;
    }
  }
  for (const [url, body] of bodyCandidates) {
    try {
      return await axiosInstance.post(url, body);
    } catch (err) {
      lastError = err;
      if (isAxiosError(err) && err.response?.status === 404) continue;
      throw err;
    }
  }
  throw lastError;
}

// POST /assessment/:assessmentId/send-recommendation
export const apiSendSectionRecommendations = (assessmentId: string, payload: SendSectionRecommendationsPayload) =>
  axiosInstance.post(`/assessment/${assessmentId}/send-recommendation`, payload);

// GET /assessment/:assessmentId/recommendations/:userId
export const apiGetSectionRecommendations = (assessmentId: string, userId: string) =>
  axiosInstance.get(`/assessment/${assessmentId}/recommendations/${userId}`);

// GET /assessment/:id/recommendation-rules
export const apiGetAssessmentRecommendationRules = (assessmentId: string) =>
  axiosInstance.get(`/assessment/${assessmentId}/recommendation-rules`);

// GET /assessment/assigned/:userId
export const apiGetAssignedAssessments = (userId: string) =>
  axiosInstance.get<{ success: boolean; data: AssessmentResponse[] }>(
    `/assessment/assigned/${userId}`,
    {
      params: { _cb: Date.now() },
      headers: { "Cache-Control": "no-cache", Pragma: "no-cache" },
    },
  );

//  GET /assessment/:assessmentId/answers/:userId
export const apiGetUserAnswers = (assessmentId: string, userId: string) =>
  axiosInstance.get(`/assessment/${assessmentId}/answers/${userId}`);
