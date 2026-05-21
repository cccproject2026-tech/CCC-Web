"use client";

import { mentorGlassCardFrost, mentorSpinner } from "@/app/Components/mentor/mentor-theme";
import { getVoiceNoteProcessingMessage } from "../voiceNotesUtils";
import type { VoiceNoteStatus } from "@/app/Services/types/voice-notes.types";

export default function VoiceNoteProcessingPanel({ status }: { status: string }) {
  const message = getVoiceNoteProcessingMessage(status as VoiceNoteStatus);

  return (
    <div
      className={`${mentorGlassCardFrost} mb-6 flex flex-col items-center gap-4 p-8 text-center transition-opacity duration-300 sm:p-10`}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className={mentorSpinner} aria-hidden />
      <div>
        <p className="text-lg font-semibold text-white">Processing your voice note</p>
        <p className="mt-2 text-sm text-white/70">{message}</p>
        <p className="mt-2 text-xs text-white/45">This page updates automatically. Please keep this tab open.</p>
      </div>
      <div className="flex w-full max-w-xs gap-1 px-2">
        {(["pending", "transcribing", "summarizing"] as const).map((step) => {
          const active = String(status).toLowerCase() === step;
          const done =
            (step === "pending" && ["transcribing", "summarizing"].includes(String(status).toLowerCase())) ||
            (step === "transcribing" && String(status).toLowerCase() === "summarizing");
          return (
            <div
              key={step}
              className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                active ? "bg-[#3498DB]" : done ? "bg-[#3498DB]/50" : "bg-white/15"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
