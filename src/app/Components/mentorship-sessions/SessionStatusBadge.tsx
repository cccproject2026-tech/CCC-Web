"use client";

import React from "react";

export default function SessionStatusBadge({ status, compact }: { status: string; compact?: boolean }) {
  const raw = String(status || "").toUpperCase();
  const tone =
    raw === "COMPLETED"
      ? "bg-green-500/25 border-green-400/30"
      : raw === "SCHEDULED"
        ? "bg-blue-500/25 border-blue-400/30"
        : raw === "MISSED"
          ? "bg-yellow-500/25 border-yellow-400/30"
          : raw === "CANCELLED"
            ? "bg-red-500/25 border-red-400/30"
            : "bg-white/10 border-white/15";

  return (
    <span
      className={`inline-flex items-center rounded-full border ${tone} text-white font-extrabold tracking-wide ${
        compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]"
      }`}
    >
      {raw}
    </span>
  );
}

