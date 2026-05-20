"use client";

import { mentorGlassCardFrost, mentorPrimaryCta, mentorSecondaryCta } from "@/app/Components/mentor/mentor-theme";

type VoiceNotesEmptyStateProps = {
  onUpload: () => void;
  onRecord?: () => void;
};

export default function VoiceNotesEmptyState({ onUpload, onRecord }: VoiceNotesEmptyStateProps) {
  return (
    <div
      className={`${mentorGlassCardFrost} mx-auto flex max-w-lg flex-col items-center px-6 py-14 text-center sm:px-10 sm:py-16`}
    >
      <div
        className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#3498DB]/30 bg-[#3498DB]/15 text-3xl"
        aria-hidden
      >
        🎤
      </div>
      <h2 className="mt-5 text-xl font-bold text-white sm:text-2xl">No Voice Notes Yet</h2>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">
        Record or upload audio to generate:
      </p>
      <ul className="mt-4 space-y-2 text-sm text-white/80">
        <li className="flex items-center justify-center gap-2">
          <i className="fa-solid fa-check text-[#8ec5eb] text-xs" aria-hidden />
          Transcript
        </li>
        <li className="flex items-center justify-center gap-2">
          <i className="fa-solid fa-check text-[#8ec5eb] text-xs" aria-hidden />
          AI summary
        </li>
      </ul>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {onRecord ? (
          <button
            type="button"
            onClick={onRecord}
            className={`${mentorSecondaryCta} min-h-[44px] px-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3498DB]`}
          >
            <i className="fa-solid fa-microphone mr-2 text-xs" aria-hidden />
            Record Voice
          </button>
        ) : null}
        <button
          type="button"
          onClick={onUpload}
          className={`${mentorPrimaryCta} min-h-[44px] px-6 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3498DB]`}
        >
          <i className="fa-solid fa-plus mr-2 text-xs" aria-hidden />
          Upload Audio
        </button>
      </div>
    </div>
  );
}
