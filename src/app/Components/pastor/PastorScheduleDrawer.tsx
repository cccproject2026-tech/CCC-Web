"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import AvailabilityCalendar from "@/app/Components/AvailabilityCalendar";
import {
  pastorDarkSelect,
  pastorFieldLabel,
  pastorPrimaryCta,
} from "@/app/Components/pastor/pastor-theme";
import axiosInstance from "@/app/Services/config/axios-instance";
import {
  apiCreateAppointment,
  apiGetAppointments,
  apiGetWeeklyAvailability,
} from "@/app/Services/appointments.service";
import {
  formatAvailabilitySlotLabel,
  parseSlotStartToIso,
  slotDateToYmd,
  uiMeetingModeToPlatform,
  unwrapAppointmentsAxiosData,
  unwrapMonthlyAvailabilityPayload,
} from "@/app/Services/appointment-utils";
import { filterSlotsAfter2Hours } from "@/app/Services/utils/helpers";
import UserProfile from "@/app/Assets/user-profile.png";

type Props = {
  open: boolean;
  onClose: () => void;
  mentor: any | null;
  pastorUserId: string;
  onScheduled?: () => void;
};

export default function PastorScheduleDrawer({
  open,
  onClose,
  mentor,
  pastorUserId,
  onScheduled,
}: Props) {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.getDate());
  const [selectedTime, setSelectedTime] = useState("");
  const [scheduleTitle, setScheduleTitle] = useState("");
  const [scheduleDescription, setScheduleDescription] = useState("");
  const [schedulePlatform, setSchedulePlatform] = useState("Zoom");
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [monthlySlots, setMonthlySlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [toast, setToast] = useState("");

  const mentorId = String(mentor?._id ?? mentor?.id ?? "");

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  useEffect(() => {
    if (!open || !mentorId) return;

    let cancelled = false;

    async function loadAvailability() {
      try {
        setLoading(true);

        const selectedYmd = new Date(
          currentYear,
          currentMonth,
          selectedDate
        ).toLocaleDateString("en-CA");

        let slots: any[] = [];

        try {
          const res = await axiosInstance.get(
            `/appointments/availability/${mentorId}/month`,
            {
              params: { year: currentYear, month: currentMonth + 1 },
            }
          );

          const raw = res.data?.data ?? res.data;
          slots = Array.isArray(raw) ? raw : [];
        } catch {
          const weekYmd = `${currentYear}-${String(currentMonth + 1).padStart(
            2,
            "0"
          )}-${String(selectedDate).padStart(2, "0")}`;

          const wk = await apiGetWeeklyAvailability(mentorId, weekYmd);
          const wRaw = unwrapMonthlyAvailabilityPayload(wk);
          slots = wRaw.length ? wRaw : [];
        }

        if (cancelled) return;

        setMonthlySlots(slots);

        const dateSlot = slots.find((slot: any) => {
          const ymd = slotDateToYmd(
            slot?.date ??
              slot?.day ??
              slot?.calendarDate ??
              slot?.meetingDate ??
              slot?.dateString
          );

          return ymd === selectedYmd;
        });

        let times: string[] = [];

        if (dateSlot?.slots?.length) {
          times = dateSlot.slots
            .map((raw: any) => formatAvailabilitySlotLabel(raw))
            .filter((s: string) => s.length > 0);

          times = filterSlotsAfter2Hours(times, selectedYmd);
        }

        setAvailableTimes(times);
      } catch (error) {
        console.error("Error fetching availability:", error);
        setAvailableTimes([]);
        setMonthlySlots([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadAvailability();

    return () => {
      cancelled = true;
    };
  }, [open, mentorId, currentMonth, currentYear, selectedDate]);

  const handleSchedule = async () => {
    if (isScheduling) return;

    if (!pastorUserId) {
      setToast("Please sign in again.");
      return;
    }

    if (!mentorId) {
      setToast("Please select a mentor.");
      return;
    }

    if (!selectedTime) {
      setToast("Please select a time.");
      return;
    }

    const trimmedTitle = scheduleTitle.trim();
    const trimmedDescription = scheduleDescription.trim();

    if (!trimmedTitle) {
      setToast("Please enter a meeting title.");
      return;
    }

    const yyyyMmDd = new Date(
      currentYear,
      currentMonth,
      selectedDate
    ).toLocaleDateString("en-CA");

    const meetingDateISO = parseSlotStartToIso(yyyyMmDd, selectedTime);

    try {
      setIsScheduling(true);

      await apiCreateAppointment({
        userId: pastorUserId,
        mentorId,
        meetingDate: meetingDateISO,
        platform: uiMeetingModeToPlatform(schedulePlatform),
        title: trimmedTitle,
        description: trimmedDescription,
        notes: "Mentorship session",
        googleCalendarTitle: trimmedTitle,
        googleCalendarDescription: trimmedDescription || "Mentorship session",
      });

      setScheduleTitle("");
      setScheduleDescription("");
      setSelectedTime("");
      setToast("New appointment has been scheduled.");
      onScheduled?.();

      setTimeout(() => {
        setToast("");
        onClose();
      }, 1000);
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      setToast("Failed to schedule appointment.");
    } finally {
      setIsScheduling(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex">
      <button
        type="button"
        className="absolute inset-0 bg-[#041f35]/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative ml-auto flex h-full w-full max-w-[440px] flex-col border-l border-[#8ec5eb]/30 bg-[linear-gradient(180deg,rgba(10,52,88,0.97)_0%,rgba(4,28,48,0.99)_100%)] shadow-[-20px_0_48px_rgba(2,12,28,0.65)] text-white">
        <div className="flex items-start justify-between gap-3 border-b border-white/15 px-6 py-5">
          <div>
            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-[#8ec5eb]/90">
              Schedule meeting
            </p>

            <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
              <i className="fa-regular fa-calendar text-[#8ec5eb]" />
              {[mentor?.firstName, mentor?.lastName].filter(Boolean).join(" ") ||
                mentor?.email ||
                "Mentor"}
            </h2>

            <p className="mt-1 text-xs text-[#cde2f2]/90">
              Pick a date, time, and platform.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-[#d9ebf8] transition hover:bg-white/10 hover:text-white"
          >
            <i className="fa-solid fa-xmark text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <label className={pastorFieldLabel} htmlFor="schedule-title">
            Meeting Title
          </label>
          <input
            id="schedule-title"
            type="text"
            value={scheduleTitle}
            onChange={(e) => setScheduleTitle(e.target.value)}
            placeholder="Enter meeting title"
            className="mb-4 w-full rounded-xl border border-white/20 bg-[#062946] px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#8ec5eb]/50"
          />

          <label className={pastorFieldLabel} htmlFor="schedule-description">
            Meeting Description
          </label>
          <textarea
            id="schedule-description"
            value={scheduleDescription}
            onChange={(e) => setScheduleDescription(e.target.value)}
            placeholder="Enter meeting description"
            rows={3}
            className="mb-4 w-full rounded-xl border border-white/20 bg-[#062946] px-3 py-2 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#8ec5eb]/50"
          />

          <label className={pastorFieldLabel}>Mentor Availability</label>

          <AvailabilityCalendar
            mentorId={mentorId}
            currentMonth={currentMonth}
            currentYear={currentYear}
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            availabilitySlots={monthlySlots}
            isLoading={loading}
          />

          <label className={pastorFieldLabel} style={{ marginTop: "1.5rem" }}>
            Select a time
          </label>

          {loading ? (
            <p className="mb-4 text-xs text-[#cde2f2]/85">
              Loading available times…
            </p>
          ) : availableTimes.length === 0 ? (
            <p className="mb-4 text-xs text-[#cde2f2]/85">
              No open slots on this date. Please try another day.
            </p>
          ) : (
            <div className="mb-4 grid grid-cols-2 gap-2 sm:gap-3">
              {availableTimes.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTime(t)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                    selectedTime === t
                      ? "border-[#8ec5eb] bg-[#8ec5eb]/25 text-white"
                      : "border-[#8ec5eb]/30 bg-[#8ec5eb]/10 text-white hover:bg-[#8ec5eb]/20"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          )}

          <label className={pastorFieldLabel}>Platform</label>

          <select
            value={schedulePlatform}
            onChange={(e) => setSchedulePlatform(e.target.value)}
            className={`${pastorDarkSelect} mb-2 text-white`}
          >
            <option value="Zoom" className="bg-[#062946] text-white">
              Zoom
            </option>
          </select>

          {toast ? <p className="mt-4 text-sm text-[#8ec5eb]">{toast}</p> : null}
        </div>

        <div className="flex justify-between gap-3 border-t border-white/15 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-medium text-[#8ec5eb] transition hover:text-white"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSchedule}
            disabled={isScheduling}
            className={`${pastorPrimaryCta} ${
              isScheduling ? "cursor-not-allowed opacity-70" : ""
            }`}
          >
            {isScheduling ? "Scheduling..." : "Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
