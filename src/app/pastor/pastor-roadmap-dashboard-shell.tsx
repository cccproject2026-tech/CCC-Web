"use client";

import type { ReactNode } from "react";

/** Same visual base as `RoleShell variant="director"` for pastor roadmap flows. */
export function PastorRoadmapDashboardBackdrop() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[#0A1128]" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_10%,rgba(52,152,219,0.14),transparent_38%),radial-gradient(circle_at_88%_18%,rgba(155,89,182,0.08),transparent_36%),linear-gradient(180deg,#070f22_0%,#0A1128_42%,#0d1836_100%)]"
        aria-hidden
      />
    </>
  );
}

export const pastorRoadmapDashboardPageRoot =
  "relative flex min-h-screen flex-col bg-transparent font-[Albert_Sans] text-white";

export function PastorRoadmapDashboardBody({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <PastorRoadmapDashboardBackdrop />
      <div className="relative z-10 flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}
