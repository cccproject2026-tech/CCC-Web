"use client";
import { useState } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";import HeroBg from "@/app/Assets/jumpstart-hero.png"; // Replace with correct hero image
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function PrayerAndVisitationStrategyPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Handle upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = event.target.files?.[0];
    if (uploaded) {
      setUploadedFile(uploaded);
      setIsCompleted(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85]">
      <PastorHeader showFullHeader={true} />

      {/* HERO SECTION */}
      <section
        className="relative h-[320px] bg-cover bg-center text-white flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            {isCompleted && (
              <>
                <span className="bg-[#3DBE72] text-white text-xs font-semibold px-3 py-[3px] rounded-md">
                  Completed
                </span>
                <span className="bg-white/20 text-white text-xs px-3 py-[3px] rounded-md">
                  Completed on 20 Oct 2024
                </span>
              </>
            )}
          </div>
          <h1 className="text-3xl font-semibold leading-snug mb-1">
            Prayer and Visitation Strategy
          </h1>
          <p className="text-white/70 text-sm">Completion Time Months 1 – 2</p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="flex-1 px-16 py-12 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971] text-white pb-24">
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

                {/* Roadmap */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Roadmap</h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm bg-transparent text-white/90">
                    Create a prayer and visitation strategy
                  </div>
                </div>

                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-sm font-semibold mb-2">Description</h3>
                  <div className="border border-[#5A8DCB] rounded-md p-3 text-sm text-white/90 bg-transparent">
                    Develop a prayer and visitation strategy and upload document
                  </div>
                </div>

                {/* Uploaded File Section */}
                {uploadedFile && (
                  <div className="mb-6">
                    <h3 className="text-sm font-semibold mb-3">Your Uploads</h3>
                    <div className="bg-white text-gray-800 rounded-lg shadow-sm p-4 flex items-center justify-between gap-4 w-full max-w-md">
                      <div className="flex items-center gap-3">
                        <div className="bg-[#FFEAEA] text-[#E24C4B] rounded-md p-2">
                          <i className="fa-solid fa-file-pdf text-lg"></i>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium">
                            {uploadedFile.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            20 Oct 2024
                          </p>
                        </div>
                      </div>
                      <i className="fa-solid fa-check text-green-500"></i>
                    </div>
                  </div>
                )}

                {/* Upload Section */}
                <div className="mb-10">
                  <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <i className="fa-regular fa-file-arrow-up text-white/80 text-[14px]"></i>
                    Upload Strategy
                  </h3>

                  {/* Upload Box */}
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
                </div>

                {/* Upload Button */}
                <div className="flex justify-end">
                  <button className="bg-transparent border border-[#A6B8E8] hover:bg-[#103C8C] hover:text-white transition text-[#E8ECFF] text-sm font-medium px-6 py-2 rounded-md shadow-sm">
                    {uploadedFile ? "Upload New Strategy" : "Upload Strategy"}
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
