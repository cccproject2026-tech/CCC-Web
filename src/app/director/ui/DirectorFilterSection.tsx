"use client";

import type { ReactNode } from "react";
import { directorFilterSectionClass, directorFilterSectionRow } from "../directorUi";

type DirectorFilterSectionProps = {
  children: ReactNode;
  className?: string;
  /** Skip the inner flex row (e.g. single full-width child). */
  bare?: boolean;
};

/**
 * Standard filter / toolbar strip: glass card, padding, responsive alignment.
 */
export default function DirectorFilterSection({
  children,
  className = "",
  bare = false,
}: DirectorFilterSectionProps) {
  return (
    <div className={`${directorFilterSectionClass} ${className}`.trim()}>
      {bare ? children : <div className={directorFilterSectionRow}>{children}</div>}
    </div>
  );
}
