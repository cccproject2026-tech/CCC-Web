import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import AssignRoadmapModal from "./AssignRoadmapModal";

interface RoadmapCardProps {
  id?: string;
  img: any;
  title: string;
  description: string;
  completionTime: string;
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => Promise<void>;
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
}: RoadmapCardProps) {
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

  const handleDeleteClick = () => {
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

  return (
    <>
      <div className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.05)] border border-[#E5EAF1] flex overflow-hidden hover:shadow-md transition-all">
        {/* Left Image Section */}
        <div className="relative w-[42%] h-[200px] shrink-0 m-3 rounded-l-2xl overflow-hidden">
          <Image src={img} alt={title} fill className="object-cover" />
        </div>

        {/* Right Content Section */}
        <div className="flex flex-col justify-between flex-1 px-5 py-4 relative">
          {/* 3-dot menu */}
          <div className="absolute top-4 right-5" ref={menuRef}>
            <button
              onClick={() => setShowMenu((p) => !p)}
              className="text-[#214080] hover:text-[#1F2A6E] transition-all"
            >
              <i className="fa-solid fa-ellipsis-vertical text-lg"></i>
            </button>

            {showMenu && (
              <div className="absolute top-7 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 min-w-[140px] overflow-hidden">
                <button
                  onClick={() => { setShowMenu(false); setShowAssignModal(true); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                >
                  <i className="fa-solid fa-share-nodes text-[#2E3B8E] text-xs w-4"></i>
                  Assign
                </button>
                <button
                  onClick={() => { setShowMenu(false); onEdit?.(); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition text-left"
                >
                  <i className="fa-solid fa-pen text-[#2E3B8E] text-xs w-4"></i>
                  Edit
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition text-left"
                >
                  <i className="fa-solid fa-trash text-red-500 text-xs w-4"></i>
                  Delete
                </button>
              </div>
            )}
          </div>

          <div className="pt-6 flex flex-col h-full justify-between">
            <div>
              <h3 className="text-[17px] font-bold text-black mb-2">{title}</h3>
              <p className="text-[14px] text-[#808080] leading-relaxed mb-4">{description}</p>
              <div className="mb-4">
                <p className="text-[14px] font-bold text-black mb-1">Completion Time</p>
                <p className="text-[14px] text-[#808080]">{completionTime}</p>
              </div>
            </div>
            {onView && (
              <div className="flex justify-end">
                <button
                  onClick={onView}
                  className="px-5 py-2 bg-[#2E3B8E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#1F2A6E] transition-all"
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
        roadmapIds={id ? [id] : []}
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
