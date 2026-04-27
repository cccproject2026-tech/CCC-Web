import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import AssignRoadmapModal from "./AssignRoadmapModal";
import { directorGlassCard } from "@/app/director/directorUi";

function roadmapIdToString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "object" && v !== null && "$oid" in v) {
    return String((v as { $oid: string }).$oid);
  }
  return String(v).trim();
}

interface RoadmapCardProps {
  id?: string;
  img: any;
  title: string;
  description: string;
  completionTime: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
  /** Director shell: glass + #8ec5eb accents */
  variant?: "default" | "directorGlass";
}

export default function RoadmapCard({
  id,
  img,
  title,
  description,
  completionTime,
  onView,
  onEdit,
  onDelete,
  variant = "default",
}: RoadmapCardProps) {
  const glass = variant === "directorGlass";
  const [showMenu, setShowMenu] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleDeleteClick = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowMenu(false);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await onDelete?.();
      setShowDeleteConfirm(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } finally {
      setDeleting(false);
    }
  };

  const openRoadmap = () => {
    onView?.();
  };

  const assignRid = roadmapIdToString(id);
  const assignRoadmapIds = assignRid ? [assignRid] : [];

  return (
    <>
      <div
        role={onView ? "button" : undefined}
        tabIndex={onView ? 0 : undefined}
        aria-label={onView ? `Open roadmap: ${title}` : undefined}
        onClick={onView ? openRoadmap : undefined}
        onKeyDown={
          onView
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openRoadmap();
                }
              }
            : undefined
        }
        className={`flex overflow-hidden rounded-2xl transition-all ${
          glass
            ? `${directorGlassCard} border-white/15 hover:border-[#8ec5eb]/25`
            : "border border-[#E5EAF1] bg-white shadow-[0_2px_6px_rgba(0,0,0,0.05)] hover:shadow-md"
        } ${onView ? `cursor-pointer focus:outline-none focus:ring-2 ${glass ? "focus:ring-[#8ec5eb]/35" : "focus:ring-[#2E3B8E]/40"}` : ""}`}
      >
        {/* Left Image Section */}
        <div
          className={`relative m-3 h-[200px] w-[42%] shrink-0 overflow-hidden rounded-l-2xl ${
            glass ? "ring-1 ring-white/10" : ""
          }`}
        >
          <Image src={img} alt={title} fill className="object-cover" />
        </div>

        {/* Right Content Section */}
        <div className="relative flex flex-1 flex-col justify-between px-5 py-4">
          {/* 3-dot menu */}
          <div className="absolute right-5 top-4" ref={menuRef}>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu((p) => !p);
              }}
              className={
                glass
                  ? "text-[#8ec5eb] transition-all hover:text-white"
                  : "text-[#214080] transition-all hover:text-[#1F2A6E]"
              }
            >
              <i className="fa-solid fa-ellipsis-vertical text-lg"></i>
            </button>

            {showMenu && (
              <div
                className={`absolute top-7 right-0 z-50 min-w-[140px] overflow-hidden rounded-xl border shadow-lg ${
                  glass
                    ? "border-white/15 bg-[#041f35]/95 backdrop-blur-xl"
                    : "border border-gray-200 bg-white"
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    setShowAssignModal(true);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition text-left ${
                    glass
                      ? "text-white/90 hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <i className={`fa-solid fa-share-nodes text-xs w-4 ${glass ? "text-[#8ec5eb]" : "text-[#2E3B8E]"}`}></i>
                  Assign
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onEdit?.();
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition text-left ${
                    glass
                      ? "text-white/90 hover:bg-white/10"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <i className={`fa-solid fa-pen text-xs w-4 ${glass ? "text-[#8ec5eb]" : "text-[#2E3B8E]"}`}></i>
                  Edit
                </button>
                <button
                  onClick={handleDeleteClick}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition text-left ${
                    glass ? "text-red-300 hover:bg-red-500/15" : "text-red-500 hover:bg-red-50"
                  }`}
                >
                  <i className="fa-solid fa-trash text-xs w-4"></i>
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="pt-6 flex flex-col h-full justify-between">
            <div>
              <h3 className={`text-[17px] font-bold mb-2 ${glass ? "text-white" : "text-black"}`}>{title}</h3>
              <p className={`text-[14px] leading-relaxed mb-4 ${glass ? "text-white/70" : "text-[#808080]"}`}>
                {description}
              </p>
              <div className="mb-4">
                <p className={`text-[14px] font-bold mb-1 ${glass ? "text-white/90" : "text-black"}`}>
                  Completion Time
                </p>
                <p className={`text-[14px] ${glass ? "text-white/60" : "text-[#808080]"}`}>{completionTime}</p>
              </div>
            </div>
            {onView && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView();
                  }}
                  className={
                    glass
                      ? "rounded-lg border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 px-5 py-2 text-[14px] font-semibold text-white transition-all hover:bg-[#8ec5eb]/30"
                      : "rounded-lg bg-[#2E3B8E] px-5 py-2 text-[14px] font-semibold text-white transition-all hover:bg-[#1F2A6E]"
                  }
                >
                  View
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Assign Roadmap Modal */}
      <AssignRoadmapModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        roadmapIds={assignRoadmapIds}
        roadmapName={title}
        onSuccess={() => setShowAssignModal(false)}
      />

      {/* Delete Confirmation Popup */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-[360px] mx-4 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full border-2 border-red-200 flex items-center justify-center mb-4">
              <i className="fa-solid fa-trash text-red-500 text-xl"></i>
            </div>
            <p className="text-[#2E3B8E] font-semibold text-base leading-snug mb-6">
              Are you sure want to<br />Delete {title}?
            </p>
            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-[#2E3B8E] text-white text-sm font-semibold hover:bg-[#1F2A6E] transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleting && <i className="fa-solid fa-spinner animate-spin text-xs"></i>}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-6 left-6 z-50 bg-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
            <i className="fa-solid fa-check text-white text-sm"></i>
          </div>
          <span className="text-gray-800 font-semibold text-sm">1 Item Deleted</span>
        </div>
      )}
    </>
  );
}
