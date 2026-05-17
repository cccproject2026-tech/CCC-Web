"use client";

import { useEffect, useId } from "react";

type NotesDeleteConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  deleting: boolean;
  /** e.g. `glassPanel` from parent (mentor / director / pastor tokens). */
  panelClassName: string;
  eyebrow: string;
  title: string;
  description: string;
  confirmLabel?: string;
};

export default function NotesDeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  deleting,
  panelClassName,
  eyebrow,
  title,
  description,
  confirmLabel = "Delete",
}: NotesDeleteConfirmDialogProps) {
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, deleting, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#04101c]/75 p-4 backdrop-blur-sm"
      role="presentation"
      onClick={() => !deleting && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`w-full max-w-md p-6 shadow-[0_24px_60px_rgba(2,20,38,0.55)] ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8ec5eb]">
          {eyebrow}
        </p>
        <p id={titleId} className="mt-3 text-base font-semibold text-white">
          {title}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-[#cde2f2]/90">{description}</p>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            disabled={deleting}
            onClick={onClose}
            className="rounded-xl border border-white/25 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={() => onConfirm()}
            className="rounded-xl border border-red-400/50 bg-red-500/20 px-4 py-2.5 text-sm font-semibold text-red-100 shadow-[0_8px_24px_rgba(185,28,28,0.25)] transition hover:bg-red-500/30 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
