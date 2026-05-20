export type VoiceNotesVariant = "mentor" | "pastor";

export const VOICE_NOTE_MAX_BYTES = 25 * 1024 * 1024;

const ACCEPTED_MIME = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/x-wav",
  "audio/wave",
  "audio/mp4",
  "audio/x-m4a",
  "audio/m4a",
  "audio/webm",
]);

const ACCEPTED_EXT = /\.(mp3|wav|m4a|webm)$/i;

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
  const mimeOk = file.type ? ACCEPTED_MIME.has(file.type) : false;
  const extOk = ACCEPTED_EXT.test(file.name);
  if (!mimeOk && !extOk) {
    return "Supported formats: MP3, WAV, M4A, and WebM.";
  }
  return null;
}

export function isVoiceNoteProcessing(status: string): boolean {
  const s = String(status || "").toLowerCase();
  return s === "pending" || s === "transcribing" || s === "summarizing";
}
