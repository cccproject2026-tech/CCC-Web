"use client";
import { useState } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "../../Assets/jumpstart-hero.png";
import "@fortawesome/fontawesome-free/css/all.min.css";

// sample media
import Photo1 from "../../Assets/photo1.png";
import Photo2 from "../../Assets/photo2.png";
import Photo3 from "../../Assets/photo3.png";
import Photo4 from "../../Assets/photo4.png";
import Photo5 from "../../Assets/photo5.png";
import Photo6 from "../../Assets/photo6.png";
import { useRouter } from "next/navigation";

export default function SharedMedia() {
  const [activeTab, setActiveTab] = useState<"photos" | "videos">("photos");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const router = useRouter();

  const photos = [
    Photo1,
    Photo2,
    Photo3,
    Photo4,
    Photo5,
    Photo6,
    Photo1,
    Photo2,
    Photo3,
  ];

  const videos = [
    Photo3,
    Photo4,
    Photo5,
    Photo6,
    Photo1,
    Photo2,
    Photo3,
    Photo4,
    Photo5,
  ];

  const media = activeTab === "photos" ? photos : videos;

  // ✅ Toggle select mode
  const toggleSelectMode = () => {
    setIsSelectMode(!isSelectMode);
    if (isSelectMode) setSelectedItems([]);
  };

  // ✅ Select / deselect
  const toggleItem = (index: number) => {
    setSelectedItems((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // ✅ Select all
  const handleSelectAll = () => {
    if (selectedItems.length === media.length) setSelectedItems([]);
    else setSelectedItems(media.map((_, i) => i));
  };

  // ✅ Delete
  const handleDelete = () => {
    alert(`${selectedItems.length} items deleted`);
    setSelectedItems([]);
    setIsSelectMode(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white">
      <PastorHeader showFullHeader={true} />

      {/* HERO */}
      <section
        className="relative h-[200px] sm:h-[240px] md:h-[280px] bg-cover bg-center flex flex-col justify-end px-4 sm:px-10 md:px-20 pb-5 sm:pb-8 md:pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
        <div className="relative z-10">
          <p className="text-xs text-white/80 mb-2">
            Revitalization Roadmap &gt;{" "}
            <span className="text-white font-medium">
              Church Empowerment Phase
            </span>{" "}
            &gt; Community Engagement Project &gt; Shared Media
          </p>
          <h1 className="text-3xl font-semibold">Shared Media</h1>
        </div>
      </section>

      {/* CONTENT */}
      <main className="flex-1 px-4 sm:px-8 md:px-16 py-5 sm:py-8 md:py-10 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971]">
        <div className="max-w-7xl mx-auto">
          {/* Tabs + Select */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 mb-4 sm:mb-6">
            {/* Tabs */}
            <div className="flex bg-white/10 rounded-lg overflow-hidden">
              {["Photos", "Videos"].map((tab) => (
                <button
                  key={tab}
                  onClick={() =>
                    setActiveTab(tab.toLowerCase() as "photos" | "videos")
                  }
                  className={`px-4 sm:px-5 md:px-6 py-2 text-sm font-medium transition-all ${
                    activeTab === tab.toLowerCase()
                      ? "bg-white text-[#103C8C]"
                      : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Select / Cancel */}
            {!isSelectMode ? (
              <button
                onClick={toggleSelectMode}
                className="bg-white text-[#103C8C] px-4 sm:px-5 py-[5px] sm:py-[6px] rounded-md text-sm font-medium hover:bg-gray-100"
              >
                Select
              </button>
            ) : (
              <button
                onClick={toggleSelectMode}
                className="bg-transparent border border-white px-4 sm:px-5 py-[5px] sm:py-[6px] rounded-md text-sm hover:bg-[#103C8C] hover:text-white transition"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Selected Items Bar */}
          {isSelectMode && selectedItems.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0 bg-white/10 rounded-md px-4 sm:px-6 py-2 sm:py-3 mb-4 sm:mb-6">
              <p className="text-sm font-medium">
                {selectedItems.length} Selected Item
                {selectedItems.length > 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSelectAll}
                  className="bg-white/10 hover:bg-white/20 text-white text-sm px-3 sm:px-4 py-1.5 rounded-md"
                >
                  {selectedItems.length === media.length
                    ? "Deselect All"
                    : "Select All"}
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-[#E44D4D] hover:bg-[#C93E3E] text-white text-sm px-3 sm:px-4 py-1.5 rounded-md flex items-center gap-2"
                >
                  <i className="fa-solid fa-trash"></i> Delete
                </button>
              </div>
            </div>
          )}

          {/* Media Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
            {media.map((img, index) => (
              <div
                key={index}
                onClick={() => isSelectMode && toggleItem(index)}
                className={`relative rounded-xl overflow-hidden cursor-pointer group border border-transparent hover:border-white/30 transition`}
              >
                <Image
                  src={img}
                  alt="media"
                  className="object-cover w-full h-[150px] sm:h-[160px] md:h-[180px]"
                  onClick={() => router.push(`/pastor/FacilityReview`)}
                />

                {/* Overlay for videos */}
                {activeTab === "videos" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <i className="fa-solid fa-play text-white text-xl sm:text-2xl"></i>
                  </div>
                )}

                {/* Date label */}
                {/* <div className="absolute bottom-2 left-3 text-sm font-medium">
                  20 Oct 2024
                </div> */}

                {/* Checkbox when in select mode */}
                {isSelectMode && (
                  <div
                    className={`absolute top-3 right-3 w-4 h-4 sm:w-5 sm:h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                      selectedItems.includes(index)
                        ? "bg-[#103C8C] border-[#103C8C]"
                        : "border-white"
                    }`}
                  >
                    {selectedItems.includes(index) && (
                      <i className="fa-solid fa-check text-xs text-white"></i>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
