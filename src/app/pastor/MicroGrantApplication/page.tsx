"use client";
import { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import HeroBg from "@/app/Assets/jumpstart-hero.png";

export default function MicroGrantApplicationPage() {
  const [activeTab, setActiveTab] = useState("Cover Sheet");

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white">
      {/* 🟣 HERO SECTION */}
      <section
        className="relative h-[300px] bg-cover bg-center flex flex-col justify-end"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>

        <div className="relative z-10 px-16 pb-10">
          <h1 className="text-3xl font-semibold mb-3">
            The Center for Community Change Micro-Grant Application
          </h1>
          <p className="text-sm text-white/80 max-w-3xl">
            Please keep in mind that the church applying for a grant must become
            a partner with the CCC by signing a MOU.
          </p>
        </div>
      </section>

      {/* 🟦 MAIN CONTENT */}
      <main className="flex-1 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] px-16 py-12">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-10">
          {/* LEFT SIDEBAR with VERTICAL STEPPER */}
          <aside className="relative w-full lg:w-[280px]">
            <div className="absolute left-[22px] top-[45px] bottom-[45px] w-[3px] h-[40px] bg-[#41B36E]"></div>
            <div className="flex flex-col gap-3 relative z-10">
              {["Cover Sheet", "Reporting Procedures"].map((tab, index) => (
                <div
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-4 cursor-pointer rounded-lg px-4 py-3 transition-all ${
                    activeTab === tab
                      ? "bg-[#103C8C] text-white"
                      : "bg-white text-[#0B1C58] hover:bg-[#EEF3FF]"
                  }`}
                >
                  {/* Stepper Circle */}
                  <div
                    className={`w-7 h-7 flex items-center justify-center rounded-full border-2 ${
                      activeTab === tab
                        ? "bg-[#41B36E] border-[#3A9F62] text-white"
                        : "bg-white border-[#3A9F62] text-[#3A9F62]"
                    } text-sm font-semibold`}
                  >
                    {index + 1}
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{tab}</span>
                    {tab === "Cover Sheet" && (
                      <p
                        className={`text-xs ${
                          activeTab === tab
                            ? "text-white/80"
                            : "text-[#6B7280]"
                        }`}
                      >
                        Please answer the questions succinctly following prompts
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          {/* RIGHT PANEL CONTENT */}
          <section className="flex-1 bg-transparent text-white">
            {activeTab === "Cover Sheet" && (
              <form className="space-y-6">
                {[
                  "Name of the church *",
                  "Name of the project/program *",
                  "Who does the project/program serve and why is it important? *",
                  "Amount requested *",
                  "Project amount of denominational support (Local Conference, Union, NAD, GC, etc.) *",
                  "What action steps will you take to achieve your goals? *",
                  "What resources do you already have? *",
                  "Who will be leading and overseeing the project/program, and what are their qualifications? *",
                  "What are the measurable markers of your success? *",
                ].map((label, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-white/90">
                      {label}
                    </label>
                    <input
                      type="text"
                      placeholder="Your Answer"
                      className="bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-sm text-white placeholder:text-white/60 focus:ring-2 focus:ring-[#FFD84E] outline-none"
                    />
                  </div>
                ))}

                {/* Upload Box */}
                <div className="flex flex-col gap-3 mt-8">
                  <label className="text-sm font-medium text-white/90">
                    Please upload here any supporting documents or media (photos,
                    videos, publications, etc.)
                  </label>
                  <div className="border-2 border-dashed border-[#5A8DCB] rounded-lg p-6 flex flex-col items-center justify-center text-white/70 text-sm hover:bg-[#0E3D74]/50 transition">
                    <i className="fa-solid fa-cloud-arrow-up text-2xl mb-3 text-[#FFD84E]"></i>
                    <p className="mb-1">
                      Drag & Drop or <span className="underline">Click here</span>{" "}
                      to choose file
                    </p>
                    <p className="text-xs text-white/50">
                      Upload up to 5 supported files. Max 10 MB per file.
                    </p>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-between items-center pt-8">
                  <button
                    type="button"
                    className="bg-white text-[#103C8C] text-sm font-medium px-6 py-2 rounded-md shadow-sm hover:bg-[#F3F5FF] transition"
                  >
                    Clear Form
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab("Reporting Procedures")}
                    className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-sm font-medium px-8 py-2 rounded-md shadow-md transition"
                  >
                    Next
                  </button>
                </div>
              </form>
            )}

            {/* 📄 REPORTING PROCEDURES TAB */}
            {activeTab === "Reporting Procedures" && (
              <form className="space-y-8">
                <div className="space-y-4 text-[14px] leading-relaxed">
                  <p>
                    <i className="fa-solid fa-circle-exclamation text-[#FFD84E] mr-2"></i>
                    If approved, you will sign a grant agreement (read online) that lays out Action Steps – the CCC may
                    request mid-year updates and a final report upon completion. Failure to follow reporting steps may
                    result in loss of funding eligibility for future cycles.
                  </p>
                  <p>
                    <i className="fa-solid fa-circle-exclamation text-[#FFD84E] mr-2"></i>
                    Upon completion of this project, the grantee church agrees to submit a general reporting form in light
                    of the goals listed in the application and supported through the CCC grant.
                  </p>
                  <p>
                    <i className="fa-solid fa-circle-exclamation text-[#FFD84E] mr-2"></i>
                    Our hope is that you will form valuable stories of connection that can be replicated and shared with
                    other churches and ministry leaders supported by the CCC.
                  </p>
                </div>

                {/* Confirmation Checkboxes */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-white/90">
                    Please review the grant application thoroughly before submission to ensure that all sections have
                    accurate information.
                  </label>

                  {[
                    "I have reviewed the application and filled out each section to the best of my knowledge.",
                    "I have included all of my uploads, and I realize this ensures it’s sent within 4 weeks after receipt.",
                  ].map((text, idx) => (
                    <label key={idx} className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        className="accent-[#FFD84E] w-4 h-4 mt-[2px]"
                      />
                      <span className="text-sm">{text}</span>
                    </label>
                  ))}

                  <div className="flex flex-col gap-2 mt-4">
                    <label className="text-sm font-medium">Other</label>
                    <input
                      type="text"
                      placeholder="Type here..."
                      className="bg-transparent border border-[#5A8DCB] rounded-md px-4 py-2 text-sm text-white placeholder:text-white/60 focus:ring-2 focus:ring-[#FFD84E] outline-none"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-between items-center pt-8">
                  <button
                    type="button"
                    onClick={() => setActiveTab("Cover Sheet")}
                    className="border border-[#A6B8E8] text-white/90 text-sm font-medium px-6 py-2 rounded-md hover:bg-white/10 transition"
                  >
                    Back
                  </button>

                  <button
                    type="submit"
                    className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-sm font-medium px-8 py-2 rounded-md shadow-md transition"
                  >
                    Submit
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
