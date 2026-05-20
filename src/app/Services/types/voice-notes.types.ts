import type { TranscriptSummaryDto } from "./appointments.types";

export type VoiceNoteStatus =
  | "pending"
  | "transcribing"
  | "summarizing"
  | "completed"
  | "failed";

export interface VoiceNoteListItemDto {
  id: string;
  title: string;
  status: VoiceNoteStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface VoiceNoteDetailDto extends VoiceNoteListItemDto {
  audioUrl?: string;
  transcript?: string;
  /** AI summary payload from GET /voice-notes/:id */
  transcriptSummary?: TranscriptSummaryDto;
  errorMessage?: string;
}

export interface VoiceNoteUploadResponseDto {
  id: string;
  title?: string;
  status: VoiceNoteStatus;
  createdAt?: string;
}

export interface ApiListEnvelope<T> {
  success?: boolean;
  message?: string;
  data?: T;
}
