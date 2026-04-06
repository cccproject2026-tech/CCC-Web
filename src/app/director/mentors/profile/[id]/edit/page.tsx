"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import AppHeader from "@/app/Components/Header/AppHeader";
import AppHero from "@/app/Components/Hero/AppHero";import ConfirmModal from "@/app/Components/ConfirmModal";
import ProfileForm, {
  PersonalInfo,
  ChurchInfo,
  OtherInfo,
} from "@/app/Components/ProfileForm";
import MentorBg from "@/app/Assets/mentor-bg.png";

export default function EditMentorProfilePage() {
  const router = useRouter();
  const params = useParams();

  // Seed data – replace with real fetch later
  const [personal, setPersonal] = useState<PersonalInfo>({
    firstName: "John",
    lastName: "Doe",
    phoneNumber: "09878564398",
    email: "johndoe@gmail.com",
  });
  const [church1, setChurch1] = useState<ChurchInfo>({
    name: "Loma Linda University Church, CA",
    phone: "09878564398",
    website: "lomalindachurch.com",
    address: "111 University St",
    city: "Oakland",
    state: "CA",
    zipCode: "94601",
    country: "USA",
  });
  const [church2, setChurch2] = useState<ChurchInfo>({});
  const [other, setOther] = useState<OtherInfo>({
    title: "Field Mentor",
    yearsInMinistry: "11",
    conference: "Oakland",
    communityServiceProjects: "Local outreach, youth mentorship",
  });
  const [interests, setInterests] = useState<string>("");
  const [comments, setComments] = useState<string>("");

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteDocConfirm, setShowDeleteDocConfirm] = useState<
    string | null
  >(null);
  const [toast, setToast] = useState<string | null>(null);

  const [documents, setDocuments] = useState([
    { id: "1", name: "My Documents 1.pdf", size: "450 KB" },
    { id: "2", name: "My Education 1.pdf", size: "920 KB" },
    { id: "3", name: "My Documents 2.pdf", size: "1.2 MB" },
  ] as { id: string; name: string; size: string }[]);

  const handleSave = () => {
    setShowSaveConfirm(false);
    setToast("Changes Saved Successfully");
    setTimeout(() => {
      setToast(null);
      router.push(`/director/mentors/profile`);
    }, 1200);
  };

  const handleCancel = () => {
    setShowCancelConfirm(false);
    router.push(`/director/mentors/profile`);
  };

  const handleDownload = (name: string) => {
    setToast("Document Downloaded Successfully");
    setTimeout(() => setToast(null), 1200);
  };

  const handleDeleteDoc = () => {
    if (!showDeleteDocConfirm) return;
    setDocuments((prev) => prev.filter((d) => d.id !== showDeleteDocConfirm));
    setShowDeleteDocConfirm(null);
    setToast("Documents Deleted");
    setTimeout(() => setToast(null), 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
      <AppHero
        title={`${personal.firstName} ${personal.lastName}`}
        backgroundImageUrl={MentorBg.src}
        breadcrumbItems={[
          { label: "Mentors", href: "/director/mentors" },
          { label: `${personal.firstName} ${personal.lastName}` },
        ]}
      />

      <section className="px-6 md:px-12 lg:px-20 py-10 bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
        <div className="max-w-[1400px] mx-auto">
          <ProfileForm
            title="Personal Information"
            headerActions={
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCancelConfirm(true)}
                  className="px-4 py-2 bg-white border-2 border-gray-300 text-gray-700 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowSaveConfirm(true)}
                  className="px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg text-[13px] font-semibold hover:bg-blue-50 transition-all"
                >
                  Save
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

          {/* Documents Side Panel */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
            <div></div>
            <div className="bg-white rounded-xl p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[16px] font-bold text-[#1A2E7A]">
                  Documents
                </h3>
                <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-semibold">
                  {documents.length}
                </span>
              </div>
              <div className="space-y-3">
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
                    <div className="flex items-center gap-2 text-[#2E3B8E]">
                      <button
                        onClick={() => handleDownload(doc.name)}
                        className="w-8 h-8 rounded-md bg-white flex items-center justify-center hover:bg-gray-100 border border-gray-200"
                        aria-label="Download"
                      >
                        <i className="fa-solid fa-download text-xs"></i>
                      </button>
                      <button
                        onClick={() => setShowDeleteDocConfirm(doc.id)}
                        className="w-8 h-8 rounded-md bg-white flex items-center justify-center hover:bg-red-50 border border-gray-200 text-red-600"
                        aria-label="Delete"
                      >
                        <i className="fa-regular fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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

      {/* Save confirmation */}
      <ConfirmModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={handleSave}
        title="Are you sure want to save changes ?"
        message="Your latest edits will be saved."
        confirmText="Save"
        cancelText="Cancel"
        confirmColor="bg-blue-600 hover:bg-blue-700"
        icon="fa-regular fa-floppy-disk"
        iconColor="text-blue-600 bg-blue-100"
      />

      {/* Cancel confirmation */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={handleCancel}
        title="Discard your changes?"
        message="All unsaved changes will be lost."
        confirmText="Discard"
        cancelText="Stay"
        confirmColor="bg-gray-600 hover:bg-gray-700"
        icon="fa-regular fa-circle-xmark"
        iconColor="text-gray-600 bg-gray-100"
      />

      {/* Delete document confirmation */}
      <ConfirmModal
        isOpen={!!showDeleteDocConfirm}
        onClose={() => setShowDeleteDocConfirm(null)}
        onConfirm={handleDeleteDoc}
        title="Are you sure you want to delete file ?"
        message="This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="bg-red-600 hover:bg-red-700"
        icon="fa-regular fa-trash-can"
        iconColor="text-red-600 bg-red-100"
      />    </div>
  );
}
