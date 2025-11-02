"use client";
import Image from "next/image";
import { useState } from "react";

interface RoadmapHomeCardProps {
  img: any;
  title: string;
  description: string;
  status: "Not Started" | "In-progress" | "Completed" | "Due";
  completionTime: string;
  showDateSelector?: boolean;
  onViewClick?: () => void;
}

export default function RoadmapHomeCard({
  img,
  title,
  description,
  status,
  completionTime,
  showDateSelector = false,
  onViewClick,
}: RoadmapHomeCardProps) {
  const [selectedDate, setSelectedDate] = useState("");

  const getStatusColor = () => {
    switch (status) {
      case "Not Started":
        return "bg-[#B8E6FF] text-[#0066CC]";
      case "In-progress":
        return "bg-[#FFF4B8] text-[#996600]";
      case "Completed":
        return "bg-[#B8FFC9] text-[#006633]";
      case "Due":
        return "bg-[#FFB8B8] text-[#CC0000]";
      default:
        return "bg-[#B8E6FF] text-[#0066CC]";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.05)] border border-[#E5EAF1] flex overflow-hidden hover:shadow-md transition-all">
      {/* Left Image Section - 40-45% width */}
      <div className="relative w-[42%] shrink-0">
        <div className="relative h-full min-h-[220px] rounded-l-2xl overflow-hidden">
          <Image src={img} alt={title} fill className="object-cover" />
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
                className={`inline-block px-3 py-1 rounded-full text-[12px] font-semibold ${getStatusColor()}`}
              >
                {status}
              </span>
            </div>

            {/* Date of the Project - Conditional */}
            {showDateSelector && (
              <div className="mb-4">
                <p className="text-[14px] font-bold text-black mb-2">
                  Date of the Project
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

            {/* Completion Time */}
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[14px] font-bold text-black mb-1">
                  Completion Time
                </p>
                <p className="text-[14px] text-black">{completionTime}</p>
              </div>
              <button
                onClick={onViewClick}
                className="bg-[#2E3B8E] text-white rounded-lg px-6 py-2.5 text-[14px] font-semibold hover:bg-[#1F2A6E] transition-all"
              >
                View
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
