"use client";
import Image from "next/image";
import { useState } from "react";
import { usePathname } from "next/navigation";
import Framelogo1 from "../Assets/Frame-logo-1.png";
import Connecticon from "../Assets/Connect-icon.png";
import NotificationIcon from "../Assets/notification.png";
import SearchIcon from "../Assets/search.png";
import UserProfile from "../Assets/user-profile.png";
import NotificationPopup from "./NotificationPopup";

export default function AppHeader({ showFullHeader = false }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { name: "Home", path: "/director/home" },
    { name: "Mentors", path: "/director/mentors" },
    { name: "Mentees", path: "/director/mentees" },
    { name: "Courses", path: "/director/courses", hasDropdown: true },
    { name: "New Interests", path: "/director/new-interests", hasBadge: "3" },
    { name: "CCC", path: "/director/ccc", hasDropdown: true },
    { name: "Track Progress", path: "/director/track-progress" },
    { name: "Schedule", path: "/director/schedule" },
    {
      name: "Course Completed",
      path: "/director/course-completed",
      hasBadge: "3",
    },
  ];

  return (
    <header className="flex items-center justify-between px-10 py-3 bg-[#2E3B8E] text-white shadow-md relative z-50">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <Image src={Framelogo1} alt="Logo" width={26} height={26} />
      </div>

      {/* Navigation */}
      {showFullHeader && (
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link, index) => (
            <a
              key={index}
              href={link.path}
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
            </a>
          ))}
        </nav>
      )}

      {/* Right side icons */}
      <div className="flex items-center gap-5">
        {showFullHeader && (
          <>
            {/* Search */}
            <button className="hover:opacity-80 transition">
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

            {/* Connect */}
            <button className="hover:opacity-80 transition">
              <Image src={Connecticon} alt="Connect" width={22} height={22} />
            </button>

            {/* User Profile */}
            <div className="flex items-center gap-2 bg-[#3D4FA8] px-3 py-1 rounded-full">
              <div className="text-right text-[11px] leading-tight">
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
            </div>
          </>
        )}

        {/* Simplified header */}
        {!showFullHeader && (
          <button className="p-2 hover:opacity-80">
            <Image src={Connecticon} alt="Connect" width={24} height={24} />
          </button>
        )}
      </div>

      {/* Notification Popup */}
      <NotificationPopup
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </header>
  );
}
