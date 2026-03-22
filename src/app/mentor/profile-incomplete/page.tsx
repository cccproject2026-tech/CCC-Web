"use client";
import { useEffect, useRef, useState } from "react";
import { getCookie, setCookie } from "@/app/utils/cookies";
import Image, { StaticImageData } from "next/image";
import ProfileLogo from "../../Assets/profile.png";
import EditLogo from "../../Assets/Edit.png";
import { useRouter } from "next/navigation";
import { apiUploadProfilePicture, apiUploadDocument } from "@/app/Services/api";
import MentorHeader from "@/app/Components/MentorHeader";

type User = {
  id: string;
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
      const stored = getCookie("mentor");
      if (stored) {
        try {
          const parsed: User = JSON.parse(stored);
          setUser(parsed);
          if (parsed.profilePicture) {
            setProfileImage(parsed.profilePicture);
          }
        } catch (e) {
          console.error("Failed to parse user from localStorage", e);
        }
      }
    }
  }, []);

  const handleEditClick = () => {
    fileInputRef.current?.click();
  };

  // 🔹 Handle profile picture upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!user?.id) {
      setProfileErrorMsg("Missing user id. Please login again.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsProfileUploading(true);
      setProfileErrorMsg(null);

      const response = await apiUploadProfilePicture(user.id, formData);
      const json = response.data;

      if (!json.success) {
        setProfileErrorMsg(
          json.message || "Failed to upload profile picture."
        );
        return;
      }

      const newUrl: string | undefined = json.data?.profilePicture;
      if (newUrl) {
        setProfileImage(newUrl);

        // update local user + localStorage
        const updatedUser: User = { ...user, profilePicture: newUrl };
        setUser(updatedUser);
        if (typeof window !== "undefined") {
          setCookie("user", JSON.stringify(updatedUser));
        }
      }
    } catch (err) {
      console.error("Upload error:", err);
      setProfileErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsProfileUploading(false);
      e.target.value = "";
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

    if (!user?.id) {
      setDocErrorMsg("Missing user id. Please login again.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setIsDocUploading(true);
      setDocErrorMsg(null);

      const response = await apiUploadDocument(user.id, formData);
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
      : "";

  return (
    <div className="min-h-screen flex flex-col">
      <MentorHeader />

      <div className="flex-grow bg-gradient-to-b from-[#103C8C] to-[#1B4C9E] flex items-center justify-center px-4">
        <div className="bg-white rounded-xl shadow-lg px-10 py-8 text-center relative w-full max-w-sm">
          {/* Banner */}
          <div className="absolute top-3 left-4 bg-[#FFFBEA] text-[#9A8700] text-xs px-3 py-1 rounded-full border border-[#E9C700]/30">
            Your profile is incomplete.
          </div>

          {/* Skip button */}
          <button
            className="absolute top-3 right-4 text-xs text-gray-600 bg-gray-100 px-3 py-[2px] rounded-full hover:bg-gray-200 transition"
            onClick={() => router.push(`/mentor/home`)}
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
                className="w-[100px] h-[100px] object-cover rounded-full border border-[#E5E7EB]"
              />

              <button
                type="button"
                onClick={handleEditClick}
                className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-[#103C8C] text-white flex items-center justify-center text-[10px] border-2 border-white shadow-md hover:bg-[#1B4C9E] transition"
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
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {displayName}
          </h2>

          {/* Profile upload status / error */}
          {isProfileUploading && (
            <p className="text-xs text-gray-500 mb-2">
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
            className="flex items-center justify-center gap-2 mx-auto border border-[#103C8C] text-[#103C8C] text-sm font-medium px-4 py-[6px] rounded-md hover:bg-[#103C8C] hover:text-white transition"
          >
            <i className="fa-solid fa-paperclip text-xs"></i>
            Upload documents
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
            <p className="text-xs text-gray-500 mt-2">
              Uploading document...
            </p>
          )}
          {docErrorMsg && (
            <p className="text-xs text-red-500 mt-2">{docErrorMsg}</p>
          )}

          {/* Uploaded documents list */}
          {documents.length > 0 && (
            <div className="mt-3 text-left">
              <p className="text-xs font-medium text-gray-700 mb-1">
                Uploaded documents:
              </p>
              <ul className="text-xs text-gray-600 space-y-1">
                {documents.map((doc, index) => (
                  <li key={`${doc.fileUrl}-${index}`} className="flex items-center gap-2">
                    <i className="fa-regular fa-file text-[10px] text-[#103C8C]" />
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
