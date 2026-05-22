import type { AppointmentAvailabilityTimeSlot, AppointmentSlotPeriod } from "@/app/Services/types/appointments.types";
import { slotDateToYmd } from "@/app/Services/appointment-utils";

export type { AppointmentAvailabilityTimeSlot };

export const WEEKDAY_LABELS_SUN0 = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

/** Canonical period for payloads the backend validates as `AM` | `PM`. */
export function toSlotPeriod(raw: unknown, fallback: AppointmentSlotPeriod = "AM"): AppointmentSlotPeriod {
  const u = String(raw ?? "")
    .trim()
    .toUpperCase();
  if (u === "PM" || u.startsWith("P")) return "PM";
  if (u === "AM" || u.startsWith("A")) return "AM";
  return fallback;
}

/** Start-of-interval minutes from midnight (12h clock + AM/PM). */
export function slotToMinutes(slot: AppointmentAvailabilityTimeSlot): { start: number; end: number } {
  const h12 = (t: string): [number, number] => {
    const [hh, mm] = String(t || "12:00").split(":").map((x) => parseInt(String(x).replace(/\D/g, ""), 10));
    const ho = Number.isFinite(hh) ? hh % 24 : 0;
    const mo = Number.isFinite(mm) ? mm % 60 : 0;
    return [ho, mo];
  };
  const mins = (h: number, m: number, p: AppointmentSlotPeriod) => {
    let hour = h;
    if (p === "PM" && hour !== 12) hour += 12;
    if (p === "AM" && hour === 12) hour = 0;
    return hour * 60 + m;
  };
  const [sh, sm] = h12(slot.startTime);
  const [eh, em] = h12(slot.endTime);
  return {
    start: mins(sh, sm, slot.startPeriod),
    end: mins(eh, em, slot.endPeriod),
  };
}

export function intervalsOverlapExclusive(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
}

/** True if **any** pair of slots overlaps (backend rejects overlaps). */
export function findOverlappingSlotPair(slots: AppointmentAvailabilityTimeSlot[]): [number, number] | null {
  const ranges = slots.map((s) => {
    const { start, end } = slotToMinutes(s);
    return { start, end };
  });
  for (let i = 0; i < ranges.length; i++) {
    for (let j = i + 1; j < ranges.length; j++) {
      if (ranges[i].end <= ranges[i].start || ranges[j].end <= ranges[j].start) continue;
      if (intervalsOverlapExclusive(ranges[i].start, ranges[i].end, ranges[j].start, ranges[j].end)) {
        return [i, j];
      }
    }
  }
  return null;
}

export function normalizeTimeToken(t: unknown): string {
  const raw = String(t ?? "09:00").trim();
  const cleaned = raw.replace(/\s*(AM|PM)\s*/gi, "").trim() || "09:00";
  const parts = cleaned.split(":").map((x) => x.trim());
  const hh = Number.parseInt(parts[0] ?? "9", 10);
  const mm = Number.parseInt(parts[1] ?? "0", 10);
  const h = Number.isFinite(hh) ? Math.min(Math.max(hh, 1), 12) : 9;
  const m = Number.isFinite(mm) ? Math.min(Math.max(mm, 0), 59) : 0;
  return `${h}:${String(m).padStart(2, "0")}`;
}

export function slotFromUnknown(raw: unknown): AppointmentAvailabilityTimeSlot {
  if (!raw || typeof raw !== "object") {
    return {
      startTime: "9:00",
      startPeriod: "AM",
      endTime: "5:00",
      endPeriod: "PM",
    };
  }
  const r = raw as Record<string, unknown>;
  if (typeof r.startTime === "string" || typeof r.endTime === "string") {
    return {
      startTime: normalizeTimeToken(r.startTime),
      startPeriod: toSlotPeriod(r.startPeriod ?? r.start_am_pm, "AM"),
      endTime: normalizeTimeToken(r.endTime ?? "05:00"),
      endPeriod: toSlotPeriod(r.endPeriod ?? r.end_am_pm, "PM"),
    };
  }
  if (typeof r.start === "string" && typeof r.end === "string") {
    return {
      startTime: normalizeTimeToken(r.start.split(/\s+/)[0]),
      startPeriod: toSlotPeriod(String(r.start).includes("PM") ? "PM" : "AM", "AM"),
      endTime: normalizeTimeToken(r.end.split(/\s+/)[0]),
      endPeriod: toSlotPeriod(String(r.end).includes("PM") ? "PM" : "AM", "PM"),
    };
  }
  return {
    startTime: "9:00",
    startPeriod: "AM",
    endTime: "5:00",
    endPeriod: "PM",
  };
}

/** Monday 1–Sunday 7 helpers are avoided; APIs use weekday from **UTC calendar** ISO date (`date` prefix). */

/**
 * `dayIndexUtcSunday0`: 0=Sunday … 6=Saturday matching `Date#getUTCDay()`.
 * Returns `YYYY-MM-DD` (UTC Gregorian) for that column within the UTC week containing `refUtc`.
 */
export function utcReferenceYmdForWeekday(dayIndexUtcSunday0: number, refUtc: Date = new Date()): string {
  const y = refUtc.getUTCFullYear();
  const mo = refUtc.getUTCMonth();
  const d = refUtc.getUTCDate();
  const middayUtcMs = Date.UTC(y, mo, d, 12, 0, 0);
  const dow = new Date(middayUtcMs).getUTCDay();
  const sundayMs = middayUtcMs - dow * 86_400_000;
  const targetMs = sundayMs + (dayIndexUtcSunday0 % 7) * 86_400_000;
  return new Date(targetMs).toISOString().slice(0, 10);
}

/** Build `templateWeeklySlots` from enabled weekday rows. */
export function buildTemplateWeeklySlotsFromRows(params: {
  rows: Array<{ dayIndexUtcSunday0: number; enabled: boolean; slots: AppointmentAvailabilityTimeSlot[] }>;
  referenceUtc?: Date;
}): { date: string; slots: AppointmentAvailabilityTimeSlot[] }[] {
  const ref = params.referenceUtc ?? new Date();
  return params.rows
    .filter((r) => r.enabled && r.slots.length > 0)
    .map((r) => ({
      date: utcReferenceYmdForWeekday(r.dayIndexUtcSunday0, ref),
      slots: r.slots.map((s) => ({
        ...s,
        startTime: normalizeTimeToken(s.startTime),
        endTime: normalizeTimeToken(s.endTime),
        startPeriod: toSlotPeriod(s.startPeriod),
        endPeriod: toSlotPeriod(s.endPeriod),
      })),
    }));
}

/** Match a row from `/month` (or `/week`) payload to calendar `YYYY-MM-DD`. */
export function findAvailabilityRowForYmd(monthRows: unknown[], ymd: string): Record<string, unknown> | undefined {
  for (const row of monthRows) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const d = slotDateToYmd(r.date ?? r.day ?? r.ymd);
    if (d === ymd) return r;
  }
  return undefined;
}

export function classifyDayOccurrence(raw: Record<string, unknown> | undefined): {
  unavailable: boolean;
  slots: AppointmentAvailabilityTimeSlot[];
} {
  if (!raw) return { unavailable: false, slots: [] };
  const flag =
    raw.unavailable === true ||
    raw.isUnavailable === true ||
    raw.blocked === true ||
    raw.isBlocked === true;
  let slotsUnknown: unknown[] = [];
  if (Array.isArray(raw.slots)) slotsUnknown = raw.slots as unknown[];
  else if (Array.isArray(raw.times)) slotsUnknown = raw.times as unknown[];
  else if (Array.isArray(raw.timeSlots)) slotsUnknown = raw.timeSlots as unknown[];
  const slots = slotsUnknown.map(slotFromUnknown);
  const unavailable =
    flag || (slots.length === 0 && (raw.reason === "unavailable" || raw.status === "unavailable"));
  return { unavailable, slots };
}

export function localCalendarYmd(year: number, monthIndex0: number, dom: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}-${String(dom).padStart(2, "0")}`;
}
