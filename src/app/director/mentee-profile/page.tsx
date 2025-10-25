"use client";
import { useState } from "react";
import Image from "next/image";
import AppHeader from "@/app/Components/AppHeader";
import AppFooter from "@/app/Components/AppFooter";
import AppHero from "@/app/Components/AppHero";
import ProfileForm from "@/app/Components/ProfileForm";
import MentorBg from "../../Assets/mentor-bg.png";
import Mentor1 from "../../Assets/mentor1.png";

export default function MenteeProfilePage() {
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const menteeData = {
    firstName: "John",
    lastName: "Ross",
    role: "Mentor - Reborn",
    phoneNumber: "09878564398",
    email: "johnross@gmail.com",
    progress: 100,
    church1: {
      name: "Loma Linda University Church, CA",
      phone: "09878564398",
      website: "johnross@gmail.com",
      address: "Loma Linda University Church,CA",
      city: "Okhland",
      state: "North American",
      zipCode: "000000",
      country: "USA",
    },
    church2: {
      name: "Loma Linda University Church, CA",
      phone: "09878564398",
      website: "johnross@gmail.com",
      address: "Loma Linda University Church,CA",
      city: "Okhland",
      state: "North American",
      zipCode: "000000",
      country: "USA",
    },
    otherInfo: {
      title: "Pastor",
      yearsInMinistry: "11",
      conference: "Okhland",
      communityServiceProjects: "11",
      interests:
        "I would like to find out more about the Center for Community Change\nI am a conference administrator and would like to find out more about partnering with the center",
      comments:
        "I am a conference administrator and would like to find out more about partnering with the cent\nI conference administrator and would like to find out more about partnering with the center",
    },
  };

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
    // Handle delete logic
    console.log("Profile deleted");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#5BA3D0] to-[#6BB5E0]">
      <AppHeader showFullHeader={true} />

      <AppHero
        title={`${menteeData.firstName} ${menteeData.lastName}`}
        backgroundImageUrl={MentorBg.src}
        breadcrumbItems={[
          { label: "Invite to be a Field Mentor", href: "/director/mentees" },
          { label: `${menteeData.firstName} ${menteeData.lastName}` },
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
                    src={Mentor1}
                    alt={menteeData.firstName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-[18px] font-bold text-[#1A2E7A] text-center">
                  {menteeData.firstName} {menteeData.lastName}
                </h3>
                <p className="text-[13px] text-gray-500 mb-1">
                  {menteeData.role}
                </p>
                <p className="text-[12px] text-gray-400">(Mentee - Reborn)</p>
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

              {/* Progress Bar */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] text-gray-600 font-semibold">
                    Progress
                  </span>
                  <span className="text-[13px] text-gray-900 font-bold">
                    {menteeData.progress}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500"
                    style={{ width: `${menteeData.progress}%` }}
                  ></div>
                </div>
              </div>

              {/* Profile Information */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h4 className="text-[13px] font-semibold text-gray-600 mb-3">
                  Profile Information
                </h4>
                <p className="text-[12px] text-gray-600 leading-relaxed">
                  Lorem ipsum dolor sit amet, consectetur adipiscing eip ex ea
                  commodo consequat. Duis
                </p>
              </div>

              {/* Documents */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <i className="fa-regular fa-file-lines text-blue-600 text-sm"></i>
                    <span className="text-[13px] font-semibold text-gray-700">
                      Documents
                    </span>
                  </div>
                  <span className="text-[12px] bg-gray-100 text-gray-700 px-2 py-1 rounded-full font-semibold">
                    3
                  </span>
                </div>
              </div>

              {/* Issue Certificate Button */}
              <button className="w-full py-3 bg-[#1F2A6E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#2E3B8E] transition-all shadow-md flex items-center justify-center gap-2">
                <i className="fa-solid fa-certificate"></i>
                <span>Invite to be a Field Mentor</span>
              </button>
            </div>
          </div>

          {/* Right Content - Reusable Profile Form */}
          <div className="flex-1">
            <ProfileForm
              title="Personal information"
              headerActions={
                <>
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
                    {showOptionsMenu && (
                      <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl py-3 px-2 min-w-[260px] z-50">
                        {optionsMenuItems.map((item, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setShowOptionsMenu(false);
                              console.log(`Clicked: ${item.label}`);
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
              }
              personal={{
                firstName: menteeData.firstName,
                lastName: menteeData.lastName,
                phoneNumber: menteeData.phoneNumber,
                email: menteeData.email,
              }}
              church1={menteeData.church1}
              church2={menteeData.church2}
              other={{
                title: menteeData.otherInfo.title,
                yearsInMinistry: menteeData.otherInfo.yearsInMinistry,
                conference: menteeData.otherInfo.conference,
                communityServiceProjects:
                  menteeData.otherInfo.communityServiceProjects,
              }}
              interests={menteeData.otherInfo.interests}
              comments={menteeData.otherInfo.comments}
              showInterests
              showComments
            />
          </div>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fa-solid fa-trash-can text-red-500 text-2xl"></i>
              </div>
              <h3 className="text-[22px] font-bold text-gray-900 mb-2">
                Delete Profile
              </h3>
              <p className="text-[14px] text-gray-600">
                Are you sure you want to delete this mentee profile? This action
                cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg text-[14px] font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProfile}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg text-[14px] font-semibold hover:bg-red-600 transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal Placeholder */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-[22px] font-bold text-gray-900 mb-4">
              Edit Profile
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
