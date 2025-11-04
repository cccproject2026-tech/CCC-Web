"use client";
import { useState } from "react";
import Image from "next/image";

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (meetingData: any) => void;
  mentor: {
    name: string;
    img: any;
    menteeCount: number;
  } | null;
}

export default function ScheduleMeetingModal({
  isOpen,
  onClose,
  onConfirm,
  mentor,
}: ScheduleMeetingModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [meetingOption, setMeetingOption] = useState<string>("");

  const timeSlots = [
    "09:00 am - 10:00 am",
    "11:00 am - 12:00 pm",
    "01:00 pm - 02:00 pm",
    "03:00 pm - 04:00 pm",
    "05:00 pm - 06:00 pm",
  ];

  const meetingOptions = [
    "Video Call",
    "Phone Call",
    "In-Person Meeting",
    "Conference Room",
  ];

  // Generate calendar dates for current month
  const generateCalendarDates = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const dates = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      dates.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      dates.push(day);
    }

    return dates;
  };

  const calendarDates = generateCalendarDates();
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  if (!isOpen || !mentor) return null;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-black/50">
      <div className="bg-white w-full sm:w-[520px] md:w-[560px] h-full overflow-y-auto shadow-2xl animate-slide-left">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-[24px] font-bold text-gray-900">
            Schedule a Meeting
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-all"
          >
            <i className="fa-solid fa-xmark text-gray-600"></i>
          </button>
        </div>

        <div className="p-6">
          {/* Mentor profile */}
          <div className="text-center mb-6">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 mx-auto mb-4">
              <Image
                src={mentor.img}
                alt={mentor.name}
                className="w-full h-full object-cover"
              />
            </div>
            <h3 className="text-[20px] font-bold text-gray-900 mb-2">
              {mentor.name}
            </h3>
            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="text-gray-600">Mentor</span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-[12px] font-semibold">
                {mentor.menteeCount} Mentees
              </span>
            </div>
            <div className="flex items-center justify-center gap-4 text-[#2E3B8E] text-[18px] mb-4">
              <i className="fa-regular fa-envelope"></i>
              <i className="fa-regular fa-comment"></i>
              <i className="fa-brands fa-whatsapp"></i>
              <i className="fa-solid fa-phone"></i>
            </div>
          </div>

          {/* Profile Information */}
          <div className="mb-6">
            <h4 className="text-[16px] font-semibold text-gray-900 mb-3">
              Profile Information
            </h4>
            <textarea
              placeholder="Add notes about this mentor..."
              className="w-full h-28 px-4 py-3 border border-gray-300 rounded-lg text-[14px] text-black placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            ></textarea>
          </div>

          {/* Schedule a Meeting */}
          <div className="mb-6">
            <h4 className="text-[16px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fa-regular fa-calendar text-[#2E3B8E]"></i>
              Schedule a Meeting
            </h4>

            {/* Calendar */}
            <div className="mb-6">
              <h5 className="text-[14px] font-semibold text-gray-700 mb-3">
                Select Available Date
              </h5>
              <div className="bg-gradient-to-b from-[#294597] to-[#0f356e] rounded-xl p-4 text-white">
                <div className="flex items-center justify-between mb-4">
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/30 bg-white/10 hover:bg-white/20 transition-all">
                    <i className="fa-solid fa-chevron-left text-white"></i>
                  </button>
                  <h6 className="text-[16px] font-semibold">
                    {monthNames[currentMonth]} {currentYear}
                  </h6>
                  <button className="w-8 h-8 rounded-lg flex items-center justify-center border border-white/30 bg-white/10 hover:bg-white/20 transition-all">
                    <i className="fa-solid fa-chevron-right text-white"></i>
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-[12px] font-semibold text-white/70 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {calendarDates.map((date, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedDate(date?.toString() || "")}
                      disabled={!date}
                      className={`w-8 h-8 text-[12px] font-medium rounded-lg transition-all ${
                        !date
                          ? "invisible"
                          : selectedDate === date?.toString()
                          ? "bg-white text-[#2E3B8E]"
                          : "text-white hover:bg-white/10"
                      }`}
                    >
                      {date}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Time Selection */}
            <div className="mb-6">
              <h5 className="text-[14px] font-semibold text-gray-700 mb-3">
                Select a Time
              </h5>
              <div className="grid grid-cols-2 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
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
            </div>

            {/* Meeting Option */}
            <div className="mb-6">
              <h5 className="text-[14px] font-semibold text-gray-700 mb-3">
                Preferred Meeting Option
              </h5>
              <div className="relative">
                <select
                  value={meetingOption}
                  onChange={(e) => setMeetingOption(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[14px] text-black focus:outline-none focus:ring-2 focus:ring-[#2E3B8E] appearance-none"
                >
                  <option value="">Select meeting option</option>
                  {meetingOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-[#2E3B8E] text-[#2E3B8E] rounded-lg text-[14px] font-semibold hover:bg-[#F2F5FF] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onConfirm({ selectedDate, selectedTime, meetingOption })
            }
            className="px-6 py-3 bg-[#2E3B8E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#243a8a] transition-all shadow-md"
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
