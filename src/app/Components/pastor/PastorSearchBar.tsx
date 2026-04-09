"use client";

import {
  pastorSearchAbsoluteShell,
  pastorSearchBarWrap,
  pastorSearchIcon,
  pastorSearchIconAbsolute,
  pastorSearchInput,
  pastorSearchInputAbsolute,
} from "./pastor-theme";

type Variant = "inline" | "absolute";

export type PastorSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
  variant?: Variant;
  /** Show clear control when non-empty */
  showClear?: boolean;
};

export default function PastorSearchBar({
  value,
  onChange,
  placeholder = "Search…",
  "aria-label": ariaLabel = "Search",
  className = "",
  variant = "inline",
  showClear = true,
}: PastorSearchBarProps) {
  if (variant === "absolute") {
    const pr = showClear && value.trim() ? "pr-10" : "pr-4";
    return (
      <div className={`${pastorSearchAbsoluteShell} lg:max-w-md ${className}`.trim()}>
        <i className={pastorSearchIconAbsolute} aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${pastorSearchInputAbsolute} ${pr}`}
          aria-label={ariaLabel}
          autoComplete="off"
        />
        {showClear && value.trim() ? (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-3 top-1/2 z-[1] -translate-y-1/2 text-white/60 hover:text-white"
            aria-label="Clear search"
          >
            <i className="fa-solid fa-xmark text-sm" />
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className={`${pastorSearchBarWrap} ${className}`.trim()}>
      <i className={pastorSearchIcon} aria-hidden />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={pastorSearchInput}
        aria-label={ariaLabel}
        autoComplete="off"
      />
      {showClear && value.trim() ? (
        <button
          type="button"
          onClick={() => onChange("")}
          className="shrink-0 text-white/60 hover:text-white"
          aria-label="Clear search"
        >
          <i className="fa-solid fa-xmark text-sm" />
        </button>
      ) : null}
    </div>
  );
}
