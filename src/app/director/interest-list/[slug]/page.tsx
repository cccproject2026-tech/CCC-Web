"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";

import DirectorHero from "../../DirectorHero";
import MentorBg from "../../../Assets/mentor-bg.png";
import Mentor1 from "../../../Assets/mentor1.png";
import { apiGetInterestById, apiUpdateInterestStatus } from "@/app/Services/interests.service";
import {
  apiAssignUsers,
  apiGetAllUsers,
  apiGetAssignedUsers,
} from "@/app/Services/users.service";
import type { ChurchDetails } from "@/app/Services/types/interests.types";
import type { Interest } from "@/app/Services/types";
import { directorGlassCard, directorPageRoot } from "../../directorUi";

function formatChurchLocation(c: ChurchDetails | undefined): string {
  if (!c) return "—";
  const parts = [c.city, c.state, c.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function statusBadgeClass(status: Interest["status"]): string {
  switch (status) {
    case "new":
      return "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/35";
    case "pending":
      return "bg-amber-500/20 text-amber-100 ring-1 ring-amber-400/35";
    case "accepted":
      return "bg-sky-500/20 text-sky-100 ring-1 ring-sky-400/35";
    case "rejected":
      return "bg-red-500/20 text-red-100 ring-1 ring-red-400/35";
    default:
      return "bg-white/10 text-white/80 ring-1 ring-white/15";
  }
}

function normalizeInterestsList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

const panelInner = "p-5 sm:p-6";

export default function InterestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug;

  const [activeTab, setActiveTab] = useState<"details" | "interests" | "history">("details");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showAcceptedModal, setShowAcceptedModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

const [assignUsers, setAssignUsers] = useState<any[]>([]);
const [assignLoading, setAssignLoading] = useState(false);
const [selectedAssignUserId, setSelectedAssignUserId] = useState<string>("");
const [assignError, setAssignError] = useState<string | null>(null);
const [hasAssignedMentor, setHasAssignedMentor] = useState(false);
const [assignSearch, setAssignSearch] = useState("");

  const [interestData, setInterestData] = useState<Interest | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const fetchInterest = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const res = await apiGetInterestById(slug as string);
        const data = res.data?.data;
        if (!data) {
          setLoadError("Interest not found.");
          setInterestData(null);
          return;
        }
        setInterestData(data);
      } catch (err) {
        console.error("Failed to fetch interest", err);
        setLoadError("Could not load this interest. Try again or return to the list.");
        setInterestData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchInterest();
  }, [slug]);


useEffect(() => {
  if (!interestData?.userId) return;

  const userId = String(interestData.userId);

  const checkAssignedMentor = async () => {
    try {
      const res = await apiGetAssignedUsers(userId);
      const assignedUsers = Array.isArray(res?.data?.data) ? res.data.data : [];

      const hasMentor = assignedUsers.some((user: any) => {
        const role = String(
          user?.role ??
            user?.assignedUser?.role ??
            user?.user?.role ??
            ""
        )
          .toLowerCase()
          .trim();

        return role === "mentor";
      });

      setHasAssignedMentor(hasMentor);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.error("Failed to check assigned mentor", error);
      }

      setHasAssignedMentor(false);
    }
  };

  checkAssignedMentor();
}, [interestData?.userId]);

    const isMentorInterest = String(interestData?.title ?? "")
    .toLowerCase()
    .includes("mentor");

  useEffect(() => {
    if (!showAssignModal) return;

    const loadAssignUsers = async () => {
      try {
        setAssignLoading(true);
        setAssignError(null);
        setSelectedAssignUserId("");

        const roleToFetch = isMentorInterest ? "pastor" : "mentor";

        const res = await apiGetAllUsers({
          role: roleToFetch,
          roleMatch: "mixed",
          page: 1,
          limit: 50,
          t: Date.now(),
        });

        const data: any = res.data?.data;

        const users = Array.isArray(data)
          ? data
          : Array.isArray(data?.users)
            ? data.users
            : Array.isArray(data?.data)
              ? data.data
              : [];

        setAssignUsers(users);
      } catch (error) {
        console.error("Failed to load assign users", error);
        setAssignUsers([]);
        setAssignError(
          isMentorInterest ? "Could not load pastors." : "Could not load mentors."
        );
      } finally {
        setAssignLoading(false);
      }
    };

    loadAssignUsers();
  }, [showAssignModal, isMentorInterest]);


const handleAssign = async () => {
  if (!interestData?.userId) {
    setToast("Missing user id — cannot assign.");
    setTimeout(() => setToast(null), 3000);
    return;
  }

  if (!selectedAssignUserId) {
    setToast(
      isMentorInterest
        ? "Please select a pastor to assign."
        : "Please select a mentor to assign."
    );
    setTimeout(() => setToast(null), 3000);
    return;
  }

  try {
    await apiAssignUsers(interestData.userId, [selectedAssignUserId]);

    setAssignSearch("");
    setShowAssignModal(false);
    setToast(assignSuccessMessage);

    setTimeout(() => {
      router.push("/director/interest-list");
    }, 1200);
  } catch (error) {
    console.error("Failed to assign user", error);
    setToast("Failed to assign. Please try again.");
    setTimeout(() => setToast(null), 3000);
  }
};



  const handleReject = async () => {
  if (!interestData?.userId) {
    setToast("Missing user id — cannot reject.");
    setTimeout(() => setToast(null), 3000);
    return;
  }

  const applicantName =
    `${interestData.firstName ?? ""} ${interestData.lastName ?? ""}`.trim() ||
    interestData.email ||
    "Applicant";

  try {
    await apiUpdateInterestStatus(interestData.userId, "rejected");

    setInterestData({ ...interestData, status: "rejected" as const });
    setShowRejectModal(false);
    setToast(`${applicantName} has been rejected.`);

    setTimeout(() => {
      router.push("/director/interest-list");
    }, 1800);
  } catch (error) {
    console.error("Failed to reject interest", error);
    setToast("Failed to reject interest");
    setTimeout(() => setToast(null), 3000);
  }
};

  const handlePending = async () => {
  if (!interestData?.userId) {
    setToast("Missing user id — cannot move to pending.");
    setTimeout(() => setToast(null), 3000);
    return;
  }

  try {
    await apiUpdateInterestStatus(interestData.userId, "pending");

    setInterestData({ ...interestData, status: "pending" as const });
    setToast("Interest moved to pending successfully");
    setTimeout(() => setToast(null), 3000);
  } catch (error) {
    console.error("Failed to move interest to pending", error);
    setToast("Failed to move interest to pending");
    setTimeout(() => setToast(null), 3000);
  }
};

  const handleAccept = async () => {
    if (!interestData?.userId) {
      setToast("Missing user id — cannot accept.");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    try {
  await apiUpdateInterestStatus(interestData.userId, "accepted");

  const updatedInterest = {
    ...interestData,
    status: "accepted" as const,
  };

  setInterestData(updatedInterest);
  setToast("Interest accepted successfully. Please continue with assignment.");

  setShowAcceptedModal(true);
  setTimeout(() => setToast(null), 3000);
} catch (error) {
  console.error("Failed to accept interest", error);
  setToast("Failed to accept interest");
  setTimeout(() => setToast(null), 3000);
}
  };

  if (loading) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero title="Interest details" subtitle="Loading…" image={MentorBg} />
        <section className="flex flex-1 items-center justify-center px-4 py-16">
          <div className={`${directorGlassCard} w-full max-w-lg px-8 py-12 text-center`}>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-[#8ec5eb]" />
            <p className="text-sm text-[#cde2f2]">Loading interest details…</p>
          </div>
        </section>
        {/* <AppFooter /> */}
      </div>
    );
  }

  if (loadError || !interestData) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero title="Interest details" subtitle="Something went wrong" image={MentorBg} />
        <section className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16">
          <div className={`${directorGlassCard} w-full max-w-lg px-8 py-8 text-center`}>
            <p className="text-[#ffb2b2]">{loadError ?? "Not found."}</p>
            <button
              type="button"
              onClick={() => router.push("/director/interest-list")}
              className="mt-6 rounded-xl border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Back to interest list
            </button>
          </div>
        </section>
        {/* <AppFooter /> */}
      </div>
    );
  }

  const church = interestData.churchDetails?.[0];

  
  const interestsList = normalizeInterestsList(interestData.interests);
  const fullName = `${interestData.firstName} ${interestData.lastName}`.trim();


const assignButtonLabel = isMentorInterest ? "Assign to Mentee" : "Assign to Mentor";
const canShowAssignButton =
  (interestData.status === "accepted" || interestData.status === "pending") &&
  !hasAssignedMentor;
const assignSuccessMessage = isMentorInterest
  ? "Interest assigned to mentee successfully"
  : "Interest assigned to mentor successfully";
const assignModalTitle = isMentorInterest ? "Assign to mentee" : "Assign to mentor";
const assignModalDescription = isMentorInterest
  ? "Select a mentee to assign this interest to."
  : "Select a mentor to assign this interest to.";
  const churches = interestData.churchDetails ?? [];
  const normalizedAssignSearch = assignSearch.trim().toLowerCase();
  const filteredAssignUsers = normalizedAssignSearch
    ? assignUsers.filter((user) => {
        const firstName = String(user?.firstName ?? "").trim().toLowerCase();
        const lastName = String(user?.lastName ?? "").trim().toLowerCase();
        const fullName = `${firstName} ${lastName}`.trim();
        const name = String(user?.name ?? "").trim().toLowerCase();
        const email = String(user?.email ?? "").trim().toLowerCase();
        const phoneNumber = String(user?.phoneNumber ?? "").trim().toLowerCase();
        const role = String(user?.role ?? "").trim().toLowerCase();

        return [fullName, name, email, phoneNumber, role].some((field) =>
          field.includes(normalizedAssignSearch)
        );
      })
    : assignUsers;

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title="Interest details"
        subtitle={`${fullName} · ${interestData.title ?? "—"}`}
        image={MentorBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "New interests", href: "/director/interest-list" },
          { label: fullName || "Detail" },
        ]}
      />

      <section className="flex-1 pb-10">
        <div className="mx-auto max-w-[1400px]">
          <button
            type="button"
            onClick={() => router.push("/director/interest-list")}
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <i className="fa-solid fa-arrow-left text-xs" />
            Back to list
          </button>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
            {/* Profile column */}
            <div className="lg:col-span-1">
              <div className={`${directorGlassCard} sticky top-4`}>
                <div className={panelInner}>
                  <div className="mx-auto mb-5 flex h-28 w-28 shrink-0 overflow-hidden rounded-full border border-white/20 bg-white/5 ring-2 ring-[#8ec5eb]/25">
                    {interestData.profilePicture ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={interestData.profilePicture}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Image
                        src={Mentor1}
                        alt=""
                        width={112}
                        height={112}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="mb-5 text-center">
                    <h2 className="text-xl font-semibold text-white">{fullName}</h2>
                    <p className="mt-1 text-sm text-[#cde2f2]">{interestData.title ?? "—"}</p>
                    <span
                      className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusBadgeClass(interestData.status)}`}
                    >
                      {interestData.status}
                    </span>
                  </div>

                  <dl className="space-y-3 border-t border-white/10 pt-5 text-sm">
                    <div className="flex gap-3">
                      <i className="fa-solid fa-envelope mt-0.5 w-5 text-center text-[#8ec5eb]" />
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#8ec5eb]/80">
                          Email
                        </dt>
                        <dd className="break-all text-[#d9ebf8]">{interestData.email}</dd>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <i className="fa-solid fa-phone mt-0.5 w-5 text-center text-[#8ec5eb]" />
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#8ec5eb]/80">
                          Phone
                        </dt>
                        <dd className="text-[#d9ebf8]">{interestData.phoneNumber ?? "—"}</dd>
                      </div>
                    </div>
                    {/* <div className="flex gap-3">
                      <i className="fa-solid fa-church mt-0.5 w-5 text-center text-[#8ec5eb]" />
                      <div>
                        <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#8ec5eb]/80">
                          Church
                        </dt>
                        <dd className="text-[#d9ebf8]">{church?.churchName ?? "—"}</dd>
                        <dd className="mt-0.5 text-xs text-[#cde2f2]/90">
                          {formatChurchLocation(church)}
                        </dd>
                        {church?.churchAddress ? (
                          <dd className="mt-1 text-xs text-white/55">{church.churchAddress}</dd>
                        ) : null}
                      </div>
                    </div> */}
<div className="flex gap-3">
  <i className="fa-solid fa-church mt-0.5 w-5 text-center text-[#8ec5eb]" />
  <div className="min-w-0 flex-1">
    <dt className="text-[11px] font-semibold uppercase tracking-wide text-[#8ec5eb]/80">
      Church Information
    </dt>

    {churches.length > 0 ? (
      <div className="mt-2 space-y-3">
        {churches.map((church, index) => (
          <div
            key={`${church.churchName}-${index}`}
            className="border-b border-white/10 pb-3 last:border-b-0 last:pb-0"
          >
            <dd className="text-[#d9ebf8]">
              {church.churchName || `Church ${index + 1}`}
            </dd>

            <dd className="mt-0.5 text-xs text-[#cde2f2]/90">
              {formatChurchLocation(church)}
            </dd>

            {church.churchAddress ? (
              <dd className="mt-1 text-xs text-white/55">
                {church.churchAddress}
              </dd>
            ) : null}

            {church.churchPhone ? (
              <dd className="mt-1 text-xs text-white/55">
                Phone: {church.churchPhone}
              </dd>
            ) : null}

            {church.zipCode ? (
              <dd className="mt-1 text-xs text-white/55">
                Zip Code: {church.zipCode}
              </dd>
            ) : null}

            {church.churchWebsite ? (
              <dd className="mt-1 break-all text-xs text-white/55">
                {church.churchWebsite}
              </dd>
            ) : null}
          </div>
        ))}
      </div>
    ) : (
      <dd className="text-[#d9ebf8]">—</dd>
    )}
  </div>
</div>


                  </dl>

                  <div className="mt-6 space-y-2 border-t border-white/10 pt-6">
                 
                    <button
                      type="button"
                      onClick={handleAccept}
                      disabled={interestData.status === "accepted"}
                      className="w-full rounded-xl border border-emerald-400/40 bg-emerald-500/20 py-3 text-sm font-semibold text-emerald-100 transition hover:bg-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Accept interest
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectModal(true)}
                      disabled={interestData.status === "rejected"}
                      className="w-full rounded-xl border border-red-400/40 bg-red-500/15 py-3 text-sm font-semibold text-red-100 transition hover:bg-red-500/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Reject interest
                    </button>
                    <button
  type="button"
  onClick={handlePending}
  disabled={interestData.status === "pending"}
  className="w-full rounded-xl border border-amber-400/40 bg-amber-500/20 py-3 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-50"
>
  Add to pending
</button>

{/* <button
  type="button"
  onClick={() => {
    setSelectedAssignUserId("");
    setAssignError(null);
    setShowAssignModal(true);
  }}
  className="mx-auto mt-3 flex w-fit items-center justify-center gap-2 rounded-lg border border-[#8ec5eb]/45 bg-[#8ec5eb]/15 px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/25"
>
  <i className="fa-solid fa-user-plus text-[11px]" />
  {assignButtonLabel}
</button> */}
{/* {interestData.status === "accepted" && ( */}
{canShowAssignButton && (
  <button
    type="button"
    onClick={() => {
      setSelectedAssignUserId("");
      setAssignError(null);
      setAssignSearch("");
      setShowAssignModal(true);
    }}
    className="mx-auto mt-3 flex w-fit items-center justify-center gap-2 rounded-lg border border-[#8ec5eb]/45 bg-[#8ec5eb]/15 px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/25"
  >
    <i className="fa-solid fa-user-plus text-[11px]" />
    {assignButtonLabel}
  </button>
)}
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="lg:col-span-2">
              <div className={`${directorGlassCard} overflow-hidden`}>
                <div className="flex flex-wrap gap-0 border-b border-white/10">
                  {(
                    [
                      ["details", "Details"],
                      ["interests", "Interests & goals"],
                      ["history", "History"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id)}
                      className={`min-w-[120px] flex-1 px-4 py-3.5 text-sm font-semibold transition sm:px-6 ${
                        activeTab === id
                          ? "border-b-2 border-[#8ec5eb] bg-white/5 text-white"
                          : "text-[#cde2f2]/80 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className={panelInner}>
                  {activeTab === "details" && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#8ec5eb]">
                          Ministry information
                        </h3>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <div className="rounded-xl border border-white/10 bg-[#041f35]/40 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8ec5eb]/80">
                              Years in ministry
                            </p>
                            <p className="mt-1 text-sm text-[#d9ebf8]">
                              {interestData.yearsInMinistry ?? "—"}
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-[#041f35]/40 px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8ec5eb]/80">
                              Conference
                            </p>
                            <p className="mt-1 text-sm text-[#d9ebf8]">{interestData.conference ?? "—"}</p>
                          </div>
                        </div>
                      </div>

{/* <div>
  <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#8ec5eb]">
    Church information
  </h3>

  {churches.length > 0 ? (
    <div className="space-y-4">
      {churches.map((church, index) => (
        <div
          key={`${church.churchName}-${index}`}
          className="rounded-xl border border-white/10 bg-[#041f35]/35 px-4 py-3 text-sm text-[#cde2f2]"
        >
          <p className="mb-2 font-semibold text-white">
            Church {index + 1}
          </p>
          <p><span className="text-[#8ec5eb]">Name:</span> {church.churchName || "—"}</p>
          <p><span className="text-[#8ec5eb]">Phone:</span> {church.churchPhone || "—"}</p>
          <p><span className="text-[#8ec5eb]">Website:</span> {church.churchWebsite || "—"}</p>
          <p><span className="text-[#8ec5eb]">Address:</span> {church.churchAddress || "—"}</p>
          <p><span className="text-[#8ec5eb]">City:</span> {church.city || "—"}</p>
          <p><span className="text-[#8ec5eb]">State:</span> {church.state || "—"}</p>
          <p><span className="text-[#8ec5eb]">Zip Code:</span> {church.zipCode || "—"}</p>
          <p><span className="text-[#8ec5eb]">Country:</span> {church.country || "—"}</p>
        </div>
      ))}
    </div>
  ) : (
    <p className="rounded-xl border border-white/10 bg-[#041f35]/35 px-4 py-3 text-sm text-[#cde2f2]">
      —
    </p>
  )}
</div> */}





                      <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#8ec5eb]">
                          Current community projects
                        </h3>
                        <p className="rounded-xl border border-white/10 bg-[#041f35]/35 px-4 py-3 text-sm leading-relaxed text-[#cde2f2]">
                          {interestData.currentCommunityProjects?.trim() || "—"}
                        </p>
                      </div>

                      <div>
                        <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#8ec5eb]">
                          Comments
                        </h3>
                        <p className="rounded-xl border border-white/10 bg-[#041f35]/35 px-4 py-3 text-sm leading-relaxed text-[#cde2f2]">
                          {interestData.comments?.trim() || "—"}
                        </p>
                      </div>

                      {interestData.profileInfo?.trim() ? (
                        <div>
                          <h3 className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#8ec5eb]">
                            Profile notes
                          </h3>
                          <p className="rounded-xl border border-white/10 bg-[#041f35]/35 px-4 py-3 text-sm leading-relaxed text-[#cde2f2]">
                            {interestData.profileInfo}
                          </p>
                        </div>
                      ) : null}
                    </div>
                  )}

                  {activeTab === "interests" && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#8ec5eb]">
                          Selected interests
                        </h3>
                        {interestsList.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {interestsList.map((item) => (
                              <span
                                key={item}
                                className="rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 px-3 py-1.5 text-sm font-medium text-[#d9ebf8]"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-white/55">No interest tags submitted.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === "history" && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[#8ec5eb]">
                          Timeline
                        </h3>
                        <ul className="space-y-4">
                          <li className="flex gap-4">
                            <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.2)]" />
                            <div>
                              <p className="font-medium text-white">Interest submitted</p>
                              <p className="text-sm text-[#cde2f2]/80">
                                {new Date(interestData.createdAt).toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })}
                              </p>
                            </div>
                          </li>
                          <li className="flex gap-4">
                            <span
                              className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${
                                interestData.status !== "new" ? "bg-[#8ec5eb]" : "bg-white/25"
                              }`}
                            />
                            <div>
                              <p className="font-medium text-white">Review</p>
                              <p className="text-sm text-[#cde2f2]/80">
                                {interestData.status === "new" ? "Awaiting review" : `Status: ${interestData.status}`}
                              </p>
                            </div>
                          </li>
                        </ul>
                      </div>
                      {interestData.updatedAt ? (
                        <p className="text-xs text-white/45">
                          Last updated{" "}
                          {new Date(interestData.updatedAt).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* {toast ? (
        <div className="fixed right-4 top-20 z-[60] max-w-sm sm:right-8">
          <div
            className={`${directorGlassCard} flex items-center gap-3 px-5 py-3 text-sm font-medium text-white shadow-2xl`}
          >
            <i className="fa-solid fa-circle-check text-emerald-300" />
            {toast}
          </div>
        </div>
      ) : null} */}
      {toast ? (
  <div className="fixed left-1/2 top-24 z-[100] -translate-x-1/2 max-w-sm px-4">
    <div
      className={`${directorGlassCard} flex items-center gap-3 px-5 py-3 text-sm font-semibold text-white shadow-2xl`}
    >
      <i
        className={
          toast.toLowerCase().includes("rejected")
            ? "fa-solid fa-circle-xmark text-red-300"
            : "fa-solid fa-circle-check text-emerald-300"
        }
      />
      {toast}
    </div>
  </div>
) : null}

      {showAcceptedModal ? (
  <div
    className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
  >
    <div className={`${directorGlassCard} w-full max-w-md overflow-hidden`}>
      <div className="p-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white">
          <i className="fa-solid fa-check text-2xl" />
        </div>

        <h3 className="text-lg font-semibold text-white">
          Interest Form Accepted!
        </h3>

        <p className="mt-2 text-sm text-[#cde2f2]/90">
          Log-in credentials have been sent to respective email ID
        </p>

        <div className="mt-6 flex gap-3">
          {/* <button
            type="button"
            onClick={() => setShowAcceptedModal(false)}
            className="flex-1 rounded-xl border border-white/20 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
          >
            Later
          </button> */}
          <button
  type="button"
  onClick={() => {
    setShowAcceptedModal(false);
    router.push("/director/interest-list");
  }}
  className="flex-1 rounded-xl border border-white/20 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
>
  Later
</button>

          <button
            type="button"
            onClick={() => {
              setShowAcceptedModal(false);
              setAssignSearch("");
              setShowAssignModal(true);
            }}
            className="flex-1 rounded-xl border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
          >
            {assignButtonLabel}
          </button>
        </div>
      </div>
    </div>
  </div>
) : null}

      {showAssignModal ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="assign-title"
        >
          <div className={`${directorGlassCard} w-full max-w-md overflow-hidden`}>
            <div className={panelInner}>
              {/* <h3 id="assign-title" className="text-lg font-semibold text-white">
                Assign to mentor
              </h3>
              <p className="mt-2 text-sm text-[#cde2f2]/90">
                Select a mentor to assign this interest to.
              </p> */}
<h3 id="assign-title" className="text-lg font-semibold text-white">
  {assignModalTitle}
</h3>
<p className="mt-2 text-sm text-[#cde2f2]/90">
  {assignModalDescription}
</p>

<input
  type="text"
  value={assignSearch}
  onChange={(e) => setAssignSearch(e.target.value)}
  placeholder={isMentorInterest ? "Search pastors" : "Search mentors"}
  className="mt-5 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/45 outline-none transition focus:border-[#8ec5eb]/50 focus:bg-white/10"
/>

<div className="mt-4 max-h-72 space-y-2 overflow-y-auto pr-1">
  {assignLoading ? (
    <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-[#cde2f2]/80">
      {isMentorInterest ? "Loading pastors…" : "Loading mentors…"}
    </p>
  ) : assignError ? (
    <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-3 text-sm text-red-100">
      {assignError}
    </p>
  ) : filteredAssignUsers.length > 0 ? (
    filteredAssignUsers.map((user) => {
      const userId = String(user._id ?? user.id ?? "");
      const fullName =
        `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
        user.name ||
        user.email ||
        "Unnamed user";

      return (
        <label
          key={userId}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/15 bg-white/5 px-3 py-3 transition hover:bg-white/10"
        >
          {/* <input
            type="radio"
            name="assignUser"
            value={userId}
            checked={selectedAssignUserId === userId}
            onChange={() => setSelectedAssignUserId(userId)}
            className="accent-[#8ec5eb]"
          />
          <div className="min-w-0"> */}
          <input
  type="radio"
  name="assignUser"
  value={userId}
  checked={selectedAssignUserId === userId}
  onChange={() => setSelectedAssignUserId(userId)}
  className="accent-[#8ec5eb]"
/>

{/* <Image
  src={
    user.profilePicture ||
    user.profileImage ||
    user.avatar ||
    Mentor1
  }
  alt={fullName}
  width={38}
  height={38}
  className="h-9 w-9 shrink-0 rounded-full border border-white/15 object-cover"
/> */}
{(() => {
  const rawImage =
    user.profilePicture ||
    user.profileImage ||
    user.avatar ||
    user.user?.profilePicture;

  const imageSrc =
    typeof rawImage === "string" && rawImage.trim()
      ? resolveApiMediaUrl(rawImage.trim()) ?? rawImage.trim()
      : "";

  return imageSrc ? (
    <Image
      src={imageSrc}
      alt={fullName}
      width={38}
      height={38}
      unoptimized={isRemoteImageSrc(imageSrc)}
      className="h-9 w-9 shrink-0 rounded-full border border-white/15 object-cover"
    />
  ) : (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#173653] text-xs font-bold uppercase text-[#8ec5eb]">
      {`${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}` ||
        fullName
          .split(" ")
          .map((part: string) => part[0])
          .join("")
          .slice(0, 2) ||
        "U"}
    </div>
  );
})()}

<div className="min-w-0">
            <p className="truncate font-medium text-white">{fullName}</p>
            <p className="truncate text-xs text-[#cde2f2]/70">
              {user.email ?? (isMentorInterest ? "Pastor" : "Mentor")}
            </p>
          </div>
        </label>
      );
    })
  ) : assignSearch.trim() ? (
    <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-[#cde2f2]/80">
      {isMentorInterest ? "No pastors found." : "No mentors found."}
    </p>
  ) : (
    <p className="rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-[#cde2f2]/80">
      {isMentorInterest ? "No pastors found." : "No mentors found."}
    </p>
  )}
</div>



              <div className="mt-6 flex gap-3">
                {/* <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 rounded-xl border border-white/20 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                >
                  Cancel
                </button> */}
                <button
  type="button"
  onClick={() => {
    setShowAssignModal(false);
    setShowAcceptedModal(true);
  }}
  className="flex-1 rounded-xl border border-white/20 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
>
  Back
</button>
                {/* <button
                  type="button"
                  onClick={handleAssign}
                  className="flex-1 rounded-xl border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
                >
                  Assign
                </button> */}
                <button
  type="button"
  onClick={handleAssign}
  disabled={assignLoading || !selectedAssignUserId}
  className="flex-1 rounded-xl border border-[#8ec5eb]/50 bg-[#8ec5eb]/20 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30 disabled:cursor-not-allowed disabled:opacity-50"
>
  Assign
</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showRejectModal ? (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reject-title"
        >
          <div className={`${directorGlassCard} w-full max-w-md overflow-hidden`}>
            <div className={panelInner}>
              <h3 id="reject-title" className="text-lg font-semibold text-white">
                Reject interest
              </h3>
              <p className="mt-2 text-sm text-[#cde2f2]/90">
                Are you sure you want to reject this interest? This action cannot be undone.
              </p>
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 rounded-xl border border-white/20 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleReject}
                  className="flex-1 rounded-xl border border-red-400/50 bg-red-500/20 py-2.5 text-sm font-semibold text-red-100 transition hover:bg-red-500/30"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* <AppFooter /> */}
    </div>
  );
}
