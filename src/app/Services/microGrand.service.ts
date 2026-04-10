import { isAxiosError } from "axios";
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

/** Normalize list/API `supportingDocs` (strings or `{ name, url }`) for UI. */
export function normalizeMicroGrantSupportingDocs(
  raw: unknown,
): { name: string; url: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((doc, idx) => {
    if (typeof doc === "string") {
      const looksUrl = /^https?:\/\//i.test(doc);
      return {
        name: looksUrl ? `Document ${idx + 1}` : doc,
        url: looksUrl ? doc : "#",
      };
    }
    if (doc && typeof doc === "object") {
      const o = doc as { name?: string; url?: string };
      const url = typeof o.url === "string" ? o.url : "#";
      const name =
        typeof o.name === "string" && o.name ? o.name : `Document ${idx + 1}`;
      return { name, url };
    }
    return { name: `Document ${idx + 1}`, url: "#" };
  });
}

function buildMicroGrantDetailFromListApplication(
  app: MicroGrantApplicationResponse,
): MicroGrantWithUserResponse | null {
  const uid = getMicroGrantApplicantUserId(app);
  if (!uid) return null;
  const u = app.userId;
  let email = "—";
  let role = "pastor";
  if (u && typeof u === "object") {
    const o = u as { email?: string; role?: string };
    if (typeof o.email === "string" && o.email) email = o.email;
    if (typeof o.role === "string" && o.role) role = o.role;
  }
  const answers =
    app.answers && typeof app.answers === "object" && !Array.isArray(app.answers)
      ? (app.answers as Record<string, string>)
      : {};
  return {
    user: { _id: uid, email, role },
    application: {
      ...app,
      answers,
      supportingDocs: Array.isArray(app.supportingDocs) ? app.supportingDocs : [],
    },
  };
}

/**
 * Detail route may use applicant user id or application `_id` (see `microGrantListDetailSlug`).
 * GET `/microgrant/application/:userId` only accepts user id — resolve application id via list + retry.
 */
export async function loadMicroGrantDetailBySlug(
  slug: string,
): Promise<MicroGrantWithUserResponse | null> {
  const s = slug.trim();
  if (!s) return null;

  let firstError: unknown;
  try {
    const res = await getMicroGrantByUserId(s);
    const u = unwrapMicroGrantWithUser(res);
    if (u) return u;
  } catch (e) {
    firstError = e;
    if (isAxiosError(e) && e.response?.status === 401) throw e;
  }

  try {
    const listRes = await getAllMicroGrand();
    const list = unwrapMicroGrantApplicationsList(listRes);

    const byAppId = list.find((a) => String(a._id) === s);
    if (byAppId) {
      const uid = getMicroGrantApplicantUserId(byAppId);
      if (uid && uid !== s) {
        try {
          const res2 = await getMicroGrantByUserId(uid);
          const u2 = unwrapMicroGrantWithUser(res2);
          if (u2) return u2;
        } catch (e) {
          if (isAxiosError(e) && e.response?.status === 401) throw e;
        }
      }
      const built = buildMicroGrantDetailFromListApplication(byAppId);
      if (built) return built;
    }

    const byUserInList = list.find((a) => getMicroGrantApplicantUserId(a) === s);
    if (byUserInList) {
      const built = buildMicroGrantDetailFromListApplication(byUserInList);
      if (built) return built;
    }
  } catch (e) {
    if (isAxiosError(e) && e.response?.status === 401) throw e;
    console.error("loadMicroGrantDetailBySlug list fallback", e);
  }

  if (firstError && process.env.NODE_ENV === "development") {
    console.warn("loadMicroGrantDetailBySlug: direct fetch failed, slug=", s, firstError);
  }
  return null;
}
