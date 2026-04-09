"use client";

import { useEffect, type ReactNode } from "react";

import {
  pastorModalBtnPrimary,
  pastorModalBtnSecondary,
  pastorModalFooter,
  pastorModalOverlay,
} from "./pastor-theme";

export type PastorModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
  hideFooter?: boolean;
};

const maxW: Record<NonNullable<PastorModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export default function PastorModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  hideFooter = false,
}: PastorModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={pastorModalOverlay} role="dialog" aria-modal="true" aria-labelledby="pastor-modal-title">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-transparent"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${maxW[size]} rounded-xl bg-white shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-gray-100 px-6 pb-4 pt-6">
          <h2 id="pastor-modal-title" className="pr-4 text-[16px] font-semibold leading-snug text-[#0B1C58]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            aria-label="Close"
          >
            <span className="text-xl leading-none text-gray-600" aria-hidden>
              ×
            </span>
          </button>
        </div>
        <div className="max-h-[min(70vh,560px)] overflow-y-auto px-6 py-4 text-sm text-[#0B1C58]">{children}</div>
        {!hideFooter && (
          <div className={`${pastorModalFooter} px-6`}>
            {footer ?? (
              <>
                <button type="button" className={pastorModalBtnSecondary} onClick={onClose}>
                  Cancel
                </button>
                <button type="button" className={pastorModalBtnPrimary} onClick={onClose}>
                  OK
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
