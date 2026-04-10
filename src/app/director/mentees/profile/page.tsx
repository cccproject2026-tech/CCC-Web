"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import DirectorHero from "@/app/director/DirectorHero";
import { directorPageRoot, directorBtnPrimary, directorPageContainer } from "@/app/director/directorUi";
import MentorBg from "@/app/Assets/mentor-bg.png";
import MenteeProfileClient from "./MenteeProfileClient";

function MenteeProfileQueryGate() {
  const id = useSearchParams().get("id");
  if (!id?.trim()) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero
          title="Mentee profile"
          subtitle="Select a mentee from the list."
          image={MentorBg}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Mentees", href: "/director/mentees" },
            { label: "Profile" },
          ]}
        />
        <div className={`${directorPageContainer} px-4 py-16 text-center`}>
          <p className="mb-6 text-white/80">No mentee selected. Open a profile from the mentees list.</p>
          <Link href="/director/mentees" className={`${directorBtnPrimary} inline-flex`}>
            Go to mentees
          </Link>
        </div>
      </div>
    );
  }
  return <MenteeProfileClient menteeId={id.trim()} />;
}

export default function MenteeProfilePage() {
  return (
    <Suspense
      fallback={
        <div className={directorPageRoot}>
          <DirectorHero title="Mentee profile" subtitle="Loading…" image={MentorBg} />
          <div className="py-24 text-center text-sm text-white/60">Loading…</div>
        </div>
      }
    >
      <MenteeProfileQueryGate />
    </Suspense>
  );
}
