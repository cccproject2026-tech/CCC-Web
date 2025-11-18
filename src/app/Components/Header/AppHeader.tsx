"use client";
import Image from "next/image";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Framelogo1 from "@/app/Assets/Frame-logo-1.png";
import Connecticon from "@/app/Assets/Connect-icon.png";
import NotificationIcon from "@/app/Assets/notification.png";
import SearchIcon from "@/app/Assets/search.png";
import UserProfile from "@/app/Assets/user-profile.png";
import NotificationPopup from "../NotificationPopup";
import ProfileDropdown from "../ProfileDropdown";
import SettingsModal from "../SettingsModal";
import CoursesDropdown from "../CoursesDropdown";
import CCCDropdown from "../CCCDropdown";
import DocumentsModal from "../DocumentsModal";

export default function AppHeader({ showFullHeader = false }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showCoursesDropdown, setShowCoursesDropdown] = useState(false);
  const [showCCCDropdown, setShowCCCDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Mock documents data
  const [documents, setDocuments] = useState([
    {
      id: "1",
      name: "My Documents 1.pdf",
      date: "15 Oct 2024",
      time: "9:41 am",
    },
    {
      id: "2",
      name: "My Educational Documents 1.pdf",
      date: "12 Oct 2024",
      time: "9:41 am",
    },
  ]);

  const handleDeleteDocument = (id: string) => {
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const handleUploadDocument = () => {
    console.log("Upload document");
    // Implement file upload logic
  };

  const navLinks = [
    { name: "Home", path: "/director/home" },
    { name: "Mentors", path: "/director/mentors" },
    { name: "Mentees", path: "/director/mentees" },
    {
      name: "Courses",
      path: "/director/courses",
      hasDropdown: true,
      onClick: () => setShowCoursesDropdown(!showCoursesDropdown),
    },
    { name: "New Interests", path: "/director/interest-list", hasBadge: "3" },
    {
      name: "CCC",
      path: "/director/ccc",
      hasDropdown: true,
      onClick: () => setShowCCCDropdown(!showCCCDropdown),
    },
    { name: "Track Progress", path: "/director/track-progress" },
    { name: "Schedule", path: "/director/schedule" },
    {
      name: "Course Completed",
      path: "/director/course-completed",
      hasBadge: "3",
    },
  ];

  const handleNavClick = (link: any, e: React.MouseEvent) => {
    if (link.hasDropdown && link.onClick) {
      e.preventDefault();
      link.onClick();
    } else {
      router.push(link.path);
    }
  };

  return (
    <>
      <header className="flex items-center justify-between px-4 sm:px-6 lg:px-10 py-3 bg-[#1A2E7A] text-white shadow-md relative z-50">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Image src={Framelogo1} alt="Logo" width={26} height={26} />
        </div>

        {/* Navigation */}
        {showFullHeader && (
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link, index) => (
              <div key={index} className="relative">
                <button
                  onClick={(e) => handleNavClick(link, e)}
                  className={`text-sm transition relative flex items-center gap-1 ${
                    pathname === link.path
                      ? "font-semibold text-white"
                      : "text-white/90 hover:text-white"
                  }`}
                >
                  {link.name}
                  {link.hasDropdown && (
                    <i className="fa-solid fa-chevron-down text-[10px]"></i>
                  )}
                  {link.hasBadge && (
                    <span className="absolute -top-2 -right-3 bg-[#FFD700] text-[#2E3B8E] text-[9px] font-bold rounded-full w-[16px] h-[16px] flex items-center justify-center">
                      {link.hasBadge}
                    </span>
                  )}
                </button>
                {/* Dropdown for Courses */}
                {link.name === "Courses" && (
                  <CoursesDropdown
                    isOpen={showCoursesDropdown && !showMobileMenu}
                    onClose={() => setShowCoursesDropdown(false)}
                  />
                )}
                {/* Dropdown for CCC */}
                {link.name === "CCC" && (
                  <CCCDropdown
                    isOpen={showCCCDropdown && !showMobileMenu}
                    onClose={() => setShowCCCDropdown(false)}
                  />
                )}
              </div>
            ))}
          </nav>
        )}

        {/* Right side icons */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-5">
          {showFullHeader && (
            <>
              {/* Search - Hidden on mobile */}
              <button className="hidden sm:block hover:opacity-80 transition">
                <Image src={SearchIcon} alt="Search" width={18} height={18} />
              </button>

              {/* Notification with badge */}
              <button
                className="relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Image
                  src={NotificationIcon}
                  alt="Notification"
                  width={20}
                  height={20}
                  className="hover:opacity-80 cursor-pointer"
                />
                <span className="absolute -top-1 -right-1 bg-[#FFD700] text-[#2E3B8E] text-[10px] font-bold rounded-full w-[14px] h-[14px] flex items-center justify-center">
                  3
                </span>
              </button>

              {/* Connect - Hidden on small mobile */}
              <button className="hidden xs:block hover:opacity-80 transition">
                <Image src={Connecticon} alt="Connect" width={22} height={22} />
              </button>

              {/* User Profile - Responsive */}
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex items-center gap-1 sm:gap-2 bg-[#2E3B8E] px-2 sm:px-3 py-1 rounded-full hover:bg-[#1F2A6E] transition cursor-pointer"
              >
                <div className="hidden sm:block text-right text-[11px] leading-tight">
                  <p className="text-white/80">Good Morning</p>
                  <p className="text-white font-medium">Admin</p>
                </div>
                <Image
                  src={UserProfile}
                  alt="User"
                  width={30}
                  height={30}
                  className="rounded-full border border-white/40"
                />
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => {
                  setShowMobileMenu(!showMobileMenu);
                  if (!showMobileMenu) {
                    setShowCoursesDropdown(false);
                    setShowCCCDropdown(false);
                  }
                }}
                className="lg:hidden p-2 hover:opacity-80 transition"
              >
                <i
                  className={`fa-solid ${
                    showMobileMenu ? "fa-times" : "fa-bars"
                  } text-lg`}
                ></i>
              </button>
            </>
          )}

          {/* Simplified header */}
          {!showFullHeader && (
            <button className="p-2 hover:opacity-80">
              <Image src={Connecticon} alt="Connect" width={24} height={24} />
            </button>
          )}
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {showFullHeader && showMobileMenu && (
        <div className="lg:hidden bg-[#1A2E7A] border-t border-white/20 fixed top-[60px] left-0 right-0 z-40 shadow-lg">
          <nav className="px-4 py-4 space-y-2">
            {navLinks.map((link, index) => (
              <div key={index}>
                <button
                  onClick={(e) => {
                    handleNavClick(link, e);
                    if (!link.hasDropdown) setShowMobileMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-md transition flex items-center justify-between ${
                    pathname === link.path
                      ? "bg-[#2E3B8E] font-semibold text-white"
                      : "text-white/90 hover:bg-[#2E3B8E]/50 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {link.name}
                    {link.hasBadge && (
                      <span className="bg-[#FFD700] text-[#2E3B8E] text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center">
                        {link.hasBadge}
                      </span>
                    )}
                  </span>
                  {link.hasDropdown && (
                    <i
                      className={`fa-solid fa-chevron-${
                        (link.name === "Courses" && showCoursesDropdown) ||
                        (link.name === "CCC" && showCCCDropdown)
                          ? "up"
                          : "down"
                      } text-xs`}
                    ></i>
                  )}
                </button>

                {/* Mobile Dropdown Content */}
                {link.name === "Courses" && showCoursesDropdown && (
                  <div
                    className="ml-4 mt-2 space-y-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {[
                      {
                        icon: "fa-solid fa-trophy",
                        label: "Micro Grant",
                        path: "/director/micro-grant",
                      },
                      {
                        icon: "fa-solid fa-chalkboard-user",
                        label: "Invite to be a Field Mentor",
                        path: "/director/invite-field-mentor",
                      },
                      {
                        icon: "fa-solid fa-play",
                        label: "Videos",
                        path: "/director/videos",
                      },
                      {
                        icon: "fa-solid fa-phone",
                        label: "Contact Details",
                        path: "/director/contact-details",
                      },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(item.path);
                          setShowMobileMenu(false);
                          setShowCoursesDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 rounded-md text-white/80 hover:bg-[#2E3B8E]/30 hover:text-white transition flex items-center gap-3"
                      >
                        <i className={`${item.icon} text-sm`}></i>
                        <span className="text-sm">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {link.name === "CCC" && showCCCDropdown && (
                  <div
                    className="ml-4 mt-2 space-y-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push("/director/ccc-submenu");
                        setShowMobileMenu(false);
                        setShowCCCDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 rounded-md text-white/80 hover:bg-[#2E3B8E]/30 hover:text-white transition flex items-center gap-3"
                    >
                      <i className="fa-solid fa-building text-sm"></i>
                      <span className="text-sm">CCC Options</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Mobile Search */}
            <button className="w-full text-left px-4 py-3 rounded-md text-white/90 hover:bg-[#2E3B8E]/50 hover:text-white transition flex items-center gap-3">
              <Image src={SearchIcon} alt="Search" width={18} height={18} />
              Search
            </button>
          </nav>
        </div>
      )}

      {/* Notification Popup */}
      <NotificationPopup
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Profile Dropdown */}
      <ProfileDropdown
        isOpen={showProfileDropdown}
        onClose={() => setShowProfileDropdown(false)}
        onDocumentsClick={() => setShowDocuments(true)}
        onSettingsClick={() => setShowSettingsModal(true)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      {/* Documents Modal */}
      <DocumentsModal
        isOpen={showDocuments}
        onClose={() => setShowDocuments(false)}
        documents={documents}
        onDelete={handleDeleteDocument}
        onUpload={handleUploadDocument}
      />
    </>
  );
}
