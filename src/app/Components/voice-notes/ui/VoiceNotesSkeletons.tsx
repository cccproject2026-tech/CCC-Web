"use client";

import { mentorGlassCardFrost } from "@/app/Components/mentor/mentor-theme";

function PulseBar({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-white/10 ${className ?? ""}`} />;
}

export function VoiceNotesListSkeleton() {
  return (
    <ul className="grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading voice notes">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className={`${mentorGlassCardFrost} p-5`}>
          <div className="flex gap-3">
            <PulseBar className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <PulseBar className="h-4 w-3/4" />
              <PulseBar className="h-3 w-1/3" />
              <PulseBar className="h-5 w-24 rounded-full" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function VoiceNoteDetailSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading voice note">
      <div className={`${mentorGlassCardFrost} space-y-4 p-6`}>
        <PulseBar className="h-8 w-2/3 max-w-md" />
        <PulseBar className="h-4 w-32" />
        <PulseBar className="h-12 w-full rounded-2xl" />
      </div>
      <div className={`${mentorGlassCardFrost} space-y-3 p-6`}>
        <PulseBar className="h-10 w-full max-w-xs rounded-2xl" />
        <PulseBar className="h-64 w-full rounded-2xl" />
      </div>
    </div>
  );
}
