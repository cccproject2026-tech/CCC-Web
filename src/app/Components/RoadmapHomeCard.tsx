"use client";
import Image from "next/image";
import { useState } from "react";

interface RoadmapHomeCardProps {
  img: any;
  title: string;
  description: string;
  status: "Not Started" | "In-progress" | "Completed" | "Over Due";
  completionTime: string;
  /** `mentor` matches /mentor/RevitalizationRoadmap dark glass styling */
  variant?: "default" | "mentor";
  showDateSelector?: boolean;
  dateLabel?: string;
  onViewClick?: () => void;
  onCardClick?: () => void;
  // Optional fields for completed status
  completedOn?: string;
  lastUpdatedOn?: string;
  lastUpdatedDate?: string;
  // Optional fields for task completion progress
  taskCompleted?: {
    completed: number;
    total: number;
  };
  meetingInfo?: {
    date: string;
    time: string;
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
  variant = "default",
  showDateSelector = false,
  dateLabel,
  onViewClick,
  onCardClick,
  completedOn,
  lastUpdatedOn,
  lastUpdatedDate,
  taskCompleted,
  meetingInfo,
  showCheckmark = false,
}: RoadmapHomeCardProps) {
  const [selectedDate, setSelectedDate] = useState("");
  const isMentor = variant === "mentor";
const effectiveStatus =
  taskCompleted &&
  taskCompleted.total > 0 &&
  taskCompleted.completed >= taskCompleted.total
    ? "Completed"
    : status;
  const hasRenderableImage =
    img != null &&
    (typeof img === "string"
      ? img.trim().length > 0
      : typeof img === "object" && img !== null && "src" in img);

  const getStatusColor = () => {
    if (isMentor) {
      switch (effectiveStatus) {
        case "Not Started":
          return "bg-[#e6edff] text-[#1e40af]";
        case "In-progress":
          return "bg-[#fff6d8] text-[#d38a00]";
        case "Completed":
          return "bg-[#d8fff2] text-[#00A878]";
        case "Over Due":
          return "bg-red-500/25 text-red-100 border border-red-400/30";
        default:
          return "bg-[#e6edff] text-[#1e40af]";
      }
    }
    switch (effectiveStatus){
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
    if (!taskCompleted || !taskCompleted.total) return 0;
    return (taskCompleted.completed / taskCompleted.total) * 100;
  };

  const imgUnoptimized =
    typeof img === "string" && (img.startsWith("http://") || img.startsWith("https://"));

  // const showViewButton = Boolean(onViewClick && (isMentor || status !== "Completed"));
  const showViewButton = Boolean(onViewClick && (isMentor || effectiveStatus !== "Completed"));

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
      className={
        isMentor
          ? `flex overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.92)_0%,rgba(10,53,88,0.98)_100%)] shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${onCardClick ? "cursor-pointer" : ""}`
          : `bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.05)] border border-[#E5EAF1] flex overflow-hidden hover:shadow-md transition-all ${onCardClick ? "cursor-pointer" : ""}`
      }
    >
      {/* Left Image Section - 40-45% width */}
      <div className="relative w-[42%] shrink-0">
        <div
          className={`relative h-full min-h-[220px] overflow-hidden ${isMentor ? "rounded-l-2xl border-r border-white/10" : "rounded-l-2xl"}`}
        >
          <Image
            src={img || "/images/roadmap-placeholder.png"}
            alt={title}
            fill
            className="object-cover"
            unoptimized={!!imgUnoptimized}
          />
          {effectiveStatus === "Completed" && (
  <div className="absolute bottom-3 left-3 z-20 rounded-lg border border-white/20 bg-black/45 px-3 py-2 text-[11px] font-semibold leading-5 text-white shadow-md backdrop-blur-sm">
    <p>Completed on : N/A</p>
    <p>Last Updated : {lastUpdatedDate || lastUpdatedOn || "—"}</p>
  </div>
)}
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
      <div className={`relative flex flex-1 flex-col px-5 py-5 sm:px-6 ${isMentor ? "" : ""}`}>
        <div className="flex h-full flex-col">
          {/* Top Content Section */}
          <div className="flex-1">
            {/* Title */}
            <h3
              className={`mb-2 text-[18px] font-semibold leading-tight sm:text-[20px] ${isMentor ? "text-white" : "font-bold text-black"}`}
            >
              {title}
            </h3>

            {/* Description */}
            <p
              className={`mb-4 line-clamp-3 text-[13px] leading-relaxed sm:text-[14px] ${isMentor ? "text-[#cde2f2]" : "text-[#808080]"}`}
            >
              {description}
            </p>

            {/* Status - Horizontal layout: Label | Separator | Badge */}
            <div className="mb-4 flex items-center gap-2">
              <span className={`text-[14px] font-semibold ${isMentor ? "text-[#d9ebf8]" : "font-bold text-black"}`}>
                Status
              </span>
              <div className={`h-4 w-px ${isMentor ? "bg-white/25" : "bg-gray-300"}`} />
              <span
                className={`inline-block rounded-lg px-3 py-1 text-[12px] font-semibold ${getStatusColor()}`}
              >
                {/* {status} */}
                {effectiveStatus}
              </span>
            </div>

            {/* Completed Dates - Only show for Completed status */}
            {/* {effectiveStatus === "Completed" && completedOn && lastUpdatedOn && (
              <div className="mb-4 space-y-2">
                <div>
                  <p className={`text-[14px] font-semibold ${isMentor ? "text-[#d9ebf8]" : "font-bold text-black"}`}>
                    Completed on:{" "}
                    <span className={isMentor ? "font-normal text-white/90" : "font-normal text-gray-800"}>{completedOn}</span>
                  </p>
                </div>
                <div>
                  <p className={`text-[14px] font-semibold ${isMentor ? "text-[#d9ebf8]" : "font-bold text-black"}`}>
                    Last Updated on:{" "}
                    <span className={isMentor ? "font-normal text-white/90" : "font-normal text-gray-800"}>{lastUpdatedOn}</span>
                  </p>
                </div>
              </div>
            )} */}
            {/* {effectiveStatus === "Completed" && (
  <div className="mb-4 space-y-1 text-[12px] font-semibold text-[#cde2f2]">
    <p>Completed on : N/A</p>
    <p>Last Updated : {lastUpdatedDate || lastUpdatedOn || "—"}</p>
  </div>
)} */}

            {/* Task Completion Progress - Show for In-progress and Over Due */}
            {taskCompleted &&
              (effectiveStatus === "In-progress" || effectiveStatus === "Over Due") && (
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className={`text-[14px] font-semibold ${isMentor ? "text-[#d9ebf8]" : "font-bold text-black"}`}>
                      Task completed
                    </p>
                    <p className={`text-[14px] ${isMentor ? "text-[#8ec5eb]" : "text-black"}`}>
                      {taskCompleted.completed}/{taskCompleted.total}
                    </p>
                  </div>
                  <div
                    className={`h-2 w-full overflow-hidden rounded-full ${isMentor ? "bg-white/15" : "bg-gray-200"}`}
                  >
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${isMentor ? "bg-[#8ec5eb]" : "bg-[#4CAF50]"}`}
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                </div>
              )}
{/* 
            {isMentor && meetingInfo && (
              <div className="mb-4 rounded-xl border border-[#8ec5eb]/25 bg-[#8ec5eb]/10 px-3 py-2.5">
                <div className="mb-1 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-[#8ec5eb]">
                  <i className="fa-regular fa-calendar text-[11px]" aria-hidden />
                  <span>Meeting Scheduled</span>
                </div>
                <p className="text-[13px] text-[#d9ebf8]">
                  {meetingInfo.date}
                  {meetingInfo.time ? <span className="text-[#cde2f2]/75"> at {meetingInfo.time}</span> : null}
                </p>
              </div>
            )} */}
            {isMentor && meetingInfo && (
  <div className="mb-4 rounded-lg border border-yellow-300/35 bg-yellow-300/15 px-3 py-2 text-[13px] font-semibold text-yellow-100">
    Meeting Scheduled : {meetingInfo.date}
    {meetingInfo.time ? ` ${meetingInfo.time}` : ""}
  </div>
)}

            {/* Date Selector - Conditional */}
            {showDateSelector && status === "Not Started" && (
              <div className="mb-4">
                <p className={`mb-2 text-[14px] font-semibold ${isMentor ? "text-[#d9ebf8]" : "font-bold text-black"}`}>
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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className={`mb-1 text-[14px] font-semibold ${isMentor ? "text-[#d9ebf8]" : "font-bold text-black"}`}>
                  Completion time
                </p>
                <p className={`text-[14px] ${isMentor ? "text-white" : "text-black"}`}>{completionTime}</p>
              </div>
              {showViewButton && (
                <button
                  type="button"
                  onClick={handleViewButtonClick}
                  className={
                    isMentor
                      ? "shrink-0 rounded-lg bg-[#8ec5eb] px-6 py-2.5 text-[14px] font-semibold text-[#062946] transition hover:bg-[#a9d5f2]"
                      : "rounded-lg bg-[#2E3B8E] px-6 py-2.5 text-[14px] font-semibold text-white transition-all hover:bg-[#1F2A6E]"
                  }
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
