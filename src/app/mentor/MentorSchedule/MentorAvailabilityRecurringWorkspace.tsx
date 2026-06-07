"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  AppointmentAvailabilityTimeSlot,
  PatchMentorAvailabilityDayPayload,
} from "@/app/Services/types/appointments.types";
import {
  apiCreateRecurringAvailability,
  apiGetAvailability,
  apiGetMonthlyAvailability,
  apiMarkAvailabilityDayAvailable,
  apiMarkAvailabilityDayUnavailable,
  apiPatchAvailabilityDay,
  apiPatchMentorAvailabilitySettings,
} from "@/app/Services/appointments.service";
import { extractApiErrorMessage, unwrapMonthlyAvailabilityPayload } from "@/app/Services/appointment-utils";
import {
  WEEKDAY_LABELS_SUN0,
  buildTemplateWeeklySlotsFromRows,
  classifyDayOccurrence,
  findAvailabilityRowForYmd,
  findOverlappingSlotPair,
  localCalendarYmd,
  normalizeTimeToken,
  slotFromUnknown,
  toSlotPeriod,
  utcReferenceYmdForWeekday,
} from "@/app/mentor/MentorSchedule/availability-recurring-utils";
import { timeOptions } from "@/app/Services/utils/helpers";
import {
  mentorBodyText,
  mentorEmptyPanel,
  mentorGlassCardFrost,
  mentorPrimaryCta,
  mentorSecondaryCta,
  mentorSelectDark,
} from "@/app/Components/mentor/mentor-theme";

type WeekRow = {
  dayIndexUtcSunday0: number;
  label: string;
  enabled: boolean;
  slots: AppointmentAvailabilityTimeSlot[];
};

function initialWeekRows(): WeekRow[] {
  return WEEKDAY_LABELS_SUN0.map((label, idx) => ({
    dayIndexUtcSunday0: idx,
    label,
    enabled: false,
    slots: [],
  }));
}

/** Walk nested `{ data }` wrappers and find an object carrying availability settings-ish keys. */
function digAvailabilityBlob(root: unknown, depth = 5): Record<string, unknown> | null {
  if (!root || typeof root !== "object" || depth <= 0) return null;
  const o = root as Record<string, unknown>;
  const has =
    typeof o.meetingDuration === "number" ||
    typeof o.advanceNotice === "number" ||
    typeof o.minSchedulingNoticeHours === "number" ||
    typeof o.maxBookingsPerDay === "number" ||
    typeof o.preferredPlatform === "string";
  if (has) return o;
  if (Array.isArray(o.templateWeeklySlots)) return o;
  const d = o.data;
  if (d && typeof d === "object") return digAvailabilityBlob(d, depth - 1);
  return o;
}

function coerceNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return fallback;
}

const PLATFORM_OPTIONS = [
  { label: "Zoom", value: "zoom" },
  { label: "Google Meet — coming soon", value: "google-meet", disabled: true },
  { label: "Microsoft Teams — coming soon", value: "teams", disabled: true },
  { label: "Phone — coming soon", value: "phone", disabled: true },
  { label: "In person — coming soon", value: "in-person", disabled: true },
] as const;

/** Display label for a calendar YYYY-MM-DD (wall date, for headings only). */
function formatYmdHeading(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return ymd;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (Number.isNaN(dt.getTime())) return ymd;
  return dt.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

/** Weekday name for `YYYY-MM-DD` (wall date) — sentence case, e.g. "Thursday". */
function weekdayLongFromYmd(ymd: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ymd.trim());
  if (!m) return "this weekday";
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  if (Number.isNaN(dt.getTime())) return "this weekday";
  return dt.toLocaleDateString(undefined, { weekday: "long" });
}

type MentorAvailabilityRecurringWorkspaceProps = {
  mentorId: string | null;
  /** Optional — forwarded to month/week queries when booking on behalf of another user. */
  participantUserId?: string;
  onToast: (message: string | null, kind?: "ok" | "err") => void;
  onAvailabilitySaved?: () => void;
};

export default function MentorAvailabilityRecurringWorkspace({
  mentorId,
  participantUserId,
  onToast,
  onAvailabilitySaved,
}: MentorAvailabilityRecurringWorkspaceProps) {
  const [weekRows, setWeekRows] = useState<WeekRow[]>(() => initialWeekRows());
  const [selectedWeekdayIndex, setSelectedWeekdayIndex] = useState<number | null>(null);
  const [horizonDays, setHorizonDays] = useState(60);
  const [clearPersonalizations, setClearPersonalizations] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [recurringBusy, setRecurringBusy] = useState(false);

  const [meetingDuration, setMeetingDuration] = useState(60);
  const [minNoticeHours, setMinNoticeHours] = useState(2);
  const [maxBookingsPerDay, setMaxBookingsPerDay] = useState(5);
  const [preferredPlatform, setPreferredPlatform] = useState("zoom");
  const [settingsBusy, setSettingsBusy] = useState(false);

  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [monthRows, setMonthRows] = useState<unknown[]>([]);
  const [monthLoading, setMonthLoading] = useState(false);

  const [dayModalYmd, setDayModalYmd] = useState<string | null>(null);
  const [dayModalSlots, setDayModalSlots] = useState<AppointmentAvailabilityTimeSlot[]>([]);
  const [dayModalBusy, setDayModalBusy] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [blockSelectionMode, setBlockSelectionMode] = useState(false);
  const [pendingBlockYmd, setPendingBlockYmd] = useState<string | null>(null);
  const [blockDayBusy, setBlockDayBusy] = useState(false);

  const selectedDayRow = useMemo(() => {
    if (!dayModalYmd) return undefined;
    return findAvailabilityRowForYmd(monthRows, dayModalYmd);
  }, [dayModalYmd, monthRows]);

  const selectedDayClass = useMemo(() => classifyDayOccurrence(selectedDayRow), [selectedDayRow]);

  const loadMonth = useCallback(async () => {
    if (!mentorId) return;
    setMonthLoading(true);
    try {
      const res = await apiGetMonthlyAvailability(mentorId, {
        year: calYear,
        month: calMonth + 1,
        ...(participantUserId ? { participantUserId } : {}),
      });
      setMonthRows(unwrapMonthlyAvailabilityPayload(res as { data?: unknown }));
    } catch (e) {
      console.error(e);
      setMonthRows([]);
      onToast(extractApiErrorMessage(e), "err");
    } finally {
      setMonthLoading(false);
    }
  }, [mentorId, calYear, calMonth, participantUserId, onToast]);

  const loadFullDoc = useCallback(async () => {
    if (!mentorId) return;
    setDocLoading(true);
    try {
      const res = await apiGetAvailability(mentorId);
      const blob = digAvailabilityBlob(res?.data);
      if (blob) {
        setMeetingDuration(
          (() => {
            const parsedDur = coerceNumber(blob.meetingDuration, 60);
            return parsedDur === 30 || parsedDur === 60 ? parsedDur : 60;
          })(),
        );
        setMinNoticeHours(
          coerceNumber(blob.minSchedulingNoticeHours ?? blob.advanceNotice ?? blob.minNoticeHours, 2),
        );
        setMaxBookingsPerDay(coerceNumber(blob.maxBookingsPerDay, 5));
        if (typeof blob.preferredPlatform === "string" && blob.preferredPlatform.trim()) {
          setPreferredPlatform(blob.preferredPlatform.trim().toLowerCase());
        }
        const tw = blob.templateWeeklySlots;
        if (Array.isArray(tw) && tw.length > 0) {
          const next = initialWeekRows();
          for (const row of tw) {
            if (!row || typeof row !== "object") continue;
            const r = row as Record<string, unknown>;
            const ds = typeof r.date === "string" ? r.date.slice(0, 10) : "";
            if (!/^\d{4}-\d{2}-\d{2}$/.test(ds)) continue;
            const di = new Date(`${ds}T12:00:00.000Z`).getUTCDay();
            const target = next.find((w) => w.dayIndexUtcSunday0 === di);
            const slotsRaw = r.slots;
            if (target && Array.isArray(slotsRaw) && slotsRaw.length > 0) {
              target.enabled = true;
              target.slots = slotsRaw.map(slotFromUnknown);
            }
          }
          setWeekRows(next);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setDocLoading(false);
    }
  }, [mentorId]);

  useEffect(() => {
    void loadFullDoc();
  }, [loadFullDoc]);

  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  const daysInMonth = useMemo(
    () => new Date(calYear, calMonth + 1, 0).getDate(),
    [calYear, calMonth],
  );
  const firstDow = useMemo(() => new Date(calYear, calMonth, 1).getDay(), [calYear, calMonth]);

  const saveRecurring = async () => {
    if (!mentorId) return;
    if (clearPersonalizations) {
      setConfirmClearOpen(true);
      return;
    }
    await submitRecurring(false);
  };

  const submitRecurring = async (withClear: boolean) => {
    if (!mentorId) return;
    const templateWeeklySlots = buildTemplateWeeklySlotsFromRows({ rows: weekRows });
    if (templateWeeklySlots.length === 0) {
      onToast("Enable at least one weekday and add at least one time window.", "err");
      return;
    }
    for (const d of templateWeeklySlots) {
      const overlap = findOverlappingSlotPair(d.slots);
      if (overlap) {
        const di = new Date(`${d.date}T12:00:00Z`).getUTCDay();
        onToast(
          `Overlapping slots on ${d.date} (${WEEKDAY_LABELS_SUN0[di]} template). Adjust times.`,
          "err",
        );
        return;
      }
      for (const slot of d.slots) {
        const span = slotSpanMinutes(slot);
        if (span < meetingDuration) {
          onToast(`Each window must span at least the meeting duration (${meetingDuration} min).`, "err");
          return;
        }
      }
    }
    setRecurringBusy(true);
    try {
      const res = await apiCreateRecurringAvailability({
        mentorId,
        templateWeeklySlots,
        horizonDays: Math.min(120, Math.max(7, horizonDays)),
        ...(withClear ? { clearPersonalizations: true as const } : {}),
        meetingDuration,
        minSchedulingNoticeHours: minNoticeHours,
        maxBookingsPerDay,
        preferredPlatform,
      });
      const msg =
        typeof (res.data as { message?: string } | undefined)?.message === "string"
          ? (res.data as { message: string }).message
          : "Recurring availability saved.";
      onToast(msg, "ok");
      setConfirmClearOpen(false);
      setClearPersonalizations(false);
      await loadMonth();
      await loadFullDoc();
      onAvailabilitySaved?.();
    } catch (e) {
      onToast(extractApiErrorMessage(e), "err");
    } finally {
      setRecurringBusy(false);
    }
  };

  /** Duration of one window (start→end). */
  const slotSpanMinutes = (slot: AppointmentAvailabilityTimeSlot): number => {
    const normalize = slotFromUnknown(slot);
    const sh = normalizeTimeToken(normalize.startTime);
    const eh = normalizeTimeToken(normalize.endTime);
    const parse = (x: string) => x.split(":").map((n) => parseInt(n, 10));
    const [sH, sM] = parse(sh);
    const [eH, eM] = parse(eh);
    let start = sH * 60 + sM;
    let end = eH * 60 + eM;
    if (normalize.startPeriod === "PM" && sH !== 12) start += 12 * 60;
    if (normalize.startPeriod === "AM" && sH === 12) start -= 12 * 60;
    if (normalize.endPeriod === "PM" && eH !== 12) end += 12 * 60;
    if (normalize.endPeriod === "AM" && eH === 12) end -= 12 * 60;
    return end - start;
  };

  const saveSettingsOnly = async () => {
    if (!mentorId) return;
    setSettingsBusy(true);
    try {
      const res = await apiPatchMentorAvailabilitySettings(mentorId, {
        meetingDuration,
        minSchedulingNoticeHours: minNoticeHours,
        maxBookingsPerDay,
        preferredPlatform,
      });
      const msg =
        typeof (res.data as { message?: string } | undefined)?.message === "string"
          ? (res.data as { message: string }).message
          : "Availability settings updated.";
      onToast(msg, "ok");
      onAvailabilitySaved?.();
    } catch (e) {
      onToast(extractApiErrorMessage(e), "err");
    } finally {
      setSettingsBusy(false);
    }
  };

  const openDayModal = (ymd: string) => {
    setDayModalYmd(ymd);
    const row = findAvailabilityRowForYmd(monthRows, ymd);
    const c = classifyDayOccurrence(row);
    setDayModalSlots(c.unavailable ? [] : c.slots.map((s) => ({ ...s })));
  };

  const requestBlockDay = (ymd: string) => {
    setPendingBlockYmd(ymd);
  };

  const confirmBlockDay = async () => {
    if (!mentorId || !pendingBlockYmd) return;
    setBlockDayBusy(true);
    try {
      await apiMarkAvailabilityDayUnavailable(mentorId, pendingBlockYmd);
      onToast("No meetings can be booked on this day.", "ok");
      setPendingBlockYmd(null);
      setBlockSelectionMode(false);
      await loadMonth();
      onAvailabilitySaved?.();
    } catch (e) {
      onToast(extractApiErrorMessage(e), "err");
    } finally {
      setBlockDayBusy(false);
    }
  };

  const closeDayModal = () => {
    setDayModalYmd(null);
    setDayModalSlots([]);
    setDayModalBusy(false);
  };

  const persistDayPatch = async (body: PatchMentorAvailabilityDayPayload) => {
    if (!mentorId || !dayModalYmd) return;
    setDayModalBusy(true);
    try {
      const res = await apiPatchAvailabilityDay(mentorId, body);
      const msg =
        typeof (res.data as { message?: string } | undefined)?.message === "string"
          ? (res.data as { message: string }).message
          : "Day updated.";
      onToast(msg, "ok");
      closeDayModal();
      await loadMonth();
      onAvailabilitySaved?.();
    } catch (e) {
      onToast(extractApiErrorMessage(e), "err");
    } finally {
      setDayModalBusy(false);
    }
  };

  if (!mentorId) {
    return (
      <div className={mentorEmptyPanel}>
        <p className={`${mentorBodyText} text-center`}>Sign in to set when you&apos;re available for meetings.</p>
      </div>
    );
  }

  const todayYmd = localCalendarYmd(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  const isViewingCurrentMonth = calYear === new Date().getFullYear() && calMonth === new Date().getMonth();

const hydrateWeekdaySlotsFromMonth = (dayIndex: number) => {
  setSelectedWeekdayIndex(dayIndex);

  setWeekRows((prev) =>
    prev.map((w) => {
      if (w.dayIndexUtcSunday0 !== dayIndex) return w;
      if (w.slots.length > 0) return { ...w, enabled: true };


  const matchingMonthRow = monthRows.find((raw) => {
  const row = raw as Record<string, unknown>;
  const ymd = String(row.date ?? row.day ?? row.calendarDate ?? "").slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return false;

  return new Date(`${ymd}T12:00:00`).getDay() === dayIndex;
});

const c: { unavailable: boolean; slots: AppointmentAvailabilityTimeSlot[] } =
  matchingMonthRow
    ? classifyDayOccurrence(matchingMonthRow as any)
    : { unavailable: false, slots: [] };
      return {
        ...w,
        enabled: true,
        slots: c.unavailable ? [] : c.slots.map((s) => ({ ...s })),
      };
    }),
  );
};

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-1 sm:px-0">
      {/* Page intro */}
      {/* <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="rounded-xl border border-[#8ec5eb]/20 bg-[#0a4066]/35 px-4 py-4 sm:px-5 sm:py-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 gap-3 sm:gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#8ec5eb]/15 text-[#8ec5eb] ring-1 ring-[#8ec5eb]/20">
                <i className="fa-regular fa-calendar-check text-xl" aria-hidden />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">Your availability</h2>
                <p className={`mt-1.5 max-w-2xl text-sm leading-relaxed ${mentorBodyText}`}>
                  Set a repeating weekly pattern, adjust booking rules, then tap dates on the calendar for one-off changes.
                </p>
              </div>
            </div>
            <ol className="flex shrink-0 flex-wrap gap-2 text-[12px] text-[#cde2f2]/90 md:justify-end">
              {[
                ["1", "Weekly pattern"],
                ["2", "Booking rules"],
                ["3", "Calendar tweaks"],
              ].map(([step, label]) => (
                <li
                  key={step}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#8ec5eb]/15 text-[11px] font-semibold text-[#8ec5eb]">
                    {step}
                  </span>
                  <span className="whitespace-nowrap">{label}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="rounded-xl border border-white/12 bg-white/[0.05] px-4 py-4 text-white shadow-[0_12px_34px_rgba(0,0,0,0.12)] sm:px-5">
          <div className="mb-3 flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f5cc76]/15 text-[#f5cc76]">
              <i className="fa-solid fa-circle-info text-sm" aria-hidden />
            </span>
            <h3 className="text-sm font-semibold">How availability works</h3>
          </div>
          <ul className="space-y-2 text-[12px] leading-relaxed text-[#cde2f2]/85">
            <li className="flex gap-2">
              <i className="fa-solid fa-check mt-1 text-[10px] text-[#8ec5eb]" aria-hidden />
              <span>Set your availability for each day of the week.</span>
            </li>
            <li className="flex gap-2">
              <i className="fa-solid fa-check mt-1 text-[10px] text-[#8ec5eb]" aria-hidden />
              <span>It repeats automatically for the next 60 days.</span>
            </li>
            <li className="flex gap-2">
              <i className="fa-solid fa-check mt-1 text-[10px] text-[#8ec5eb]" aria-hidden />
              <span>You can block or edit specific dates anytime.</span>
            </li>
          </ul>
        </div>
      </div> */}

      {/* <div className="rounded-xl border border-white/12 bg-white/[0.05] px-5 py-4 text-white shadow-[0_12px_34px_rgba(0,0,0,0.12)]">
  <div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-[13px] text-[#cde2f2]/90">
    <h3 className="mr-2 text-sm font-semibold text-white">
      How availability works
    </h3>

    <span className="flex items-center gap-2">
      <i className="fa-solid fa-check text-[#8ec5eb]" />
      Set your availability for each day of the week.
    </span>

    <span className="flex items-center gap-2">
      <i className="fa-solid fa-check text-[#8ec5eb]" />
      Repeats automatically for the next 60 days.
    </span>

    <span className="flex items-center gap-2">
      <i className="fa-solid fa-check text-[#8ec5eb]" />
      Block or edit specific dates anytime.
    </span>
  </div>
</div> */}
<div className="rounded-2xl border border-[#8ec5eb]/55 bg-[linear-gradient(90deg,rgba(10,64,102,0.55),rgba(255,255,255,0.06))] px-6 py-6 text-white shadow-[0_0_0_1px_rgba(142,197,235,0.12),0_18px_45px_rgba(0,0,0,0.22)]">
  <div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-[13px] text-[#d9ebf8] lg:flex-nowrap">
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8ec5eb]/25 text-[#8ec5eb] ring-1 ring-[#8ec5eb]/35">
      <i className="fa-solid fa-circle-info text-base" aria-hidden />
    </span>

    <h3 className="shrink-0 text-base font-semibold text-white">
      How availability works
    </h3>

    <span className="hidden h-9 w-px bg-white/10 lg:block" />

    <span className="flex min-w-0 items-center gap-2">
      <i className="fa-solid fa-check shrink-0 text-[#8ec5eb]" />
      <span>Set your availability for each day of the week.</span>
    </span>

    <span className="hidden h-9 w-px bg-white/10 lg:block" />

    <span className="flex min-w-0 items-center gap-2">
      <i className="fa-solid fa-check shrink-0 text-[#8ec5eb]" />
      <span>Repeats automatically for the next 60 days.</span>
    </span>

    <span className="hidden h-9 w-px bg-white/10 lg:block" />

    <span className="flex min-w-0 items-center gap-2">
      <i className="fa-solid fa-check shrink-0 text-[#8ec5eb]" />
      <span>Block or edit specific dates anytime.</span>
    </span>
  </div>
</div>

      <div className={`${mentorGlassCardFrost} p-5 sm:p-7 text-white shadow-[0_12px_40px_rgba(0,0,0,0.12)]`}>
        <div className="mb-5 flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
          {/* <div>
            <h3 className="text-base font-semibold sm:text-[17px]">
  Step 1 — Set your weekly availability
</h3>
            <p className="mt-1 text-[13px] text-[#cde2f2]/85">Choose which days you&apos;re open and add time windows.</p>
          </div> */}
          <div>
  <div className="flex flex-wrap items-center gap-3">
    <h3 className="text-base font-semibold sm:text-[17px]">
      Step 1 — Set your weekly availability
    </h3>

    <span className="rounded-full border border-emerald-400/20 bg-emerald-400/15 px-3 py-1 text-[11px] font-semibold text-emerald-300">
      Repeats for next 60 days
    </span>
  </div>

  <p className="mt-1 text-[13px] text-[#cde2f2]/85">
    Your time slots will repeat weekly for the next 60 days.
  </p>
</div>
        </div>

        {/* <div className="mb-6 rounded-xl border border-white/10 bg-black/20 p-4">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={clearPersonalizations}
              onChange={(e) => setClearPersonalizations(e.target.checked)}
              className="mt-1 size-4 shrink-0 accent-amber-400"
            />
            <span className="text-[13px] leading-snug text-[#cde2f2]/90">
              <span className="font-semibold text-white">Advanced:</span> When I save my repeating pattern, also remove all{' '}
              <span className="underline decoration-[#8ec5eb]/50">single-day edits</span> I made on the calendar. You&apos;ll be asked to
              confirm.
            </span>
          </label>
        </div> */}

        {/* <details className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-[13px] text-[#cde2f2]/90 open:bg-white/[0.05]">
          <summary className="cursor-pointer list-none font-medium text-[#8ec5eb] outline-none [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <i className="fa-solid fa-globe text-xs opacity-90" aria-hidden />
              UTC reference dates for each weekday
              <i className="fa-solid fa-chevron-down ml-1 text-[10px] opacity-70" aria-hidden />
            </span>
          </summary>
          <p className="mt-2 text-[11px] text-[#cde2f2]/65">
            These anchors are how the backend maps toggles — you normally don&apos;t need to edit them.
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {weekRows.map((r) => (
              <li
                key={r.dayIndexUtcSunday0}
                className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-3 py-2"
              >
                <span className="text-white">{r.label}</span>
                <code className="shrink-0 rounded-md bg-black/35 px-2 py-0.5 text-[11px] text-emerald-200/95">
                  {utcReferenceYmdForWeekday(r.dayIndexUtcSunday0)}
                </code>
              </li>
            ))}
          </ul>
        </details> */}
<div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
  {weekRows.map((row) => {
    const isSelected = selectedWeekdayIndex === row.dayIndexUtcSunday0;

    return (
      <button
        key={row.dayIndexUtcSunday0}
        type="button"
        // onClick={() => {
        //   setSelectedWeekdayIndex(row.dayIndexUtcSunday0);

        //   setWeekRows((prev) =>
        //     prev.map((w) =>
        //       w.dayIndexUtcSunday0 === row.dayIndexUtcSunday0
        //         ? { ...w, enabled: true }
        //         : w,
        //     ),
        //   );
        // }}
        onClick={() => hydrateWeekdaySlotsFromMonth(row.dayIndexUtcSunday0)}
        className={`relative rounded-xl border px-4 py-4 text-center transition ${
          isSelected
            ? "border-[#139cff] bg-[#082f55]/80 text-white shadow-[0_0_22px_rgba(19,156,255,0.22)]"
            : "border-white/12 bg-white/[0.04] text-[#cde2f2] hover:border-[#8ec5eb]/45 hover:bg-[#8ec5eb]/10"
        }`}
      >
        <p className="text-sm font-semibold">{row.label}</p>

        <p className={`mt-1 text-xs ${row.enabled ? "text-[#8ec5eb]" : "text-[#cde2f2]/75"}`}>
          {row.enabled ? "Set" : "Not set"}
        </p>

        {/* {row.enabled && (
          <p className="mt-2 rounded-full bg-emerald-400/15 px-2 py-1 text-[10px] font-semibold text-emerald-300">
            Repeats weekly
          </p>
        )} */}

        {isSelected && (
          <span className="absolute -bottom-2 left-1/2 h-0 w-0 -translate-x-1/2 border-l-[8px] border-r-[8px] border-t-[8px] border-l-transparent border-r-transparent border-t-[#139cff]" />
        )}
      </button>
    );
  })}
</div>

{selectedWeekdayIndex !== null &&
  weekRows
    .filter((row) => row.dayIndexUtcSunday0 === selectedWeekdayIndex)
    .map((row) => (
      <div
        key={`editor-${row.dayIndexUtcSunday0}`}
        className="rounded-2xl border border-white/12 bg-white/[0.04] p-5"
      >
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <h4 className="text-base font-semibold text-white">
            {row.label} availability
          </h4>

          <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
            Applies every {row.label} up to 60 days
          </span>
        </div>

        {row.slots.length === 0 && (
          <p className="mb-4 rounded-xl border border-[#8ec5eb]/20 bg-[#8ec5eb]/10 px-4 py-3 text-[13px] text-[#cde2f2]">
            No time slots added yet. Add a time slot for every {row.label}.
          </p>
        )}

        <div className="space-y-3">
          {row.slots.map((slot, idx) => (
            <SlotRowEditor
              key={idx}
              slot={slot}
              onPatch={(patch) =>
                setWeekRows((prev) =>
                  prev.map((w) => {
                    if (w.dayIndexUtcSunday0 !== row.dayIndexUtcSunday0) return w;
                    const nextSlots = [...w.slots];
                    nextSlots[idx] = { ...nextSlots[idx], ...patch };
                    return { ...w, slots: nextSlots };
                  }),
                )
              }
              onRemove={() =>
                setWeekRows((prev) =>
                  prev.map((w) =>
                    w.dayIndexUtcSunday0 === row.dayIndexUtcSunday0
                      ? { ...w, slots: w.slots.filter((_, j) => j !== idx) }
                      : w,
                  ),
                )
              }
            />
          ))}

          <button
            type="button"
            onClick={() =>
              setWeekRows((prev) =>
                prev.map((w) =>
                  w.dayIndexUtcSunday0 === row.dayIndexUtcSunday0
                    ? {
                        ...w,
                        enabled: true,
                        slots: [
                          ...w.slots,
                          {
                            startTime: "9:00",
                            startPeriod: "AM",
                            endTime: "12:00",
                            endPeriod: "PM",
                          },
                        ],
                      }
                    : w,
                ),
              )
            }
            className={`${mentorSecondaryCta} inline-flex items-center gap-2 px-4 py-2 text-[13px]`}
          >
            <i className="fa-solid fa-plus text-[11px]" aria-hidden />
            Add time slot
          </button>
        </div>
      </div>
    ))}
        {/* <div className="space-y-4">
          {weekRows.map((row) => (
            <div
              key={row.dayIndexUtcSunday0}
              className="rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-4 sm:p-5"
            >
              <label className="mb-3 flex cursor-pointer items-center gap-3 text-[15px] font-medium text-white">
                <input
                  type="checkbox"
                  checked={row.enabled}
                  onChange={(e) =>
                    setWeekRows((prev) =>
                      prev.map((w) =>
                        w.dayIndexUtcSunday0 === row.dayIndexUtcSunday0 ? { ...w, enabled: e.target.checked } : w,
                      ),
                    )
                  }
                  className="size-4 accent-[#8ec5eb]"
                />
                {row.label}
                <span className="text-[12px] font-normal text-[#cde2f2]/60">Repeats weekly</span>
              </label>
              {row.enabled && (
                <div className="space-y-3 border-t border-white/10 pt-4">
                  {row.slots.length === 0 && (
                    <p className="rounded-lg bg-[#8ec5eb]/10 px-3 py-2 text-[13px] text-[#8ec5eb]">
                      Add one or more time windows so others can book this day.
                    </p>
                  )}
                  {row.slots.map((slot, idx) => (
                    <SlotRowEditor
                      key={idx}
                      slot={slot}
                      onPatch={(patch) =>
                        setWeekRows((prev) =>
                          prev.map((w) => {
                            if (w.dayIndexUtcSunday0 !== row.dayIndexUtcSunday0) return w;
                            const nextSlots = [...w.slots];
                            nextSlots[idx] = { ...nextSlots[idx], ...patch };
                            return { ...w, slots: nextSlots };
                          }),
                        )
                      }
                      onRemove={() =>
                        setWeekRows((prev) =>
                          prev.map((w) =>
                            w.dayIndexUtcSunday0 === row.dayIndexUtcSunday0
                              ? { ...w, slots: w.slots.filter((_, j) => j !== idx) }
                              : w,
                          ),
                        )
                      }
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setWeekRows((prev) =>
                        prev.map((w) =>
                          w.dayIndexUtcSunday0 === row.dayIndexUtcSunday0
                            ? {
                                ...w,
                                enabled: true,
                                slots: [
                                  ...w.slots,
                                  {
                                    startTime: "9:00",
                                    startPeriod: "AM",
                                    endTime: "12:00",
                                    endPeriod: "PM",
                                  },
                                ],
                              }
                            : w,
                        ),
                      )
                    }
                    className={`${mentorSecondaryCta} inline-flex items-center gap-2 px-4 py-2 text-[13px]`}
                  >
                    <i className="fa-solid fa-plus text-[11px]" aria-hidden />
                    Add 
                  </button>
                </div>
              )}
            </div>
          ))}
        </div> */}

        {/* <div className="mt-8 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-[#cde2f2]/70">
            {docLoading ? 'Loading your saved pattern…' : 'Saving updates your repeating schedule and refreshes the calendar.'}
          </p>
          <button
            type="button"
            disabled={recurringBusy || docLoading}
            onClick={() => void saveRecurring()}
            className={`${mentorPrimaryCta} min-h-[44px] px-6 py-2.5 text-[15px] font-semibold sm:shrink-0`}
          >
            {recurringBusy ? (
              <>
                <i className="fa-solid fa-spinner fa-spin mr-2" aria-hidden />
                Saving…
              </>
            ) : (
              <>
                <i className="fa-regular fa-floppy-disk mr-2" aria-hidden />
                Save repeating schedule
              </>
            )}
          </button>
        </div> */}
        <div className="mt-8 border-t border-white/10 pt-5">
  <p className="text-[12px] text-[#cde2f2]/70">
    After choosing your weekly days and time windows, continue to Step 2 to set booking rules and save the repeating schedule.
  </p>
</div>
      </div>

      {/* Settings */}
      <div className={`${mentorGlassCardFrost} p-5 text-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] sm:p-7`}>
        <div className="mb-5 border-b border-white/10 pb-4">
          <h3 className="text-base font-semibold sm:text-[17px]">Step 2 — Booking rules</h3>
          <p className="mt-1 text-[13px] text-[#cde2f2]/85">
            These defaults apply to all meetings unless you override a specific day on the calendar.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block text-[13px] font-medium text-white">
            <span className="mb-1.5 block">Meeting length</span>
            <span className="mb-2 block text-[11px] font-normal text-[#cde2f2]/65">Each bookable slot must fit this duration</span>
            <select
              className={`${mentorSelectDark} w-full`}
              value={String(meetingDuration)}
              onChange={(e) => setMeetingDuration(Number(e.target.value))}
            >
              <option value="30" disabled>30 minutes</option>
              <option value="60">60 minutes</option>
            </select>
          </label>
          <label className="block text-[13px] font-medium text-white">
            <span className="mb-1.5 block">Minimum notice</span>
            <span className="mb-2 block text-[11px] font-normal text-[#cde2f2]/65">Hours before someone can book</span>
            {/* <input
              type="number"
              min={1}
              max={168}
              value={minNoticeHours}
              onChange={(e) => setMinNoticeHours(Math.max(1, Math.min(168, Number(e.target.value) || 1)))}
              className={`${mentorSelectDark} w-full`}
            /> */}
            <input
  type="number"
  value={2}
  disabled
  className={`${mentorSelectDark} w-full cursor-not-allowed opacity-70`}
/>
          </label>
          {/* <label className="block text-[13px] font-medium text-white">
            <span className="mb-1.5 block">Meetings per day</span>
            <span className="mb-2 block text-[11px] font-normal text-[#cde2f2]/65">Maximum on one calendar day</span>
            <input
              type="number"
              min={1}
              max={50}
              value={maxBookingsPerDay}
              onChange={(e) => setMaxBookingsPerDay(Math.max(1, Number(e.target.value) || 1))}
              className={`${mentorSelectDark} w-full`}
            />
          </label> */}
          <label className="block text-[13px] font-medium text-white">
            <span className="mb-1.5 block">Preferred meeting type</span>
            <span className="mb-2 block text-[11px] font-normal text-[#cde2f2]/65">Shown as your default choice</span>
            <select
              className={`${mentorSelectDark} w-full`}
              value={preferredPlatform}
              onChange={(e) => setPreferredPlatform(e.target.value)}
            >
              {PLATFORM_OPTIONS.map((p) => (
                <option key={p.value} value={p.value} disabled={"disabled" in p ? p.disabled : false}>
                  {p.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        {/* <p className="mt-5 text-[12px] leading-relaxed text-[#cde2f2]/70">
          Saving here only updates these rules — it does not redraw your repeating week. Use{' '}
          <span className="text-[#cde2f2]/90">&quot;Save repeating schedule&quot;</span> above to change which days repeat.
        </p> */}
        <p className="mt-5 text-[12px] leading-relaxed text-[#cde2f2]/70">
  After setting your booking rules, save your repeating schedule to publish the weekly pattern and refresh the calendar.
</p>
        {/* <button
          type="button"
          disabled={settingsBusy}
          onClick={() => void saveSettingsOnly()}
          className={`${mentorSecondaryCta} mt-5 min-h-[44px] px-5 py-2.5 text-[14px] font-semibold`}
        >
          {settingsBusy ? (
            <>
              <i className="fa-solid fa-spinner fa-spin mr-2" aria-hidden />
              Saving rules…
            </>
          ) : (
            <>
              <i className="fa-regular fa-pen-to-square mr-2" aria-hidden />
              Save booking rules only
            </>
          )}
        </button> */}
        {/* <div className="mt-5 flex flex-wrap gap-3">
  <button
    type="button"
    disabled={settingsBusy}
    onClick={() => void saveSettingsOnly()}
    className={`${mentorSecondaryCta} min-h-[44px] px-5 py-2.5 text-[14px] font-semibold`}
  >
    {settingsBusy ? (
      <>
        <i className="fa-solid fa-spinner fa-spin mr-2" aria-hidden />
        Saving rules…
      </>
    ) : (
      <>
        <i className="fa-regular fa-pen-to-square mr-2" aria-hidden />
        Save booking rules only
      </>
    )}
  </button>

  <button
    type="button"
    disabled={recurringBusy || docLoading}
    onClick={() => void saveRecurring()}
    className={`${mentorPrimaryCta} min-h-[44px] px-5 py-2.5 text-[14px] font-semibold`}
  >
    {recurringBusy ? (
      <>
        <i className="fa-solid fa-spinner fa-spin mr-2" aria-hidden />
        Saving…
      </>
    ) : (
      <>
        <i className="fa-regular fa-floppy-disk mr-2" aria-hidden />
        Save repeating schedule
      </>
    )}
  </button>
</div> */}
<div className="mt-6 flex justify-end border-t border-white/10 pt-5">
  <button
    type="button"
    disabled={recurringBusy || docLoading}
    onClick={() => void saveRecurring()}
    className={`${mentorPrimaryCta} min-h-[44px] px-6 py-2.5 text-[14px] font-semibold`}
  >
    {recurringBusy ? (
      <>
        <i className="fa-solid fa-spinner fa-spin mr-2" aria-hidden />
        Saving…
      </>
    ) : (
      <>
        <i className="fa-regular fa-floppy-disk mr-2" aria-hidden />
        Save availability
      </>
    )}
  </button>
</div>
      </div>

      {/* Month grid */}
      <div className={`${mentorGlassCardFrost} p-5 text-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] sm:p-7`}>
        <div className="mb-2 border-b border-white/10 pb-4">
          <h3 className="text-base font-semibold sm:text-[17px]">Step 3 — Calendar</h3>
          <p className="mt-1 text-[13px] text-[#cde2f2]/85">
            Tap a future day to edit that date only, block it completely, or clear a custom slot.
          </p>
        </div>
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`${mentorSecondaryCta} min-h-[40px] min-w-[40px] px-3`}
              onClick={() => {
                if (calMonth === 0) {
                  setCalMonth(11);
                  setCalYear(calYear - 1);
                } else setCalMonth(calMonth - 1);
              }}
              aria-label="Previous month"
            >
              <i className="fa-solid fa-chevron-left" aria-hidden />
            </button>
            <h4 className="min-w-[10rem] text-center text-[16px] font-semibold tabular-nums sm:min-w-[14rem]">
              {new Date(calYear, calMonth, 1).toLocaleString("default", { month: "long", year: "numeric" })}
            </h4>
            <button
              type="button"
              className={`${mentorSecondaryCta} min-h-[40px] min-w-[40px] px-3`}
              onClick={() => {
                if (calMonth === 11) {
                  setCalMonth(0);
                  setCalYear(calYear + 1);
                } else setCalMonth(calMonth + 1);
              }}
              aria-label="Next month"
            >
              <i className="fa-solid fa-chevron-right" aria-hidden />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {blockSelectionMode && (
              <span className="rounded-lg border border-amber-300/25 bg-amber-400/10 px-3 py-2 text-[12px] text-amber-100">
                Select a future day to block
              </span>
            )}
            {/* <button
              type="button"
              disabled={monthLoading}
              onClick={() => {
                setBlockSelectionMode((v) => !v);
                setPendingBlockYmd(null);
              }}
              className={`${mentorSecondaryCta} text-[13px] disabled:pointer-events-none disabled:opacity-45`}
            >
              {blockSelectionMode ? "Cancel block" : "Block a day"}
            </button> */}
            <button
              type="button"
              disabled={monthLoading || isViewingCurrentMonth}
              onClick={() => {
                const n = new Date();
                setCalYear(n.getFullYear());
                setCalMonth(n.getMonth());
              }}
              className={`${mentorSecondaryCta} text-[13px] disabled:pointer-events-none disabled:opacity-45`}
            >
              Jump to today
            </button>
          </div>
        </div>
        {monthLoading && (
          <p className="mb-4 flex items-center gap-2 text-[13px] text-[#8ec5eb]">
            <i className="fa-solid fa-spinner fa-spin" aria-hidden />
            Updating calendar…
          </p>
        )}
        <div className="mb-4 flex flex-wrap gap-4 text-[11px] text-[#cde2f2]/90">
          <span className="inline-flex items-center gap-2">
            <span className="inline-block size-3 rounded-sm border border-white/25 bg-emerald-500/30" aria-hidden />
            Open — has time windows
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block size-3 rounded-sm border border-red-400/40 bg-red-500/20" aria-hidden />
            Blocked
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="inline-block size-3 rounded-sm border-2 border-[#8ec5eb] bg-white/[0.06]" aria-hidden />
            Today
          </span>
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-semibold uppercase tracking-wide text-[#8ec5eb]/90">
          {WEEKDAY_LABELS_SUN0.map((d) => (
            <div key={d} className="py-2">
              {d.slice(0, 3)}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1.5 text-[13px]">
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dom = i + 1;
            const ymd = localCalendarYmd(calYear, calMonth, dom);
            const row = findAvailabilityRowForYmd(monthRows, ymd);
            const c = classifyDayOccurrence(row);
            const isPast = new Date(ymd + "T23:59:59") < new Date(new Date().toDateString());
            const isTodayCell = ymd === todayYmd;
            return (
              <button
                key={ymd}
                type="button"
                disabled={isPast}
                onClick={() => (blockSelectionMode ? requestBlockDay(ymd) : openDayModal(ymd))}
                aria-label={`${ymd}${isPast ? ', past date' : ', open availability options'}`}
                className={`flex min-h-[58px] flex-col items-center justify-center rounded-xl border px-0.5 py-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8ec5eb]/70 ${
                  isPast
                    ? "cursor-not-allowed border-white/5 bg-transparent opacity-30"
                    : isTodayCell
                      ? "border-[#8ec5eb] bg-[#8ec5eb]/15 hover:bg-[#8ec5eb]/25"
                      : "border-white/12 bg-white/[0.04] hover:border-[#8ec5eb]/45 hover:bg-[#8ec5eb]/10"
                } ${!isPast && c.unavailable ? "border-red-400/35 bg-red-500/[0.12]" : ""} ${
                  !isPast && !c.unavailable && c.slots.length > 0 ? "border-emerald-400/35 bg-emerald-500/[0.1]" : ""
                }`}
              >
                <span className="font-semibold tabular-nums text-white">{dom}</span>
                {c.unavailable ? (
                  <span className="mt-0.5 text-[10px] font-medium text-red-200">Off</span>
                ) : c.slots.length > 0 ? (
                  <span className="mt-0.5 text-[10px] font-medium text-emerald-200">{c.slots.length} slots</span>
                ) : (
                  <span className="mt-0.5 text-[10px] text-[#cde2f2]/55">Tap</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Destructive confirm */}
      {confirmClearOpen && (
        <ConfirmOverlay
          title="Remove all custom days?"
          body="Your new repeating schedule will apply, but every one-off change you made on the calendar will be erased. You can’t undo that from here."
          cancelLabel="Go back"
          confirmLabel={recurringBusy ? "Working…" : "Yes — save & clear customs"}
          busy={recurringBusy}
          onCancel={() => setConfirmClearOpen(false)}
          onConfirm={() => void submitRecurring(true)}
        />
      )}

      {pendingBlockYmd && (
        <ConfirmOverlay
          title="Block this day?"
          body={`${formatYmdHeading(pendingBlockYmd)} will be unavailable for booking. Existing modal blocking remains unchanged.`}
          cancelLabel="Cancel"
          confirmLabel={blockDayBusy ? "Blocking..." : "Block day"}
          busy={blockDayBusy}
          onCancel={() => !blockDayBusy && setPendingBlockYmd(null)}
          onConfirm={() => void confirmBlockDay()}
        />
      )}

      {dayModalYmd && mentorId && (
        <DayModal
          mentorId={mentorId}
          ymd={dayModalYmd}
          busy={dayModalBusy}
          slots={dayModalSlots}
          onSlotsChange={setDayModalSlots}
          classify={selectedDayClass}
          meetingDuration={meetingDuration}
          onClose={() => !dayModalBusy && closeDayModal()}
          setBusy={setDayModalBusy}
          onSavePatch={(body) => void persistDayPatch(body)}
          onReload={async () => {
            await loadMonth();
            await loadFullDoc();
          }}
          onToast={onToast}
        />
      )}
    </div>
  );
}

/** Single slot editing row shared by template + modal (minimal). */
function SlotRowEditor({
  slot,
  onPatch,
  onRemove,
}: {
  slot: AppointmentAvailabilityTimeSlot;
  onPatch: (patch: Partial<AppointmentAvailabilityTimeSlot>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/12 bg-black/25 p-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
      <div className="min-w-[7rem] flex-1">
        <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8ec5eb]/90">Starts</span>
        <select
          className={`${mentorSelectDark} min-h-[40px] w-full text-[12px]`}
          value={`${slot.startTime}-${slot.startPeriod}`}
          onChange={(e) => {
            const [time, slotPeriod] = e.target.value.split("-");
            onPatch({
              startTime: normalizeTimeToken(time),
              startPeriod: toSlotPeriod(slotPeriod, "AM"),
            });
          }}
          aria-label="Start time"
        >
          {timeOptions.map((t) => (
            <option key={`s-${t.label}`} value={`${t.time}-${t.period}`}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <span className="hidden text-sm text-[#cde2f2]/75 sm:inline sm:pb-2.5">→</span>
      <div className="min-w-[7rem] flex-1">
        <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8ec5eb]/90">Ends</span>
        <select
          className={`${mentorSelectDark} min-h-[40px] w-full text-[12px]`}
          value={`${slot.endTime}-${slot.endPeriod}`}
          onChange={(e) => {
            const [time, slotPeriod] = e.target.value.split("-");
            onPatch({
              endTime: normalizeTimeToken(time),
              endPeriod: toSlotPeriod(slotPeriod, "PM"),
            });
          }}
          aria-label="End time"
        >
          {timeOptions.map((t) => (
            <option key={`e-${t.label}`} value={`${t.time}-${t.period}`}>
              {t.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-[12px] font-medium text-red-200 transition hover:bg-red-500/20 sm:mb-0 sm:ml-auto"
        aria-label="Remove this time window"
      >
        <i className="fa-solid fa-trash-can text-[11px]" aria-hidden />
        <span className="sm:inline">Remove</span>
      </button>
    </div>
  );
}

function ConfirmOverlay(props: {
  title: string;
  body: string;
  cancelLabel: string;
  confirmLabel: string;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" onClick={() => !props.busy && props.onCancel()} />
      <div className="fixed left-1/2 top-1/2 z-[61] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-amber-400/30 bg-[#062946] shadow-2xl">
        <div className="flex gap-3 border-b border-amber-500/20 bg-amber-500/10 px-5 py-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/25 text-amber-100">
            <i className="fa-solid fa-triangle-exclamation text-lg" aria-hidden />
          </span>
          <div>
            <h4 className="text-lg font-semibold text-white">{props.title}</h4>
            <p className="mt-1 text-sm leading-relaxed text-[#fdecc8]/95">{props.body}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 bg-[#052238] px-5 py-4">
          <button type="button" disabled={props.busy} onClick={props.onCancel} className={mentorSecondaryCta}>
            {props.cancelLabel}
          </button>
          <button type="button" disabled={props.busy} onClick={props.onConfirm} className={`${mentorPrimaryCta} border border-amber-400/25`}>
            {props.confirmLabel}
          </button>
        </div>
      </div>
    </>
  );
}

function DayModal(props: {
  mentorId: string;
  ymd: string;
  busy: boolean;
  slots: AppointmentAvailabilityTimeSlot[];
  onSlotsChange: (s: AppointmentAvailabilityTimeSlot[]) => void;
  classify: { unavailable: boolean; slots: AppointmentAvailabilityTimeSlot[] };
  meetingDuration: number;
  onClose: () => void;
  setBusy: (v: boolean) => void;
  onSavePatch: (body: PatchMentorAvailabilityDayPayload) => void;
  onReload: () => Promise<void>;
  onToast: (m: string | null, kind?: "ok" | "err") => void;
}) {
  const {
    mentorId,
    ymd,
    busy,
    slots,
    onSlotsChange,
    classify,
    meetingDuration,
    onClose,
    setBusy,
    onSavePatch,
    onReload,
    onToast,
  } = props;

  const [blockDayAcknowledged, setBlockDayAcknowledged] = useState(false);

  useEffect(() => {
    setBlockDayAcknowledged(false);
  }, [ymd]);

  const run = async (fn: () => Promise<void>) => {
    try {
      setBusy(true);
      await fn();
    } catch (e) {
      onToast(extractApiErrorMessage(e), "err");
    } finally {
      setBusy(false);
    }
  };

  const validateSlots = (): boolean => {
    const pair = findOverlappingSlotPair(slots);
    if (pair) {
      onToast("Slots overlap on this day — adjust before saving.", "err");
      return false;
    }
    for (const s of slots) {
      const span = slotSpanMinutesForModal(s);
      if (span < meetingDuration) {
        onToast(`Each window must be at least ${meetingDuration} minutes.`, "err");
        return false;
      }
    }
    return true;
  };

  const showEditors = slots.length > 0 || !classify.unavailable;

  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/55 backdrop-blur-sm" onClick={() => !busy && onClose()} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="avail-day-modal-title"
        className="fixed left-1/2 top-1/2 z-[61] max-h-[92vh] w-[94vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-white/20 bg-[#041f35] shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-white/10 bg-[#062946]/98 px-4 py-4 sm:px-5">
          <div className="min-w-0 pr-2">
            <p id="avail-day-modal-title" className="text-[17px] font-semibold leading-snug tracking-tight text-white">
              Set custom availability
            </p>
            <p className="mt-2 flex items-center gap-2 text-[13px] text-[#cde2f2]/85">
              <i className="fa-regular fa-calendar text-[#8ec5eb]" aria-hidden />
              <span>{formatYmdHeading(ymd)}</span>
            </p>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="shrink-0 rounded-lg p-2.5 text-[#cde2f2] transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-lg" aria-hidden />
          </button>
        </div>

        <div className="space-y-5 px-4 py-5 text-white sm:px-5">
          {!showEditors ? (
            <p className="text-[13px] leading-relaxed text-[#cde2f2]/90">
This entire day is turned off for booking. Use “Open day for booking” below to make it available again.
            </p>
          ) : (
            <>
              <div className="flex gap-3 rounded-xl border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 px-4 py-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8ec5eb]/15 text-[#8ec5eb]">
                  <i className="fa-solid fa-circle-info text-sm" aria-hidden />
                </span>
                <p className="text-[13px] leading-relaxed text-[#cde2f2]/95">
                  <span className="font-semibold text-white">Custom availability</span> for{' '}
                  <span className="font-semibold text-white">{formatYmdHeading(ymd)}</span> only. Changes here won&apos;t affect
                  your recurring availability for{' '}
                  <span className="underline decoration-[#8ec5eb]/55 decoration-2 underline-offset-2">
                    every {weekdayLongFromYmd(ymd)}
                  </span>
                  .
                </p>
              </div>
            </>
          )}

          {showEditors && (
            <div className="rounded-xl border border-white/12 bg-white/[0.04] p-4">
              <h5 className="mb-1 text-[12px] font-semibold uppercase tracking-wider text-[#8ec5eb]/90">
                {`Available slots for ${formatYmdHeading(ymd)}`.toUpperCase()}
              </h5>
              <p className="mb-3 text-[11px] text-[#cde2f2]/65">
                Overlapping times are not allowed. Each slot must match your usual meeting length ({meetingDuration} min).
              </p>
              <div className="space-y-2">
                {slots.map((slot, idx) => (
                  <SlotRowEditor
                    key={idx}
                    slot={slot}
                    onPatch={(patch) =>
                      onSlotsChange(slots.map((s, j) => (j === idx ? { ...s, ...patch } : s)))
                    }
                    onRemove={() => onSlotsChange(slots.filter((_, j) => j !== idx))}
                  />
                ))}
                <button
                  type="button"
                  className={`${mentorSecondaryCta} inline-flex items-center gap-2 px-4 py-2 text-[13px]`}
                  onClick={() =>
                    onSlotsChange([
                      ...slots,
                      { startTime: "9:00", startPeriod: "AM", endTime: "12:00", endPeriod: "PM" },
                    ])
                  }
                >
                  <i className="fa-solid fa-plus text-[11px]" aria-hidden />
                  Add window
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-white/10 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#cde2f2]/55">Actions</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              {!classify.unavailable && (
                <button
                  type="button"
                  disabled={busy}
                  className={`${mentorPrimaryCta} min-h-[44px] flex-[1_1_auto] px-5 text-[14px] font-semibold sm:min-w-[10rem]`}
                  // onClick={() => {
                  //   if (!validateSlots()) return;
                  //   onSavePatch({ date: ymd, slots });
                  // }}
                  onClick={() => {
  if (slots.length === 0) {
    void run(async () => {
      await apiMarkAvailabilityDayUnavailable(mentorId, ymd);
      onToast("No meetings can be booked on this day.", "ok");
      onClose();
      await onReload();
    });
    return;
  }

  if (!validateSlots()) return;
  onSavePatch({ date: ymd, slots });
}}
                >
                  {busy ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2" aria-hidden />
                      Saving…
                    </>
                  ) : (
                    <>
                      <i className="fa-regular fa-circle-check mr-2" aria-hidden />
                      Save this day
                    </>
                  )}
                </button>
              )}
              {/* {classify.unavailable && (
  <button
    type="button"
    disabled={busy}
    className={`${mentorPrimaryCta} min-h-[44px] flex-[1_1_auto] px-5 text-[14px] font-semibold`}
    onClick={() => {
      onSlotsChange([
        { startTime: "9:00", startPeriod: "AM", endTime: "12:00", endPeriod: "PM" },
      ]);
    }}
  >
    <i className="fa-solid fa-unlock mr-2" aria-hidden />
    Unblock and add hours
  </button>
)} */}
              {/* {classify.unavailable && (
                <button
                  type="button"
                  disabled={busy}
                  className={`${mentorPrimaryCta} min-h-[44px] flex-[1_1_auto] px-5 text-[14px] font-semibold`}
                  onClick={() => {
                    onSlotsChange([
                      { startTime: "9:00", startPeriod: "AM", endTime: "12:00", endPeriod: "PM" },
                    ]);
                  }}
                >
                  <i className="fa-regular fa-clock mr-2" aria-hidden />
                  Add meeting hours
                </button>
              )} */}
              {classify.unavailable && (
                <button
                  type="button"
                  disabled={busy}
                  className={`${mentorPrimaryCta} min-h-[44px] flex-[1_1_auto] px-5 text-[14px] font-semibold`}
                  onClick={() =>
                    void run(async () => {
                      if (!validateSlots()) return;
                      // await apiMarkAvailabilityDayAvailable(mentorId, { date: ymd, slots });
                     const slotsToOpen: AppointmentAvailabilityTimeSlot[] =
  slots.length > 0
    ? slots
    : [{ startTime: "9:00", startPeriod: "AM", endTime: "12:00", endPeriod: "PM" }];

await apiMarkAvailabilityDayAvailable(mentorId, {
  date: ymd,
  slots: slotsToOpen,
});
                      onToast("This day is open for booking again.", "ok");
                      onClose();
                      await onReload();
                    })
                  }
                >
                  {busy ? (
                    <>
                      <i className="fa-solid fa-spinner fa-spin mr-2" aria-hidden />
                      Opening…
                    </>
                  ) : (
                    <>
                      <i className="fa-solid fa-door-open mr-2" aria-hidden />
                      Open day for booking
                    </>
                  )}
                </button>
              )}
              <button
                type="button"
                disabled={busy}
                onClick={onClose}
                className={`${mentorSecondaryCta} min-h-[44px] px-4 text-[14px]`}
              >
                Cancel
              </button>
            </div>

            <div className="mt-2 flex flex-col items-center rounded-xl border border-white/10 bg-black/25 px-4 py-4 text-center">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-amber-200/85">
                Use with care
              </p>
              <label className="mb-4 flex max-w-[min(100%,18rem)] cursor-pointer items-start gap-2.5 text-left text-[12px] leading-snug text-[#cde2f2]/90">
                <input
                  type="checkbox"
                  checked={blockDayAcknowledged}
                  onChange={(e) => setBlockDayAcknowledged(e.target.checked)}
                  disabled={busy}
                  className="mt-1 size-4 shrink-0 accent-red-400"
                  aria-required
                />
                <span>
                  I understand that blocking prevents new bookings on{' '}
                  <span className="font-semibold text-white">{formatYmdHeading(ymd)}</span> until I make this day
                  available again.
                </span>
              </label>
              <button
                type="button"
                disabled={busy || !blockDayAcknowledged}
                className="min-h-[42px] rounded-lg border border-red-400/35 bg-red-500/15 px-4 py-2 text-[13px] font-medium text-red-100 hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-45"
                onClick={() =>
                  void run(async () => {
                    await apiMarkAvailabilityDayUnavailable(mentorId, ymd);
                    onToast("No meetings can be booked on this day.", "ok");
                    onClose();
                    await onReload();
                  })
                }
              >
                <i className="fa-solid fa-ban mr-2 text-[11px]" aria-hidden />
                Block entire day
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function slotSpanMinutesForModal(slot: AppointmentAvailabilityTimeSlot): number {
  const norm = slotFromUnknown(slot);
  const sh = normalizeTimeToken(norm.startTime);
  const eh = normalizeTimeToken(norm.endTime);
  const parse = (x: string) => x.split(":").map((n) => parseInt(n, 10));
  const [sH, sM] = parse(sh);
  const [eH, eM] = parse(eh);
  let start = sH * 60 + sM;
  let end = eH * 60 + eM;
  if (norm.startPeriod === "PM" && sH !== 12) start += 12 * 60;
  if (norm.startPeriod === "AM" && sH === 12) start -= 12 * 60;
  if (norm.endPeriod === "PM" && eH !== 12) end += 12 * 60;
  if (norm.endPeriod === "AM" && eH === 12) end -= 12 * 60;
  return end - start;
}
