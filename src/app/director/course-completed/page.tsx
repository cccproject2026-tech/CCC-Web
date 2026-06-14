"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import SearchBar from "@/app/Components/SearchBar";
import MentorBg from "../../Assets/mentor-bg.png";
import DirectorHero from "../DirectorHero";
import { directorGlassCard, directorPageRoot } from "../directorUi";
import Mentor1 from "../../Assets/mentor1.png";
import Mentor2 from "../../Assets/mentor2.png";
import Mentor3 from "../../Assets/mentor3.png";
import { Mentee } from "../mentees/page";
import { apiGetAllUsers } from "@/app/Services/users.service";
import {
  apiGetUserCertificate,
  hasRealCertificate,
  unwrapCertificate,
  type CertificateRecord,
} from "@/app/Services/certificates.service";

interface Person {
  id: number;
  name: string;
  role: string;
  img: any;
  isNew?: boolean;
  status?: "completed" | "certificate_issued" | "invited";
  response?: "Accepted" | "Waiting" | "Not Interested" | null;
  invitationDate?: string | null;
}

type SortOption = {
  value: string;
  label: string;
};

interface CourseUser {
  id: string;
  name: string;
  img: any;
  createdAt: string;
  status: "completed" | "certificate_issued" | "invited";
  invitationDate?: string;
  response?: "Accepted" | "Waiting" | "Not Interested";
  isNew?: boolean;
  hasCompleted: boolean;
  hasRealCertificate: boolean;
  certificate: CertificateRecord | null;
  fieldMentorInvitation?: any;
}
function getInitialsAvatar(name: string, fallback = "User") {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    name || fallback
  )}&background=173653&color=ffffff`;
}
export default function CourseCompletedPage() {
  const [users, setUsers] = useState<CourseUser[]>([]);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "completed" | "certificate_issued" | "invited"
  >("completed");

  const [sortBy, setSortBy] = useState("latest_completed");
  const [query, setQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await apiGetAllUsers({
          role: "pastor",
          search: query || undefined,
          limit: 1000,
        });

        const rawUsers = res.data.data.users as any[];
        const usersExposeCertificateData = rawUsers.some(
          (u) =>
            "certificate" in u ||
            "certificates" in u ||
            "certificateId" in u ||
            "certificateUrl" in u ||
            "pdfUrl" in u,
        );

        const mapped = await Promise.all(
          
          rawUsers.map(async (u: any): Promise<CourseUser | null> => {
            if (String(u.id ?? u._id) === "6a16f84e20398e8c5c5167f7") {
  console.log("Course completed Henry check:", {
    id: u.id ?? u._id,
    name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim(),
    hasCompleted: u.hasCompleted,
    completedAt: u.completedAt,
    status: u.status,
    progress: u.progress,
    overallProgress: u.overallProgress,
    hasIssuedCertificate: u.hasIssuedCertificate,
    certificate: u.certificate,
    raw: u,
  });
}
            let certificate = unwrapCertificate(u);
            if (u.hasCompleted && !usersExposeCertificateData) {
              try {
                certificate = unwrapCertificate(
                  await apiGetUserCertificate(String(u.id ?? u._id)),
                );
              } catch {
                certificate = null;
              }
            }
            
            const hasCertificate = hasRealCertificate(certificate);
            let status: CourseUser["status"] | null = null;

            if (u.fieldMentorInvitation) status = "invited";
            else if (hasCertificate) status = "certificate_issued";
            else if (u.hasCompleted) status = "completed";

            if (!status) return null;

            return {
              id: u.id ?? u._id,
              name: `${u.firstName} ${u.lastName}`,
              // img: u.profilePicture || [Mentor1, Mentor2, Mentor3][i % 3],
              hasCompleted: Boolean(u.hasCompleted),
              hasRealCertificate: hasCertificate,
              certificate,
fieldMentorInvitation: u.fieldMentorInvitation,
              img:
  String(u.profilePicture || "").trim() ||
  getInitialsAvatar(`${u.firstName || ""} ${u.lastName || ""}`.trim(), "Pastor"),
              createdAt: u.createdAt,
              status,
              invitationDate: u.fieldMentorInvitation?.invitedAt
                ? new Date(u.fieldMentorInvitation.invitedAt).toLocaleDateString()
                : undefined,
              response: u.fieldMentorInvitation ? "Waiting" : undefined,
            };
          }),
        );

        setUsers(mapped.filter((user): user is CourseUser => user !== null));
      } catch (e) {
        console.error("Failed to fetch users", e);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [query]);


  const data = useMemo(() => {
  return users.filter((u: any) => {
    const matchesSearch = u.name.toLowerCase().includes(query.toLowerCase());

  if (activeTab === "completed") {
  return matchesSearch && u.hasCompleted;
}
    if (activeTab === "certificate_issued") {
      return matchesSearch && u.hasRealCertificate;
    }

    if (activeTab === "invited") {
      return matchesSearch && Boolean(u.fieldMentorInvitation);
    }

    return false;
  });
}, [users, activeTab, query]);

 const completedCount = users.filter(
  (u) => u.hasCompleted
).length;

  const issuedCount = users.filter(
    (u) => u.status === "certificate_issued"
  ).length;

  const invitedCount = users.filter(
    (u) => u.status === "invited"
  ).length;

  const finalData = useMemo(() => {
    const list = [...data];

    if (sortBy === "latest_completed" || sortBy === "latest_issued") {
      return list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );
    }

    if (sortBy === "oldest_completed" || sortBy === "oldest_issued") {
      return list.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() -
          new Date(b.createdAt).getTime()
      );
    }

    if (sortBy === "accepted") {
      return list.filter((u) => u.response === "Accepted");
    }

    if (sortBy === "waiting") {
      return list.filter((u) => u.response === "Waiting");
    }

    return list;
  }, [data, sortBy]);

  // Sort options based on active tab
  const getSortOptions = (): SortOption[] => {
    if (activeTab === "completed") {
      return [
        { value: "latest_completed", label: "Latest Completed" },
        { value: "oldest_completed", label: "Oldest Completed" },
        { value: "state", label: "State" },
        { value: "conference", label: "Conference" },
        { value: "clear_slot", label: "Clear Slot" },
      ];
    } else if (activeTab === "certificate_issued") {
      return [
        { value: "latest_issued", label: "Latest Issued" },
        { value: "oldest_issued", label: "Oldest Issued" },
        { value: "state", label: "State" },
        { value: "conference", label: "Conference" },
        { value: "clear_slot", label: "Clear Slot" },
      ];
    } else {
      return [
        { value: "accepted", label: "Accepted" },
        { value: "waiting", label: "Waiting for Response" },
        { value: "not_interested", label: "Not Interested" },
        { value: "state", label: "State" },
        { value: "conference", label: "Conference" },
        { value: "clear_slot", label: "Clear Slot" },
      ];
    }
  };

  // Update sort when tab changes
  const handleTabChange = (
    tab: "completed" | "certificate_issued" | "invited"
  ) => {
    setActiveTab(tab);
    if (tab === "completed") {
      setSortBy("latest_completed");
    } else if (tab === "certificate_issued") {
      setSortBy("latest_issued");
    } else {
      setSortBy("waiting");
    }
  };



  const handleIssueCertificate = (id: number) => {
    setToast("Certificate Issued Successfully");
    setTimeout(() => setToast(null), 3000);
  };

  const handleInvite = (id: number) => {
    setToast("Invited to be a Field Mentor Successfully");
    setTimeout(() => setToast(null), 3000);
  };

  const sortOptions = getSortOptions();
  const currentSortLabel =
    sortOptions.find((opt) => opt.value === sortBy)?.label ||
    sortOptions[0].label;

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title={
          activeTab === "invited"
            ? "Invite to be a Field Mentor"
            : "Course Completed"
        }
        subtitle="Course completion and field mentor invitations."
        image={MentorBg}
      />

      <section className="relative py-8">
        <div className="mx-auto flex max-w-[1400px] flex-col items-start justify-between gap-6 lg:flex-row lg:items-start">
          <div className="w-full lg:w-[380px]">
            <SearchBar value={query} onChange={setQuery} placeholder="Search" className="w-full" variant="dark" />
          </div>

          <div className="flex w-full flex-col items-stretch gap-4 lg:w-auto lg:items-end">
            <div className={`flex flex-wrap gap-2 rounded-xl p-2 ${directorGlassCard}`}>
              <button
                type="button"
                onClick={() => handleTabChange("completed")}
                className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-5 py-2.5 text-[14px] font-semibold transition-all ${
                  activeTab === "completed"
                    ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <span>Completed</span>
                {activeTab === "completed" && completedCount > 0 && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FFD700] text-[11px] font-bold text-[#0f4a76]">
                    {completedCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("certificate_issued")}
                className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-[14px] font-semibold transition-all ${
                  activeTab === "certificate_issued"
                    ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Certificate Issued
              </button>
              <button
                type="button"
                onClick={() => handleTabChange("invited")}
                className={`whitespace-nowrap rounded-lg px-5 py-2.5 text-[14px] font-semibold transition-all ${
                  activeTab === "invited"
                    ? "bg-[#8ec5eb]/25 text-white ring-1 ring-[#8ec5eb]/35"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Invited as Field Mentor
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="whitespace-nowrap text-[15px] font-medium text-white">Sort By</span>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex min-w-[220px] items-center justify-between gap-3 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-[14px] font-medium text-white shadow-md transition hover:bg-white/15"
                >
                  <span>{currentSortLabel}</span>
                  <i className="fa-solid fa-chevron-down text-xs"></i>
                </button>

                {showSortMenu && (
                  <div className="absolute right-0 top-full z-[60] mt-2 min-w-[220px] rounded-xl border border-white/15 bg-[#041f35]/98 py-3 px-2 shadow-2xl backdrop-blur-md">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-left text-[14px] transition-all ${
                          sortBy === option.value
                            ? "bg-[#8ec5eb]/20 font-semibold text-white"
                            : "text-white/80 hover:bg-white/10"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                            sortBy === option.value ? "border-[#8ec5eb] bg-[#8ec5eb]/40" : "border-white/30"
                          }`}
                        >
                          {sortBy === option.value && (
                            <i className="fa-solid fa-check text-[8px] text-white"></i>
                          )}
                        </span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cards Grid */}
      <section className="pb-12 pt-2">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 md:grid-cols-2">
          {finalData.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                No users found
              </h3>
              <p className="text-white/80 text-sm max-w-md">
                {activeTab === "completed" &&
                  "No pastors have completed the course yet."}
                {activeTab === "certificate_issued" &&
                  "No certificates have been issued yet."}
                {activeTab === "invited" &&
                  "No field mentor invitations have been sent yet."}
              </p>
            </div>
          )}

          {finalData.map((p) => (
            <div
              key={p.id}
              className={`flex flex-col gap-4 rounded-xl p-4 ${directorGlassCard} transition-all hover:border-white/25 sm:flex-row sm:items-start sm:gap-5 sm:p-5`}
            >
              {/* Image with relative positioning for "New" badge - Clickable */}
              <Link
                href={`/director/mentees/profile/${p.id}`}
                className="relative w-[120px] h-[120px] overflow-hidden rounded-xl bg-gray-100 flex-shrink-0 cursor-pointer"
              >
                <Image
  src={p.img}
  alt={p.name}
  width={120}
  height={120}
  className="h-full w-full object-cover"
/>
                {p.isNew && (
                  <span className="absolute top-2 left-2 px-2.5 py-1 bg-yellow-400 text-gray-900 rounded-md text-[11px] font-bold shadow-sm">
                    New
                  </span>
                )}
              </Link>

              {/* Content */}
              <div className="flex-1 flex flex-col justify-between min-h-[120px]">
                <div>
                  <Link
                    href={`/director/mentees/profile/${p.id}`}
                    className="mb-1 flex items-center gap-2 transition-opacity hover:opacity-80"
                  >
                    <h3 className="text-[16px] font-bold text-white">
                      {p.name}
                    </h3>
                    <i className="fa-solid fa-circle-check text-sm text-[#8ec5eb]"></i>
                  </Link>
                  <p className="mb-3 text-[13px] leading-relaxed text-white/60">
                    Sub text area write something here. That you can read more
                    about him
                  </p>

                  {activeTab === "invited" && (
                    <div className="text-[12px] text-gray-700 space-y-1 mb-3">
                      <p>
                        <span className="font-semibold">
                          Invitation sent on :
                        </span>{" "}
                        <span className="font-bold">{p.invitationDate}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <span className="font-semibold">Response :</span>
                        <span
                          className={`px-2 py-1 rounded-md text-white text-[11px] font-semibold ${p.response === "Accepted"
                            ? "bg-green-500"
                            : p.response === "Waiting"
                              ? "bg-gray-400"
                              : "bg-red-500"
                            }`}
                        >
                          {p.response}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-4 text-[17px] text-[#8ec5eb]">
                  <button className="hover:opacity-70 transition">
                    <i className="fa-regular fa-envelope"></i>
                  </button>
                  <button className="hover:opacity-70 transition">
                    <i className="fa-regular fa-comment"></i>
                  </button>
                  <button className="hover:opacity-70 transition">
                    <i className="fa-brands fa-whatsapp"></i>
                  </button>
                  <button className="hover:opacity-70 transition">
                    <i className="fa-solid fa-phone"></i>
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="self-end flex-shrink-0">
                {activeTab === "completed" && (
                <Link
  href={`/director/mentees/profile/${p.id}?issueCertificate=1`}
  className="whitespace-nowrap rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/20 px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#8ec5eb]/30"
>
  Issue Certificate
</Link>
                )}
              {activeTab === "certificate_issued" && (
  p.fieldMentorInvitation ? (
    <button
      type="button"
      disabled
      className="whitespace-nowrap rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/20 px-4 py-2.5 text-[13px] font-semibold text-white opacity-50 cursor-not-allowed"
    >
      Invitation sent
    </button>
  ) : (
    <Link
      href={`/director/mentees/profile/${p.id}`}
      className="whitespace-nowrap rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/20 px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#8ec5eb]/30"
    >
      Invite as Field Mentor
    </Link>
  )
)}
                {/* {activeTab === "invited" && (
                  <button
                    type="button"
                    className="whitespace-nowrap rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/20 px-4 py-2.5 text-[13px] font-semibold text-white transition-all hover:bg-[#8ec5eb]/30"
                  >
                    Invite as Field Mentor
                  </button>
                )} */}
                {activeTab === "invited" && (
  <button
    type="button"
    disabled
    className="whitespace-nowrap rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/20 px-4 py-2.5 text-[13px] font-semibold text-white opacity-50 cursor-not-allowed"
  >
    Invitation sent
  </button>
)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-in">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl flex items-center gap-3 border border-gray-100">
            <i className="fa-solid fa-circle-check text-green-500 text-xl"></i>
            <span className="text-[#2E3B8E] font-semibold text-[15px]">
              {toast}
            </span>
          </div>
        </div>
      )}

      {/* Click outside to close sort menu */}
      {showSortMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowSortMenu(false)}
        ></div>
      )}
    </div>
  );
}
