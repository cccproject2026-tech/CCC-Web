"use client";

import { useEffect, type ReactNode } from "react";

import {
  mentorModalCloseBtn,
  mentorModalFooter,
  mentorModalOverlay,
  mentorModalPanel,
  mentorModalTitle,
} from "./mentor-theme";

export type MentorModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
};

const maxW: Record<NonNullable<MentorModalProps["size"]>, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
};

export default function MentorModal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: MentorModalProps) {
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
    <div className={mentorModalOverlay} role="dialog" aria-modal="true" aria-labelledby="mentor-modal-title">
      <button type="button" className="absolute inset-0 cursor-default bg-transparent" aria-label="Dismiss" onClick={onClose} />
      <div
        className={`${mentorModalPanel} ${maxW[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
          <h2 id="mentor-modal-title" className={mentorModalTitle}>
            {title}
          </h2>
          <button type="button" onClick={onClose} className={mentorModalCloseBtn} aria-label="Close">
            <span className="text-xl leading-none" aria-hidden>
              ×
            </span>
          </button>
        </div>
        <div className="text-sm text-[#374151]">{children}</div>
        {footer ? <div className={mentorModalFooter}>{footer}</div> : null}
      </div>
    </div>
  );
}
