"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "../../Assets/jumpstart-hero.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function CMAAssessment() {
  const [activeTab, setActiveTab] = useState("overview");
  const [reviewDate, setReviewDate] = useState("");
  const [showInstructionPopup, setShowInstructionPopup] = useState(false);
  const [showQuestionPopup, setShowQuestionPopup] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const router = useRouter();

  const handleRetakeSurvey = () => {
    setShowInstructionPopup(true);
  };

  const handleStartNow = () => {
    setShowInstructionPopup(false);
    setShowQuestionPopup(true);
  };

  const handleSubmitAnswers = () => {
    setShowQuestionPopup(false);
    setShowSuccessPopup(true);
    setTimeout(() => {
      setShowSuccessPopup(false);
      router.push("/pastor/PastorSurveyCMA");
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] relative">
      <PastorHeader showFullHeader={true} />

      {/* HERO */}
      <section
        className="relative h-[320px] bg-cover bg-center text-white flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10">
          <p className="text-xs text-white/80 mb-40">
            Revitalization Roadmap &gt;{" "}
            <span className="text-white font-medium">
              Community Revitalization and Multiplication Phase
            </span>{" "}
            &gt; CMA Assessment
          </p>
          <h1 className="text-3xl font-semibold mb-1">CMA Assessment</h1>
          <p className="text-white/70 text-sm">Completion Time Months 10 – 12</p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-16 py-12 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] text-white pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">
          {/* LEFT PANEL */}
          <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 h-fit">
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
                {/* HEADER */}
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">Over View</h2>
                  <button className="bg-white rounded-md w-8 h-8 flex items-center justify-center text-[#103C8C] hover:bg-gray-100">
                    <i className="fa-solid fa-ellipsis-vertical"></i>
                  </button>
                </div>
                <hr className="border-t border-white/40 mb-8" />

                {/* CHURCH ROADMAP */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">
                    Church Roadmap
                  </h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm bg-transparent text-white/90">
                    Review CMA Assessment Survey
                  </div>
                </div>

                {/* DESCRIPTION */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm text-white/90 bg-transparent">
                    Review the first CMA Assessment survey and retake the survey
                    for revitalization results
                  </div>
                </div>

                {/* REVIEW DATE */}
                <div className="mb-10 w-full sm:w-[300px]">
                  <label className="block text-sm mb-1">Review Date</label>
                  <div className="relative">
                    <i className="fa-regular fa-calendar absolute left-3 top-2.5 text-white/70 text-sm"></i>
                    <input
                      type="date"
                      value={reviewDate}
                      onChange={(e) => setReviewDate(e.target.value)}
                      className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-8 py-2 text-sm text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* RETAKE BUTTON */}
                <div className="flex justify-end">
                  <button
                    onClick={handleRetakeSurvey}
                    className="bg-[#103C8C] hover:bg-[#0B2E72] transition text-white text-sm font-medium px-8 py-[8px] rounded-md shadow-sm"
                  >
                    Retake CMA Survey
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

      {/* INSTRUCTION POPUP */}
      {showInstructionPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] sm:w-[600px] overflow-hidden animate-fadein">
            <div className="bg-[#08929C] px-6 py-4 flex justify-between items-center">
              <h3 className="text-white text-lg font-semibold">
                Church Assessment Evaluation (CMA)
              </h3>
              <button
                onClick={() => setShowInstructionPopup(false)}
                className="text-white text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm font-semibold mb-3 text-gray-800">
                Assessment Guidelines
              </p>
              <div className="border border-gray-300 rounded-lg p-4 text-sm text-gray-700 space-y-2">
                <ul className="list-disc list-inside space-y-1">
                  <li>Please complete the Assessment in a single session without taking breaks.</li>
                  <li>If there is a power outage or internet loss, the Assessment will restart from the beginning.</li>
                  <li>You will not be able to return to previous sections.</li>
                  <li>This Assessment consists of 5 sections to complete.</li>
                  <li>The Assessment should take approximately 45 minutes to complete.</li>
                </ul>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleStartNow}
                  className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-sm font-medium px-6 py-2 rounded-md"
                >
                  Start Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* QUESTION POPUP */}
      {showQuestionPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white rounded-lg shadow-lg w-[90%] sm:w-[600px] overflow-hidden animate-fadein">
            <div className="bg-[#08929C] px-6 py-4 flex justify-between items-center">
              <h3 className="text-white text-lg font-semibold">
                Church Assessment Evaluation (CMA)
              </h3>
              <button
                onClick={() => setShowQuestionPopup(false)}
                className="text-white text-xl"
              >
                ×
              </button>
            </div>
            <div className="p-6 text-gray-800">
              <p className="font-semibold mb-4 text-sm">
                Please Answer the Questions:
              </p>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="What is your current church membership?"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="How many active members do you have currently?"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="How many baptisms in the last two years?"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowQuestionPopup(false)}
                  className="border border-gray-300 text-gray-600 text-sm px-6 py-2 rounded-md"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAnswers}
                  className="bg-[#103C8C] hover:bg-[#0B2E72] text-white text-sm font-medium px-6 py-2 rounded-md"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS POPUP */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white text-[#0F4A85] px-8 py-5 rounded-xl shadow-lg flex items-center gap-3 fade-in">
            <div className="bg-[#3DBE72] text-white w-6 h-6 flex items-center justify-center rounded-full">
              <i className="fa-solid fa-check text-xs"></i>
            </div>
            <p className="font-medium text-[15px]">
              Answers Submitted Successfully
            </p>
          </div>
        </div>
      )}

  
    </div>
  );
}
