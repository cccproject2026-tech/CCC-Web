"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import PastorFooter from "@/app/Components/PastorFooter";
import HeroBg from "../../Assets/jumpstart-hero.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { useRouter } from "next/navigation";

// sample media
import Photo1 from "../../Assets/photo1.png";
import Photo2 from "../../Assets/photo2.png";
import Photo3 from "../../Assets/photo3.png";
import Photo4 from "../../Assets/photo4.png";
import Photo5 from "../../Assets/photo5.png";
import Photo6 from "../../Assets/photo6.png";

type Tab = "photos" | "videos";

export default function SharedMedia() {
  const router = useRouter();

  // Source media (init)
  const initialPhotos = [Photo1, Photo2, Photo3, Photo4, Photo5, Photo6, Photo1, Photo2, Photo3];
  const initialVideos = [Photo3, Photo4, Photo5, Photo6, Photo1, Photo2, Photo3, Photo4, Photo5];

  // Keep mutable lists so deletions persist
  const [photos, setPhotos] = useState(initialPhotos);
  const [videos, setVideos] = useState(initialVideos);

  const [activeTab, setActiveTab] = useState<Tab>("photos");
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selected, setSelected] = useState<number[]>([]);

  // Delete UX
  const [showConfirm, setShowConfirm] = useState(false);
  const [showToast, setShowToast] = useState<{ open: boolean; msg: string }>({ open: false, msg: "" });

  const media = activeTab === "photos" ? photos : videos;

  const allSelected = useMemo(
    () => selected.length > 0 && selected.length === media.length,
    [selected, media.length]
  );

  const toggleSelectMode = () => {
    setIsSelectMode((s) => !s);
    setSelected([]);
  };

  const toggleItem = (idx: number) => {
    setSelected((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));
  };

  const handleSelectAll = () => {
    if (allSelected) setSelected([]);
    else setSelected(media.map((_, i) => i));
  };

  const requestDelete = () => {
    if (selected.length === 0) return;
    setShowConfirm(true);
  };

  const confirmDelete = () => {
    const toDelete = new Set(selected);
    if (activeTab === "photos") {
      setPhotos((p) => p.filter((_, i) => !toDelete.has(i)));
    } else {
      setVideos((v) => v.filter((_, i) => !toDelete.has(i)));
    }
    const n = selected.length;
    setSelected([]);
    setIsSelectMode(false);
    setShowConfirm(false);
    setShowToast({ open: true, msg: `${n} Item${n > 1 ? "s" : ""} Deleted` });
    setTimeout(() => setShowToast({ open: false, msg: "" }), 1600);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0F4A85] text-white">
      <PastorHeader showFullHeader />

      {/* HERO */}
      <section
        className="relative h-[280px] bg-cover bg-center flex flex-col justify-end px-20 pb-10"
        style={{ backgroundImage: `url(${HeroBg.src})` }}
      >
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10">
          <p className="text-xs text-white/80 mb-40">
            Revitalization Roadmap &gt;{" "}
            <span className="text-white font-medium">Church Empowerment Phase</span> &gt; Community
            Engagement Project &gt; Shared Media
          </p>
          <h1 className="text-3xl font-semibold">Shared Media</h1>
        </div>
      </section>

      {/* CONTENT */}
      <main className="flex-1 px-16 py-10 bg-gradient-to-b from-[#1B5F9E] to-[#0D3971]">
        <div className="max-w-7xl mx-auto">

          {/* Tabs + Select/Cancel (top-right) */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex bg-white/10 rounded-lg overflow-hidden">
              {(["photos", "videos"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => {
                    setActiveTab(tab);
                    setSelected([]);
                    setIsSelectMode(false);
                  }}
                  className={`px-6 py-2 text-sm font-medium transition-all ${
                    activeTab === tab ? "bg-white text-[#103C8C]" : "text-white/80 hover:bg-white/10"
                  }`}
                >
                  {tab === "photos" ? "Photos" : "Videos"}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              {isSelectMode ? (
                <button
                  onClick={toggleSelectMode}
                  className="bg-transparent border border-white px-5 py-[6px] rounded-md text-sm hover:bg-[#103C8C] hover:text-white transition"
                >
                  Cancel
                </button>
              ) : (
                <button
                  onClick={toggleSelectMode}
                  className="bg-white text-[#103C8C] px-5 py-[6px] rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  Select
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 pb-28">
            {media.map((img, idx) => (
              <div
                key={idx}
                className={`relative rounded-xl overflow-hidden border border-transparent hover:border-white/30 transition group`}
                onClick={() => {
                  if (isSelectMode) {
                    toggleItem(idx);
                  } else {
                    // navigate to a detail page (you can change this route)
                    router.push(`/pastor/FacilityReview`);
                  }
                }}
              >
                <Image src={img} alt="media" className="object-cover w-full h-[190px]" />

                {/* Checkbox (top-right) when selecting */}
                {isSelectMode && (
                  <div
                    className={`absolute top-3 right-3 w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center transition-all ${
                      selected.includes(idx) ? "bg-[#103C8C] border-[#103C8C]" : "border-white bg-black/20"
                    }`}
                  >
                    {selected.includes(idx) && <i className="fa-solid fa-check text-xs text-white" />}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Selected Bar (sticky) */}
      {isSelectMode && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 w-[92%] md:w-[70%] lg:w-[60%] bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-6 py-3 flex items-center justify-between z-30">
          <p className="text-sm font-medium">
            {selected.length} Selected Item{selected.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSelectAll}
              className="bg-white/10 hover:bg-white/20 text-white text-sm px-4 py-1.5 rounded-md"
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
            <button
              onClick={requestDelete}
              disabled={selected.length === 0}
              className="disabled:opacity-50 disabled:cursor-not-allowed bg-[#E44D4D] hover:bg-[#C93E3E] text-white text-sm px-4 py-1.5 rounded-md flex items-center gap-2"
            >
              <i className="fa-solid fa-trash" />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white text-[#0B1C58] rounded-2xl shadow-xl p-6">
              <div className="w-12 h-12 rounded-full bg-[#FFE9E9] flex items-center justify-center mx-auto mb-3">
                <i className="fa-solid fa-trash text-[#E44D4D]" />
              </div>
              <h3 className="text-center font-semibold text-[18px]">Are you sure want to</h3>
              <p className="text-center mt-1 text-[15px]">
                Delete <span className="font-semibold">{selected.length}</span> item
                {selected.length > 1 ? "s" : ""} ?
              </p>

              <div className="mt-5 flex items-center justify-center gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="border border-[#D1DAF5] text-[#103C8C] rounded-md px-5 py-2 text-sm hover:bg-[#F4F7FF]"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="bg-[#103C8C] text-white rounded-md px-5 py-2 text-sm hover:bg-[#0B2E72]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showToast.open && (
        <div className="fixed left-1/2 -translate-x-1/2 top-[22%] z-40">
          <div className="bg-white text-[#0B1C58] rounded-xl shadow-xl px-5 py-3 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#E9FFF1]">
              <i className="fa-solid fa-check text-[#16A34A] text-xs" />
            </span>
            <span className="text-sm font-medium">{showToast.msg}</span>
          </div>
        </div>
      )}
    </div>
  );
}
