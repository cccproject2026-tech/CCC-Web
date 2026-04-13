export type SessionStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED" | "MISSED";

export function formatSessionTime(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
}

export function formatSessionDate(value?: string): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" });
}

/** Next session to focus: first upcoming SCHEDULED (from today), else first SCHEDULED. */
export function getNextSessionId<T extends { id: string; status: SessionStatus; scheduledDate: string }>(
  sorted: T[],
): string | undefined {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const upcoming = sorted.find(
    (s) =>
      s.status === "SCHEDULED" &&
      !Number.isNaN(new Date(s.scheduledDate).getTime()) &&
      new Date(s.scheduledDate) >= start,
  );
  return upcoming?.id ?? sorted.find((s) => s.status === "SCHEDULED")?.id ?? undefined;
}

