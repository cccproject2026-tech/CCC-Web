"use client";

import { useEffect, useState } from "react";
import {
  slotDateToYmd,
  meetingDateLocalYmd,
} from "@/app/Services/appointment-utils";

interface AvailabilityCalendarProps {
  mentorId: string;
  currentMonth: number;
  currentYear: number;
  selectedDate: number;
  onDateSelect: (day: number) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  availabilitySlots?: any[];
  isLoading?: boolean;
}

export default function AvailabilityCalendar({
  mentorId,
  currentMonth,
  currentYear,
  selectedDate,
  onDateSelect,
  onPrevMonth,
  onNextMonth,
  availabilitySlots = [],
  isLoading = false,
}: AvailabilityCalendarProps) {
  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  // Build a map of available dates
  const availableDatesMap = new Map<string, boolean>();
  availabilitySlots.forEach((slot: any) => {
    const ymd = slotDateToYmd(
      slot?.date ?? slot?.day ?? slot?.calendarDate ?? slot?.meetingDate ?? slot?.dateString
    );
    if (ymd && (slot?.slots?.length > 0 || (Array.isArray(slot) && slot.length > 0))) {
      availableDatesMap.set(ymd, true);
    }
  });

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur md:p-5">
      {/* Calendar Header with Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={onPrevMonth}
          className="text-white/70 hover:text-white transition p-1"
          aria-label="Previous month"
        >
          <i className="fa-solid fa-chevron-left"></i>
        </button>

        <p className="text-sm md:text-base font-semibold text-white">
          {new Date(currentYear, currentMonth).toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </p>

        <button
          onClick={onNextMonth}
          className="text-white/70 hover:text-white transition p-1"
          aria-label="Next month"
        >
          <i className="fa-solid fa-chevron-right"></i>
        </button>
      </div>

      {/* Availability Indicator */}
      <div className="flex justify-center gap-4 mb-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400/80"></div>
          <span className="text-white/70">Has Slots</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-400/40"></div>
          <span className="text-white/70">No Slots</span>
        </div>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 text-xs md:text-[13px] mb-2">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="font-medium text-white/70 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Dates */}
      <div className="grid grid-cols-7 gap-1 md:gap-2 text-xs md:text-[14px]">
        {/* Empty cells for days before month starts */}
        {Array(firstDay)
          .fill(null)
          .map((_, i) => (
            <div key={`empty-${i}`}></div>
          ))}

        {/* Date cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayDate = new Date(currentYear, currentMonth, day);
          dayDate.setHours(0, 0, 0, 0);
          
          const todayDate = new Date();
          todayDate.setHours(0, 0, 0, 0);
          
          const isPast = dayDate < todayDate;
          const dayYmd = `${currentYear}-${String(currentMonth + 1).padStart(
            2,
            "0"
          )}-${String(day).padStart(2, "0")}`;
          
          const hasAvailability = availableDatesMap.has(dayYmd);
          const isSelected = day === selectedDate && !isPast;

          return (
            <button
              key={i}
              onClick={() => {
                if (!isPast) {
                  onDateSelect(day);
                }
              }}
              disabled={isPast}
              className={`py-2 rounded-md transition relative group ${
                isPast ? "opacity-30 cursor-not-allowed pointer-events-none" : "cursor-pointer"
              } ${
                isSelected
                  ? "bg-[#00B3FF] text-white font-bold ring-2 ring-[#00B3FF]/50"
                  : "text-white/80 hover:bg-[#00B3FF]/40"
              }`}
              title={
                isPast
                  ? "Past date"
                  : hasAvailability
                  ? "Slots available"
                  : "No slots available"
              }
            >
              {day}
              {/* Availability indicator dot */}
              {!isPast && (
                <div
                  className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                    hasAvailability ? "bg-emerald-400/70" : "bg-gray-400/30"
                  }`}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#8ec5eb]" />
          <span className="text-xs text-[#cde2f2]">Loading availability…</span>
        </div>
      )}
    </div>
  );
}
