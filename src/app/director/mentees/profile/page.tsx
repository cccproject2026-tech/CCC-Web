"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import AppFooter from "@/app/Components/AppFooter";
import AppHero from "@/app/Components/Hero/AppHero";
import ProfileForm from "@/app/Components/ProfileForm";
import ProfileSidebarCard from "@/app/Components/ProfileSidebarCard";
import ConfirmModal from "@/app/Components/ConfirmModal";

import type {
  PersonalInfo,
  ChurchInfo,
  OtherInfo,
} from "@/app/Components/ProfileForm";

import MentorBg from "@/app/Assets/mentor-bg.png";
import Mentor1 from "@/app/Assets/mentor1.png";

import { apiGetUserById, apiInviteFieldMentor } from "@/app/Services/users.service";
import { apiGetUserProgress } from "@/app/Services/progress.service";

type InviteState = "none" | "invited" | "accepted" | "cert_issued";

const deriveInviteState = (user: any): InviteState => {
  if (user.hasIssuedCertificate) return "cert_issued";

  const invite = user.fieldMentorInvitation;

  if (!invite) return "none";

  if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
    return "none";
  }

  return "invited";
};

function MenteeProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const menteeId = searchParams.get("id");

  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

  // ===== Profile Display State =====
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [profileProgress, setProfileProgress] = useState(0);

  // ===== Editable Form State =====
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

  // ===== Fetch Profile + Progress =====
  useEffect(() => {
    if (!menteeId) return;

    const fetchProfile = async () => {
      try {
        const [userRes, progressRes] = await Promise.all([
          apiGetUserById(menteeId),
          apiGetUserProgress(menteeId),
        ]);

        const user = userRes.data.data;
        const progress = progressRes.data.data;
        const interest = user?.interest;

        setFullName(`${user.firstName} ${user.lastName}`);
        setRole(user.role ?? "Pastor");

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

        setProfileProgress(progress?.overallProgress ?? 0);

        setInviteState(deriveInviteState(user));

        setDocuments(
          user.uploadedDocuments?.map((doc: any, i: number) => ({
            id: doc._id ?? String(i),
            name: doc.fileName,
            size: `${(doc.fileSize / 1024).toFixed(1)} KB`,
            url: doc.fileUrl,
            type: doc.fileType,
          })) ?? []
        );

      } catch (err) {
        console.error("Failed to fetch mentee profile", err);
      }
    };

    fetchProfile();
  }, [menteeId]);

  // ===== Invite Button Logic =====
  const [inviteState, setInviteState] = useState<InviteState>("none");

  const inviteButton = useMemo(() => {
    switch (inviteState) {
      case "none":
        return {
          icon: "fa-solid fa-user-plus",
          label: "Invite to be a Field Mentor",
          disabled: false,
          onClick: async () => {
            try {
              const invitedBy = localStorage.getItem("userId");

              if (!invitedBy || !personal.email) {
                setToast("Unable to send invitation");
                return;
              }

              await apiInviteFieldMentor({
                email: personal.email,
                invitedBy,
              });

              setInviteState("invited");
              setToast("Invitation sent successfully");
            } catch (error) {
              console.error("Invite failed", error);
              setToast("Failed to send invitation");
            } finally {
              setTimeout(() => setToast(null), 1500);
            }
          },
        };

      case "invited":
        return {
          icon: "fa-solid fa-user-plus",
          label: "Invitation Sent",
          onClick: () => { },
          disabled: true,
        };

      case "accepted":
        return {
          icon: "fa-solid fa-user-check",
          label: "Accepted as Field Mentor",
          onClick: () => { },
          disabled: true,
        };

      case "cert_issued":
        return {
          icon: "fa-solid fa-certificate",
          label: "Issue Certificate",
          onClick: async () => {
            // await apiIssueCertificate(menteeId);
            setToast("Certificate Issued Successfully");
            setTimeout(() => setToast(null), 1500);
          },
          disabled: false,
        };
    }
  }, [inviteState, menteeId]);

  const handleDeleteProfile = () => {
    setShowDeleteModal(false);
    setToast("Profile Deleted Successfully");
    setTimeout(() => {
      setToast(null);
      router.push("/director/mentees");
    }, 1500);
  };

  const handleSave = () => {
    setConfirmSave(false);
    setIsEditing(false);
    setToast("Changes Saved Successfully");
    setTimeout(() => setToast(null), 1500);
  };

  const handleCancel = () => {
    setConfirmCancel(false);
    setIsEditing(false);
  };

  const handleDeleteDoc = () => {
    if (!docToDelete) return;
    setDocuments((prev) => prev.filter((d) => d.id !== docToDelete));
    setDocToDelete(null);
    setToast("Documents Deleted");
    setTimeout(() => setToast(null), 1500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
      <AppHero
        title={fullName}
        backgroundImageUrl={MentorBg.src}
        breadcrumbItems={[
          { label: "Mentees", href: "/director/mentees" },
          { label: fullName },
        ]}
      />

      <section className="px-6 md:px-12 lg:px-20 py-10">
        <div className="max-w-[1400px] mx-auto flex gap-8">
          <ProfileSidebarCard
            name={fullName}
            role={role}
            image={Mentor1}
            progress={{ value: profileProgress, label: "Progress" }}
            documents={{ count: documents.length, onClick: () => setShowDocs(true) }}
            primaryButton={inviteButton}
            variant="mentee"
          />

          <div className="flex-1">
            <ProfileForm
              title="Personal information"
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
      </section>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProfile}
        title="Delete Profile"
        message="Are you sure you want to delete this mentee profile?"
        confirmText="Delete"
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
        message="Your latest edits will be saved."
        confirmText="Save"
        cancelText="Cancel"
        confirmColor="bg-blue-600 hover:bg-blue-700"
        icon="fa-regular fa-floppy-disk"
        iconColor="text-blue-600 bg-blue-100"
      />

      <ConfirmModal
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        title="Discard changes?"
        message="All unsaved changes will be lost."
        confirmText="Discard"
        cancelText="Stay"
        confirmColor="bg-gray-600 hover:bg-gray-700"
        icon="fa-regular fa-circle-xmark"
        iconColor="text-gray-600 bg-gray-100"
      />

      <ConfirmModal
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleDeleteDoc}
        title="Delete file?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="bg-red-600 hover:bg-red-700"
        icon="fa-regular fa-trash-can"
        iconColor="text-red-600 bg-red-100"
      />

      <AppFooter />
    </div>
  );
}

export default function MenteeProfilePage() {
  return (
    <Suspense>
      <MenteeProfileContent />
    </Suspense>
  );
}
