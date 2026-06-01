"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { StaticImageData } from "next/image";
import AvailabilityCalendar from "@/app/Components/AvailabilityCalendar";
import {
  apiGetMentorAppointments,
  apiGetMonthlyAvailability,
} from "@/app/Services/appointments.service";
import {
  formatAvailabilitySlotLabel,
  meetingDateLocalYmd,
  parseSlotStartToIso,
  slotDateToYmd,
  unwrapAppointmentsAxiosData,
  unwrapMonthlyAvailabilityPayload,
} from "@/app/Services/appointment-utils";
import { filterSlotsAfter2Hours } from "@/app/Services/utils/helpers";

export type ScheduleMeetingFormData = {
  dateYmd: string;
  timeSlot: string;
  meetingOption: string;
  title: string;
  description: string;
};

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: ScheduleMeetingFormData) => void | Promise<void>;
  mentor: {
    id: string;
    name: string;
    img: string | StaticImageData;
    menteeCount: number;
  } | null;
}

function selectedDateYmd(year: number, monthIndex0: number, day: number) {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function ScheduleMeetingModal({
  isOpen,
  onClose,
  onConfirm,
  mentor,
}: ScheduleMeetingModalProps) {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [selectedTime, setSelectedTime] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [monthlySlots, setMonthlySlots] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const mentorId = String(mentor?.id ?? "").trim();
  const dateYmd = selectedDateYmd(currentYear, currentMonth, selectedDate);

  const resetForm = useCallback(() => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedDate(now.getDate());
    setSelectedTime("");
    setTitle("");
    setDescription("");
    setMonthlySlots([]);
    setAppointments([]);
    setFormError(null);
  }, []);

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen, resetForm, mentorId]);

  useEffect(() => {
    if (!isOpen || !mentorId) return;

    let cancelled = false;

    async function loadAvailability() {
      setIsLoading(true);
      try {
        const [availabilityResult, appointmentsResult] = await Promise.allSettled([
          apiGetMonthlyAvailability(mentorId, {
            year: currentYear,
            month: currentMonth + 1,
          }),
          apiGetMentorAppointments(mentorId),
        ]);

        if (cancelled) return;

        setMonthlySlots(
          availabilityResult.status === "fulfilled"
            ? unwrapMonthlyAvailabilityPayload(availabilityResult.value)
            : [],
        );
        setAppointments(
          appointmentsResult.status === "fulfilled"
            ? unwrapAppointmentsAxiosData(appointmentsResult.value)
            : [],
        );
        if (availabilityResult.status === "rejected") {
          setFormError("Unable to load mentor availability. Please try again.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [isOpen, mentorId, currentMonth, currentYear]);

  const availableTimes = useMemo(() => {
    const dateSlot = monthlySlots.find((slot: any) => {
      const ymd = slotDateToYmd(
        slot?.date ?? slot?.day ?? slot?.calendarDate ?? slot?.meetingDate ?? slot?.dateString,
      );
      return ymd === dateYmd;
    });

    let times: string[] =
      dateSlot?.slots?.map((slot: any) => formatAvailabilitySlotLabel(slot)).filter(Boolean) ?? [];
    times = filterSlotsAfter2Hours(times, dateYmd);

    const bookedStarts = appointments
      .filter((appointment: any) => {
        const status = String(appointment?.status ?? "").toLowerCase();
        return (
          !status.includes("cancel") &&
          status !== "missed" &&
          meetingDateLocalYmd(appointment?.meetingDate) === dateYmd
        );
      })
      .map((appointment: any) => new Date(appointment.meetingDate).getTime())
      .filter((timestamp: number) => !Number.isNaN(timestamp));

    return times.filter((slot: string) => {
      const slotStart = new Date(parseSlotStartToIso(dateYmd, slot)).getTime();
      return !bookedStarts.some(
        (bookedStart: number) => Math.abs(bookedStart - slotStart) < 30 * 60 * 1000,
      );
    });
  }, [appointments, dateYmd, monthlySlots]);

  const selectedDateHasRawAvailability = useMemo(
    () =>
      monthlySlots.some((slot: any) => {
        const ymd = slotDateToYmd(
          slot?.date ?? slot?.day ?? slot?.calendarDate ?? slot?.meetingDate ?? slot?.dateString,
        );
        return ymd === dateYmd && Array.isArray(slot?.slots) && slot.slots.length > 0;
      }),
    [dateYmd, monthlySlots],
  );

  useEffect(() => {
    setSelectedTime("");
  }, [dateYmd]);

  const handlePrevMonth = () => {
    const previous = new Date(currentYear, currentMonth - 1, 1);
    setCurrentYear(previous.getFullYear());
    setCurrentMonth(previous.getMonth());
    setSelectedDate(1);
  };

  const handleNextMonth = () => {
    const next = new Date(currentYear, currentMonth + 1, 1);
    setCurrentYear(next.getFullYear());
    setCurrentMonth(next.getMonth());
    setSelectedDate(1);
  };

  const handleSchedule = async () => {
    if (!selectedTime) {
      setFormError("Please select an available time.");
      return;
    }
    if (!title.trim()) {
      setFormError("Please enter a meeting title.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    try {
      await onConfirm({
        dateYmd,
        timeSlot: selectedTime,
        meetingOption: "Zoom",
        title: title.trim(),
        description: description.trim(),
      });
      onClose();
    } catch {
      // Parent displays the API error toast; keep the drawer open.
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mentor) return null;

  return (
    <div className="fixed inset-0 z-[100] flex">
      <button
        type="button"
        className="absolute inset-0 bg-[#041f35]/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close schedule meeting drawer"
      />

      <div className="relative ml-auto flex h-full w-full max-w-[460px] flex-col border-l border-[#8ec5eb]/30 bg-[linear-gradient(180deg,rgba(10,52,88,0.97)_0%,rgba(4,28,48,0.99)_100%)] text-white shadow-[-20px_0_48px_rgba(2,12,28,0.65)]">
        <div className="flex items-start justify-between gap-3 border-b border-white/15 px-6 py-5">
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#8ec5eb]/90">
              Schedule meeting
            </p>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <i className="fa-regular fa-calendar text-[#8ec5eb]" />
              {mentor.name}
            </h2>
            <p className="mt-1 text-xs text-[#cde2f2]/90">
              Pick an available date and time for your Zoom meeting.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-[#d9ebf8] transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <label className="mb-1.5 block text-xs font-medium text-[#d9ebf8]">
            Mentor Availability
          </label>
          <AvailabilityCalendar
            mentorId={mentorId}
            currentMonth={currentMonth}
            currentYear={currentYear}
            selectedDate={selectedDate}
            onDateSelect={(day) => {
              setSelectedDate(day);
              setFormError(null);
            }}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            availabilitySlots={monthlySlots}
            isLoading={isLoading}
          />

          <label className="mb-1.5 mt-6 block text-xs font-medium text-[#d9ebf8]">
            Select a time
          </label>
          {isLoading ? (
            <p className="mb-4 text-xs text-[#cde2f2]/85">Loading available times...</p>
          ) : availableTimes.length === 0 ? (
            <p className="mb-4 text-xs text-[#cde2f2]/85">
              {selectedDateHasRawAvailability ? (
                <>
                  No bookable slots on this date.
                  <br />
                  This date has mentor availability, but no slots are currently eligible for booking
                  due to scheduling rules. Please choose another date.
                </>
              ) : (
                "No open slots on this date. Please try another day."
              )}
            </p>
          ) : (
            <div className="mb-5 grid grid-cols-2 gap-2 sm:gap-3">
              {availableTimes.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => {
                    setSelectedTime(time);
                    setFormError(null);
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    selectedTime === time
                      ? "border-[#8ec5eb] bg-[#8ec5eb]/25 text-white"
                      : "border-[#8ec5eb]/30 bg-[#8ec5eb]/10 text-white hover:bg-[#8ec5eb]/20"
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          )}

          <label className="mb-1.5 block text-xs font-medium text-[#d9ebf8]">Platform</label>
          <div className="mb-5 rounded-xl border border-white/20 bg-[#062946] px-3 py-2 text-sm text-white">
            Zoom
          </div>

          <label htmlFor="meeting-title" className="mb-1.5 block text-xs font-medium text-[#d9ebf8]">
            Meeting Title <span className="text-[#8ec5eb]">*</span>
          </label>
          <input
            id="meeting-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setFormError(null);
            }}
            placeholder="Enter meeting title"
            className="mb-5 w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-[#cde2f2]/60 focus:border-[#8ec5eb]/60"
          />

          <label htmlFor="meeting-description" className="mb-1.5 block text-xs font-medium text-[#d9ebf8]">
            Meeting Description
          </label>
          <textarea
            id="meeting-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add an optional description"
            className="h-24 w-full resize-none rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white outline-none placeholder:text-[#cde2f2]/60 focus:border-[#8ec5eb]/60"
          />

          {formError ? (
            <p className="mt-4 text-sm font-medium text-[#f7c4c4]" role="alert">
              {formError}
            </p>
          ) : null}
        </div>

        <div className="flex justify-between gap-3 border-t border-white/15 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="text-sm font-medium text-[#8ec5eb] transition hover:text-white disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSchedule()}
            disabled={isSubmitting}
            className="rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#0f4a76] transition hover:bg-[#e7f1fa] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Scheduling..." : "Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
