"use client";
import { useState } from "react";

interface SortOption {
  value: string;
  label: string;
}

interface SortDropdownProps {
  options: SortOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export default function SortDropdown({
  options,
  value,
  onChange,
  label = "Sort By",
}: SortDropdownProps) {
  const [showMenu, setShowMenu] = useState(false);
  const currentLabel =
    options.find((opt) => opt.value === value)?.label || options[0]?.label;

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-white text-[15px] font-medium whitespace-nowrap">
          {label}
        </span>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-xl text-[14px] font-medium shadow-md hover:bg-white/10 transition-all flex items-center gap-3 min-w-[220px] justify-between"
          >
            <span>{currentLabel}</span>
            <i className="fa-solid fa-chevron-down text-xs"></i>
          </button>

          {/* Sort Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl py-3 px-2 min-w-[220px] z-[60]">
              {options.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setShowMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-[14px] transition-all flex items-center gap-2 ${
                    value === option.value
                      ? "bg-green-50 text-green-700 font-semibold"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      value === option.value
                        ? "border-green-500 bg-green-500"
                        : "border-gray-300"
                    }`}
                  >
                    {value === option.value && (
                      <i className="fa-solid fa-check text-white text-[8px]"></i>
                    )}
                  </span>
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        ></div>
      )}
    </>
  );
}
