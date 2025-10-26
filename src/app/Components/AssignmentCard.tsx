"use client";
import { useState } from "react";
import Image from "next/image";

interface AssignmentCardProps {
  id: number;
  title: string;
  description: string;
  image: any;
  onView: () => void;
  onOptionsClick: (id: number) => void;
  isSelected?: boolean;
  onSelect?: (id: number) => void;
  showCheckbox?: boolean;
}

export default function AssignmentCard({
  id,
  title,
  description,
  image,
  onView,
  onOptionsClick,
  isSelected = false,
  onSelect,
  showCheckbox = false,
}: AssignmentCardProps) {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden relative">
      {/* Checkbox and Options Button in top-right corner */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {/* Checkbox */}
        {showCheckbox && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(id);
            }}
            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
              isSelected
                ? "border-[#2E3B8E] bg-[#2E3B8E]"
                : "border-gray-300 bg-white"
            }`}
          >
            {isSelected && (
              <i className="fa-solid fa-check text-white text-[12px]"></i>
            )}
          </button>
        )}

        {/* Options Button */}
        {!showCheckbox && (
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/80 transition-colors bg-white/50 backdrop-blur-sm"
            aria-label="More options"
          >
            <i className="fa-solid fa-ellipsis-vertical text-gray-600"></i>
          </button>
        )}
      </div>

      {/* Image */}
      <div className="h-40 relative overflow-hidden">
        <Image src={image} alt={title} fill className="object-cover" />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-3">
        <h3 className="text-[16px] font-bold text-gray-900 leading-tight">
          {title}
        </h3>
        <p className="text-[14px] text-gray-600 leading-relaxed">
          {description}
        </p>

        {/* View Button */}
        <div className="flex items-center justify-end">
          <button
            onClick={onView}
            className="px-5 py-2 bg-[#2E3B8E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#1F2A6E] transition-all"
          >
            View
          </button>
        </div>

        {/* Options Menu */}
        {showMenu && (
          <div className="absolute top-3 right-3 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50 min-w-[180px] animate-fade-in">
            <button
              onClick={() => {
                onOptionsClick(id);
                setShowMenu(false);
              }}
              className="w-full text-left px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-3"
            >
              <i className="fa-solid fa-paperclip text-blue-500 w-[18px]"></i>
              <span>Assign to</span>
            </button>
            <button
              onClick={() => setShowMenu(false)}
              className="w-full text-left px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-3"
            >
              <i className="fa-solid fa-pencil text-green-500 w-[18px]"></i>
              <span>Edit</span>
            </button>
            <button
              onClick={() => setShowMenu(false)}
              className="w-full text-left px-4 py-2.5 text-[14px] text-red-600 hover:bg-red-50 transition-all flex items-center gap-3"
            >
              <i className="fa-solid fa-trash text-red-600 w-[18px]"></i>
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        ></div>
      )}
    </div>
  );
}
