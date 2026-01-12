"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Mentor1 from "../Assets/mentor1.png";
import Mentor2 from "../Assets/mentor2.png";
import Mentor3 from "../Assets/mentor3.png";
import { apiGetAssignedUsers } from "@/app/Services/users.service";

interface ListMenteesModalProps {
  isOpen: boolean;
  onClose: () => void;
  mentorId: string | null;
  mentorName: string | null;
}

interface Mentee {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  status: string;
  profilePicture?: string;
  phoneNumber?: string;
  profileInfo?: string;
}

export default function ListMenteesModal({
  isOpen,
  onClose,
  mentorId,
  mentorName,
}: ListMenteesModalProps) {
  const [query, setQuery] = useState("");
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const defaultImages = [Mentor1, Mentor2, Mentor3];

  useEffect(() => {
    if (isOpen && mentorId) {
      fetchAssignedUsers();
    }
  }, [isOpen, mentorId]);

  const fetchAssignedUsers = async () => {
    if (!mentorId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await apiGetAssignedUsers(mentorId);
      setMentees(response.data.data || []);
    } catch (err) {
      console.error("Error fetching assigned users:", err);
      setError("Failed to load mentees");
      setMentees([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMentees = mentees.filter((mentee) => {
    const fullName = `${mentee.firstName} ${mentee.lastName}`.toLowerCase();
    const searchQuery = query.toLowerCase();
    return fullName.includes(searchQuery) || mentee.email.toLowerCase().includes(searchQuery);
  });

  const getRandomImage = (index: number) => {
    return defaultImages[index % defaultImages.length];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-[20px] font-bold text-gray-900">List of Mentees</h2>
            {mentorName && (
              <p className="text-[13px] text-gray-500 mt-1">Assigned to {mentorName}</p>
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
                placeholder="Search mentees..."
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
                <p className="text-gray-600 text-[14px]">Loading mentees...</p>
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
                  onClick={fetchAssignedUsers}
                  className="text-[#2E3B8E] text-[14px] font-medium hover:underline"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && mentees.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <i className="fa-solid fa-users text-gray-300 text-5xl mb-3"></i>
                <p className="text-gray-900 font-medium text-[15px] mb-1">No mentees assigned</p>
                <p className="text-gray-500 text-[13px]">
                  This mentor doesn't have any mentees yet
                </p>
              </div>
            </div>
          )}

          {/* Mentees List */}
          {!loading && !error && filteredMentees.length > 0 && (
            <div className="space-y-2">
              {filteredMentees.map((mentee, index) => (
                <div
                  key={mentee._id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all"
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                    <Image
                      src={mentee.profilePicture || getRandomImage(index)}
                      alt={`${mentee.firstName} ${mentee.lastName}`}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[15px] font-semibold text-gray-900 truncate">
                        {mentee.firstName} {mentee.lastName}
                      </p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        mentee.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : mentee.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {mentee.status}
                      </span>
                    </div>
                    <p className="text-[12px] text-gray-500 truncate">{mentee.email}</p>
                    {mentee.phoneNumber && (
                      <p className="text-[12px] text-gray-400 truncate">{mentee.phoneNumber}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-medium">
                      {mentee.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No Search Results */}
          {!loading && !error && mentees.length > 0 && filteredMentees.length === 0 && (
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
          <div className="text-[13px] text-gray-600">
            {mentees.length > 0 ? (
              <span>
                {filteredMentees.length} of {mentees.length} mentee{mentees.length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-gray-400">No mentees</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#2E3B8E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#1F2A6E] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
