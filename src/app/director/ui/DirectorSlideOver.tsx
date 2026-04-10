"use client";

import { useEffect, type ReactNode } from "react";
import {
  directorModalCloseButtonClass,
  directorSlideOverBackdropClass,
  directorSlideOverPanelClass,
} from "../directorUi";

type DirectorSlideOverProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Extra classes on the sliding panel (width, etc.). */
  panelClassName?: string;
};

/**
 * Right-edge slide-over panel for director flows (assign, pick users, etc.).
 */
export default function DirectorSlideOver({
  open,
  onClose,
  title,
  children,
  footer,
  panelClassName = "",
}: DirectorSlideOverProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className={directorSlideOverBackdropClass}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`${directorSlideOverPanelClass} ${panelClassName}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="director-slideover-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2
            id="director-slideover-title"
            className="pr-2 text-lg font-bold text-gray-900 sm:text-xl"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={directorModalCloseButtonClass}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer ? (
          <footer className="shrink-0 border-t border-gray-100 px-6 py-4">{footer}</footer>
        ) : null}
      </div>
    </div>
  );
}
