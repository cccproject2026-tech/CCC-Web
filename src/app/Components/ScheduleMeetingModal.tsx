"use client";
<<<<<<< HEAD
import { useCallback, useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { apiGetWeeklyAvailability } from "@/app/Services/appointments.service";
import { isRemoteImageSrc } from "@/app/utils/image";

const STATIC_TIME_SLOTS = [
  "09:00 am - 10:00 am",
  "11:00 am - 12:00 pm",
  "01:00 pm - 02:00 pm",
  "03:00 pm - 04:00 pm",
  "05:00 pm - 06:00 pm",
];

/** Values must be compatible with `uiMeetingModeToPlatform` (director schedule). */
const MEETING_PLATFORMS: { value: string; label: string }[] = [
  { value: "zoom", label: "Zoom" },
  { value: "google meet", label: "Google Meet" },
  { value: "teams", label: "Microsoft Teams" },
  { value: "phone", label: "Phone" },
  { value: "in-person", label: "In person" },
];

export interface ScheduleMeetingConfirmPayload {
  selectedYmd: string;
  selectedTime: string;
  /** Raw select value (e.g. `zoom`, `google meet`) — map with `uiMeetingModeToPlatform` when calling API */
  meetingOption: string;
  notes: string;
}
=======
import { useEffect, useState } from "react";
import Image, { type StaticImageData } from "next/image";
import { isRemoteImageSrc } from "@/app/utils/image";
import { parseSlotStartToIso, uiMeetingModeToPlatform } from "@/app/Services/appointment-utils";

export type ScheduleModalMentor = {
  id: string;
  name: string;
  img: string | StaticImageData;
  menteeCount: number;
};
>>>>>>> ba12e32 (redoo changes)

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
<<<<<<< HEAD
  onConfirm: (meetingData: ScheduleMeetingConfirmPayload) => void | Promise<void>;
  mentor: {
    id: string;
    name: string;
    img: string | StaticImageData;
    menteeCount: number;
  } | null;
=======
  /** Returning a Promise keeps the button in loading state until done. */
  onConfirm: (data: {
    meetingDateIso: string;
    platform: string;
    notes: string;
  }) => void | Promise<void>;
  mentor: ScheduleModalMentor | null;
>>>>>>> ba12e32 (redoo changes)
}

function generateCalendarDates(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  const dates: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) dates.push(null);
  for (let day = 1; day <= daysInMonth; day++) dates.push(day);
  return dates;
}

function isPastDay(year: number, month: number, day: number): boolean {
  const candidate = new Date(year, month, day);
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
<<<<<<< HEAD
  const [viewYear, setViewYear] = useState(() => new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(() => new Date().getMonth());
  const [selectedYmd, setSelectedYmd] = useState("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [meetingOption, setMeetingOption] = useState<string>("");
  const [notes, setNotes] = useState("");
  const [timeSlots, setTimeSlots] = useState<string[]>(STATIC_TIME_SLOTS);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
=======
  const [selectedYmd, setSelectedYmd] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [meetingOption, setMeetingOption] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
>>>>>>> ba12e32 (redoo changes)

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const resetForm = useCallback(() => {
    const t = new Date();
    setViewYear(t.getFullYear());
    setViewMonth(t.getMonth());
    setSelectedYmd("");
    setSelectedTime("");
    setMeetingOption("");
    setNotes("");
    setTimeSlots(STATIC_TIME_SLOTS);
    setSlotsLoading(false);
    setSubmitting(false);
  }, []);

<<<<<<< HEAD
  useEffect(() => {
    if (isOpen && mentor?.id) resetForm();
  }, [isOpen, mentor?.id, resetForm]);

  useEffect(() => {
    if (!isOpen || !mentor?.id || !selectedYmd) {
      if (!selectedYmd) setTimeSlots(STATIC_TIME_SLOTS);
      return;
    }

    let cancelled = false;
    setSlotsLoading(true);

    const meetingDateObj = new Date(`${selectedYmd}T12:00:00`);
    if (Number.isNaN(meetingDateObj.getTime())) {
      setTimeSlots(STATIC_TIME_SLOTS);
      setSlotsLoading(false);
      return;
=======
  const generateCalendarDates = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const dates: (number | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      dates.push(null);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(day);
>>>>>>> ba12e32 (redoo changes)
    }

    const dayOfWeek = meetingDateObj.getDay();
    const sunday = new Date(meetingDateObj);
    sunday.setDate(meetingDateObj.getDate() - dayOfWeek);
    const apiDate = sunday.toISOString().split("T")[0];

    apiGetWeeklyAvailability(mentor.id, apiDate)
      .then((res) => {
        if (cancelled) return;
        const raw = res.data?.data ?? res.data;
        const data = Array.isArray(raw) ? raw : [];
        const dayData = data.find((d: Record<string, unknown>) => {
          if (typeof d.date === "string" && d.date.length >= 10 && d.date.startsWith(selectedYmd)) {
            return true;
          }
          const dNum = typeof d.day === "number" ? d.day : Number(d.day);
          return dNum === dayOfWeek;
        });
        if (!dayData || !Array.isArray((dayData as { slots?: unknown }).slots) || !(dayData as { slots: unknown[] }).slots.length) {
          setTimeSlots(STATIC_TIME_SLOTS);
          return;
        }
        const slots = (dayData as { slots: Array<Record<string, string>> }).slots;
        const formatted = slots.map(
          (s) =>
            `${s.startTime ?? "00:00"} ${(s.startPeriod ?? "AM").toUpperCase()} - ${s.endTime ?? "00:00"} ${(s.endPeriod ?? "PM").toUpperCase()}`,
        );
        setTimeSlots(formatted.length ? formatted : STATIC_TIME_SLOTS);
      })
      .catch(() => {
        if (!cancelled) setTimeSlots(STATIC_TIME_SLOTS);
      })
      .finally(() => {
        if (!cancelled) setSlotsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, mentor?.id, selectedYmd]);

  const calendarDates = generateCalendarDates(viewYear, viewMonth);

  const goPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setSelectedYmd("");
      setSelectedTime("");
      setMeetingOption("");
      setNotes("");
      setFormError(null);
      setSaving(false);
    }
  }, [isOpen]);

  if (!isOpen || !mentor) return null;

<<<<<<< HEAD
  const onDayPick = (day: number) => {
    if (isPastDay(viewYear, viewMonth, day)) return;
    const m = String(viewMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    setSelectedYmd(`${viewYear}-${m}-${d}`);
    setSelectedTime("");
  };

  const handleSubmit = async () => {
    if (!selectedYmd || !selectedTime || !meetingOption) {
      window.alert("Please select a date, time, and meeting platform.");
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm({ selectedYmd, selectedTime, meetingOption, notes: notes.trim() });
    } finally {
      setSubmitting(false);
=======
  const ymdForDay = (day: number) => {
    const m = String(currentMonth + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${currentYear}-${m}-${d}`;
  };

  const handleSchedule = async () => {
    setFormError(null);
    if (!selectedYmd) {
      setFormError("Please select a date.");
      return;
    }
    if (!selectedTime) {
      setFormError("Please select a time slot.");
      return;
    }
    if (!meetingOption) {
      setFormError("Please select a meeting type.");
      return;
    }
    const meetingDateIso = parseSlotStartToIso(selectedYmd, selectedTime);
    const platform = uiMeetingModeToPlatform(meetingOption);
    setSaving(true);
    try {
      await onConfirm({
        meetingDateIso,
        platform,
        notes: notes.trim(),
      });
      onClose();
    } catch (e) {
      console.error(e);
      setFormError(
        e instanceof Error && e.message ? e.message : "Could not save. Try again.",
      );
    } finally {
      setSaving(false);
>>>>>>> ba12e32 (redoo changes)
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/50">
<<<<<<< HEAD
      <div className="bg-white w-full sm:w-[520px] md:w-[560px] h-full overflow-y-auto shadow-2xl animate-slide-left">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
=======
      <div className="h-full w-full overflow-y-auto bg-white shadow-2xl animate-slide-left sm:w-[520px] md:w-[560px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
>>>>>>> ba12e32 (redoo changes)
          <h2 className="text-[24px] font-bold text-gray-900">Schedule a Meeting</h2>
          <button
            type="button"
            onClick={onClose}
<<<<<<< HEAD
            className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-all"
            aria-label="Close"
=======
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 transition-all hover:bg-gray-200"
>>>>>>> ba12e32 (redoo changes)
          >
            <i className="fa-solid fa-xmark text-gray-600" />
          </button>
        </div>

        <div className="p-6">
<<<<<<< HEAD
          <div className="text-center mb-6">
=======
          {/* Mentor profile */}
          <div className="mb-6 text-center">
>>>>>>> ba12e32 (redoo changes)
            <div className="relative mx-auto mb-4 h-28 w-28 overflow-hidden rounded-full bg-gray-100">
              <Image
                src={mentor.img}
                alt={mentor.name}
                fill
<<<<<<< HEAD
                sizes="112px"
                className="object-cover"
                unoptimized={typeof mentor.img === "string" && isRemoteImageSrc(mentor.img)}
              />
            </div>
            <h3 className="text-[20px] font-bold text-gray-900 mb-2">{mentor.name}</h3>
            <div className="flex items-center justify-center gap-2 mb-4">
=======
                className="object-cover"
                unoptimized={typeof mentor.img === "string" && isRemoteImageSrc(mentor.img)}
                sizes="112px"
              />
            </div>
            <h3 className="mb-2 text-[20px] font-bold text-gray-900">{mentor.name}</h3>
            <div className="mb-4 flex items-center justify-center gap-2">
>>>>>>> ba12e32 (redoo changes)
              <span className="text-gray-600">Mentor</span>
              <span className="rounded-full bg-green-100 px-3 py-1 text-[12px] font-semibold text-green-800">
                {mentor.menteeCount} Mentees
              </span>
            </div>
<<<<<<< HEAD
            <div className="flex items-center justify-center gap-4 text-[#2E3B8E] text-[18px] mb-4">
=======
            <div className="mb-4 flex items-center justify-center gap-4 text-[18px] text-[#2E3B8E]">
>>>>>>> ba12e32 (redoo changes)
              <i className="fa-regular fa-envelope" />
              <i className="fa-regular fa-comment" />
              <i className="fa-brands fa-whatsapp" />
              <i className="fa-solid fa-phone" />
            </div>
          </div>

          <div className="mb-6">
<<<<<<< HEAD
            <h4 className="text-[16px] font-semibold text-gray-900 mb-3">Profile Information</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this mentor..."
              className="w-full h-28 px-4 py-3 border border-gray-300 rounded-lg text-[14px] text-black placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
=======
            <h4 className="mb-3 text-[16px] font-semibold text-gray-900">Profile Information</h4>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this meeting…"
              className="h-28 w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-[14px] text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
>>>>>>> ba12e32 (redoo changes)
            />
          </div>

          <div className="mb-6">
<<<<<<< HEAD
            <h4 className="text-[16px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
=======
            <h4 className="mb-4 flex items-center gap-2 text-[16px] font-semibold text-gray-900">
>>>>>>> ba12e32 (redoo changes)
              <i className="fa-regular fa-calendar text-[#2E3B8E]" />
              Schedule a Meeting
            </h4>

            <div className="mb-6">
<<<<<<< HEAD
              <h5 className="text-[14px] font-semibold text-gray-700 mb-3">Select Available Date</h5>
              <div className="bg-gradient-to-b from-[#294597] to-[#0f356e] rounded-xl p-4 text-white">
                <div className="flex items-center justify-between mb-4">
                  <button
                    type="button"
                    onClick={goPrevMonth}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/30 bg-white/10 hover:bg-white/20 transition-all"
                    aria-label="Previous month"
                  >
                    <i className="fa-solid fa-chevron-left text-white" />
                  </button>
=======
              <h5 className="mb-3 text-[14px] font-semibold text-gray-700">Select available date</h5>
              <div className="rounded-xl bg-gradient-to-b from-[#294597] to-[#0f356e] p-4 text-white">
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-8 w-8" aria-hidden />
>>>>>>> ba12e32 (redoo changes)
                  <h6 className="text-[16px] font-semibold">
                    {monthNames[viewMonth]} {viewYear}
                  </h6>
<<<<<<< HEAD
                  <button
                    type="button"
                    onClick={goNextMonth}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/30 bg-white/10 hover:bg-white/20 transition-all"
                    aria-label="Next month"
                  >
                    <i className="fa-solid fa-chevron-right text-white" />
                  </button>
=======
                  <div className="h-8 w-8" aria-hidden />
>>>>>>> ba12e32 (redoo changes)
                </div>

                <div className="mb-2 grid grid-cols-7 gap-1">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                    <div
                      key={day}
                      className="py-2 text-center text-[12px] font-semibold text-white/70"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
<<<<<<< HEAD
                  {calendarDates.map((date, index) => {
                    if (!date) {
                      return <div key={`e-${index}`} className="w-8 h-8" />;
                    }
                    const past = isPastDay(viewYear, viewMonth, date);
                    const cellYmd = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
                    const selected = selectedYmd === cellYmd;
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => onDayPick(date)}
                        disabled={past}
                        className={`w-8 h-8 text-[12px] font-medium rounded-lg transition-all ${
                          past
                            ? "text-white/25 cursor-not-allowed"
                            : selected
                              ? "bg-white text-[#2E3B8E]"
                              : "text-white hover:bg-white/10"
                        }`}
                      >
                        {date}
                      </button>
                    );
                  })}
=======
                  {calendarDates.map((date, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => {
                        if (date == null) return;
                        setSelectedYmd(ymdForDay(date));
                      }}
                      disabled={!date}
                      className={`h-8 w-8 text-[12px] font-medium transition-all ${
                        !date
                          ? "invisible"
                          : selectedYmd === ymdForDay(date)
                            ? "rounded-lg bg-white text-[#2E3B8E]"
                            : "rounded-lg text-white hover:bg-white/10"
                      }`}
                    >
                      {date}
                    </button>
                  ))}
>>>>>>> ba12e32 (redoo changes)
                </div>
              </div>
            </div>

            <div className="mb-6">
<<<<<<< HEAD
              <h5 className="text-[14px] font-semibold text-gray-700 mb-3">Select a Time</h5>
              {slotsLoading ? (
                <p className="text-sm text-gray-500">Loading available slots…</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => setSelectedTime(time)}
                      className={`px-3 py-2 rounded-lg text-[13px] font-medium transition-all border ${
                        selectedTime === time
                          ? "bg-[#2E3B8E] text-white border-[#2E3B8E]"
                          : "bg-white text-[#2E3B8E] border-[#2E3B8E]/30 hover:bg-[#f7f9ff]"
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <h5 className="text-[14px] font-semibold text-gray-700 mb-3">Preferred Meeting Option</h5>
=======
              <h5 className="mb-3 text-[14px] font-semibold text-gray-700">Select a time</h5>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
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

            {/* Meeting Option */}
            <div className="mb-2">
              <h5 className="mb-3 text-[14px] font-semibold text-gray-700">Preferred meeting option</h5>
>>>>>>> ba12e32 (redoo changes)
              <div className="relative">
                <select
                  value={meetingOption}
                  onChange={(e) => setMeetingOption(e.target.value)}
<<<<<<< HEAD
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg text-[14px] text-black focus:outline-none focus:ring-2 focus:ring-[#2E3B8E] appearance-none bg-white"
=======
                  className="w-full appearance-none rounded-lg border border-gray-300 px-4 py-3 pr-10 text-[14px] text-black focus:outline-none focus:ring-2 focus:ring-[#2E3B8E]"
>>>>>>> ba12e32 (redoo changes)
                >
                  <option value="">Select meeting option</option>
                  {MEETING_PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

<<<<<<< HEAD
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
=======
        {formError ? (
          <p className="px-6 pb-2 text-sm font-medium text-red-600" role="alert">
            {formError}
          </p>
        ) : null}

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 p-6">
>>>>>>> ba12e32 (redoo changes)
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-[#2E3B8E] px-6 py-3 text-[14px] font-semibold text-[#2E3B8E] transition-all hover:bg-[#F2F5FF] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
<<<<<<< HEAD
            disabled={submitting}
            onClick={() => void handleSubmit()}
            className="px-6 py-3 bg-[#2E3B8E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#243a8a] transition-all shadow-md disabled:opacity-60"
          >
            {submitting ? "Scheduling…" : "Schedule"}
=======
            disabled={saving}
            onClick={() => void handleSchedule()}
            className="rounded-lg bg-[#2E3B8E] px-6 py-3 text-[14px] font-semibold text-white shadow-md transition-all hover:bg-[#243a8a] disabled:opacity-50"
          >
            {saving ? "Scheduling…" : "Schedule"}
>>>>>>> ba12e32 (redoo changes)
          </button>
        </div>
      </div>
    </div>
  );
}
