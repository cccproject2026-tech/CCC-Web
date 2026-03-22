"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import JumpStartHero from "@/app/Components/Hero/JumpStartHero";
import SelfRevitalizationHeroBg from "@/app/Assets/self-revitalization-hero.png";
import NatureImage from "@/app/Assets/Shared Media/nature.jpeg";
import "@fortawesome/fontawesome-free/css/all.min.css";

// Helper function to convert slug to title
const slugToTitle = (slug: string): string => {
  const titleMap: { [key: string]: string } = {
    "community-engagement-project": "Community Engagement Project",
    "facility-review": "Facility Review",
    "welcome-team": "Welcome Team",
    "guest-contact-information": "Guest Contact Information",
    "community-assessment": "Community Assessment",
    "community-engagement-events": "Community Engagement Events",
    "empower-ministry-leaders": "Empower Ministry Leaders",
    "leadership-development": "Leadership Development",
  };
  return (
    titleMap[slug] ||
    slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

export default function SharedMediaPage() {
  const router = useRouter();
  const params = useParams();
  const slug = (params?.slug as string) || "";
  const [activeTab, setActiveTab] = useState<"Photos" | "Videos">("Photos");
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);

  const title = slug ? slugToTitle(slug) : "";

  // Media data using actual resources - repeated as needed
  const photos = [
    { id: 1, src: NatureImage, date: "20 Oct 2024" },
    { id: 2, src: NatureImage, date: "20 Oct 2024" },
    { id: 3, src: NatureImage, date: "20 Oct 2024" },
    { id: 4, src: NatureImage, date: "20 Oct 2024" },
    { id: 5, src: NatureImage, date: "20 Oct 2024" },
    { id: 6, src: NatureImage, date: "20 Oct 2024" },
    { id: 7, src: NatureImage, date: "20 Oct 2024" },
    { id: 8, src: NatureImage, date: "20 Oct 2024" },
    { id: 9, src: NatureImage, date: "20 Oct 2024" },
  ];

  const videos = [
    {
      id: 1,
      src: "/Assets/Shared Media/video.mp4",
      thumbnail: NatureImage,
      date: "20 Oct 2024",
    },
    {
      id: 2,
      src: "/Assets/Shared Media/video.mp4",
      thumbnail: NatureImage,
      date: "20 Oct 2024",
    },
    {
      id: 3,
      src: "/Assets/Shared Media/video.mp4",
      thumbnail: NatureImage,
      date: "20 Oct 2024",
    },
    {
      id: 4,
      src: "/Assets/Shared Media/video.mp4",
      thumbnail: NatureImage,
      date: "20 Oct 2024",
    },
    {
      id: 5,
      src: "/Assets/Shared Media/video.mp4",
      thumbnail: NatureImage,
      date: "20 Oct 2024",
    },
    {
      id: 6,
      src: "/Assets/Shared Media/video.mp4",
      thumbnail: NatureImage,
      date: "20 Oct 2024",
    },
    {
      id: 7,
      src: "/Assets/Shared Media/video.mp4",
      thumbnail: NatureImage,
      date: "20 Oct 2024",
    },
    {
      id: 8,
      src: "/Assets/Shared Media/video.mp4",
      thumbnail: NatureImage,
      date: "20 Oct 2024",
    },
    {
      id: 9,
      src: "/Assets/Shared Media/video.mp4",
      thumbnail: NatureImage,
      date: "20 Oct 2024",
    },
  ];

  const currentMedia = activeTab === "Photos" ? photos : videos;

  const toggleSelection = (id: number) => {
    if (!isSelectionMode) {
      setIsSelectionMode(true);
    }
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = () => {
    // Handle deletion logic here
    const count = selectedItems.length;
    setShowDeleteModal(false);
    setShowSuccessModal(true);
    setSelectedItems([]);
    setIsSelectionMode(false);
    setTimeout(() => setShowSuccessModal(false), 2000);
  };

  const cancelSelection = () => {
    setSelectedItems([]);
    setIsSelectionMode(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      {/* Hero Section with Breadcrumbs */}
      <JumpStartHero
        backgroundImageUrl={SelfRevitalizationHeroBg.src}
        title="Shared Media"
        breadcrumbItems={[
          {
            label: "Pastor's Roadmaps",
            href: "/director/revitalization-roadmap",
          },
          { label: "John Ross", href: "/director/revitalization-roadmap/home" },
          {
            label: "Revitalization Roadmap",
            href: "/director/revitalization-roadmap/home",
          },
          {
            label: "Church Empowerment Phase",
            href: "/director/revitalization-roadmap/home/church-empowerment",
          },
          {
            label: title,
            href: `/director/revitalization-roadmap/home/church-empowerment/${slug}`,
          },
          { label: "Shared Media" },
        ]}
        heightClasses="h-[280px]"
      />

      {/* Main Content */}
      <main className="flex-1 px-6 md:px-12 lg:px-20 py-10">
        <div className="max-w-7xl mx-auto">
          {/* Tabs and Select Button */}
          <div className="flex items-center justify-between mb-6">
            {/* Tabs */}
            <div className="flex bg-white rounded-lg p-1 shadow-md">
              <button
                onClick={() => setActiveTab("Photos")}
                className={`px-6 py-2 rounded-l-md font-semibold transition-all ${
                  activeTab === "Photos"
                    ? "bg-[#2E3B8E] text-white"
                    : "bg-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                Photos
              </button>
              <button
                onClick={() => setActiveTab("Videos")}
                className={`px-6 py-2 rounded-r-md font-semibold transition-all ${
                  activeTab === "Videos"
                    ? "bg-[#2E3B8E] text-white"
                    : "bg-transparent text-gray-600 hover:text-gray-800"
                }`}
              >
                Videos
              </button>
            </div>

            {/* Select Button - Only show when no items selected */}
            {selectedItems.length === 0 && (
              <button
                onClick={() => setIsSelectionMode(true)}
                className="bg-[#B8E6FF] border-2 border-[#2E3B8E] text-[#2E3B8E] px-4 py-2 rounded-lg font-semibold hover:bg-[#A0D9FF] transition-all flex items-center gap-2"
              >
                <i className="fa-solid fa-check-square text-[#2E3B8E]"></i>
                Select
              </button>
            )}
          </div>

          {/* Selection Bar */}
          {selectedItems.length > 0 && (
            <div className="bg-[#2E3B8E]/90 backdrop-blur-sm text-white px-6 py-4 rounded-lg mb-6 flex items-center justify-between">
              <span className="font-semibold">
                {selectedItems.length} Selected Item
                {selectedItems.length > 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (selectedItems.length === currentMedia.length) {
                      setSelectedItems([]);
                    } else {
                      setSelectedItems(currentMedia.map((item) => item.id));
                    }
                  }}
                  className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-all"
                >
                  Select All
                </button>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-all flex items-center gap-2"
                >
                  <i className="fa-solid fa-trash"></i>
                  Delete
                </button>
                <button
                  onClick={cancelSelection}
                  className="bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Media Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {currentMedia.map((item) => (
              <div
                key={item.id}
                className={`relative group ${
                  isSelectionMode || selectedItems.length > 0
                    ? "cursor-pointer"
                    : "cursor-default"
                }`}
                onClick={() => {
                  if (isSelectionMode || selectedItems.length > 0) {
                    toggleSelection(item.id);
                  }
                }}
              >
                {/* Media Container */}
                <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
                  {activeTab === "Photos" ? (
                    <Image
                      src={item.src}
                      alt={`Photo ${item.id}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center relative">
                      {playingVideo === item.id ? (
                        <video
                          src={
                            "src" in item && typeof item.src === "string"
                              ? item.src
                              : ""
                          }
                          controls
                          className="w-full h-full object-cover"
                          autoPlay
                          onEnded={() => setPlayingVideo(null)}
                        />
                      ) : (
                        <>
                          <Image
                            src={
                              "thumbnail" in item ? item.thumbnail : NatureImage
                            }
                            alt={`Video thumbnail ${item.id}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          {/* Play Button Overlay */}
                          <div
                            className="absolute inset-0 flex items-center justify-center z-10 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlayingVideo(item.id);
                            }}
                          >
                            <div className="w-16 h-16 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-all">
                              <i className="fa-solid fa-play text-[#2E3B8E] text-xl ml-1"></i>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Selection Checkbox - Top Right */}
                  {(isSelectionMode || selectedItems.length > 0) && (
                    <div
                      className={`absolute top-2 right-2 z-20 w-6 h-6 rounded flex items-center justify-center transition-all ${
                        selectedItems.includes(item.id)
                          ? "bg-[#2E3B8E]"
                          : "bg-white border-2 border-gray-300"
                      }`}
                    >
                      {selectedItems.includes(item.id) && (
                        <i className="fa-solid fa-check text-white text-xs"></i>
                      )}
                    </div>
                  )}

                  {/* Date Label - Bottom Left Overlay */}
                  <div className="absolute bottom-0 left-0 z-10 text-white text-xs px-3 py-2">
                    {item.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            {/* Trash Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 border-2 border-red-500 rounded-full flex items-center justify-center">
                <i className="fa-solid fa-trash text-red-500 text-2xl"></i>
              </div>
            </div>

            {/* Message */}
            <h3 className="text-gray-800 text-lg font-semibold text-center mb-6">
              Are you sure want to Delete {selectedItems.length} item
              {selectedItems.length > 1 ? "s" : ""} ?
            </h3>

            {/* Buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 border-2 border-[#2E3B8E] text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <i className="fa-solid fa-check text-white text-xl"></i>
              </div>
              <p className="text-gray-800 font-semibold">
                {selectedItems.length} Item{selectedItems.length > 1 ? "s" : ""}{" "}
                Deleted
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
