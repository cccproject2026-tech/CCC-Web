"use client";

import React, { useMemo } from "react";
import { getNextSessionId } from "@/app/mentor/mentoring-session/utils/sessionFlow";

export default function SessionProgressHeader<T extends { id: string; status: string; sessionNumber: number; scheduledDate: string }>({
  sessions,
}: {
  sessions: T[];
}) {
  const sorted = useMemo(() => [...sessions].sort((a, b) => a.sessionNumber - b.sessionNumber), [sessions]);
  const total = sorted.length;
  const completed = sorted.filter((s) => String(s.status).toUpperCase() === "COMPLETED").length;
  const progress = total > 0 ? Math.min(1, completed / total) : 0;
  const nextId = getNextSessionId(
    sorted.map((s) => ({
      id: s.id,
      status: String(s.status).toUpperCase() as any,
      scheduledDate: s.scheduledDate,
    })),
  );
  const next = nextId ? sorted.find((s) => s.id === nextId) : undefined;

  const headline =
    total === 0 ? "No sessions yet" : completed >= total ? `All ${total} sessions complete` : next ? `Session ${next.sessionNumber} of ${total}` : `Session ${completed + 1} of ${total}`;

  return (
    <div className="mb-6 rounded-2xl border border-white/15 bg-white/5 backdrop-blur-sm p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-base font-extrabold text-white">{headline}</div>
          <div className="mt-1 text-xs text-white/60">Mentorship journey progress</div>
        </div>
        <div className="shrink-0 text-sm font-semibold text-white/80">
          {completed}/{total}
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/15">
        <div className="h-full rounded-full bg-[#38BDF8]" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

