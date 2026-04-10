"use client";

import { directorSearchInputClass, directorSearchIconClass } from "@/app/director/directorUi";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** Use on dark / glass director shells (RoleShell). */
  variant?: "light" | "dark";
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search",
  className = "",
  variant = "light",
}: SearchBarProps) {
  const inputClass =
    variant === "dark"
      ? directorSearchInputClass
      : "w-full rounded-lg bg-white px-4 py-3 pl-11 text-[15px] text-[#1A2E7A] shadow-md outline-none placeholder:text-gray-400";
  const iconClass =
    variant === "dark"
      ? `${directorSearchIconClass}`
      : "fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400";

  return (
    <div className={`relative ${className}`}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
      <i className={iconClass}></i>
    </div>
  );
}
