import axiosInstance from "./config/axios-instance";
import type {
  InterestResponse,
  CreateInterestPayload,
  UpdateInterestPayload,
  GetInterestsParams,
  DynamicField,
} from "./types/interests.types";

/**
 * POST /interests — public registration (no Bearer token).
 * Sending `Authorization` can make the API apply a different validation path and return 400.
 */
export const apiCreateInterest = (payload: CreateInterestPayload) =>
  axiosInstance.post<{ success: boolean; message?: string; data: InterestResponse }>(
    "/interests",
    payload,
    { skipAuth: true },
  );

// GET /interests?search=&status=
export const apiGetAllInterests = (params?: GetInterestsParams) =>
  axiosInstance.get<{ success: boolean; data: InterestResponse[] }>("/interests", { params });

// GET /interests/metadata
export const apiGetInterestMetadata = () =>
  axiosInstance.get("/interests/metadata");

// GET /interests/form-fields
export const apiGetInterestFormFields = () =>
  axiosInstance.get("/interests/form-fields");

// GET /interests/dynamic-fields
export const apiGetDynamicFields = () =>
  axiosInstance.get<{ success: boolean; data: DynamicField[] }>("/interests/dynamic-fields");

// POST /interests/dynamic-fields
export const apiAddDynamicField = (payload: DynamicField) =>
  axiosInstance.post<{ success: boolean; data: DynamicField }>("/interests/dynamic-fields", payload);

// DELETE /interests/dynamic-fields/:fieldId
export const apiRemoveDynamicField = (fieldId: string) =>
  axiosInstance.delete(`/interests/dynamic-fields/${fieldId}`);

// PATCH /interests/dynamic-fields  — replace all dynamic fields
export const apiReplaceDynamicFields = (fields: DynamicField[]) =>
  axiosInstance.patch("/interests/dynamic-fields", { fields });

// PATCH /interests/dynamic-fields/reorder
export const apiReorderDynamicFields = (fieldIds: string[]) =>
  axiosInstance.patch("/interests/dynamic-fields/reorder", { fieldIds });

// PATCH /interests/dynamic-fields/:fieldId
export const apiUpdateDynamicField = (fieldId: string, payload: Partial<DynamicField>) =>
  axiosInstance.patch(`/interests/dynamic-fields/${fieldId}`, payload);

// GET /interests/request?status=
export const apiGetInterestsByStatus = (status: string) =>
  axiosInstance.get<{ success: boolean; data: InterestResponse[] }>(
    "/interests/request",
    { params: { status } },
  );

// PATCH /interests/request/:userId  — update status (accepted | rejected)
export const apiUpdateInterestStatus = (id: string, status: "accepted" | "rejected") =>
  axiosInstance.patch<{ success: boolean; data: InterestResponse }>(
    `/interests/request/${id}`,
    { status },
  );

// GET /interests/by-id/:id
export const apiGetInterestById = (id: string) =>
  axiosInstance.get<{ success: boolean; data: InterestResponse }>(`/interests/by-id/${id}`);

// GET /interests/by-email/:email
export const apiGetInterestByEmail = (email: string) =>
  axiosInstance.get<{ success: boolean; data: InterestResponse }>(`/interests/by-email/${email}`);

// PATCH /interests/by-email/:email
export const apiUpdateInterestByEmail = (email: string, payload: UpdateInterestPayload) =>
  axiosInstance.patch<{ success: boolean; data: InterestResponse }>(
    `/interests/by-email/${email}`,
    payload,
  );

// PATCH /interests/:id
export const apiUpdateInterestById = (id: string, payload: UpdateInterestPayload) =>
  axiosInstance.patch<{ success: boolean; data: InterestResponse }>(`/interests/${id}`, payload);
