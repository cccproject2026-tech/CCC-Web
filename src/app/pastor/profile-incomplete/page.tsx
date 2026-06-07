"use client";
import { useEffect, useRef, useState } from "react";
import { getCookie, setCookie } from "@/app/utils/cookies";
import {
  getPastorUserId,
  normalizeUserCookieForClient,
} from "@/app/utils/pastor-auth";
import Image, { StaticImageData } from "next/image";
import PastorHeader from "@/app/Components/PastorHeader";
import ProfileLogo from "../../Assets/profile.png";
import EditLogo from "../../Assets/Edit.png";
import { useRouter } from "next/navigation";
import { apiUploadProfilePicture, apiUploadDocument } from "@/app/Services/api";

type User = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  profilePicture?: string;
};

type UploadedDocument = {
  fileName: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  uploadedAt?: string;
};

export default function ProfileIncomplete() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [profileImage, setProfileImage] = useState<string | StaticImageData>(
    ProfileLogo
  );

  const [selectedProfileFile, setSelectedProfileFile] = useState<File | null>(null);
const [hasProfileChanged, setHasProfileChanged] = useState(false);

  // 🔹 Profile picture upload state
  const [isProfileUploading, setIsProfileUploading] = useState(false);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  // 🔹 Documents upload state
  const [isDocUploading, setIsDocUploading] = useState(false);
  const [docErrorMsg, setDocErrorMsg] = useState<string | null>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null); // profile picture
  const docFileInputRef = useRef<HTMLInputElement | null>(null); // documents

  // 🔹 Load user from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = getCookie("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as Record<string, unknown>;
          const normalized = normalizeUserCookieForClient(parsed) as User;
          setUser(normalized);
          // if (normalized.profilePicture) {
          //   setProfileImage(normalized.profilePicture);
          // }
          if (normalized.profilePicture) {
  setProfileImage(normalized.profilePicture);
  router.replace("/pastor/home");
}
        } catch (e) {
          console.error("Failed to parse user from cookie", e);
        }
      }
    }
  }, []);

  const handleEditClick = () => {
    fileInputRef.current?.click();
  };



const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    setProfileErrorMsg("Please select a valid image file.");
    return;
  }

  const previewUrl = URL.createObjectURL(file);

  setSelectedProfileFile(file);
  setProfileImage(previewUrl);
  setHasProfileChanged(true);
  setProfileErrorMsg(null);
};


const handleSaveProfile = async () => {
  const uid = getPastorUserId() || user?.id || user?._id;

  if (!uid) {
    setProfileErrorMsg("Missing user id. Please login again.");
    return;
  }

  if (!selectedProfileFile && documents.length > 0) {
    window.location.href = "/pastor/home";
    return;
  }

  if (!selectedProfileFile) {
    setProfileErrorMsg("Please choose a profile picture or upload a document first.");
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedProfileFile);

  try {
    setIsProfileUploading(true);
    setProfileErrorMsg(null);

    const response = await apiUploadProfilePicture(String(uid), formData);
    const json = response.data;

    if (!json.success) {
      setProfileErrorMsg(json.message || "Failed to upload profile picture.");
      return;
    }

    const uploadedUrl: string | undefined = json.data?.profilePicture;
    const newUrl = uploadedUrl ? `${uploadedUrl}?t=${Date.now()}` : undefined;

    if (newUrl) {
      setProfileImage(newUrl);

      const updatedUser: User = {
        ...user,
        id: user?.id || String(uid),
        _id: user?._id,
        profilePicture: newUrl,
      };

      const merged = normalizeUserCookieForClient(
        updatedUser as Record<string, unknown>
      ) as User;

      setUser(merged);
      setCookie("user", JSON.stringify(merged));
    }

    window.location.href = "/pastor/home";
  } catch (err) {
    console.error("Upload error:", err);
    setProfileErrorMsg("Something went wrong. Please try again.");
  } finally {
    setIsProfileUploading(false);
  }
};

  // 🔹 Open document file picker
  const handleUploadDocsClick = () => {
    docFileInputRef.current?.click();
  };

  // 🔹 Handle document upload
  const handleDocFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uid = getPastorUserId() || user?.id || user?._id;
    if (!uid) {
      setDocErrorMsg("Missing user id. Please login again.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsDocUploading(true);
      setDocErrorMsg(null);

      const response = await apiUploadDocument(String(uid), formData);
      const json = response.data;

      if (!json.success) {
        setDocErrorMsg(json.message || "Failed to upload document.");
        return;
      }

      const docData = json.data;
      if (docData?.fileName && docData?.fileUrl) {
        setDocuments((prev) => [
          ...prev,
          {
            fileName: docData.fileName,
            fileUrl: docData.fileUrl,
            fileType: docData.fileType,
            fileSize: docData.fileSize,
            uploadedAt: docData.uploadedAt,
          },
        ]);
      }
    } catch (err) {
      console.error("Document upload error:", err);
      setDocErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsDocUploading(false);
      e.target.value = "";
    }
  };

  const displayName =
    user?.firstName || user?.lastName
      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
      : "John Ross";

  return (
    <div className="min-h-screen flex flex-col bg-[#062946] text-white font-[Albert_Sans]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),radial-gradient(circle_at_48%_56%,rgba(111,178,246,0.12),transparent_42%),radial-gradient(circle_at_90%_80%,rgba(8,52,85,0.4),transparent_40%),linear-gradient(180deg,#041f35_0%,#062946_100%)]" />
      <PastorHeader />

      <div className="relative z-10 flex-grow flex items-center justify-center px-4 py-8">
        <div className="rounded-3xl border border-white/20 bg-[linear-gradient(180deg,rgba(10,53,88,0.85)_0%,rgba(8,43,71,0.92)_100%)] shadow-[0_24px_56px_rgba(2,20,38,0.48)] px-8 py-7 text-center relative w-full max-w-md backdrop-blur">
          {/* Banner */}
          <div className="absolute top-4 left-4 bg-[#f5cc7624] text-[#f5cc76] text-xs px-3 py-1 rounded-full border border-[#f5cc7645]">
            Your profile is incomplete.
          </div>

          {/* Skip button */}
          <button
            className="absolute top-4 right-4 text-xs text-[#cde2f2] bg-white/10 px-3 py-[2px] rounded-full border border-white/15 hover:bg-white/20 transition"
            onClick={() => router.push(`/pastor/home`)}
          >
            Skip <span className="ml-1">{">"}</span>
          </button>

          {/* Avatar + edit button */}
          <div className="flex justify-center mt-8 mb-4 relative">
            <div className="relative">
              <Image
                src={profileImage}
                alt="Profile Avatar"
                width={100}
                height={100}
                className="w-[104px] h-[104px] object-cover rounded-full border-2 border-white/60 bg-white"
              />

              <button
                type="button"
                onClick={handleEditClick}
                className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-[#0f4a76] text-white flex items-center justify-center text-[10px] border-2 border-white shadow-md hover:bg-[#145c93] transition"
                title="Edit Profile"
              >
                <Image
                  src={EditLogo}
                  alt="Edit Icon"
                  className="w-[15px] h-[15px]"
                />
              </button>

              {/* hidden file input for profile picture */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>

          {/* Name */}
          <h2 className="text-xl font-semibold text-white mb-2">
            {displayName}
          </h2>

          {/* Profile upload status / error */}
          {isProfileUploading && (
            <p className="text-xs text-[#cde2f2] mb-2">
              Uploading profile picture...
            </p>
          )}
          {profileErrorMsg && (
            <p className="text-xs text-red-500 mb-2">{profileErrorMsg}</p>
          )}

          {/* Upload documents button */}
          <button
            type="button"
            onClick={handleUploadDocsClick}
            className="flex items-center justify-center gap-2 mx-auto border border-white/30 bg-white text-[#0f4a76] text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#e7f1fa] transition"
          >
            <i className="fa-solid fa-paperclip text-xs"></i>
            Upload documents
          </button>

          <button
  type="button"
  onClick={handleSaveProfile}
  disabled={(!hasProfileChanged && documents.length === 0) || isProfileUploading || isDocUploading}
  className={`mt-4 flex items-center justify-center gap-2 mx-auto text-sm font-semibold px-8 py-2 rounded-lg transition ${
    (hasProfileChanged || documents.length > 0) && !isProfileUploading && !isDocUploading
      ? "bg-[#f5cc76] text-[#062946] hover:bg-[#ffd98a]"
      : "bg-white/20 text-white/50 cursor-not-allowed"
  }`}
>
  {isProfileUploading || isDocUploading ? "Saving..." : "Save"}
</button>

          {/* hidden file input for documents */}
          <input
            ref={docFileInputRef}
            type="file"
            className="hidden"
            onChange={handleDocFileChange}
          />

          {/* Document upload status / error */}
          {isDocUploading && (
            <p className="text-xs text-[#cde2f2] mt-2">
              Uploading document...
            </p>
          )}
          {docErrorMsg && (
            <p className="text-xs text-red-500 mt-2">{docErrorMsg}</p>
          )}

          {/* Uploaded documents list */}
          {documents.length > 0 && (
            <div className="mt-3 text-left">
              <p className="text-xs font-medium text-[#d9ebf8] mb-1">
                Uploaded documents:
              </p>
              <ul className="text-xs text-[#cde2f2] space-y-1">
                {documents.map((doc, index) => (
                  <li key={`${doc.fileUrl}-${index}`} className="flex items-center gap-2">
                    <i className="fa-regular fa-file text-[10px] text-[#8ec5eb]" />
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline break-all"
                    >
                      {doc.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
