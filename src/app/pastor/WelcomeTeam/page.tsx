"use client";
import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "../../Assets/jumpstart-hero.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";

export default function WelcomeTeam() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [secretGuestInfo, setSecretGuestInfo] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [isCompleted, setIsCompleted] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const handleSubmit = () => {
    // Instantly show popup, no validation
    setShowSuccessPopup(true);

    // After 2 seconds, hide popup and mark as completed
    setTimeout(() => {
      setShowSuccessPopup(false);
      setIsCompleted(true);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white relative">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative h-[320px] bg-cover bg-center text-white flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10">
          <p className="text-xs text-white/80 mb-40">
            Revitalization Roadmap &gt;{" "}
            <span className="text-white font-medium">
              Church Empowerment Phase
            </span>{" "}
            &gt; Welcome Team
          </p>

          {isCompleted && (
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-[#3DBE72] text-white text-xs font-semibold px-3 py-[3px] rounded-md">
                Completed
              </span>
              <span className="bg-white/20 text-white text-xs px-3 py-[3px] rounded-md">
                Completed on {new Date().toLocaleDateString("en-GB")}
              </span>
            </div>
          )}

          <h1 className="text-3xl font-semibold leading-snug mb-1">
            Welcome Team
          </h1>
          <p className="text-white/70 text-sm">Completion Time Months 3 – 4</p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-16 py-12 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] pb-24 transition-all duration-700 ease-in-out">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">
          {/* LEFT PANEL */}
          <div className="bg-white rounded-xl shadow-md p-4 flex flex-col gap-2 w-full h-fit">
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

                {/* Pastoral Roadmap */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">
                    Pastoral Roadmap
                  </h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm bg-transparent text-white/90">
                    Develop a Welcome Team Strategy
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm text-white/90 bg-transparent">
                    Develop a welcome team strategy and begin implementing that
                    strategy, include a secret guest.
                  </div>
                </div>

                {/* Secret Guest Information */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">
                    Secret Guest Information
                  </h3>
                  {isCompleted ? (
                    <div className="border border-[#5A8DCB] rounded-md p-3 text-sm text-white/90 bg-transparent">
                      {secretGuestInfo || "John Smith (Secret Guest)"}
                    </div>
                  ) : (
                    <textarea
                      value={secretGuestInfo}
                      onChange={(e) => setSecretGuestInfo(e.target.value)}
                      placeholder="Enter the Secret Guest Information here..."
                      className="w-full bg-transparent border border-[#5A8DCB] rounded-md px-3 py-2 text-sm text-white h-[100px] resize-none focus:outline-none"
                    ></textarea>
                  )}
                </div>

                {/* Meeting Date */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <i className="fa-regular fa-calendar text-white/80 text-[14px]"></i>
                    Welcome Team Meeting Date
                  </h3>
                  <div className="relative w-[250px]">
                    <input
                      type="date"
                      value={meetingDate}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      disabled={isCompleted}
                      className={`w-full bg-transparent border border-[#5A8DCB] rounded-md px-3 py-2 text-sm text-white focus:outline-none ${
                        isCompleted ? "opacity-75 cursor-not-allowed" : ""
                      }`}
                    />
                  </div>
                </div>

                {/* Submit / Resubmit Button */}
                <div className="flex justify-end">
                  {isCompleted ? (
                    <button
                      onClick={() => router.push(`/pastor/GuestContactInformation`)}
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

            {/* OTHER TABS */}
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
              Developed Strategy Successfully
            </p>
          </div>
        </div>
      )}

      
    </div>
  );
}
