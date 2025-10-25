"use client";
import { useState } from "react";
import Image from "next/image";
import Mentor1 from "../Assets/mentor1.png";
import Mentor2 from "../Assets/mentor2.png";
import Mentor3 from "../Assets/mentor3.png";

interface AssignMenteesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedMentees: any[]) => void;
  mentor: {
    name: string;
    id: number;
  } | null;
}

interface Mentee {
  id: number;
  name: string;
  role: string;
  img: any;
  mentorCount: number;
  lastLogin: string;
}

const AVAILABLE_MENTEES: Mentee[] = [
  {
    id: 1,
    name: "Robert Fox",
    role: "Pastor",
    img: Mentor1,
    mentorCount: 0,
    lastLogin: "Not Started yet",
  },
  {
    id: 2,
    name: "Robert Fox",
    role: "Pastor",
    img: Mentor2,
    mentorCount: 2,
    lastLogin: "15 Nov 2024",
  },
  {
    id: 3,
    name: "Robert Fox",
    role: "Pastor",
    img: Mentor3,
    mentorCount: 1,
    lastLogin: "10 Nov 2024",
  },
  {
    id: 4,
    name: "Robert Fox",
    role: "Pastor",
    img: Mentor1,
    mentorCount: 0,
    lastLogin: "Not Started yet",
  },
  {
    id: 5,
    name: "Robert Fox",
    role: "Pastor",
    img: Mentor2,
    mentorCount: 3,
    lastLogin: "12 Nov 2024",
  },
  {
    id: 6,
    name: "Robert Fox",
    role: "Pastor",
    img: Mentor3,
    mentorCount: 1,
    lastLogin: "8 Nov 2024",
  },
];

export default function AssignMenteesModal({
  isOpen,
  onClose,
  onConfirm,
  mentor,
}: AssignMenteesModalProps) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("Latest Join");
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [selectedMentees, setSelectedMentees] = useState<number[]>([]);

  const sortOptions = [
    "Latest Join",
    "Least number of Mentors",
    "Highest number of Mentors",
    "Last Contacted",
  ];

  const filteredMentees = AVAILABLE_MENTEES.filter((mentee) =>
    mentee.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleMenteeSelect = (menteeId: number) => {
    setSelectedMentees((prev) =>
      prev.includes(menteeId)
        ? prev.filter((id) => id !== menteeId)
        : [...prev, menteeId]
    );
  };

  const handleConfirm = () => {
    const selectedMenteeData = AVAILABLE_MENTEES.filter((mentee) =>
      selectedMentees.includes(mentee.id)
    );
    onConfirm(selectedMenteeData);
    setSelectedMentees([]);
  };

  if (!isOpen || !mentor) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-[24px] font-bold text-gray-900">
            Assign New Mentees
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-all"
          >
            <i className="fa-solid fa-xmark text-gray-600"></i>
          </button>
        </div>

        <div className="p-6">
          {/* Search and Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Q Search"
                  className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-[14px] font-medium hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <span>Sort By</span>
                  <i className="fa-solid fa-chevron-down text-xs"></i>
                </button>

                {showSortMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl py-3 px-2 min-w-[200px] z-50">
                    {sortOptions.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-[14px] transition-all flex items-center gap-2 ${
                          sortBy === option
                            ? "bg-green-50 text-green-700 font-semibold"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            sortBy === option
                              ? "border-green-500 bg-green-500"
                              : "border-gray-300"
                          }`}
                        >
                          {sortBy === option && (
                            <i className="fa-solid fa-check text-white text-[8px]"></i>
                          )}
                        </span>
                        {option}
                      </button>
                    ))}
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button className="w-full text-left px-4 py-2.5 rounded-lg text-[14px] text-gray-700 hover:bg-gray-50">
                        Clear Sort
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  onClick={() => setShowFilterMenu(!showFilterMenu)}
                  className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-[14px] font-medium hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <span>Filter</span>
                  <span className="bg-blue-600 text-white text-[10px] px-2 py-1 rounded-full">
                    3
                  </span>
                  <i className="fa-solid fa-chevron-down text-xs"></i>
                </button>

                {showFilterMenu && (
                  <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl py-3 px-2 min-w-[200px] z-50">
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg">
                        <input type="checkbox" className="rounded" />
                        <span className="text-[14px] text-gray-700">State</span>
                      </label>
                      <label className="flex items-center gap-2 px-4 py-2 hover:bg-gray-50 rounded-lg">
                        <input type="checkbox" className="rounded" />
                        <span className="text-[14px] text-gray-700">
                          Conference
                        </span>
                      </label>
                    </div>
                    <div className="border-t border-gray-200 mt-2 pt-2">
                      <button className="w-full text-left px-4 py-2.5 rounded-lg text-[14px] text-gray-700 hover:bg-gray-50">
                        Clear Filter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mentees Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {filteredMentees.map((mentee) => (
              <div
                key={mentee.id}
                className={`bg-white border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  selectedMentees.includes(mentee.id)
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleMenteeSelect(mentee.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100">
                    <Image
                      src={mentee.img}
                      alt={mentee.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedMentees.includes(mentee.id)
                        ? "border-blue-500 bg-blue-500"
                        : "border-gray-300"
                    }`}
                  >
                    {selectedMentees.includes(mentee.id) && (
                      <i className="fa-solid fa-check text-white text-[10px]"></i>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <h4 className="text-[16px] font-semibold text-gray-900 mb-1">
                    {mentee.name}
                  </h4>
                  <p className="text-[14px] text-gray-500">{mentee.role}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">Mentors:</span>
                    <span className="text-[12px] font-semibold text-gray-700">
                      {mentee.mentorCount} Mentors
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500">Login:</span>
                    <span className="text-[12px] font-semibold text-gray-700">
                      {mentee.lastLogin}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-[14px] text-gray-600">
            {selectedMentees.length > 0 ? (
              <span>
                {selectedMentees.length} mentee
                {selectedMentees.length > 1 ? "s" : ""} selected
              </span>
            ) : (
              <span>No mentees selected</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg text-[14px] font-semibold hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedMentees.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg text-[14px] font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign Pastors
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
