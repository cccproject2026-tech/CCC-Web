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
        className="relative h-[320px] bg-cover bg-center flex flex-col justify-end"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/70"></div>

        {/* Breadcrumb */}
        <div className="absolute top-6 left-16 text-sm text-white/70 z-10">
          Revitalization Roadmap &gt; Self Revitalization Phase &gt;{" "}
          <span className="text-white font-medium">
            Church Assessment Evaluation (CMA)
          </span>
        </div>

        {/* Title + Completion Badge */}
        <div className="relative z-10 flex flex-col px-16 pb-10">
          <h1 className="text-3xl font-semibold text-white mb-3">
            Church Assessment Evaluation (CMA)
          </h1>

          <div className="flex items-center gap-3">
            <span className="bg-[#2E7D32] text-white text-xs font-semibold px-3 py-[3px] rounded-md">
              Completed
            </span>
            <p className="text-sm text-gray-200">
              Completed on <span className="font-medium">20 Oct 2024</span>
            </p>
          </div>
        </div>
      </section>

      {/* 🟦 MAIN CONTENT */}
      <main className="flex-1 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] px-16 py-12 flex gap-10">
        {/* LEFT SIDEBAR */}
        <aside className="w-[260px] bg-white rounded-xl shadow-md overflow-hidden h-[200px]">
          <div className="border-b border-gray-200">
            <div className="bg-[#103C8C] text-white font-medium px-5 py-3 text-sm">
              Over View
            </div>
          </div>
          <div className="flex flex-col divide-y divide-gray-100 text-[#0F1E44] text-sm">
            <button className="flex justify-between items-center px-5 py-3 hover:bg-[#F7F9FC] transition">
              <span>Comments</span>
              <span className="text-xs bg-[#103C8C] text-white px-2 py-[2px] rounded-md">
                2
              </span>
            </button>
            <button className="flex justify-between items-center px-5 py-3 hover:bg-[#F7F9FC] transition">
              <span>Queries</span>
              <span className="text-xs bg-[#103C8C] text-white px-2 py-[2px] rounded-md">
                3
              </span>
            </button>
          </div>
        </aside>

        {/* RIGHT MAIN PANEL */}
        <section className="flex-1 bg-white rounded-xl shadow-lg p-8 text-[#0F1E44]">
          <h2 className="text-xl font-semibold mb-6">Over View</h2>

          <div className="space-y-6">
            <div>
              <p className="text-xs text-gray-500 mb-2">Church Roadmap</p>
              <div className="border border-gray-200 rounded-md px-4 py-2 text-sm text-[#0F1E44] bg-[#F9FBFF]">
                Complete a Church Assessment Evaluation (CMA)
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">Description</p>
              <div className="border border-gray-200 rounded-md px-4 py-2 text-sm text-[#0F1E44] bg-[#F9FBFF]">
                Complete a church/congregational assessment
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={() => router.push("/pastor/assessment-results")}
                className="bg-[#103C8C] text-white text-sm font-medium px-6 py-2 rounded-md shadow hover:bg-[#0B2E72] transition"
              >
                View your Survey Results
              </button>

              <button className="border border-[#103C8C] text-[#103C8C] text-sm font-medium px-6 py-2 rounded-md hover:bg-[#F3F5FF] transition">
                Retry Survey
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
