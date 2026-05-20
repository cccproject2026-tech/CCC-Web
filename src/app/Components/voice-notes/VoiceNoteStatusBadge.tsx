"use client";

import type { VoiceNoteStatus } from "@/app/Services/types/voice-notes.types";
import { isVoiceNoteProcessing } from "./voiceNotesUtils";

const STATUS_LABELS: Record<VoiceNoteStatus, string> = {
  pending: "Pending",
  transcribing: "Transcribing",
  summarizing: "Summarizing",
  completed: "Completed",
  failed: "Failed",
};

const STATUS_TONES: Record<VoiceNoteStatus, string> = {
  pending: "bg-slate-500/20 border-slate-400/25 text-slate-100",
  transcribing: "bg-blue-500/25 border-blue-400/35 text-blue-50",
  summarizing: "bg-indigo-500/25 border-indigo-400/35 text-indigo-50",
  completed: "bg-emerald-500/25 border-emerald-400/35 text-emerald-50",
  failed: "bg-red-500/25 border-red-400/35 text-red-50",
};

const STATUS_ICONS: Record<VoiceNoteStatus, string> = {
  pending: "fa-solid fa-clock",
  transcribing: "fa-solid fa-wave-square",
  summarizing: "fa-solid fa-wand-magic-sparkles",
  completed: "fa-solid fa-circle-check",
  failed: "fa-solid fa-circle-exclamation",
};

function normalizeStatus(status: string): VoiceNoteStatus {
  const raw = String(status || "").toLowerCase();
  if (raw in STATUS_LABELS) return raw as VoiceNoteStatus;
  return "pending";
}

export default function VoiceNoteStatusBadge({
  status,
  compact,
  showIcon = true,
}: {
  status: string;
  compact?: boolean;
  showIcon?: boolean;
}) {
  const normalized = normalizeStatus(status);
  const label = STATUS_LABELS[normalized];
  const tone = STATUS_TONES[normalized];
  const pulsing = isVoiceNoteProcessing(normalized);

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1.5 rounded-full border font-bold tracking-wide ${tone} ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]"
      } ${pulsing ? "animate-pulse" : ""}`}
    >
      {showIcon ? (
        <i className={`${STATUS_ICONS[normalized]} shrink-0 ${compact ? "text-[9px]" : "text-[10px]"}`} aria-hidden />
      ) : null}
      <span className="truncate">{label}</span>
    </span>
  );
}
