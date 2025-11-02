"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AppHero from "@/app/Components/Hero/AppHero";
import AppFooter from "@/app/Components/AppFooter";
import AssignmentCard from "@/app/Components/AssignmentCard";
import AssignMenteesModal from "@/app/Components/AssignMenteesModal";
import ConfirmModal from "@/app/Components/ConfirmModal";
import MentorBg from "../../Assets/mentor-bg.png";
import PhaseImg from "../../Assets/phase-img.png";
import Card1 from "../../Assets/card1.png";
import Card2 from "../../Assets/card2.png";
import Card3 from "../../Assets/card3.png";
import Card4 from "../../Assets/card4.png";

const ASSIGNMENTS = [
  {
    id: 1,
    title: "Prayer and Visitation Strategy",
    description: "Finalize the teams vision for the church",
    image: PhaseImg,
  },
  {
    id: 2,
    title: "Calendar",
    description:
      "Finalize a vision team meeting schedule through the end of the year",
    image: Card1,
  },
  {
    id: 3,
    title: "Prayer",
    description:
      "Prioritize church prayer times and meet consistently for prayer with your congregation",
    image: Card2,
  },
  {
    id: 4,
    title: "Mentoring Conversations",
    description: "Schedule two mentoring conversations with your mentor",
    image: Card3,
  },
];

export default function PastorAssignmentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [toast, setToast] = useState(null);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedAssignments, setSelectedAssignments] = useState([]);

  const handleOptionsClick = (id) => {
    setSelectedAssignment(id);
    setShowAssignModal(true);
  };

  const handleDeleteClick = () => {
    if (selectedAssignments.length > 0) {
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = () => {
    setToast(
      `Deleted ${selectedAssignments.length} assignment${
        selectedAssignments.length > 1 ? "s" : ""
      } successfully`
    );
    setTimeout(() => setToast(null), 2000);
    setShowDeleteModal(false);
    setSelectedAssignments([]);
    setIsSelectionMode(false);
  };

  const handleAssignComplete = (selectedMentees) => {
    setToast("Assigned Survey Successfully");
    setTimeout(() => setToast(null), 2000);
    setSelectedAssignments([]);
    setIsSelectionMode(false);
  };

  const toggleSelection = (id) => {
    setSelectedAssignments((prev) =>
      prev.includes(id)
        ? prev.filter((assignmentId) => assignmentId !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedAssignments.length === ASSIGNMENTS.length) {
      setSelectedAssignments([]);
    } else {
      setSelectedAssignments(ASSIGNMENTS.map((a) => a.id));
    }
  };

  const exitSelection = () => {
    setIsSelectionMode(false);
    setSelectedAssignments([]);
  };

  const handleAssignedToClick = () => {
    if (selectedAssignments.length > 0) {
      setShowAssignModal(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#1b598f] to-[#2876AC]">
      <AppHero title="Roadmap" backgroundImageUrl={MentorBg.src} />

      {/* Content Section */}
      <section className="relative px-4 sm:px-6 md:px-12 lg:px-20 py-6 md:py-8">
        <div className="max-w-[1400px] mx-auto">
          {/* Search Bar and Action Buttons - Always Visible */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
            {/* Search Bar */}
            <div className="w-full sm:max-w-[420px]">
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full px-4 py-3 pl-11 rounded-lg bg-white text-[#1A2E7A] placeholder-gray-400 outline-none shadow-md text-[15px]"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isSelectionMode ? (
                <>
                  <button
                    onClick={() => setIsSelectionMode(true)}
                    className="px-6 py-3 bg-white text-[#2E3B8E] rounded-lg text-[15px] font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <i className="fa-regular fa-square-check"></i>
                    <span>Select</span>
                  </button>
                  <button
                    onClick={() =>
                      router.push("/director/pastor-assignments/create")
                    }
                    className="px-6 py-3 bg-[#2E3B8E] text-white rounded-lg text-[15px] font-semibold shadow-md hover:bg-[#1F2A6E] transition-all flex items-center gap-2"
                  >
                    <i className="fa-solid fa-plus"></i>
                    <span>Add</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={exitSelection}
                  className="px-6 py-3 bg-white text-gray-600 rounded-lg text-[15px] font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <i className="fa-solid fa-xmark"></i>
                  <span>Cancel</span>
                </button>
              )}
            </div>
          </div>

          {/* Selection Mode Bar - Appears below search when items selected */}
          {isSelectionMode && selectedAssignments.length > 0 && (
            <div className="bg-white rounded-xl shadow-md p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-[15px] font-semibold text-gray-700">
                  {selectedAssignments.length} Selected Items
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={selectAll}
                  className="px-4 py-2 text-[#2E3B8E] rounded-lg text-[14px] font-semibold hover:bg-gray-50 transition-all"
                >
                  Select All
                </button>
                <button
                  onClick={handleAssignedToClick}
                  className="px-5 py-2 bg-[#2E3B8E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#1F2A6E] transition-all"
                >
                  Assigned to
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="px-4 py-2 text-red-600 rounded-lg text-[14px] font-semibold hover:bg-red-50 transition-all"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
              </div>
            </div>
          )}

          {/* Assignment Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ASSIGNMENTS.map((assignment) => (
              <AssignmentCard
                key={assignment.id}
                id={assignment.id}
                title={assignment.title}
                description={assignment.description}
                image={assignment.image}
                onView={() => {
                  router.push(`/director/assignments/${assignment.id}/view`);
                }}
                onOptionsClick={handleOptionsClick}
                isSelected={selectedAssignments.includes(assignment.id)}
                onSelect={toggleSelection}
                showCheckbox={isSelectionMode}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-[100] animate-fade-in">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 border border-gray-100">
            <i className="fa-solid fa-circle-check text-green-500 text-xl"></i>
            <span className="text-[#2E3B8E] font-semibold text-[15px]">
              {toast}
            </span>
          </div>
        </div>
      )}

      {/* Assign Mentees Modal */}
      <AssignMenteesModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        onConfirm={handleAssignComplete}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${selectedAssignments.length} Assignment${
          selectedAssignments.length > 1 ? "s" : ""
        }?`}
        message={`Are you sure you want to delete ${
          selectedAssignments.length
        } assignment${
          selectedAssignments.length > 1 ? "s" : ""
        }? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="bg-red-600 hover:bg-red-700"
        icon="fa-solid fa-trash"
        iconColor="text-red-500 bg-red-100"
      />

      <AppFooter />
    </div>
  );
}
