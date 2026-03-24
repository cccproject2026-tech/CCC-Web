"use client";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { getCookie } from "@/app/utils/cookies";
import PastorHeader from "@/app/Components/PastorHeader";
import ProfilePic from "@/app/Assets/user-profile.png";
import "@fortawesome/fontawesome-free/css/all.min.css";
import {
  getSingleUser,
  updateUser,
  updateInterestByEmail,
  uploadDocument,
  getUserDocuments,
} from "@/app/Services/pastor.service";

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
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  // Document modal state
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [existingDocs, setExistingDocs] = useState<UploadedDoc[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -------------------------
  // FETCH USER
  // -------------------------
  useEffect(() => {
    const storedUser = JSON.parse(getCookie("user") || "{}");
    const userId = storedUser?.id;
    if (!userId) return;

    async function fetchUser() {
      try {
        const res = await getSingleUser(userId);
        const data = res.data?.data;
        setProfile(data);
        initForm(data);
      } catch (err) {
        console.error("Error fetching profile:", err);
      }
    }

    fetchUser();
  }, []);

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
      interests: data.interest?.interests?.join(", ") || "",
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

  // -------------------------
  // SAVE
  // -------------------------
  const handleSave = async () => {
    try {
      const userId = profile?.id || profile?._id;
      const email = profile?.email;

      const userPayload: any = {};
      if (form.firstName !== (profile.firstName || "")) userPayload.firstName = form.firstName;
      if (form.lastName !== (profile.lastName || "")) userPayload.lastName = form.lastName;
      if (form.profilePicture !== (profile.profilePicture || "")) userPayload.profilePicture = form.profilePicture;

      const prevChurch = profile.interest?.churchDetails?.[0] || {};
      const interestPayload: any = {};
      if (form.profileInfo !== (profile.interest?.profileInfo || "")) interestPayload.profileInfo = form.profileInfo;
      if (form.phoneNumber !== (profile.interest?.phoneNumber || "")) interestPayload.phoneNumber = form.phoneNumber;
      if (form.title !== (profile.interest?.title || "")) interestPayload.title = form.title;
      if (form.yearsInMinistry !== (profile.interest?.yearsInMinistry || "")) interestPayload.yearsInMinistry = form.yearsInMinistry;
      if (form.conference !== (profile.interest?.conference || "")) interestPayload.conference = form.conference;
      if (form.currentCommunityProjects !== (profile.interest?.currentCommunityProjects || "")) interestPayload.currentCommunityProjects = form.currentCommunityProjects;
      if (form.comments !== (profile.interest?.comments || "")) interestPayload.comments = form.comments;
      if (form.interests !== (profile.interest?.interests?.join(", ") || "")) {
        interestPayload.interests = form.interests
          ? form.interests.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [];
      }

      const churchChanged =
        form.churchName !== (prevChurch.churchName || "") ||
        form.churchPhone !== (prevChurch.churchPhone || "") ||
        form.churchWebsite !== (prevChurch.churchWebsite || "") ||
        form.churchAddress !== (prevChurch.churchAddress || "") ||
        form.city !== (prevChurch.city || "") ||
        form.state !== (prevChurch.state || "") ||
        form.zipCode !== (prevChurch.zipCode || "") ||
        form.country !== (prevChurch.country || "");

      if (churchChanged) {
        interestPayload.churchDetails = [{
          churchName: form.churchName,
          churchPhone: form.churchPhone,
          churchWebsite: form.churchWebsite,
          churchAddress: form.churchAddress,
          city: form.city,
          state: form.state,
          zipCode: form.zipCode,
          country: form.country,
        }];
      }

      const hasUserChanges = Object.keys(userPayload).length > 0;
      const hasInterestChanges = Object.keys(interestPayload).length > 0;

      await Promise.all([
        hasUserChanges ? updateUser(userId, userPayload) : null,
        hasInterestChanges ? updateInterestByEmail(email, interestPayload) : null,
      ].filter(Boolean));

      setProfile((prev: any) => ({
        ...prev,
        ...(hasUserChanges ? userPayload : {}),
        interest: {
          ...prev.interest,
          ...(hasInterestChanges ? interestPayload : {}),
        },
      }));

      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
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
      <div className="text-center text-white p-10">
        <PastorHeader showFullHeader={true} />
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#103C8C] to-[#1A4B9A] text-white">
      <PastorHeader showFullHeader={true} />

      <main className="px-10 py-8 flex justify-center">
        <div className="flex flex-col md:flex-row gap-8 w-full max-w-7xl">

          {/* LEFT PROFILE CARD */}
          <div className="bg-white rounded-xl shadow-md p-5 text-center w-full md:w-[280px] flex-shrink-0">
            <Image
              src={profile.profilePicture || ProfilePic}
              alt="Profile"
              width={85}
              height={85}
              className="rounded-full mx-auto mb-3"
            />
            <p className="text-gray-400 text-xs mb-1">Good Morning</p>
            <h3 className="text-gray-900 font-semibold text-base">
              {profile.firstName} {profile.lastName}
            </h3>
            <p className="text-gray-500 text-xs mb-3 capitalize">{profile.role}</p>

            <div className="border-t border-gray-200 my-3"></div>

            <p className="text-left text-gray-400 text-xs font-medium mb-1">
              Profile Information
            </p>
            <textarea
              readOnly={!isEditing}
              value={form.profileInfo || ""}
              onChange={(e) => handleChange("profileInfo", e.target.value)}
              placeholder="No profile information added."
              className={`w-full text-xs text-gray-700 border rounded-md p-2 resize-none mb-4 ${
                isEditing
                  ? "border-[#103C8C] focus:outline-none focus:ring-1 focus:ring-[#103C8C] bg-white"
                  : "border-gray-300 bg-gray-50 cursor-default"
              }`}
              rows={3}
            />

            <button
              onClick={openDocsModal}
              className="text-xs font-medium text-[#103C8C] border border-[#DADADA] rounded-md px-3 py-2 w-full hover:bg-[#F5F7FB] transition flex items-center justify-center gap-2"
            >
              <i className="fa-solid fa-paperclip text-[#103C8C]"></i>
              Upload documents
            </button>
          </div>

          {/* RIGHT FORM */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl shadow-md p-8 flex-1 border border-white/20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg">Personal Information</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-sm border border-white px-4 py-1 rounded-md hover:bg-white hover:text-[#103C8C] transition"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-3">
                  <button
                    onClick={handleCancel}
                    className="text-sm bg-white/20 px-4 py-1 rounded-md hover:bg-white/30 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="text-sm bg-white text-[#103C8C] font-medium px-4 py-1 rounded-md hover:bg-white/90 transition"
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

              <h3 className="col-span-2 text-white font-semibold mt-6">Current Church – Information</h3>
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
          <div className="absolute inset-0 bg-black/60" onClick={closeDocsModal} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-gray-900 font-semibold text-base">Documents</h3>
              <button onClick={closeDocsModal} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 transition">
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">

              {/* Uploaded documents */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Uploaded Documents ({existingDocs.length})
                </p>

                {loadingDocs ? (
                  <p className="text-sm text-gray-400">Loading...</p>
                ) : existingDocs.length === 0 ? (
                  <p className="text-sm text-gray-400">No documents uploaded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {existingDocs.map((doc, i) => (
                      <div key={i} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2.5 border border-gray-200">
                        <i className={`fa-solid ${getFileIcon(doc.fileType)} text-lg w-5 text-center`}></i>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium truncate">{doc.fileName}</p>
                          <p className="text-xs text-gray-400">
                            {formatFileSize(doc.fileSize)} · {new Date(doc.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#103C8C] hover:text-[#0D2E6E] text-xs"
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
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Ready to Upload ({pendingFiles.filter(f => f.status === "pending").length} pending)
                  </p>
                  <div className="space-y-2">
                    {pendingFiles.map((pf, i) => (
                      <div key={i} className="flex items-center gap-3 bg-blue-50 rounded-lg px-3 py-2.5 border border-blue-100">
                        <i className={`fa-solid ${getFileIcon(pf.file.type)} text-lg w-5 text-center`}></i>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium truncate">{pf.file.name}</p>
                          <p className="text-xs text-gray-400">{formatFileSize(pf.file.size)}</p>
                        </div>
                        {/* Status badge */}
                        {pf.status === "pending" && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Pending</span>
                        )}
                        {pf.status === "uploading" && (
                          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <i className="fa-solid fa-spinner fa-spin text-[10px]"></i> Uploading
                          </span>
                        )}
                        {pf.status === "success" && (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <i className="fa-solid fa-check text-[10px]"></i> Done
                          </span>
                        )}
                        {pf.status === "error" && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full" title={pf.error}>
                            <i className="fa-solid fa-xmark text-[10px]"></i> Failed
                          </span>
                        )}
                        {pf.status === "pending" && (
                          <button onClick={() => removePending(i)} className="text-gray-400 hover:text-red-500 transition ml-1">
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
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between gap-3">
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
                className="text-sm text-[#103C8C] border border-[#103C8C] px-4 py-2 rounded-lg hover:bg-[#103C8C] hover:text-white transition flex items-center gap-2"
              >
                <i className="fa-solid fa-plus text-xs"></i> Add Files
              </button>

              <button
                onClick={handleUploadAll}
                disabled={pendingFiles.filter(f => f.status === "pending").length === 0}
                className="text-sm bg-[#103C8C] text-white px-5 py-2 rounded-lg hover:bg-[#0D2E6E] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
          @apply border border-gray-300 bg-white/20 text-white rounded-md px-3 py-2 text-sm placeholder-gray-200 focus:outline-none focus:ring-2 focus:ring-[#00D1B2];
        }
      `}</style>
    </div>
  );
}
