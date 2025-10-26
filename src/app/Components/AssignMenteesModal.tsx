"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Mentor1 from "../Assets/mentor1.png";
import Mentor2 from "../Assets/mentor2.png";
import Mentor3 from "../Assets/mentor3.png";

interface AssignMenteesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedMentees: any[]) => void;
  mentor?: {
    name: string;
    id: number;
  } | null;
}

interface Person {
  id: number;
  name: string;
  img: any;
}

const AVAILABLE_PEOPLE: Person[] = [
  {
    id: 1,
    name: "John Ross",
    img: Mentor1,
  },
  {
    id: 2,
    name: "John Ross",
    img: Mentor2,
  },
  {
    id: 3,
    name: "John Ross",
    img: Mentor3,
  },
  {
    id: 4,
    name: "John Ross",
    img: Mentor1,
  },
  {
    id: 5,
    name: "John Ross",
    img: Mentor2,
  },
  {
    id: 6,
    name: "John Ross",
    img: Mentor3,
  },
  {
    id: 7,
    name: "John Ross",
    img: Mentor1,
  },
  {
    id: 8,
    name: "John Ross",
    img: Mentor2,
  },
  {
    id: 9,
    name: "John Ross",
    img: Mentor3,
  },
];

export default function AssignMenteesModal({
  isOpen,
  onClose,
  onConfirm,
  mentor,
}: AssignMenteesModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<number[]>([]);

  const filteredPeople = AVAILABLE_PEOPLE.filter((person) =>
    person.name.toLowerCase().includes(query.toLowerCase())
  );

  const handlePersonSelect = (personId: number) => {
    setSelectedPeople((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  const handleConfirm = () => {
    const selectedPeopleData = AVAILABLE_PEOPLE.filter((person) =>
      selectedPeople.includes(person.id)
    );
    onConfirm(selectedPeopleData);
    setSelectedPeople([]);
    router.push("/director/pastor-assignments/survey");
  };

  const getSelectedSummary = () => {
    if (selectedPeople.length === 0) return "";
    const selectedNames = filteredPeople
      .filter((p) => selectedPeople.includes(p.id))
      .slice(0, 3);
    const firstNames = selectedNames.map((p) => p.name);
    if (selectedPeople.length > 3) {
      return `${firstNames.join(", ")} and ${selectedPeople.length - 3} Others`;
    }
    return firstNames.join(", ");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-[20px] font-bold text-gray-900">Assigned to</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="p-6 flex-1 overflow-auto">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search"
                className="w-full px-4 py-2.5 pl-10 rounded-lg border border-gray-300 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>

          {/* People List */}
          <div className="space-y-2">
            {filteredPeople.map((person) => (
              <div
                key={person.id}
                onClick={() => handlePersonSelect(person.id)}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-all"
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedPeople.includes(person.id)
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {selectedPeople.includes(person.id) && (
                    <i className="fa-solid fa-check text-white text-[10px]"></i>
                  )}
                </div>
                <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
                  <Image
                    src={person.img}
                    alt={person.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-[15px] font-medium text-gray-900">
                  {person.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="text-[13px] text-gray-600 flex-1">
            {selectedPeople.length > 0 ? (
              <span>{getSelectedSummary()}</span>
            ) : (
              <span className="text-gray-400">No items selected</span>
            )}
          </div>
          <button
            onClick={handleConfirm}
            disabled={selectedPeople.length === 0}
            className="px-6 py-2.5 bg-[#2E3B8E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#1F2A6E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
}
