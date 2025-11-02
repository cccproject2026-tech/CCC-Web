"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AppHeader from "@/app/Components/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import AppHero from "@/app/Components/Hero/AppHero";
import RoadmapBg from "../../Assets/roadmap-bg.png";
import Thumb1 from "../../Assets/thumb1.png";
import Thumb2 from "../../Assets/thumb2.png";

export default function AssignmentsPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignments, setSelectedAssignments] = useState<number[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState<number | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [toast, setToast] = useState<string | null>(null);

  const assignments = [
    {
      id: 1,
      title: "Prayer and Visitation Strategy",
      description: "Finalize the teams vision for the church",
      image: Thumb1,
    },
    {
      id: 2,
      title: "Calendar",
      description:
        "Finalize a vision team meeting schedule through the end of the year",
      image: Thumb2,
    },
    {
      id: 3,
      title: "Prayer",
      description:
        "Prioritize church prayer times and meet consistently for prayer with your congregation",
      image: Thumb1,
    },
    {
      id: 4,
      title: "Mentoring Conversations",
      description: "Schedule two mentoring conversations with your mentor",
      image: Thumb2,
    },
  ];

  const users = [
    { id: 1, name: "John Ross", role: "Pastor" },
    { id: 2, name: "John Ross", role: "Pastor" },
    { id: 3, name: "John Ross", role: "Pastor" },
    { id: 4, name: "John Ross", role: "Pastor" },
    { id: 5, name: "John Ross", role: "Pastor" },
    { id: 6, name: "John Ross", role: "Pastor" },
    { id: 7, name: "John Ross", role: "Pastor" },
  ];

  const handleSelectAssignment = (id: number) => {
    if (selectedAssignments.includes(id)) {
      setSelectedAssignments(selectedAssignments.filter((aid) => aid !== id));
    } else {
      setSelectedAssignments([...selectedAssignments, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedAssignments.length === assignments.length) {
      setSelectedAssignments([]);
    } else {
      setSelectedAssignments(assignments.map((a) => a.id));
    }
  };

  const handleSelectMode = () => {
    setIsSelectionMode(true);
    setSelectedAssignments([]);
  };

  const handleCancelSelection = () => {
    setIsSelectionMode(false);
    setSelectedAssignments([]);
  };

  const handleAssign = () => {
    setShowAssignModal(false);
    setToast("Assigned Survey Successfully");
    setTimeout(() => setToast(null), 3000);
    setSelectedUsers([]);
  };

  const handleDelete = () => {
    setShowDeleteModal(false);
    setToast(`${selectedAssignments.length} Items Deleted`);
    setTimeout(() => setToast(null), 3000);
    setIsSelectionMode(false);
    setSelectedAssignments([]);
  };

  const handleUserToggle = (userId: number) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter((id) => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const filteredAssignments = assignments.filter((assignment) =>
    assignment.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest(".options-menu-container")) {
        setShowOptionsMenu(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptionsMenu]);

  return (
    <div className="min-h-screen flex flex-col bg-[#2876AC]">
      <AppHeader showFullHeader={true} />

      {/* Hero Section */}
      <AppHero
        title="Roadmap"
        backgroundImageUrl={RoadmapBg.src}
        heightClasses="h-[280px]"
      />

      {/* Main Content */}
      <section className="relative px-6 md:px-12 lg:px-20 py-10">
        <div className="max-w-[1400px] mx-auto">
          {/* Search and Action Bar */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
            {/* Search Bar */}
            <div className="flex-1 w-full max-w-md">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white rounded-lg focus:outline-none text-gray-900 placeholder-gray-400 shadow-md"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              {!isSelectionMode ? (
                <>
                  <button
                    onClick={handleSelectMode}
                    className="px-6 py-3 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-50 shadow-md flex items-center gap-2"
                  >
                    <i className="fa-solid fa-check-square"></i>
                    Select
                  </button>
                  <button
                    onClick={() => router.push("/director/assignments/create")}
                    className="px-6 py-3 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-50 shadow-md flex items-center gap-2"
                  >
                    <i className="fa-solid fa-plus"></i>
                    Add
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowAssignModal(true)}
                  className="px-6 py-3 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-50 shadow-md flex items-center gap-2"
                >
                  <i className="fa-solid fa-user-plus"></i>
                  Assigned to
                </button>
              )}
            </div>
          </div>

          {/* Selection Mode Controls */}
          {isSelectionMode && (
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <span className="text-white font-semibold">
                  {selectedAssignments.length} Selected Items
                </span>
                <button
                  onClick={handleSelectAll}
                  className="px-4 py-2 bg-white text-[#2E3B8E] rounded-lg font-semibold hover:bg-gray-50"
                >
                  Select All
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowDeleteModal(true)}
                  disabled={selectedAssignments.length === 0}
                  className="w-10 h-10 bg-white text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="fa-solid fa-trash"></i>
                </button>
                <button
                  onClick={handleCancelSelection}
                  className="w-10 h-10 bg-white text-[#2E3B8E] rounded-lg hover:bg-gray-50 flex items-center justify-center"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
            </div>
          )}

          {/* Assignments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAssignments.map((assignment) => (
              <div
                key={assignment.id}
                className={`bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all relative ${
                  selectedAssignments.includes(assignment.id)
                    ? "ring-2 ring-[#2E3B8E]"
                    : ""
                }`}
              >
                {/* Checkbox for selection mode */}
                {isSelectionMode && (
                  <div className="absolute top-4 left-4 z-10">
                    <input
                      type="checkbox"
                      checked={selectedAssignments.includes(assignment.id)}
                      onChange={() => handleSelectAssignment(assignment.id)}
                      className="w-5 h-5 text-[#2E3B8E] rounded focus:ring-2 focus:ring-[#2E3B8E] cursor-pointer"
                    />
                  </div>
                )}

                {/* Three dots menu */}
                {!isSelectionMode && (
                  <div className="absolute top-4 right-4 z-[60] options-menu-container">
                    <button
                      onClick={() =>
                        setShowOptionsMenu(
                          showOptionsMenu === assignment.id
                            ? null
                            : assignment.id
                        )
                      }
                      className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <i className="fa-solid fa-ellipsis-vertical"></i>
                    </button>
                    {showOptionsMenu === assignment.id && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-[200] animate-slide-down">
                        <button
                          onClick={() => {
                            setShowAssignModal(true);
                            setShowOptionsMenu(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 text-gray-700"
                        >
                          <i className="fa-solid fa-user-plus text-[#2E3B8E]"></i>
                          Assign to
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 text-gray-700">
                          <i className="fa-solid fa-pen text-blue-600"></i>
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            setSelectedAssignments([assignment.id]);
                            setShowDeleteModal(true);
                            setShowOptionsMenu(null);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 text-red-600"
                        >
                          <i className="fa-solid fa-trash"></i>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4 p-6">
                  {/* Assignment Image */}
                  <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                    <Image
                      src={assignment.image}
                      alt={assignment.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Assignment Info */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        {assignment.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {assignment.description}
                      </p>
                    </div>

                    <button className="self-end px-6 py-2 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] transition text-sm mt-4">
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredAssignments.length === 0 && (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 mb-4">
                <i className="fa-regular fa-folder-open text-white text-2xl"></i>
              </div>
              <p className="text-white text-lg">No assignments found</p>
            </div>
          )}
        </div>
      </section>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-end items-start z-50">
          <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-gray-900">Assigned to</h3>
              <button
                onClick={() => setShowAssignModal(false)}
                className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition"
              >
                <i className="fa-solid fa-xmark text-gray-600"></i>
              </button>
            </div>

            <div className="p-6">
              <div className="relative mb-6">
                <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2E3B8E]"
                />
              </div>

              <div className="space-y-3 mb-6">
                {users.map((user) => (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleUserToggle(user.id)}
                      className="w-5 h-5 text-[#2E3B8E] rounded focus:ring-2 focus:ring-[#2E3B8E]"
                    />
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-semibold">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-gray-900 font-medium">
                      {user.name}
                    </span>
                  </label>
                ))}
              </div>

              <p className="text-sm text-gray-600 mb-6">
                John Doe, John Doe, John Doe and 3 Others
              </p>

              <button
                onClick={handleAssign}
                className="w-full py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] transition"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                <i className="fa-regular fa-trash-can text-3xl text-red-500"></i>
              </div>
            </div>
            <h3 className="text-xl font-bold text-center text-[#2E3B8E] mb-6">
              Are you sure want to Delete {selectedAssignments.length}{" "}
              Assignments ?
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-[#2E3B8E] text-white rounded-lg font-semibold hover:bg-[#1F2A6E] transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 right-8 z-[70] animate-fade-in">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 border border-gray-200">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <i className="fa-solid fa-check text-white text-xs"></i>
            </div>
            <span className="text-[#2E3B8E] font-semibold">{toast}</span>
          </div>
        </div>
      )}

      <AppFooter />
    </div>
  );
}
