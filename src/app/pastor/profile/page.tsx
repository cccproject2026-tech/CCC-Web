"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { clearAllCookies, getCookie, setCookie } from "@/app/utils/cookies";
import {
  apiAcceptInvitation,
  apiRejectInvitation,
  apiUploadProfilePicture,
  apiUpdateUserById,
} from "@/app/Services/users.service";
import { apiLogout } from "@/app/Services/api";
import PastorHeader from "@/app/Components/PastorHeader";
import ProfilePic from "@/app/Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import {
  apiGetUserCertificate,
  hasRealCertificate,
  unwrapCertificate,
  type CertificateRecord,
} from "@/app/Services/certificates.service";
import type { FieldMentorInvitation } from "@/app/Services/types/users.types";
import {
  getSingleUser,
  updateInterestByEmail,
  uploadDocument,
  getUserDocuments,
} from "@/app/Services/pastor.service";

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

type UploadedDoc = {
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
};

type PendingFile = {
  file: File;
  status: "pending" | "uploading" | "success" | "error";
  error?: string;
};

export default function PastorProfile() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<any>({});
  const [invitationActionLoading, setInvitationActionLoading] = useState(false);
  const [invitationMessage, setInvitationMessage] = useState<string | null>(null);
  const [invitationMessageTone, setInvitationMessageTone] = useState<"success" | "error" | "info">("info");
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [certificate, setCertificate] = useState<CertificateRecord | null>(null);
  const [certificateLoading, setCertificateLoading] = useState(false);

  // Document modal state
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [existingDocs, setExistingDocs] = useState<UploadedDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileImageInputRef = useRef<HTMLInputElement | null>(null);
  const redirectTimeoutRef = useRef<number | null>(null);
const [uploadingProfileImage, setUploadingProfileImage] = useState(false);

  const fieldMentorInvitation = profile?.fieldMentorInvitation as FieldMentorInvitation | undefined;
  const hasFieldMentorInvitation = profile?.role === "pastor" && Boolean(fieldMentorInvitation);
  const hasCertificate = hasRealCertificate(certificate);
  const invitationExpired = Boolean(
    fieldMentorInvitation?.expiresAt && new Date(fieldMentorInvitation.expiresAt) < new Date(),
  );

  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        window.clearTimeout(redirectTimeoutRef.current);
      }
    };
  }, []);

  const handleAcceptInvitation = async () => {
    const token = fieldMentorInvitation?.token;
    if (!token) {
      setInvitationMessageTone("error");
      setInvitationMessage("Invitation token is missing. Please contact support.");
      return;
    }

    try {
      setInvitationActionLoading(true);
      setInvitationMessage(null);
      const res = await apiAcceptInvitation({ token });

      const updatedUser = res.data?.data;
      if (updatedUser) {
        setProfile((prev: any) => ({
          ...prev,
          ...updatedUser,
          fieldMentorInvitation: undefined,
        }));

        const storedUser = JSON.parse(getCookie("user") || "{}");
        setCookie(
          "user",
          JSON.stringify({
            ...storedUser,
            ...updatedUser,
            role: updatedUser.role,
            hasCompleted: updatedUser.hasCompleted,
          }),
          30,
        );
      }
      setInvitationMessage(null);
      setToastMessage(res.data?.message || "Invitation accepted successfully. Role updated to field-mentor.");
      redirectTimeoutRef.current = window.setTimeout(() => {
        void apiLogout().catch(() => {});
        clearAllCookies();
        router.push("/mentor/login");
      }, 1600);
    } catch (err: any) {
      setInvitationMessageTone("error");
      setInvitationMessage(err?.response?.data?.message || "Failed to accept invitation.");
    } finally {
      setInvitationActionLoading(false);
    }
  };

  const handleRejectInvitation = async () => {
    const token = fieldMentorInvitation?.token;
    if (!token) {
      setInvitationMessageTone("error");
      setInvitationMessage("Invitation token is missing. Please contact support.");
      return;
    }

    try {
      setInvitationActionLoading(true);
      setInvitationMessage(null);
      const res = await apiRejectInvitation({ token });

      const updatedUser = res.data?.data;
      if (updatedUser) {
        setProfile((prev: any) => ({
          ...prev,
          ...updatedUser,
          fieldMentorInvitation: undefined,
        }));

        const storedUser = JSON.parse(getCookie("user") || "{}");
        setCookie(
          "user",
          JSON.stringify({
            ...storedUser,
            ...updatedUser,
            role: updatedUser.role,
            hasCompleted: updatedUser.hasCompleted,
          }),
          30,
        );
      } else {
        setProfile((prev: any) => ({
          ...prev,
          fieldMentorInvitation: undefined,
        }));
      }

      setInvitationMessageTone("success");
      setInvitationMessage(res.data?.message || "Invitation rejected successfully.");
    } catch (err: any) {
      setInvitationMessageTone("error");
      setInvitationMessage(err?.response?.data?.message || "Failed to reject invitation.");
    } finally {
      setInvitationActionLoading(false);
    }
  };



  useEffect(() => {
  const storedUser = JSON.parse(getCookie("user") || "{}");
  const userId = storedUser?.id || storedUser?._id;

  if (!userId) return;

  async function fetchUser() {
    try {
      const res = await getSingleUser(userId);
      const apiUser = res.data?.data;

      const mergedUser = {
        ...apiUser,
        // profilePicture:
        //   apiUser?.profilePicture ||
        //   storedUser?.profilePicture ||
        //   "",
        profilePicture:
  storedUser?.profilePicture ||
  apiUser?.profilePicture ||
  "",
 
      };

      setProfile(mergedUser);
      initForm(mergedUser);
    } catch (err) {
      console.error("Error fetching profile:", err);

      // fallback: use cookie data if API fails
      if (storedUser?.profilePicture) {
        setProfile(storedUser);
        initForm(storedUser);
      }
    }
  }

  fetchUser();
}, []);

  useEffect(() => {
    const userId = profile?.id || profile?._id;
    if (!userId) return;

    let cancelled = false;

    const fetchCertificate = async () => {
      try {
        setCertificateLoading(true);
        const certRes = await apiGetUserCertificate(String(userId)).catch((error) => {
          if (error?.response?.status === 404) return null;
          throw error;
        });
        if (cancelled) return;
        setCertificate(unwrapCertificate(certRes));
      } catch {
        if (!cancelled) setCertificate(null);
      } finally {
        if (!cancelled) setCertificateLoading(false);
      }
    };

    void fetchCertificate();

    return () => {
      cancelled = true;
    };
  }, [profile?.id, profile?._id]);

  const initForm = (data: any) => {
    setForm({
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || "",
      profilePicture: data.profilePicture || "",
      profileInfo: data.interest?.profileInfo || "",
      phoneNumber: data.interest?.phoneNumber || "",
      title: data.interest?.title || "",
      yearsInMinistry: data.interest?.yearsInMinistry || "",
      conference: data.interest?.conference || "",
      currentCommunityProjects: data.interest?.currentCommunityProjects || "",
      interests: normalizeInterestsList(data.interest?.interests).join(", "),
      comments: data.interest?.comments || "",
      churchName: data.interest?.churchDetails?.[0]?.churchName || "",
      churchPhone: data.interest?.churchDetails?.[0]?.churchPhone || "",
      churchWebsite: data.interest?.churchDetails?.[0]?.churchWebsite || "",
      churchAddress: data.interest?.churchDetails?.[0]?.churchAddress || "",
      city: data.interest?.churchDetails?.[0]?.city || "",
      state: data.interest?.churchDetails?.[0]?.state || "",
      zipCode: data.interest?.churchDetails?.[0]?.zipCode || "",
      country: data.interest?.churchDetails?.[0]?.country || "",
    });
  };

  const handleChange = (field: string, value: string) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  e.target.value = "";

  if (!file) return;

  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  if (!allowedTypes.includes(file.type)) {
    alert("Only JPEG, PNG, and WebP images are allowed.");
    return;
  }

  const userId = profile?.id || profile?._id;
  if (!userId) return;

  try {
    setUploadingProfileImage(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await apiUploadProfilePicture(userId, formData);
    const uploadedUrl = res.data?.data?.profilePicture;

if (uploadedUrl) {
  const storedUser = JSON.parse(getCookie("user") || "{}");

  setCookie(
    "user",
    JSON.stringify({
      ...storedUser,
      profilePicture: uploadedUrl,
    }),
    30
  );

  setProfile((prev: any) => ({
    ...prev,
    profilePicture: uploadedUrl,
  }));

  setForm((prev: any) => ({
    ...prev,
    profilePicture: uploadedUrl,
  }));
}

    setProfile((prev: any) => ({
      ...prev,
      profilePicture: uploadedUrl || prev?.profilePicture,
    }));

    setForm((prev: any) => ({
      ...prev,
      profilePicture: uploadedUrl || prev?.profilePicture,
    }));
  } catch (err: any) {
    console.error("Profile image upload failed", err?.response?.data || err);
    alert(err?.response?.data?.message || "Profile image upload failed");
  } finally {
    setUploadingProfileImage(false);
  }
};

  // -------------------------
  // SAVE
  // -------------------------
  
  const handleSave = async () => {
  try {
    const userId = String(profile?.id || profile?._id || "");
    const email = String(profile?.email || form.email || "");

    if (!userId) {
      console.error("Missing pastor user id — cannot save profile.");
      return;
    }

    if (!email) {
      console.error("Missing pastor email — cannot update interest details.");
      return;
    }

    const userPayload = {
      firstName: form.firstName,
      lastName: form.lastName,
      profilePicture: form.profilePicture,
    };

    const churchDetailsPayload = [
      {
        churchName: form.churchName,
        churchPhone: form.churchPhone,
        churchWebsite: form.churchWebsite,
        churchAddress: form.churchAddress,
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        country: form.country,
      },
    ];

    const interestPayload = {
      profileInfo: form.profileInfo,
      phoneNumber: form.phoneNumber,
      title: form.title,
      yearsInMinistry: form.yearsInMinistry,
      conference: form.conference,
      currentCommunityProjects: form.currentCommunityProjects,
      comments: form.comments,
      interests: normalizeInterestsList(form.interests),
      churchDetails: churchDetailsPayload,
    };

    // await Promise.all([
    //   updateUser(userId, userPayload),
    //   updateInterestByEmail(email, interestPayload),
    // ]);
console.log("PASTOR USER ID:", userId);
console.log("PASTOR USER PAYLOAD:", userPayload);
console.log("PASTOR INTEREST PAYLOAD:", interestPayload);


const interestRes = await updateInterestByEmail(email, {
  ...interestPayload,
  firstName: form.firstName,
  lastName: form.lastName,
});

const userRes = await apiUpdateUserById(userId, userPayload);

console.log("INTEREST UPDATE RESPONSE:", interestRes.data);
console.log("USER UPDATED LAST NAME:", userRes.data?.data?.lastName);

const freshRes = await getSingleUser(userId);
console.log("FRESH USER AFTER SAVE:", freshRes.data?.data?.lastName);

    setProfile((prev: any) => ({
      ...prev,
      ...userPayload,
      interest: {
        ...(prev?.interest || {}),
        ...interestPayload,
      },
    }));

    setForm((prev: any) => ({
      ...prev,
      ...userPayload,
      ...interestPayload,
      interests: normalizeInterestsList(interestPayload.interests).join(", "),
      churchName: churchDetailsPayload[0].churchName,
      churchPhone: churchDetailsPayload[0].churchPhone,
      churchWebsite: churchDetailsPayload[0].churchWebsite,
      churchAddress: churchDetailsPayload[0].churchAddress,
      city: churchDetailsPayload[0].city,
      state: churchDetailsPayload[0].state,
      zipCode: churchDetailsPayload[0].zipCode,
      country: churchDetailsPayload[0].country,
    }));

    setIsEditing(false);
  } catch (err: any) {
    console.error("Error saving profile:", err?.response?.data || err);
    alert(err?.response?.data?.message || "Error saving profile.");
  }
};

  const handleCancel = () => {
    initForm(profile);
    setIsEditing(false);
  };

  // -------------------------
  // DOCUMENT MODAL
  // -------------------------
  const openDocsModal = async () => {
    setShowDocsModal(true);
    setPendingFiles([]);
    setLoadingDocs(true);
    try {
      const userId = profile?.id || profile?._id;
      const res = await getUserDocuments(userId);
      setExistingDocs(res.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
      setExistingDocs([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const closeDocsModal = () => {
    setShowDocsModal(false);
    setPendingFiles([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newPending: PendingFile[] = files.map((file) => ({
      file,
      status: "pending",
    }));
    setPendingFiles((prev) => [...prev, ...newPending]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUploadAll = async () => {
    const userId = profile?.id || profile?._id;
    const toUpload = pendingFiles.filter((f) => f.status === "pending");
    if (toUpload.length === 0) return;

    for (let i = 0; i < pendingFiles.length; i++) {
      if (pendingFiles[i].status !== "pending") continue;

      setPendingFiles((prev) =>
        prev.map((f, idx) => idx === i ? { ...f, status: "uploading" } : f)
      );

      try {
        const res = await uploadDocument(userId, pendingFiles[i].file);
        const uploaded: UploadedDoc = res.data?.data;
        setExistingDocs((prev) => [...prev, uploaded]);
        setPendingFiles((prev) =>
          prev.map((f, idx) => idx === i ? { ...f, status: "success" } : f)
        );
      } catch (err: any) {
        const errMsg = err?.response?.data?.message || "Upload failed";
        setPendingFiles((prev) =>
          prev.map((f, idx) => idx === i ? { ...f, status: "error", error: errMsg } : f)
        );
      }
    }
  };

  const removePending = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes("pdf")) return "fa-file-pdf text-red-500";
    if (fileType.includes("image")) return "fa-file-image text-blue-500";
    if (fileType.includes("word") || fileType.includes("document")) return "fa-file-word text-blue-700";
    if (fileType.includes("sheet") || fileType.includes("excel")) return "fa-file-excel text-green-600";
    return "fa-file text-gray-500";
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_20%_12%,rgba(141,211,243,0.18),transparent_38%),linear-gradient(180deg,#041f35_0%,#062946_100%)] text-center text-white">
        <PastorHeader showFullHeader={true} />
        <div className="p-10">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_12%,rgba(141,211,243,0.18),transparent_38%),linear-gradient(180deg,#041f35_0%,#062946_100%)] text-white">
      <PastorHeader showFullHeader={true} />

      {toastMessage ? (
        <div className="fixed left-1/2 top-6 z-[120] -translate-x-1/2 px-4">
          <div className="rounded-xl border border-emerald-400/35 bg-emerald-500/15 px-5 py-3 text-sm font-semibold text-emerald-50 shadow-[0_18px_40px_rgba(2,20,38,0.35)] backdrop-blur-sm">
            {toastMessage}
          </div>
        </div>
      ) : null}

      <main className="px-4 py-10 md:px-8 lg:px-16 flex justify-center">
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl">

          {/* LEFT PROFILE CARD */}
          <div className="w-full flex-shrink-0 rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-6 text-center shadow-[0_18px_40px_rgba(2,20,38,0.35)] md:w-[320px]">
            {/* <Image
              src={profile.profilePicture || ProfilePic}
              alt="Profile"
              width={104}
              height={104}
              className="mx-auto mb-4 rounded-full border-2 border-[#8ec5eb]/55 object-cover shadow-[0_10px_24px_rgba(2,20,38,0.35)]"
            /> */}

            {/* <Image
  src={profile?.profilePicture || form?.profilePicture || ProfilePic}
  alt="Profile"
  width={104}
  height={104}
  unoptimized
  className="mx-auto mb-4 h-[104px] w-[104px] rounded-full border-2 border-[#8ec5eb]/55 object-cover shadow-[0_10px_24px_rgba(2,20,38,0.35)]"
/> */}
<div className="relative mx-auto mb-4 h-[104px] w-[104px] overflow-hidden rounded-full border-2 border-[#8ec5eb]/55 bg-white/10 shadow-[0_10px_24px_rgba(2,20,38,0.35)]">
  {/* <Image
    src={profile?.profilePicture || form?.profilePicture || ProfilePic}
    alt="Pastor profile"
    width={104}
    height={104}
    unoptimized
    className="h-full w-full rounded-full object-cover"
  /> */}
  <img
  src={
    profile?.profilePicture ||
    form?.profilePicture ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      `${profile?.firstName || form?.firstName || ""} ${profile?.lastName || form?.lastName || ""}`.trim() || "User"
    )}&background=173653&color=ffffff`
  }
  alt="Pastor profile"
  className="h-full w-full rounded-full object-cover"
/>

  <button
    type="button"
    onClick={() => profileImageInputRef.current?.click()}
    disabled={uploadingProfileImage}
    className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-[10px] font-semibold text-white transition hover:bg-black/70 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {uploadingProfileImage ? "Uploading..." : "Change"}
  </button>

  <input
    ref={profileImageInputRef}
    type="file"
    accept="image/jpeg,image/png,image/webp"
    className="hidden"
    onChange={handleProfileImageChange}
  />
</div>
            <p className="mb-1 text-sm text-[#cde2f2]">Good Morning</p>
            <h3 className="text-[33px] font-semibold leading-tight text-white">
              {profile.firstName} {profile.lastName}
            </h3>
            <p className="mb-4 text-base capitalize text-[#cde2f2]">{profile.role}</p>

            <div className="my-3 border-t border-white/15"></div>

            <button
              type="button"
              disabled={!hasCertificate || certificateLoading}
              onClick={() => {
                if (hasCertificate) {
                  router.push("/pastor/Certificates");
                }
              }}
              className="mb-4 flex w-full items-center justify-center rounded-xl border border-[#8ec5eb]/45 bg-[#062946]/55 px-4 py-3 text-sm font-semibold text-[#d9ebf8] transition hover:border-[#8ec5eb]/70 hover:bg-[#0d426d] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {certificateLoading
                ? "Checking certificate..."
                : hasCertificate
                  ? "View Certificate"
                  : "Certificate not issued"}
            </button>

            {hasFieldMentorInvitation && (
              <>
                <div className="mb-5 rounded-2xl border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 p-4 text-left">
                  <div className="min-w-0">
                      <p className="text-sm font-semibold text-white">You have been invited as a Field Mentor.</p>
                      {!invitationExpired ? (
                        <div className="mt-4 space-y-3">
                          {invitationMessage ? (
                            <p
                              className={`text-xs ${
                                invitationMessageTone === "success"
                                  ? "text-emerald-200"
                                  : invitationMessageTone === "error"
                                    ? "text-rose-200"
                                    : "text-[#d9ebf8]"
                              }`}
                            >
                              {invitationMessage}
                            </p>
                          ) : null}
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={handleAcceptInvitation}
                              disabled={invitationActionLoading}
                              className="flex-1 rounded-xl bg-[#8ec5eb] px-4 py-2.5 text-sm font-semibold text-[#062946] transition hover:bg-[#a9d5f2] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {invitationActionLoading ? "Accepting..." : "Accept"}
                            </button>
                            <button
                              type="button"
                              onClick={handleRejectInvitation}
                              disabled={invitationActionLoading}
                              className="flex-1 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : null}
                  </div>
                </div>
              </>
            )}

            <p className="mb-2 text-left text-sm font-semibold text-[#d9ebf8]">
              Profile Information
            </p>
            <textarea
              readOnly={!isEditing}
              value={form.profileInfo || ""}
              onChange={(e) => handleChange("profileInfo", e.target.value)}
              placeholder="No profile information added."
              className={`mb-5 w-full resize-none rounded-xl border px-3 py-3 text-sm leading-relaxed ${
                isEditing
                  ? "border-[#8ec5eb] bg-white/10 text-white placeholder:text-[#cde2f2] focus:outline-none focus:ring-1 focus:ring-[#8ec5eb]"
                  : "cursor-default border-white/20 bg-[#0a3d66]/90 text-[#e4f1fb]"
              }`}
              rows={4}
            />

            <button
              onClick={openDocsModal}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#8ec5eb]/45 bg-[#062946]/55 px-4 py-3 text-base font-semibold text-[#d9ebf8] transition hover:border-[#8ec5eb]/70 hover:bg-[#0d426d]"
            >
              <i className="fa-solid fa-paperclip text-[#8ec5eb] text-lg"></i>
              documents
            </button>
          </div>

          {/* RIGHT FORM */}
          <div className="flex-1 rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-8 shadow-[0_18px_40px_rgba(2,20,38,0.35)] backdrop-blur-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg">Personal Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="rounded-xl border border-white/30 px-4 py-1 text-sm hover:bg-white/10 transition"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="rounded-xl bg-white/20 px-4 py-1 text-sm hover:bg-white/30 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="rounded-xl bg-[#8ec5eb] px-4 py-1 text-sm font-semibold text-[#062946] transition hover:bg-[#a9d5f2]"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>

            <form className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <input type="text" className="form-input" placeholder="First Name" readOnly={!isEditing} value={form.firstName} onChange={(e) => handleChange("firstName", e.target.value)} />
              <input type="text" className="form-input" placeholder="Last Name" readOnly={!isEditing} value={form.lastName} onChange={(e) => handleChange("lastName", e.target.value)} />
              <input type="email" className="form-input" placeholder="Email" readOnly value={form.email} />
              <input type="text" className="form-input" placeholder="Phone Number" readOnly={!isEditing} value={form.phoneNumber} onChange={(e) => handleChange("phoneNumber", e.target.value)} />

              <h3 className="col-span-2 mt-6 font-semibold text-white">Current Church - Information</h3>
              {(["churchName", "churchPhone", "churchWebsite", "churchAddress", "city", "state", "zipCode", "country"] as const).map((field) => (
                <input key={field} type="text" className="form-input" placeholder={field} readOnly={!isEditing} value={form[field]} onChange={(e) => handleChange(field, e.target.value)} />
              ))}

              <h3 className="col-span-2 text-white font-semibold mt-6">Other Information</h3>
              <input type="text" className="form-input" placeholder="Title" readOnly={!isEditing} value={form.title} onChange={(e) => handleChange("title", e.target.value)} />
              <input type="text" className="form-input" placeholder="Years in Ministry" readOnly={!isEditing} value={form.yearsInMinistry} onChange={(e) => handleChange("yearsInMinistry", e.target.value)} />
              <input type="text" className="form-input" placeholder="Conference" readOnly={!isEditing} value={form.conference} onChange={(e) => handleChange("conference", e.target.value)} />
              <input type="text" className="form-input" placeholder="Current Community Projects" readOnly={!isEditing} value={form.currentCommunityProjects} onChange={(e) => handleChange("currentCommunityProjects", e.target.value)} />
              <textarea className="form-input col-span-2 h-16 resize-none" placeholder="Interests" readOnly={!isEditing} value={form.interests} onChange={(e) => handleChange("interests", e.target.value)} />
              <textarea className="form-input col-span-2 h-16 resize-none" placeholder="Concerns" readOnly={!isEditing} value={form.comments} onChange={(e) => handleChange("comments", e.target.value)} />
            </form>
          </div>
        </div>
      </main>

      {/* DOCUMENTS MODAL */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-[rgba(2,16,30,0.76)] backdrop-blur-sm" onClick={closeDocsModal} />

          <div className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col rounded-2xl border border-white/20 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] text-white shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/15 px-6 py-4">
              <h3 className="text-base font-semibold text-white">Documents</h3>
              <button onClick={closeDocsModal} className="flex h-7 w-7 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white">
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

              {/* Uploaded documents */}
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#cde2f2]">
                  Uploaded Documents ({existingDocs.length})
                </p>

                {loadingDocs ? (
                  <p className="text-sm text-[#cde2f2]">Loading...</p>
                ) : existingDocs.length === 0 ? (
                  <p className="text-sm text-[#cde2f2]">No documents uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {existingDocs.map((doc, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5">
                        <i className={`fa-solid ${getFileIcon(doc.fileType)} text-lg w-5 text-center`}></i>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-white">{doc.fileName}</p>
                          <p className="text-xs text-[#cde2f2]">
                            {formatFileSize(doc.fileSize)} · {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-[#8ec5eb] hover:text-white"
                        >
                          <i className="fa-solid fa-arrow-up-right-from-square"></i>
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Pending files to upload */}
              {pendingFiles.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[#cde2f2]">
                    Ready to Upload ({pendingFiles.filter(f => f.status === "pending").length} pending)
                  </p>
                  <div className="space-y-2">
                    {pendingFiles.map((pf, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/5 px-3 py-2.5">
                        <i className={`fa-solid ${getFileIcon(pf.file.type)} text-lg w-5 text-center`}></i>
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium text-white">{pf.file.name}</p>
                          <p className="text-xs text-[#cde2f2]">{formatFileSize(pf.file.size)}</p>
                        </div>
                        {/* Status badge */}
                        {pf.status === "pending" && (
                          <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs text-white/80">Pending</span>
                        )}
                        {pf.status === "uploading" && (
                          <span className="flex items-center gap-1 rounded-full bg-[#8ec5eb]/20 px-2 py-0.5 text-xs text-[#cde2f2]">
                            <i className="fa-solid fa-spinner fa-spin text-[10px]"></i> Uploading
                          </span>
                        )}
                        {pf.status === "success" && (
                          <span className="flex items-center gap-1 rounded-full bg-[#3DBE72]/25 px-2 py-0.5 text-xs text-[#9ef0be]">
                            <i className="fa-solid fa-check text-[10px]"></i> Done
                          </span>
                        )}
                        {pf.status === "error" && (
                          <span className="rounded-full bg-[#d95d5d]/25 px-2 py-0.5 text-xs text-[#ffb2b2]" title={pf.error}>
                            <i className="fa-solid fa-xmark text-[10px]"></i> Failed
                          </span>
                        )}
                        {pf.status === "pending" && (
                          <button onClick={() => removePending(i)} className="ml-1 text-white/60 transition hover:text-[#ffb2b2]">
                            <i className="fa-solid fa-trash text-xs"></i>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 border-t border-white/15 px-6 py-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={handleFileSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 rounded-xl border border-white/30 px-4 py-2 text-sm text-[#d9ebf8] transition hover:bg-white/10"
              >
                <i className="fa-solid fa-plus text-xs"></i> Add Files
              </button>

              <button
                onClick={handleUploadAll}
                disabled={pendingFiles.filter(f => f.status === "pending").length === 0}
                className="flex items-center gap-2 rounded-xl bg-[#8ec5eb] px-5 py-2 text-sm font-semibold text-[#062946] transition hover:bg-[#a9d5f2] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <i className="fa-solid fa-cloud-arrow-up text-xs"></i>
                Upload {pendingFiles.filter(f => f.status === "pending").length > 0
                  ? `(${pendingFiles.filter(f => f.status === "pending").length})`
                  : ""}
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        .form-input {
          @apply rounded-xl border border-white/20 bg-white/5 px-3 py-2 text-sm text-white placeholder-[#cde2f2] focus:outline-none focus:ring-2 focus:ring-[#8ec5eb];
        }
      `}</style>
    </div>
  );
}
