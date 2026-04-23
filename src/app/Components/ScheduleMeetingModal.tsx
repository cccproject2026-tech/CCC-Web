"use client";

import { useCallback, useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { isRemoteImageSrc } from "@/app/utils/image";

export type ScheduleMeetingFormData = {
  dateYmd: string;
  timeSlot: string;
  meetingOption: string;
  notes: string;
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

const TIME_SLOTS = [
  "09:00 am - 10:00 am",
  "11:00 am - 12:00 pm",
  "01:00 pm - 02:00 pm",
  "03:00 pm - 04:00 pm",
  "05:00 pm - 06:00 pm",
];

/** Labels mapped by parent via `uiMeetingModeToPlatform` */
const MEETING_OPTIONS = [
  "Video Call",
  "Phone Call",
  "In-Person Meeting",
  "Conference Room",
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toYmd(year: number, monthIndex0: number, day: number) {
  return `${year}-${pad2(monthIndex0 + 1)}-${pad2(day)}`;
}

function generateCalendarDates(year: number, monthIndex0: number) {
  const firstDay = new Date(year, monthIndex0, 1);
  const lastDay = new Date(year, monthIndex0 + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  const dates: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) dates.push(null);
  for (let day = 1; day <= daysInMonth; day++) dates.push(day);
  return dates;
}

function isPastDay(year: number, monthIndex0: number, day: number): boolean {
  const candidate = new Date(year, monthIndex0, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  candidate.setHours(0, 0, 0, 0);
  return candidate < today;
}

export default function ScheduleMeetingModal({
  isOpen,
  onClose,
  onConfirm,
  mentor,
}: ScheduleMeetingModalProps) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDateYmd, setSelectedDateYmd] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [meetingOption, setMeetingOption] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const y = viewMonth.getFullYear();
  const m = viewMonth.getMonth();
  const calendarDates = generateCalendarDates(y, m);

  const resetForm = useCallback(() => {
    setSelectedDateYmd("");
    setSelectedTime("");
    setMeetingOption("");
    setNotes("");
    setFormError(null);
    const d = new Date();
    setViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
  }, []);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, resetForm]);

  const goPrevMonth = () => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const goNextMonth = () => {
    setViewMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const pickDay = (day: number | null) => {
    if (day == null) return;
    if (isPastDay(y, m, day)) return;
    setSelectedDateYmd(toYmd(y, m, day));
    setFormError(null);
  };

  const handleSchedule = async () => {
    if (!mentor) return;
    if (!selectedDateYmd || !selectedTime || !meetingOption) {
      setFormError("Please select a date, time, and meeting type.");
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    try {
      await onConfirm({
        dateYmd: selectedDateYmd,
        timeSlot: selectedTime,
        meetingOption,
        notes: notes.trim(),
      });
      onClose();
    } catch {
      // Parent toasts; keep modal open
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mentor) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/50">
      <div className="h-full w-full overflow-y-auto bg-white shadow-2xl animate-slide-left sm:w-[520px] md:w-[560px]">
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-[24px] font-bold text-gray-900">Schedule a Meeting</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 transition-all hover:bg-gray-200"
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark text-gray-600" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-6 text-center">
            <div className="relative mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full bg-gray-100">
              <Image
                src={mentor.img}
                alt={mentor.name}
                fill
                className="object-cover"
                unoptimized={
                  typeof mentor.img === "string" && isRemoteImageSrc(mentor.img)
                }
                sizes="112px"
              />
            </div>
            <h3 className="mb-2 text-[20px] font-bold text-gray-900">{mentor.name}</h3>
            <div className="mb-4 flex items-center justify-center gap-2">
              <span className="text-gray-600">Mentor</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-[12px] font-semibold text-green-800">
                {mentor.menteeCount} Mentees
              </span>
            </div>
            <div className="mb-4 flex items-center justify-center gap-4 text-[18px] text-[#2E3B8E]">
              <i className="fa-regular fa-envelope" aria-hidden />
              <i className="fa-regular fa-comment" aria-hidden />
              <i className="fa-brands fa-whatsapp" aria-hidden />
              <i className="fa-solid fa-phone" aria-hidden />
            </div>
          </div>

          <div className="mb-6">
            <h4 className="mb-3 text-[16px] font-semibold text-gray-900">
              Profile Information
            </h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes for this meeting…"
              className="h-28 w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-[14px] text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6">
            <h4 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-gray-900">
              <i className="fa-regular fa-calendar text-[#2E3B8E]" />
              Schedule a Meeting
            </h4>

            <div className="mb-6">
              <h5 className="mb-3 text-[14px] font-semibold text-gray-700">
                Select Available Date
              </h5>
              <div className="rounded-xl bg-gradient-to-b from-[#294597] to-[#0f356e] p-4 text-white">
                <div className="mb-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={goPrevMonth}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-all hover:bg-white/20"
                    aria-label="Previous month"
                  >
                    <i className="fa-solid fa-chevron-left text-white" />
                  </button>
                  <h6 className="text-[16px] font-semibold">
                    {monthNames[m]} {y}
                  </h6>
                  <button
                    type="button"
                    onClick={goNextMonth}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/30 bg-white/10 transition-all hover:bg-white/20"
                    aria-label="Next month"
                  >
                    <i className="fa-solid fa-chevron-right text-white" />
                  </button>
                </div>

                <div className="mb-2 grid grid-cols-7 gap-1">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day, i) => (
                    <div
                      key={`${day}-${i}`}
                      className="py-2 text-center text-[12px] font-semibold text-white/70"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDates.map((date, index) => {
                    const ymd = date != null ? toYmd(y, m, date) : "";
                    const past = date != null && isPastDay(y, m, date);
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => pickDay(date)}
                        disabled={!date}
                        className={`h-8 w-8 text-[12px] font-medium transition-all ${
                          !date
                            ? "invisible"
                            : past
                              ? "cursor-not-allowed text-white/25"
                              : selectedDateYmd === ymd
                                ? "rounded-lg bg-white text-[#2E3B8E]"
                                : "rounded-lg text-white hover:bg-white/10"
                        }`}
                      >
                        {date}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h5 className="mb-3 text-[14px] font-semibold text-gray-700">Select a Time</h5>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => {
                      setSelectedTime(time);
                      setFormError(null);
                    }}
                    className={`rounded-lg border px-3 py-2 text-[13px] font-medium transition-all ${
                      selectedTime === time
                        ? "border-[#2E3B8E] bg-[#2E3B8E] text-white"
                        : "border-[#2E3B8E]/30 bg-white text-[#2E3B8E] hover:bg-[#f7f9ff]"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <h5 className="mb-3 text-[14px] font-semibold text-gray-700">
                Preferred Meeting Option
              </h5>
              <div className="relative">
                <select
                  value={meetingOption}
                  onChange={(e) => {
                    setMeetingOption(e.target.value);
                    setFormError(null);
                  }}
                  className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-[14px] text-black focus:outline-none focus:ring-2 focus:ring-[#2E3B8E]"
                >
                  <option value="">Select meeting option</option>
                  {MEETING_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {formError ? (
          <p className="px-6 pb-2 text-sm font-medium text-red-600" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg border border-[#2E3B8E] px-6 py-3 text-[14px] font-semibold text-[#2E3B8E] transition-all hover:bg-[#F2F5FF] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSchedule()}
            disabled={isSubmitting}
            className="rounded-lg bg-[#2E3B8E] px-6 py-3 text-[14px] font-semibold text-white shadow-md transition-all hover:bg-[#243a8a] disabled:opacity-60"
          >
            {isSubmitting ? "Scheduling…" : "Schedule"}
          </button>
        </div>
      </div>
    </div>
  );
}
