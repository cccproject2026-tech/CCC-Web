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
  enhanced?: boolean;
  disabled?: boolean;
};

function cleanSummaryString(value: unknown): string {
  if (typeof value !== "string") return "";

  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function parseMaybeJsonSummary(value: unknown): Partial<TranscriptSummaryDto> | null {
  if (!value) return null;

  if (typeof value === "object") {
    return value as Partial<TranscriptSummaryDto>;
  }

  if (typeof value !== "string") return null;

  const cleaned = cleanSummaryString(value);

  try {
    return JSON.parse(cleaned) as Partial<TranscriptSummaryDto>;
  } catch {
    return null;
  }
}

function asTextList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item ?? "").trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    const cleaned = cleanSummaryString(value);
    if (!cleaned) return [];

    return cleaned
      .split(/\n+/)
      .map((line) => line.replace(/^[-•*]\s*/, "").trim())
      .filter(Boolean);
  }

  return [];
}

// function normalizeTranscriptSummary(summary: unknown): TranscriptSummaryDto | null {
//   if (!summary) return null;

//   const parsed = parseMaybeJsonSummary(summary);
//   const source = parsed && typeof parsed === "object" ? parsed : {};

//   return {
//     sessionOverview: String(
//       source.sessionOverview ??
//         (source as any).overview ??
//         (source as any).summary ??
//         ""
//     ).trim(),

//     keyDiscussionPoints: asTextList(
//       source.keyDiscussionPoints ??
//         (source as any).discussionPoints ??
//         (source as any).keyPoints
//     ),

//     mentorGuidance: asTextList(
//       source.mentorGuidance ??
//         (source as any).guidance ??
//         (source as any).recommendations
//     ),

//     actionItems: asTextList(
//       source.actionItems ??
//         (source as any).actions ??
//         (source as any).nextSteps
//     ),

//     followUp: String(
//       source.followUp ??
//         (source as any).follow_up ??
//         (source as any).followup ??
//         ""
//     ).trim(),
//   };
// }

function looksLikeJsonSummaryText(value: unknown): boolean {
  if (typeof value !== "string") return false;
  const cleaned = cleanSummaryString(value);
  return (
    cleaned.includes('"sessionOverview"') ||
    cleaned.includes('"keyDiscussionPoints"') ||
    cleaned.includes('"mentorGuidance"') ||
    cleaned.includes('"actionItems"') ||
    cleaned.includes('"followUp"')
  );
}

function extractEmbeddedJsonSummary(summary: unknown): Partial<TranscriptSummaryDto> | null {
  if (!summary) return null;

  if (typeof summary === "string") {
    return parseMaybeJsonSummary(summary);
  }

  if (typeof summary !== "object") return null;

  const source = summary as any;

  const candidates: unknown[] = [
    source.sessionOverview,
    source.followUp,
    ...(Array.isArray(source.keyDiscussionPoints) ? source.keyDiscussionPoints : []),
    ...(Array.isArray(source.mentorGuidance) ? source.mentorGuidance : []),
    ...(Array.isArray(source.actionItems) ? source.actionItems : []),
  ];

  for (const candidate of candidates) {
    if (!looksLikeJsonSummaryText(candidate)) continue;

    const parsed = parseMaybeJsonSummary(candidate);
    if (parsed) return parsed;
  }

  return null;
}

function normalizeTranscriptSummary(summary: unknown): TranscriptSummaryDto | null {
  if (!summary) return null;

  const embeddedJson = extractEmbeddedJsonSummary(summary);
  const parsed = embeddedJson ?? parseMaybeJsonSummary(summary);
  const source = parsed && typeof parsed === "object" ? parsed : {};

  return {
    sessionOverview: String(
      source.sessionOverview ??
        (source as any).overview ??
        (source as any).summary ??
        ""
    ).trim(),

    keyDiscussionPoints: asTextList(
      source.keyDiscussionPoints ??
        (source as any).discussionPoints ??
        (source as any).keyPoints
    ),

    mentorGuidance: asTextList(
      source.mentorGuidance ??
        (source as any).guidance ??
        (source as any).recommendations
    ),

    actionItems: asTextList(
      source.actionItems ??
        (source as any).actions ??
        (source as any).nextSteps
    ),

    followUp: String(
      source.followUp ??
        (source as any).follow_up ??
        (source as any).followup ??
        ""
    ).trim(),
  };
}

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

// function buildSummaryCopyText(summary: TranscriptSummaryDto): string {
//   return [
//     summary.sessionOverview ? `Session Overview:\n${summary.sessionOverview}` : "",
//     summary.keyDiscussionPoints?.length
//       ? `\nKey Discussion Points:\n- ${summary.keyDiscussionPoints.join("\n- ")}`
//       : "",
//     summary.mentorGuidance?.length
//       ? `\nMentor Guidance:\n- ${summary.mentorGuidance.join("\n- ")}`
//       : "",
//     summary.actionItems?.length ? `\nAction Items:\n- ${summary.actionItems.join("\n- ")}` : "",
//     summary.followUp ? `\nFollow-up:\n${summary.followUp}` : "",
//   ]
//     .filter(Boolean)
//     .join("\n")
//     .trim();
// }

export default function TranscriptSummarySection({
  transcript,
  summary,
  isLoading = false,
  sectionTitle = "Transcript & AI Summary",
  defaultTab = "transcript",
  enhanced = false,
  disabled = false,
}: TranscriptSummarySectionProps) {
  // const toast = useToast();
  // const [tab, setTab] = useState<Tab>(defaultTab);

  const toast = useToast();
const [tab, setTab] = useState<Tab>(defaultTab);
const normalizedSummary = normalizeTranscriptSummary(summary);

  return (
    <div className="rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.03)_100%)] p-6">
      <div className="text-sm font-semibold text-[#8ec5eb]">{sectionTitle}</div>

      <div className="mt-5">
        <div
          className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-[#041f35]/40 p-2"
          role="tablist"
          aria-label="Transcript and summary"
        >
          <button
            type="button"
            onClick={() => setTab("transcript")}
            disabled={disabled}
            role="tab"
            aria-selected={tab === "transcript"}
            className={`min-h-[40px] rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3498DB] disabled:cursor-not-allowed disabled:opacity-50 ${
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
            disabled={disabled}
            role="tab"
            aria-selected={tab === "summary"}
            className={`min-h-[40px] rounded-xl px-4 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3498DB] disabled:cursor-not-allowed disabled:opacity-50 ${
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
                aria-label="Copy transcript to clipboard"
                className="min-h-[36px] rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3498DB]"
              >
                Copy Transcript
              </button>
            </div>
            <TranscriptChatView transcript={transcript} isLoading={isLoading} enhanced={enhanced} />
          </div>
        ) : (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#041f35]/40 p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-white/90">AI Summary</div>
              <button
                type="button"
                onClick={() => {
                  // if (!summary) {
                  //   toast.show({ kind: "info", title: "Nothing to copy" });
                  //   return;
                  // }
                  // const lines = buildSummaryCopyText(summary);

                  if (!normalizedSummary) {
  toast.show({ kind: "info", title: "Nothing to copy" });
  return;
}
const lines = buildSummaryCopyText(normalizedSummary);
                  if (!lines) {
                    toast.show({ kind: "info", title: "Nothing to copy" });
                    return;
                  }
                  void navigator.clipboard.writeText(lines);
                  toast.show({ kind: "success", title: "Summary copied" });
                }}
                aria-label="Copy AI summary to clipboard"
                className="min-h-[36px] rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#3498DB]"
              >
                Copy AI Summary
              </button>
            </div>
            {/* <TranscriptSummaryView summary={summary} isLoading={isLoading} enhanced={enhanced} /> */}
            <TranscriptSummaryView summary={normalizedSummary} isLoading={isLoading} enhanced={enhanced} />
          </div>
        )}
      </div>
    </div>
  );
}
