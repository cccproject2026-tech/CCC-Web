"use client";
import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "@/app/Assets/jumpstart-hero.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";

export default function PastoralMinistryProfilePage() {
   const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [showPopup, setShowPopup] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] relative">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative h-[320px] bg-cover bg-center text-white flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10">
          <p className="text-xs text-white/80 mb-2">
            Revitalization Roadmap &gt; Self Revitalization Phase &gt;{" "}
            <span className="text-white font-medium">
              Pastoral Ministry Profile (PMP)
            </span>
          </p>
          <h1 className="text-3xl font-semibold mb-1">
            Pastoral Ministry Profile (PMP)
          </h1>
          <p className="text-white/70 text-sm">Completion Time Months 1 – 2</p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-16 py-12 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] text-white pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">
          {/* LEFT PANEL */}
          <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 w-full h-[250px]">
            {[
              { key: "overview", label: "Over View" },
              { key: "comments", label: "Comments", count: 2 },
              { key: "queries", label: "Queries", count: 3 },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key)}
                className={`flex justify-between items-center px-4 py-3 rounded-md text-sm font-medium transition-all ${
                  activeTab === item.key
                    ? "bg-[#103C8C] text-white shadow-sm"
                    : "bg-[#F8FAFF] text-gray-600 hover:bg-[#E9EEFF]"
                }`}
              >
                {item.label}
                {item.count && (
                  <span
                    className={`text-xs font-semibold rounded-full px-2 py-[1px] ${
                      activeTab === item.key
                        ? "bg-white/20 text-white"
                        : "bg-white border border-[#D0DAF9] text-[#103C8C]"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* RIGHT CONTENT */}
          <div>
            {activeTab === "overview" && (
              <>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">Over View</h2>
                  <button className="bg-white rounded-md w-8 h-8 flex items-center justify-center text-[#103C8C] hover:bg-gray-100">
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                  </button>
                </div>

                <hr className="border-t border-white/40 mb-8" />

                {/* ROADMAP SECTION */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Roadmap</h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm bg-transparent text-white/90">
                    Complete a Pastoral Ministry Profile (PMP)
                  </div>
                </div>

                {/* DESCRIPTION SECTION */}
                <div className="mb-10">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm bg-transparent text-white/90">
                    Complete a personal pastoral assessment
                  </div>
                </div>

                {/* CTA BUTTON */}
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowPopup(true)}
                    className="bg-transparent border border-[#A6B8E8] hover:bg-[#103C8C] hover:text-white transition text-[#E8ECFF] text-sm font-medium px-6 py-2 rounded-md shadow-sm"
                  >
                    Take PMP Survey
                  </button>
                </div>
              </>
            )}

            {activeTab !== "overview" && (
              <div className="text-white/70 text-sm mt-10">
                Under Construction
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ✅ POPUP MODAL */}
      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,16,30,0.72)] backdrop-blur-sm">
          <div className="w-[90%] max-w-[600px] overflow-hidden rounded-2xl border border-[#8ec5eb]/30 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] shadow-[0_24px_70px_rgba(2,20,38,0.55)] animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/15 bg-[#062946]/60 px-6 py-4 text-white">
              <div>
                <h3 className="text-lg font-semibold">
                  Pastoral Ministry Profile (PMP)
                </h3>
                <p className="text-[13px] text-white/90">
                  This survey is about your current personal well being
                </p>
              </div>
              <button
                onClick={() => setShowPopup(false)}
                className="text-white hover:text-gray-200 text-lg"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 text-white">
              <h4 className="font-semibold mb-3">Assessment Guidelines</h4>
              <div className="rounded-xl border border-white/20 bg-white/5 p-4">
                <ul className="list-disc list-inside space-y-2 text-sm text-[#d8ecfa]">
                  <li>
                    Please complete the Assessment in a single session without
                    taking breaks.
                  </li>
                  <li>
                    If there is a power outage or loss of internet connection,
                    the survey will restart from the beginning.
                  </li>
                  <li>You will not be able to return to previous sections.</li>
                  <li>
                    This Assessment consists of 5 sections to complete.
                  </li>
                  <li>
                    The Assessment should take approximately 45 minutes to
                    complete.
                  </li>
                </ul>
              </div>

              {/* Button */}
              <div className="flex justify-end mt-6">
                <button
                 onClick={() =>router.push(`/pastor/PastorSurveyPMPPage`)}
                  className="rounded-xl bg-[#8ec5eb] px-6 py-2 text-sm font-semibold text-[#062946] transition hover:bg-[#a9d5f2]"
                >
                  Start Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
