"use client";

import type { VoiceNoteStatus } from "@/app/Services/types/voice-notes.types";

const STATUS_LABELS: Record<VoiceNoteStatus, string> = {
  pending: "Pending",
  transcribing: "Transcribing",
  summarizing: "Summarizing",
  completed: "Completed",
  failed: "Failed",
};

const STATUS_TONES: Record<VoiceNoteStatus, string> = {
  pending: "bg-white/10 border-white/15 text-white/90",
  transcribing: "bg-blue-500/25 border-blue-400/30 text-blue-50",
  summarizing: "bg-indigo-500/25 border-indigo-400/30 text-indigo-50",
  completed: "bg-green-500/25 border-green-400/30 text-green-50",
  failed: "bg-red-500/25 border-red-400/30 text-red-50",
};

function normalizeStatus(status: string): VoiceNoteStatus {
  const raw = String(status || "").toLowerCase();
  if (raw in STATUS_LABELS) return raw as VoiceNoteStatus;
  return "pending";
}

export default function VoiceNoteStatusBadge({
  status,
  compact,
}: {
  status: string;
  compact?: boolean;
}) {
  const normalized = normalizeStatus(status);
  const label = STATUS_LABELS[normalized];
  const tone = STATUS_TONES[normalized];

  return (
    <span
      className={`inline-flex items-center rounded-full border font-extrabold tracking-wide ${tone} ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]"
      }`}
    >
      {label}
    </span>
  );
}
