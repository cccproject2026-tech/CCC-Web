"use client";
import PastorHeader from "@/app/Components/PastorHeader";
import "@fortawesome/fontawesome-free/css/all.min.css";
import HeroBg from "@/app/Assets/jumpstart-hero.png";
import { useRouter } from "next/navigation";

export default function PastorAssessmentDetailPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white">
      <PastorHeader showFullHeader={true} />

      {/* 🟣 HERO SECTION */}
      <section
        className="
          relative bg-cover bg-center flex flex-col justify-end
          h-[340px] 
          md:h-[300px] 
          sm:h-[260px] 
          max-sm:h-[240px]
        "
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/70"></div>

        {/* Breadcrumb */}
        <div
          className="
            absolute top-6 left-16 text-sm text-white/70 z-10
            max-md:left-6 
            max-sm:text-xs 
            max-sm:top-4
            max-sm:w-[90%]
          "
        >
          Assessments &gt;{" "}
          <span className="text-white font-medium">
            Church Assessment Evaluation (CMA)
          </span>
        </div>

        {/* Title + Badge */}
        <div
          className="
            relative z-10 flex justify-between items-center px-16 pb-10
            max-lg:px-10 
            max-md:flex-col max-md:items-start 
            max-md:gap-4 
            max-md:pb-6 
            max-sm:px-6
          "
        >
          <h1
            className="
              text-3xl font-semibold text-white tracking-wide
              max-md:text-2xl
              max-sm:text-xl
            "
          >
            Church Assessment Evaluation (CMA)
          </h1>

          {/* Meeting Scheduled Badge */}
          <div
            className="
              flex items-center gap-2 bg-[#103C8C] text-white text-sm font-medium
              px-5 py-2 rounded-lg shadow-md
              max-md:text-xs 
              max-md:px-4
              max-sm:w-full max-sm:justify-between
            "
          >
            <i className="fa-regular fa-calendar"></i>
            <span>Meeting Scheduled on 20 January 2025</span>
            <button className="ml-2 text-white/70 hover:text-white">
              <i className="fa-solid fa-ellipsis-vertical"></i>
            </button>
          </div>
        </div>
      </section>

      {/* 🟦 MAIN CONTENT */}
      <main
        className="
          flex-1 bg-gradient-to-b from-[#1C4F96] to-[#0C3470] 
          flex items-center justify-between px-20 py-20
          max-lg:px-14 max-lg:py-16
          max-md:flex-col max-md:gap-6 max-md:justify-center
          max-sm:px-6 max-sm:py-12
        "
      >
        {/* Left button */}
        <button
          onClick={() => router.push("/pastor/assessment-results")}
          className="
            bg-white text-[#103C8C] text-sm font-semibold px-6 py-2 rounded-md shadow-sm 
            hover:bg-[#F3F5FF] transition
            max-sm:w-full max-sm:py-3
          "
        >
          View your Survey Results
        </button>

        {/* Right button */}
        <button
          className="
            border border-white/40 text-white/70 text-sm font-medium px-6 py-2 rounded-md 
            hover:bg-white/10 transition
            max-sm:w-full max-sm:py-3
          "
        >
          Retry Survey
        </button>
      </main>
    </div>
  );
}
