"use client";

import React from "react";

/** Compact token for tones (underscores collapsed). */
function statusToken(raw: string): string {
  return raw.trim().toUpperCase().replace(/[\s_-]+/g, "");
}

export default function SessionStatusBadge({ status, compact }: { status: string; compact?: boolean }) {
  const upper = String(status || "").trim().toUpperCase();
  const toneKey = statusToken(status);
  const tone =
    toneKey === "COMPLETED"
      ? "bg-green-500/25 border-green-400/30"
      : toneKey === "SCHEDULED"
        ? "bg-blue-500/25 border-blue-400/30"
        : toneKey === "MISSED"
          ? "bg-yellow-500/25 border-yellow-400/30"
          : toneKey === "CANCELLED" || toneKey === "CANCELED"
            ? "bg-red-500/25 border-red-400/30"
            : toneKey === "INPROGRESS"
              ? "bg-sky-500/25 border-sky-400/30"
              : toneKey === "POSTPONED"
                ? "bg-violet-500/25 border-violet-400/30"
                : "bg-white/10 border-white/15";

  const label =
    toneKey === "INPROGRESS"
      ? "IN PROGRESS"
      : upper.includes("_")
        ? upper.replace(/_/g, " ")
        : upper;

  return (
    <span
      className={`inline-flex items-center rounded-full border ${tone} font-extrabold tracking-wide text-white ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]"
      }`}
    >
      {label}
    </span>
  );
}
