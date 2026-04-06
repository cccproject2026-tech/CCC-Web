"use client";
import { useMemo, useState, useEffect } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import HeroBg from "../../Assets/jumpstart-hero.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function CommunityEngagementProject() {
  const [activeTab, setActiveTab] = useState<"overview" | "comments" | "queries">("overview");
  const [selectedDate, setSelectedDate] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [isCompleted, setIsCompleted] = useState(false);
  const [completedOn, setCompletedOn] = useState<string>(""); // formatted date
  const [showToast, setShowToast] = useState(false);

  // Format helper
  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  // When a file is chosen
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setUploadedFile(f);
  };

  // Clicking the Upload button -> toast + complete state
  const handleUpload = () => {
    // Optional: guard if no file selected
    // if (!uploadedFile) { alert("Please choose a file to upload."); return; }

    const dateToUse = selectedDate ? fmt(new Date(selectedDate)) : fmt(new Date());
    setCompletedOn(dateToUse);

    // show toast briefly, then mark completed
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      setIsCompleted(true);
    }, 1400);
  };

  // Re-Upload resets state (keeps previous date typed so user can change if needed)
  const handleReupload = () => {
    setIsCompleted(false);
    setUploadedFile(null);
  };

  const crumbs = useMemo(
    () =>
      `Revitalization Roadmap > Church Empowerment Phase > Community Engagement Project`,
    []
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#062946] text-white font-[Albert_Sans]">
      <PastorHeader showFullHeader />

      {/* HERO */}
      <section
        className="relative flex h-[320px] flex-col justify-end bg-cover bg-center px-6 pb-10 text-white md:px-12 lg:px-20"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]" />
        <div className="relative z-10">
          <p className="text-xs text-white/80 mb-40">{crumbs}</p>

          <div className="flex items-center gap-3 mb-2">
            {isCompleted && (
              <>
                <span className="bg-[#3DBE72] text-white text-xs font-semibold px-3 py-[3px] rounded-md">
                  Completed
                </span>
                <span className="bg-white/20 text-white text-xs px-3 py-[3px] rounded-md">
                  Completed on {completedOn}
                </span>
              </>
            )}
          </div>

          <h1 className="text-3xl font-semibold leading-snug mb-1">
            Community Engagement Project
          </h1>
          <p className="text-white/70 text-sm">Completion Time Months 3 – 4</p>
        </div>
      </section>

      {/* MAIN */}
      <main className="relative flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)] px-4 py-12 pb-24 md:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-10">
          {/* LEFT NAV */}
          <div className="h-fit w-full rounded-xl border border-white/20 bg-white/10 p-4 shadow-md backdrop-blur flex flex-col gap-2">
            {[
              { key: "overview", label: "Over View" },
              { key: "comments", label: "Comments", count: 2 },
              { key: "queries", label: "Queries", count: 3 },
            ].map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveTab(item.key as typeof activeTab)}
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
            {activeTab === "overview" ? (
              <>
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-semibold">Over View</h2>
                  <button className="bg-white rounded-md w-8 h-8 flex items-center justify-center text-[#103C8C] hover:bg-gray-100">
                    <i className="fa-solid fa-ellipsis-vertical" />
                  </button>
                </div>
                <hr className="border-t border-white/40 mb-8" />

                {/* Pastoral Roadmap */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Pastoral Roadmap</h3>
                  <div className={`border border-[#5A8DCB] rounded-md p-3 text-sm bg-transparent text-white/90 ${isCompleted ? "opacity-75" : ""}`}>
                    The church will complete a community engagement project
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <div className={`border border-[#5A8DCB] rounded-md p-3 text-sm text-white/90 bg-transparent ${isCompleted ? "opacity-75" : ""}`}>
                    Complete a community engagement project with the member/discipleship and share
                    the stories of God&apos;s work
                  </div>
                </div>

                {/* Project Date */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <i className="fa-regular fa-calendar text-white/80 text-[14px]" />
                    Project Date
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

                {/* Completed vs Upload UI */}
                {isCompleted ? (
                  <div className="flex flex-wrap gap-3 items-center w-full max-w-lg">
                  <a href="/pastor/SharedMedia">
                    <button
                      className="bg-white text-[#103C8C] hover:bg-gray-100 text-sm font-medium px-6 py-2 rounded-md shadow-sm"
                    >
                      View your Shared Media
                    </button>
                  </a>
                   

                    <button
                      onClick={handleReupload}
                      className="bg-transparent border border-white hover:bg-[#103C8C] hover:text-white text-white text-sm font-medium px-6 py-2 rounded-md shadow-sm"
                    >
                      Re-Upload
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Upload field */}
                    <div className="mb-10">
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <i className="fa-regular fa-file-arrow-up text-white/80 text-[14px]" />
                        Upload Video / Pictures
                      </h3>

                      <label
                        htmlFor="file-upload"
                        className="border-2 border-dashed border-[#5A8DCB] rounded-md bg-transparent text-center flex flex-col items-center justify-center h-[160px] cursor-pointer hover:bg-[#174F8A]/20 transition"
                      >
                        <input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} />
                        <i className="fa-solid fa-plus text-white text-xl mb-2" />
                        <p className="text-sm text-white/80">Drag & Drop or Click here to choose file</p>
                        <p className="text-xs text-white/50 mt-1">Max file size : 10 MB</p>
                        {uploadedFile && (
                          <span className="mt-2 text-xs text-white/80">
                            Selected: <b>{uploadedFile.name}</b>
                          </span>
                        )}
                      </label>
                    </div>

                    {/* Upload button */}
                    <div className="flex justify-end">
                      <button
                        onClick={handleUpload}
                        className="bg-transparent border border-[#A6B8E8] hover:bg-[#103C8C] hover:text-white transition text-[#E8ECFF] text-sm font-medium px-6 py-2 rounded-md shadow-sm"
                      >
                        Upload
                      </button>
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="text-white/70 text-sm mt-10">Under Construction</div>
            )}
          </div>
        </div>

        {/* SUCCESS TOAST */}
        {showToast && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center">
            {/* light blur overlay */}
            <div className="absolute inset-0 backdrop-blur-[1.5px]" />
            <div className="relative bg-white text-[#0B1C58] rounded-xl shadow-2xl px-6 py-4 flex items-center gap-3">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#3DBE72] text-white">
                <i className="fa-solid fa-check" />
              </span>
              <span className="text-sm font-semibold">Project Submitted Successfully</span>
            </div>
          </div>
        )}
      </main>

      {/* (Optional) footer if you need it */}
      {/* <PastorFooter /> */}
    </div>
  );
}
