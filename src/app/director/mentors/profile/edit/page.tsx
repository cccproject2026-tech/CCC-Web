"use client";

import { useEffect, useState, Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import ConfirmModal from "@/app/Components/ConfirmModal";
import ProfileForm, {
  PersonalInfo,
  ChurchInfo,
  OtherInfo,
} from "@/app/Components/ProfileForm";
import DirectorHero from "@/app/director/DirectorHero";
import {
  directorBtnPrimary,
  directorBtnSecondary,
  directorGlassCard,
  directorPageContainer,
  directorPageRoot,
  directorSpinner,
} from "@/app/director/directorUi";
import MentorBg from "@/app/Assets/mentor-bg.png";
import Mentor1 from "@/app/Assets/mentor1.png";
import { getUserById, updateUserById } from "@/app/Services/mentors.service";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";

function EditMentorProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mentorId = searchParams.get("id");

  const [personal, setPersonal] = useState<PersonalInfo>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
  });

  const [church1, setChurch1] = useState<ChurchInfo>({
    churchName: "",
    churchPhone: "",
    churchWebsite: "",
    churchAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const [church2, setChurch2] = useState<ChurchInfo>({
    churchName: "",
    churchPhone: "",
    churchWebsite: "",
    churchAddress: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  });

  const [other, setOther] = useState<OtherInfo>({
    title: "",
    yearsInMinistry: "",
    conference: "",
    communityServiceProjects: "",
  });

  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profileImg, setProfileImg] = useState<string | typeof Mentor1>(Mentor1);
  const [roleLabel, setRoleLabel] = useState("Mentor");

  const [interests, setInterests] = useState<string>("");
  const [comments, setComments] = useState<string>("");

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteDocConfirm, setShowDeleteDocConfirm] = useState<string | null>(null);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [documents, setDocuments] = useState<{ id: string; name: string; size: string }[]>([]);

  const displayName = useMemo(
    () => `${personal.firstName} ${personal.lastName}`.trim() || "Mentor",
    [personal.firstName, personal.lastName],
  );

  const bioPreview = useMemo(() => {
    const t = (other.communityServiceProjects || "").trim();
    if (t.length > 180) return `${t.slice(0, 177)}…`;
    return t || "No summary on file yet.";
  }, [other.communityServiceProjects]);

  const buildUpdatePayload = () => {
    return {
      firstName: personal.firstName,
      lastName: personal.lastName,
      phoneNumber: personal.phoneNumber,
      email: personal.email,
      title: other.title,
      yearsInMinistry: other.yearsInMinistry,
      conference: other.conference,
      currentCommunityProjects: other.communityServiceProjects,
      interests: interests ? interests.split(",").map((i) => i.trim()).filter(Boolean) : [],
      comments,
      interest: {
        churchDetails: [
          {
            churchName: church1.churchName,
            churchPhone: church1.churchPhone,
            churchWebsite: church1.churchWebsite,
            churchAddress: church1.churchAddress,
            city: church1.city,
            state: church1.state,
            zipCode: church1.zipCode,
            country: church1.country,
          },
          {
            churchName: church2.churchName,
            churchPhone: church2.churchPhone,
            churchWebsite: church2.churchWebsite,
            churchAddress: church2.churchAddress,
            city: church2.city,
            state: church2.state,
            zipCode: church2.zipCode,
            country: church2.country,
          },
        ].filter(
          (c) =>
            c.churchName || c.churchPhone || c.churchWebsite || c.churchAddress,
        ),
      },
    };
  };

  useEffect(() => {
    if (!mentorId) return;

    const fetchUser = async () => {
      try {
        setPageLoading(true);
        const res = await getUserById(mentorId);
        const user = res.data.data;
        setPersonal({
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          phoneNumber: user.phoneNumber ?? "",
          email: user.email ?? "",
        });

        const churchOne = user.interest?.churchDetails?.[0] ?? {};
        const churchTwo = user.interest?.churchDetails?.[1] ?? {};
        setChurch1({
          churchName: churchOne.churchName ?? "",
          churchPhone: churchOne.churchPhone ?? "",
          churchWebsite: churchOne.churchWebsite ?? "",
          churchAddress: churchOne.churchAddress ?? "",
          city: churchOne.city ?? "",
          state: churchOne.state ?? "",
          zipCode: churchOne.zipCode ?? "",
          country: churchOne.country ?? "",
        });

        setChurch2({
          churchName: churchTwo.churchName ?? "",
          churchPhone: churchTwo.churchPhone ?? "",
          churchWebsite: churchTwo.churchWebsite ?? "",
          churchAddress: churchTwo.churchAddress ?? "",
          city: churchTwo.city ?? "",
          state: churchTwo.state ?? "",
          zipCode: churchTwo.zipCode ?? "",
          country: churchTwo.country ?? "",
        });

        setOther({
          title: user.title ?? "",
          yearsInMinistry: user.yearsInMinistry ?? "",
          conference: user.conference ?? "",
          communityServiceProjects: user.currentCommunityProjects ?? "",
        });

        setInterests(
          Array.isArray(user.interests)
            ? user.interests.join(", ")
            : user.interests ?? "",
        );
        setComments(user.comments ?? "");

        const rawPic = user.profilePicture;
        if (typeof rawPic === "string" && rawPic.trim()) {
          const u = resolveApiMediaUrl(rawPic) || rawPic;
          setProfileImg(u);
        } else {
          setProfileImg(Mentor1);
        }

        setRoleLabel(
          typeof user.role === "string" && user.role.trim()
            ? user.role.replace(/-/g, " ")
            : "Mentor",
        );

        const docs = user.uploadedDocuments;
        if (Array.isArray(docs) && docs.length > 0) {
          setDocuments(
            docs.map((d: { fileName?: string; uploadedAt?: string }, i: number) => ({
              id: String(i),
              name: d.fileName || "Document",
              size: d.uploadedAt || "",
            })),
          );
        } else {
          setDocuments([]);
        }
      } catch (err) {
        console.error("Failed to fetch user", err);
      } finally {
        setPageLoading(false);
      }
    };

    fetchUser();
  }, [mentorId]);

  const handleSave = async () => {
    if (!mentorId) return;
    try {
      setShowSaveConfirm(false);
      setSaving(true);
      await updateUserById(mentorId, buildUpdatePayload());
      setToast("Changes saved successfully");
      setTimeout(() => {
        setToast(null);
        router.push(`/director/mentors/profile?id=${encodeURIComponent(mentorId)}`);
      }, 1200);
    } catch (err) {
      console.error("Update failed", err);
      setToast("Failed to save changes");
      setTimeout(() => setToast(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCancelConfirm(false);
    if (!mentorId) return;
    router.push(`/director/mentors/profile?id=${encodeURIComponent(mentorId)}`);
  };

  const handleDownload = (_name: string) => {
    setToast("Download started");
    setTimeout(() => setToast(null), 1200);
  };

  const handleDeleteDoc = () => {
    if (!showDeleteDocConfirm) return;
    setDocuments((prev) => prev.filter((d) => d.id !== showDeleteDocConfirm));
    setShowDeleteDocConfirm(null);
    setToast("Removed from list (save profile to persist server changes if applicable)");
    setTimeout(() => setToast(null), 2500);
  };

  if (!mentorId) {
    return (
      <div className={directorPageRoot}>
        <div className={`${directorPageContainer} flex flex-1 flex-col items-center justify-center gap-4 px-4 py-20`}>
          <p className="text-center text-white/85">Missing mentor id.</p>
          <Link href="/director/mentors" className={`${directorBtnPrimary}`}>
            Back to mentors
          </Link>
        </div>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className={directorPageRoot}>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24">
          <div className={directorSpinner} />
          <p className="text-sm font-medium text-white/80">Loading mentor…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={directorPageRoot}>
      <div className={`${directorPageContainer} px-4 pt-3 sm:px-6 lg:px-10 sm:pt-5`}>
        <DirectorHero
          title={displayName}
          subtitle="Edit profile, church details, and ministry information."
          image={MentorBg}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Mentors", href: "/director/mentors" },
            { label: "Edit profile" },
          ]}
        />
      </div>

      <section className="relative flex-1 pb-12 pt-2">
        <div className={`${directorPageContainer} px-4 sm:px-6 lg:px-10`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
            {/* Sidebar */}
            <aside className="w-full shrink-0 lg:w-[300px]">
              <div className={`${directorGlassCard} p-5 sm:p-6`}>
                <div className="mb-6 flex flex-col items-center text-center">
                  <div className="relative mb-4 h-[120px] w-[120px] overflow-hidden rounded-full border border-white/20 bg-white/10 ring-2 ring-white/10">
                    <Image
                      src={profileImg}
                      alt=""
                      fill
                      className="object-cover"
                      unoptimized={
                        typeof profileImg === "string" &&
                        (profileImg.startsWith("blob:") || isRemoteImageSrc(profileImg))
                      }
                    />
                  </div>
                  <h2 className="text-lg font-bold text-white">{displayName}</h2>
                  <p className="mt-1 text-xs capitalize text-[#8ec5eb]/90">{roleLabel}</p>
                </div>

                <div className="mb-6 border-b border-white/10 pb-6">
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-white/50">
                    Summary
                  </h3>
                  <p className="text-[13px] leading-relaxed text-white/75">{bioPreview}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDocsModal(true)}
                  className="flex w-full items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
                >
                  <span className="flex items-center gap-2 text-[13px] font-semibold text-white">
                    <i className="fa-regular fa-file-lines text-[#8ec5eb]" />
                    Documents
                  </span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-[#cde2f2]">
                    {documents.length}
                  </span>
                </button>
              </div>
            </aside>

            {/* Form */}
            <div className="min-w-0 flex-1">
              <div className={`${directorGlassCard} overflow-hidden`}>
                <div className="border-b border-white/10 bg-white/[0.06] px-5 py-4 sm:px-8">
                  <h2 className="text-lg font-bold text-white sm:text-xl">Personal information</h2>
                  <p className="mt-1 text-sm text-white/55">
                    Update details visible to your team. Required fields are marked on the form.
                  </p>
                </div>
                <div className="bg-white/[0.04] px-3 py-5 sm:px-6 sm:py-8">
                  <ProfileForm
                    title="Details"
                    headerActions={
                      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => setShowCancelConfirm(true)}
                          className={directorBtnSecondary}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSaveConfirm(true)}
                          className={directorBtnPrimary}
                          disabled={saving}
                        >
                          {saving ? "Saving…" : "Save"}
                        </button>
                      </div>
                    }
                    personal={personal}
                    church1={church1}
                    church2={church2}
                    other={other}
                    interests={interests}
                    comments={comments}
                    showInterests={false}
                    showComments={false}
                    editable
                    onPersonalChange={setPersonal}
                    onChurch1Change={setChurch1}
                    onChurch2Change={setChurch2}
                    onOtherChange={setOther}
                    onInterestsChange={setInterests}
                    onCommentsChange={setComments}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-[100] max-w-[min(100%,22rem)] -translate-x-1/2 animate-fade-in">
          <div className="rounded-xl border border-white/15 bg-[#041f35]/95 px-5 py-3 text-center text-sm font-semibold text-white shadow-xl backdrop-blur-md">
            {toast}
          </div>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleSave}
        title="Save changes?"
        message="Your updates will be stored for this mentor."
        confirmText="Save"
        cancelText="Back"
        confirmColor="bg-[#2E3B8E] hover:bg-[#1F2A6E]"
        icon="fa-regular fa-floppy-disk"
        iconColor="text-[#2E3B8E] bg-blue-100"
        pendingConfirmText="Saving…"
      />

      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Discard changes?"
        message="You will lose unsaved edits on this page."
        confirmText="Discard"
        cancelText="Keep editing"
        confirmColor="bg-gray-600 hover:bg-gray-700"
        icon="fa-regular fa-circle-xmark"
        iconColor="text-gray-600 bg-gray-100"
      />

      <ConfirmModal
        isOpen={!!showDeleteDocConfirm}
        onClose={() => setShowDeleteDocConfirm(null)}
        onConfirm={handleDeleteDoc}
        title="Remove this document?"
        message="It will be removed from this list."
        confirmText="Remove"
        cancelText="Cancel"
        confirmColor="bg-red-600 hover:bg-red-700"
        icon="fa-regular fa-trash-can"
        iconColor="text-red-600 bg-red-100"
      />

      {showDocsModal ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
              <h3 className="text-lg font-bold text-gray-900">Documents</h3>
              <button
                type="button"
                onClick={() => setShowDocsModal(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark text-gray-600" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-auto p-5">
              {documents.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-600">No documents on file.</p>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <i className="fa-regular fa-file-pdf shrink-0 text-xl text-red-500" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">{doc.name}</p>
                          {doc.size ? (
                            <p className="text-xs text-gray-500">{doc.size}</p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => handleDownload(doc.name)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-blue-600 hover:bg-gray-100"
                          aria-label="Download"
                        >
                          <i className="fa-solid fa-download text-xs" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowDeleteDocConfirm(doc.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-red-600 hover:bg-red-50"
                          aria-label="Remove"
                        >
                          <i className="fa-regular fa-trash-can text-xs" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function EditMentorProfilePage() {
  return (
    <Suspense
      fallback={
        <div className={directorPageRoot}>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
            <div className={directorSpinner} />
            <p className="text-sm text-white/80">Loading…</p>
          </div>
        </div>
      }
    >
      <EditMentorProfileContent />
    </Suspense>
  );
}
