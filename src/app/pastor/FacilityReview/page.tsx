"use client";
import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "../../Assets/jumpstart-hero.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";

export default function FacilityReview() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedDate, setSelectedDate] = useState("");
  const [adjustments, setAdjustments] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleSubmit = () => {
    if (adjustments && selectedDate) {
      // Show success popup
      setShowSuccessPopup(true);

      // Hide popup after delay and mark as completed
      setTimeout(() => {
        setShowSuccessPopup(false);
        setIsCompleted(true);
      }, 2000);
    } else {
      alert("Please fill all fields before submitting.");
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col bg-[#062946] text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative flex h-[320px] flex-col justify-end bg-cover bg-center px-6 pb-10 text-white md:px-12 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]"></div>
        <div className="relative z-10">
          <p className="text-xs text-white/80 mb-40">
            Revitalization Roadmap &gt;{" "}
            <span className="text-white font-medium">
              Church Empowerment Phase
            </span>{" "}
            &gt; Facility Review
          </p>

          {isCompleted && (
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-[#3DBE72] text-white text-xs font-semibold px-3 py-[3px] rounded-md">
                Completed
              </span>
              <span className="bg-white/20 text-white text-xs px-3 py-[3px] rounded-md">
                Completed on 20 Oct 2024
              </span>
            </div>
          )}

          <h1 className="text-3xl font-semibold leading-snug mb-1">
            Facility Review
          </h1>
          <p className="text-white/70 text-sm">Completion Time Months 3 – 4</p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 py-12 pb-24 transition-all duration-700 ease-in-out md:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">
          {/* LEFT PANEL */}
          <div className="h-fit w-full rounded-xl border border-white/20 bg-white/10 p-4 shadow-md backdrop-blur flex flex-col gap-2">
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

          {/* RIGHT PANEL */}
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

                {/* Pastoral Roadmap */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">
                    Pastoral Roadmap
                  </h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm bg-transparent text-white/90">
                    Complete a review of your facility
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm text-white/90 bg-transparent">
                    Complete a review of your facility and make the necessary
                    minor adjustments to make it more visitor friendly
                  </div>
                </div>

                {/* Adjustments */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">
                    Adjustments you have made
                  </h3>

                  {isCompleted ? (
                    <div className="border border-[#5A8DCB] rounded-md p-3 text-sm text-white/90 bg-transparent leading-relaxed">
                      {showFullText ? (
                        <>
                          {adjustments}{" "}
                          <button
                            onClick={() => setShowFullText(false)}
                            className="text-[#A6B8E8] ml-1 underline text-xs"
                          >
                            Show Less
                          </button>
                        </>
                      ) : (
                        <>
                          {adjustments.slice(0, 180)}
                          {adjustments.length > 180 && (
                            <>
                              ...{" "}
                              <button
                                onClick={() => setShowFullText(true)}
                                className="text-[#A6B8E8] underline text-xs"
                              >
                                See More
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  ) : (
                    <textarea
                      value={adjustments}
                      onChange={(e) => setAdjustments(e.target.value)}
                      placeholder="Explain the adjustments you have made..."
                      className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-3 py-2 text-sm text-white h-[100px] resize-none focus:outline-none"
                    ></textarea>
                  )}
                </div>

                {/* Facility Review Date */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <i className="fa-regular fa-calendar text-white/80 text-[14px]"></i>
                    Facility Review Date
                  </h3>
                  <div className="relative w-[250px]">
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      disabled={isCompleted}
                      className={`w-full bg-transparent border border-[#5A8DCB] rounded-md px-3 py-2 text-sm text-white focus:outline-none ${
                        isCompleted ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Submit or Resubmit Button */}
                <div className="flex justify-end">
                  {isCompleted ? (
                    <button
                      onClick={() => setIsCompleted(false)}
                      className="bg-transparent border border-[#A6B8E8] hover:bg-[#103C8C] hover:text-white transition text-[#E8ECFF] text-sm font-medium px-6 py-2 rounded-md shadow-sm"
                    >
                      Resubmit
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="bg-transparent border border-[#A6B8E8] hover:bg-[#103C8C] hover:text-white transition text-[#E8ECFF] text-sm font-medium px-6 py-2 rounded-md shadow-sm"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Other Tabs */}
            {activeTab !== "overview" && (
              <div className="text-white/70 text-sm mt-10">
                Under Construction
              </div>
            )}
          </div>
        </div>
      </main>

      {/* SUCCESS POPUP */}
      {showSuccessPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white text-[#0F4A85] px-8 py-5 rounded-xl shadow-lg flex items-center gap-3 fade-in">
            <div className="bg-[#3DBE72] text-white w-6 h-6 flex items-center justify-center rounded-full">
              <i className="fa-solid fa-check text-xs"></i>
            </div>
            <p className="font-medium text-[15px]">
              Facility Reviewed Successfully
            </p>
          </div>
        </div>
      )}

     
    </div>
  );
}
