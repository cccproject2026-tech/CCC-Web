import type { TranscriptSummaryDto } from "@/app/Services/types/appointments.types";
import type { VoiceNoteStatus } from "@/app/Services/types/voice-notes.types";

export type VoiceNotesVariant = "mentor" | "pastor";

export const VOICE_NOTE_STATUS_FILTER_OPTIONS: { value: "all" | VoiceNoteStatus; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "transcribing", label: "Transcribing" },
  { value: "summarizing", label: "Summarizing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
];

export const VOICE_NOTE_MAX_BYTES = 25 * 1024 * 1024;

/** File input `accept` — extensions + common MIME hints for mobile pickers */
export const VOICE_NOTE_FILE_ACCEPT =
  ".mp3,.wav,.m4a,.webm,.ogg,.opus,.mp4,.3gp,audio/mpeg,audio/wav,audio/webm,audio/mp4,audio/x-m4a,audio/m4a,audio/ogg,audio/opus,audio/3gpp,audio/quicktime,video/mp4,video/3gpp,application/ogg";

export const VOICE_NOTE_SUPPORTED_FORMATS_LABEL =
  "MP3, WAV, M4A, WEBM, OGG, OPUS, MP4, 3GP";

const VOICE_NOTE_UNSUPPORTED_MESSAGE = `Supported formats:\n${VOICE_NOTE_SUPPORTED_FORMATS_LABEL}`;

const ACCEPTED_MIME = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/webm",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/ogg",
  "audio/opus",
  "audio/3gpp",
  "audio/quicktime",
  "video/mp4",
  "video/3gpp",
  "application/ogg",
]);

const ALLOWED_EXTENSIONS = new Set(["mp3", "wav", "m4a", "webm", "ogg", "opus", "mp4", "3gp"]);

const ACCEPTED_EXT_PATTERN = /\.(mp3|wav|m4a|webm|ogg|opus|mp4|3gp)$/i;

function fileExtension(name: string): string {
  const m = name.trim().match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "";
}

function isAcceptedMime(mime: string): boolean {
  const t = mime.trim().toLowerCase();
  if (!t) return false;
  if (ACCEPTED_MIME.has(t)) return true;
  // e.g. audio/ogg; codecs=opus
  const base = t.split(";")[0]?.trim();
  return base ? ACCEPTED_MIME.has(base) : false;
}

function isAcceptedByExtension(fileName: string): boolean {
  if (!ACCEPTED_EXT_PATTERN.test(fileName)) return false;
  const ext = fileExtension(fileName);
  return ALLOWED_EXTENSIONS.has(ext);
}

export function voiceNotesBasePath(variant: VoiceNotesVariant): string {
  return variant === "mentor" ? "/mentor/voice-notes" : "/pastor/voice-notes";
}

export function formatVoiceNoteDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^/.]+$/, "").trim();
  return base || "Voice note";
}

export function validateVoiceNoteFile(file: File): string | null {
  if (file.size > VOICE_NOTE_MAX_BYTES) {
    return "File must be 25 MB or smaller.";
  }

  const mime = file.type.trim().toLowerCase();
  const extOk = isAcceptedByExtension(file.name);

  // Mobile apps often send application/octet-stream or empty MIME for valid voice files
  if (!mime || mime === "application/octet-stream") {
    return extOk ? null : VOICE_NOTE_UNSUPPORTED_MESSAGE;
  }

  const mimeOk = isAcceptedMime(mime);
  if (mimeOk || extOk) return null;

  return VOICE_NOTE_UNSUPPORTED_MESSAGE;
}

export function isVoiceNoteProcessing(status: string): boolean {
  const s = String(status || "").toLowerCase();
  return s === "pending" || s === "transcribing" || s === "summarizing";
}

export function getVoiceNoteProcessingMessage(status: VoiceNoteStatus | string): string {
  const s = String(status || "").toLowerCase();
  if (s === "pending") return "Uploading audio…";
  if (s === "transcribing") return "Generating transcript…";
  if (s === "summarizing") return "Creating AI summary…";
  return "Processing…";
}

export function filterVoiceNotesList<T extends { title: string; status: string }>(
  notes: T[],
  search: string,
  statusFilter: "all" | VoiceNoteStatus,
): T[] {
  const q = search.trim().toLowerCase();
  return notes.filter((n) => {
    const statusOk = statusFilter === "all" || String(n.status).toLowerCase() === statusFilter;
    const titleOk = !q || n.title.toLowerCase().includes(q);
    return statusOk && titleOk;
  });
}

export function hasVoiceNoteTranscriptSummary(
  summary: TranscriptSummaryDto | null | undefined,
): boolean {
  if (!summary) return false;
  return !!(
    summary.sessionOverview?.trim() ||
    summary.keyDiscussionPoints?.length ||
    summary.mentorGuidance?.length ||
    summary.actionItems?.length ||
    summary.followUp?.trim()
  );
}
