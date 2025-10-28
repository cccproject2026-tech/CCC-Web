"use client";
import PastorHeader from "@/app/Components/PastorHeader";
import "@fortawesome/fontawesome-free/css/all.min.css";
import HeroBg from "@/app/Assets/jumpstart-hero.png";
import { useRouter } from "next/navigation";

export default function PastorPMPResultPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85]">
      <PastorHeader showFullHeader={true} />

      {/* 🟣 HERO SECTION */}
      <section
        className="relative h-[340px] bg-cover bg-center flex flex-col justify-end"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>

        {/* Breadcrumb */}
        <div className="absolute top-6 left-16 text-sm text-white/70 z-10">
          Assessments &gt;{" "}
          <span className="text-white font-medium">
            Church Assessment Evaluation (CMA)
          </span>
        </div>

        {/* Title + Status */}
        <div className="relative z-10 px-16 pb-12">
          <h1 className="text-3xl font-semibold text-white tracking-wide mb-4">
            Pastoral Ministry Profile (PMP)
          </h1>

          <div className="flex items-center gap-3">
            {/* Completed badge */}
            <span className="bg-green-700/80 text-white text-xs font-semibold px-3 py-[4px] rounded-full">
              Completed
            </span>

            {/* Completed date */}
            <span className="bg-black/40 text-white text-sm font-medium px-4 py-[6px] rounded-md">
              Completed on 20 Oct 2024
            </span>
          </div>
        </div>
      </section>

      {/* 🟦 MAIN CONTENT */}
      <main className="flex-1 bg-gradient-to-b from-[#1C4F96] to-[#0C3470] flex items-center justify-between px-20 py-20">
        {/* Left button */}
        <button
          onClick={() => router.push("/pastor/assessment-results")}
          className="bg-white text-[#103C8C] text-sm font-semibold px-6 py-2 rounded-md shadow-sm hover:bg-[#F3F5FF] transition"
        >
          View your Survey Results
        </button>

        {/* Right button */}
        <button
          onClick={() => router.push("/pastor/PastorSurveyPMPPage")}
          className="border border-white/40 text-white/80 text-sm font-medium px-6 py-2 rounded-md hover:bg-white/10 transition"
        >
          Repeat PMP Survey
        </button>
      </main>
    </div>
  );
}
