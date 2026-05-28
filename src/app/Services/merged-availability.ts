/**
 * Parses GET `/availability/:mentorUserId?from=&to=&participantUserId=` (merged CCC + Google).
 * Tolerant of envelope nesting and naming variants.
 */
import type { CalendarBusyPeriod } from "@/app/Services/types/appointments.types";
import { slotDateToYmd } from "@/app/Services/appointment-utils";

function asRecord(x: unknown): Record<string, unknown> | null {
  return x && typeof x === "object" ? (x as Record<string, unknown>) : null;
}

/** Unwrap `{ data: … }`, `{ success, data }`, repeated. */
export function unwrapAvailabilityPayload(raw: unknown): Record<string, unknown> | null {
  let cur: unknown = raw;
  for (let i = 0; i < 6; i++) {
    const o = asRecord(cur);
    if (!o) return null;
    if ("data" in o && o.data != null && typeof o.data === "object") {
      cur = o.data;
      continue;
    }
    return o;
  }
  return null;
}

function normalizeYmdCandidate(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return slotDateToYmd(v);
}

function slotLabelFromObject(slot: Record<string, unknown>): string | null {
  const st = slot.startTime ?? slot.start;
  const et = slot.endTime ?? slot.end;
  const spRaw = slot.startPeriod ?? slot.startMeridiem;
  const epRaw = slot.endPeriod ?? slot.endMeridiem;
  if (typeof st === "string" && typeof et === "string" && spRaw != null && epRaw != null) {
    const sp = String(spRaw).toLowerCase();
    const ep = String(epRaw).toLowerCase();
    return `${String(st).trim()} ${sp} - ${String(et).trim()} ${ep}`;
  }
  return null;
}

function collectDayArrays(node: unknown, out: unknown[][]): void {
  if (!node) return;
  if (Array.isArray(node)) {
    out.push(node);
    return;
  }
  const o = asRecord(node);
  if (!o) return;
  for (const v of Object.values(o)) collectDayArrays(v, out);
}

/**
 * CCC windows for `ymd` as slot labels `"h:mm am – h:mm pm"` (hyphen tolerated).
 */
export function extractCccSlotLabelsForYmd(payload: unknown, ymd: string): string[] {
  const root = unwrapAvailabilityPayload(payload);
  if (!root) return [];

  const ccc =
    root.cccAvailability ??
    root.availability ??
    root.mentorAvailability ??
    root.slots ??
    root.days;

  const candidates: unknown[][] = [];
  collectDayArrays(ccc, candidates);

  const labels = new Set<string>();
  const dayPrefix = ymd.slice(0, 10);

  for (const arr of candidates) {
    for (const item of arr) {
      const o = asRecord(item);
      if (!o) continue;
      const dy =
        normalizeYmdCandidate(o.date) ??
        normalizeYmdCandidate(o.day) ??
        normalizeYmdCandidate(o.calendarDate) ??
        normalizeYmdCandidate(o.meetingDate) ??
        normalizeYmdCandidate(o.dateString);
      if (dy !== dayPrefix) continue;

      const slots = o.slots;
      if (!Array.isArray(slots)) continue;
      for (const s of slots) {
        const so = asRecord(s);
        if (!so) continue;
        const label = slotLabelFromObject(so);
        if (label) labels.add(label.replace(/\u2013/g, "-").replace(/\u2014/g, "-"));
      }
    }
  }

  return [...labels];
}

function normalizeIntervals(raw: unknown): CalendarBusyPeriod[] {
  if (!Array.isArray(raw)) return [];
  const out: CalendarBusyPeriod[] = [];
  for (const x of raw) {
    const o = asRecord(x);
    if (!o) continue;
    const start = typeof o.start === "string" ? o.start : typeof o.startTime === "string" ? o.startTime : "";
    const end = typeof o.end === "string" ? o.end : typeof o.endTime === "string" ? o.endTime : "";
    if (start && end) out.push({ start, end });
  }
  return out;
}

export type ParsedGoogleSide = {
  googleCalendarLinked: boolean | null;
  googleCalendarStatus?: "connected" | "disconnected" | "expired" | "error";
  busyIntervals: CalendarBusyPeriod[];
};

function parseGoogleSide(node: unknown): ParsedGoogleSide {
  const o = asRecord(node);
  if (!o) return { googleCalendarLinked: null, busyIntervals: [] };
  const linkedRaw = o.googleCalendarLinked ?? o.calendarLinked ?? o.linked;
  const statusRaw = o.googleCalendarStatus;
  let googleCalendarLinked: boolean | null = null;
  if (typeof linkedRaw === "boolean") googleCalendarLinked = linkedRaw;
  const googleCalendarStatus =
    statusRaw === "connected" ||
    statusRaw === "disconnected" ||
    statusRaw === "expired" ||
    statusRaw === "error"
      ? statusRaw
      : undefined;

  const busyRaw = o.busyIntervals ?? o.busy ?? o.busyPeriods ?? o.blocks;
  return {
    googleCalendarLinked,
    googleCalendarStatus,
    busyIntervals: normalizeIntervals(busyRaw),
  };
}

export type ParsedMergedGoogleBundle = {
  mentor: ParsedGoogleSide;
  participant: ParsedGoogleSide;
};

/** Extract `google.mentor` / `google.participant` (no legacy fallbacks on root). */
export function extractMergedGoogleBundle(payload: unknown): ParsedMergedGoogleBundle {
  const root = unwrapAvailabilityPayload(payload);
  if (!root) {
    return {
      mentor: { googleCalendarLinked: null, busyIntervals: [] },
      participant: { googleCalendarLinked: null, busyIntervals: [] },
    };
  }

  const g = asRecord(root.google);
  if (!g) {
    return {
      mentor: { googleCalendarLinked: null, busyIntervals: [] },
      participant: { googleCalendarLinked: null, busyIntervals: [] },
    };
  }

  const mentor = parseGoogleSide(asRecord(g.mentor));
  const participant = parseGoogleSide(
    asRecord(g.participant) ?? asRecord(g.participantGoogle) ?? asRecord(g.user),
  );

  return { mentor, participant };
}

export function mergeBusyIntervals(a: CalendarBusyPeriod[], b: CalendarBusyPeriod[]): CalendarBusyPeriod[] {
  const key = (p: CalendarBusyPeriod) => `${p.start}|${p.end}`;
  const seen = new Set<string>();
  const out: CalendarBusyPeriod[] = [];
  for (const p of [...a, ...b]) {
    const k = key(p);
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}

export function buildGoogleConnectBanners(
  /** True when `/availability` was called with participantUserId (second calendar merged in picker). */
  participantMergedInRequest: boolean,
  mentor: ParsedGoogleSide,
  participant: ParsedGoogleSide,
): string[] {
  const banners: string[] = [];
  if (mentor.googleCalendarStatus === "expired" || mentor.googleCalendarStatus === "error") {
    banners.push("Reconnect Google Calendar to avoid double-booking.");
  } else if (mentor.googleCalendarLinked === false) {
    banners.push("Link Google Calendar to avoid double-booking.");
  }
  if (participantMergedInRequest && (participant.googleCalendarStatus === "expired" || participant.googleCalendarStatus === "error")) {
    banners.push("Booking participant: reconnect Google Calendar to avoid double-booking.");
  } else if (participantMergedInRequest && participant.googleCalendarLinked === false) {
    banners.push("Booking participant: link Google Calendar to avoid double-booking.");
  }
  return banners;
}
