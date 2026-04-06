"use client";
import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";import HeroBg from "../../Assets/jumpstart-hero.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function CalendarOfEventsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [calendarFile, setCalendarFile] = useState<File | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) setter(file);
  };

  const handleSubmit = () => {
    if (calendarFile || mediaFile) {
      setIsCompleted(true);
    } else {
      alert("Please upload at least one file before submitting.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white">
      <PastorHeader showFullHeader={true} />

      {/* ---------- HERO SECTION ---------- */}
      <section
        className="relative h-[320px] bg-cover bg-center flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10">
          <p className="text-xs text-white/80 mb-2">
            Revitalization Roadmap &gt;{" "}
            <span className="text-white font-medium">
              Church Empowerment Phase
            </span>{" "}
            &gt; Calendar of Events
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
            Calendar Of Events
          </h1>
          <p className="text-white/70 text-sm">
            Completion Time Months 5 – 6
          </p>
        </div>
      </section>

      {/* ---------- MAIN CONTENT ---------- */}
      <main className="flex-1 px-16 py-12 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] pb-24">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">
          {/* ---------- LEFT PANEL ---------- */}
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

          {/* ---------- RIGHT PANEL ---------- */}
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

                {/* ---------- PASTORAL ROADMAP ---------- */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">
                    Pastoral Roadmap
                  </h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm bg-transparent text-white/90">
                    Develop a calendar of events
                  </div>
                </div>

                {/* ---------- DESCRIPTION ---------- */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm text-white/90 bg-transparent">
                    Description verbiage: Develop a calendar with your church of
                    events for the year that includes at least two community
                    engagement events and their follow-up events
                  </div>
                </div>

                {/* ---------- UPLOAD CALENDAR ---------- */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <i className="fa-regular fa-calendar text-white/80 text-[14px]"></i>
                    Upload Calendar
                  </h3>
                  <label
                    htmlFor="file-calendar"
                    className="border-2 border-dashed border-[#5A8DCB] rounded-md bg-transparent text-center flex flex-col items-center justify-center h-[150px] cursor-pointer hover:bg-[#174F8A]/20 transition"
                  >
                    <input
                      type="file"
                      id="file-calendar"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setCalendarFile)}
                    />
                    <i className="fa-solid fa-plus text-white text-xl mb-2"></i>
                    <p className="text-sm text-white/80">
                      Drag & Drop or Click here to choose file
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      Max file size : 10 MB
                    </p>
                  </label>
                  {calendarFile && (
                    <p className="text-xs text-white/70 mt-2">
                      Uploaded: {calendarFile.name}
                    </p>
                  )}
                </div>

                {/* ---------- UPLOAD EVENT PHOTOS/VIDEOS ---------- */}
                <div className="mb-10">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <i className="fa-regular fa-file-video text-white/80 text-[14px]"></i>
                    Upload Event photos/videos
                  </h3>
                  <label
                    htmlFor="file-media"
                    className="border-2 border-dashed border-[#5A8DCB] rounded-md bg-transparent text-center flex flex-col items-center justify-center h-[150px] cursor-pointer hover:bg-[#174F8A]/20 transition"
                  >
                    <input
                      type="file"
                      id="file-media"
                      className="hidden"
                      onChange={(e) => handleFileChange(e, setMediaFile)}
                    />
                    <i className="fa-solid fa-plus text-white text-xl mb-2"></i>
                    <p className="text-sm text-white/80">
                      Drag & Drop or Click here to choose file
                    </p>
                    <p className="text-xs text-white/50 mt-1">
                      Max file size : 10 MB
                    </p>
                  </label>
                  {mediaFile && (
                    <p className="text-xs text-white/70 mt-2">
                      Uploaded: {mediaFile.name}
                    </p>
                  )}
                </div>

                {/* ---------- SUBMIT BUTTON ---------- */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmit}
                    className={`text-sm font-medium px-6 py-2 rounded-md shadow-sm border transition-all ${
                      isCompleted
                        ? "bg-[#3DBE72] border-[#3DBE72] text-white cursor-not-allowed"
                        : "bg-transparent border border-[#A6B8E8] hover:bg-[#103C8C] hover:text-white text-[#E8ECFF]"
                    }`}
                    disabled={isCompleted}
                  >
                    {isCompleted ? "Completed" : "Submit"}
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

    </div>
  );
}
