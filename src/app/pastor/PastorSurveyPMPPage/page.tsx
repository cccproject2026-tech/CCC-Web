"use client";
import { useState } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function PastorSurveyPMPPage() {
  const [activeSection, setActiveSection] = useState(1);

  const sections = [
    "Personal Well-Being",
    "Professional Development / Leadership Style",
    "Community Engagement (CE) Experience",
    "Congregational Health",
    "Continuing Education",
  ];

  const handleClear = () => {
    const checkboxes = document.querySelectorAll<HTMLInputElement>(
      'input[type="checkbox"]'
    );
    checkboxes.forEach((cb) => (cb.checked = false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] flex flex-col text-white">
      {/* HEADER */}
      <header className="bg-[#0F1E44] text-white py-4 px-8 flex justify-between items-center shadow-sm">
        <h1 className="text-lg font-semibold">Pastor – Survey – PMP 20</h1>
        <div className="flex items-center justify-center bg-[#325C9C] w-10 h-10 rounded-full text-lg font-bold">
          T
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex flex-1 px-12 py-10 gap-8">
        {/* LEFT PANEL */}
        <aside className="w-[280px] bg-[#103C8C]/20 border border-[#335DAA] rounded-xl p-5 flex flex-col gap-4 h-[500px]">
          {sections.map((title, index) => (
            <div
              key={index}
              onClick={() => setActiveSection(index + 1)}
              className={`flex items-center gap-3 cursor-pointer transition-all ${
                activeSection === index + 1 ? "text-white" : "text-gray-300"
              }`}
            >
              {/* Progress Dot */}
              <div
                className={`w-4 h-4 rounded-full border-2 ${
                  activeSection === index + 1
                    ? "border-white bg-[#FFD84E]"
                    : "border-[#5A8DCB]"
                }`}
              ></div>

              {/* Section Button */}
              <div
                className={`flex-1 p-3 rounded-md border ${
                  activeSection === index + 1
                    ? "bg-[#103C8C] border-[#103C8C]"
                    : "border-[#335DAA]"
                }`}
              >
                <p className="text-sm font-medium">{`Section ${index + 1}`}</p>
                <p className="text-xs text-white/80">{title}</p>
              </div>
            </div>
          ))}
        </aside>

        {/* RIGHT PANEL */}
        <section className="flex-1 bg-transparent rounded-lg p-2">
          <p className="text-sm text-white/90 mb-6 leading-relaxed">
            Choose the option that most best matches how you feel and who you
            are, as this self-assessment helps you understand yourself better.
            Your accuracy allows us to provide the best support and guidance.
          </p>

          {/* QUESTION BLOCKS */}
          <div className="space-y-6 text-[14px]">
            {/* 1 */}
            <div className="space-y-2">
              <label className="block font-medium">
                Feeling physically drained most of the time.
              </label>
              {[
                "Often feeling drained",
                "Feeling motivated and enjoying life",
              ].map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`q1-${i}`}
                    className="accent-[#103C8C] w-4 h-4"
                  />
                  <label htmlFor={`q1-${i}`} className="text-white/90">
                    {opt}
                  </label>
                </div>
              ))}
            </div>

            {/* 2 */}
            <div className="space-y-2">
              <label className="block font-medium">Physical activity</label>
              {[
                "Not physically active",
                "Occasional exercise",
                "Committed to a exercise plan",
              ].map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`q2-${i}`}
                    className="accent-[#103C8C] w-4 h-4"
                  />
                  <label htmlFor={`q2-${i}`} className="text-white/90">
                    {opt}
                  </label>
                </div>
              ))}
            </div>

            {/* 3 */}
            <div className="space-y-2">
              <label className="block font-medium">
                Perception of mental well-being
              </label>
              {[
                "Constant experiences of exhaustion/anxiety",
                "Thinking about getting professional help to deal with stress",
                "Working with a mental health professional",
                "Demonstrating high EI - consistent routine for maintaining strong mental health",
              ].map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`q3-${i}`}
                    className="accent-[#103C8C] w-4 h-4"
                  />
                  <label htmlFor={`q3-${i}`} className="text-white/90">
                    {opt}
                  </label>
                </div>
              ))}
            </div>

            {/* 4 */}
            <div className="space-y-2">
              <label className="block font-medium">
                Handling personal & relational challenges
              </label>
              {[
                "Significant marital/parental challenges",
                "Experiencing major relational challenges",
                "Actively engaged in family life, prioritizing it as vital personal responsibility",
              ].map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`q4-${i}`}
                    className="accent-[#103C8C] w-4 h-4"
                  />
                  <label htmlFor={`q4-${i}`} className="text-white/90">
                    {opt}
                  </label>
                </div>
              ))}
            </div>

            {/* 5 */}
            <div className="space-y-2">
              <label className="block font-medium">Sense of identity</label>
              {[
                "Feeling lost or vague sense of self-identity",
                "Has plan and accountability partner for personal growth",
                "Provides spiritual guidance to colleagues",
              ].map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`q5-${i}`}
                    className="accent-[#103C8C] w-4 h-4"
                  />
                  <label htmlFor={`q5-${i}`} className="text-white/90">
                    {opt}
                  </label>
                </div>
              ))}
            </div>

            {/* 6 */}
            <div className="space-y-2">
              <label className="block font-medium">Faith connection</label>
              {[
                "Struggling with keeping the faith",
                "Incorporates faith in personal and professional life",
              ].map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`q6-${i}`}
                    className="accent-[#103C8C] w-4 h-4"
                  />
                  <label htmlFor={`q6-${i}`} className="text-white/90">
                    {opt}
                  </label>
                </div>
              ))}
            </div>

            {/* 7 */}
            <div className="space-y-2">
              <label className="block font-medium">
                Struggling with addiction
              </label>
              {[
                "Has identified unhealthy habits detrimental to personal and professional growth",
                "Actively seeks professional guidance",
              ].map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`q7-${i}`}
                    className="accent-[#103C8C] w-4 h-4"
                  />
                  <label htmlFor={`q7-${i}`} className="text-white/90">
                    {opt}
                  </label>
                </div>
              ))}
            </div>

            {/* 8 */}
            <div className="space-y-2">
              <label className="block font-medium">Self-care</label>
              {[
                "Lack of sleep",
                "Limited supporting relationships",
                "No plan for self-care",
              ].map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`q8-${i}`}
                    className="accent-[#103C8C] w-4 h-4"
                  />
                  <label htmlFor={`q8-${i}`} className="text-white/90">
                    {opt}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end items-center gap-4 mt-10">
            <button
              onClick={handleClear}
              className="bg-transparent border border-[#A6B8E8] hover:bg-[#103C8C] hover:text-white text-[#E8ECFF] text-sm font-medium px-5 py-2 rounded-md shadow-sm transition"
            >
              Clear Responses
            </button>
            <button className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-sm font-medium px-6 py-2 rounded-md shadow-sm transition">
              Next Section
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}
