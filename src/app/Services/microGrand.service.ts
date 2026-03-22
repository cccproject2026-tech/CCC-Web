import axiosInstance from "./config/axios-instance";
import type {
  MicroGrantForm,
  MicroGrantApplicationResponse,
  MicroGrantWithUserResponse,
  CreateOrUpdateFormPayload,
  UpdateApplicationStatusPayload,
  MicroGrantStatus,
} from "./types/microgrant.types";

// GET /microgrant/form
export const getMicroGrantForm = () =>
  axiosInstance.get<{ success: boolean; data: MicroGrantForm }>("/microgrant/form");

// POST /microgrant/form  or  PUT /microgrant/form
export const createOrUpdateMicroGrantForm = (payload: CreateOrUpdateFormPayload) =>
  axiosInstance.post<{ success: boolean; data: MicroGrantForm }>("/microgrant/form", payload);

// GET /microgrant/applications
export const getAllMicroGrand = () =>
  axiosInstance.get<{ success: boolean; data: MicroGrantApplicationResponse[] }>(
    "/microgrant/applications",
  );

// GET /microgrant/application/:userId
export const getMicroGrantByUserId = (userId: string) =>
  axiosInstance.get<{ success: boolean; data: MicroGrantWithUserResponse }>(
    `/microgrant/application/${userId}`,
  );

// POST /microgrant/apply  (multipart/form-data when supporting docs included)
export const applyMicroGrant = (
  userId: string,
  formId: string,
  answers: Record<string, string>,
  supportingDocs?: File[],
) => {
  if (supportingDocs && supportingDocs.length > 0) {
    const formData = new FormData();
    formData.append("userId", userId);
    formData.append("formId", formId);
    formData.append("answers", JSON.stringify(answers));
    supportingDocs.forEach((file) => formData.append("files", file));
    return axiosInstance.post<{ success: boolean; data: MicroGrantApplicationResponse }>(
      "/microgrant/apply",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
  }
  return axiosInstance.post<{ success: boolean; data: MicroGrantApplicationResponse }>(
    "/microgrant/apply",
    { userId, formId, answers },
  );
};

// PATCH /microgrant/application/:applicationId/status  body: { status }
export const updateMicroGrantStatus = (
  applicationId: string,
  status: MicroGrantStatus,
) =>
  axiosInstance.patch<{ success: boolean; data: MicroGrantApplicationResponse }>(
    `/microgrant/application/${applicationId}/status`,
    { status } as UpdateApplicationStatusPayload,
  );
