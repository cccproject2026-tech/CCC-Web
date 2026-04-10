"use client";

import dynamic from "next/dynamic";
import { directorPageRoot, directorSpinner } from "../directorUi";

/**
 * Split the heavy UI into a separate chunk so the route module stays small
 * and dev ChunkLoadError (chunk fetch timeout) is less likely.
 */
const AssessmentsClient = dynamic(() => import("./AssessmentsClient"), {
  loading: () => (
    <div className={directorPageRoot}>
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 py-16">
        <div className={directorSpinner} />
        <p className="text-sm font-medium text-white/80">Loading assessments…</p>
      </div>
    </div>
  ),
});

export default function AssessmentsPage() {
  return <AssessmentsClient />;
}
