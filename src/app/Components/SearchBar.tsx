"use client";

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
      ? "w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 pl-11 text-[15px] text-white placeholder:text-white/45 outline-none focus:border-[#8ec5eb]/50 focus:ring-1 focus:ring-[#8ec5eb]/30"
      : "w-full px-4 py-3 pl-11 rounded-lg bg-white text-[#1A2E7A] placeholder-gray-400 outline-none shadow-md text-[15px]";
  const iconClass =
    variant === "dark"
      ? "fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#8ec5eb]/70 text-sm"
      : "fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm";

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
