"use client";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { getCookie, clearAllCookies } from "@/app/utils/cookies";
import { getPastorUserId } from "@/app/utils/pastor-auth";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import Framelogo1 from "../Assets/Frame-logo-1.png";
import Connecticon from "../Assets/Connect-icon.png";
import NotificationIcon from "../Assets/notification.png";
import SearchIcon from "../Assets/search.png";
import UserProfile from "../Assets/user-profile.png";
import NotificationPopup from "./NotificationPopup";
import {
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
  Menu,
  X,
  Clipboard,
} from "lucide-react";
import { getNotifications, getSingleUser } from "../Services/pastor.service";
import type { NotificationItem } from "../Services/types/home.types";
import { mapNotificationItemToPopup, unwrapNotificationsList } from "../Services/notificationUi";
import {
  apiGetRoadmaps,
  apiGetAssessments,
  apiGetAllUsers,
  apiLogout,
} from "../Services/api";
import { parseAssessmentsListPayload } from "../Services/assessment.service";
import { resolveApiMediaUrl } from "@/app/utils/image";

function PastorHeaderComponent({ showFullHeader = false }: { showFullHeader?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    roadmaps: any[];
    assessments: any[];
    mentors: any[];
  }>({ roadmaps: [], assessments: [], mentors: [] });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [notificationList, setNotificationList] = useState<NotificationItem[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // useEffect(() => {
  //   const userId = getPastorUserId();
  //   if (!userId) return;

  //   async function fetchProfile() {
  //     try {
  //       const res = await getSingleUser(userId);
  //       setProfile(res.data?.data);
  //     } catch (error) {
  //       console.error("Error fetching user:", error);
  //     }
  //   }

  //   fetchProfile();
  // }, []);

  useEffect(() => {
  const userId = getPastorUserId();

  let storedUser: any = {};
  try {
    storedUser = JSON.parse(getCookie("user") || "{}");
  } catch {
    storedUser = {};
  }

  if (storedUser?.id || storedUser?._id || storedUser?.profilePicture) {
    setProfile(storedUser);
  }

  if (!userId) return;

  async function fetchProfile() {
    try {
      const res = await getSingleUser(userId);
      const apiUser = res.data?.data;

      const mergedUser = {
        ...apiUser,
        profilePicture:
          storedUser?.profilePicture ||
          apiUser?.profilePicture ||
          "",
      };

      setProfile(mergedUser);
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  }

  fetchProfile();
}, []);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // ✅ Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;

      // Check if click is outside dropdown area
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setShowNotifications(false);
        setShowProfileMenu(false);
        setShowSettingsMenu(false);
      }

      // Check if click is outside mobile menu area
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { name: "Home", path: "/pastor/home" },
    { name: "My Mentors", path: "/pastor/Mymentors" },
    { name: "Revitalization Roadmap", path: "/pastor/revitalization-roadmap" },
    { name: "Assessments", path: "/pastor/Assessments" },
    { name: "Progress", path: "/pastor/Myprogress" },
    { name: "Appointments", path: "/pastor/appointments" },
    { name: "Notes", path: "/pastor/notes" },
  ];


  const profileMenu = [
    { icon: <User size={18} />, label: "Profile", path: "/pastor/profile" },
    { icon: <Award size={18} />, label: "Certificates", path: "/pastor/Certificates" },
    { icon: <Clipboard size={18} />, label: "Mentorship Sessions", path: "/pastor/mentoring-session" },
    { icon: <File size={18} />, label: "Assignments", path: "/pastor/Assignments" },
    { icon: <Trophy size={18} />, label: "Micro Grant", path: "/pastor/MicroGrantApplication" },
    { icon: <FolderOpen size={18} />, label: "Documents", path: "/pastor/Documents" },
    { icon: <Settings size={18} />, label: "Settings", path: "/pastor/Settings" },
    { icon: <LogOut size={18} />, label: "Log out" },
  ];

  const settingsSubMenu = [
    {
      icon: <Lock size={18} className="text-[#0f4a76]" />,
      label: "Change Password",
      active: true,
    },
    {
      icon: <BellOff size={18} className="text-[#0f4a76]" />,
      label: "Turn Off Notifications",
      active: true,
    },
    {
      icon: <UserX size={18} className="text-gray-400" />,
      label: "Change Mentor",
      active: false,
    },
  ];

  // useEffect(() => {
  //   const userId = getPastorUserId();
  //   if (!userId) return;

  //   async function fetchNotifications() {
  //     try {
  //       const res = await getNotifications(userId);
  //       const list = unwrapNotificationsList(res);
  //       setNotificationList(list);
  //       const unread = list.filter((n) => !n.isRead).length;
  //       setNotificationCount(unread > 0 ? Math.min(unread, 99) : 0);
  //     } catch (err) {
  //       console.error("Error fetching notifications:", err);
  //       setNotificationList([]);
  //       setNotificationCount(0);
  //     }
  //   }

  //   fetchNotifications();
  // }, []);
  useEffect(() => {
  const pastorUserId = getPastorUserId();

  if (!pastorUserId) return;

  async function fetchNotifications(userId: string) {
    try {
      const res = await getNotifications(userId);
      const list = unwrapNotificationsList(res);
      const newestFirst = [...list].reverse();

      setNotificationList(newestFirst);

      const unread = newestFirst.filter((n) => !n.isRead).length;
      setNotificationCount(unread > 0 ? Math.min(unread, 99) : 0);
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setNotificationList([]);
      setNotificationCount(0);
    }
  }

  void fetchNotifications(pastorUserId);
}, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults({ roadmaps: [], assessments: [], mentors: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const [roadmapsRes, assessmentsRes, mentorsRes] = await Promise.all([
          apiGetRoadmaps("all", query),
          apiGetAssessments({ search: query }),
          apiGetAllUsers({ search: query, role: "mentor", limit: 5 }),
        ]);

        const roadmaps = Array.isArray(roadmapsRes.data?.data)
          ? roadmapsRes.data.data
          : [];
        const assessments = parseAssessmentsListPayload(assessmentsRes.data);
        const mentors = Array.isArray(mentorsRes.data?.data?.users)
          ? mentorsRes.data.data.users
          : Array.isArray(mentorsRes.data?.data)
            ? mentorsRes.data.data
            : [];

        setSearchResults({ roadmaps, assessments, mentors });
      } catch (error) {
        console.error("Global search failed:", error);
        setSearchResults({ roadmaps: [], assessments: [], mentors: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <header className="relative z-40 flex items-center justify-between border-b border-white/10 bg-[#062946]/95 px-4 py-3 text-white shadow-[0_6px_20px_rgba(2,20,38,0.28)] backdrop-blur-md md:px-6 lg:px-10 font-[Albert_Sans]">
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
        {/* Mobile Menu Button */}
        {showFullHeader && isClient && (
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="lg:hidden p-1 hover:bg-white/10 rounded transition"
            suppressHydrationWarning
          >
            {showMobileMenu ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
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
                  placeholder="Search roadmaps, assessments, mentors..."
                  className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/70 outline-none"
                />
                <div className="mt-3 max-h-[360px] space-y-3 overflow-auto pr-1">
                  {searchLoading && (
                    <p className="text-xs text-white/80">Searching...</p>
                  )}

                  {!searchLoading && searchQuery.trim() && (
                    <>
                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#cde2f2]">Roadmaps</p>
                        {searchResults.roadmaps.slice(0, 4).map((item: any) => (
                          <Link
                            key={item._id || item.id}
                            href={(() => {
                              const id = String(item._id || item.id || "").trim();
                              if (!id) return "/pastor/revitalization-roadmap";
                              const hasNested =
                                (Array.isArray(item.roadmaps) && item.roadmaps.length > 0) ||
                                String(item.haveNextedRoadMaps || "").toLowerCase() === "true" ||
                                item.haveNextedRoadMaps === true;
                              return hasNested
                                ? `/pastor/SelfRevitalizationPhasePage?id=${encodeURIComponent(id)}`
                                : `/pastor/jumpstart?id=${encodeURIComponent(id)}`;
                            })()}
                            className="mb-1 block rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
                          >
                            {item.name || item.title || "Untitled roadmap"}
                          </Link>
                        ))}
                      </div>

                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#cde2f2]">Assessments</p>
                        {searchResults.assessments.slice(0, 4).map((item: any) => (
                          <Link
                            key={item._id || item.id}
                            href="/pastor/Assessments"
                            className="mb-1 block rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
                          >
                            {item.name || item.title || "Untitled assessment"}
                          </Link>
                        ))}
                      </div>

                      <div>
                        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#cde2f2]">Mentors</p>
                        {searchResults.mentors.slice(0, 4).map((item: any) => (
                          <Link
                            key={item._id || item.id}
                            href="/pastor/Mymentors"
                            className="mb-1 block rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
                          >
                            {`${item.firstName || ""} ${item.lastName || ""}`.trim() || item.name || "Mentor"}
                          </Link>
                        ))}
                      </div>

                      {searchResults.roadmaps.length === 0 &&
                        searchResults.assessments.length === 0 &&
                        searchResults.mentors.length === 0 && (
                          <p className="text-xs text-white/80">No results found.</p>
                        )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 🔔 Notification Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfileMenu(false);
                  setShowSettingsMenu(false);
                }}
                className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 transition hover:bg-white/15 cursor-pointer"
              >
                <Image src={NotificationIcon} alt="Notification" width={20} height={20} />

                {/* 🔥 Dynamic Count */}
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#FFD700] text-[#0f4a76] text-[10px] font-bold rounded-full w-[16px] h-[16px] flex items-center justify-center">
                    {notificationCount}
                  </span>
                )}
              </button>


              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute -right-4 md:-right-8 mt-4 w-[300px] md:w-[450px] bg-white rounded-2xl shadow-lg border border-gray-100">
                  {/* Pointer */}
                  <div className="absolute -top-2 right-4 md:right-8 w-4 h-4 bg-white rotate-45 border-t border-l border-gray-100"></div>

                  {/* Header */}
                  <div className="px-5 py-3 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="font-semibold text-[17px] text-black">
                      Notifications
                    </h2>
                    <a
                      href="/pastor/notifications"
                      className="text-[#0f4a76] text-[14px] font-medium hover:underline"
                    >
                      View All
                    </a>
                  </div>

                  {/* Notifications List */}
                  <div className="space-y-2 p-2">
                    {notificationList.length === 0 ? (
                      <p className="rounded-xl bg-[#F5F7FA] px-3 py-4 text-center text-[13px] text-[#7A7A7A]">
                        No notifications yet.
                      </p>
                    ) : (
                      // notificationList.slice(0, 4).map((note) => {
                      //   const p = mapNotificationItemToPopup(note);
                      //   return (
                      //     <div
                      //       key={note._id}
                      //       className="flex items-start justify-between rounded-xl bg-[#F5F7FA] p-3"
                      //     >
                      notificationList.slice(0, 4).map((note) => {
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
      onKeyDown={(e) => {
        if (!p.link) return;

        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setShowNotifications(false);
          router.push(p.link);
        }
      }}
      className={`flex items-start justify-between rounded-xl bg-[#F5F7FA] p-3 transition hover:bg-[#eef2f6] ${
        p.link ? "cursor-pointer" : ""
      }`}
    >
                            <div className="flex w-full items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/80 bg-white">
                                <i className={`${p.icon} text-base ${p.iconColor}`} aria-hidden />
                              </div>

                              <div className="flex min-w-0 flex-1 flex-col">
                                <div className="flex justify-between gap-2">
                                  <h3 className="text-[14px] font-semibold text-[#000000]">{p.title}</h3>
                                  {!note.isRead && (
                                    <span
                                      className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#FFD700]"
                                      title="Unread"
                                    />
                                  )}
                                </div>

                                {p.subtitle ? (
                                  <p className="mt-0.5 text-[13px] leading-snug text-[#7A7A7A]">{p.subtitle}</p>
                                ) : null}

                                <p className="mt-1 text-right text-[12px] text-[#9A9A9A]">{p.time}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
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
                suppressHydrationWarning
              >
                <div className="hidden md:block text-right text-[11px] leading-tight">
                  <p className="text-white/80">Good Morning</p>
                  <p className="text-white font-medium">
                    {profile ? `${profile.firstName} ${profile.lastName}` : "..."}
                  </p>

                </div>
                {/* <Image
                  src={profile?.profilePicture || UserProfile}
                  alt="User"
                  width={30}
                  height={30}
                  className="rounded-full border border-white/40"
                /> */}

                <Image
  src={profile?.profilePicture || UserProfile}
  alt="User"
  width={30}
  height={30}
  unoptimized
  className="h-[30px] w-[30px] rounded-full border border-white/40 object-cover"
/>
              </button>

              {/* Profile Menu Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-[200px] md:w-[230px] rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(245,250,255,0.98)_100%)] text-[#0f4a76] shadow-[0_16px_40px_rgba(3,24,43,0.2)] font-[Albert_Sans]">
                  {/* Pointer */}
                  <div className="absolute -top-2 right-6 w-4 h-4 bg-white rotate-45 border-t border-l border-gray-100"></div>

                  <div className="flex flex-col py-2">
                    {profileMenu.map((item, i) => (
                      <div key={i} className="relative">
                        <button
                          onClick={() => {
                            if (item.label === "Log out") {
                              void apiLogout().catch(() => { });
                              clearAllCookies();
                              window.location.href = "/";
                              return;
                            }
                            if (item.path) {
                              router.push(item.path);
                              setShowProfileMenu(false);
                              setShowSettingsMenu(false);
                            }
                          }}
                          className="flex w-full items-center gap-3 px-5 py-2 text-left text-[#0f4a76] transition hover:bg-[#e8f2fa]"
                          suppressHydrationWarning
                        >
                          <span className="text-[#0f4a76]">{item.icon}</span>
                          <span className="text-[15px] font-medium">
                            {item.label}
                          </span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Mobile Navigation Menu */}
      {showFullHeader && showMobileMenu && (
        <div
          ref={mobileMenuRef}
          className="lg:hidden absolute top-full left-0 right-0 border-t border-white/10 bg-[#062946]/98 shadow-lg backdrop-blur-md z-50"
        >
          <nav className="flex flex-col py-2">
            {navLinks.map((link, index) => {
              const isActive =
                pathname === link.path ||
                (link.path.length > 1 && pathname.startsWith(`${link.path}/`));
              return (
                <button
                  key={index}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(link.path);
                    setShowMobileMenu(false);
                  }}
                  className={`px-4 py-3 text-sm transition-all duration-200 border-b border-white/5 last:border-b-0 text-left w-full cursor-pointer ${isActive
                    ? "font-semibold text-white bg-white/10"
                    : "text-white/80 hover:text-white hover:bg-white/5"
                    }`}
                  suppressHydrationWarning
                >
                  {link.name}
                </button>
              );
            })}

            <div className="flex items-center gap-4 px-4 py-3 border-t border-white/10">
              <button
                className="flex items-center gap-2 text-white/80 hover:text-white text-sm cursor-pointer"
                suppressHydrationWarning
              >
                <Image src={SearchIcon} alt="Search" width={16} height={16} />
                Search
              </button>
              <button
                className="flex items-center gap-2 text-white/80 hover:text-white text-sm cursor-pointer"
                suppressHydrationWarning
              >
                <Image src={Connecticon} alt="Connect" width={18} height={18} />
                Connect
              </button>
            </div>
          </nav>
        </div>
      )}

      {/* Notification Popup */}
      {showMobileMenu && (
        <NotificationPopup
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}
    </header>
  );
}

const PastorHeader = dynamic(() => Promise.resolve(PastorHeaderComponent), {
  ssr: false,
});

export default PastorHeader;
