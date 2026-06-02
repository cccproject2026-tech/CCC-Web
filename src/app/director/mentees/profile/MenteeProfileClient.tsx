"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
import CertificatePreview, { downloadCertificatePreviewPdf } from "@/app/Components/CertificatePreview";
import ProfileForm from "@/app/Components/ProfileForm";
import type { PersonalInfo, ChurchInfo, OtherInfo } from "@/app/Components/ProfileForm";

import MentorBg from "@/app/Assets/mentor-bg.png";
import Mentor1 from "@/app/Assets/mentor1.png";

import {
  apiDeleteUser,
  apiGetUserById,
  apiInviteFieldMentor,
  apiUpdateUserById,
} from "@/app/Services/users.service";
import {
  apiGetUserCertificate,
  apiIssueCertificate,
  hasRealCertificate,
  unwrapCertificate,
  type CertificateRecord,
} from "@/app/Services/certificates.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";
import { unwrapProgressData } from "@/app/Services/roadmap-assignments";
import { updateInterestByEmail } from "@/app/Services/pastor.service";
import { getCookie } from "@/app/utils/cookies";
import { isRemoteImageSrc, resolveApiMediaUrl } from "@/app/utils/image";
import type { ChurchDetails } from "@/app/Services/types/interests.types";
import type { ProgressResponse } from "@/app/Services/types/progress.types";

type InviteState = "none" | "invited" | "accepted";

type ToastState = { message: string; variant: "success" | "error" } | null;

const deriveInviteState = (user: any): InviteState => {
  const invite = user.fieldMentorInvitation;
  if (!invite) return "none";
  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) return "none";
  return "invited";
};

function churchInfoToDetails(c: ChurchInfo): ChurchDetails {
  return {
    churchName: c.churchName,
    churchPhone: c.churchPhone,
    churchWebsite: c.churchWebsite,
    churchAddress: c.churchAddress,
    city: c.city,
    state: c.state,
    zipCode: c.zipCode,
    country: c.country,
  };
}

function hasChurchData(c: ChurchInfo): boolean {
  return Object.values(c).some((v) => typeof v === "string" && v.trim() !== "");
}

type Props = {
  menteeId: string;
};

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Parse Retry-After for 429; default stagger when header missing. */
function retryDelayMsFor429(error: unknown): number {
  if (!isAxiosError(error) || error.response?.status !== 429) return 0;
  const h = error.response.headers;
  const raw = h?.["retry-after"] ?? h?.["Retry-After"];
  if (raw != null) {
    const sec = parseInt(String(raw), 10);
    if (!Number.isNaN(sec) && sec >= 0) {
      return Math.min(Math.max(sec, 1) * 1000, 60_000);
    }
  }
  return 2000;
}

async function with429Retries<T>(fn: () => Promise<T>, maxAttempts = 4): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      const delay = retryDelayMsFor429(e);
      if (delay > 0 && attempt < maxAttempts - 1) {
        await sleep(delay);
        continue;
      }
      throw e;
    }
  }
  throw last;
}

export default function MenteeProfileClient({ menteeId }: Props) {
  const router = useRouter();

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [documents, setDocuments] = useState<
    { id: string; name: string; size: string; url?: string }[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [inviteState, setInviteState] = useState<InviteState>("none");

const [isIssueCertificateModalOpen, setIsIssueCertificateModalOpen] = useState(false);
const [isCertificateSuccessModalOpen, setIsCertificateSuccessModalOpen] = useState(false);
const [isCertificatePreviewModalOpen, setIsCertificatePreviewModalOpen] = useState(false);
const [downloadCertificateWhenPreviewOpens, setDownloadCertificateWhenPreviewOpens] = useState(false);
const [isIssuingCertificate, setIsIssuingCertificate] = useState(false);
const [certificateNote, setCertificateNote] = useState(
  "Congratulations on successfully completing the revitalization journey. Wishing you continued impact in your ministry!"
);
const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
const [completionDate, setCompletionDate] = useState<string | undefined>();
const certificatePreviewRef = useRef<HTMLDivElement | null>(null);

  const [progressOverallDone, setProgressOverallDone] = useState(false);
  const [userMarkedComplete, setUserMarkedComplete] = useState(false);

  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [profileProgress, setProfileProgress] = useState(0);
  const [profileImage, setProfileImage] = useState<string | typeof Mentor1>(Mentor1);

  const [personal, setPersonal] = useState<PersonalInfo>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: "",
  });

  const [church1, setChurch1] = useState<ChurchInfo>({} as ChurchInfo);
  const [church2, setChurch2] = useState<ChurchInfo>({} as ChurchInfo);

  const [other, setOther] = useState<OtherInfo>({
    title: "",
    yearsInMinistry: "",
    conference: "",
    communityServiceProjects: "",
  });

  const [interests, setInterests] = useState("");
  const [comments, setComments] = useState("");

  const loadProfile = useCallback(async () => {
    setLoadError(null);
    try {
      setLoading(true);
      // Sequential calls reduce burst traffic; retries absorb API 429 rate limits.
      const userRes = await with429Retries(() => apiGetUserById(menteeId));
      const progressRes = await with429Retries(() => apiGetUserProgress(menteeId));

      const user = userRes.data.data;
      const progress = unwrapProgressData(progressRes as { data: unknown }) as ProgressResponse | null;
      const debugUser = user as any;

console.log("Mentee profile certificate debug:", {
  userId: menteeId,
  name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
  hasCompleted: user.hasCompleted,
  hasIssuedCertificate: user.hasIssuedCertificate,
  fieldMentorInvitation: user.fieldMentorInvitation,
  certificateUrl: debugUser.certificateUrl,
  certificateFile: debugUser.certificateFile,
  certificatePath: debugUser.certificatePath,
  certificateId: debugUser.certificateId,
  rawUser: user,
  progress,
});
      const interest = user?.interest;

      const marked =
        user.hasCompleted === true ||
        String(user.status ?? "").toLowerCase() === "completed";
      let loadedCertificate: CertificateRecord | null = null;
      if (marked) {
        try {
          loadedCertificate = unwrapCertificate(
            await with429Retries(() => apiGetUserCertificate(menteeId)),
          );
        } catch (error) {
          if (!isAxiosError(error) || error.response?.status !== 404) {
            console.error("Failed to fetch certificate", error);
          }
        }
      }
      setCertificate(loadedCertificate);
      setCompletionDate(user.completedAt);
      setProgressOverallDone(Boolean(progress?.overallCompleted));
      setUserMarkedComplete(marked);

      setFullName(`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Mentee");
      setRole(user.role ?? "Pastor");
      setProfileProgress(Math.round(progress?.overallProgress ?? 0));

      const rawPic = user.profilePicture;
      const resolved =
        typeof rawPic === "string" && rawPic.trim()
          ? resolveApiMediaUrl(rawPic) ?? rawPic
          : null;
      setProfileImage(resolved || Mentor1);
      setInviteState(deriveInviteState(user));

      setPersonal({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        phoneNumber: user.phoneNumber ?? "",
        email: user.email ?? "",
      });

      setChurch1((interest?.churchDetails?.[0] ?? {}) as ChurchInfo);
      setChurch2((interest?.churchDetails?.[1] ?? {}) as ChurchInfo);

      setOther({
        title: interest?.title ?? "",
        yearsInMinistry: interest?.yearsInMinistry ?? "",
        conference: interest?.conference ?? "",
        communityServiceProjects: interest?.currentCommunityProjects ?? "",
      });

      setInterests(interest?.interests?.join("\n") ?? "");
      setComments(interest?.comments ?? "");

      setDocuments(
        user.uploadedDocuments?.map((doc: any, i: number) => ({
          id: doc._id ?? String(i),
          name: doc.fileName ?? "Document",
          size:
            typeof doc.fileSize === "number"
              ? `${(doc.fileSize / 1024).toFixed(1)} KB`
              : "",
          url: doc.fileUrl,
        })) ?? [],
      );
    } catch (err) {
      console.error("Failed to fetch mentee profile", err);
      if (isAxiosError(err) && err.response?.status === 429) {
        setLoadError("Too many requests right now. Wait a few seconds and use Retry below.");
      } else {
        setLoadError("Could not load this mentee. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [menteeId]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (
      !loading &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("issueCertificate") === "1" &&
      userMarkedComplete &&
      !hasRealCertificate(certificate)
    ) {
      setIsIssueCertificateModalOpen(true);
    }
  }, [certificate, loading, userMarkedComplete]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  const phoneDigits = (personal.phoneNumber ?? "").replace(/\D/g, "");
  const emailTrim = (personal.email ?? "").trim();
  const mailtoHref = emailTrim
    ? `mailto:${encodeURIComponent(emailTrim)}`
    : undefined;
  const telHref = phoneDigits ? `tel:${phoneDigits}` : undefined;
  const whatsappHref =
    phoneDigits.length >= 10
      ? `https://wa.me/${phoneDigits.replace(/^0+/, "")}`
      : undefined;
  const smsHref = phoneDigits ? `sms:${phoneDigits}` : undefined;

  const canInviteFieldMentor =
    progressOverallDone && userMarkedComplete;

  const inviteButton = useMemo(() => {
    switch (inviteState) {
      case "none":
        return {
          icon: "fa-solid fa-user-plus",
          label: "Invite to be a Field Mentor",
          disabled: !canInviteFieldMentor,
          onClick: async () => {
            try {
              const invitedBy = getCookie("userId");
              if (!invitedBy || !personal.email) {
                setToast({ message: "Unable to send invitation (missing email or session).", variant: "error" });
                return;
              }
              await apiInviteFieldMentor({ email: personal.email, invitedBy });
              setInviteState("invited");
              setToast({ message: "Invitation sent successfully.", variant: "success" });
            } catch (error) {
              console.error("Invite failed", error);
              let msg = "Failed to send invitation.";
              if (isAxiosError(error)) {
                const d = error.response?.data as { message?: string } | undefined;
                if (d?.message) msg = d.message;
              }
              setToast({ message: msg, variant: "error" });
            }
          },
        };
      case "invited":
        return {
          icon: "fa-solid fa-user-plus",
          label: "Invitation sent",
          onClick: () => {},
          disabled: true,
        };
      case "accepted":
        return {
          icon: "fa-solid fa-user-check",
          label: "Accepted as Field Mentor",
          onClick: () => {},
          disabled: true,
        };
    }
  }, [inviteState, personal.email, canInviteFieldMentor]);

const handleIssueCertificate = async () => {
  try {
    setIsIssuingCertificate(true);

    const issuedBy = getCookie("userId");
    if (!issuedBy) {
      setToast({ message: "Director session missing. Please login again.", variant: "error" });
      return;
    }

    const response = await apiIssueCertificate({
      userId: menteeId,
      issuedBy,
      programName: "12-Month Mentoring Revitalization Program",
      completionDate,
      personalMessage: certificateNote.trim(),
    });
    const issuedCertificate = unwrapCertificate(response);
    if (!hasRealCertificate(issuedCertificate)) {
      throw new Error("Certificate response did not include a generated certificate file.");
    }
    setCertificate(issuedCertificate);
    setIsIssueCertificateModalOpen(false);
    setIsCertificateSuccessModalOpen(true);
  } catch (error) {
    console.error("Issue certificate failed", error);
    setToast({ message: "Failed to issue certificate.", variant: "error" });
  } finally {
    setIsIssuingCertificate(false);
  }
};

const handleDownloadCertificatePreview = () =>
  downloadCertificatePreviewPdf(
    certificatePreviewRef.current,
    certificate?.certificateId,
    certificate?.pdfUrl || certificate?.certificateUrl,
  );

const requestCertificatePreviewDownload = () => {
  setDownloadCertificateWhenPreviewOpens(true);
  setIsCertificatePreviewModalOpen(true);
};

useEffect(() => {
  if (!isCertificatePreviewModalOpen || !downloadCertificateWhenPreviewOpens) return;
  const timer = window.setTimeout(() => {
    setDownloadCertificateWhenPreviewOpens(false);
    void handleDownloadCertificatePreview();
  }, 0);
  return () => window.clearTimeout(timer);
}, [downloadCertificateWhenPreviewOpens, isCertificatePreviewModalOpen]);

  const persistProfile = async () => {
    const churches: ChurchDetails[] = [];
    if (hasChurchData(church1)) churches.push(churchInfoToDetails(church1));
    if (hasChurchData(church2)) churches.push(churchInfoToDetails(church2));

    const interestLines = interests
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    await apiUpdateUserById(menteeId, {
      firstName: personal.firstName,
      lastName: personal.lastName,
      phoneNumber: personal.phoneNumber,
      title: other.title,
      yearsInMinistry: other.yearsInMinistry,
      conference: other.conference,
      churchDetails: churches.length ? churches : undefined,
    });

    const email = personal.email?.trim();
    if (email) {
      await updateInterestByEmail(email, {
        title: other.title,
        yearsInMinistry: other.yearsInMinistry,
        conference: other.conference,
        currentCommunityProjects: other.communityServiceProjects,
        interests: interestLines,
        comments,
        ...(churches.length ? { churchDetails: churches } : {}),
      });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await persistProfile();
      setIsEditing(false);
      setToast({ message: "Changes saved successfully.", variant: "success" });
      await loadProfile();
    } catch (e) {
      console.error(e);
      let msg = "Could not save changes.";
      if (isAxiosError(e)) {
        const d = e.response?.data as { message?: string } | undefined;
        if (d?.message) msg = d.message;
      }
      setToast({ message: msg, variant: "error" });
      throw e;
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setConfirmCancel(false);
    setIsEditing(false);
    void loadProfile();
  };

  const handleDeleteProfile = async () => {
    try {
      await apiDeleteUser(menteeId);
      setShowDeleteModal(false);
      setToast({ message: "Profile removed.", variant: "success" });
      setTimeout(() => router.replace("/director/mentees"), 800);
    } catch (err) {
      let msg = "Could not delete this profile.";
      if (isAxiosError(err)) {
        const d = err.response?.data as { message?: string } | undefined;
        if (d?.message) msg = d.message;
      }
      setToast({ message: msg, variant: "error" });
      throw err;
    }
  };

  if (loading) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero
          title="Mentee profile"
          subtitle="Loading…"
          image={MentorBg}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Mentees", href: "/director/mentees" },
            { label: "Profile" },
          ]}
        />
        <div className="flex flex-col items-center justify-center gap-4 py-24">
          <div className={directorSpinner} />
          <p className="text-sm text-white/70">Loading mentee…</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={directorPageRoot}>
        <DirectorHero
          title="Mentee profile"
          subtitle="Error"
          image={MentorBg}
          breadcrumbItems={[
            { label: "Home", href: "/director/home" },
            { label: "Mentees", href: "/director/mentees" },
            { label: "Profile" },
          ]}
        />
        <div className={`${directorPageContainer} px-4 py-16 text-center`}>
          <p className="mb-6 text-white/85">{loadError}</p>
          <button type="button" onClick={() => void loadProfile()} className={directorBtnPrimary}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={directorPageRoot}>
      <DirectorHero
        title={fullName}
        subtitle={role ? `${role} · ${profileProgress}% overall progress` : `Progress ${profileProgress}%`}
        image={MentorBg}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Mentees", href: "/director/mentees" },
          { label: fullName },
        ]}
      />

      <section className="relative pb-12 pt-2">
        <div className={`${directorPageContainer} px-4 sm:px-0`}>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
            <aside className="w-full shrink-0 lg:max-w-[320px]">
              <div className={`p-6 sm:p-8 ${directorGlassCard}`}>
                <div className="mb-6 flex flex-col items-center">
                  <div className="mb-4 h-[140px] w-[140px] overflow-hidden rounded-full border border-white/20 bg-white/10">
                    <Image
                      src={profileImage}
                      alt={fullName}
                      width={140}
                      height={140}
                      unoptimized={typeof profileImage === "string" && isRemoteImageSrc(profileImage)}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <h3 className="text-center text-lg font-semibold text-white sm:text-xl">{fullName}</h3>
                  <p className="mt-1 text-[13px] capitalize text-white/65">{role}</p>
                </div>

                <div className="mb-6 flex items-center justify-center gap-4 border-b border-white/10 pb-6 text-lg text-[#8ec5eb]">
                  {mailtoHref ? (
                    <a href={mailtoHref} target="_blank" rel="noopener noreferrer" className="transition hover:opacity-80" aria-label="Email">
                      <i className="fa-regular fa-envelope" />
                    </a>
                  ) : (
                    <span className="opacity-40" title="No email">
                      <i className="fa-regular fa-envelope" />
                    </span>
                  )}
                  {smsHref ? (
                    <a href={smsHref} className="transition hover:opacity-80" aria-label="Message">
                      <i className="fa-regular fa-comment" />
                    </a>
                  ) : (
                    <span className="opacity-40" title="No phone">
                      <i className="fa-regular fa-comment" />
                    </span>
                  )}
                  {whatsappHref ? (
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="transition hover:opacity-80" aria-label="WhatsApp">
                      <i className="fa-brands fa-whatsapp" />
                    </a>
                  ) : (
                    <span className="opacity-40" title="No phone">
                      <i className="fa-brands fa-whatsapp" />
                    </span>
                  )}
                  {telHref ? (
                    <a href={telHref} className="transition hover:opacity-80" aria-label="Call">
                      <i className="fa-solid fa-phone" />
                    </a>
                  ) : (
                    <span className="opacity-40" title="No phone">
                      <i className="fa-solid fa-phone" />
                    </span>
                  )}
                </div>

                <div className="mb-6 border-b border-white/10 pb-6">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[13px] font-semibold text-white/75">Progress</span>
                    <span className="text-[13px] font-bold text-white">{profileProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-[#8ec5eb] transition-all"
                      style={{ width: `${Math.min(100, profileProgress)}%` }}
                    />
                  </div>
                </div>

                {documents.length > 0 ? (
                  <div className="mb-6">
                    <button
                      type="button"
                      onClick={() => setShowDocs(true)}
                      className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-left transition hover:bg-white/[0.08]"
                    >
                      <span className="flex items-center gap-2 text-[13px] font-semibold text-white">
                        <i className="fa-regular fa-file-lines text-[#8ec5eb]" />
                        Documents
                      </span>
                      <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[12px] font-semibold text-white/90">
                        {documents.length}
                      </span>
                    </button>
                  </div>
                ) : null}

                {/* <button
                  type="button"
                  onClick={inviteButton.onClick}
                  disabled={inviteButton.disabled}
                  title={
                    inviteState === "none" && !canInviteFieldMentor
                      ? "Available when the program is complete and the mentee is marked complete (mentor or director)."
                      : undefined
                  }
                  className={`${directorBtnPrimary} w-full justify-center disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  <i className={inviteButton.icon} />
                  <span>{inviteButton.label}</span>
                </button> */}
                <div className="space-y-3">
  {/* {hasRealCertificate(certificate) ? (
    <button
      type="button"
      disabled
      className={`${directorBtnPrimary} w-full justify-center disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <i className="fa-solid fa-certificate" />
      <span>Certificate issued</span>
    </button>
  ) : userMarkedComplete ? ( */}
  {hasRealCertificate(certificate) ? (
  <button
    type="button"
    onClick={() => setIsCertificateSuccessModalOpen(true)}
    className={`${directorBtnPrimary} w-full justify-center`}
  >
    <i className="fa-solid fa-certificate" />
    <span>Certificate issued</span>
  </button>
) : userMarkedComplete ? (
    <button
      type="button"
      onClick={() => setIsIssueCertificateModalOpen(true)}
      className={`${directorBtnPrimary} w-full justify-center disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <i className="fa-solid fa-certificate" />
      <span>Issue Certificate</span>
    </button>
  ) : null}

  <button
    type="button"
    onClick={inviteButton.onClick}
    disabled={inviteButton.disabled}
    className={`${directorBtnPrimary} w-full justify-center disabled:cursor-not-allowed disabled:opacity-50`}
  >
    <i className={inviteButton.icon} />
    <span>{inviteButton.label}</span>
  </button>
</div>
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <div className={`overflow-hidden rounded-2xl ${directorGlassCard}`}>
                <ProfileForm
                  title="Personal information"
                  headerActions={
                    <div className="flex flex-wrap items-center gap-2">
                      {!isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-red-400/40 bg-red-500/15 px-3 py-2 text-[13px] font-semibold text-red-200 transition hover:bg-red-500/25"
                          >
                            <i className="fa-regular fa-trash-can" />
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setIsEditing(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                          >
                            <i className="fa-regular fa-pen-to-square" />
                            Edit
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setConfirmCancel(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-white/15"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => setConfirmSave(true)}
                            className="inline-flex items-center gap-2 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-3 py-2 text-[13px] font-semibold text-white transition hover:bg-[#8ec5eb]/25 disabled:opacity-50"
                          >
                            {saving ? "Saving…" : "Save"}
                          </button>
                        </>
                      )}
                    </div>
                  }
                  personal={personal}
                  church1={church1}
                  church2={church2}
                  other={other}
                  interests={interests}
                  comments={comments}
                  editable={isEditing}
                  showInterests
                  showComments
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
      </section>

      {showDocs && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setShowDocs(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h3 className="text-lg font-bold text-gray-900">Documents</h3>
              <button
                type="button"
                onClick={() => setShowDocs(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <ul className="max-h-[60vh] overflow-y-auto p-4">
              {documents.map((d) => (
                <li
                  key={d.id}
                  className="flex items-center justify-between gap-2 border-b border-gray-100 py-3 last:border-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{d.name}</p>
                    <p className="text-xs text-gray-500">{d.size}</p>
                  </div>
                  {d.url ? (
                    <a
                      href={d.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-sm font-semibold text-[#2E3B8E] hover:underline"
                    >
                      Open
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed left-1/2 top-20 z-[110] max-w-[min(90vw,28rem)] -translate-x-1/2 animate-fade-in">
          <div className={directorToastClass}>
            <i
              className={`fa-solid text-xl ${
                toast.variant === "success" ? "fa-circle-check text-green-500" : "fa-circle-exclamation text-red-500"
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
        title="Delete mentee profile"
        message="This will remove the user profile. This cannot be undone."
        confirmText="Delete"
        pendingConfirmText="Deleting…"
        cancelText="Cancel"
        confirmColor="bg-red-500 hover:bg-red-600"
        icon="fa-solid fa-trash-can"
        iconColor="text-red-500 bg-red-100"
      />

      <ConfirmModal
        isOpen={confirmSave}
        onClose={() => setConfirmSave(false)}
        onConfirm={handleSave}
        title="Save changes?"
        message="Your updates will be saved to the server."
        confirmText="Save"
        pendingConfirmText="Saving…"
        cancelText="Cancel"
        confirmColor="bg-[#2E3B8E] hover:bg-[#1F2A6E]"
        icon="fa-regular fa-floppy-disk"
        iconColor="text-blue-600 bg-blue-100"
      />

      <ConfirmModal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        title="Discard changes?"
        message="Unsaved edits will be reloaded from the server."
        confirmText="Discard"
        cancelText="Stay"
        confirmColor="bg-gray-600 hover:bg-gray-700"
        icon="fa-regular fa-circle-xmark"
        iconColor="text-gray-600 bg-gray-100"
      />
{isIssueCertificateModalOpen && (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 text-[#101828] shadow-2xl">
      <div className="mb-5 flex items-start justify-between">
        <h2 className="text-lg font-bold">Issue Completion Certificate</h2>
        <button onClick={() => setIsIssueCertificateModalOpen(false)}>
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <div className="space-y-4 text-sm">
        <p><b>Pastor</b><br />{fullName}</p>
        <p><b>Program</b><br />12-Month Mentoring Revitalization Program</p>
        <p><b>Completion Date</b><br />{completionDate ? new Date(completionDate).toLocaleDateString() : "Not recorded"}</p>
        {/* <p><b>Certificate ID</b><br />CCC-{new Date().getFullYear()}-{menteeId.slice(-6).toUpperCase()}</p> */}

        <label className="block">
          <span className="mb-2 block font-semibold">Personal Message (Optional)</span>
          <textarea
            value={certificateNote}
            onChange={(e) => setCertificateNote(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-gray-200 p-3 text-sm"
          />
        </label>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => setIsIssueCertificateModalOpen(false)}
          className="flex-1 rounded-lg border border-gray-300 px-4 py-3 font-semibold"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleIssueCertificate}
          disabled={isIssuingCertificate}
          className="flex-1 rounded-lg bg-[#08056b] px-4 py-3 font-semibold text-white disabled:opacity-60"
        >
          {isIssuingCertificate ? "Issuing..." : "Issue Certificate"}
        </button>
      </div>
    </div>
  </div>
)}

{isCertificateSuccessModalOpen && (
  <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 px-4">
    <div className="w-full max-w-md rounded-2xl bg-white p-6 text-center text-[#101828] shadow-2xl">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-500 text-white">
        <i className="fa-solid fa-check text-2xl" />
      </div>

      <h2 className="text-lg font-bold">Certificate Issued Successfully!</h2>
      <p className="mt-2 text-sm text-gray-600">
        The completion certificate has been issued to {fullName}.
      </p>

      <div className="my-5 space-y-2 rounded-xl bg-gray-50 p-4 text-left text-sm">
        <p><b>Certificate ID:</b> {certificate?.certificateId || "Not recorded"}</p>
        <p><b>Issued On:</b> {certificate?.issuedAt ? new Date(certificate.issuedAt).toLocaleString() : "Not recorded"}</p>
        <p><b>Issued By:</b> {certificate?.issuedByName || "Director"}</p>
      </div>

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setIsCertificatePreviewModalOpen(true)}
          className="w-full rounded-lg border border-[#08056b] px-4 py-3 font-semibold text-[#08056b]"
        >
          Preview Certificate
        </button>

        <button
          type="button"
          onClick={() => setIsCertificatePreviewModalOpen(true)}
          className="w-full rounded-lg bg-[#08056b] px-4 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          View Certificate
        </button>

        <button
          type="button"
          onClick={requestCertificatePreviewDownload}
          disabled={!certificate?.pdfUrl && !certificate?.certificateUrl}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Download PDF
        </button>

        {/* <button
          type="button"
          onClick={() => setToast({ message: "Email certificate integration pending.", variant: "success" })}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 font-semibold"
        >
          Email Certificate
        </button> */}

        <button
          type="button"
          onClick={() => setIsCertificateSuccessModalOpen(false)}
          className="w-full text-sm font-semibold text-gray-500"
        >
          Close
        </button>
      </div>
    </div>
  </div>
)}
{isCertificatePreviewModalOpen && certificate && (
  <div
    className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 px-4 py-6"
    role="dialog"
    aria-modal="true"
    onClick={() => setIsCertificatePreviewModalOpen(false)}
  >
    <div
      className="max-h-[90vh] w-full max-w-6xl overflow-auto rounded-2xl bg-white p-4 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="sticky top-0 z-10 mb-3 flex items-center justify-between bg-white px-2 py-1">
        <h2 className="font-bold text-[#101828]">Certificate Preview</h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void handleDownloadCertificatePreview()}
            disabled={!certificate?.pdfUrl && !certificate?.certificateUrl}
            className="rounded-lg border border-[#08056b] px-3 py-2 text-sm font-semibold text-[#08056b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => setIsCertificatePreviewModalOpen(false)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
            aria-label="Close certificate preview"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      </div>
      <div ref={certificatePreviewRef}>
        <CertificatePreview
          pastorName={certificate.pastorName || fullName}
          completionDate={certificate.completionDate || completionDate}
          certificateId={certificate.certificateId}
          duration={certificate.duration}
        />
      </div>
    </div>
  </div>
)}
    </div>
  );
}
