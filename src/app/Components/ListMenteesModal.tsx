"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
useEffect(() => {
  if (!isOpen) return;

  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";

  return () => {
    document.body.style.overflow = previousOverflow;
  };
}, [isOpen]);
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
      <div className="w-full max-w-2xl max-h-[86vh] flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.96)_0%,rgba(7,34,56,0.98)_100%)] shadow-2xl backdrop-blur-xl">
        {/* Header */}
       <div className="flex items-center justify-between border-b border-white/15 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-white">List of Mentees</h2>
            {mentorName && (
              <p className="mt-1 text-sm text-[#cde2f2]/80">Assigned to {mentorName}</p>
            )}
          </div>
          <button
            onClick={onClose}
           className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white/70 transition hover:bg-white/15 hover:text-white"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search mentees..."
                className="w-full rounded-xl border border-white/15 bg-white/10 px-11 py-3 text-sm text-white placeholder:text-[#cde2f2]/55 outline-none transition focus:border-[#8ec5eb]/60 focus:bg-white/[0.13]"
              />
              <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-[#8ec5eb]"></i>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#8ec5eb] mb-3"></div>
                <p className="text-[14px] text-[#cde2f2]/75">Loading mentees...</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <i className="fa-solid fa-circle-exclamation text-red-500 text-4xl mb-3"></i>
                <p className="mb-1 text-[15px] font-medium text-white">{error}</p>
                <button
                  onClick={fetchAssignedUsers}
                  className="text-[14px] font-medium text-[#8ec5eb] hover:underline"
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
               <i className="fa-solid fa-users mb-3 text-5xl text-white/35"></i>
<p className="mb-1 text-[15px] font-medium text-white">No mentees assigned</p>
<p className="text-[13px] text-[#cde2f2]/70">
                  This mentor doesn't have any mentees yet
                </p>
              </div>
            </div>
          )}

          {/* Mentees List */}
          {!loading && !error && filteredMentees.length > 0 && (
            <div className="space-y-3">
              {filteredMentees.map((mentee, index) => (
                // <div
                //   key={mentee._id}
                //   className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 transition hover:bg-white/[0.1]"
                // >
                <button
  key={mentee._id}
  type="button"
  onClick={() => {
    onClose();
    router.push(`/director/mentees/profile/${encodeURIComponent(mentee._id)}`);
  }}
  className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-left transition hover:border-[#8ec5eb]/40 hover:bg-white/[0.1]"
>
                  <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-white/10 ring-1 ring-white/15">
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
                      <p className="truncate text-[15px] font-semibold text-white">
                        {mentee.firstName} {mentee.lastName}
                      </p>
                      {/* <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        mentee.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : mentee.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}> */}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
  mentee.status === "active"
    ? "bg-emerald-400/15 text-emerald-200"
    : mentee.status === "pending"
    ? "bg-amber-400/15 text-amber-200"
    : "bg-white/10 text-[#cde2f2]"
}`}>
                        {mentee.status}
                      </span>
                    </div>
                    <p className="truncate text-[12px] text-[#cde2f2]/70">{mentee.email}</p>
                    {mentee.phoneNumber && (
                      <p className="truncate text-[12px] text-[#cde2f2]/50">{mentee.phoneNumber}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-[#8ec5eb]/15 px-2.5 py-1 text-[11px] font-semibold text-[#8ec5eb]">
                      {mentee.role}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* No Search Results */}
          {!loading && !error && mentees.length > 0 && filteredMentees.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
               <i className="fa-solid fa-search mb-3 text-4xl text-white/35"></i>
<p className="mb-1 text-[15px] font-medium text-white">No results found</p>
<p className="text-[13px] text-[#cde2f2]/70">
                  Try searching with a different name or email
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/15 bg-[#061f35]/90 px-6 py-4">
          <div className="text-[13px] text-[#cde2f2]/70">
            {mentees.length > 0 ? (
              <span>
                {filteredMentees.length} of {mentees.length} mentee{mentees.length !== 1 ? 's' : ''}
              </span>
            ) : (
              <span className="text-[#cde2f2]/50">No mentees</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-xl bg-[#8ec5eb] px-7 py-3 text-sm font-bold text-[#062946] transition hover:bg-[#a9d5f2]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
