"use client";
import { useState } from "react";
import Image from "next/image";
import AppHero from "@/app/Components/Hero/AppHero";
import AppFooter from "@/app/Components/AppFooter";
import RoadmapJumpStartBg from "../../Assets/roadmap-jump-start-bg.jpg";
import Card1 from "../../Assets/card1.png";
import Card2 from "../../Assets/card2.png";
import Card3 from "../../Assets/card3.png";
import Card4 from "../../Assets/card4.png";
import Card5 from "../../Assets/card5.png";
import Card6 from "../../Assets/card6.png";

interface Video {
  id: number;
  heading: string;
  subHeading: string;
  description: string;
  thumbnail: any;
  date: string;
}

export default function VideosPage() {
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [showEditVideoModal, setShowEditVideoModal] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<number | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<number[]>([]);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [deleteCount, setDeleteCount] = useState(0);
  const [videoForm, setVideoForm] = useState({
    heading: "",
    subHeading: "",
    description: "",
    videoFile: null as File | null,
  });

  const videos: Video[] = [
    {
      id: 1,
      heading: "Introduction",
      subHeading: "Center for Community Change",
      description: "Interested in receiving mentoring in community engagement",
      thumbnail: Card1,
      date: "20 Oct 2024",
    },
    {
      id: 2,
      heading: "Introduction",
      subHeading: "Center for Community Change",
      description: "Interested in receiving mentoring in community engagement",
      thumbnail: Card2,
      date: "20 Oct 2024",
    },
    {
      id: 3,
      heading: "Introduction",
      subHeading: "Center for Community Change",
      description: "Interested in receiving mentoring in community engagement",
      thumbnail: Card3,
      date: "20 Oct 2024",
    },
    {
      id: 4,
      heading: "Introduction",
      subHeading: "Center for Community Change",
      description: "Interested in receiving mentoring in community engagement",
      thumbnail: Card4,
      date: "20 Oct 2024",
    },
    {
      id: 5,
      heading: "Introduction",
      subHeading: "Center for Community Change",
      description: "Interested in receiving mentoring in community engagement",
      thumbnail: Card5,
      date: "20 Oct 2024",
    },
    {
      id: 6,
      heading: "Introduction",
      subHeading: "Center for Community Change",
      description: "Interested in receiving mentoring in community engagement",
      thumbnail: Card6,
      date: "20 Oct 2024",
    },
  ];

  const handleSelectMode = () => {
    setIsSelectMode(true);
    setOpenMenuId(null);
  };

  const handleCancelSelect = () => {
    setIsSelectMode(false);
    setSelectedVideos([]);
  };

  const handleSelectVideo = (id: number) => {
    if (selectedVideos.includes(id)) {
      setSelectedVideos(selectedVideos.filter((v) => v !== id));
    } else {
      setSelectedVideos([...selectedVideos, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedVideos.length === videos.length) {
      setSelectedVideos([]);
    } else {
      setSelectedVideos(videos.map((v) => v.id));
    }
  };

  const handleDeleteClick = () => {
    if (selectedVideos.length > 0) {
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = () => {
    const count = selectedVideos.length;
    // Remove selected videos from the list
    // In a real app, this would make an API call
    setDeleteCount(count);
    setSelectedVideos([]);
    setIsSelectMode(false);
    setShowDeleteModal(false);
    setShowDeleteToast(true);
    
    // Hide toast after 3 seconds
    setTimeout(() => {
      setShowDeleteToast(false);
    }, 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVideoForm({ ...videoForm, videoFile: e.target.files[0] });
    }
  };

  const handleSubmit = () => {
    if (editingVideoId) {
      // Handle video update
      console.log("Updating video:", editingVideoId, videoForm);
      setShowEditVideoModal(false);
      setEditingVideoId(null);
    } else {
      // Handle video upload
      console.log("Uploading video:", videoForm);
      setShowAddVideoModal(false);
    }
    setVideoForm({
      heading: "",
      subHeading: "",
      description: "",
      videoFile: null,
    });
  };

  const handleMenuToggle = (videoId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === videoId ? null : videoId);
  };

  const handleEdit = (videoId: number) => {
    const video = videos.find((v) => v.id === videoId);
    if (video) {
      setEditingVideoId(videoId);
      setVideoForm({
        heading: video.heading,
        subHeading: video.subHeading,
        description: video.description,
        videoFile: null, // Keep existing video, don't reset file
      });
      setShowEditVideoModal(true);
    }
    setOpenMenuId(null);
  };

  const handleDelete = (videoId: number) => {
    console.log("Delete video:", videoId);
    setOpenMenuId(null);
    // Add delete functionality here
  };

  // Close menu when clicking outside
  const handleClickOutside = () => {
    setOpenMenuId(null);
  };

  return (
    <div
      className="min-h-screen flex flex-col bg-gradient-to-b from-[#1A2E5C] to-[#2E3B8E]"
      onClick={handleClickOutside}
    >
      {/* Hero Section */}
      <AppHero
        title="Videos"
        backgroundImageUrl={RoadmapJumpStartBg.src}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Videos" },
        ]}
      />

      {/* Main Content */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-12 bg-[#b0d0e4]">
        <div className="max-w-[1400px] mx-auto">
          {/* Uploaded Media Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Uploaded Media</h2>
              {isSelectMode && selectedVideos.length > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {selectedVideos.length} Selected {selectedVideos.length === 1 ? "Item" : "Items"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {isSelectMode ? (
                <>
                  <button
                    onClick={handleCancelSelect}
                    className="bg-[#1E366F] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#1a2f5a] transition-colors shadow-sm flex items-center gap-2"
                  >
                    <i className="fa-solid fa-times"></i>
                    Cancel
                  </button>
                  <button
                    onClick={handleSelectAll}
                    className="bg-white text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm border border-gray-300"
                  >
                    Select All
                  </button>
                  <button
                    onClick={handleDeleteClick}
                    disabled={selectedVideos.length === 0}
                    className={`text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm ${
                      selectedVideos.length === 0
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-red-600 text-white hover:bg-red-700"
                    }`}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSelectMode}
                    className="bg-white text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <i className="fa-solid fa-check-square text-gray-700"></i>
                    Select
                  </button>
                  <button
                    onClick={() => setShowAddVideoModal(true)}
                    className="bg-white text-gray-900 text-sm font-semibold px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                  >
                    <i className="fa-solid fa-plus text-gray-700"></i>
                    Add Video
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => (
              <div
                key={video.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all"
              >
                {/* Thumbnail with Play Button */}
                <div className="relative aspect-video bg-gray-200">
                  <Image
                    src={video.thumbnail}
                    alt={video.subHeading}
                    fill
                    className="object-cover"
                  />
                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all cursor-pointer">
                      <i className="fa-solid fa-play text-gray-900 text-xl ml-1"></i>
                    </div>
                  </div>
                  {/* Date - Transparent Background */}
                  <div className="absolute bottom-2 left-2 text-white text-xs font-medium">
                    {video.date}
                  </div>
                  {/* Selection Checkbox - Only show in select mode */}
                  {isSelectMode && (
                    <div
                      className="absolute top-2 left-2 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectVideo(video.id);
                      }}
                    >
                      {selectedVideos.includes(video.id) ? (
                        <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center shadow-md">
                          <i className="fa-solid fa-check text-white text-xs"></i>
                        </div>
                      ) : (
                        <div className="w-6 h-6 bg-white rounded border-2 border-gray-300 flex items-center justify-center shadow-md"></div>
                      )}
                    </div>
                  )}
                  {/* Options Menu - Three Dots - Only show when not in select mode */}
                  {!isSelectMode && (
                    <div className="absolute top-2 right-2">
                      <div className="relative">
                        <button
                          onClick={(e) => handleMenuToggle(video.id, e)}
                          className="w-8 h-8 bg-white rounded-md flex items-center justify-center hover:bg-gray-100 transition-all shadow-sm"
                        >
                          <i className="fa-solid fa-ellipsis-vertical text-blue-600 text-xs"></i>
                        </button>
                        {/* Dropdown Menu */}
                        {openMenuId === video.id && (
                          <div className="absolute top-10 right-0 bg-white rounded-lg shadow-xl py-2 min-w-[140px] z-50 border border-gray-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(video.id);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                              <i className="fa-regular fa-pen-to-square text-blue-600 text-sm"></i>
                              <span className="text-blue-600 text-sm font-medium">Edit</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(video.id);
                              }}
                              className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
                            >
                              <i className="fa-regular fa-trash-can text-red-600 text-sm"></i>
                              <span className="text-red-600 text-sm font-medium">Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Video Info */}
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-1">{video.heading}</p>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    {video.subHeading}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {video.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AppFooter />

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl border border-gray-200 overflow-hidden">
            <div className="p-8 text-center">
              {/* Trash Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-trash-can text-red-400 text-3xl"></i>
                </div>
              </div>
              {/* Message */}
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                Are you sure want to Delete {selectedVideos.length} {selectedVideos.length === 1 ? "item" : "items"} ?
              </h2>
              {/* Buttons */}
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2.5 bg-white border border-[#1E366F] text-[#1E366F] rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-6 py-2.5 bg-[#1E366F] text-white rounded-lg text-sm font-semibold hover:bg-[#1a2f5a] transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Success Toast */}
      {showDeleteToast && (
        <div className="fixed top-4 left-4 z-[110] bg-gray-100 rounded-lg shadow-xl px-4 py-3 flex items-center gap-3 animate-slide-in">
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-check text-white text-sm"></i>
          </div>
          <span className="text-gray-900 font-medium">
            {deleteCount} {deleteCount === 1 ? "Item" : "Items"} Deleted
          </span>
        </div>
      )}

      {/* Add Video Modal */}
      {showAddVideoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header - Blue Background */}
            <div className="bg-gradient-to-r from-[#1E366F] to-[#2E3B8E] px-8 py-6 relative">
              <button
                onClick={() => setShowAddVideoModal(false)}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
              >
                <i className="fa-solid fa-times text-white text-lg"></i>
              </button>
              <h2 className="text-white text-3xl font-bold">Add Video</h2>
            </div>

            {/* Content - White Background */}
            <div className="p-8">
              {/* Heading */}
              <div className="mb-6">
                <label className="block text-gray-900 font-semibold mb-2">
                  Heading
                </label>
                <input
                  type="text"
                  value={videoForm.heading}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, heading: e.target.value })
                  }
                  placeholder="Enter Heading"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:border-[#2E3B8E]"
                />
              </div>

              {/* Sub Heading */}
              <div className="mb-6">
                <label className="block text-gray-900 font-semibold mb-2">
                  Sub Heading
                </label>
                <input
                  type="text"
                  value={videoForm.subHeading}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, subHeading: e.target.value })
                  }
                  placeholder="Enter Sub Heading"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:border-[#2E3B8E]"
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-gray-900 font-semibold mb-2">
                  Description
                </label>
                <textarea
                  value={videoForm.description}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, description: e.target.value })
                  }
                  placeholder="Enter Description"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:border-[#2E3B8E] resize-none"
                />
              </div>

              {/* Video Upload */}
              <div className="mb-6">
                <label className="block text-gray-900 font-semibold mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-cloud-upload text-gray-700"></i>
                  Upload Video
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#2E3B8E] transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <i className="fa-solid fa-plus text-gray-600 text-2xl"></i>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">
                        Drag & Drop or Click here to choose file
                      </p>
                      <p className="text-gray-500 text-sm mt-2 flex items-center justify-center gap-1">
                        Max file size : 1 GB
                        <i className="fa-solid fa-circle-info text-gray-400"></i>
                      </p>
                    </div>
                  </div>
                  {videoForm.videoFile && (
                    <p className="text-sm text-[#2E3B8E] mt-4 font-medium">
                      Selected: {videoForm.videoFile.name}
                    </p>
                  )}
                </div>
              </div>

              {/* Upload Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  className="bg-[#1E366F] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#1a2f5a] transition-colors"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {showEditVideoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl max-w-2xl w-full shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header - Blue Background */}
            <div className="bg-gradient-to-r from-[#1E366F] to-[#2E3B8E] px-8 py-6 relative">
              <button
                onClick={() => {
                  setShowEditVideoModal(false);
                  setEditingVideoId(null);
                  setVideoForm({
                    heading: "",
                    subHeading: "",
                    description: "",
                    videoFile: null,
                  });
                }}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
              >
                <i className="fa-solid fa-times text-white text-lg"></i>
              </button>
              <h2 className="text-white text-3xl font-bold">Edit Video</h2>
            </div>

            {/* Content - White Background */}
            <div className="p-8">
              {/* Heading */}
              <div className="mb-6">
                <label className="block text-gray-900 font-semibold mb-2">
                  Heading
                </label>
                <input
                  type="text"
                  value={videoForm.heading}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, heading: e.target.value })
                  }
                  placeholder="Enter Heading"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:border-[#2E3B8E]"
                />
              </div>

              {/* Sub Heading */}
              <div className="mb-6">
                <label className="block text-gray-900 font-semibold mb-2">
                  Sub Heading
                </label>
                <input
                  type="text"
                  value={videoForm.subHeading}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, subHeading: e.target.value })
                  }
                  placeholder="Enter Sub Heading"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:border-[#2E3B8E]"
                />
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block text-gray-900 font-semibold mb-2">
                  Description
                </label>
                <textarea
                  value={videoForm.description}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, description: e.target.value })
                  }
                  placeholder="Enter Description"
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-gray-900 bg-white focus:outline-none focus:border-[#2E3B8E] resize-none"
                />
              </div>

              {/* Video Upload */}
              <div className="mb-6">
                <label className="block text-gray-900 font-semibold mb-2 flex items-center gap-2">
                  <i className="fa-solid fa-cloud-upload text-gray-700"></i>
                  Upload Video
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#2E3B8E] transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                      <i className="fa-solid fa-plus text-gray-600 text-2xl"></i>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">
                        Drag & Drop or Click here to choose file
                      </p>
                      <p className="text-gray-500 text-sm mt-2 flex items-center justify-center gap-1">
                        Max file size : 1 GB
                        <i className="fa-solid fa-circle-info text-gray-400"></i>
                      </p>
                    </div>
                  </div>
                  {videoForm.videoFile && (
                    <p className="text-sm text-[#2E3B8E] mt-4 font-medium">
                      Selected: {videoForm.videoFile.name}
                    </p>
                  )}
                  {!videoForm.videoFile && editingVideoId && (
                    <p className="text-sm text-gray-500 mt-4 font-medium">
                      Current video will be kept if no new file is selected
                    </p>
                  )}
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  className="bg-[#1E366F] text-white text-sm font-semibold px-6 py-3 rounded-lg hover:bg-[#1a2f5a] transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

