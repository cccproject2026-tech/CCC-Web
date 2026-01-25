"use client";
import { useState } from "react";
import Image from "next/image";

export interface Mentor {
  id: number;
  name: string;
  role: string;
  menteeCount: number;
  loginDate?: string;
  img: any;
}

interface AssignMentorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedMentors: number[]) => void;
  mentors: Mentor[];
}

export default function AssignMentorModal({
  isOpen,
  onClose,
  onConfirm,
  mentors,
}: AssignMentorModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("Mentors");
  const [sortBy, setSortBy] = useState("Latest Join");
  const [showFilter, setShowFilter] = useState(false);
  const [selectedMentors, setSelectedMentors] = useState<number[]>([]);

  if (!isOpen) return null;
  console.log(mentors)
  const filteredMentors = mentors.filter((m) =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleMentor = (id: number) => {
    setSelectedMentors((prev) =>
      prev.includes(id) ? prev.filter((mid) => mid !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onConfirm(selectedMentors);
    setSelectedMentors([]);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-[20px] font-bold text-gray-900">
            Assign New Mentor
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Search and Controls */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="w-full px-4 py-2.5 pl-10 bg-gray-50 border border-gray-200 rounded-lg text-[14px] outline-none focus:border-blue-500"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
            </div>
          </div>

          <div className="flex items-center justify-between">
            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab("All")}
                className={`px-4 py-2 rounded-md text-[13px] font-semibold transition ${activeTab === "All"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveTab("Mentors")}
                className={`px-4 py-2 rounded-md text-[13px] font-semibold transition ${activeTab === "Mentors"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Mentors
              </button>
              <button
                onClick={() => setActiveTab("Field Mentor")}
                className={`px-4 py-2 rounded-md text-[13px] font-semibold transition ${activeTab === "Field Mentor"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                Field Mentor
              </button>
            </div>

            {/* Sort and Filter */}
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-gray-600 font-medium">
                Sort By
              </span>
              <div className="relative">
                <button className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 hover:bg-gray-100 transition flex items-center gap-2">
                  <span>{sortBy}</span>
                  <i className="fa-solid fa-chevron-down text-xs"></i>
                </button>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowFilter(!showFilter)}
                  className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 hover:bg-gray-100 transition flex items-center gap-2"
                >
                  <i className="fa-solid fa-filter text-yellow-500"></i>
                  <span>Filter</span>
                  <i className="fa-solid fa-chevron-down text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mentor Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {filteredMentors.map((mentor) => (
              <div
                key={mentor.id}
                onClick={() => toggleMentor(mentor.id)}
                className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition relative"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200">
                    <Image
                      src={mentor.img}
                      alt={mentor.name}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-[14px] font-bold text-gray-900 truncate">
                      {mentor.name}
                    </h4>
                    <p className="text-[12px] text-gray-500">{mentor.role}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedMentors.includes(mentor.id)}
                    onChange={() => toggleMentor(mentor.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </div>
                <div className="text-[11px] text-gray-600">
                  <p className="text-yellow-700 font-semibold">
                    {mentor.menteeCount} Mentors
                  </p>
                  {mentor.loginDate && (
                    <p>
                      Login :{" "}
                      <span className="font-semibold">{mentor.loginDate}</span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer with selected count */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <p className="text-[13px] text-gray-600">
              {selectedMentors.length > 0
                ? `${filteredMentors
                  .filter((m) => selectedMentors.includes(m.id))
                  .map((m) => m.name)
                  .slice(0, 3)
                  .join(", ")}${selectedMentors.length > 3
                  ? ` and ${selectedMentors.length - 3} Others`
                  : ""
                }`
                : "No mentors selected"}
            </p>
            <button
              onClick={handleConfirm}
              disabled={selectedMentors.length === 0}
              className="px-6 py-2.5 bg-[#1F2A6E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#2E3B8E] transition-all disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Assign Mentor
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

