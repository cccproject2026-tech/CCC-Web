"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiGetDocuments } from "@/app/Services/api";
import Image from "next/image";
import Link from "next/link";
import { isAxiosError } from "axios";
import DirectorHero from "@/app/director/DirectorHero";
import {
  directorBtnPrimary,
  directorGlassCard,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
  directorToastClass,
} from "@/app/director/directorUi";
import ConfirmModal from "@/app/Components/ConfirmModal";
import AssignMenteesModal from "@/app/Components/AssignMenteesModal";
import ListMenteesModal from "@/app/Components/ListMenteesModal";
import MentorBg from "@/app/Assets/mentor-bg.png";
import Mentor1 from "@/app/Assets/mentor1.png";
import ProfileForm from "@/app/Components/ProfileForm";
import {
  apiDeleteUser,
  apiGetUserById,
  apiGetAssignedUsers,
} from "@/app/Services/users.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { isRemoteImageSrc } from "@/app/utils/image";

type AssignedMenteeRow = {
  id: string;
  name: string;
  church: string;
  progress: number;
  image?: string | null;

};
type MentorDocumentRow = {
  name: string;
  url: string;
  uploadedAt?: string;
};

function normalizeAssignedIds(user: any): string[] {
  const raw = user?.assignedId ?? user?.assignedIds;
  if (!Array.isArray(raw)) return [];
  return raw.map((x: unknown) => String(x));
}

async function rowsWithProgress(rows: AssignedMenteeRow[]): Promise<AssignedMenteeRow[]> {
  const results = await Promise.all(
    rows.map(async (row) => {
      try {
        const res = await apiGetUserProgress(row.id);
        const pct = Math.round(res.data?.data?.overallProgress ?? 0);
        return { ...row, progress: pct };
      } catch {
        return row;
      }
    }),
  );
  return results;
}

export default function MentorProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showListMenteesModal, setShowListMenteesModal] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    variant: "success" | "error";
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [assignedLoading, setAssignedLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [assignedMentees, setAssignedMentees] = useState<AssignedMenteeRow[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [mentorDocuments, setMentorDocuments] = useState<MentorDocumentRow[]>([]);

  const [mentorData, setMentorData] = useState({
    firstName: "",
    lastName: "",
    role: "",
    phoneNumber: "",
    email: "",
    profilePicture: null as string | null,
    totalMentees: 0,
    otherInfo: {
      title: "",
      yearsInMinistry: "",
      conference: "",
      bio: "",
    },
  });

  const loadAssignedMentees = useCallback(async (mentorUserId: string) => {
    setAssignedLoading(true);
    try {
      const res = await apiGetAssignedUsers(mentorUserId);
      const users = res.data?.data ?? [];
      const baseRows: AssignedMenteeRow[] = users.map((u: any) => {
        const church =
          u.churchDetails?.[0]?.churchName ??
          u.churchDetails?.[0]?.name ??
          u.title ??
          "—";
        return {
          id: String(u.id ?? u._id ?? ""),
          name:
            `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email || "User",
          church,
          progress: Math.round(
            typeof u.progressPercentage === "number" ? u.progressPercentage : 0,
            
          ),
          image: u.profilePicture ?? null,
        };
      });
      const withProgress = await rowsWithProgress(baseRows);
      setAssignedMentees(withProgress);
    } catch (e) {
      console.error("Failed to load assigned mentees", e);
      setAssignedMentees([]);
    } finally {
      setAssignedLoading(false);
    }
  }, []);

  const fetchProfile = useCallback(async (opts?: { silent?: boolean }) => {
    if (!id) return;
    const silent = opts?.silent === true;
    if (!silent) setProfileError(null);
    try {
      if (!silent) setLoading(true);
      const res = await apiGetUserById(id);
      const user = res.data.data;
     try {
  const docsRes = await apiGetDocuments(String(user?._id ?? user?.id ?? id));
  const docs = Array.isArray(docsRes.data?.data) ? docsRes.data.data : [];

  setMentorDocuments(
    docs
      .map((doc: any) => ({
        name: String(doc.fileName ?? doc.name ?? "Document"),
        url: String(doc.fileUrl ?? ""),
        uploadedAt: doc.uploadedAt ?? doc.createdAt ?? doc.updatedAt ?? undefined,
      }))
      .filter((doc: MentorDocumentRow) => Boolean(doc.url)),
  );
} catch (docErr) {
  console.error("Failed to load mentor documents", docErr);
  setMentorDocuments([]);
}
// setMentorDocuments(
//   docs
//     .map((doc: any) => {
//       const url =
//         doc.url ??
//         doc.fileUrl ??
//         doc.documentUrl ??
//         doc.path ??
//         "";

//       return {
//         name:
//           doc.name ??
//           doc.fileName ??
//           doc.originalName ??
//           doc.title ??
//           "Document",
//         url: String(url),
//         uploadedAt:
//           doc.uploadedAt ??
//           doc.createdAt ??
//           doc.updatedAt ??
//           undefined,
//       };
//     })
//     .filter((doc: MentorDocumentRow) => doc.url)
// );
      const interest = user?.interest;
      const ids = normalizeAssignedIds(user);
      setAssignedIds(ids);
      setMentorData({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        role: user.role ?? "",
        phoneNumber: user.phoneNumber ?? "",
        email: user.email ?? "",
        profilePicture: user.profilePicture ?? null,
        totalMentees: ids.length,
        otherInfo: {
          title: user?.title ?? interest?.title ?? "",
          yearsInMinistry: interest?.yearsInMinistry ?? "",
          conference: interest?.conference ?? "",
          bio: interest?.comments ?? "",
        },
      });
    } catch (err) {
      console.error("Failed to fetch mentor profile", err);
      if (!silent) {
        setProfileError("Could not load this mentor. Check your connection and try again.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (!id || loading || profileError) return;
    void loadAssignedMentees(id);
  }, [id, loading, profileError, loadAssignedMentees]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const refreshAfterAssign = useCallback(async () => {
    if (!id) return;
    await fetchProfile({ silent: true });
    await loadAssignedMentees(id);
  }, [id, fetchProfile, loadAssignedMentees]);

  const handleDeleteProfile = async () => {
    if (!id) {
      setToast({
        message: "Missing mentor id. Refresh the page and try again.",
        variant: "error",
      });
      throw new Error("Missing mentor id");
    }
    try {
      await apiDeleteUser(id);
      setToast({ message: "Mentor profile deleted successfully.", variant: "success" });
      router.replace("/director/mentors");
    } catch (err) {
      let message = "Could not delete this mentor. Try again.";
      if (isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        if (data?.message) message = data.message;
      }
      setToast({ message, variant: "error" });
      throw err;
    }
  };

  const phoneDigits = mentorData.phoneNumber.replace(/\D/g, "");
  const mailtoHref = mentorData.email.trim()
    ? `mailto:${encodeURIComponent(mentorData.email.trim())}`
    : undefined;
  const telHref = phoneDigits ? `tel:${phoneDigits}` : undefined;
  const whatsappHref =
    phoneDigits.length >= 10
      ? `https://wa.me/${phoneDigits.replace(/^0+/, "")}`
      : undefined;
  const smsHref = phoneDigits ? `sms:${phoneDigits}` : undefined;

  if (loading) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero
          title="Mentor Profile"
          subtitle="Loading profile…"
          image={MentorBg}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Mentors", href: "/director/mentors" },
            { label: "Profile" },
          ]}
        />
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className={directorSpinner} />
          <p className="text-sm text-white/70">Loading mentor…</p>
        </div>
      </div>
    );
  }

  if (profileError) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero
          title="Mentor Profile"
          subtitle="Something went wrong"
          image={MentorBg}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Mentors", href: "/director/mentors" },
            { label: "Profile" },
          ]}
        />
        <div className={`mx-auto max-w-lg px-4 py-16 text-center ${directorPageContainer}`}>
          <p className="mb-6 text-white/85">{profileError}</p>
          <button
            type="button"
            onClick={() => void fetchProfile()}
            className={directorBtnPrimary}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const fullName = `${mentorData.firstName} ${mentorData.lastName}`.trim();
  const mentorTitle = mentorData.otherInfo.title?.trim() || "";

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title={fullName || "Mentor Profile"}
        subtitle={
          mentorTitle
            ? `${mentorTitle}${mentorData.role ? ` • ${mentorData.role}` : ""}`
            : mentorData.role
              ? `${mentorData.role}`
              : "Mentor details and assigned mentees"
        }
        image={MentorBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Mentors", href: "/director/mentors" },
          { label: fullName || "Profile" },
        ]}
      />

      <section className="relative pb-12 pt-2">
        <div className={`${directorPageContainer} px-4 sm:px-0`}>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            {/* Sidebar */}
            <aside className="w-full shrink-0 lg:max-w-[320px]">
              <div className={`p-6 sm:p-8 ${directorGlassCard}`}>
                <button
  type="button"
  onClick={() => router.back()}
  className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-[#8ec5eb] transition hover:bg-white/15"
  aria-label="Back"
>
  <i className="fa-solid fa-arrow-left" />
</button>
                <div className="mb-6 flex flex-col items-center">
                  <div className="mb-4 h-[140px] w-[140px] overflow-hidden rounded-full border border-white/20 bg-white/10">
                    <Image
                      src={mentorData.profilePicture || Mentor1}
                      alt={fullName}
                      width={140}
                      height={140}
                      unoptimized={isRemoteImageSrc(mentorData.profilePicture || "")}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h3 className="text-center text-lg font-semibold text-white sm:text-xl">
                    {fullName || "—"}
                  </h3>
                  <p className="mt-1 text-[13px] capitalize text-white/65">{mentorData.role}</p>
                  {/* <div className="mt-2 flex items-center gap-1.5 text-[12px] text-[#8ec5eb]/90">
                    <i className="fa-solid fa-award" />
                    <span className="capitalize">{mentorTitle || mentorData.role}</span>
                  </div> */}
                </div>

                <div className="mb-6 flex items-center justify-center gap-4 border-b border-white/10 pb-6 text-lg text-[#8ec5eb]">
                  {mailtoHref ? (
                    <a
                      href={mailtoHref}
                      className="transition hover:opacity-80"
                      aria-label="Email"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <i className="fa-regular fa-envelope" />
                    </a>
                  ) : (
                    <span className="cursor-not-allowed opacity-40" title="No email" aria-hidden>
                      <i className="fa-regular fa-envelope" />
                    </span>
                  )}
                  {smsHref ? (
                    <a href={smsHref} className="transition hover:opacity-80" aria-label="Text message">
                      <i className="fa-regular fa-comment" />
                    </a>
                  ) : (
                    <span className="cursor-not-allowed opacity-40" title="No phone" aria-hidden>
                      <i className="fa-regular fa-comment" />
                    </span>
                  )}
                  {whatsappHref ? (
                    <a
                      href={whatsappHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="transition hover:opacity-80"
                      aria-label="WhatsApp"
                    >
                      <i className="fa-brands fa-whatsapp" />
                    </a>
                  ) : (
                    <span className="cursor-not-allowed opacity-40" title="Add phone for WhatsApp" aria-hidden>
                      <i className="fa-brands fa-whatsapp" />
                    </span>
                  )}
                  {telHref ? (
                    <a href={telHref} className="transition hover:opacity-80" aria-label="Call">
                      <i className="fa-solid fa-phone" />
                    </a>
                  ) : (
                    <span className="cursor-not-allowed opacity-40" title="No phone" aria-hidden>
                      <i className="fa-solid fa-phone" />
                    </span>
                  )}
                </div>

                <div className="mb-6 space-y-4 border-b border-white/10 pb-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-white/75">Total mentees</span>
                    <span className="text-base font-bold text-white">{mentorData.totalMentees}</span>
                  </div>
                  {mentorData.otherInfo.conference ? (
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[13px] font-semibold text-white/75">Conference</span>
                      <span className="max-w-[60%] text-right text-[13px] text-white/90">
                        {mentorData.otherInfo.conference}
                      </span>
                    </div>
                  ) : null}
                  {mentorData.otherInfo.yearsInMinistry ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold text-white/75">Years in ministry</span>
                      <span className="text-[13px] text-white/90">
                        {mentorData.otherInfo.yearsInMinistry}
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="mb-6">
                  <h4 className="mb-2 text-[13px] font-semibold text-white/85">About</h4>
                  <p className="text-[13px] leading-relaxed text-white/60">
                    {mentorData.otherInfo.bio?.trim() ? mentorData.otherInfo.bio : "No bio provided."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAssignModal(true)}
                  className={`${directorBtnPrimary} w-full justify-center`}
                >
                  <i className="fa-solid fa-user-plus" />
                  <span>Assign mentees</span>
                </button>
                <div className="mt-6 border-t border-white/10 pt-6">
  <h4 className="mb-3 text-[13px] font-semibold text-white/85">
    Documents
  </h4>

  {mentorDocuments.length === 0 ? (
    <p className="rounded-xl border border-white/10 bg-white/[0.05] px-4 py-4 text-center text-[13px] text-white/55">
      No documents uploaded.
    </p>
  ) : (
    <div className="space-y-3">
      {mentorDocuments.map((doc, index) => (
        <div
          key={`${doc.url}-${index}`}
          className="rounded-xl border border-white/10 bg-white/[0.05] p-3"
        >
          <p className="break-words text-[13px] font-semibold text-white">
            {doc.name}
          </p>

          {doc.uploadedAt ? (
            <p className="mt-1 text-[11px] text-white/45">
              Uploaded{" "}
              {new Date(doc.uploadedAt).toLocaleDateString(undefined, {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          ) : null}

          <div className="mt-3 flex gap-2">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/25"
            >
              View
            </a>

            <a
              href={doc.url}
              download
              className="flex-1 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-white/15"
            >
              Download
            </a>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
              </div>
            </aside>

            {/* Main */}
            <div className="min-w-0 flex-1 space-y-8">
              <div className={`overflow-hidden rounded-2xl ${directorGlassCard}`}>
                <ProfileForm
                  title="Personal information"
                  headerActions={
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <button
                        type="button"
                        onClick={() => setShowDeleteModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-[13px] font-semibold text-red-200 transition hover:bg-red-500/25 sm:px-4"
                      >
                        <i className="fa-regular fa-trash-can" />
                        Delete
                      </button>
                      {/* <button
                        type="button"
                        onClick={() =>
                          router.push(
                            id
                              ? `/director/mentors/profile/edit?id=${encodeURIComponent(String(id))}`
                              : "/director/mentors/profile/edit",
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-[#8ec5eb]/25 sm:px-4"
                      >
                        <i className="fa-regular fa-pen-to-square" />
                        Edit profile
                      </button> */}
                    </div>
                  }
                  personal={{
                    firstName: mentorData.firstName,
                    lastName: mentorData.lastName,
                    phoneNumber: mentorData.phoneNumber,
                    email: mentorData.email,
                  }}
                  other={{
                    title: mentorData.otherInfo.title,
                    yearsInMinistry: mentorData.otherInfo.yearsInMinistry,
                    conference: mentorData.otherInfo.conference,
                    communityServiceProjects: "",
                  }}
                  showInterests={false}
                  showComments={false}
                />
              </div>

              <div className={`p-6 sm:p-8 ${directorGlassCard}`}>
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-lg font-semibold text-white sm:text-xl">
                    Assigned mentees ({assignedMentees.length})
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowListMenteesModal(true)}
                    className="text-sm font-semibold text-[#8ec5eb] transition hover:text-[#cde2f2]"
                  >
                    View all mentees
                  </button>
                </div>

                {assignedLoading ? (
                  <div className="flex justify-center py-12">
                    <div className={directorSpinner} />
                  </div>
                ) : assignedMentees.length === 0 ? (
                  <p className="rounded-xl border border-white/10 bg-white/[0.05] px-5 py-8 text-center text-sm text-white/55">
                    No mentees assigned yet. Use &quot;Assign mentees&quot; to add pastors.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {assignedMentees.map((mentee) => (
                      <div
                        key={mentee.id}
                        className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/[0.05] p-4 transition hover:border-white/20 hover:bg-white/[0.08] sm:flex-row sm:items-center sm:justify-between"
                      >
                        {/* <div className="min-w-0 flex-1">
                          <h4 className="text-[15px] font-semibold text-white">{mentee.name}</h4>
                          <p className="text-[13px] text-white/55">{mentee.church}</p>
                        </div> */}
                        <div className="flex min-w-0 flex-1 items-center gap-3">
  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-[#173653] text-sm font-bold text-white">
    {mentee.image ? (
      <Image
        src={mentee.image}
        alt={mentee.name}
        width={48}
        height={48}
        unoptimized={isRemoteImageSrc(mentee.image)}
        className="h-full w-full object-cover"
      />
    ) : (
      mentee.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    )}
  </div>

  <div className="min-w-0">
    <h4 className="truncate text-[15px] font-semibold text-white">
      {mentee.name}
    </h4>
  </div>
</div>
                        <div className="flex flex-wrap items-center gap-4 sm:justify-end">
                          <div className="text-left sm:text-right">
                            <p className="text-[11px] uppercase tracking-wide text-white/45">
                              Progress
                            </p>
                            <p className="text-base font-bold text-[#8ec5eb]">{mentee.progress}%</p>
                          </div>
                          <Link
                            href={`/director/mentees/profile/${encodeURIComponent(mentee.id)}`}
                            className="inline-flex items-center justify-center rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/25 sm:text-sm"
                          >
                            View profile
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <AssignMenteesModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        mentor={
          id
            ? {
                id,
                name: fullName || "Mentor",
                assignedIds,
              }
            : null
        }
        onSuccess={async (message) => {
          setToast({ message, variant: "success" });
          setShowAssignModal(false);
          await refreshAfterAssign();
        }}
        onError={(message) => setToast({ message, variant: "error" })}
      />

      <ListMenteesModal
        isOpen={showListMenteesModal}
        onClose={() => setShowListMenteesModal(false)}
        mentorId={id ?? null}
        mentorName={fullName || null}
      />

      {toast && (
        <div className="fixed left-1/2 top-20 z-[110] max-w-[min(90vw,28rem)] -translate-x-1/2 animate-fade-in">
          <div className={directorToastClass}>
            <i
              className={`fa-solid text-xl ${
                toast.variant === "success"
                  ? "fa-circle-check text-green-500"
                  : "fa-circle-exclamation text-red-500"
              }`}
            />
            <span className="font-semibold text-gray-800">{toast.message}</span>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProfile}
        title="Delete mentor profile"
        message="This will remove the mentor and unassign mentees. This cannot be undone."
        confirmText="Delete"
        pendingConfirmText="Deleting…"
        cancelText="Cancel"
        confirmColor="bg-red-500 hover:bg-red-600"
        icon="fa-solid fa-trash-can"
        iconColor="text-red-500 bg-red-100"
      />
    </div>
  );
}
