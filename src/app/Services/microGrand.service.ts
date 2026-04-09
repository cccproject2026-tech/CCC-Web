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

/** Normalize GET /microgrant/applications response (envelope shapes differ). */
export function unwrapMicroGrantApplicationsList(res: { data?: unknown }): MicroGrantApplicationResponse[] {
  const root = res?.data as Record<string, unknown> | unknown[] | undefined | null;
  if (root == null) return [];
  if (Array.isArray(root)) return root;
  if (typeof root === "object") {
    const r = root as Record<string, unknown>;
    const candidates = [r.data, r.applications, r.items, r.records];
    for (const inner of candidates) {
      if (Array.isArray(inner)) return inner as MicroGrantApplicationResponse[];
    }
  }
  return [];
}

/**
 * ID used to open GET `/microgrant/application/:id` from a list row.
 * APIs often return `userId` as a string id; when populated it is `{ _id, email, ... }`.
 */
export function getMicroGrantApplicantUserId(app: MicroGrantApplicationResponse): string | undefined {
  const u = app.userId as unknown;
  if (typeof u === "string" && u.trim()) return u.trim();
  if (u && typeof u === "object" && "_id" in (u as object)) {
    const id = (u as { _id?: string })._id;
    if (id != null && String(id).trim() !== "") return String(id);
  }
  return undefined;
}

/** Unwrap GET `/microgrant/application/:userId` — envelope shapes differ by deploy/version. */
export function unwrapMicroGrantWithUser(res: { data?: unknown }): MicroGrantWithUserResponse | null {
  const root = res?.data;
  if (root == null || typeof root !== "object") return null;
  const r = root as Record<string, unknown>;
  const inner = r.data;
  if (inner && typeof inner === "object") {
    const p = inner as Record<string, unknown>;
    if (p.user && p.application) return inner as MicroGrantWithUserResponse;
  }
  if (r.user && r.application) return r as unknown as MicroGrantWithUserResponse;
  return null;
}

export function getMicroGrantApplicantEmail(app: MicroGrantApplicationResponse): string | undefined {
  const u = app.userId;
  if (u && typeof u === "object" && typeof (u as { email?: string }).email === "string") {
    return (u as { email: string }).email;
  }
  return undefined;
}

/** Prefer applicant user id for detail URL; fall back to application id if the list row has no user ref. */
export function microGrantListDetailSlug(app: MicroGrantApplicationResponse): string | undefined {
  return getMicroGrantApplicantUserId(app) ?? (app._id ? String(app._id) : undefined);
}
