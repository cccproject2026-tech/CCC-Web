"use client";
import { useEffect, useState } from "react";
import DirectorHero from "../DirectorHero";
import { directorGlassCard, directorGlassCardHover, directorInputClass, directorPageRoot } from "../directorUi";
import RoadmapJumpStartBg from "../../Assets/roadmap-jump-start-bg.jpg";
import { createMedia, deleteMedia, getAllMedia, updateMedia } from "@/app/Services/media.service";

interface Video {
  _id: string;
  heading: string;
  subheading?: string;
  description?: string;
  mediaFiles?: { url: string }[];
  createdAt?: string;
}

type VideoFormState = {
  heading: string;
  subHeading: string;
  description: string;
  videoFile: File | null;
  existingVideoUrl: string | null;
};

export default function VideosPage() {
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [showEditVideoModal, setShowEditVideoModal] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteCount, setDeleteCount] = useState(0);
  const [videoForm, setVideoForm] = useState<VideoFormState>({
    heading: "",
    subHeading: "",
    description: "",
    videoFile: null,
    existingVideoUrl: null,
  });

  const [videos, setVideos] = useState<Video[]>([]);


  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await getAllMedia();
        setVideos(res.data?.data || []);
      } catch (err) {
        console.error("Failed to load videos", err);
      }
    };

    fetchVideos();
  }, []);

  const handleSelectMode = () => {
    setIsSelectMode(true);
    setOpenMenuId(null);
  };

  const handleCancelSelect = () => {
    setIsSelectMode(false);
    setSelectedVideos([]);
  };

  const handleSelectVideo = (id: string) => {
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
      setSelectedVideos(videos.map((v) => v._id));
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

  const showFormError = (message: string) => {
  setFormError(message);
  window.setTimeout(() => setFormError(null), 3000);
};


  const handleSubmit = async () => {
    if (!videoForm.heading.trim()) {
  showFormError("Heading is required.");
  return;
}

    try {
      // ---------- EDIT MODE ----------
      if (editingVideoId) {
        const payload: any = {
          heading: videoForm.heading,
          subheading: videoForm.subHeading,
          description: videoForm.description,
        };

        // only attach file if user selected new one
        if (videoForm.videoFile) {
          payload.files = [videoForm.videoFile];
        }

        await updateMedia(editingVideoId, payload);

        setShowEditVideoModal(false);
      }

      // ---------- ADD MODE ----------
      else {
       if (!videoForm.videoFile) {
  showFormError("Please upload a video file.");
  return;
}

        await createMedia({
          heading: videoForm.heading,
          subheading: videoForm.subHeading,
          description: videoForm.description,
          defaultType: "video",
          files: [videoForm.videoFile],
        });

        setShowAddVideoModal(false);
      }

      // ---------- RESET ----------
      setVideoForm({
        heading: "",
        subHeading: "",
        description: "",
        videoFile: null,
        existingVideoUrl: null,
      });

      setEditingVideoId(null);

      // refresh list
      const res = await getAllMedia();
      setVideos(res.data?.data || []);
    } catch (error) {
      console.error("Save failed", error);
      showFormError("Something went wrong. Please try again.");
    }
  };

  const handleMenuToggle = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === videoId ? null : videoId);
  };

  const handleEdit = (videoId: string) => {
    const video = videos.find((v) => v._id === videoId);
    if (video) {
      setEditingVideoId(videoId);

      setVideoForm({
        heading: video.heading,
        subHeading: video.subheading ?? "",
        description: video.description ?? "",
        videoFile: null,
        existingVideoUrl: video.mediaFiles?.[0]?.url ?? null,
      });

      setShowEditVideoModal(true);
    }

    setOpenMenuId(null);
  };


  const handleDelete = async (videoId: string) => {
    try {
      await deleteMedia(videoId);

      setVideos((prev) => prev.filter((v) => v._id !== videoId));

    } catch (err) {
      console.error("Delete failed", err);
      alert("Failed to delete video");
    }

    setOpenMenuId(null);
  };

  // Close menu when clicking outside
  const handleClickOutside = () => {
    setOpenMenuId(null);
  };

  return (
    <div className={directorPageRoot} onClick={handleClickOutside}>
      <DirectorHero
        title="Videos"
        subtitle="Upload and manage media for pastors and mentors."
        image={RoadmapJumpStartBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Videos" },
        ]}
      />

      <section className="relative flex-1 px-4 pb-12 sm:px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-[1400px]">
          <div className={`mb-8 flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5 ${directorGlassCard}`}>
            <div>
              <h2 className="text-xl font-semibold text-white sm:text-2xl">Uploaded media</h2>
              {isSelectMode && selectedVideos.length > 0 && (
                <p className="mt-1 text-sm text-white/60">
                  {selectedVideos.length} selected {selectedVideos.length === 1 ? "item" : "items"}
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {isSelectMode ? (
                <>
                  <button
                    type="button"
                    onClick={handleCancelSelect}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <i className="fa-solid fa-times"></i>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                  >
                    Select all
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteClick}
                    disabled={selectedVideos.length === 0}
                    className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                      selectedVideos.length === 0
                        ? "cursor-not-allowed border-white/10 bg-white/5 text-white/35"
                        : "border-red-400/45 bg-red-500/15 text-red-100 hover:bg-red-500/25"
                    }`}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleSelectMode}
                    className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    <i className="fa-solid fa-check-square text-[#8ec5eb]/90"></i>
                    Select
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddVideoModal(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                  >
                    <i className="fa-solid fa-plus"></i>
                    Add video
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {videos.map((video) => (
              <div
                key={video._id}
                className={`overflow-hidden rounded-2xl border border-white/12 ${directorGlassCard} ${directorGlassCardHover}`}
              >
                <div className="relative aspect-video bg-[#041f35]/80">
                  {video.mediaFiles?.[0]?.url ? (
                    <video
                      src={video.mediaFiles[0].url}
                      className="h-full w-full object-cover"
                      muted
                      playsInline
                      preload="metadata"
                    />
                  ) : (
                    <div className="h-full w-full bg-[#062946]/90" />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#8ec5eb]/25 ring-2 ring-[#8ec5eb]/50 transition hover:bg-[#8ec5eb]/35">
                      <i className="fa-solid fa-play ml-0.5 text-lg text-white"></i>
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 rounded-md bg-black/45 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                    {video.createdAt
                      ? new Date(video.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "—"}
                  </div>
                  {isSelectMode && (
                    <div
                      className="absolute left-2 top-2 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectVideo(video._id);
                      }}
                    >
                      {selectedVideos.includes(video._id) ? (
                        <div className="flex h-7 w-7 items-center justify-center rounded-md border border-[#8ec5eb]/60 bg-[#8ec5eb]/90 shadow-md">
                          <i className="fa-solid fa-check text-xs text-[#041f35]"></i>
                        </div>
                      ) : (
                        <div className="h-7 w-7 rounded-md border-2 border-white/50 bg-black/40 shadow-md backdrop-blur-sm" />
                      )}
                    </div>
                  )}
                  {!isSelectMode && (
                    <div className="absolute right-2 top-2">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => handleMenuToggle(video._id, e)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/55"
                        >
                          <i className="fa-solid fa-ellipsis-vertical text-xs"></i>
                        </button>
                        {openMenuId === video._id && (
                          <div
                            className={`absolute right-0 top-10 z-50 min-w-[150px] overflow-hidden rounded-xl py-2 ${directorGlassCard}`}
                          >
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(video._id);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-[#8ec5eb] transition hover:bg-white/10"
                            >
                              <i className="fa-regular fa-pen-to-square text-sm"></i>
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(video._id);
                              }}
                              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium text-red-200 transition hover:bg-red-500/25"
                            >
                              <i className="fa-regular fa-trash-can text-sm"></i>
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="border-t border-white/10 p-4">
                  <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[#8ec5eb]/80">{video.heading}</p>
                  <h3 className="mb-2 text-lg font-semibold text-white">{video.subheading ?? "—"}</h3>
                  <p className="line-clamp-3 text-sm leading-relaxed text-white/65">{video.description ?? ""}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className={`w-full max-w-md overflow-hidden rounded-2xl ${directorGlassCard}`}>
            <div className="p-8 text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-red-400/30 bg-red-500/15">
                  <i className="fa-solid fa-trash-can text-2xl text-red-300"></i>
                </div>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-white">
                Delete {selectedVideos.length} {selectedVideos.length === 1 ? "item" : "items"}?
              </h2>
              <p className="text-sm text-white/55">This action cannot be undone from this dialog.</p>
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="rounded-xl border border-white/25 bg-white/10 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="rounded-xl border border-red-400/45 bg-red-500/20 px-6 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/30"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDeleteToast && (
        <div
          className={`fixed left-4 top-4 z-[110] flex items-center gap-3 rounded-xl border border-[#8ec5eb]/35 px-4 py-3 shadow-xl ${directorGlassCard}`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500/25 ring-1 ring-emerald-400/40">
            <i className="fa-solid fa-check text-sm text-emerald-200"></i>
          </div>
          <span className="font-medium text-white">
            {deleteCount} {deleteCount === 1 ? "item" : "items"} removed
          </span>
        </div>
      )}

      {showAddVideoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl ${directorGlassCard}`}>
            <div className="relative border-b border-white/10 px-6 py-5 sm:px-8">
              <button
                type="button"
                onClick={() => {
                  setShowAddVideoModal(false);
                  setVideoForm({
                    heading: "",
                    subHeading: "",
                    description: "",
                    videoFile: null,
                    existingVideoUrl: null,
                  });
                }}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <i className="fa-solid fa-times text-lg"></i>
              </button>
              <h2 className="pr-12 text-2xl font-semibold text-white">Add video</h2>
              <p className="mt-1 text-sm text-white/55">Upload a file and add titles for pastors and mentors.</p>
            </div>

            <div className="space-y-5 p-6 sm:p-8">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/85">Heading</label>
                <input
                  type="text"
                  value={videoForm.heading}
                  onChange={(e) => setVideoForm({ ...videoForm, heading: e.target.value })}
                  placeholder="Enter heading"
                  className={directorInputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/85">Sub heading</label>
                <input
                  type="text"
                  value={videoForm.subHeading}
                  onChange={(e) => setVideoForm({ ...videoForm, subHeading: e.target.value })}
                  placeholder="Enter sub heading"
                  className={directorInputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/85">Description</label>
                <textarea
                  value={videoForm.description}
                  onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                  placeholder="Enter description"
                  rows={4}
                  className={`${directorInputClass} resize-none`}
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/85">
                  <i className="fa-solid fa-cloud-arrow-up text-[#8ec5eb]"></i>
                  Upload video
                </label>
                <div className="relative cursor-pointer rounded-xl border-2 border-dashed border-white/20 bg-white/[0.04] p-10 text-center transition hover:border-[#8ec5eb]/40">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <div className="space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#8ec5eb]/15 ring-1 ring-[#8ec5eb]/30">
                      <i className="fa-solid fa-plus text-xl text-[#8ec5eb]"></i>
                    </div>
                    <p className="font-medium text-white">Drag and drop or click to choose a file</p>
                    <p className="flex items-center justify-center gap-1 text-sm text-white/45">
                      Max file size 1 GB
                      <i className="fa-solid fa-circle-info text-white/35"></i>
                    </p>
                  </div>
                  {videoForm.videoFile ? (
                    <p className="mt-4 text-sm font-medium text-[#8ec5eb]">Selected: {videoForm.videoFile.name}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-xl border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEditVideoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className={`max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl ${directorGlassCard}`}>
            <div className="relative border-b border-white/10 px-6 py-5 sm:px-8">
              <button
                type="button"
                onClick={() => {
                  setShowEditVideoModal(false);
                  setEditingVideoId(null);
                  setVideoForm({
                    heading: "",
                    subHeading: "",
                    description: "",
                    videoFile: null,
                    existingVideoUrl: null,
                  });
                }}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                <i className="fa-solid fa-times text-lg"></i>
              </button>
              <h2 className="pr-12 text-2xl font-semibold text-white">Edit video</h2>
              <p className="mt-1 text-sm text-white/55">Update metadata or replace the file.</p>
            </div>

            <div className="space-y-5 p-6 sm:p-8">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/85">Heading</label>
                <input
                  type="text"
                  value={videoForm.heading}
                  onChange={(e) => setVideoForm({ ...videoForm, heading: e.target.value })}
                  placeholder="Enter heading"
                  className={directorInputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/85">Sub heading</label>
                <input
                  type="text"
                  value={videoForm.subHeading}
                  onChange={(e) => setVideoForm({ ...videoForm, subHeading: e.target.value })}
                  placeholder="Enter sub heading"
                  className={directorInputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/85">Description</label>
                <textarea
                  value={videoForm.description}
                  onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                  placeholder="Enter description"
                  rows={4}
                  className={`${directorInputClass} resize-none`}
                />
              </div>

              <div>
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-white/85">
                  <i className="fa-solid fa-cloud-arrow-up text-[#8ec5eb]"></i>
                  Replace video (optional)
                </label>
                <div className="relative cursor-pointer rounded-xl border-2 border-dashed border-white/20 bg-white/[0.04] p-10 text-center transition hover:border-[#8ec5eb]/40">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <div className="space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#8ec5eb]/15 ring-1 ring-[#8ec5eb]/30">
                      <i className="fa-solid fa-plus text-xl text-[#8ec5eb]"></i>
                    </div>
                    <p className="font-medium text-white">Drag and drop or click to choose a new file</p>
                    <p className="text-sm text-white/45">Max file size 1 GB</p>
                  </div>
                  {videoForm.videoFile ? (
                    <p className="mt-4 text-sm font-medium text-[#8ec5eb]">Selected: {videoForm.videoFile.name}</p>
                  ) : null}
                  {!videoForm.videoFile && videoForm.existingVideoUrl ? (
                    <p className="mt-4 text-sm text-white/55">Current file is kept unless you choose a new one.</p>
                  ) : null}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-xl border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {formError && (
  <div className="fixed left-1/2 top-24 z-[999] w-[min(92vw,420px)] -translate-x-1/2 rounded-2xl border border-red-400/30 bg-[#062946]/95 p-4 shadow-2xl backdrop-blur-md">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-200">
        <i className="fa-solid fa-circle-exclamation" />
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-white">
          Cannot upload video
        </h3>
        <p className="mt-1 text-sm text-white/70">{formError}</p>
      </div>

      <button
        type="button"
        onClick={() => setFormError(null)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 transition hover:bg-white/10 hover:text-white"
        aria-label="Close error"
      >
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
  </div>
)}
    </div>
  );
}

