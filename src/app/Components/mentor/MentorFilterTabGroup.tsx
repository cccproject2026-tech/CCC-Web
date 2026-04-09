"use client";

import {
  mentorFilterStrip,
  mentorFilterTabActive,
  mentorFilterTabBase,
  mentorFilterTabIdle,
} from "./mentor-theme";

export type MentorFilterTabGroupProps<T extends string> = {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
  className?: string;
  dense?: boolean;
  "aria-label"?: string;
};

export default function MentorFilterTabGroup<T extends string>({
  tabs,
  active,
  onChange,
  className = "",
  dense = false,
  "aria-label": ariaLabel = "Filter",
}: MentorFilterTabGroupProps<T>) {
  const pad = dense ? "px-2 py-1.5 md:px-3" : "px-3 py-1.5 sm:px-4";
  return (
    <div className={`${mentorFilterStrip} ${className}`.trim()} role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          onClick={() => onChange(tab)}
          className={`${mentorFilterTabBase} ${pad} ${
            active === tab ? mentorFilterTabActive : mentorFilterTabIdle
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
