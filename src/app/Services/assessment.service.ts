import { isAxiosError } from "axios";
import axiosInstance from "./config/axios-instance";
import type {
  AssessmentResponse,
  CreateAssessmentPayload,
  Section,
  SubmitSectionAnswersPayload,
  SubmitPreSurveyPayload,
  SendSectionRecommendationsPayload,
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

// POST /assessments
export const apiCreateAssessment = (payload: CreateAssessmentPayload) =>
  axiosInstance.post<{ success: boolean; data: AssessmentResponse }>("/assessments", payload);

/** List calls can be slow on large datasets; avoid default 10s axios timeout. */
const GET_ASSESSMENTS_TIMEOUT_MS = 60_000;

// GET /assessment?search=
export const apiGetAssessments = (params?: { search?: string }) =>
  axiosInstance.get<{ success: boolean; data: AssessmentResponse[] }>("/assessment", {
    params,
    timeout: GET_ASSESSMENTS_TIMEOUT_MS,
  });

// GET /assessment/:id
export const apiGetAssessmentById = (id: string) => {
  if (!id) throw new Error("Assessment ID is required");
  return axiosInstance.get<{ success: boolean; data: AssessmentResponse }>(`/assessment/${id}`);
};

// DELETE /assessment  body: { ids }
export const apiDeleteAssessments = (ids: string[]) =>
  axiosInstance.delete<{ success: boolean; message: string }>("/assessment", { data: { ids } });

// PATCH /assessment/:id/instructions  body: { instructions }
export const apiUpdateInstructions = (assessmentId: string, instructions: string[]) =>
  axiosInstance.patch<{ success: boolean; data: AssessmentResponse }>(
    `/assessment/${assessmentId}/instructions`,
    { instructions },
  );

// PATCH /assessment/:id/sections  body: { sections }
export const apiUpdateSections = (assessmentId: string, sections: Section[]) =>
  axiosInstance.patch<{ success: boolean; data: AssessmentResponse }>(
    `/assessment/${assessmentId}/sections`,
    { sections },
  );

// POST /assessment/:id/banner  (multipart, field: image)
export const apiUploadAssessmentBanner = (assessmentId: string, file: File) => {
  const formData = new FormData();
  formData.append("image", file);
  return axiosInstance.post<{ success: boolean; data: { bannerImage: string } }>(
    `/assessment/${assessmentId}/banner`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
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

// POST /assessment/:id/recommendations/send
export const apiSendSectionRecommendations = (assessmentId: string, payload: SendSectionRecommendationsPayload) =>
  axiosInstance.post(`/assessment/${assessmentId}/recommendations/send`, payload);

// GET /assessment/:id/recommendations
export const apiGetSectionRecommendations = (assessmentId: string, userId: string) =>
  axiosInstance.get(`/assessment/${assessmentId}/recommendations`, { params: { userId } });

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