"use client";

import type { TranscriptSummaryDto } from "@/app/Services/types/appointments.types";

const ENHANCED_SECTIONS: {
  key: keyof TranscriptSummaryDto;
  label: string;
  icon: string;
  border: string;
  bg: string;
  title: string;
  list?: boolean;
}[] = [
  {
    key: "sessionOverview",
    label: "Session Overview",
    icon: "fa-solid fa-circle-info",
    border: "border-sky-400/15",
    bg: "bg-sky-500/10",
    title: "text-sky-200/80",
  },
  {
    key: "keyDiscussionPoints",
    label: "Key Discussion Points",
    icon: "fa-solid fa-comments",
    border: "border-indigo-400/15",
    bg: "bg-indigo-500/10",
    title: "text-indigo-200/80",
    list: true,
  },
  {
    key: "mentorGuidance",
    label: "Mentor Guidance",
    icon: "fa-solid fa-hand-holding-heart",
    border: "border-emerald-400/15",
    bg: "bg-emerald-500/10",
    title: "text-emerald-200/80",
    list: true,
  },
  {
    key: "actionItems",
    label: "Action Items",
    icon: "fa-solid fa-list-check",
    border: "border-amber-400/20",
    bg: "bg-amber-500/10",
    title: "text-amber-200/80",
    list: true,
  },
  {
    key: "followUp",
    label: "Follow Up",
    icon: "fa-solid fa-arrow-right",
    border: "border-fuchsia-400/15",
    bg: "bg-fuchsia-500/10",
    title: "text-fuchsia-200/80",
  },
];

type TranscriptSummaryViewProps = {
  summary?: TranscriptSummaryDto | null;
  isLoading?: boolean;
  emptyMessage?: string;
  enhanced?: boolean;
};

export default function TranscriptSummaryView({
  summary,
  isLoading = false,
  emptyMessage = "No summary yet.",
  enhanced = false,
}: TranscriptSummaryViewProps) {
  const scrollClass = enhanced
    ? "max-h-[min(70vh,560px)] overflow-y-auto overscroll-contain scroll-smooth rounded-2xl border border-white/10 bg-white/5 p-4 sm:p-5"
    : "max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-white/5 p-4";

  return (
    <div className={scrollClass}>
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
        <div className={`space-y-4 text-sm leading-relaxed text-white/80 ${enhanced ? "sm:space-y-5" : ""}`}>
          {enhanced
            ? ENHANCED_SECTIONS.map((sec) => {
                const val = summary[sec.key];
                if (sec.list) {
                  const items = val as string[] | undefined;
                  if (!items?.length) return null;
                  return (
                    <div key={sec.key} className={`rounded-2xl border p-4 sm:p-5 ${sec.border} ${sec.bg}`}>
                      <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${sec.title}`}>
                        <i className={`${sec.icon} text-sm`} aria-hidden />
                        {sec.label}
                      </div>
                      <ul className="mt-3 space-y-2.5">
                        {items.map((x) => (
                          <li key={x} className="flex gap-2.5">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-white/50" />
                            <span className="text-[15px] leading-relaxed text-white/90">{x}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }
                const text = val as string | undefined;
                if (!text?.trim()) return null;
                return (
                  <div key={sec.key} className={`rounded-2xl border p-4 sm:p-5 ${sec.border} ${sec.bg}`}>
                    <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide ${sec.title}`}>
                      <i className={`${sec.icon} text-sm`} aria-hidden />
                      {sec.label}
                    </div>
                    <p className="mt-3 text-[15px] leading-relaxed text-white/90">{text}</p>
                  </div>
                );
              })
            : null}
          {!enhanced && summary.sessionOverview ? (
            <div className="rounded-2xl border border-sky-400/15 bg-sky-500/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-sky-200/80">
                Session overview
              </div>
              <div className="mt-2 text-white/85">{summary.sessionOverview}</div>
            </div>
          ) : null}

          {!enhanced && summary.keyDiscussionPoints?.length ? (
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

          {!enhanced && summary.mentorGuidance?.length ? (
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

          {!enhanced && summary.actionItems?.length ? (
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

          {!enhanced && summary.followUp ? (
            <div className="rounded-2xl border border-fuchsia-400/15 bg-fuchsia-500/10 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-fuchsia-200/80">
                Follow-up
              </div>
              <div className="mt-2 text-white/85">{summary.followUp}</div>
            </div>
          ) : null}

          {!enhanced && !summary.sessionOverview &&
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
