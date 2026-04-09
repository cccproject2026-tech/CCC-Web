"use client";

import {
  mentorSearchAbsoluteShell,
  mentorSearchBarWrap,
  mentorSearchIcon,
  mentorSearchIconAbsolute,
  mentorSearchInput,
  mentorSearchInputAbsolute,
} from "./mentor-theme";

type Variant = "inline" | "absolute";

export type MentorSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
  variant?: Variant;
  showClear?: boolean;
  disabled?: boolean;
};

export default function MentorSearchBar({
  value,
  onChange,
  placeholder = "Search",
  "aria-label": ariaLabel = "Search",
  className = "",
  variant = "inline",
  showClear = true,
  disabled = false,
}: MentorSearchBarProps) {
  if (variant === "absolute") {
    const pr = showClear && value.trim() ? "pr-10" : "pr-4";
    return (
      <div className={`${mentorSearchAbsoluteShell} lg:max-w-md ${className}`.trim()}>
        <i className={mentorSearchIconAbsolute} aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${mentorSearchInputAbsolute} ${pr} disabled:cursor-not-allowed disabled:opacity-50`}
          aria-label={ariaLabel}
          autoComplete="off"
          disabled={disabled}
        />
        {showClear && value.trim() ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-white/60 transition hover:text-white"
            aria-label="Clear search"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`${mentorSearchBarWrap} ${className}`.trim()}>
      <i className={mentorSearchIcon} aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${mentorSearchInput} disabled:cursor-not-allowed disabled:opacity-50`}
        aria-label={ariaLabel}
        autoComplete="off"
        disabled={disabled}
      />
      {showClear && value.trim() ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="shrink-0 text-white/60 transition hover:text-white"
          aria-label="Clear search"
        >
          <i className="fa-solid fa-xmark text-sm" />
        </button>
      ) : null}
    </div>
  );
}
