"use client";

import { mentorPrimaryCta } from "@/app/Components/mentor/mentor-theme";

type MentorAvailabilitySaveBarProps = {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  saveBlockedMessage: string | null;
  lastSavedLabel: string | null;
  onSave: () => void;
};

export default function MentorAvailabilitySaveBar({
  hasUnsavedChanges,
  isSaving,
  saveBlockedMessage,
  lastSavedLabel,
  onSave,
}: MentorAvailabilitySaveBarProps) {
  const statusText = isSaving
    ? "Saving weekly schedule…"
    : saveBlockedMessage
      ? saveBlockedMessage
      : hasUnsavedChanges
        ? "Unsaved changes"
        : lastSavedLabel ?? "All changes saved";

  const statusClass = saveBlockedMessage
    ? "text-amber-200"
    : hasUnsavedChanges
      ? "text-[#f5d76e]"
      : "text-[#cde2f2]/85";

  return (
    <div
      className="sticky bottom-0 z-20 -mx-0 mt-8 border-t border-white/15 bg-[#041f35]/95 px-4 py-4 backdrop-blur-md sm:px-6"
      role="region"
      aria-label="Save weekly availability"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white">Weekly schedule</p>
          <p className={`mt-0.5 text-xs ${statusClass}`} aria-live="polite">
            {statusText}
          </p>
        </div>
        <button
          type="button"
          disabled={isSaving || Boolean(saveBlockedMessage)}
          onClick={onSave}
          className={`${mentorPrimaryCta} w-full shrink-0 px-8 py-2.5 text-sm shadow-lg shadow-[#8ec5eb]/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto`}
        >
          {isSaving ? "Saving…" : "Save weekly schedule"}
        </button>
      </div>
    </div>
  );
}
