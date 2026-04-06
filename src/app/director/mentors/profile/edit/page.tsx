"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import AppHero from "@/app/Components/Hero/AppHero";import ConfirmModal from "@/app/Components/ConfirmModal";
import ProfileForm, {
  PersonalInfo,
  ChurchInfo,
  OtherInfo,
} from "@/app/Components/ProfileForm";
import MentorBg from "@/app/Assets/mentor-bg.png";
import Mentor1 from "@/app/Assets/mentor1.png";
import { getUserById, updateUserById } from "@/app/Services/mentors.service";

function EditMentorProfileContent() {
  const router = useRouter();

  const searchParams = useSearchParams();
  const mentorId = searchParams.get("id");
  // Seed data – replace with real fetch later
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

  const [loading, setLoading] = useState(true);

  const [interests, setInterests] = useState<string>("");
  const [comments, setComments] = useState<string>("");

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showDeleteDocConfirm, setShowDeleteDocConfirm] = useState<
    string | null
  >(null);
  const [showDocsModal, setShowDocsModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [documents, setDocuments] = useState([
    { id: "1", name: "My Documents 1.pdf", size: "3 Oct 2024 · 9:41 am" },
    { id: "2", name: "My Documents 2.pdf", size: "3 Oct 2024 · 9:41 am" },
    { id: "3", name: "My Educational 1.pdf", size: "3 Oct 2024 · 9:41 am" },
    { id: "4", name: "My Documents 1.pdf", size: "15 Oct 2024 · 9:41 am" },
    {
      id: "5",
      name: "My Educational Documents 1.pdf",
      size: "12 Oct 2024 · 9:41 am",
    },
    { id: "6", name: "My Documents 1.pdf", size: "11 Oct 2024 · 9:41 am" },
  ] as { id: string; name: string; size: string }[]);

  const [newDocuments] = useState([
    { id: "n1", name: "My Documents 1.pdf", size: "20 Oct 2024 · 9:41 am" },
    { id: "n2", name: "My Documents 2.pdf", size: "20 Oct 2024 · 9:41 am" },
    { id: "n3", name: "My Educational 1.pdf", size: "20 Oct 2024 · 9:41 am" },
  ]);

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

      interests: interests
        ? interests.split(",").map(i => i.trim()).filter(Boolean)
        : [],

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
          c =>
            c.churchName ||
            c.churchPhone ||
            c.churchWebsite ||
            c.churchAddress
        ),
      },
    };
  };

  useEffect(() => {
    if (!mentorId) return;

    const fetchUser = async () => {
      try {
        setLoading(true);

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
            : user.interests ?? ""
        );

        setComments(user.comments ?? "");

      } catch (err) {
        console.error("Failed to fetch user", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [mentorId]);

  const handleSave = async () => {
    try {
      setShowSaveConfirm(false);
      setLoading(true);

      const payload = buildUpdatePayload();

      await updateUserById(mentorId!, payload);

      setToast("Changes Saved Successfully");

      setTimeout(() => {
        setToast(null);
        router.push(`/director/mentors/profile?id=${mentorId}`);
      }, 1200);

    } catch (err) {
      console.error("Update failed", err);
      setToast("Failed to save changes");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCancelConfirm(false);
    router.push(`/director/mentors/profile?id=${mentorId}`);
  };

  const handleDownload = (_name: string) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-white text-lg">Loading mentor details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
      <AppHero
        title={`${personal.firstName} ${personal.lastName}`}
        backgroundImageUrl={MentorBg.src}
        breadcrumbItems={[
          { label: "Mentors", href: "/director/mentors" },
          { label: "Robert Fox" },
        ]}
      />

      <section className="px-6 md:px-12 lg:px-20 py-10 bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
        <div className="max-w-[1400px] mx-auto">
          {/* Left Sidebar & Form */}
          <div className="flex gap-8">
            {/* Left Sidebar - Profile Card */}
            <div className="w-[280px] flex-shrink-0">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                {/* Profile Image */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-[120px] h-[120px] rounded-full overflow-hidden bg-gray-100 mb-4 relative">
                    <Image
                      src={Mentor1}
                      alt="Robert Fox"
                      className="w-full h-full object-cover"
                    />
                    {/* Edit icon badge */}
                    <button className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg">
                      <i className="fa-solid fa-pencil text-xs"></i>
                    </button>
                  </div>
                  <h3 className="text-[16px] font-bold text-[#1A2E7A] text-center">
                    Robert Fox
                  </h3>
                  <p className="text-[12px] text-gray-500 mb-1">Mentor</p>
                </div>

                {/* Profile Information */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h4 className="text-[12px] font-semibold text-gray-600 mb-3">
                    Profile Information
                  </h4>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Lorem ipsum dolor sit amet, consectetur adipiscing eip ex ea
                    commodo consequat. Duis aute consectetur adipiscing
                  </p>
                </div>

                {/* Documents */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowDocsModal(true)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
                  >
                    <div className="flex items-center gap-2">
                      <i className="fa-regular fa-file-lines text-blue-600 text-sm"></i>
                      <span className="text-[13px] font-semibold text-gray-700">
                        Documents
                      </span>
                    </div>
                    <span className="text-[12px] bg-white text-gray-700 px-2 py-1 rounded-full font-semibold border border-gray-200">
                      {documents.length}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Content - Form */}
            <div className="flex-1">
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
        message=""
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
        title="Are you sure want to save changes ?"
        message=""
        confirmText="Cancel"
        cancelText="Save"
        confirmColor="bg-gray-600 hover:bg-gray-700"
        icon="fa-regular fa-circle-xmark"
        iconColor="text-gray-600 bg-gray-100"
      />

      {/* Delete document confirmation */}
      <ConfirmModal
        isOpen={!!showDeleteDocConfirm}
        onClose={() => setShowDeleteDocConfirm(null)}
        onConfirm={handleDeleteDoc}
        title="Are you sure want to delete File ?"
        message=""
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="bg-red-600 hover:bg-red-700"
        icon="fa-regular fa-trash-can"
        iconColor="text-red-600 bg-red-100"
      />

      {/* Documents Modal */}
      {showDocsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-[20px] font-bold text-gray-900">Documents</h3>
              <button
                onClick={() => setShowDocsModal(false)}
                className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 max-h-[70vh] overflow-auto">
              {/* New Documents Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-[15px] font-bold text-gray-900">
                    3 New Documents Uploaded
                  </h4>
                  <button className="px-3 py-1.5 bg-[#2E3B8E] text-white rounded-md text-[12px] font-semibold hover:bg-[#3A4BA0] transition flex items-center gap-2">
                    3 <i className="fa-solid fa-download text-xs"></i>
                  </button>
                </div>
                <div className="space-y-2">
                  {newDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <i className="fa-regular fa-file-pdf text-red-500 text-xl"></i>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-800 truncate">
                            {doc.name}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {doc.size}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDownload(doc.name)}
                        className="w-8 h-8 rounded-md bg-white flex items-center justify-center hover:bg-gray-100 border border-gray-200 text-blue-600"
                      >
                        <i className="fa-solid fa-download text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Document Library */}
              <div>
                <h4 className="text-[15px] font-bold text-gray-900 mb-4">
                  Document Library
                </h4>
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <i className="fa-regular fa-file-pdf text-red-500 text-xl"></i>
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-gray-800 truncate">
                            {doc.name}
                          </p>
                          <p className="text-[11px] text-gray-500">
                            {doc.size}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowDeleteDocConfirm(doc.id)}
                        className="w-8 h-8 rounded-md bg-white flex items-center justify-center hover:bg-red-50 border border-gray-200 text-red-600"
                      >
                        <i className="fa-regular fa-trash-can text-xs"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}    </div>
  );
}

export default function EditMentorProfilePage() {
  return (
    <Suspense>
      <EditMentorProfileContent />
    </Suspense>
  );
}
