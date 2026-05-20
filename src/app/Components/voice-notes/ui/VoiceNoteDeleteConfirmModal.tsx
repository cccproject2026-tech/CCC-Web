"use client";

import { useEffect } from "react";

type VoiceNoteDeleteConfirmModalProps = {
  open: boolean;
  title: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function VoiceNoteDeleteConfirmModal({
  open,
  title,
  busy,
  onConfirm,
  onCancel,
}: VoiceNoteDeleteConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center px-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="vn-delete-title"
      aria-describedby="vn-delete-desc"
    >
      <div className="absolute inset-0 bg-black/50" onClick={busy ? undefined : onCancel} aria-hidden />
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#0f3b5f]/95 p-5 shadow-2xl backdrop-blur-md">
        <h2 id="vn-delete-title" className="text-base font-semibold text-white">
          Delete Voice Note?
        </h2>
        <p id="vn-delete-desc" className="mt-2 text-sm text-white/70">
          <span className="font-medium text-white/90">&ldquo;{title}&rdquo;</span> will be removed. This action
          cannot be undone.
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={!!busy}
            className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white/80 hover:bg-white/10 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!!busy}
            className="rounded-xl bg-red-500/85 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500 disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-300"
          >
            {busy ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
