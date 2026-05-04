"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import MentorBg from "../../Assets/mentor-bg.png";
import DirectorHero from "../DirectorHero";
import {
  directorGlassCard,
  directorGlassCardHover,
  directorInputClass,
  directorPageContainer,
  directorPageRoot,
} from "../directorUi";
import { DirectorFilterSection } from "../ui";
import SearchBar from "@/app/Components/SearchBar";
import { apiGetAllInterests } from "@/app/Services/interests.service";
import { Interest, InterestStatus } from "@/app/Services/types";

function normalizeInterestStatus(raw: unknown): InterestStatus {
  const v = String(raw ?? "")
    .toLowerCase()
    .trim();
  if (v === "new" || v === "pending" || v === "accepted" || v === "rejected") return v;
  return "new";
}

function normalizeInterestRow(item: Interest): Interest {
  const id =
    item._id != null && String(item._id).length > 0
      ? String(item._id)
      : String((item as unknown as { id?: string }).id ?? "");
  return {
    ...item,
    _id: id,
    status: normalizeInterestStatus(item.status),
  };
}

function loadInterestsErrorMessage(err: unknown): string {
  if (!isAxiosError(err)) {
    return "Could not load interests. Check your connection and try again.";
  }
  const status = err.response?.status;
  if (status === 401 || status === 403) {
    return "Session expired or not allowed. Sign in again as a director, then retry.";
  }
  const data = err.response?.data;
  if (data && typeof data === "object" && "message" in data) {
    const m = (data as { message?: string | string[] }).message;
    if (Array.isArray(m) && m[0]) return String(m[0]);
    if (typeof m === "string" && m.trim()) return m;
  }
  return "Could not load interests. Check your connection and try again.";
}

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
  const [selectedCountry, setSelectedCountry] = useState<string>("All");
  const [selectedPastors, setSelectedPastors] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [allInterests, setAllInterests] = useState<Interest[]>([]);

  /** Same approach as CCC-Director-Mobile: load full list once, then filter by tab/search/country client-side. */
  const groupedInterests = useMemo(() => {
    const list = allInterests;
    return {
      new: list.filter(i => i.status === "new"),
      pending: list.filter(i => i.status === "pending"),
      accepted: list.filter(i => i.status === "accepted"),
      rejected: list.filter(i => i.status === "rejected"),
    };
  }, [allInterests]);

  const countryOptions = useMemo(() => {
    const countries = allInterests
      .map(i => i.churchDetails?.[0]?.country)
      .filter((c): c is string => typeof c === "string" && c.trim() !== "");
    const unique = Array.from(new Set(countries));
    return ["All", ...unique.sort((a, b) => a.localeCompare(b))];
  }, [allInterests]);

  const filteredInterests = useMemo(() => {
    const key = activeTab as keyof typeof groupedInterests;
    let list = groupedInterests[key] ?? [];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => {
        const fullName = `${i.firstName ?? ""} ${i.lastName ?? ""}`.toLowerCase();
        const churchCountry = i.churchDetails?.[0]?.country?.toLowerCase() ?? "";
        const title = (i.title ?? "").toLowerCase();
        return (
          fullName.includes(q) ||
          title.includes(q) ||
          churchCountry.includes(q) ||
          (i.email ?? "").toLowerCase().includes(q)
        );
      });
    }

    if (selectedCountry !== "All") {
      list = list.filter(i => i.churchDetails?.[0]?.country === selectedCountry);
    }

    return list;
  }, [activeTab, searchQuery, selectedCountry, groupedInterests]);

  const newCount = groupedInterests.new.length;
  const pendingCount = groupedInterests.pending.length;
  const acceptedCount = groupedInterests.accepted.length;
  const rejectedCount = groupedInterests.rejected.length;


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

  const loadInterests = useCallback(async () => {
    setFetchError(null);
    try {
      setLoading(true);
      const res = await apiGetAllInterests();
      const body = res.data;
      if (body && body.success === false) {
        throw new Error(body.message || "Failed to load interests");
      }
      const raw = body?.data;
      const list = Array.isArray(raw) ? raw : [];
      setAllInterests(
        list
          .map((row) => normalizeInterestRow(row as Interest))
          .filter((row) => row._id.length > 0),
      );
    } catch (error) {
      console.error("Failed to fetch interests", error);
      setFetchError(loadInterestsErrorMessage(error));
      setAllInterests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInterests();
  }, [loadInterests]);


  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Interest received"
        subtitle="Manage new interest submissions and update each applicant’s status."
        image={MentorBg}
      />

      <section className="pb-10">
        <div className={directorPageContainer}>
          <DirectorFilterSection className="!p-6">
            <div className="relative w-full flex-1">
              <SearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search by name, email, or country…"
                variant="dark"
                className="w-full"
              />
            </div>

              <div className="flex flex-wrap justify-center gap-2 md:justify-end">
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
                  className={`relative rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === "accepted"
                      ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/40"
                      : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  Accepted
                  {acceptedCount > 0 && (
                    <span
                      className={`absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full text-[11px] font-bold ${
                        activeTab === "accepted" ? "bg-[#FFD700] text-[#0f4a76]" : "bg-white/20 text-white"
                      }`}
                    >
                      {acceptedCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("rejected")}
                  className={`relative rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === "rejected"
                      ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/40"
                      : "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  Rejected
                  {rejectedCount > 0 && (
                    <span
                      className={`absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full text-[11px] font-bold ${
                        activeTab === "rejected" ? "bg-[#FFD700] text-[#0f4a76]" : "bg-white/20 text-white"
                      }`}
                    >
                      {rejectedCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="relative w-full md:w-auto">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className={`${directorInputClass} appearance-none pr-10 font-semibold`}
                  aria-label="Filter by country"
                >
                  {countryOptions.map(c => (
                    <option key={c} value={c} className="text-black">
                      {c === "All" ? "All countries" : c}
                    </option>
                  ))}
                </select>
                <i className="fa-solid fa-chevron-down pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/50" />
              </div>
          </DirectorFilterSection>

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

          {fetchError && !loading && (
            <div
              className={`mb-6 flex flex-col gap-3 rounded-xl border border-amber-400/40 bg-amber-500/10 p-4 text-amber-50 sm:flex-row sm:items-center sm:justify-between ${directorGlassCard}`}
              role="alert"
            >
              <p className="text-sm">{fetchError}</p>
              <button
                type="button"
                onClick={() => void loadInterests()}
                className="shrink-0 rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15"
              >
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredInterests.map((interest) => {
                  const rowId = interest._id;
                  return (
                  <div
                    key={rowId}
                    className={`relative p-6 transition-all ${directorGlassCard} ${directorGlassCardHover}`}
                  >
                    {/* <div className="absolute right-4 top-4">
                      <input
                        type="checkbox"
                        checked={selectedPastors.includes(rowId)}
                        onChange={() => handleToggleSelect(rowId)}
                        className="h-5 w-5 cursor-pointer accent-[#8ec5eb]"
                      />
                    </div> */}

                    {/* //checkbox for accepted */}
                    {/* {activeTab === "accepted" && (
  <div className="absolute right-4 top-4">
    <input
      type="checkbox"
      checked={selectedPastors.includes(rowId)}
      onChange={() => handleToggleSelect(rowId)}
      className="h-5 w-5 cursor-pointer accent-[#8ec5eb]"
    />
  </div>
)} */}

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
                      {/* <div className="flex items-center gap-4 text-[18px] text-white/55">
                        <button type="button" className="hover:text-[#8ec5eb]" aria-label="Email">
                          <i className="fa-regular fa-envelope" />
                        </button>
                        <button type="button" className="hover:text-[#8ec5eb]" aria-label="Chat">
                          <i className="fa-regular fa-comment" />
                        </button>
                        <button type="button" className="hover:text-[#8ec5eb]" aria-label="Call">
                          <i className="fa-solid fa-phone" />
                        </button>
                      </div> */}
                      <div className="flex items-center gap-4 text-[18px] text-white/55">
  <button
    type="button"
    className="hover:text-[#8ec5eb]"
    aria-label={`Email ${interest.email}`}
    onClick={() => {
      if (!interest.email) return;

      const subject = encodeURIComponent("Community Change Interest Form");
      window.location.href = `mailto:${interest.email}?subject=${subject}`;
    }}
  >
    <i className="fa-regular fa-envelope" />
  </button>

  <button
    type="button"
    disabled
    className="cursor-not-allowed opacity-40"
    aria-label="Chat disabled"
    title="Chat disabled"
  >
    <i className="fa-regular fa-comment" />
  </button>

  <button
    type="button"
    disabled
    className="cursor-not-allowed opacity-40"
    aria-label="Call disabled"
    title="Call disabled"
  >
    <i className="fa-solid fa-phone" />
  </button>
</div>

                      <button
                        type="button"
                        onClick={() => router.push(`/director/interest-list/${rowId}`)}
                        className="whitespace-nowrap rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
                })}
              </div>

              {filteredInterests.length === 0 && !fetchError && (
                <div className="py-12 text-center">
                  <i className="fa-solid fa-search mb-4 text-6xl text-white/20" />
                  <p className="text-[16px] text-white/55">
                    {allInterests.length === 0
                      ? "No interests yet, or adjust filters / search."
                      : "No interests match the current tab, search, or country filter."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
