import axiosInstance from "./config/axios-instance";
import type {
  MediaResponse,
  MediaType,
  CreateMediaPayload,
  UpdateMediaPayload,
} from "./types/home.types";

// GET /home/media?type=
export const getAllMedia = (type?: MediaType) =>
  axiosInstance.get<{ success: boolean; data: MediaResponse[] }>(
    "/home/media",
    { params: type ? { type } : undefined },
  );

// GET /home/media?type=video|image
export const getMediaByType = (type: MediaType) =>
  axiosInstance.get<{ success: boolean; data: MediaResponse[] }>("/home/media", { params: { type } });

// GET /home/media/:id
export const getMediaById = (id: string) =>
  axiosInstance.get<{ success: boolean; data: MediaResponse }>(`/home/media/${id}`);

// POST /home/media  (multipart/form-data, field: files[])
export const createMedia = (payload: CreateMediaPayload) => {
  const formData = new FormData();
  formData.append("heading", payload.heading);
  if (payload.subheading) formData.append("subheading", payload.subheading);
  if (payload.description) formData.append("description", payload.description);
  if (payload.defaultType) formData.append("defaultType", payload.defaultType);
  payload.files.forEach((file) => formData.append("files", file));
  return axiosInstance.post<{ success: boolean; data: MediaResponse }>(
    "/home/media",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
};

// PATCH /home/media/:id
export const updateMedia = (mediaId: string, payload: UpdateMediaPayload) =>
  axiosInstance.patch<{ success: boolean; data: MediaResponse }>(`/home/media/${mediaId}`, payload);

// DELETE /home/media/:id
export const deleteMedia = (mediaId: string) =>
  axiosInstance.delete<{ success: boolean; message: string }>(`/home/media/${mediaId}`);

// POST /home/media/bulk-delete  body: { mediaIds }
export const deleteMultipleMedia = (mediaIds: string[]) =>
  axiosInstance.post<{ success: boolean; message: string }>("/home/media/bulk-delete", { mediaIds });
