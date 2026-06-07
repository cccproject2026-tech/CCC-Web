"use client";

import { useEffect, useState } from "react";

import AvailabilityCalendar from "@/app/Components/AvailabilityCalendar";
import { mentorSelectDark } from "@/app/Components/mentor/mentor-theme";
import { apiRescheduleAppointment } from "@/app/Services/appointments.service";
import axiosInstance from "@/app/Services/config/axios-instance";
import {
  appointmentEntityId,
  extractApiErrorMessage,
} from "@/app/Services/appointment-utils";
import type { Appointment } from "@/app/Services/types";

type MentorRescheduleAppointmentDrawerProps = {
  open: boolean;
  appointment: Appointment | null;
  mentorId: string | null;
  onClose: () => void;
  onSuccess: () => Promise<void> | void;
  onToast?: (message: string) => void;
};

function convertTo24Hour(time12: string, period: string): string {
  let [hours, minutes] = time12.split(":").map(Number);

  if (period.toUpperCase() === "PM" && hours !== 12) {
    hours += 12;
  } else if (period.toUpperCase() === "AM" && hours === 12) {
    hours = 0;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export default function MentorRescheduleAppointmentDrawer({
  open,
  appointment,
  mentorId,
  onClose,
  onSuccess,
  onToast,
}: MentorRescheduleAppointmentDrawerProps) {
  const today = new Date();
  const [rescheduleRecipientType, setRescheduleRecipientType] = useState<"director" | "pastor" | null>(null);
  const [rescheduleMonth, setRescheduleMonth] = useState(today.getMonth());
  const [rescheduleYear, setRescheduleYear] = useState(today.getFullYear());
  const [rescheduleSelectedDate, setRescheduleSelectedDate] = useState(today.getDate());
  const [rescheduleMonthlyAvailabilitySlots, setRescheduleMonthlyAvailabilitySlots] = useState<any[]>([]);
  const [rescheduleAvailabilityLoading, setRescheduleAvailabilityLoading] = useState(false);
  const [scheduleMonthlyAvailabilitySlots, setScheduleMonthlyAvailabilitySlots] = useState<any[]>([]);
  const [scheduleAvailabilityLoading, setScheduleAvailabilityLoading] = useState(false);
  const [rescheduleSelectedSlot, setRescheduleSelectedSlot] = useState("");
  const [rescheduleDateTime, setRescheduleDateTime] = useState("");
  const [reschedulePlatform, setReschedulePlatform] = useState("zoom");
  const [isRescheduling, setIsRescheduling] = useState(false);

  const showToast = (message: string) => {
    onToast?.(message);
  };

  useEffect(() => {
    if (!open || !appointment) return;

    const now = new Date();
    const recipientRole = (appointment.mentor as any)?.role || (appointment.user as any)?.role || "pastor";
    const isDirector = recipientRole?.toLowerCase().includes("director");
    setRescheduleRecipientType(isDirector ? "director" : "pastor");
    setReschedulePlatform(String(appointment.platform || "zoom").toLowerCase());
    setRescheduleMonth(now.getMonth());
    setRescheduleYear(now.getFullYear());
    setRescheduleSelectedDate(now.getDate());
    setRescheduleSelectedSlot("");
    setRescheduleDateTime("");
    setRescheduleMonthlyAvailabilitySlots([]);
    setScheduleMonthlyAvailabilitySlots([]);
  }, [appointment, open]);

  useEffect(() => {
    if (!open || !appointment) return;

    const fetchAvailability = async () => {
      if (rescheduleRecipientType === "director") {
        const directorId = (appointment.mentor as any)?._id || (appointment.mentor as any)?.id;
        if (!directorId) {
          console.warn("No director ID available for reschedule");
          return;
        }

        setRescheduleAvailabilityLoading(true);
        try {
          const url = `/appointments/availability/${directorId}/month`;
          const params = { year: rescheduleYear, month: rescheduleMonth + 1 };
          console.log("Fetching director availability for reschedule:", { url, params, directorId });

          const response = await axiosInstance.get(url, { params });
          console.log("Director availability response:", response.data);

          if (response.data?.data) {
            console.log("Setting rescheduleMonthlyAvailabilitySlots with:", response.data.data);
            setRescheduleMonthlyAvailabilitySlots(response.data.data);
          } else {
            console.warn("No data in director availability response:", response.data);
            setRescheduleMonthlyAvailabilitySlots([]);
          }
        } catch (e) {
          console.error("Failed to fetch director availability for reschedule:", e);
          setRescheduleMonthlyAvailabilitySlots([]);
        } finally {
          setRescheduleAvailabilityLoading(false);
        }
      } else if (rescheduleRecipientType === "pastor") {
        if (!mentorId) {
          console.warn("No mentorId available for reschedule");
          return;
        }

        setScheduleAvailabilityLoading(true);
        try {
          const url = `/appointments/availability/${mentorId}/month`;
          const params = { year: rescheduleYear, month: rescheduleMonth + 1 };
          console.log("Fetching mentor availability for pastor reschedule:", { url, params, mentorId });

          const response = await axiosInstance.get(url, { params });
          console.log("Mentor availability response:", response.data);

          if (response.data?.data) {
            console.log("Setting scheduleMonthlyAvailabilitySlots with:", response.data.data);
            setScheduleMonthlyAvailabilitySlots(response.data.data);
          } else {
            console.warn("No data in mentor availability response:", response.data);
            setScheduleMonthlyAvailabilitySlots([]);
          }
        } catch (e) {
          console.error("Failed to fetch mentor availability for pastor reschedule:", e);
          setScheduleMonthlyAvailabilitySlots([]);
        } finally {
          setScheduleAvailabilityLoading(false);
        }
      } else {
        console.warn("Unknown rescheduleRecipientType:", rescheduleRecipientType);
      }
    };

    void fetchAvailability();
  }, [open, appointment, rescheduleRecipientType, rescheduleYear, rescheduleMonth, mentorId]);

  const handleClose = () => {
    if (!isRescheduling) onClose();
  };

  const handleReschedulePrevMonth = () => {
    if (rescheduleMonth === 0) {
      setRescheduleMonth(11);
      setRescheduleYear(rescheduleYear - 1);
    } else {
      setRescheduleMonth(rescheduleMonth - 1);
    }
  };

  const handleRescheduleNextMonth = () => {
    if (rescheduleMonth === 11) {
      setRescheduleMonth(0);
      setRescheduleYear(rescheduleYear + 1);
    } else {
      setRescheduleMonth(rescheduleMonth + 1);
    }
  };

  const handleRescheduleAppointment = async () => {
    const id = appointment ? appointmentEntityId(appointment) : "";
    if (!id || !mentorId) return;

    if (rescheduleRecipientType === "director") {
      if (!rescheduleSelectedSlot) {
        showToast("Please select an available time slot");
        return;
      }
    } else if (!rescheduleDateTime) {
      showToast("Please select date and time");
      return;
    }

    if (isRescheduling) return;
    setIsRescheduling(true);

    try {
      const newDate = rescheduleRecipientType === "director"
        ? rescheduleSelectedSlot
        : rescheduleDateTime;

      const _d = new Date(newDate);
      const _h24 = _d.getHours();
      const _min = _d.getMinutes();
      const startPeriod = _h24 < 12 ? "AM" : "PM";
      const _h12 = _h24 % 12 === 0 ? 12 : _h24 % 12;
      const startTime = `${_h12}:${String(_min).padStart(2, "0")}`;

      await apiRescheduleAppointment(id, {
        newDate,
        startTime,
        startPeriod,
        platform: reschedulePlatform as any,
      });
      await onSuccess();
      onClose();
      showToast("Appointment rescheduled successfully");
    } catch (e) {
      console.error(e);
      showToast(extractApiErrorMessage(e) || "Failed to reschedule appointment");
    } finally {
      setIsRescheduling(false);
    }
  };

  if (!open || !appointment) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
        onClick={handleClose}
        aria-hidden
      />
      <div className="fixed right-0 top-0 z-50 h-full w-full border-l border-white/15 bg-[#041f35] text-white shadow-2xl sm:w-[480px] sm:max-w-[480px]">
        {rescheduleRecipientType === "director" ? (
          <div className="flex h-full flex-col p-6">
            <div className="mb-6 flex shrink-0 items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <i className="fa-regular fa-calendar-days text-[#8ec5eb]" />
                  Reschedule meeting
                </h2>
                {((appointment.user as any)?.firstName || (appointment.user as any)?.lastName) && (
                  <p className="mt-1 pl-7 text-sm font-medium text-[#8ec5eb]">
                    {[(appointment.user as any)?.firstName, (appointment.user as any)?.lastName].filter(Boolean).join(" ")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-[#cde2f2] transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>

            <div className="mb-6 flex-1 overflow-y-auto pr-3">
              {rescheduleMonthlyAvailabilitySlots.length > 0 && (
                <div className="mb-6 rounded-xl border border-[#8ec5eb]/30 bg-[#8ec5eb]/10 p-4">
                  <p className="mb-2 text-xs font-semibold text-[#cde2f2]">Next Available</p>
                  <p className="text-sm font-medium text-[#8ec5eb]">
                    {rescheduleMonthlyAvailabilitySlots[0]?.date && rescheduleMonthlyAvailabilitySlots[0]?.times?.[0]
                      ? `${new Date(rescheduleMonthlyAvailabilitySlots[0].date).toLocaleDateString()} at ${rescheduleMonthlyAvailabilitySlots[0].times[0]}`
                      : "No availability found"}
                  </p>
                </div>
              )}

              <div className="mb-6 rounded-xl border border-white/15 bg-white/5 p-4">
                <p className="mb-3 text-sm text-[#cde2f2]">Director Availability</p>
                {rescheduleAvailabilityLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-r-white" />
                  </div>
                ) : (
                  <AvailabilityCalendar
                    mentorId={(appointment.mentor as any)?._id || (appointment.mentor as any)?.id || ""}
                    currentMonth={rescheduleMonth}
                    currentYear={rescheduleYear}
                    selectedDate={rescheduleSelectedDate}
                    onDateSelect={setRescheduleSelectedDate}
                    onPrevMonth={handleReschedulePrevMonth}
                    onNextMonth={handleRescheduleNextMonth}
                    availabilitySlots={rescheduleMonthlyAvailabilitySlots}
                    isLoading={rescheduleAvailabilityLoading}
                  />
                )}
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-[#cde2f2]">
                  Available times on {new Date(rescheduleYear, rescheduleMonth, rescheduleSelectedDate).toLocaleDateString()}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const selectedDateSlots = rescheduleMonthlyAvailabilitySlots.find(
                      (slot: any) => new Date(slot.date).getDate() === rescheduleSelectedDate,
                    );

                    const timeSlots = (selectedDateSlots?.slots || []).filter(
                      (slot: any) => slot.startTime.endsWith(":00"),
                    );

                    if (timeSlots.length === 0) {
                      return <p className="text-sm text-[#cde2f2]">No slots available on this date</p>;
                    }

                    return timeSlots.map((slot: any, idx: number) => {
                      const timeLabel = `${slot.startTime} ${slot.startPeriod} - ${slot.endTime} ${slot.endPeriod}`;
                      const isoString = new Date(`${selectedDateSlots.date}T${convertTo24Hour(slot.startTime, slot.startPeriod)}`).toISOString();

                      return (
                        <button
                          key={idx}
                          onClick={() => setRescheduleSelectedSlot(isoString)}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                            rescheduleSelectedSlot === isoString
                              ? "border-blue-500 bg-blue-600 text-white"
                              : "border-white/20 text-white hover:bg-white/10"
                          }`}
                        >
                          {timeLabel}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              <select
                value={reschedulePlatform}
                onChange={(e) => setReschedulePlatform(e.target.value)}
                className={`${mentorSelectDark} w-full`}
              >
                <option className="bg-[#062946]" value="zoom">Zoom</option>
              </select>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-white/10 pt-6">
              <button
                type="button"
                className="rounded-lg border border-white/20 px-4 py-2 text-xs text-white transition hover:bg-white/10"
                onClick={onClose}
                disabled={isRescheduling}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`rounded-lg bg-blue-600 px-6 py-2 text-xs font-medium text-white transition ${isRescheduling ? "cursor-not-allowed opacity-70" : "hover:bg-blue-700"}`}
                onClick={handleRescheduleAppointment}
                disabled={isRescheduling}
              >
                {isRescheduling ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col p-6">
            <div className="mb-6 flex shrink-0 items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 text-lg font-semibold">
                  <i className="fa-regular fa-calendar-days text-[#8ec5eb]" />
                  Reschedule meeting
                </h2>
                {((appointment.user as any)?.firstName || (appointment.user as any)?.lastName) && (
                  <p className="mt-1 pl-7 text-sm font-medium text-[#8ec5eb]">
                    {[(appointment.user as any)?.firstName, (appointment.user as any)?.lastName].filter(Boolean).join(" ")}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-[#cde2f2] transition hover:bg-white/10 hover:text-white"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>

            <div className="mb-6 flex-1 overflow-y-auto pr-3">
              <div className="mb-6 rounded-xl border border-white/15 bg-white/5 p-4">
                <p className="mb-3 text-sm text-[#cde2f2]">Mentor Availability</p>
                {scheduleAvailabilityLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-r-white" />
                  </div>
                ) : (
                  <AvailabilityCalendar
                    mentorId={mentorId || ""}
                    currentMonth={rescheduleMonth}
                    currentYear={rescheduleYear}
                    selectedDate={rescheduleSelectedDate}
                    onDateSelect={setRescheduleSelectedDate}
                    onPrevMonth={handleReschedulePrevMonth}
                    onNextMonth={handleRescheduleNextMonth}
                    availabilitySlots={scheduleMonthlyAvailabilitySlots}
                    isLoading={scheduleAvailabilityLoading}
                  />
                )}
              </div>

              <div className="mb-6">
                <label className="mb-3 block text-sm font-semibold text-[#cde2f2]">
                  Available times on {new Date(rescheduleYear, rescheduleMonth, rescheduleSelectedDate).toLocaleDateString()}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const selectedDateSlots = scheduleMonthlyAvailabilitySlots.find(
                      (slot: any) => new Date(slot.date).getDate() === rescheduleSelectedDate,
                    );

                    const timeSlots = (selectedDateSlots?.slots || []).filter(
                      (slot: any) => slot.startTime.endsWith(":00"),
                    );

                    if (timeSlots.length === 0) {
                      return <p className="text-sm text-[#cde2f2]">No slots available on this date</p>;
                    }

                    return timeSlots.map((slot: any, idx: number) => {
                      const timeLabel = `${slot.startTime} ${slot.startPeriod} - ${slot.endTime} ${slot.endPeriod}`;
                      const isoString = new Date(`${selectedDateSlots.date}T${convertTo24Hour(slot.startTime, slot.startPeriod)}`).toISOString();

                      return (
                        <button
                          key={idx}
                          onClick={() => setRescheduleDateTime(isoString)}
                          className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                            rescheduleDateTime === isoString
                              ? "border-blue-500 bg-blue-600 text-white"
                              : "border-white/20 text-white hover:bg-white/10"
                          }`}
                        >
                          {timeLabel}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              <select
                value={reschedulePlatform}
                onChange={(e) => setReschedulePlatform(e.target.value)}
                className={`${mentorSelectDark} w-full`}
              >
                <option className="bg-[#062946]" value="zoom">Zoom</option>
              </select>
            </div>

            <div className="flex shrink-0 justify-end gap-3 border-t border-white/10 pt-6">
              <button
                type="button"
                className="rounded-lg border border-white/20 px-4 py-2 text-xs text-white transition hover:bg-white/10"
                onClick={onClose}
                disabled={isRescheduling}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`rounded-lg bg-blue-600 px-6 py-2 text-xs font-medium text-white transition ${isRescheduling ? "cursor-not-allowed opacity-70" : "hover:bg-blue-700"}`}
                onClick={handleRescheduleAppointment}
                disabled={isRescheduling}
              >
                {isRescheduling ? "Saving..." : "Save changes"}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
