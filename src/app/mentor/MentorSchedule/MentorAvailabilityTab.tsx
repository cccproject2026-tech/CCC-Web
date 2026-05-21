"use client";

import type { MentorAvailabilityUiDay, MentorAvailabilityUiSlot } from "@/app/Services/types/mentor-availability.types";
import type { MentorDateException } from "@/app/Services/types/mentor-availability.types";
import {
  summarizeWeekdaySlots,
  WEEKDAY_DISPLAY_ORDER,
  WEEKDAY_LABELS,
} from "@/app/mentor/MentorSchedule/availability-mappers";
import type { SlotsValidationResult } from "@/app/mentor/MentorSchedule/availability-slot-validation";
import { getIssuesForSlotIndex } from "@/app/mentor/MentorSchedule/availability-slot-validation";
import MentorAvailabilitySaveBar from "@/app/mentor/MentorSchedule/MentorAvailabilitySaveBar";
import {
  mentorEmptyPanel,
  mentorGlassCardFrost,
  mentorPrimaryCta,
  mentorSecondaryCta,
  mentorSelectDark,
  mentorBodyText,
} from "@/app/Components/mentor/mentor-theme";
import { timeOptions } from "@/app/Services/utils/helpers";

export type AvailabilityEditorMode = "recurring" | "exception";

export type ExceptionEditorModel = {
  date: string;
  isBlocked: boolean;
  isOverride: boolean;
  enabled: boolean;
  slots: MentorAvailabilityUiSlot[];
  hasException: boolean;
};

type MentorAvailabilityTabProps = {
  recurringPattern: MentorAvailabilityUiDay[];
  dateExceptions: Record<string, MentorDateException>;
  selectedRecurringWeekday: number | null;
  onSelectRecurringWeekday: (dayIndex: number) => void;
  onToggleRecurringWeekdayEnabled: (dayIndex: number, enabled: boolean) => void;
  editorMode: AvailabilityEditorMode;
  onEditorModeChange: (mode: AvailabilityEditorMode) => void;
  selectedExceptionDate: string | null;
  onSelectExceptionDate: (ymd: string | null) => void;
  exceptionCalendarMonth: number;
  exceptionCalendarYear: number;
  onExceptionCalendarMonthChange: (month: number, year: number) => void;
  onExceptionCalendarDaySelect: (day: number) => void;
  meetingDuration: number;
  onMeetingDurationChange: (n: number) => void;
  maxBookingsPerDay: number;
  onMaxBookingsPerDayChange: (n: number) => void;
  advanceNoticeHours: number;
  onAdvanceNoticeHoursChange: (n: number) => void;
  recurringDayData: MentorAvailabilityUiDay | null;
  recurringDayValidation: SlotsValidationResult | undefined;
  exceptionDayValidation: SlotsValidationResult | undefined;
  exceptionDayData: ExceptionEditorModel | null;
  availabilityDayActionLoading: boolean;
  onUpdateRecurringWeekday: (
    updater: (row: MentorAvailabilityUiDay) => MentorAvailabilityUiDay,
  ) => void;
  onUpdateExceptionSlots: (
    updater: (slots: MentorAvailabilityUiSlot[]) => MentorAvailabilityUiSlot[],
  ) => void;
  onSaveWeeklySchedule: () => void;
  onSaveExceptionDate: () => void;
  onMarkExceptionUnavailable: () => void;
  onMakeExceptionAvailable: () => void;
  onSetCustomHoursForDate: () => void;
  onRemoveCustomHours: () => void;
  onAddSlotClick: () => void;
  onDeleteSlot: (index: number, slot: MentorAvailabilityUiSlot) => void;
  isPastDate: (ymd: string) => boolean;
  hasUnsavedWeeklyChanges: boolean;
  isSavingWeeklySchedule: boolean;
  weeklySaveBlockedMessage: string | null;
  lastWeeklySavedLabel: string | null;
};

function ymdFromParts(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function MentorAvailabilityTab(props: MentorAvailabilityTabProps) {
  const {
    recurringPattern,
    dateExceptions,
    selectedRecurringWeekday,
    onSelectRecurringWeekday,
    onToggleRecurringWeekdayEnabled,
    editorMode,
    onEditorModeChange,
    selectedExceptionDate,
    onSelectExceptionDate,
    exceptionCalendarMonth,
    exceptionCalendarYear,
    onExceptionCalendarMonthChange,
    onExceptionCalendarDaySelect,
    meetingDuration,
    onMeetingDurationChange,
    maxBookingsPerDay,
    onMaxBookingsPerDayChange,
    advanceNoticeHours,
    onAdvanceNoticeHoursChange,
    recurringDayData,
    recurringDayValidation,
    exceptionDayValidation,
    exceptionDayData,
    availabilityDayActionLoading,
    onUpdateRecurringWeekday,
    onUpdateExceptionSlots,
    onSaveWeeklySchedule,
    onSaveExceptionDate,
    onMarkExceptionUnavailable,
    onMakeExceptionAvailable,
    onSetCustomHoursForDate,
    onRemoveCustomHours,
    onAddSlotClick,
    onDeleteSlot,
    isPastDate,
    hasUnsavedWeeklyChanges,
    isSavingWeeklySchedule,
    weeklySaveBlockedMessage,
    lastWeeklySavedLabel,
  } = props;

  const exceptionEntries = Object.values(dateExceptions).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  const daysInMonth = new Date(exceptionCalendarYear, exceptionCalendarMonth + 1, 0).getDate();
  const firstDay = new Date(exceptionCalendarYear, exceptionCalendarMonth, 1).getDay();

  const handlePrevExceptionMonth = () => {
    if (exceptionCalendarMonth === 0) {
      onExceptionCalendarMonthChange(11, exceptionCalendarYear - 1);
    } else {
      onExceptionCalendarMonthChange(exceptionCalendarMonth - 1, exceptionCalendarYear);
    }
  };

  const handleNextExceptionMonth = () => {
    if (exceptionCalendarMonth === 11) {
      onExceptionCalendarMonthChange(0, exceptionCalendarYear + 1);
    } else {
      onExceptionCalendarMonthChange(exceptionCalendarMonth + 1, exceptionCalendarYear);
    }
  };

  return (
    <div className="relative pb-24">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* ── LEFT: recurring weekdays + settings + overrides ── */}
        <div className="space-y-8">
          {/* SECTION 1 — Weekly recurring */}
          <div className={`${mentorGlassCardFrost} p-5 sm:p-6`}>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#8ec5eb]">
                Primary
              </span>
            </div>
            <h3 className="mb-2 text-[15px] font-semibold text-white">Weekly recurring availability</h3>
            <p className="mb-1 text-sm leading-relaxed text-[#cde2f2]/90">
              Your weekly schedule repeats automatically every week for the next 60 days.
            </p>
            <p className="mb-4 text-[12px] leading-relaxed text-[#cde2f2]/70">
              Turn on only the weekdays you normally meet. Special one-off changes belong in{" "}
              <span className="text-violet-200">Special date overrides</span> below.
            </p>

            <div className="space-y-2">
              {WEEKDAY_DISPLAY_ORDER.map((dayIndex) => {
                const row =
                  recurringPattern.find((d) => d.day === dayIndex) ??
                  ({
                    day: dayIndex,
                    date: "",
                    enabled: false,
                    slots: [],
                  } satisfies MentorAvailabilityUiDay);
                const isActive = row.enabled && (row.slots?.length ?? 0) > 0;
                const isSelected =
                  editorMode === "recurring" && selectedRecurringWeekday === dayIndex;
                const slotCount = row.slots?.length ?? 0;

                return (
                  <div
                    key={dayIndex}
                    className={`flex w-full items-stretch gap-2 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? "border-[#8ec5eb]/70 bg-[#8ec5eb]/20 shadow-[0_0_0_1px_rgba(142,197,235,0.35),0_0_20px_rgba(142,197,235,0.12)] ring-2 ring-[#8ec5eb]/45"
                        : isActive
                          ? "border-white/20 bg-white/[0.05] hover:border-white/30 hover:bg-white/[0.08]"
                          : "border-white/10 bg-white/[0.02] opacity-55 hover:opacity-70"
                    }`}
                  >
                    <label
                      className="flex shrink-0 cursor-pointer items-center px-3 py-3"
                      title={isActive ? "Disable this weekday" : "Enable this weekday"}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={row.enabled}
                        className="h-4 w-4 accent-[#8ec5eb]"
                        onChange={(e) => {
                          onToggleRecurringWeekdayEnabled(dayIndex, e.target.checked);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        onEditorModeChange("recurring");
                        onSelectRecurringWeekday(dayIndex);
                        onSelectExceptionDate(null);
                      }}
                      className="min-w-0 flex-1 px-1 py-3 text-left"
                    >
                      <span className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm font-semibold ${isSelected ? "text-white" : isActive ? "text-white/95" : "text-white/55"}`}
                        >
                          {WEEKDAY_LABELS[dayIndex]}
                        </span>
                        {isSelected ? (
                          <span className="rounded-full border border-[#8ec5eb]/50 bg-[#8ec5eb]/25 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#d9ebf8]">
                            Editing
                          </span>
                        ) : null}
                        {isActive ? (
                          <span className="rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 px-2 py-0.5 text-[9px] font-medium text-[#8ec5eb]">
                            Repeats weekly
                          </span>
                        ) : null}
                      </span>
                      {isActive ? (
                        <span className="mt-1 block text-[12px] leading-snug text-[#cde2f2]/85">
                          {summarizeWeekdaySlots(row.slots)}
                          {slotCount > 0 ? (
                            <span className="ml-1 text-[#cde2f2]/55">
                              · {slotCount} slot{slotCount === 1 ? "" : "s"}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="mt-1 block text-[12px] italic text-white/40">Unavailable</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/10 pt-4">
              <div>
                <label className="mb-1 block text-xs text-[#cde2f2]">Meeting duration</label>
                <select
                  className={mentorSelectDark}
                  value={String(meetingDuration)}
                  onChange={(e) => onMeetingDurationChange(Number(e.target.value))}
                >
                  <option value="30">30 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-[#cde2f2]">Max bookings / day</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={maxBookingsPerDay}
                  onChange={(e) => onMaxBookingsPerDayChange(Math.max(1, Number(e.target.value)))}
                  className={mentorSelectDark}
                />
              </div>
              <div className="col-span-2">
                <label className="mb-1 block text-xs text-[#cde2f2]">Minimum notice (hours)</label>
                <input
                  type="number"
                  min={1}
                  max={168}
                  value={advanceNoticeHours}
                  onChange={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n)) {
                      onAdvanceNoticeHoursChange(Math.max(1, Math.min(168, Math.floor(n))));
                    }
                  }}
                  className={mentorSelectDark}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2 — Special date overrides */}
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-5 sm:p-6">
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-full border border-violet-300/40 bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-200">
                Secondary
              </span>
            </div>
            <h3 className="mb-2 text-[15px] font-medium text-white/85">Special date overrides</h3>
            <p className="mb-1 text-sm text-[#cde2f2]/75">
              Special date overrides affect only one date — holidays, vacations, or one-time hours.
            </p>
            <p className="mb-4 text-[12px] text-[#cde2f2]/60">
              They do not change your weekly repeating schedule.
            </p>

            <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.04] p-4">
              <div className="mb-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handlePrevExceptionMonth}
                  className="rounded-lg px-2 py-1 text-white/80 hover:bg-white/10"
                  aria-label="Previous month"
                >
                  ◀
                </button>
                <p className="text-sm font-medium text-[#d9ebf8]">
                  {new Date(exceptionCalendarYear, exceptionCalendarMonth).toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </p>
                <button
                  type="button"
                  onClick={handleNextExceptionMonth}
                  className="rounded-lg px-2 py-1 text-white/80 hover:bg-white/10"
                  aria-label="Next month"
                >
                  ▶
                </button>
              </div>
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] text-[#cde2f2]/70">
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <div key={`${d}-${i}`}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 text-[12px]">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`pad-${i}`} />
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const ymd = ymdFromParts(exceptionCalendarYear, exceptionCalendarMonth, day);
                  const past = isPastDate(ymd);
                  const ex = dateExceptions[ymd];
                  const isSelected = selectedExceptionDate === ymd && editorMode === "exception";
                  return (
                    <button
                      key={day}
                      type="button"
                      disabled={past}
                      onClick={() => {
                        if (past) return;
                        onEditorModeChange("exception");
                        onSelectExceptionDate(ymd);
                        onExceptionCalendarDaySelect(day);
                      }}
                      className={`rounded-md py-1.5 transition ${
                        past ? "cursor-not-allowed opacity-35" : "hover:bg-white/10"
                      } ${isSelected ? "bg-violet-500/25 font-semibold text-white ring-1 ring-violet-300/50" : "text-[#d9ebf8]"}`}
                    >
                      {day}
                      {ex?.kind === "unavailable" ? (
                        <span className="mx-auto mt-0.5 block h-1 w-1 rounded-full bg-red-400" />
                      ) : ex?.kind === "override" ? (
                        <span className="mx-auto mt-0.5 block h-1 w-1 rounded-full bg-violet-300" />
                      ) : null}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-[#cde2f2]/75">
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-300" /> Custom hours
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" /> Unavailable
                </span>
              </div>
            </div>

            <label className="mb-1 block text-xs text-[#cde2f2]">Pick a date</label>
            <input
              type="date"
              className={`${mentorSelectDark} mb-4 w-full`}
              value={selectedExceptionDate ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                if (!v) {
                  onSelectExceptionDate(null);
                  return;
                }
                onEditorModeChange("exception");
                onSelectExceptionDate(v);
                const d = new Date(`${v}T12:00:00`);
                onExceptionCalendarMonthChange(d.getMonth(), d.getFullYear());
                onExceptionCalendarDaySelect(d.getDate());
              }}
            />

            {exceptionEntries.length > 0 ? (
              <ul className="mb-2 max-h-36 space-y-1 overflow-y-auto text-[12px]">
                {exceptionEntries.map((ex) => (
                  <li key={ex.date}>
                    <button
                      type="button"
                      onClick={() => {
                        onEditorModeChange("exception");
                        onSelectExceptionDate(ex.date);
                      }}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left transition hover:bg-white/10 ${
                        selectedExceptionDate === ex.date ? "bg-white/10 text-white" : "text-[#cde2f2]"
                      }`}
                    >
                      <span>{ex.date}</span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          ex.kind === "unavailable"
                            ? "border border-red-400/35 bg-red-500/15 text-red-200"
                            : "border border-violet-300/35 bg-violet-500/15 text-violet-100"
                        }`}
                      >
                        {ex.kind === "unavailable" ? "Blocked" : "Custom"}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-2 text-[12px] text-[#cde2f2]/70">No special dates yet.</p>
            )}
          </div>
        </div>

        {/* ── RIGHT: editor panel ── */}
        <div className="text-white">
          {editorMode === "recurring" && recurringDayData ? (
            <RecurringEditorPanel
              dayLabel={WEEKDAY_LABELS[selectedRecurringWeekday ?? 0]}
              dayData={recurringDayData}
              meetingDuration={meetingDuration}
              disabled={availabilityDayActionLoading}
              validation={recurringDayValidation}
              onChangeSlot={(i, patch) =>
                onUpdateRecurringWeekday((d) => ({
                  ...d,
                  slots: d.slots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
                }))
              }
              onDeleteSlot={onDeleteSlot}
              onAddSlot={onAddSlotClick}
            />
          ) : editorMode === "exception" && exceptionDayData ? (
            <ExceptionEditorPanel
              data={exceptionDayData}
              loading={availabilityDayActionLoading}
              meetingDuration={meetingDuration}
              validation={exceptionDayValidation}
              onMarkUnavailable={onMarkExceptionUnavailable}
              onMakeAvailable={onMakeExceptionAvailable}
              onSetCustomHours={onSetCustomHoursForDate}
              onRemoveCustomHours={onRemoveCustomHours}
              onChangeSlot={(i, patch) =>
                onUpdateExceptionSlots((slots) =>
                  slots.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
                )
              }
              onDeleteSlot={onDeleteSlot}
              onAddSlot={onAddSlotClick}
              onSave={onSaveExceptionDate}
            />
          ) : (
            <div className={mentorEmptyPanel}>
              <p className={mentorBodyText}>
                Select a weekday and turn it on to set your weekly hours, or pick a date under
                &quot;Special date overrides&quot; for one-time changes.
              </p>
            </div>
          )}
        </div>
      </div>

      <MentorAvailabilitySaveBar
        hasUnsavedChanges={hasUnsavedWeeklyChanges}
        isSaving={isSavingWeeklySchedule}
        saveBlockedMessage={weeklySaveBlockedMessage}
        lastSavedLabel={lastWeeklySavedLabel}
        onSave={onSaveWeeklySchedule}
      />
    </div>
  );
}

function RecurringEditorPanel({
  dayLabel,
  dayData,
  meetingDuration,
  disabled,
  validation,
  onChangeSlot,
  onDeleteSlot,
  onAddSlot,
}: {
  dayLabel: string;
  dayData: MentorAvailabilityUiDay;
  meetingDuration: number;
  disabled: boolean;
  validation: SlotsValidationResult | undefined;
  onChangeSlot: (index: number, patch: Partial<MentorAvailabilityUiSlot>) => void;
  onDeleteSlot: (index: number, slot: MentorAvailabilityUiSlot) => void;
  onAddSlot: () => void;
}) {
  return (
    <div className="flex max-h-[560px] flex-col rounded-2xl border border-[#8ec5eb]/25 bg-[#8ec5eb]/[0.06] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3 border-b border-white/15 pb-4">
        <p className="text-sm font-semibold text-white">{dayLabel}</p>
        <span className="rounded-full border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-2.5 py-0.5 text-[10px] font-semibold text-[#d9ebf8]">
          Weekly schedule
        </span>
        {!dayData.enabled ? (
          <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-[10px] text-white/50">
            Off
          </span>
        ) : null}
      </div>
      {!dayData.enabled ? (
        <p className="mb-4 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-3 text-sm text-[#cde2f2]/85">
          Turn on <span className="font-medium text-white">{dayLabel}</span> using the checkbox on the
          left, then add your usual hours for every {dayLabel}.
        </p>
      ) : (
        <>
          <p className="mb-4 text-[12px] text-[#cde2f2]/85">
            These hours repeat every {dayLabel}. One-time changes belong under special date overrides.
          </p>
          {validation?.globalMessage && !validation.valid ? (
            <p
              className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
              role="alert"
            >
              {validation.globalMessage}
            </p>
          ) : null}
          <SlotRows
            slots={dayData.slots}
            disabled={disabled}
            validation={validation}
            onChangeSlot={onChangeSlot}
            onDeleteSlot={onDeleteSlot}
          />
          <button
            type="button"
            disabled={disabled}
            onClick={onAddSlot}
            className={`${mentorSecondaryCta} mt-4 px-3 py-1.5 text-xs disabled:opacity-50`}
          >
            + Add slot
          </button>
          <p className="mt-3 text-[11px] text-[#8ec5eb]/70">
            Each slot must be at least {meetingDuration} minutes long.
          </p>
        </>
      )}
    </div>
  );
}

function ExceptionEditorPanel({
  data,
  loading,
  meetingDuration,
  validation,
  onMarkUnavailable,
  onMakeAvailable,
  onSetCustomHours,
  onRemoveCustomHours,
  onChangeSlot,
  onDeleteSlot,
  onAddSlot,
  onSave,
}: {
  data: ExceptionEditorModel;
  loading: boolean;
  meetingDuration: number;
  validation: SlotsValidationResult | undefined;
  onMarkUnavailable: () => void;
  onMakeAvailable: () => void;
  onSetCustomHours: () => void;
  onRemoveCustomHours: () => void;
  onChangeSlot: (index: number, patch: Partial<MentorAvailabilityUiSlot>) => void;
  onDeleteSlot: (index: number, slot: MentorAvailabilityUiSlot) => void;
  onAddSlot: () => void;
  onSave: () => void;
}) {
  const formatted = new Date(`${data.date}T12:00:00`).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="flex max-h-[560px] flex-col rounded-2xl border border-violet-300/20 bg-violet-500/[0.06] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-white/15 pb-4">
        <p className="text-sm font-semibold text-white">{formatted}</p>
        {data.isBlocked ? (
          <span className="rounded-full border border-red-400/40 bg-red-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-red-200">
            Unavailable
          </span>
        ) : data.isOverride ? (
          <span className="rounded-full border border-violet-300/40 bg-violet-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-violet-100">
            Custom date
          </span>
        ) : (
          <span className="rounded-full border border-white/20 bg-white/5 px-2.5 py-0.5 text-[10px] text-[#cde2f2]">
            Uses weekly schedule
          </span>
        )}
      </div>

      <p className="mb-4 text-[12px] text-[#cde2f2]/75">
        This override applies only to this date — your weekly {formatted.split(",")[0]} schedule stays
        the same.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {data.isBlocked ? (
          <button
            type="button"
            disabled={loading}
            onClick={onMakeAvailable}
            className={`${mentorSecondaryCta} px-3 py-1.5 text-xs disabled:opacity-50`}
          >
            Restore weekly schedule
          </button>
        ) : (
          <button
            type="button"
            disabled={loading}
            onClick={onMarkUnavailable}
            className={`${mentorSecondaryCta} px-3 py-1.5 text-xs disabled:opacity-50`}
          >
            Mark unavailable
          </button>
        )}
        {!data.isBlocked && !data.isOverride ? (
          <button
            type="button"
            disabled={loading}
            onClick={onSetCustomHours}
            className={`${mentorSecondaryCta} px-3 py-1.5 text-xs disabled:opacity-50`}
          >
            Set custom hours
          </button>
        ) : null}
        {data.isOverride ? (
          <button
            type="button"
            disabled={loading}
            onClick={onRemoveCustomHours}
            className={`${mentorSecondaryCta} px-3 py-1.5 text-xs disabled:opacity-50`}
          >
            Restore weekly schedule
          </button>
        ) : null}
      </div>

      {data.isBlocked ? (
        <p className="text-sm text-red-200/85">
          This date is blocked. Restore the weekly schedule to use your normal hours again.
        </p>
      ) : data.isOverride ? (
        <>
          {validation?.globalMessage && !validation.valid ? (
            <p
              className="mb-3 rounded-lg border border-amber-400/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
              role="alert"
            >
              {validation.globalMessage}
            </p>
          ) : null}
          <SlotRows
            slots={data.slots}
            disabled={loading}
            validation={validation}
            onChangeSlot={onChangeSlot}
            onDeleteSlot={onDeleteSlot}
          />
          <button
            type="button"
            disabled={loading}
            onClick={onAddSlot}
            className={`${mentorSecondaryCta} mt-4 px-3 py-1.5 text-xs disabled:opacity-50`}
          >
            + Add slot
          </button>
          <button
            type="button"
            disabled={loading || (validation !== undefined && !validation.valid)}
            onClick={onSave}
            className={`${mentorPrimaryCta} mt-5 disabled:opacity-50`}
          >
            Save custom date
          </button>
        </>
      ) : (
        <p className="text-sm text-[#cde2f2]/85">
          This date follows your weekly schedule. Use custom hours or mark unavailable only when this
          date should differ.
        </p>
      )}
    </div>
  );
}

function SlotRows({
  slots,
  disabled,
  validation,
  onChangeSlot,
  onDeleteSlot,
}: {
  slots: MentorAvailabilityUiSlot[];
  disabled?: boolean;
  validation?: SlotsValidationResult;
  onChangeSlot: (index: number, patch: Partial<MentorAvailabilityUiSlot>) => void;
  onDeleteSlot: (index: number, slot: MentorAvailabilityUiSlot) => void;
}) {
  if (slots.length === 0) {
    return (
      <div className={`${mentorEmptyPanel} py-6 text-center`}>
        <p className="text-sm text-white/75">No hours added yet.</p>
        <p className="mt-2 text-xs text-[#cde2f2]/85">Add a slot to define when you are available.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {slots.map((slot, i) => {
        const issue = getIssuesForSlotIndex(validation, i);
        const hasError = Boolean(issue);
        return (
          <div
            key={i}
            className={`rounded-lg border p-3 transition ${
              hasError
                ? "border-red-400/45 bg-red-500/[0.08] ring-1 ring-red-400/25"
                : "border-white/15 bg-white/[0.03]"
            }`}
          >
            <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
              <span className="text-[11px] font-semibold text-[#8ec5eb]">Slot {i + 1}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onDeleteSlot(i, slot)}
                className="rounded p-0.5 text-red-400 hover:bg-red-400/15 disabled:opacity-40"
                aria-label={`Remove slot ${i + 1}`}
              >
                <i className="fa-solid fa-trash-can text-[11px]" />
              </button>
            </div>
            <div className="space-y-2">
              <div>
                <p className="mb-1 text-[10px] text-[#cde2f2]/80">Start time</p>
                <select
                  disabled={disabled}
                  aria-invalid={hasError && Boolean(issue?.fields?.start || issue?.fields?.range)}
                  className={`${mentorSelectDark} min-h-[34px] w-full text-[11px] ${
                    hasError && (issue?.fields?.start || issue?.fields?.range)
                      ? "border-red-400/50"
                      : ""
                  }`}
                  value={`${slot.startTime}-${slot.startPeriod}`}
                  onChange={(e) => {
                    const [time, period] = e.target.value.split("-");
                    onChangeSlot(i, { startTime: time, startPeriod: period as "AM" | "PM" });
                  }}
                >
                  {timeOptions.map((t) => (
                    <option key={`start-${t.label}`} value={`${t.time}-${t.period}`}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="mb-1 text-[10px] text-[#cde2f2]/80">End time</p>
                <select
                  disabled={disabled}
                  aria-invalid={hasError && Boolean(issue?.fields?.end || issue?.fields?.range)}
                  className={`${mentorSelectDark} min-h-[34px] w-full text-[11px] ${
                    hasError && (issue?.fields?.end || issue?.fields?.range)
                      ? "border-red-400/50"
                      : ""
                  }`}
                  value={`${slot.endTime}-${slot.endPeriod}`}
                  onChange={(e) => {
                    const [time, period] = e.target.value.split("-");
                    onChangeSlot(i, { endTime: time, endPeriod: period as "AM" | "PM" });
                  }}
                >
                  {timeOptions.map((t) => (
                    <option key={t.label} value={`${t.time}-${t.period}`}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {issue ? (
              <p className="mt-2 text-[10px] leading-snug text-red-300" role="alert">
                {issue.message}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
