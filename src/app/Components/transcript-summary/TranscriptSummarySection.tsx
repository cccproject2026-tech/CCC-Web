"use client";

import { useState } from "react";
import type { TranscriptSummaryDto } from "@/app/Services/types/appointments.types";
import { useToast } from "@/app/Components/ui/Toast";
import TranscriptChatView from "./TranscriptChatView";
import TranscriptSummaryView from "./TranscriptSummaryView";

type Tab = "transcript" | "summary";

type TranscriptSummarySectionProps = {
  transcript?: string;
  summary?: TranscriptSummaryDto | null;
  isLoading?: boolean;
  sectionTitle?: string;
  defaultTab?: Tab;
};

function buildSummaryCopyText(summary: TranscriptSummaryDto): string {
  return [
    summary.sessionOverview ? `Session Overview:\n${summary.sessionOverview}` : "",
    summary.keyDiscussionPoints?.length
      ? `\nKey Discussion Points:\n- ${summary.keyDiscussionPoints.join("\n- ")}`
      : "",
    summary.mentorGuidance?.length
      ? `\nMentor Guidance:\n- ${summary.mentorGuidance.join("\n- ")}`
      : "",
    summary.actionItems?.length ? `\nAction Items:\n- ${summary.actionItems.join("\n- ")}` : "",
    summary.followUp ? `\nFollow-up:\n${summary.followUp}` : "",
  ]
    .filter(Boolean)
    .join("\n")
    .trim();
}

export default function TranscriptSummarySection({
  transcript,
  summary,
  isLoading = false,
  sectionTitle = "Transcript & AI Summary",
  defaultTab = "transcript",
}: TranscriptSummarySectionProps) {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>(defaultTab);

  return (
    <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.03)_100%)] p-6">
      <div className="text-sm font-semibold text-[#8ec5eb]">{sectionTitle}</div>

      <div className="mt-5">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#041f35]/40 p-2">
          <button
            type="button"
            onClick={() => setTab("transcript")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === "transcript"
                ? "bg-white text-[#062946]"
                : "bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            Transcript
          </button>
          <button
            type="button"
            onClick={() => setTab("summary")}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              tab === "summary"
                ? "bg-white text-[#062946]"
                : "bg-white/5 text-white/80 hover:bg-white/10"
            }`}
          >
            AI Summary
          </button>
        </div>

        {tab === "transcript" ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#041f35]/40 p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/90">Transcript</div>
              <button
                type="button"
                onClick={() => {
                  const text = String(transcript ?? "").trim();
                  if (!text) {
                    toast.show({ kind: "info", title: "Nothing to copy" });
                    return;
                  }
                  void navigator.clipboard.writeText(text);
                  toast.show({ kind: "success", title: "Transcript copied" });
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
              >
                Copy
              </button>
            </div>
            <TranscriptChatView transcript={transcript} isLoading={isLoading} />
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#041f35]/40 p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/90">AI Summary</div>
              <button
                type="button"
                onClick={() => {
                  if (!summary) {
                    toast.show({ kind: "info", title: "Nothing to copy" });
                    return;
                  }
                  const lines = buildSummaryCopyText(summary);
                  if (!lines) {
                    toast.show({ kind: "info", title: "Nothing to copy" });
                    return;
                  }
                  void navigator.clipboard.writeText(lines);
                  toast.show({ kind: "success", title: "Summary copied" });
                }}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
              >
                Copy
              </button>
            </div>
            <TranscriptSummaryView summary={summary} isLoading={isLoading} />
          </div>
        )}
      </div>
    </div>
  );
}
