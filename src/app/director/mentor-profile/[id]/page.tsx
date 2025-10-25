"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import DirectorHeader from "@/app/Components/DirectorHeader";
import DirectorFooter from "@/app/Components/DirectorFooter";
import ConfirmModal from "@/app/Components/ConfirmModal";
import MentorBg from "../../../Assets/mentor-bg.png";
import Mentor1 from "../../../Assets/mentor1.png";

export default function MentorProfilePage() {
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const mentorData = {
    firstName: "John",
    lastName: "Doe",
    role: "Senior Field Mentor",
    phoneNumber: "09878564398",
    email: "johndoe@gmail.com",
    progress: 100,
    specialization: "Church Revitalization",
    experience: 15,
    totalMentees: 5,
    activeMentees: 3,
    completedMentees: 2,
    church1: {
      name: "Grace Community Church, CA",
      phone: "09878564398",
      website: "gracechurch.com",
      address: "123 Grace Street, CA",
      city: "Oakland",
      state: "California",
      zipCode: "94601",
      country: "USA",
    },
    otherInfo: {
      title: "Senior Pastor",
      yearsInMinistry: "15",
      conference: "Oakland",
      certifications: "Leadership Development, Church Growth",
      expertise:
        "Church Revitalization, Community Engagement, Leadership Training",
      bio: "Dedicated mentor with 15 years of experience in pastoral ministry and church leadership. Passionate about helping pastors grow and develop their ministries through strategic guidance and support.",
    },
  };

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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
      <DirectorHeader showFullHeader={true} />

      {/* Hero Section with Background */}
      <section
        className="relative bg-cover bg-center text-white"
        style={{ backgroundImage: `url(${MentorBg.src})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[#1A2E5C]/80 to-[#2876AC]/70"></div>

        {/* Breadcrumb and Title */}
        <div className="relative z-10 px-6 md:px-12 lg:px-20 pt-8 pb-16">
          <div className="text-sm text-white/80 mb-6">
            <Link
              href="/director/mentors"
              className="hover:text-white cursor-pointer"
            >
              Mentors
            </Link>
            <span className="mx-2">&gt;</span>
            <span className="font-semibold">
              {mentorData.firstName} {mentorData.lastName}
            </span>
          </div>
          <h1 className="text-[42px] md:text-[48px] lg:text-[56px] font-semibold leading-tight">
            {mentorData.firstName} {mentorData.lastName}
          </h1>
        </div>
      </section>

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
                    src={Mentor1}
                    alt={mentorData.firstName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-[18px] font-bold text-[#1A2E7A] text-center">
                  {mentorData.firstName} {mentorData.lastName}
                </h3>
                <p className="text-[13px] text-gray-500 mb-1">
                  {mentorData.role}
                </p>
                <div className="flex items-center gap-1 text-[12px] text-gray-400">
                  <i className="fa-solid fa-award text-yellow-500"></i>
                  <span>{mentorData.experience} years experience</span>
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
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] text-gray-600 font-semibold">
                      Total Mentees
                    </span>
                    <span className="text-[16px] text-gray-900 font-bold">
                      {mentorData.totalMentees}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] text-gray-600 font-semibold">
                      Active
                    </span>
                    <span className="text-[16px] text-green-600 font-bold">
                      {mentorData.activeMentees}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[13px] text-gray-600 font-semibold">
                      Completed
                    </span>
                    <span className="text-[16px] text-blue-600 font-bold">
                      {mentorData.completedMentees}
                    </span>
                  </div>
                </div>
              </div>

              {/* Specialization */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-[13px] font-semibold text-gray-600 mb-3">
                  Specialization
                </h4>
                <p className="text-[13px] text-gray-700 font-medium">
                  {mentorData.specialization}
                </p>
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
            {/* Personal Information Section */}
            <div className="bg-gradient-to-b from-[#5089B8] to-[#6BA5D5] rounded-xl p-8 shadow-lg">
              {/* Header with Actions */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-[22px] font-bold text-white">
                  Personal Information
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-white border-2 border-red-500 text-red-500 rounded-lg text-[13px] font-semibold hover:bg-red-50 transition-all flex items-center gap-2"
                  >
                    <i className="fa-regular fa-trash-can"></i>
                    Delete Profile
                  </button>
                  <button
                    onClick={() => setShowEditModal(true)}
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

                    {/* Options Dropdown Menu */}
                    {showOptionsMenu && (
                      <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl py-3 px-2 min-w-[260px] z-50">
                        {optionsMenuItems.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setShowOptionsMenu(false);
                              setToast(`${item.label} clicked`);
                              setTimeout(() => setToast(null), 2000);
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
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-[13px] text-white/80 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={mentorData.firstName}
                    readOnly
                    className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-white/80 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={mentorData.lastName}
                    readOnly
                    className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-white/80 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={mentorData.phoneNumber}
                    readOnly
                    className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-white/80 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={mentorData.email}
                    readOnly
                    className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-white/80 mb-2">
                    Years of Experience
                  </label>
                  <input
                    type="text"
                    value={`${mentorData.experience} years`}
                    readOnly
                    className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-white/80 mb-2">
                    Specialization
                  </label>
                  <input
                    type="text"
                    value={mentorData.specialization}
                    readOnly
                    className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-[13px] text-white/80 mb-2">
                  Areas of Expertise
                </label>
                <textarea
                  value={mentorData.otherInfo.expertise}
                  readOnly
                  rows={2}
                  className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none resize-none"
                ></textarea>
              </div>

              <div>
                <label className="block text-[13px] text-white/80 mb-2">
                  Certifications
                </label>
                <input
                  type="text"
                  value={mentorData.otherInfo.certifications}
                  readOnly
                  className="w-full px-4 py-3 bg-[#4A7BA8]/30 text-white border border-white/20 rounded-lg text-[14px] outline-none"
                />
              </div>
            </div>

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
                        href="/director/mentee-profile"
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

      <DirectorFooter />
    </div>
  );
}
