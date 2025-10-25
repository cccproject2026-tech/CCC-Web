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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
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
          <div className="flex gap-8">
            {/* Left Side - Mentor Profile */}
            <div className="w-80 flex-shrink-0">
              <div className="text-center mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 mx-auto mb-4">
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

                {/* Contact Icons */}
                <div className="flex items-center justify-center gap-4 text-[#2E3B8E] text-[18px] mb-6">
                  <button className="hover:opacity-70 transition">
                    <i className="fa-regular fa-envelope"></i>
                  </button>
                  <button className="hover:opacity-70 transition">
                    <i className="fa-regular fa-comment"></i>
                  </button>
                  <button className="hover:opacity-70 transition">
                    <i className="fa-brands fa-whatsapp"></i>
                  </button>
                  <button className="hover:opacity-70 transition">
                    <i className="fa-solid fa-phone"></i>
                  </button>
                </div>
              </div>

              {/* Profile Information */}
              <div>
                <h4 className="text-[16px] font-semibold text-gray-900 mb-3">
                  Profile Information
                </h4>
                <textarea
                  placeholder="Add notes about this mentor..."
                  className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>
            </div>

            {/* Right Side - Meeting Details */}
            <div className="flex-1">
              <div className="mb-6">
                <h4 className="text-[16px] font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <i className="fa-regular fa-calendar text-blue-600"></i>
                  Schedule a Meeting
                </h4>

                {/* Calendar */}
                <div className="mb-6">
                  <h5 className="text-[14px] font-semibold text-gray-700 mb-3">
                    Select Available Date
                  </h5>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <button className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all">
                        <i className="fa-solid fa-chevron-left text-gray-600"></i>
                      </button>
                      <h6 className="text-[16px] font-semibold text-gray-900">
                        {monthNames[currentMonth]} {currentYear}
                      </h6>
                      <button className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-gray-100 transition-all">
                        <i className="fa-solid fa-chevron-right text-gray-600"></i>
                      </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                        <div
                          key={day}
                          className="text-center text-[12px] font-semibold text-gray-500 py-2"
                        >
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarDates.map((date, index) => (
                        <button
                          key={index}
                          onClick={() =>
                            setSelectedDate(date?.toString() || "")
                          }
                          disabled={!date}
                          className={`w-8 h-8 text-[12px] font-medium rounded-lg transition-all ${
                            !date
                              ? "invisible"
                              : selectedDate === date?.toString()
                              ? "bg-blue-600 text-white"
                              : "hover:bg-gray-200 text-gray-700"
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
                  <div className="grid grid-cols-1 gap-2">
                    {timeSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`px-4 py-3 rounded-lg text-[14px] font-medium transition-all ${
                          selectedTime === time
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
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
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg text-[14px] font-semibold hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() =>
              onConfirm({ selectedDate, selectedTime, meetingOption })
            }
            className="px-6 py-3 bg-blue-600 text-white rounded-lg text-[14px] font-semibold hover:bg-blue-700 transition-all"
          >
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
