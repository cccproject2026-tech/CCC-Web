"use client";

import { useEffect, type ReactNode } from "react";
import {
  directorModalBackdropClass,
  directorModalCloseButtonClass,
  directorModalPanelClass,
} from "../directorUi";

type DirectorModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Optional icon above title (e.g. confirm illustration). */
  iconSlot?: ReactNode;
  panelClassName?: string;
};

/**
 * Centered modal for director module (headers, close control, padding aligned with ConfirmModal).
 */
export default function DirectorModal({
  open,
  onClose,
  title,
  children,
  footer,
  iconSlot,
  panelClassName = "",
}: DirectorModalProps) {
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
      className={directorModalBackdropClass}
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`${directorModalPanelClass} ${panelClassName}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="director-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3
            id="director-modal-title"
            className="flex-1 text-lg font-bold text-gray-900 sm:text-xl"
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={directorModalCloseButtonClass}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-xl" />
          </button>
        </div>
        {iconSlot ? <div className="mb-4 flex justify-center">{iconSlot}</div> : null}
        <div className="text-sm text-gray-700 sm:text-[15px]">{children}</div>
        {footer ? <div className="mt-6">{footer}</div> : null}
      </div>
    </div>
  );
}
