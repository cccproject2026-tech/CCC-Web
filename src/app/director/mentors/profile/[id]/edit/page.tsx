"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { directorPageRoot, directorSpinner } from "@/app/director/directorUi";

export default function LegacyEditMentorProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    router.replace(
      id
        ? `/director/mentors/profile/edit?id=${encodeURIComponent(String(id))}`
        : "/director/mentors",
    );
  }, [id, router]);

  return (
    <div className={directorPageRoot}>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
        <div className={directorSpinner} />
        <p className="text-sm text-white/80">Loading mentor...</p>
      </div>
    </div>
  );
}
