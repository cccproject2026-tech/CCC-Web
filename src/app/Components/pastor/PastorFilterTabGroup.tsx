"use client";

import {
  pastorFilterStrip,
  pastorFilterTabActive,
  pastorFilterTabBase,
  pastorFilterTabIdle,
} from "./pastor-theme";

export type PastorFilterTabGroupProps<T extends string> = {
  tabs: readonly T[];
  active: T;
  onChange: (tab: T) => void;
  className?: string;
  /** Compact padding for dense toolbars */
  dense?: boolean;
};

export default function PastorFilterTabGroup<T extends string>({
  tabs,
  active,
  onChange,
  className = "",
  dense = false,
}: PastorFilterTabGroupProps<T>) {
  const pad = dense ? "px-2 py-1.5 md:px-3" : "px-3 py-1.5 sm:px-4";
  return (
    <div className={`${pastorFilterStrip} ${className}`.trim()} role="tablist" aria-label="Filter">
      {tabs.map((tab) => (
        <button
          key={tab}
          type="button"
          role="tab"
          aria-selected={active === tab}
          onClick={() => onChange(tab)}
          className={`${pastorFilterTabBase} ${pad} ${
            active === tab ? pastorFilterTabActive : pastorFilterTabIdle
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
