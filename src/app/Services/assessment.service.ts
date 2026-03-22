import axiosInstance from "./config/axios-instance";
import type {
  AssessmentResponse,
  CreateAssessmentPayload,
  Section,
  SubmitSectionAnswersPayload,
  SubmitPreSurveyPayload,
  SendSectionRecommendationsPayload,
} from "./types/assessment.types";

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

// POST /assessment/:id/submit-section-answers
export const apiSubmitSectionAnswers = (assessmentId: string, payload: SubmitSectionAnswersPayload) =>
  axiosInstance.post(`/assessment/${assessmentId}/submit-section-answers`, payload);

// POST /assessment/:id/submit-pre-survey
export const apiSubmitPreSurvey = (assessmentId: string, payload: SubmitPreSurveyPayload) =>
  axiosInstance.post(`/assessment/${assessmentId}/submit-pre-survey`, payload);

// POST /assessment/:id/recommendations/send
export const apiSendSectionRecommendations = (assessmentId: string, payload: SendSectionRecommendationsPayload) =>
  axiosInstance.post(`/assessment/${assessmentId}/recommendations/send`, payload);

// GET /assessment/:id/recommendations
export const apiGetSectionRecommendations = (assessmentId: string, userId: string) =>
  axiosInstance.get(`/assessment/${assessmentId}/recommendations`, { params: { userId } });
