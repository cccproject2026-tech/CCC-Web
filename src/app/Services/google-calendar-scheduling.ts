import { extractApiErrorMessage, parseSlotStartToIso } from "@/app/Services/appointment-utils";
import { apiFetchExternalCalendarBusy, apiGetMergedAvailabilityRange } from "@/app/Services/appointments.service";
import type { CalendarBusyPeriod } from "@/app/Services/types/appointments.types";
import {
  buildGoogleConnectBanners,
  extractCccSlotLabelsForYmd,
  extractMergedGoogleBundle,
  mergeBusyIntervals,
} from "@/app/Services/merged-availability";

const DEFAULT_DURATION_MIN = 60;
export const CALENDAR_GRID_STEP_MIN = 30;

function msMinutes(m: number): number {
  return m * 60_000;
}

/** Parse "H:MM" + am/pm from a substring like "09:30 am". */
export function parse12hTokens(chunk: string): { h24: number; min: number } | null {
  const m = String(chunk)
    .trim()
    .match(/^(\d{1,2}):(\d{2})\s*(am|pm)\b/i);
  if (!m) return null;
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  const ap = m[3].toUpperCase();
  if (ap === "PM" && h !== 12) h += 12;
  if (ap === "AM" && h === 12) h = 0;
  return { h24: h, min };
}

export function localBoundariesForYmd(ymd: string): { dayStartMs: number; dayEndPlusBufferMs: number } {
  const start = new Date(`${ymd}T00:00:00`);
  const end = new Date(`${ymd}T23:59:59.999`);
  return {
    dayStartMs: start.getTime(),
    dayEndPlusBufferMs: end.getTime() + msMinutes(240),
  };
}

export function splitSlotLabelSides(label: string): [string, string] | null {
  const normalized = label.replace(/\u2013/g, "-").replace(/\u2014/g, "-");
  const dashIndex = normalized.indexOf("-");
  if (dashIndex < 0) return null;
  const left = normalized.slice(0, dashIndex).trim();
  const right = normalized.slice(dashIndex + 1).trim();
  if (!left || !right) return null;
  return [left, right];
}

/** Convert YYYY-MM-DD + local window label into absolute ms boundaries. */
export function parseAvailabilityWindowMs(ymd: string, label: string): { startMs: number; endMs: number } | null {
  const parts = splitSlotLabelSides(label);
  if (!parts) return null;
  const parseSide = (s: string) => parse12hTokens(s);
  const a = parseSide(parts[0]);
  const b = parseSide(parts[1]);
  if (!a || !b) return null;
  const y = Number(ymd.slice(0, 4));
  const mo = Number(ymd.slice(5, 7)) - 1;
  const d = Number(ymd.slice(8, 10));
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
  const start = new Date(y, mo, d, a.h24, a.min, 0, 0);
  const end = new Date(y, mo, d, b.h24, b.min, 0, 0);
  const startMs = start.getTime();
  const endMs = end.getTime();
  if (!(startMs > 0 && endMs > startMs)) return null;
  return { startMs, endMs };
}

export function overlapsBusyInterval(aStartMs: number, aEndMs: number, busy: CalendarBusyPeriod[]): boolean {
  for (const p of busy) {
    const b0 = Date.parse(String(p.start));
    const b1 = Date.parse(String(p.end));
    if (Number.isNaN(b0) || Number.isNaN(b1) || b1 <= b0) continue;
    if (aStartMs < b1 && aEndMs > b0) return true;
  }
  return false;
}

/** Whether a prospective meeting `[start,start+duration]` collides with any busy slice. */
export function meetingSpanBlockedByBusy(
  meetingStartIso: string,
  durationMinutes: number,
  busy: CalendarBusyPeriod[],
): boolean {
  const ms0 = Date.parse(meetingStartIso);
  const ms1 = ms0 + msMinutes(durationMinutes);
  if (Number.isNaN(ms0) || ms1 <= ms0) return false;
  return overlapsBusyInterval(ms0, ms1, busy);
}

/**
 * Produce discrete slot labels stepping `stepMinutes` starts inside each availability window such that the full
 * `meetingDurationMinutes` fits before the window end. Matches product expectations like hiding 10:00 when Google has 10:00–10:30 blocked.
 */
function format12hEnglish(h24: number, min: number): string {
  const ap = h24 >= 12 ? "pm" : "am";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${h12}:${String(min).padStart(2, "0")} ${ap}`;
}

/**
 * Produce discrete slot labels stepping `stepMinutes` starts inside each availability window such that the full
 * `meetingDurationMinutes` fits before the window end. Matches product expectations like hiding 10:00 when Google has 10:00–10:30 blocked.
 */
export function expandSelectableSlotLabels(
  labels: string[],
  ymd: string,
  options: {
    meetingDurationMinutes: number;
    stepMinutes: number;
  },
): string[] {
  const { meetingDurationMinutes, stepMinutes } = options;
  const durMs = msMinutes(meetingDurationMinutes);
  const stepMs = msMinutes(stepMinutes);
  const out: string[] = [];
  const seen = new Set<string>();

  const y = Number(ymd.slice(0, 4));
  const mo = Number(ymd.slice(5, 7)) - 1;
  const d = Number(ymd.slice(8, 10));
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return [...labels];

  for (const label of labels) {
    const normalized = label.replace(/\u2013/g, "-").replace(/\u2014/g, "-");
    const w = parseAvailabilityWindowMs(ymd, normalized);
    if (!w) continue;
    for (let t = w.startMs; t + durMs <= w.endMs + 500; t += stepMs) {
      const key = `${t}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const start = new Date(t);
      const end = new Date(t + durMs);
      out.push(
        `${format12hEnglish(start.getHours(), start.getMinutes())} - ${format12hEnglish(end.getHours(), end.getMinutes())}`,
      );
    }
  }

  /** If nothing expands (narrow windows vs duration), omit rather than falsely showing coarse rows. */
  if (out.length === 0) {
    const anyParsed = labels.some((l) => parseAvailabilityWindowMs(ymd, l.replace(/\u2013/g, "-").replace(/\u2014/g, "-")));
    return anyParsed ? [] : [...labels];
  }

  return out;
}

function unwrapBusyPeriodsFromResponse(data: unknown): CalendarBusyPeriod[] {
  const isPeriodArray = (arr: unknown): arr is CalendarBusyPeriod[] =>
    Array.isArray(arr) &&
    arr.length > 0 &&
    arr.every((x) => {
      if (!x || typeof x !== "object") return false;
      const o = x as Record<string, unknown>;
      return typeof o.start === "string" && typeof o.end === "string";
    });

  const walk = (node: unknown, depth = 6): CalendarBusyPeriod[] | null => {
    if (depth <= 0 || node == null) return null;
    if (isPeriodArray(node)) return node;
    if (typeof node !== "object") return null;
    const o = node as Record<string, unknown>;
    const keys = ["data", "periods", "busy", "busyPeriods", "items", "events", "records", "results"];
    for (const k of keys) {
      const inner = walk(o[k], depth - 1);
      if (inner) return inner;
    }
    return null;
  };

  return walk(data) ?? [];
}

export type ApplyGoogleBusyResult = {
  slots: string[];
  skipped: boolean;
  error?: string;
  strippedCount: number;
  /** From merged `/availability` when present; null when unknown or legacy POST-only path. */
  googleMentorLinked?: boolean | null;
  googleParticipantLinked?: boolean | null;
  connectGoogleBanners?: string[];
  /** True when busy intervals came from GET `/availability/...`; false when legacy POST `/appointments/calendar/external-busy`. */
  usedMergedAvailabilityApi?: boolean;
};

/**
 * Fetches backend busy slices for all attendee ids inside the calendar day span, expands coarse windows,
 * removes anything overlapping merged busy spans, and optionally filters again at meeting duration granularity.
 */
export async function filterSlotLabelsAgainstExternalCalendar(options: {
  meetingDateYmd: string;
  rawSlotLabels: string[];
  /** Everyone whose Google Calendar matters for collisions (uniq host + attendee) — used for legacy busy POST fallback. */
  participantUserIds: string[];
  /** GET `/availability/:mentorUserId` — CCC host / mentor owning the grid. Enables merged Google busy + linked flags. */
  availabilityMentorUserId?: string;
  /** Participant (e.g. pastor) when narrowing Google busy to both calendars. */
  availabilityParticipantUserId?: string;
  meetingDurationMinutes?: number;
  gridStepMinutes?: number;
  /** When false, skips expansion — uses each raw row as booking start at parsed window opener (legacy). */
  expandIntoGrid?: boolean;
}): Promise<ApplyGoogleBusyResult> {
  const ids = [...new Set(options.participantUserIds.map((id) => String(id).trim()).filter(Boolean))];
  const ymd = options.meetingDateYmd.slice(0, 10);
  const { dayStartMs, dayEndPlusBufferMs } = localBoundariesForYmd(ymd);
  const fromIso = new Date(dayStartMs).toISOString();
  const toIso = new Date(dayEndPlusBufferMs).toISOString();

  let rawLabels = options.rawSlotLabels;
  let busy: CalendarBusyPeriod[] = [];
  let skipped = false;
  let mentorLinked: boolean | null = null;
  let participantLinked: boolean | null = null;
  let banners: string[] = [];
  let usedMergedAvailabilityApi = false;

  const mentorForMerge = options.availabilityMentorUserId?.trim();
  const participantForMerge = options.availabilityParticipantUserId?.trim();

  if (mentorForMerge) {
    try {
      const res = await apiGetMergedAvailabilityRange(mentorForMerge, {
        from: fromIso,
        to: toIso,
        ...(participantForMerge ? { participantUserId: participantForMerge } : {}),
      });

      if (res.status !== 404) {
        usedMergedAvailabilityApi = true;
        const mergedCcc = extractCccSlotLabelsForYmd(res.data, ymd);
        if (mergedCcc.length > 0) {
          rawLabels = mergedCcc;
        }

        const g = extractMergedGoogleBundle(res.data);
        mentorLinked = g.mentor.googleCalendarLinked;
        participantLinked = g.participant.googleCalendarLinked;
        busy = mergeBusyIntervals(g.mentor.busyIntervals, g.participant.busyIntervals);
        banners = buildGoogleConnectBanners(Boolean(participantForMerge), g.mentor, g.participant);
      }
    } catch (_e: unknown) {
      usedMergedAvailabilityApi = false;
      busy = [];
    }
  }

  const expanded =
    options.expandIntoGrid ?? true
      ? expandSelectableSlotLabels(rawLabels, ymd, {
          meetingDurationMinutes: options.meetingDurationMinutes ?? DEFAULT_DURATION_MIN,
          stepMinutes: options.gridStepMinutes ?? CALENDAR_GRID_STEP_MIN,
        })
      : [...rawLabels];

  if (usedMergedAvailabilityApi) {
    const duration = options.meetingDurationMinutes ?? DEFAULT_DURATION_MIN;
    const kept = expanded.filter((label) => {
      const iso = parseSlotStartToIso(ymd, label.replace(/\u2013/g, "-"));
      return !meetingSpanBlockedByBusy(iso, duration, busy);
    });

    return {
      slots: kept,
      skipped: false,
      strippedCount: Math.max(0, expanded.length - kept.length),
      googleMentorLinked: mentorLinked,
      googleParticipantLinked: participantLinked,
      connectGoogleBanners: banners,
      usedMergedAvailabilityApi: true,
    };
  }

  if (ids.length === 0) {
    return { slots: expanded, skipped: true, strippedCount: 0 };
  }

  try {
    const res = await apiFetchExternalCalendarBusy({
      userIds: ids,
      timeMin: fromIso,
      timeMax: toIso,
    });
    const status = res.status ?? 200;
    if (status === 404) {
      skipped = true;
      busy = [];
    } else {
      busy = unwrapBusyPeriodsFromResponse(res.data);
    }
  } catch (e: unknown) {
    const axiosStatus =
      typeof e === "object" && e !== null && "response" in e
        ? (e as { response?: { status?: number } }).response?.status
        : undefined;
    if (axiosStatus === 404) {
      skipped = true;
      busy = [];
    } else {
      return {
        slots: [],
        skipped: false,
        error: extractApiErrorMessage(e) || "Could not refresh Google Calendar",
        strippedCount: 0,
        usedMergedAvailabilityApi: false,
      };
    }
  }

  const duration = options.meetingDurationMinutes ?? DEFAULT_DURATION_MIN;

  const kept = expanded.filter((label) => {
    const iso = parseSlotStartToIso(ymd, label.replace(/\u2013/g, "-"));
    return !meetingSpanBlockedByBusy(iso, duration, busy);
  });

  return {
    slots: kept,
    skipped,
    strippedCount: Math.max(0, expanded.length - kept.length),
    usedMergedAvailabilityApi: false,
  };
}

function asPayloadRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" ? (body as Record<string, unknown>) : {};
}

/** Parse POST `/appointments` envelope for Google Calendar sync outcome. */
export function extractGoogleCalendarCreateOutcome(resBody: unknown): {
  successHints: string[];
  warnings: string[];
  mentorGoogleCalendarEventId?: string | null;
  userGoogleCalendarEventId?: string | null;
} {
  const body = asPayloadRecord(resBody);
  const data = asPayloadRecord(body.data);

  const warningsRaw = data.googleCalendarSyncWarnings;
  const warnings = Array.isArray(warningsRaw)
    ? warningsRaw.filter((x): x is string => typeof x === "string")
    : [];

  const mentorIdRaw = data.mentorGoogleCalendarEventId;
  const userIdRaw = data.userGoogleCalendarEventId;

  const successHints: string[] = [];

  const addIf = (id: unknown, role: string) => {
    if (typeof id === "string" && id.trim()) {
      successHints.push(`${role} Google Calendar event created.`);
    }
  };
  addIf(mentorIdRaw, "Mentor");
  addIf(userIdRaw, "Participant");

  if (!successHints.length && (data.googleCalendarHtmlLink ?? data.googleCalendarEventId)) {
    successHints.push("Event created in Google Calendar.");
  }

  return {
    successHints,
    warnings,
    mentorGoogleCalendarEventId: typeof mentorIdRaw === "string" ? mentorIdRaw : mentorIdRaw === null ? null : undefined,
    userGoogleCalendarEventId: typeof userIdRaw === "string" ? userIdRaw : userIdRaw === null ? null : undefined,
  };
}

/** Optional post-booking copy when `googleCalendarSync` was requested — uses API metadata when present. */
export function googleCalendarSuccessHintFromCreateResponse(resBody: unknown): string | undefined {
  const { successHints } = extractGoogleCalendarCreateOutcome(resBody);
  const primary = successHints.join(" ").trim();
  if (primary.length) return primary;

  const body = asPayloadRecord(resBody);
  const data = asPayloadRecord(body.data);
  const msg =
    typeof data.message === "string"
      ? data.message
      : typeof body.message === "string"
        ? body.message
        : "";
  const m = msg.toLowerCase();
  if (m.includes("google") && m.includes("calendar")) return msg;

  return undefined;
}
