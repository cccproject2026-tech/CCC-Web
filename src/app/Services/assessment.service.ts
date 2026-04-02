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
    if (o.data && typeof o.data === "object") {
      const d = o.data as Record<string, unknown>;
      if (Array.isArray(d.assessments)) return d.assessments as AssessmentResponse[];
      if (Array.isArray(d.items)) return d.items as AssessmentResponse[];
      if (Array.isArray(d.rows)) return d.rows as AssessmentResponse[];
    }
  }
  return [];
}

/**
 * GET /assessment/:id may return the document on the JSON root (axios `response.data`)
 * or wrapped as `{ data: assessment }` / `{ success, data }`.
 */
export function parseAssessmentDetailPayload(body: unknown): AssessmentResponse | null {
  if (body == null || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (o.data != null && typeof o.data === "object" && !Array.isArray(o.data)) {
    return parseAssessmentDetailPayload(o.data);
  }
  if ("_id" in o || "name" in o || "sections" in o || "title" in o) {
    return body as AssessmentResponse;
  }
  return null;
}

// POST /assessments
export const apiCreateAssessment = (payload: CreateAssessmentPayload) =>
  axiosInstance.post<{ success: boolean; data: AssessmentResponse }>("/assessments", payload);

// GET /assessment?search=
export const apiGetAssessments = (params?: { search?: string }) =>
  axiosInstance.get<{ success: boolean; data: AssessmentResponse[] }>("/assessment", { params });

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

// POST /assessment/:id/submit-pre-survey
export const apiSubmitPreSurvey = (assessmentId: string, payload: SubmitPreSurveyPayload) =>
  axiosInstance.post(`/assessment/${assessmentId}/submit-pre-survey`, payload);

// POST /assessment/:id/recommendations/send
export const apiSendSectionRecommendations = (assessmentId: string, payload: SendSectionRecommendationsPayload) =>
  axiosInstance.post(`/assessment/${assessmentId}/recommendations/send`, payload);

// GET /assessment/:id/recommendations
export const apiGetSectionRecommendations = (assessmentId: string, userId: string) =>
  axiosInstance.get(`/assessment/${assessmentId}/recommendations`, { params: { userId } });

// GET /assessment/assigned/:userId
export const apiGetAssignedAssessments = (userId: string) =>
  axiosInstance.get<{ success: boolean; data: AssessmentResponse[] }>(
    `/assessment/assigned/${userId}`
  );

//  GET /assessment/:assessmentId/answers/:userId
export const apiGetUserAnswers = (assessmentId: string, userId: string) =>
  axiosInstance.get(`/assessment/${assessmentId}/answers/${userId}`);