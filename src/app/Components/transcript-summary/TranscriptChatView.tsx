"use client";

import { useMemo } from "react";
import { parseTranscriptToChatMessages } from "./parseTranscript";

type TranscriptChatViewProps = {
  transcript?: string;
  isLoading?: boolean;
  emptyMessage?: string;
  /** Improved spacing/typography for voice notes (mentoring session unchanged). */
  enhanced?: boolean;
};

export default function TranscriptChatView({
  transcript,
  isLoading = false,
  emptyMessage = "No transcript available yet.",
  enhanced = false,
}: TranscriptChatViewProps) {
  const chatMessages = useMemo(
    () => parseTranscriptToChatMessages(String(transcript ?? "")),
    [transcript],
  );

  const scrollClass = enhanced
    ? "max-h-[min(70vh,560px)] overflow-y-auto overscroll-contain scroll-smooth rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
    : "max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-white/5 p-4";

  return (
    <div className={scrollClass}>
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-3 w-11/12 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-10/12 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-9/12 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-8/12 animate-pulse rounded bg-white/10" />
        </div>
      ) : chatMessages.length ? (
        <div className={`mx-auto w-full ${enhanced ? "max-w-3xl space-y-3" : "space-y-2"}`}>
          {chatMessages.map((m, i) => (
            <div
              key={`${m.speaker}-${i}`}
              className={`flex ${m.side === "right" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[92%] rounded-2xl border px-3 py-2.5 shadow-sm ${
                  enhanced ? "text-sm leading-relaxed" : "text-[12px] leading-relaxed"
                } ${
                  m.side === "right"
                    ? "border-emerald-400/20 bg-emerald-500/15 text-emerald-50"
                    : "border-white/10 bg-white/8 text-white/85"
                }`}
              >
                {m.speaker ? (
                  <div
                    className={`mb-1 text-[10px] font-semibold uppercase tracking-wide ${
                      m.side === "right" ? "text-emerald-200/80" : "text-white/55"
                    }`}
                  >
                    {m.speaker}
                  </div>
                ) : null}
                <div className="whitespace-pre-wrap">{m.text}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-white/60">{emptyMessage}</div>
      )}
    </div>
  );
}
