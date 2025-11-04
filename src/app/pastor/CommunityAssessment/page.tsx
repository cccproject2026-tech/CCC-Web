"use client";
import { useState } from "react";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "../../Assets/jumpstart-hero.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";

export default function CommunityAssessmentPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = event.target.files?.[0];
    if (uploaded) {
      setUploadedFile(uploaded);

      // show popup immediately
      setShowSuccessPopup(true);

      // hide popup after delay
      setTimeout(() => {
        setShowSuccessPopup(false);
        setIsCompleted(true);
      }, 2000);
    }
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
            &gt; Community Assessment
          </p>

          {isCompleted && (
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-[#3DBE72] text-white text-xs font-semibold px-3 py-[3px] rounded-md">
                Completed
              </span>
              <span className="bg-white/20 text-white text-xs px-3 py-[3px] rounded-md">
                Uploaded on {new Date().toLocaleDateString("en-GB")}
              </span>
            </div>
          )}

          <h1 className="text-3xl font-semibold leading-snug mb-1">
            Community Assessment
          </h1>
          <p className="text-white/70 text-sm">Completion Time Months 5 – 6</p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-16 py-12 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] pb-24">
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
                    Complete a community assessment tool
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm text-white/90 bg-transparent">
                    Refine your understanding of the needs in your community by
                    using a community assessment tool.
                  </div>
                </div>

                {/* Upload Assessment Results */}
                <div className="mb-10">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <i className="fa-regular fa-file-arrow-up text-white/80 text-[14px]"></i>
                    Upload Assessment Results
                  </h3>

                  {/* Upload Section */}
                  {uploadedFile ? (
                    <div className="bg-white text-gray-800 rounded-lg shadow-sm p-4 flex items-center justify-between gap-4 w-full max-w-md">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#E8EDFF] text-[#103C8C] rounded-md p-2">
                          <i className="fa-solid fa-file text-lg"></i>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">
                            {uploadedFile.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            Uploaded on {new Date().toLocaleDateString("en-GB")}
                          </p>
                        </div>
                      </div>
                      <i className="fa-solid fa-check text-green-500"></i>
                    </div>
                  ) : (
                    <label
                      htmlFor="file-upload"
                      className="border-2 border-dashed border-[#5A8DCB] rounded-md bg-transparent text-center flex flex-col items-center justify-center h-[160px] cursor-pointer hover:bg-[#174F8A]/20 transition"
                    >
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                      <i className="fa-solid fa-plus text-white text-xl mb-2"></i>
                      <p className="text-sm text-white/80">
                        Drag & Drop or Click here to choose file
                      </p>
                      <p className="text-xs text-white/50 mt-1">
                        Max file size : 10 MB
                      </p>
                    </label>
                  )}
                </div>

                {/* Upload Button */}
                <div className="flex justify-end">
                  <button
                    onClick={() =>
                      uploadedFile
                        ? router.push(`/pastor/CommunityEngagementEvents`)
                        : document.getElementById("file-upload")?.click()
                    }
                    className="bg-transparent border border-[#A6B8E8] hover:bg-[#103C8C] hover:text-white transition text-[#E8ECFF] text-sm font-medium px-6 py-2 rounded-md shadow-sm"
                  >
                    {uploadedFile ? "Re-Upload" : "Upload"}
                  </button>
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
              Document Uploaded Successfully
            </p>
          </div>
        </div>
      )}

  
    </div>
  );
}
