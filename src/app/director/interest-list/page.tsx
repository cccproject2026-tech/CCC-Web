"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import MentorBg from "../../Assets/mentor-bg.png";
import DirectorHero from "../DirectorHero";
import {
  directorGlassCard,
  directorGlassCardHover,
  directorInputClass,
  directorPageRoot,
} from "../directorUi";
import { apiGetAllInterests } from "@/app/Services/interests.service";
import { Interest, InterestStatus } from "@/app/Services/types";

// export interface Interest {
//   _id: string;
//   firstName: string;
//   lastName: string;
//   email: string;
//   phoneNumber?: string;
//   title?: string;
//   status: InterestStatus;
//   churchDetails: any[];
//   createdAt: string;
//   updatedAt: string;
//   user?: {
//     _id: string;
//     role: string;
//     isEmailVerified: boolean;
//     roleId: string;
//   };
// }

export default function InterestReceivedPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<InterestStatus>("new");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedState, setSelectedState] = useState<string>("state");
  const [selectedPastors, setSelectedPastors] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [interests, setInterests] = useState<Interest[]>([]);

  const newCount = interests.filter(i => i.status === "new").length;
  const pendingCount = interests.filter(i => i.status === "pending").length;


  // // Dummy data for interests
  // const interests = [
  //   {
  //     id: 1,
  //     name: "Robert Fox",
  //     role: "Pastor",
  //     status: "new",
  //     timestamp: "09:43 AM",
  //     date: "15 Nov 2024",
  //   },
  //   {
  //     id: 2,
  //     name: "Robert Fox",
  //     role: "Pastor",
  //     status: "new",
  //     timestamp: "09:43 AM",
  //     date: "15 Nov 2024",
  //   },
  //   {
  //     id: 3,
  //     name: "Robert Fox",
  //     role: "Pastor",
  //     status: "pending",
  //     timestamp: null,
  //     date: "15 Nov 2024",
  //   },
  //   {
  //     id: 4,
  //     name: "Robert Fox",
  //     role: "Pastor",
  //     status: "new",
  //     timestamp: null,
  //     date: "15 Nov 2024",
  //   },
  //   {
  //     id: 5,
  //     name: "Robert Fox",
  //     role: "Pastor",
  //     status: "new",
  //     timestamp: null,
  //     date: "15 Nov 2024",
  //   },
  //   {
  //     id: 6,
  //     name: "Robert Fox",
  //     role: "Pastor",
  //     status: "accepted",
  //     timestamp: null,
  //     date: "15 Nov 2024",
  //   },
  //   {
  //     id: 7,
  //     name: "Robert Fox",
  //     role: "Pastor",
  //     status: "new",
  //     timestamp: null,
  //     date: "15 Nov 2024",
  //   },
  //   {
  //     id: 8,
  //     name: "Robert Fox",
  //     role: "Pastor",
  //     status: "pending",
  //     timestamp: null,
  //     date: "15 Nov 2024",
  //   },
  // ];

  const handleToggleSelect = (id: string) => {
    setSelectedPastors(prev =>
      prev.includes(id)
        ? prev.filter(pid => pid !== id)
        : [...prev, id]
    );
  };

  useEffect(() => {
    const fetchInterests = async () => {
      try {
        setLoading(true);

        const res = await apiGetAllInterests({
          search: searchQuery || undefined,
          status: activeTab,
        });

        setInterests(res.data.data);
      } catch (error) {
        console.error("Failed to fetch interests", error);
        setInterests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInterests();
  }, [searchQuery, activeTab]);


  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Interest received"
        subtitle="Review and follow up on new leads."
        image={MentorBg}
      />

      <section className="pb-10">
        <div className="mx-auto max-w-[1400px]">
          <div className={`mb-8 p-6 ${directorGlassCard}`}>
            <div className="flex flex-col items-center gap-4 md:flex-row">
              <div className="relative w-full flex-1">
                <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-[#8ec5eb]/80" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${directorInputClass} pl-11`}
                />
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab("new")}
                  className={`relative rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === "new"
                      ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/40"
                      : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  New
                  {newCount > 0 && (
                    <span
                      className={`absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full text-[11px] font-bold ${
                        activeTab === "new" ? "bg-[#FFD700] text-[#0f4a76]" : "bg-white/20 text-white"
                      }`}
                    >
                      {newCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("pending")}
                  className={`relative rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === "pending"
                      ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/40"
                      : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  Pending
                  {pendingCount > 0 && (
                    <span
                      className={`absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full text-[11px] font-bold ${
                        activeTab === "pending" ? "bg-[#FFD700] text-[#0f4a76]" : "bg-white/20 text-white"
                      }`}
                    >
                      {pendingCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("accepted")}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === "accepted"
                      ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/40"
                      : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  Accepted
                </button>
              </div>

              <div className="relative w-full md:w-auto">
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className={`${directorInputClass} appearance-none pr-10 font-semibold`}
                >
                  <option value="state" className="text-black">
                    State
                  </option>
                  <option value="usa" className="text-black">
                    USA
                  </option>
                  <option value="canada" className="text-black">
                    Canada
                  </option>
                  <option value="mexico" className="text-black">
                    Mexico
                  </option>
                  <option value="brazil" className="text-black">
                    Brazil
                  </option>
                </select>
                <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/50" />
              </div>
            </div>
          </div>

          {selectedPastors.length > 0 && (
            <div className={`mb-6 p-4 ${directorGlassCard}`}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-[15px] font-semibold text-white/90">
                    {selectedPastors.length}{" "}
                    {selectedPastors.length === 1 ? "Pastor" : "Pastors"} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPastors([])}
                    className="text-sm font-medium text-[#8ec5eb] hover:text-[#b8ddf5]"
                  >
                    Clear selection
                  </button>
                </div>
                <button
                  type="button"
                  className="rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                >
                  Assign to mentors
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {interests.map((interest) => (
                  <div
                    key={interest._id}
                    className={`relative p-6 transition-all ${directorGlassCard} ${directorGlassCardHover}`}
                  >
                    <div className="absolute right-4 top-4">
                      <input
                        type="checkbox"
                        checked={selectedPastors.includes(interest._id)}
                        onChange={() => handleToggleSelect(interest._id)}
                        className="h-5 w-5 cursor-pointer accent-[#8ec5eb]"
                      />
                    </div>

                    <div className="mb-4 flex items-start justify-between pr-8">
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-xl border border-white/15 bg-[#8ec5eb]/15">
                        <i className="fa-solid fa-user text-2xl text-[#8ec5eb]" />
                      </div>
                      <span className="text-[13px] font-medium text-white/55">
                        {new Date(interest.createdAt).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="mb-4">
                      <h3 className="mb-1 text-[17px] font-bold text-white">
                        {interest.firstName} {interest.lastName}
                      </h3>
                      <p className="text-[14px] text-white/65">{interest.title ?? "—"}</p>
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 text-[18px] text-white/55">
                        <button type="button" className="hover:text-[#8ec5eb]" aria-label="Email">
                          <i className="fa-regular fa-envelope" />
                        </button>
                        <button type="button" className="hover:text-[#8ec5eb]" aria-label="Chat">
                          <i className="fa-regular fa-comment" />
                        </button>
                        <button type="button" className="hover:text-[#8ec5eb]" aria-label="Call">
                          <i className="fa-solid fa-phone" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => router.push(`/director/interest-list/${interest._id}`)}
                        className="whitespace-nowrap rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {interests.length === 0 && (
                <div className="py-12 text-center">
                  <i className="fa-solid fa-search mb-4 text-6xl text-white/20" />
                  <p className="text-[16px] text-white/55">No interests found</p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
