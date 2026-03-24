"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import AppHero from "@/app/Components/Hero/AppHero";
import AppFooter from "@/app/Components/AppFooter";
import ConfirmModal from "@/app/Components/ConfirmModal";
import MentorBg from "@/app/Assets/mentor-bg.png";
import Mentor1 from "@/app/Assets/mentor1.png";
import ProfileForm from "@/app/Components/ProfileForm";
import { apiGetUserById } from "@/app/Services/users.service";

export default function MentorProfilePage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile state populated from API
  const [mentorData, setMentorData] = useState({
    firstName: "",
    lastName: "",
    role: "",
    phoneNumber: "",
    email: "",
    profilePicture: null as string | null,
    totalMentees: 0,
    otherInfo: {
      title: "",
      yearsInMinistry: "",
      conference: "",
      bio: "",
    },
  });

  useEffect(() => {
    if (!id) return;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await apiGetUserById(id);
        const user = res.data.data;
        const interest = user?.interest;
        setMentorData({
          firstName: user.firstName ?? "",
          lastName: user.lastName ?? "",
          role: user.role ?? "",
          phoneNumber: user.phoneNumber ?? "",
          email: user.email ?? "",
          profilePicture: user.profilePicture ?? null,
          totalMentees: user.assignedId?.length ?? 0,
          otherInfo: {
            title: interest?.title ?? "",
            yearsInMinistry: interest?.yearsInMinistry ?? "",
            conference: interest?.conference ?? "",
            bio: interest?.comments ?? "",
          },
        });
      } catch (err) {
        console.error("Failed to fetch mentor profile", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  const optionsMenuItems = [
    {
      icon: "fa-solid fa-users",
      label: "View Assigned Mentees",
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
      label: "Assignment History",
      color: "text-blue-500",
    },
    {
      icon: "fa-solid fa-chart-line",
      label: "Performance Report",
      color: "text-red-500",
    },
    {
      icon: "fa-regular fa-calendar",
      label: "Schedule Meeting",
      color: "text-indigo-600",
    },
  ];

  const assignedMentees = [
    { id: 1, name: "John Ross", church: "Loma Linda Church", progress: 65 },
    { id: 2, name: "Robert Smith", church: "Grace Community", progress: 80 },
    { id: 3, name: "Michael Brown", church: "Hope Church", progress: 45 },
  ];

  const handleDeleteProfile = () => {
    setToast("Mentor Profile Deleted Successfully");
    setTimeout(() => {
      setToast(null);
      // Redirect to mentors list
    }, 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
        <AppHero title="Mentor Profile" backgroundImageUrl={MentorBg.src} />
        <div className="flex justify-center items-center py-32">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
        </div>
        <AppFooter />
      </div>
    );
  }

  const fullName = `${mentorData.firstName} ${mentorData.lastName}`.trim();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
      <AppHero
        title={fullName || "Mentor Profile"}
        backgroundImageUrl={MentorBg.src}
        breadcrumbItems={[
          { label: "Mentors", href: "/director/mentors" },
          { label: fullName },
        ]}
      />

      {/* Profile Content */}
      <section className="px-6 md:px-12 lg:px-20 py-10 bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
        <div className="max-w-[1400px] mx-auto flex gap-8">
          {/* Left Sidebar - Profile Card */}
          <div className="w-[300px] flex-shrink-0">
            <div className="bg-white rounded-xl p-6 shadow-lg">
              {/* Profile Image */}
              <div className="flex flex-col items-center mb-6">
                <div className="w-[140px] h-[140px] rounded-full overflow-hidden bg-gray-100 mb-4">
                  <Image
                    src={mentorData.profilePicture || Mentor1}
                    alt={fullName}
                    width={140}
                    height={140}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-[18px] font-bold text-[#1A2E7A] text-center">
                  {fullName}
                </h3>
                <p className="text-[13px] text-gray-500 mb-1">
                  {mentorData.role}
                </p>
                <div className="flex items-center gap-1 text-[12px] text-gray-400">
                  <i className="fa-solid fa-award text-yellow-500"></i>
                  <span className="capitalize">{mentorData.role}</span>
                </div>
              </div>

              {/* Contact Icons */}
              <div className="flex items-center justify-center gap-4 text-[#2E3B8E] text-[18px] mb-6 pb-6 border-b border-gray-200">
                <button className="hover:opacity-70 transition">
                  <i className="fa-regular fa-envelope"></i>
                </button>
                <button className="hover:opacity-70 transition">
                  <i className="fa-regular fa-comment"></i>
                </button>
                <button className="hover:opacity-70 transition">
                  <i className="fa-brands fa-whatsapp"></i>
                </button>
                <button className="hover:opacity-70 transition">
                  <i className="fa-solid fa-phone"></i>
                </button>
              </div>

              {/* Stats */}
              <div className="mb-6 pb-6 border-b border-gray-200 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-gray-600 font-semibold">Total Mentees</span>
                  <span className="text-[16px] text-gray-900 font-bold">{mentorData.totalMentees}</span>
                </div>
                {mentorData.otherInfo.conference && (
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-gray-600 font-semibold">Conference</span>
                    <span className="text-[13px] text-gray-800 font-medium">{mentorData.otherInfo.conference}</span>
                  </div>
                )}
                {mentorData.otherInfo.yearsInMinistry && (
                  <div className="flex justify-between items-center">
                    <span className="text-[13px] text-gray-600 font-semibold">Years in Ministry</span>
                    <span className="text-[13px] text-gray-800 font-medium">{mentorData.otherInfo.yearsInMinistry}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              <div className="mb-6">
                <h4 className="text-[13px] font-semibold text-gray-600 mb-3">
                  About
                </h4>
                <p className="text-[12px] text-gray-600 leading-relaxed">
                  {mentorData.otherInfo.bio}
                </p>
              </div>

              {/* Assign Mentees Button */}
              <button className="w-full py-3 bg-[#1F2A6E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#2E3B8E] transition-all shadow-md flex items-center justify-center gap-2">
                <i className="fa-solid fa-user-plus"></i>
                <span>Assign New Mentees</span>
              </button>
            </div>
          </div>

          {/* Right Content - Information & Assigned Mentees */}
          <div className="flex-1 space-y-6">
            <ProfileForm
              title="Personal Information"
              headerActions={
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-white border-2 border-red-500 text-red-500 rounded-lg text-[13px] font-semibold hover:bg-red-50 transition-all flex items-center gap-2"
                  >
                    <i className="fa-regular fa-trash-can"></i>
                    Delete Profile
                  </button>
                  <button
                    onClick={() =>
                      router.push(`/director/mentors/profile/edit`)
                    }
                    className="px-4 py-2 bg-white border-2 border-blue-600 text-blue-600 rounded-lg text-[13px] font-semibold hover:bg-blue-50 transition-all flex items-center gap-2"
                  >
                    <i className="fa-regular fa-pen-to-square"></i>
                    Edit Profile
                  </button>
                </div>
              }
              personal={{
                firstName: mentorData.firstName,
                lastName: mentorData.lastName,
                phoneNumber: mentorData.phoneNumber,
                email: mentorData.email,
              }}
              other={{
                title: mentorData.otherInfo.title,
                yearsInMinistry: mentorData.otherInfo.yearsInMinistry,
                conference: mentorData.otherInfo.conference,
                communityServiceProjects: "",
              }}
              showInterests={false}
              showComments={false}
            />
            {/* Assigned Mentees Section */}
            <div className="bg-white rounded-xl p-8 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[22px] font-bold text-[#1A2E7A]">
                  Assigned Mentees ({assignedMentees.length})
                </h2>
                <Link
                  href="/director/mentees"
                  className="text-[14px] text-blue-600 hover:underline font-semibold"
                >
                  View All
                </Link>
              </div>

              <div className="space-y-4">
                {assignedMentees.map((mentee) => (
                  <div
                    key={mentee.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    <div className="flex-1">
                      <h4 className="text-[15px] font-semibold text-gray-900">
                        {mentee.name}
                      </h4>
                      <p className="text-[13px] text-gray-500">
                        {mentee.church}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-[12px] text-gray-500">Progress</p>
                        <p className="text-[16px] font-bold text-green-600">
                          {mentee.progress}%
                        </p>
                      </div>
                      <Link
                        href="/director/mentees/profile"
                        className="px-4 py-2 bg-[#1F2A6E] text-white rounded-lg text-[12px] font-semibold hover:bg-[#2E3B8E] transition-all"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Toast Notification */}
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
        title="Delete Mentor Profile"
        message="Are you sure you want to delete this mentor profile? This will unassign all mentees and cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmColor="bg-red-500 hover:bg-red-600"
        icon="fa-solid fa-trash-can"
        iconColor="text-red-500 bg-red-100"
      />

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-[22px] font-bold text-gray-900 mb-4">
              Edit Mentor Profile
            </h3>
            <p className="text-[14px] text-gray-600 mb-6">
              Edit profile functionality will be implemented here.
            </p>
            <button
              onClick={() => setShowEditModal(false)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg text-[14px] font-semibold hover:bg-blue-700 transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

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
