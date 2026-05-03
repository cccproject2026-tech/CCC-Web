"use client";

import Link from "next/link";
import { useCallback, useEffect } from "react";
import type { DashboardFocusSection } from "@/app/utils/dashboard-focus/types";

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  sections: DashboardFocusSection[];
  isLoading?: boolean;
  footer?: React.ReactNode;
};

export default function DashboardFocusModal({
  open,
  onClose,
  title,
  sections,
  isLoading,
  footer,
}: Props) {
  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onKeyDown]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="dashboard-focus-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative z-10 flex max-h-[min(88vh,720px)] w-full max-w-lg flex-col rounded-t-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.97)_0%,rgba(6,41,70,0.98)_100%)] shadow-[0_-12px_48px_rgba(2,20,38,0.55)] sm:rounded-2xl">
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-5">
          <h2 id="dashboard-focus-modal-title" className="text-base font-semibold text-white sm:text-lg">
            {title ?? "Things to Focus On"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/15"
          >
            Close
          </button>
        </div>

        {/* <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 sm:px-5 sm:py-4"> */}
       <div className="max-h-[420px] min-h-0 flex-1 overflow-y-auto px-4 py-3 pr-2 sm:px-5 sm:py-4 sm:pr-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-[#cde2f2]">
              <div className="h-9 w-9 animate-spin rounded-full border-2 border-[#8ec5eb]/30 border-t-[#8ec5eb]" />
              <p className="text-sm">Loading…</p>
            </div>
          ) : (
            <div className="flex flex-col gap-8 pb-2">
              {sections.map((section) => (
                <section key={section.id} aria-label={section.title}>
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8ec5eb]">
                    {section.title}
                  </h3>
                  {section.items.length === 0 ? (
                    <p className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-white/60">
                      {section.emptyMessage}
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-2">
                      {section.items.map((item) => (
                        <li key={item.id}>
                          <Link
                            href={item.href}
                            onClick={onClose}
                            className="block rounded-xl border border-white/10 bg-white/[0.06] px-3 py-3 transition hover:border-[#8ec5eb]/35 hover:bg-white/[0.09]"
                          >
                            <p className="text-sm font-medium text-white">{item.title}</p>
                            {item.description ? (
                              <p className="mt-1 line-clamp-3 text-xs text-white/65">{item.description}</p>
                            ) : null}
                            {item.meta ? (
                              <p className="mt-2 text-[11px] text-[#8ec5eb]/90">{item.meta}</p>
                            ) : null}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ))}
            </div>
          )}
        </div>

        {footer ? (
          <div className="shrink-0 border-t border-white/10 px-4 py-3 sm:px-5">{footer}</div>
        ) : null}
      </div>
    </div>
  );
}
