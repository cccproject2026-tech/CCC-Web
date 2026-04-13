"use client";

import React, { useEffect } from "react";

export type ConfirmModalKind = "complete" | "redo";

export default function ConfirmModal({
  open,
  kind,
  title,
  body,
  confirmText,
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  busy,
}: {
  open: boolean;
  kind: ConfirmModalKind;
  title: string;
  body: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmTone =
    kind === "redo"
      ? "bg-amber-500/80 hover:bg-amber-500"
      : "bg-green-500/80 hover:bg-green-500";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/15 bg-[#0f3b5f]/95 backdrop-blur-md p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-base font-semibold text-white">{title}</div>
            <div className="mt-2 text-sm text-white/70">{body}</div>
          </div>
          <button
            type="button"
            className="text-white/60 hover:text-white/90"
            onClick={onCancel}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={!!busy}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white/80 hover:text-white border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!!busy}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-[#062946] ${confirmTone} disabled:opacity-60`}
          >
            {busy ? "Working…" : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

