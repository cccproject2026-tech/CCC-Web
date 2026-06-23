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
import SearchIcon from "../Assets/search.png";
import UserProfile from "../Assets/user-profile.png";
import {
  Clipboard,
  FileText,
    ClipboardCheck,
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
  Bell,
  BellOff,
  UserX,
  Mic,
} from "lucide-react";
import { apiGetUserById } from "../Services/users.service";
import { getGreeting } from "../Services/utils/helpers";
import { getNotification, apiGetRoadmaps, apiGetAssessments, apiGetAllUsers } from "../Services/api";
import type { NotificationItem } from "../Services/types/home.types";
import { mapNotificationItemToPopup, unwrapNotificationsList } from "../Services/notificationUi";
import { parseAssessmentsListPayload } from "../Services/assessment.service";

const MENTOR_NOTIFICATIONS_STORAGE_KEY = "mentorNotificationsEnabled";

export default function MentorHeader({ showFullHeader = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [notificationList, setNotificationList] = useState<NotificationItem[]>([]);
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

  // const navLinks: Array<{ name: string; path: string; desktopLabel?: string }> = [
  //   { name: "Home", path: "/mentor/home" },
  //   { name: "My Mentees", path: "/mentor/MenteesDetailed", desktopLabel: "My\nMentees" },
  //   {
  //     name: "Revitalization Roadmap",
  //     path: "/mentor/RevitalizationRoadmap",
  //     desktopLabel: "Revitalization\nRoadmap",
  //   },
  //   { name: "Assessments", path: "/mentor/MentorAssessments" },
  //   { name: "Track Progress", path: "/mentor/TrackProgress", desktopLabel: "Track\nProgress" },
  //   { name: "Appointments", path: "/mentor/MentorSchedule" },
  //   { name: "Notes", path: "/mentor/notes" },
  //   { name: "Voice Notes", path: "/mentor/voice-notes", desktopLabel: "Voice\nNotes" },
  //   {
  //     name: "Mentorship Sessions",
  //     path: "/mentor/mentoring-session",
  //     desktopLabel: "Mentorship\nSessions",
  //   },
  // ];
const navLinks: Array<{ name: string; path: string; desktopLabel?: string }> = [
  { name: "Home", path: "/mentor/home" },
  { name: "My Mentees", path: "/mentor/MenteesDetailed", desktopLabel: "My Mentees" },
  {
    name: "Revitalization Roadmap",
    path: "/mentor/RevitalizationRoadmap",
    desktopLabel: "Revitalization Roadmap",
  },
  { name: "Assessments", path: "/mentor/MentorAssessments" },
  { name: "Track Progress", path: "/mentor/TrackProgress", desktopLabel: "Track Progress" },
  { name: "Appointments", path: "/mentor/MentorSchedule" },
  { name: "Notes", path: "/mentor/notes" },
  { name: "Voice Notes", path: "/mentor/voice-notes", desktopLabel: "Voice Notes" },
  {
    name: "Mentorship Sessions",
    path: "/mentor/mentoring-session",
    desktopLabel: "Mentorship\nSessions",
  },
];

  useEffect(() => {
    const mentorId = getMentorUserId();
    if (!mentorId) return;

    const fetchNotifications = async () => {
      const storedPreference =
        typeof window !== "undefined"
          ? window.localStorage.getItem(MENTOR_NOTIFICATIONS_STORAGE_KEY)
          : null;
      const enabledCookie = getCookie("mentor_notifications_enabled");
      const enabled =
        storedPreference === null
          ? enabledCookie === null
            ? true
            : enabledCookie !== "false"
          : storedPreference !== "false";
      if (typeof window !== "undefined" && storedPreference === null && enabledCookie !== null) {
        window.localStorage.setItem(MENTOR_NOTIFICATIONS_STORAGE_KEY, enabled ? "true" : "false");
      }
      setNotificationsEnabled(enabled);
      setCookie("mentor_notifications_enabled", enabled ? "true" : "false", 30);

      try {
     
const res = await getNotification(mentorId);
const list = unwrapNotificationsList(res);
const newestFirst = [...list].reverse();

setNotificationList(newestFirst);
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
      { icon: <ClipboardCheck size={18} />, label: "Review Center", path: "/mentor/review-center" },
   
    { icon: <Trophy size={18} />, label: "Micro Grant", path: "/mentor/micro-grant" },
    { icon: <FolderOpen size={18} />, label: "Documents", path: "/mentor/documents" },
    { icon: <Mic size={18} />, label: "Voice Notes", path: "/mentor/voice-notes" },
    {
      icon: <Settings size={18} />,
      label: "Settings",
      subMenu: true,
    },
    { icon: <LogOut size={18} />, label: "Log out", action: "logout" },
  ];

  const settingsSubMenu = [
    { icon: <Lock size={18} className="text-[#0f4a76]" />, label: "Change Password", active: true },
    {
      icon: notificationsEnabled ? (
        <BellOff size={18} className="text-[#0f4a76]" />
      ) : (
        <Bell size={18} className="text-[#0f4a76]" />
      ),
      label: notificationsEnabled ? "Turn Off Notifications" : "Turn On Notifications",
      active: true,
    },
    { icon: <UserX size={18} className="text-gray-400" />, label: "Change Mentor", active: false },
  ];
const isLoginPage = pathname === "/mentor/login" || pathname === "/login";
const logoHref = isLoginPage ? "/" : "/mentor/home";
  return (
    <>
    <header className="relative z-50 flex min-h-[64px] w-full items-center justify-between border-b border-white/10 bg-[#062946]/95 px-4 py-3 text-white shadow-[0_6px_20px_rgba(2,20,38,0.28)] backdrop-blur-md md:px-6 lg:px-10 font-[Albert_Sans]">
      {/* ✅ Left Logo */}
      {/* <div className="flex items-center gap-3">
        <Image src={Framelogo1} alt="Logo" width={26} height={26} />
      </div> */}
      {/* <Link
  href="/mentor/home"
  className="flex items-center gap-3"
  aria-label="Mentor Home"
>
  <Image src={Framelogo1} alt="Logo" width={26} height={26} />
</Link> */}
<Link
  href={logoHref}
  className="flex h-10 w-10 shrink-0 items-center justify-start cursor-pointer"
  aria-label={isLoginPage ? "Landing Page" : "Mentor Home"}
>
  <Image src={Framelogo1} alt="Logo" width={26} height={26} />
</Link>

      {/* ✅ Middle Nav Links */}
      {showFullHeader && (
        // <nav className="hidden lg:flex items-center gap-6">
        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-2 px-3 lg:flex xl:gap-3 2xl:gap-4">
          {navLinks.map((link, index) => {
            const isActive =
              pathname === link.path ||
              (link.path.length > 1 && pathname.startsWith(`${link.path}/`));
            return (
              <a
                key={index}
                href={link.path}
                className={`flex min-h-10 max-w-none items-center justify-center px-1 text-center text-[12px] leading-tight whitespace-pre-line cursor-pointer transition-colors duration-200 xl:px-1.5 xl:text-[13px] ${isActive
                  ? "font-semibold text-white"
                  : "text-white/80 hover:text-white"
                  }`}
              >
                {link.desktopLabel ?? link.name}
              </a>
            );
          })}
        </nav>
      )}


      {/* ✅ Right Icons */}
     <div className="relative flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 xl:gap-2" ref={dropdownRef}>
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
             className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 transition hover:bg-white/15"
            >
              <Image src={SearchIcon} alt="Search" width={18} height={18} />
            </button>

            {showSearch && (
              <div className="fixed left-4 right-4 top-[76px] z-[80] max-h-[calc(100vh-96px)] overflow-hidden rounded-2xl border border-white/20 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] p-3 shadow-2xl md:absolute md:left-auto md:right-0 md:top-12 md:z-[60] md:w-[min(420px,calc(100vw-2rem))] xl:right-[120px]">
                <div className="flex items-center gap-2">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search roadmaps, assessments, pastors..."
                    className="min-w-0 flex-1 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/70 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSearch(false)}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/15 md:hidden"
                    aria-label="Close search"
                  >
                    <i className="fa-solid fa-xmark text-sm" />
                  </button>
                </div>
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
                  setShowNotifications((prev) => !prev);
                  setShowProfileMenu(false);
                  setShowSettingsMenu(false);
                }}
               className="relative flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 transition hover:bg-white/15 cursor-pointer"
              >
                <Bell size={20} aria-hidden="true" />
                {notificationList.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FFD700] text-[#0f4a76] text-[10px] font-bold rounded-full w-[14px] h-[14px] flex items-center justify-center">
                    {notificationList.length}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
             {/* {showNotifications && ( 
                <div className="absolute -right-8 mt-4 w-[450px] overflow-hidden rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.98)_0%,rgba(6,36,62,0.98)_100%)] text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl"> */}
                {showNotifications && (
  <div className="fixed left-4 right-4 top-[76px] z-[80] max-h-[calc(100vh-96px)] overflow-hidden rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.98)_0%,rgba(6,36,62,0.98)_100%)] text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl md:absolute md:left-auto md:right-0 md:top-auto md:mt-4 md:w-[450px]">
                  {/* Pointer */}
                 <div className="absolute -top-2 right-8 h-4 w-4 rotate-45 border-l border-t border-white/15 bg-[#0c3a5f]" />

                  {/* Header */}
<div className="relative z-10 flex items-center justify-between border-b border-white/10 px-5 py-4">                    <h2 className="font-semibold text-[17px] text-white">
                      Notifications
                    </h2>
                    <a
                      href="/mentor/Notifications"
                      className="text-[#8ec5eb] text-[14px] font-medium hover:text-white"
                    >
                      View All
                    </a>
                  </div>

                  {/* Notifications List */}
                  {/* <div className="relative z-10 max-h-[520px] space-y-3 overflow-y-auto p-3 pr-2"> */}
                  <div className="relative z-10 max-h-[calc(100vh-170px)] space-y-3 overflow-y-auto p-3 pr-2 md:max-h-[520px]">
                    {/* {notificationList.slice(0, 4).map((note, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between bg-[#F5F7FA] rounded-xl p-3"
                      > */}
                      {notificationList.map((note) => {
  const p = mapNotificationItemToPopup(note);

  return (
    <div
      key={note._id}
      role={p.link ? "button" : undefined}
      tabIndex={p.link ? 0 : undefined}
      onClick={() => {
        if (p.link) {
          setShowNotifications(false);
          router.push(p.link);
        }
      }}
      className={`flex items-start justify-between rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/[0.1] ${
  p.link ? "cursor-pointer" : ""
}`}
    >
                        <div className="flex items-start gap-3 w-full">
                          <Clipboard size={20} className="text-[#2679FF]" />
                          <div className="flex flex-col w-full">
                            <div className="flex justify-between">
                              <h3 className="font-semibold text-[14px] text-white">
                               
                                {p.title}
                              </h3>
                              <div className="w-[8px] h-[8px] rounded-full bg-[#FFD700] mt-[2px]"></div>
                            </div>
                            <p className="text-[#cde2f2] text-[13px] leading-snug">
                             
                              {p.subtitle || ""}
                            </p>
                            <p className="text-white/50 text-[12px] text-right mt-1">
                             
                              {p.time}
                            </p>
                          </div>
                        </div>
                      </div>
                       );
})}
                  </div>
                </div>
              )}
            </div>

            {/* 🔗 Connect */}
            <button className="hidden h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/5 transition hover:bg-white/15 md:flex">
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
                className="flex items-center gap-1.5 rounded-full border border-[#8ec5eb]/40 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] px-1.5 py-1 transition hover:bg-[linear-gradient(180deg,#145787_0%,#0f4a76_100%)] cursor-pointer"
              >
                <div className="hidden max-w-[100px] text-right text-[11px] leading-tight xl:block">
                  <p className="text-white/80">{getGreeting()}</p>
                  <p className="truncate text-white font-medium">
                    {user ? `${user.firstName} ${user.lastName}` : "Loading..."}
                  </p>
                </div>
               
                <div className="h-[30px] w-[30px] overflow-hidden rounded-full border border-white/40 bg-white/10">

  <img
  src={
    user?.profilePicture
      ? user.profilePicture
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(
          `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Mentor"
        )}&background=173653&color=ffffff`
  }
  alt={user ? `${user.firstName} profile` : "User profile"}
  className="h-full w-full rounded-full object-cover"
/>
</div>
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
                              window.location.href = "/login";
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
                          <div className="static mt-1 w-full rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,250,255,0.98)_100%)] text-[#0f4a76] shadow-[0_16px_40px_rgba(3,24,43,0.2)] md:absolute md:-left-[240px] md:top-0 md:mt-1 md:w-[230px]">
                           

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

                                    if (
                                      sub.label === "Turn Off Notifications" ||
                                      sub.label === "Turn On Notifications"
                                    ) {
                                      const nextEnabled = !notificationsEnabled;
                                      if (typeof window !== "undefined") {
                                        window.localStorage.setItem(
                                          MENTOR_NOTIFICATIONS_STORAGE_KEY,
                                          String(nextEnabled),
                                        );
                                      }
                                      setCookie("mentor_notifications_enabled", nextEnabled ? "true" : "false", 30);
                                      setNotificationsEnabled(nextEnabled);
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
                        {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => {
                setShowMobileMenu((prev) => !prev);
                setShowSearch(false);
                setShowNotifications(false);
                setShowProfileMenu(false);
                setShowSettingsMenu(false);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 transition hover:bg-white/15 lg:hidden"
              aria-label="Toggle mentor menu"
            >
              <i className={`fa-solid ${showMobileMenu ? "fa-xmark" : "fa-bars"} text-lg`} />
            </button>
          </>
        )}
      </div>
     </header>

    {showFullHeader && showMobileMenu && (
      <div className="fixed left-0 right-0 top-[64px] z-40 max-h-[calc(100vh-64px)] overflow-y-auto border-t border-white/10 bg-[#062946]/98 shadow-lg backdrop-blur-md lg:hidden">
        <nav className="space-y-2 px-4 py-4">
          {navLinks.map((link) => {
            const isActive =
              pathname === link.path ||
              (link.path.length > 1 && pathname.startsWith(`${link.path}/`));

            return (
              <button
                key={link.path}
                type="button"
                onClick={() => {
                  router.push(link.path);
                  setShowMobileMenu(false);
                }}
                className={`w-full rounded-md px-4 py-3 text-left text-sm font-semibold transition ${
                  isActive
                    ? "bg-[#8ec5eb]/20 text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.name}
              </button>
            );
          })}
        </nav>
      </div>
    )}
  </>
);
}
