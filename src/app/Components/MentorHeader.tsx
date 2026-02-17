"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Framelogo1 from "../Assets/Frame-logo-1.png";
import Connecticon from "../Assets/Connect-icon.png";
import NotificationIcon from "../Assets/notification.png";
import SearchIcon from "../Assets/search.png";
import UserProfile from "../Assets/user-profile.png";
import {
  Clipboard,
  FileText,
  FileWarning,
  UserRound,
  User,
  Award,
  File,
  Trophy,
  FolderOpen,
  Settings,
  LogOut,
  Lock,
  BellOff,
  UserX,
} from "lucide-react";
import { apiGetUserById } from "../Services/users.service";
import { getGreeting } from "../Services/utils/helpers";

export default function MentorHeader({ showFullHeader = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mentorId = localStorage.getItem("userId");

    if (!mentorId) return;

    const fetchUser = async () => {
      try {
        const res = await apiGetUserById(mentorId);
        setUser(res.data?.data || null);
      } catch (err) {
        console.error("Failed to fetch mentor profile:", err);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  // ✅ Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
        setShowProfileMenu(false);
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: "Home", path: "/mentor/home" },
    { name: "My Mentees", path: "/mentor/MenteesDetailed" },
    { name: "Revitalization Roadmap", path: "/mentor/RevitalizationRoadmap" },
    { name: "Assessments", path: "/mentor/MentorAssessments" },
    { name: "Track Progress", path: "/mentor/MentorProgress" },
    { name: "Appointments", path: "/mentor/home" },
    { name: "Schedule", path: "/mentor/home" },
  ];

  const notifications = [
    {
      title: "NEW ROADMAP COURSES",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: <Clipboard size={20} className="text-[#2679FF]" />,
    },
    {
      title: "NEW NOTES ADDED",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: <FileText size={20} className="text-[#28B463]" />,
    },
    {
      title: "ASSIGNMENTS DUE TODAY",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: <FileWarning size={20} className="text-[#F1C40F]" />,
    },
    {
      title: "YOUR PROFILE IS INCOMPLETE",
      desc: "Interested in receiving mentoring in community engagement",
      time: "9:43 am",
      icon: <UserRound size={20} className="text-[#E74C3C]" />,
    },
  ];

  const profileMenu = [
    { icon: <User size={18} />, label: "Profile", path: "/mentor/profile" },
    { icon: <Award size={18} />, label: "Certificates", path: "/mentor/certificates" },
    { icon: <File size={18} />, label: "Assignments", path: "/mentor/assignments" },
    { icon: <Trophy size={18} />, label: "Micro Grand", path: "/mentor/micro-grant" },
    { icon: <FolderOpen size={18} />, label: "Documents", path: "/mentor/documents" },
    {
      icon: <Settings size={18} />,
      label: "Settings",
      subMenu: true,
    },
    { icon: <LogOut size={18} />, label: "Log out", action: "logout" },
  ];

  const settingsSubMenu = [
    { icon: <Lock size={18} className="text-[#0033A0]" />, label: "Change Password", active: true },
    { icon: <BellOff size={18} className="text-[#0033A0]" />, label: "Turn Off Notifications", active: true },
    { icon: <UserX size={18} className="text-gray-400" />, label: "Change Mentor", active: false },
  ];

  return (
    <header className="flex items-center justify-between px-10 py-3 bg-[#1A2E7A] text-white shadow-md relative z-50 font-[Albert_Sans]">
      {/* ✅ Left Logo */}
      <div className="flex items-center gap-3">
        <Image src={Framelogo1} alt="Logo" width={26} height={26} />
      </div>

      {/* ✅ Middle Nav Links */}
      {showFullHeader && (
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link, index) => {
            const isActive = pathname === link.path;
            return (
              <a
                key={index}
                href={link.path}
                className={`text-sm cursor-pointer transition-all duration-200 ${isActive
                  ? "font-semibold text-white"
                  : "text-white/80 hover:text-white"
                  }`}
              >
                {link.name}
              </a>
            );
          })}
        </nav>
      )}


      {/* ✅ Right Icons */}
      <div className="flex items-center gap-5 relative" ref={dropdownRef}>
        {showFullHeader && (
          <>
            {/* 🔍 Search */}
            <button className="hover:opacity-80 transition">
              <Image src={SearchIcon} alt="Search" width={18} height={18} />
            </button>

            {/* 🔔 Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications((prev) => !prev);
                  setShowProfileMenu(false);
                  setShowSettingsMenu(false);
                }}
                className="relative hover:opacity-80 transition cursor-pointer"
              >
                <Image
                  src={NotificationIcon}
                  alt="Notification"
                  width={20}
                  height={20}
                />
                <span className="absolute -top-1 -right-1 bg-[#FFD700] text-[#1A2E7A] text-[10px] font-bold rounded-full w-[14px] h-[14px] flex items-center justify-center">
                  4
                </span>
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute -right-8 mt-4 w-[450px] bg-white rounded-2xl shadow-lg border border-gray-100">
                  {/* Pointer */}
                  <div className="absolute -top-2 right-8 w-4 h-4 bg-white rotate-45 border-t border-l border-gray-100"></div>

                  {/* Header */}
                  <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="font-semibold text-[17px] text-black">
                      Notifications
                    </h2>
                    <a
                      href="#"
                      className="text-[#1A2E7A] text-[14px] font-medium hover:underline"
                    >
                      View All
                    </a>
                  </div>

                  {/* Notifications List */}
                  <div className="p-2 space-y-2">
                    {notifications.map((note, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between bg-[#F5F7FA] rounded-xl p-3"
                      >
                        <div className="flex items-start gap-3 w-full">
                          {note.icon}
                          <div className="flex flex-col w-full">
                            <div className="flex justify-between">
                              <h3 className="font-semibold text-[14px] text-[#000000]">
                                {note.title}
                              </h3>
                              <div className="w-[8px] h-[8px] rounded-full bg-[#FFD700] mt-[2px]"></div>
                            </div>
                            <p className="text-[#7A7A7A] text-[13px] leading-snug">
                              {note.desc}
                            </p>
                            <p className="text-[#9A9A9A] text-[12px] text-right mt-1">
                              {note.time}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 🔗 Connect */}
            <button className="hover:opacity-80 transition">
              <Image src={Connecticon} alt="Connect" width={22} height={22} />
            </button>

            {/* 👤 Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu((prev) => !prev);
                  setShowNotifications(false);
                  setShowSettingsMenu(false);
                }}
                className="flex items-center gap-2 bg-[#223C8C] px-3 py-1 rounded-full hover:opacity-90 transition cursor-pointer"
              >
                <div className="text-right text-[11px] leading-tight">
                  <p className="text-white/80">{getGreeting()}</p>
                  <p className="text-white font-medium">
                    {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
                  </p>
                </div>
                <Image
                  src={user?.profilePicture || UserProfile}
                  alt={user?.firstName}
                  width={30}
                  height={30}
                  className="rounded-full border border-white/40"
                />
              </button>

              {/* Profile Menu Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-[230px] bg-white rounded-2xl shadow-lg border border-gray-100 text-[#0033A0] font-[Albert_Sans]">
                  {/* Pointer */}
                  <div className="absolute -top-2 right-6 w-4 h-4 bg-white rotate-45 border-t border-l border-gray-100"></div>

                  <div className="flex flex-col py-2">
                    {profileMenu.map((item, i) => (
                      <div key={i} className="relative">
                        <button
                          onClick={() => {
                            if (item.subMenu) {
                              setShowSettingsMenu((prev) => !prev);
                              return;
                            }

                            // 2️⃣ Handle logout action
                            if (item.action === "logout") {
                              console.log("Logging out...");

                              // example logout flow
                              localStorage.removeItem("token");
                              router.push("/login");

                              return;
                            }

                            // 3️⃣ Navigate to page
                            if (item.path) {
                              router.push(item.path);
                              setShowProfileMenu(false); // close dropdown after navigation
                            }
                          }}
                          className={`flex items-center gap-3 px-5 py-2 hover:bg-[#F5F7FA] transition text-[#0033A0] w-full text-left ${item.subMenu && showSettingsMenu
                            ? "bg-[#F5F7FA]"
                            : ""
                            }`}
                        >
                          <span className="text-[#0033A0]">{item.icon}</span>
                          <span className="text-[15px] font-medium">
                            {item.label}
                          </span>
                        </button>

                        {/* ⚙️ Settings Sub-Menu */}
                        {item.subMenu && showSettingsMenu && (
                          <div className="absolute -left-[240px] top-0 mt-1 w-[230px] bg-white rounded-2xl shadow-lg border border-gray-100 text-[#0033A0]">
                            {/* <div className="absolute -right-2 top-3 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-100"></div> */}

                            <div className="flex flex-col py-2">
                              {settingsSubMenu.map((sub, j) => (
                                <button
                                  key={j}
                                  disabled={!sub.active}
                                  className={`flex items-center gap-3 px-5 py-2 text-[15px] font-medium ${sub.active
                                    ? "hover:bg-[#F5F7FA] text-[#0033A0]"
                                    : "text-gray-400 cursor-not-allowed"
                                    }`}
                                >
                                  {sub.icon}
                                  <span>{sub.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
