"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { getCookie, setCookie, clearAllCookies } from "@/app/utils/cookies";
import { getMentorUserId } from "@/app/utils/mentor-auth";
import { apiLogout } from "../Services/api";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
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
import { getNotification, apiGetRoadmaps, apiGetAssessments, apiGetAllUsers } from "../Services/api";
import { parseAssessmentsListPayload } from "../Services/assessment.service";

export default function MentorHeader({ showFullHeader = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [notificationList, setNotificationList] = useState<any[]>([]);
  const [searchResults, setSearchResults] = useState<{
    roadmaps: any[];
    assessments: any[];
    mentees: any[];
  }>({ roadmaps: [], assessments: [], mentees: [] });

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mentorId = getMentorUserId();
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
    { name: "Track Progress", path: "/mentor/TrackProgress" },
    { name: "Appointments", path: "/mentor/MentorSchedule" },
    { name: "Notes", path: "/mentor/notes" },
  ];

  useEffect(() => {
    const mentorId = getMentorUserId();
    if (!mentorId) return;

    const fetchNotifications = async () => {
      const enabledCookie = getCookie("mentor_notifications_enabled");
      const enabled = enabledCookie === null ? true : enabledCookie !== "false";
      setNotificationsEnabled(enabled);
      if (!enabled) {
        setNotificationList([]);
        return;
      }

      try {
        const res = await getNotification(mentorId);
        const list = res.data?.data?.notifications || [];
        setNotificationList(list);
      } catch (error) {
        console.error("Failed to fetch mentor notifications:", error);
        setNotificationList([]);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults({ roadmaps: [], assessments: [], mentees: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const [roadmapsRes, assessmentsRes, menteesRes] = await Promise.all([
          apiGetRoadmaps("all", query),
          apiGetAssessments({ search: query }),
          apiGetAllUsers({ search: query, roleMatch: "pastor", limit: 5 }),
        ]);

        const roadmaps = Array.isArray(roadmapsRes.data?.data) ? roadmapsRes.data.data : [];
        const assessments = parseAssessmentsListPayload(assessmentsRes.data);
        const mentees = Array.isArray(menteesRes.data?.data?.users)
          ? menteesRes.data.data.users
          : Array.isArray(menteesRes.data?.data)
            ? menteesRes.data.data
            : [];

        setSearchResults({ roadmaps, assessments, mentees });
      } catch (error) {
        console.error("Mentor global search failed:", error);
        setSearchResults({ roadmaps: [], assessments: [], mentees: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const profileMenu = [
    { icon: <User size={18} />, label: "Profile", path: "/mentor/profile" },
    { icon: <Award size={18} />, label: "Certificates", path: "/mentor/certificates" },
    { icon: <Clipboard size={18} />, label: "Mentorship Sessions", path: "/mentor/mentoring-session" },
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
    { icon: <Lock size={18} className="text-[#0f4a76]" />, label: "Change Password", active: true },
    { icon: <BellOff size={18} className="text-[#0f4a76]" />, label: "Turn Off Notifications", active: true },
    { icon: <UserX size={18} className="text-gray-400" />, label: "Change Mentor", active: false },
  ];

  return (
    <header className="relative z-50 flex items-center justify-between border-b border-white/10 bg-[#062946]/95 px-4 py-3 text-white shadow-[0_6px_20px_rgba(2,20,38,0.28)] backdrop-blur-md md:px-6 lg:px-10 font-[Albert_Sans]">
      {/* ✅ Left Logo */}
      <div className="flex items-center gap-3">
        <Image src={Framelogo1} alt="Logo" width={26} height={26} />
      </div>

      {/* ✅ Middle Nav Links */}
      {showFullHeader && (
        <nav className="hidden lg:flex items-center gap-6">
          {navLinks.map((link, index) => {
            const isActive =
              pathname === link.path ||
              (link.path.length > 1 && pathname.startsWith(`${link.path}/`));
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
      <div className="relative flex items-center gap-3 md:gap-5" ref={dropdownRef}>
        {showFullHeader && (
          <>
            {/* 🔍 Search */}
            <button
              onClick={() => {
                setShowSearch((prev) => !prev);
                setShowNotifications(false);
                setShowProfileMenu(false);
                setShowSettingsMenu(false);
              }}
              className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 transition hover:bg-white/15 md:flex"
            >
              <Image src={SearchIcon} alt="Search" width={18} height={18} />
            </button>

            {showSearch && (
              <div className="absolute right-[160px] top-12 z-[60] w-[420px] rounded-2xl border border-white/20 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] p-3 shadow-2xl">
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search roadmaps, assessments, pastors..."
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/70 outline-none"
                />
                <div className="mt-3 max-h-[360px] space-y-3 overflow-auto pr-1">
                  {searchLoading && <p className="text-xs text-white/80">Searching...</p>}
                  {!searchLoading && searchQuery.trim() && (
                    <>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#cde2f2]">Roadmaps</p>
                        {searchResults.roadmaps.slice(0, 4).map((item: any) => (
                          <Link key={item._id || item.id} href="/mentor/RevitalizationRoadmap" className="mb-1 block rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15">
                            {item.name || item.title || "Untitled roadmap"}
                          </Link>
                        ))}
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#cde2f2]">Assessments</p>
                        {searchResults.assessments.slice(0, 4).map((item: any) => (
                          <Link key={item._id || item.id} href="/mentor/MentorAssessments" className="mb-1 block rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15">
                            {item.name || item.title || "Untitled assessment"}
                          </Link>
                        ))}
                      </div>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#cde2f2]">Pastors</p>
                        {searchResults.mentees.slice(0, 4).map((item: any) => (
                          <Link key={item._id || item.id} href="/mentor/MenteesDetailed" className="mb-1 block rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15">
                            {`${item.firstName || ""} ${item.lastName || ""}`.trim() || item.name || "Pastor"}
                          </Link>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 🔔 Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  if (!notificationsEnabled) return;
                  setShowNotifications((prev) => !prev);
                  setShowProfileMenu(false);
                  setShowSettingsMenu(false);
                }}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 transition hover:bg-white/15 cursor-pointer"
              >
                <Image
                  src={NotificationIcon}
                  alt="Notification"
                  width={20}
                  height={20}
                />
                {notificationList.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FFD700] text-[#0f4a76] text-[10px] font-bold rounded-full w-[14px] h-[14px] flex items-center justify-center">
                    {notificationList.length}
                  </span>
                )}
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
                      href="/mentor/Notifications"
                      className="text-[#0f4a76] text-[14px] font-medium hover:underline"
                    >
                      View All
                    </a>
                  </div>

                  {/* Notifications List */}
                  <div className="p-2 space-y-2">
                    {notificationList.slice(0, 4).map((note, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between bg-[#F5F7FA] rounded-xl p-3"
                      >
                        <div className="flex items-start gap-3 w-full">
                          <Clipboard size={20} className="text-[#2679FF]" />
                          <div className="flex flex-col w-full">
                            <div className="flex justify-between">
                              <h3 className="font-semibold text-[14px] text-[#000000]">
                                {note.name || "Notification"}
                              </h3>
                              <div className="w-[8px] h-[8px] rounded-full bg-[#FFD700] mt-[2px]"></div>
                            </div>
                            <p className="text-[#7A7A7A] text-[13px] leading-snug">
                              {note.details || note.description || ""}
                            </p>
                            <p className="text-[#9A9A9A] text-[12px] text-right mt-1">
                              {note?.createdAt ? new Date(note.createdAt).toLocaleString() : ""}
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
            <button className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 transition hover:bg-white/15 md:flex">
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
                className="flex items-center gap-2 rounded-full border border-[#8ec5eb]/40 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] px-2 py-1 transition hover:bg-[linear-gradient(180deg,#145787_0%,#0f4a76_100%)] cursor-pointer md:px-3"
              >
                <div className="text-right text-[11px] leading-tight">
                  <p className="text-white/80">{getGreeting()}</p>
                  <p className="text-white font-medium">
                    {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
                  </p>
                </div>
                <Image
                  src={user?.profilePicture || UserProfile}
                  alt={user ? `${user.firstName} profile` : "User profile"}
                  width={30}
                  height={30}
                  className="rounded-full border border-white/40"
                />
              </button>

              {/* Profile Menu Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-[230px] rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,250,255,0.98)_100%)] text-[#0f4a76] shadow-[0_16px_40px_rgba(3,24,43,0.2)] font-[Albert_Sans]">
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
                              void apiLogout().catch(() => { });
                              clearAllCookies();
                              router.push("/mentor/login");
                              return;
                            }

                            // 3️⃣ Navigate to page
                            if (item.path) {
                              router.push(item.path);
                              setShowProfileMenu(false); // close dropdown after navigation
                            }
                          }}
                          className={`flex items-center gap-3 px-5 py-2 hover:bg-[#e8f2fa] transition text-[#0f4a76] w-full text-left ${item.subMenu && showSettingsMenu
                            ? "bg-[#F5F7FA]"
                            : ""
                            }`}
                        >
                          <span className="text-[#0f4a76]">{item.icon}</span>
                          <span className="text-[15px] font-medium">
                            {item.label}
                          </span>
                        </button>

                        {/* ⚙️ Settings Sub-Menu */}
                        {item.subMenu && showSettingsMenu && (
                          <div className="absolute -left-[240px] top-0 mt-1 w-[230px] rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,250,255,0.98)_100%)] text-[#0f4a76] shadow-[0_16px_40px_rgba(3,24,43,0.2)]">
                            {/* <div className="absolute -right-2 top-3 w-4 h-4 bg-white rotate-45 border-l border-t border-gray-100"></div> */}

                            <div className="flex flex-col py-2">
                              {settingsSubMenu.map((sub, j) => (
                                <button
                                  key={j}
                                  disabled={!sub.active}
                                  onClick={() => {
                                    if (!sub.active) return;

                                    if (sub.label === "Change Password") {
                                      setShowProfileMenu(false);
                                      setShowSettingsMenu(false);
                                      router.push("/mentor/change-password");
                                      return;
                                    }

                                    if (sub.label === "Turn Off Notifications") {
                                      setCookie("mentor_notifications_enabled", "false", 30);
                                      setNotificationsEnabled(false);
                                      setNotificationList([]);
                                      setShowNotifications(false);
                                      setShowSettingsMenu(false);
                                      setShowProfileMenu(false);
                                      return;
                                    }
                                  }}
                                  className={`flex items-center gap-3 px-5 py-2 text-[15px] font-medium ${sub.active
                                    ? "hover:bg-[#e8f2fa] text-[#0f4a76]"
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
