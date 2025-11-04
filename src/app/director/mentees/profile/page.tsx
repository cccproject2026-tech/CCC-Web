"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/app/Components/Header/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import AppHero from "@/app/Components/Hero/AppHero";
import ProfileForm from "@/app/Components/ProfileForm";
import ProfileSidebarCard from "@/app/Components/ProfileSidebarCard";
import type {
  PersonalInfo,
  ChurchInfo,
  OtherInfo,
} from "@/app/Components/ProfileForm";
import MentorBg from "@/app/Assets/mentor-bg.png";
import Mentor1 from "@/app/Assets/mentor1.png";
import ConfirmModal from "@/app/Components/ConfirmModal";

export default function MenteeProfilePage() {
  const router = useRouter();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [showDocs, setShowDocs] = useState(false);
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const menteeData = {
    firstName: "John",
    lastName: "Ross",
    role: "Pastor",
    phoneNumber: "09878564398",
    email: "johnross@gmail.com",
    progress: 70,
    church1: {
      name: "Loma Linda University Church, CA",
      phone: "09878564398",
      website: "johnross@gmail.com",
      address: "Loma Linda University Church,CA",
      city: "Oakland",
      state: "North American",
      zipCode: "000000",
      country: "USA",
    },
    church2: {
      name: "Loma Linda University Church, CA",
      phone: "09878564398",
      website: "johnross@gmail.com",
      address: "Loma Linda University Church,CA",
      city: "Oakland",
      state: "North American",
      zipCode: "000000",
      country: "USA",
    },
    otherInfo: {
      title: "Pastor",
      yearsInMinistry: "11",
      conference: "Oakland",
      communityServiceProjects: "11",
      interests:
        "I would like to find out more about the Center for Community Change\nI am a conference administrator and would like to find out more about partnering with the center",
      comments:
        "I am a conference administrator and would like to find out more about partnering with the cent\nI conference administrator and would like to find out more about partnering with the center",
    },
  };

  // Editable form state
  const [personal, setPersonal] = useState<PersonalInfo>({
    firstName: menteeData.firstName,
    lastName: menteeData.lastName,
    phoneNumber: menteeData.phoneNumber,
    email: menteeData.email,
  });
  const [church1, setChurch1] = useState<ChurchInfo>({ ...menteeData.church1 });
  const [church2, setChurch2] = useState<ChurchInfo>({ ...menteeData.church2 });
  const [other, setOther] = useState<OtherInfo>({
    title: menteeData.otherInfo.title,
    yearsInMinistry: menteeData.otherInfo.yearsInMinistry,
    conference: menteeData.otherInfo.conference,
    communityServiceProjects: menteeData.otherInfo.communityServiceProjects,
  });
  const [interests, setInterests] = useState<string>(
    menteeData.otherInfo.interests
  );
  const [comments, setComments] = useState<string>(
    menteeData.otherInfo.comments
  );

  // Left card dynamic actions
  type InviteState = "none" | "invited" | "accepted" | "cert_issued";
  const [inviteState, setInviteState] = useState<InviteState>("none");

  const inviteButton = useMemo(() => {
    switch (inviteState) {
      case "none":
        return {
          icon: "fa-solid fa-user-plus",
          label: "Invite to be a Field Mentor",
          onClick: () => {
            setInviteState("invited");
            setToast("Invited to be a Field Mentor Successfully");
            setTimeout(() => setToast(null), 1500);
          },
          disabled: false,
        };
      case "invited":
        return {
          icon: "fa-solid fa-user-plus",
          label: "Invited to be a Field Mentor",
          onClick: () => {},
          disabled: true,
        };
      case "accepted":
        return {
          icon: "fa-solid fa-user-check",
          label: "Accepted as a Field Mentor",
          onClick: () => {},
          disabled: true,
        };
      case "cert_issued":
        return {
          icon: "fa-solid fa-certificate",
          label: "Issue Certificate",
          onClick: () => {
            setToast("Certificate Issued Successfully");
            setTimeout(() => setToast(null), 1500);
          },
          disabled: false,
        };
    }
  }, [inviteState]);

  const [documents, setDocuments] = useState([
    { id: "1", name: "My Documents 1.pdf", size: "450 KB" },
    { id: "2", name: "My Documents 2.pdf", size: "790 KB" },
    { id: "3", name: "My Educational 1.pdf", size: "1.1 MB" },
    { id: "4", name: "My Documents 1.pdf", size: "410 KB" },
  ] as { id: string; name: string; size: string }[]);

  const optionsMenuItems = [
    {
      icon: "fa-solid fa-route",
      label: "Revitalization Roadmap",
      color: "text-blue-600",
    },
    {
      icon: "fa-regular fa-note-sticky",
      label: "Notes",
      color: "text-orange-500",
    },
    {
      icon: "fa-solid fa-clipboard-check",
      label: "Assessments",
      color: "text-purple-600",
    },
    {
      icon: "fa-solid fa-file-lines",
      label: "Assignment",
      color: "text-blue-500",
    },
    {
      icon: "fa-solid fa-chart-line",
      label: "Track Progress",
      color: "text-red-500",
    },
    {
      icon: "fa-regular fa-calendar",
      label: "Schedule a Meeting",
      color: "text-indigo-600",
    },
  ];

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
    // Reset form to original data
    setPersonal({
      firstName: menteeData.firstName,
      lastName: menteeData.lastName,
      phoneNumber: menteeData.phoneNumber,
      email: menteeData.email,
    });
    setChurch1({ ...menteeData.church1 });
    setChurch2({ ...menteeData.church2 });
    setOther({
      title: menteeData.otherInfo.title,
      yearsInMinistry: menteeData.otherInfo.yearsInMinistry,
      conference: menteeData.otherInfo.conference,
      communityServiceProjects: menteeData.otherInfo.communityServiceProjects,
    });
    setInterests(menteeData.otherInfo.interests);
    setComments(menteeData.otherInfo.comments);
  };

  const handleDownloadDoc = () => {
    setToast("Document Downloaded Successfully");
    setTimeout(() => setToast(null), 1500);
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
        title={`${menteeData.firstName} ${menteeData.lastName}`}
        backgroundImageUrl={MentorBg.src}
        breadcrumbItems={[
          { label: "Mentees", href: "/director/mentees" },
          { label: `${menteeData.firstName} ${menteeData.lastName}` },
        ]}
      />

      {/* Profile Content */}
      <section className="px-6 md:px-12 lg:px-20 py-10 bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
        <div className="max-w-[1400px] mx-auto flex gap-8">
          {/* Left Sidebar - Profile Card */}
          <ProfileSidebarCard
            name={`${menteeData.firstName} ${menteeData.lastName}`}
            role={menteeData.role}
            image={Mentor1}
            showGalleryIcon={isEditing}
            onGalleryClick={() => {
              setToast("Upload Image Feature Coming Soon");
              setTimeout(() => setToast(null), 1500);
            }}
            infoLines={[
              {
                label: "Total Mentees",
                value: "5",
              },
              {
                label: "Last Contacted",
                value: "3 Days Ago",
              },
            ]}
            showContactIcons={true}
            progress={{
              value: menteeData.progress,
              label: "Progress",
            }}
            profileInfo="Lorem ipsum dolor sit amet, consectetur adipiscing eip ex ea commodo consequat. Duis"
            documents={{
              count: documents.length,
              onClick: () => setShowDocs(true),
            }}
            primaryButton={inviteButton}
            variant="mentee"
          />

          {/* Right Content - Reusable Profile Form */}
          <div className="flex-1">
            <ProfileForm
              title="Personal information"
              headerActions={
                !isEditing ? (
                  <>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 bg-white border-2 border-red-500 text-red-500 rounded-lg text-[13px] font-semibold hover:bg-red-50 transition-all flex items-center gap-2"
                    >
                      <i className="fa-regular fa-trash-can"></i>
                      Delete Profile
                    </button>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg text-[13px] font-semibold hover:bg-blue-50 transition-all flex items-center gap-2"
                    >
                      <i className="fa-regular fa-pen-to-square"></i>
                      Edit Profile
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                        className="w-10 h-10 bg-white border-2 border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center"
                      >
                        <i className="fa-solid fa-ellipsis-vertical"></i>
                      </button>
                      {showOptionsMenu && (
                        <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl py-3 px-2 min-w-[260px] z-50">
                          {optionsMenuItems.map((item, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                setShowOptionsMenu(false);
                              }}
                              className="w-full text-left px-4 py-3 rounded-lg text-[14px] transition-all flex items-center gap-3 hover:bg-gray-50"
                            >
                              <i
                                className={`${item.icon} ${item.color} text-lg w-5`}
                              ></i>
                              <span className="text-gray-700 font-medium">
                                {item.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => setConfirmSave(true)}
                      className="px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg text-[13px] font-semibold hover:bg-blue-50 transition-all"
                    >
                      Save
                    </button>
                  </div>
                )
              }
              personal={personal}
              church1={church1}
              church2={church2}
              other={other}
              interests={interests}
              comments={comments}
              showInterests
              showComments
              editable={isEditing}
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

      {/* Toast */}
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteProfile}
        title="Delete Profile"
        message="Are you sure you want to delete this mentee profile? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="bg-red-500 hover:bg-red-600"
        icon="fa-solid fa-trash-can"
        iconColor="text-red-500 bg-red-100"
      />

      {/* Save/Cancel confirmations */}
      <ConfirmModal
        isOpen={confirmSave}
        onClose={() => setConfirmSave(false)}
        onConfirm={handleSave}
        title="Are you sure want to save changes ?"
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
        title="Discard your changes?"
        message="All unsaved changes will be lost."
        confirmText="Discard"
        cancelText="Stay"
        confirmColor="bg-gray-600 hover:bg-gray-700"
        icon="fa-regular fa-circle-xmark"
        iconColor="text-gray-600 bg-gray-100"
      />

      {/* Documents Modal */}
      {showDocs && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[22px] font-bold text-gray-900">Documents</h3>
              <button
                onClick={() => setShowDocs(false)}
                className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-3 max-h-[60vh] overflow-auto pr-1">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-semibold text-gray-800 truncate">
                      {doc.name}
                    </p>
                    <p className="text-[11px] text-gray-500">{doc.size}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleDownloadDoc}
                      className="w-8 h-8 rounded-md bg-white flex items-center justify-center hover:bg-gray-100 border border-gray-200"
                    >
                      <i className="fa-solid fa-download text-xs"></i>
                    </button>
                    <button
                      onClick={() => setDocToDelete(doc.id)}
                      className="w-8 h-8 rounded-md bg-white flex items-center justify-center hover:bg-red-50 border border-gray-200 text-red-600"
                    >
                      <i className="fa-regular fa-trash-can text-xs"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete document confirmation */}
      <ConfirmModal
        isOpen={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        onConfirm={handleDeleteDoc}
        title="Are you sure want to delete file ?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="bg-red-600 hover:bg-red-700"
        icon="fa-regular fa-trash-can"
        iconColor="text-red-600 bg-red-100"
      />

      {/* Click outside to close options menu */}
      {showOptionsMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowOptionsMenu(false)}
        ></div>
      )}

      <AppFooter />
    </div>
  );
}
