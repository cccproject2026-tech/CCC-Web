import axiosInstance from "./config/axios-instance";
import type {
  ApiListEnvelope,
  VoiceNoteDetailDto,
  VoiceNoteListItemDto,
  VoiceNoteUploadResponseDto,
} from "./types/voice-notes.types";

function unwrapData<T>(res: { data?: ApiListEnvelope<T> | T }): T {
  const body = res.data;
  if (body == null) return body as T;
  if (typeof body === "object" && "data" in (body as object) && (body as ApiListEnvelope<T>).data !== undefined) {
    return (body as ApiListEnvelope<T>).data as T;
  }
  return body as T;
}

export const uploadVoiceNote = (
  file: File,
  options?: { title?: string; onUploadProgress?: (percent: number) => void },
) => {
  const formData = new FormData();
  formData.append("audio", file);
  if (options?.title?.trim()) formData.append("title", options.title.trim());

  return axiosInstance
    .post<ApiListEnvelope<VoiceNoteUploadResponseDto>>("/voice-notes", formData, {
      onUploadProgress: (evt) => {
        if (!options?.onUploadProgress || !evt.total) return;
        const percent = Math.round((evt.loaded * 100) / evt.total);
        options.onUploadProgress(percent);
      },
    })
    .then((res) => unwrapData<VoiceNoteUploadResponseDto>(res));
};

export const getVoiceNotes = () =>
  axiosInstance
    .get<ApiListEnvelope<VoiceNoteListItemDto[]>>("/voice-notes")
    .then((res) => {
      const data = unwrapData<VoiceNoteListItemDto[] | VoiceNoteListItemDto>(res);
      const list = Array.isArray(data) ? data : [];
      return [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    });

export const getVoiceNoteById = (id: string) =>
  axiosInstance
    .get<ApiListEnvelope<VoiceNoteDetailDto>>(`/voice-notes/${encodeURIComponent(id)}`)
    .then((res) => unwrapData<VoiceNoteDetailDto>(res));

export const deleteVoiceNote = (id: string) =>
  axiosInstance.delete<ApiListEnvelope<unknown>>(`/voice-notes/${encodeURIComponent(id)}`);
