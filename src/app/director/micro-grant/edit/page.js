"use client";
import React, { useState } from "react";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import AppHero from "@/app/Components/Hero/AppHero";
import MentorBg from "@/app/Assets/mentor-bg.png";
import ProfileSidebarCard from "@/app/Components/ProfileSidebarCard";
import ProfileForm from "@/app/Components/ProfileForm";
import ProfileDropdown from "@/app/Components/ProfileDropdown";
import UserProfile from "@/app/Assets/user-profile.png";

const ProfilePage = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Form state
  const [personal, setPersonal] = useState({
    firstName: "John",
    lastName: "Ross",
    phoneNumber: "09878564398",
    email: "johnross@gmail.com",
  });

  const [church1, setChurch1] = useState({
    name: "Loma Linda University Church, CA",
    phone: "09878564398",
    website: "johnross@gmail.com",
    address: "Loma Linda University Church, CA",
    city: "Oakland",
    state: "North American",
    zipCode: "000000",
    country: "USA",
  });

  const [church2, setChurch2] = useState({
    name: "Loma Linda University Church, CA",
    phone: "09878564398",
    website: "johnross@gmail.com",
    address: "Loma Linda University Church, CA",
    city: "Oakland",
    state: "North American",
    zipCode: "000000",
    country: "USA",
  });

  const [other, setOther] = useState({
    title: "Pastor",
    yearsInMinistry: "11",
    conference: "Oakland",
    communityServiceProjects: "11",
  });

  const [interests, setInterests] = useState(
    "I would like to find out more about the Center for Community Change..."
  );
  const [comments, setComments] = useState(
    "I am a conference administrator and would like to find out more about partnering with the center."
  );

  // Header actions for ProfileForm
  const headerActions = (
    <>
      <button className="bg-white text-red-500 px-5 py-2 rounded-lg inline-flex items-center gap-2 hover:bg-red-50 transition-colors">
        <Trash2 className="w-4 h-4" />
        <span>Delete Profile</span>
      </button>
      <button className="bg-white text-blue-600 px-5 py-2 rounded-lg inline-flex items-center gap-2 hover:bg-blue-50 transition-colors">
        <Pencil className="w-4 h-4" />
        <span>Edit Profile</span>
      </button>
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          aria-label="More options"
          className="p-2 bg-white rounded-md text-black hover:bg-gray-100 transition-colors"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
        <ProfileDropdown
          isOpen={showDropdown}
          onClose={() => setShowDropdown(false)}
          onDocumentsClick={() => {
            setShowDocuments(true);
            setShowDropdown(false);
          }}
          onSettingsClick={() => {
            setShowSettings(true);
            setShowDropdown(false);
          }}
        />
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1d538d] to-[#1d538d] text-white">
      {/* Hero Section */}
      <AppHero
        title="Edit Micro Grant Form"
        backgroundImageUrl={MentorBg.src}
        breadcrumbItems={[
          { label: "Home", href: "/director/home" },
          { label: "Micro Grant", href: "/director/micro-grant" },
          { label: "Edit Form" },
        ]}
      />

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-0 px-6 lg:px-16 py-10">
        {/* Left Profile Card */}
        <ProfileSidebarCard
          name="John Ross"
          role="Pastor"
          image={UserProfile}
          infoLines={[
            { label: "Total Mentees", value: "5", color: "text-blue-800" },
            {
              label: "Last Contacted",
              value: "3 Days Ago",
              color: "text-blue-800",
            },
          ]}
          showContactIcons={true}
          onEmailClick={() => window.open("mailto:johnross@gmail.com")}
          onMessageClick={() => console.log("Message clicked")}
          onWhatsAppClick={() => window.open("https://wa.me/1234567890")}
          onPhoneClick={() => console.log("Phone clicked")}
          progress={{ value: 70, label: "Progress" }}
          profileInfo="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Duis aute irure dolor in reprehenderit."
          documents={{
            count: 3,
            onClick: () => console.log("Documents clicked"),
          }}
          variant="edit"
        />

        {/* Vertical Divider */}
        <div className="hidden lg:block w-px bg-gray-500 mx-10 self-stretch"></div>

        {/* Right Form Section */}
        <div className="flex-1">
          <ProfileForm
            title="Personal Information"
            headerActions={headerActions}
            personal={personal}
            church1={church1}
            church2={church2}
            other={other}
            interests={interests}
            comments={comments}
            showInterests={true}
            showComments={true}
            editable={true}
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
  );
};

export default ProfilePage;
