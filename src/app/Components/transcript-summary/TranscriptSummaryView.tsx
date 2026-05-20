"use client";

import type { TranscriptSummaryDto } from "@/app/Services/types/appointments.types";

type TranscriptSummaryViewProps = {
  summary?: TranscriptSummaryDto | null;
  isLoading?: boolean;
  emptyMessage?: string;
};

export default function TranscriptSummaryView({
  summary,
  isLoading = false,
  emptyMessage = "No summary yet.",
}: TranscriptSummaryViewProps) {
  return (
    <div className="max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-white/5 p-4">
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 w-7/12 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-11/12 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-10/12 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-6/12 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-9/12 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-8/12 animate-pulse rounded bg-white/10" />
        </div>
      ) : summary ? (
        <div className="space-y-4 text-sm leading-relaxed text-white/80">
          {summary.sessionOverview ? (
            <div className="rounded-2xl border border-sky-400/15 bg-sky-500/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-200/80">
                Session overview
              </div>
              <div className="mt-2 text-white/85">{summary.sessionOverview}</div>
            </div>
          ) : null}

          {summary.keyDiscussionPoints?.length ? (
            <div className="rounded-2xl border border-indigo-400/15 bg-indigo-500/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-indigo-200/80">
                Key discussion points
              </div>
              <ul className="mt-2 space-y-2">
                {summary.keyDiscussionPoints.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-200/80" />
                    <span className="text-white/85">{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {summary.mentorGuidance?.length ? (
            <div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-emerald-200/80">
                Mentor guidance
              </div>
              <ul className="mt-2 space-y-2">
                {summary.mentorGuidance.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300/80" />
                    <span className="text-white/85">{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {summary.actionItems?.length ? (
            <div className="rounded-2xl border border-amber-400/20 bg-amber-500/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-amber-200/80">
                Action items
              </div>
              <ul className="mt-2 space-y-2">
                {summary.actionItems.map((x) => (
                  <li key={x} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-300/80" />
                    <span className="text-white/85">{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {summary.followUp ? (
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-500/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-fuchsia-200/80">
                Follow-up
              </div>
              <div className="mt-2 text-white/85">{summary.followUp}</div>
            </div>
          ) : null}

          {!summary.sessionOverview &&
          !summary.keyDiscussionPoints?.length &&
          !summary.mentorGuidance?.length &&
          !summary.actionItems?.length &&
          !summary.followUp ? (
            <div className="text-sm text-white/60">
              Summary is being generated or temporarily unavailable.
            </div>
          ) : null}
        </div>
      ) : (
        <div className="text-sm text-white/60">{emptyMessage}</div>
      )}
    </div>
  );
}
