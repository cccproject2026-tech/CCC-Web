"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DirectorHero from "../DirectorHero";
import {
  directorGlassCard,
  directorInputClass,
  directorPageRoot,
} from "../directorUi";
import AssignmentCard from "@/app/Components/AssignmentCard";
import AssignRoadmapModal from "@/app/Components/AssignRoadmapModal";
import ConfirmModal from "@/app/Components/ConfirmModal";
import MentorBg from "../../Assets/mentor-bg.png";
import Card1 from "../../Assets/card1.png";
import { apiGetRoadmaps, apiDeleteRoadmap } from "@/app/Services/api";

export default function PastorAssignmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assignUserId = searchParams.get("assignUser");
  const [searchQuery, setSearchQuery] = useState("");
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedAssignments, setSelectedAssignments] = useState([]);

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      const res = await apiGetRoadmaps();
      const data = res.data?.data || [];
      setRoadmaps(
        data.map((item) => ({
          id: item._id,
          title: item.name,
          description: item.description || item.roadMapDetails || "No description",
          image: item.imageUrl || Card1,
        }))
      );
    } catch (err) {
      console.error("Error fetching roadmaps:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionsClick = (id) => {
    setSelectedAssignment([id]);
    setShowAssignModal(true);
  };

  const handleDeleteClick = () => {
    if (selectedAssignments.length > 0) {
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await Promise.all(selectedAssignments.map((id) => apiDeleteRoadmap(id)));
      setRoadmaps((prev) => prev.filter((r) => !selectedAssignments.includes(r.id)));
      setToast(
        `Deleted ${selectedAssignments.length} roadmap${selectedAssignments.length > 1 ? "s" : ""} successfully`
      );
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error("Error deleting roadmaps:", err);
    } finally {
      setShowDeleteModal(false);
      setSelectedAssignments([]);
      setIsSelectionMode(false);
    }
  };

  const handleAssignComplete = () => {
    setToast("Assigned Successfully");
    setTimeout(() => setToast(null), 2000);
    setShowAssignModal(false);
    setSelectedAssignments([]);
    setIsSelectionMode(false);
    fetchRoadmaps();
  };

  const toggleSelection = (id) => {
    setSelectedAssignments((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedAssignments.length === roadmaps.length) {
      setSelectedAssignments([]);
    } else {
      setSelectedAssignments(roadmaps.map((r) => r.id));
    }
  };

  const exitSelection = () => {
    setIsSelectionMode(false);
    setSelectedAssignments([]);
  };

  const handleAssignedToClick = () => {
    if (selectedAssignments.length > 0) {
      setSelectedAssignment(selectedAssignments);
      setShowAssignModal(true);
    }
  };

  const filtered = roadmaps.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Roadmap"
        subtitle="Create, assign, and manage revitalization roadmaps for pastors."
        image={MentorBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Roadmap" },
        ]}
      />

      <section className="relative py-6 md:py-8">
        <div className="mx-auto max-w-[1400px]">
          {/* Search Bar and Action Buttons */}
          <div
            className={`mb-8 flex flex-col items-stretch justify-between gap-4 p-5 sm:flex-row sm:items-center ${directorGlassCard}`}
          >
            <div className="relative w-full flex-1 sm:max-w-md">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-[#8ec5eb]/70" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search roadmaps…"
                className={`${directorInputClass} pl-11 text-[15px]`}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              {!isSelectionMode ? (
                <>
                  <button
                    type="button"
                    onClick={() => setIsSelectionMode(true)}
                    className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-[15px] font-semibold text-white shadow-md transition hover:bg-white/15"
                  >
                    <i className="fa-regular fa-square-check" />
                    <span>Select</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      router.push("/director/pastor-assignments/create")
                    }
                    className="flex items-center gap-2 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-6 py-3 text-[15px] font-semibold text-white shadow-md transition hover:bg-[#8ec5eb]/25"
                  >
                    <i className="fa-solid fa-plus" />
                    <span>Add</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={exitSelection}
                  className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-[15px] font-semibold text-white/90 transition hover:bg-white/15"
                >
                  <i className="fa-solid fa-xmark" />
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>

          {/* Selection Mode Bar */}
          {isSelectionMode && selectedAssignments.length > 0 && (
            <div
              className={`mb-6 flex flex-wrap items-center justify-between gap-4 p-5 ${directorGlassCard}`}
            >
              <span className="text-[15px] font-semibold text-white">
                {selectedAssignments.length} selected
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={selectAll}
                  className="rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-[14px] font-semibold text-[#8ec5eb] transition hover:bg-white/15"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleAssignedToClick}
                  className="rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-5 py-2 text-[14px] font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                >
                  Assigned to
                </button>
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className="rounded-lg border border-red-400/40 bg-red-500/15 px-4 py-2 text-[14px] font-semibold text-red-200 transition hover:bg-red-500/25"
                >
                  <i className="fa-solid fa-trash" />
                </button>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[#8ec5eb]" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-16 text-center text-white/70">No roadmaps found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {filtered.map((roadmap) => (
                <AssignmentCard
                  key={roadmap.id}
                  id={roadmap.id}
                  title={roadmap.title}
                  description={roadmap.description}
                  image={roadmap.image}
                  variant="glass"
                  onView={() =>
                    router.push(
                      `/director/pastor-assignments/roadmap/${roadmap.id}`
                    )
                  }
                  onOptionsClick={handleOptionsClick}
                  isSelected={selectedAssignments.includes(roadmap.id)}
                  onSelect={toggleSelection}
                  showCheckbox={isSelectionMode}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-fade-in">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 border border-gray-100">
            <i className="fa-solid fa-circle-check text-green-500 text-xl"></i>
            <span className="text-[#2E3B8E] font-semibold text-[15px]">{toast}</span>
          </div>
        </div>
      )}

      {/* Assign Roadmap Modal */}
      <AssignRoadmapModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        roadmapIds={Array.isArray(selectedAssignment) ? selectedAssignment : selectedAssignment ? [selectedAssignment] : []}
        roadmapName={
          Array.isArray(selectedAssignment)
            ? `${selectedAssignment.length} Roadmap${selectedAssignment.length > 1 ? "s" : ""}`
            : roadmaps.find((r) => r.id === selectedAssignment)?.title || ""
        }
        onSuccess={handleAssignComplete}
        initialUserId={assignUserId || undefined}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${selectedAssignments.length} Roadmap${selectedAssignments.length > 1 ? "s" : ""}?`}
        message={`Are you sure you want to delete ${selectedAssignments.length} roadmap${selectedAssignments.length > 1 ? "s" : ""}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="bg-red-600 hover:bg-red-700"
        icon="fa-solid fa-trash"
        iconColor="text-red-500 bg-red-100"
      />
    </div>
  );
}
