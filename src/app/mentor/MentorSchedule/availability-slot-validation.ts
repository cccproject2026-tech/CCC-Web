import type { MentorAvailabilityUiSlot } from "@/app/Services/types/mentor-availability.types";
import { convertToMinutes } from "@/app/Services/utils/helpers";

export type SlotFieldErrors = {
  start?: string;
  end?: string;
  range?: string;
};

export type SlotValidationIssue = {
  index: number;
  message: string;
  fields?: SlotFieldErrors;
};

export type SlotsValidationResult = {
  valid: boolean;
  issues: SlotValidationIssue[];
  globalMessage?: string;
};

export function slotRangeMinutes(slot: MentorAvailabilityUiSlot): {
  start: number;
  end: number;
} {
  return {
    start: convertToMinutes(slot.startTime, slot.startPeriod),
    end: convertToMinutes(slot.endTime, slot.endPeriod),
  };
}

/** User-facing label for a slot row. */
export function slotSignature(slot: MentorAvailabilityUiSlot): string {
  const { start, end } = slotRangeMinutes(slot);
  return `${start}-${end}`;
}

export function validateSingleSlot(
  slot: MentorAvailabilityUiSlot,
  meetingDurationMinutes: number,
): { valid: boolean; message?: string; fields?: SlotFieldErrors } {
  const start = String(slot.startTime ?? "").trim();
  const end = String(slot.endTime ?? "").trim();

  if (!start || !end) {
    return {
      valid: false,
      message: "Start and end times are required.",
      fields: {
        start: !start ? "Required" : undefined,
        end: !end ? "Required" : undefined,
      },
    };
  }

  const { start: startMins, end: endMins } = slotRangeMinutes(slot);

  if (endMins <= startMins) {
    return {
      valid: false,
      message: "End time must be later than start time.",
      fields: { range: "End time must be later than start time." },
    };
  }

  const duration = endMins - startMins;
  if (duration < meetingDurationMinutes) {
    return {
      valid: false,
      message: `Meeting duration (${meetingDurationMinutes} min) exceeds this slot (${duration} min).`,
      fields: {
        range: `Slot must be at least ${meetingDurationMinutes} minutes long.`,
      },
    };
  }

  return { valid: true };
}

function findDuplicateIndices(slots: MentorAvailabilityUiSlot[]): number[] {
  const seen = new Map<string, number[]>();
  slots.forEach((slot, index) => {
    const key = slotSignature(slot);
    const list = seen.get(key) ?? [];
    list.push(index);
    seen.set(key, list);
  });
  const dupes: number[] = [];
  for (const indices of seen.values()) {
    if (indices.length > 1) dupes.push(...indices);
  }
  return [...new Set(dupes)].sort((a, b) => a - b);
}

/** Validate all slots on one day: order, overlap, duplicates, duration. */
export function validateSlotsForDay(
  slots: MentorAvailabilityUiSlot[],
  meetingDurationMinutes: number,
): SlotsValidationResult {
  if (!slots.length) {
    return {
      valid: false,
      issues: [],
      globalMessage: "Add at least one time slot for this day.",
    };
  }

  const issues: SlotValidationIssue[] = [];

  for (let i = 0; i < slots.length; i++) {
    const one = validateSingleSlot(slots[i], meetingDurationMinutes);
    if (!one.valid) {
      issues.push({
        index: i,
        message: one.message ?? "Invalid slot.",
        fields: one.fields,
      });
    }
  }

  const duplicateIndices = findDuplicateIndices(slots);
  for (const index of duplicateIndices) {
    issues.push({
      index,
      message: "This slot is a duplicate of another slot on this day.",
      fields: { range: "Duplicate slot" },
    });
  }

  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const a = slotRangeMinutes(slots[i]);
      const b = slotRangeMinutes(slots[j]);
      if (a.start < b.end && b.start < a.end) {
        issues.push({
          index: i,
          message: "Slots cannot overlap.",
          fields: { range: "Overlaps with another slot" },
        });
        issues.push({
          index: j,
          message: "Slots cannot overlap.",
          fields: { range: "Overlaps with another slot" },
        });
      }
    }
  }

  const uniqueByIndex = new Map<number, SlotValidationIssue>();
  for (const issue of issues) {
    if (!uniqueByIndex.has(issue.index)) {
      uniqueByIndex.set(issue.index, issue);
    }
  }

  const merged = [...uniqueByIndex.values()];
  return {
    valid: merged.length === 0,
    issues: merged,
    globalMessage:
      merged.length > 0
        ? merged.length === 1
          ? merged[0].message
          : "Fix the highlighted slots before saving."
        : undefined,
  };
}

/** Validate every enabled weekday in the recurring template before save. */
export function validateRecurringPatternForSave(
  pattern: { day: number; enabled: boolean; slots: MentorAvailabilityUiSlot[] }[],
  meetingDurationMinutes: number,
): { valid: boolean; message?: string; dayIndex?: number } {
  const enabledDays = pattern.filter((d) => d.enabled);

  if (enabledDays.length === 0) {
    return {
      valid: false,
      message: "Enable at least one weekday and add availability hours.",
    };
  }

  for (const day of enabledDays) {
    const result = validateSlotsForDay(day.slots, meetingDurationMinutes);
    if (!result.valid) {
      return {
        valid: false,
        message: result.globalMessage ?? result.issues[0]?.message ?? "Invalid slots.",
        dayIndex: day.day,
      };
    }
  }

  const enabledWithEmptySlots = enabledDays.filter((d) => !d.slots?.length);
  if (enabledWithEmptySlots.length > 0) {
    return {
      valid: false,
      message: "Each enabled weekday needs at least one valid time slot.",
      dayIndex: enabledWithEmptySlots[0].day,
    };
  }

  return { valid: true };
}

export function getIssuesForSlotIndex(
  result: SlotsValidationResult | undefined,
  index: number,
): SlotValidationIssue | undefined {
  return result?.issues.find((i) => i.index === index);
}
