"use client";
import PastorHeader from "@/app/Components/PastorHeader";
import "@fortawesome/fontawesome-free/css/all.min.css";
import HeroBg from "@/app/Assets/jumpstart-hero.png";
import { useRouter } from "next/navigation";

export default function PastorAssessmentDetailPage() {
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

        {/* Title + Badge */}
        <div className="relative z-10 flex justify-between items-center px-16 pb-10">
          <h1 className="text-3xl font-semibold text-white tracking-wide">
            Church Assessment Evaluation (CMA)
          </h1>

          {/* Meeting Scheduled Badge */}
          <div className="flex items-center gap-2 bg-[#103C8C] text-white text-sm font-medium px-5 py-2 rounded-lg shadow-md">
            <i className="fa-regular fa-calendar"></i>
            <span>Meeting Scheduled on 20 January 2025</span>
            <button className="ml-2 text-white/70 hover:text-white">
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>
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
        <button className="border border-white/40 text-white/70 text-sm font-medium px-6 py-2 rounded-md hover:bg-white/10 transition">
          Retry Survey
        </button>
      </main>
    </div>
  );
}
