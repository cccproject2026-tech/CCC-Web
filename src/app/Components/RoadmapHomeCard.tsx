"use client";
import Image from "next/image";
import { useState } from "react";

interface RoadmapHomeCardProps {
  img: any;
  title: string;
  description: string;
  status: "Not Started" | "In-progress" | "Completed" | "Over Due";
  completionTime: string;
  showDateSelector?: boolean;
  dateLabel?: string;
  onViewClick?: () => void;
  onCardClick?: () => void;
  // Optional fields for completed status
  completedOn?: string;
  lastUpdatedOn?: string;
  // Optional fields for task completion progress
  taskCompleted?: {
    completed: number;
    total: number;
  };
  // Show checkmark overlay on image
  showCheckmark?: boolean;
}

export default function RoadmapHomeCard({
  img,
  title,
  description,
  status,
  completionTime,
  showDateSelector = false,
  dateLabel,
  onViewClick,
  onCardClick,
  completedOn,
  lastUpdatedOn,
  taskCompleted,
  showCheckmark = false,
}: RoadmapHomeCardProps) {
  const [selectedDate, setSelectedDate] = useState("");

  const getStatusColor = () => {
    switch (status) {
      case "Not Started":
        return "bg-[#B8E6FF] text-[#0066CC]";
      case "In-progress":
        return "bg-[#FFB84D] text-white";
      case "Completed":
        return "bg-[#4CAF50] text-white";
      case "Over Due":
        return "bg-[#F44336] text-white";
      default:
        return "bg-[#B8E6FF] text-[#0066CC]";
    }
  };

  const getProgressPercentage = () => {
    if (!taskCompleted) return 0;
    return (taskCompleted.completed / taskCompleted.total) * 100;
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
    }
  };

  const handleViewButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click when View button is clicked
    if (onViewClick) {
      onViewClick();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={`bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.05)] border border-[#E5EAF1] flex overflow-hidden hover:shadow-md transition-all ${
        onCardClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Left Image Section - 40-45% width */}
      <div className="relative w-[42%] shrink-0">
        <div className="relative h-full min-h-[220px] rounded-l-2xl overflow-hidden">
          <Image src={img} alt={title} fill className="object-cover" />
          {/* Checkmark overlay for completed status - centered */}
          {showCheckmark && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              {/* Outer green border circle with transparent center */}
              <div className="w-20 h-20 border-2 border-[#4CAF50] rounded-full flex items-center justify-center shadow-lg relative bg-transparent">
                {/* Inner green filled circle with checkmark */}
                <div className="w-12 h-12 bg-[#4CAF50] rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-check text-white text-xl font-bold"></i>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Content Section - 55-60% width */}
      <div className="flex flex-col flex-1 px-6 py-5 relative">
        <div className="flex flex-col h-full">
          {/* Top Content Section */}
          <div className="flex-1">
            {/* Title */}
            <h3 className="text-[20px] font-bold text-black mb-2 leading-tight">
              {title}
            </h3>

            {/* Description */}
            <p className="text-[14px] text-[#808080] leading-relaxed mb-4">
              {description}
            </p>

            {/* Status - Horizontal layout: Label | Separator | Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[14px] font-bold text-black">Status</span>
              <div className="w-px h-4 bg-gray-300"></div>
              <span
                className={`inline-block px-3 py-1 rounded-lg text-[12px] font-semibold ${getStatusColor()}`}
              >
                {status}
              </span>
            </div>

            {/* Completed Dates - Only show for Completed status */}
            {status === "Completed" && completedOn && lastUpdatedOn && (
              <div className="mb-4 space-y-2">
                <div>
                  <p className="text-[14px] font-bold text-black">
                    Completed on:{" "}
                    <span className="font-normal">{completedOn}</span>
                  </p>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-black">
                    Last Updated on:{" "}
                    <span className="font-normal">{lastUpdatedOn}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Task Completion Progress - Show for In-progress and Over Due */}
            {taskCompleted &&
              (status === "In-progress" || status === "Over Due") && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[14px] font-bold text-black">
                      Task Completed
                    </p>
                    <p className="text-[14px] text-black">
                      {taskCompleted.completed}/{taskCompleted.total}
                    </p>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#4CAF50] rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                </div>
              )}

            {/* Date Selector - Conditional */}
            {showDateSelector && status === "Not Started" && (
              <div className="mb-4">
                <p className="text-[14px] font-bold text-black mb-2">
                  {dateLabel || "Date of the Project"}
                </p>
                <div className="relative">
                  <i className="fa-solid fa-calendar absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-sm"></i>
                  <input
                    type="text"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    onFocus={(e) => (e.target.type = "date")}
                    onBlur={(e) => {
                      if (!e.target.value) {
                        e.target.type = "text";
                      }
                    }}
                    placeholder="Select Date"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-[14px] text-gray-700 focus:outline-none focus:border-[#2E3B8E] placeholder-gray-400 bg-white"
                  />
                </div>
              </div>
            )}

            {/* Completion Time and View Button */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[14px] font-bold text-black mb-1">
                  Completion Time
                </p>
                <p className="text-[14px] text-black">{completionTime}</p>
              </div>
              {/* Only show View button if not completed */}
              {status !== "Completed" && (
                <button
                  onClick={handleViewButtonClick}
                  className="bg-[#2E3B8E] text-white rounded-lg px-6 py-2.5 text-[14px] font-semibold hover:bg-[#1F2A6E] transition-all"
                >
                  View
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
