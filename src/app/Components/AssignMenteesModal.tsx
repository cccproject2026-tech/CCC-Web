"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Mentor1 from "../Assets/mentor1.png";
import Mentor2 from "../Assets/mentor2.png";
import Mentor3 from "../Assets/mentor3.png";
import { apiGetAllUsers, apiAssignUsers } from "@/app/Services/users.service";
import { extractApiErrorMessage } from "@/app/Services/appointment-utils";

function unwrapGetUsersList(res: { data?: unknown }): any[] {
  const root = res?.data as Record<string, unknown> | undefined;
  if (root == null) return [];
  const body =
    root.data != null && typeof root.data === "object" && !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;
  const users = (body as { users?: unknown }).users;
  if (Array.isArray(users)) return users;
  if (Array.isArray(body)) return body as any[];
  return [];
}

function userRowId(u: { id?: string; _id?: string }): string {
  return String(u.id ?? u._id ?? "");
}

interface AssignMenteesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  mentor?: {
    name: string;
    id: string;
    assignedIds?: string[];
  } | null;
}

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: string;
  status: string;
  profilePicture?: string;
  img: any;
}

export default function AssignMenteesModal({
  isOpen,
  onClose,
  onSuccess,
  onError,
  mentor,
}: AssignMenteesModalProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultImages = [Mentor1, Mentor2, Mentor3];

  useEffect(() => {
    if (isOpen) {
      fetchAvailableUsers();
      setSelectedPeople([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mentor?.id, mentor?.assignedIds]);

  const fetchAvailableUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiGetAllUsers({
        role: "pastor",
        roleMatch: "mixed",
        limit: 9999, // Get all users without pagination
      });

      const users = unwrapGetUsersList(response);

      // Filter out users that are already assigned to this mentor (normalize ids for API parity)
      const assignedSet = new Set(
        (mentor?.assignedIds ?? []).map((x) => String(x).trim()).filter(Boolean),
      );
      const filteredUsers = users.filter((user: { id?: string; _id?: string }) => {
        const id = userRowId(user);
        if (!id) return false;
        return !assignedSet.has(id);
      });

      // Transform users to Person format
      const people: Person[] = filteredUsers.map((user: any, index: number) => ({
        id: userRowId(user),
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        status: user.status,
        profilePicture: user.profilePicture,
        img: user.profilePicture || defaultImages[index % defaultImages.length],
      }));

      setAvailablePeople(people);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(extractApiErrorMessage(err) || "Failed to load available users");
      setAvailablePeople([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPeople = availablePeople.filter((person) => {
    const searchQuery = query.toLowerCase();
    return (
      person.name.toLowerCase().includes(searchQuery) ||
      person.email.toLowerCase().includes(searchQuery)
    );
  });

  const handlePersonSelect = (personId: string) => {
    setSelectedPeople((prev) =>
      prev.includes(personId)
        ? prev.filter((id) => id !== personId)
        : [...prev, personId]
    );
  };

  const handleConfirm = async () => {
    if (!mentor?.id || selectedPeople.length === 0) return;

    setAssigning(true);
    try {
      const response = await apiAssignUsers(mentor.id, selectedPeople);

      if (response.data.success) {
        onSuccess(response.data.message || `Successfully assigned ${selectedPeople.length} mentee${selectedPeople.length > 1 ? 's' : ''}`);
        setSelectedPeople([]);
        onClose();
      } else {
        onError("Failed to assign mentees");
      }
    } catch (err: any) {
      console.error("Error assigning users:", err);
      const errorMessage = err.response?.data?.message || "Failed to assign mentees. Please try again.";
      onError(errorMessage);
    } finally {
      setAssigning(false);
    }
  };

  const getSelectedSummary = () => {
    if (selectedPeople.length === 0) return "";
    const selectedSet = new Set(selectedPeople.map((id) => String(id)));
    const selectedNames = availablePeople
      .filter((p) => selectedSet.has(String(p.id)))
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
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">Assign New Mentee</h2>
            {mentor && (
              <p className="text-[13px] text-gray-500 mt-1">Assign to {mentor.name}</p>
            )}
          </div>
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
                placeholder="Search by name or email..."
                className="w-full px-4 py-2.5 pl-10 rounded-lg border border-gray-300 text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2E3B8E] mb-3"></div>
                <p className="text-gray-600 text-[14px]">Loading users...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <i className="fa-solid fa-circle-exclamation text-red-500 text-4xl mb-3"></i>
                <p className="text-gray-900 font-medium text-[15px] mb-1">{error}</p>
                <button
                  onClick={fetchAvailableUsers}
                  className="text-[#2E3B8E] text-[14px] font-medium hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && availablePeople.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <i className="fa-solid fa-users text-gray-300 text-5xl mb-3"></i>
                <p className="text-gray-900 font-medium text-[15px] mb-1">No available users</p>
                <p className="text-gray-500 text-[13px]">
                  All users are already assigned or no users found
                </p>
              </div>
            </div>
          )}

          {/* People List */}
          {!loading && !error && filteredPeople.length > 0 && (
            <div className="space-y-2">
              {filteredPeople.map((person) => (
                <div
                  key={person.id}
                  onClick={() => handlePersonSelect(person.id)}
                  className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-all border border-gray-100"
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
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    <Image
                      src={person.img}
                      alt={person.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[15px] font-semibold text-gray-900 truncate">
                        {person.name}
                      </p>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-medium">
                        {person.role}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500 truncate">{person.email}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Search Results */}
          {!loading && !error && availablePeople.length > 0 && filteredPeople.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <i className="fa-solid fa-search text-gray-300 text-4xl mb-3"></i>
                <p className="text-gray-900 font-medium text-[15px] mb-1">No results found</p>
                <p className="text-gray-500 text-[13px]">
                  Try searching with a different name or email
                </p>
              </div>
            </div>
          )}
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
            disabled={selectedPeople.length === 0 || assigning}
            className="px-6 py-2.5 bg-[#2E3B8E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#1F2A6E] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {assigning ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Assigning...</span>
              </>
            ) : (
              <span>Assign</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
