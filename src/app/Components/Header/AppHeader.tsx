"use client";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Framelogo1 from "@/app/Assets/Frame-logo-1.png";
import Connecticon from "@/app/Assets/Connect-icon.png";
import NotificationIcon from "@/app/Assets/notification.png";
import SearchIcon from "@/app/Assets/search.png";
import NotificationPopup from "../NotificationPopup";
import ProfileDropdown from "../ProfileDropdown";
import SettingsModal from "../SettingsModal";
import CoursesDropdown from "../CoursesDropdown";
import CCCDropdown from "../CCCDropdown";
import DocumentsModal from "../DocumentsModal";
import { apiGetUserById, unwrapUserResponse } from "@/app/Services/users.service";
import {
  getNotification,
  apiGetRoadmaps,
  apiGetAssessments,
  apiGetAllUsers,
  apiGetAllInterests,
} from "@/app/Services/api";
import { parseAssessmentsListPayload } from "@/app/Services/assessment.service";
import { getCookie } from "@/app/utils/cookies";
import { resolveApiMediaUrl } from "@/app/utils/image";

import {
  mapNotificationItemToPopup,
  resolveSessionUserId,
  unwrapNotificationsList,
} from "@/app/Services/notificationUi";
import type { NotificationPopupItem } from "@/app/Components/NotificationPopup";
import type { NotificationItem } from "@/app/Services/types/home.types";

const sortNotificationsNewestFirst = (list: NotificationItem[]) =>
  [...list].sort((a: any, b: any) => {
    const aTime = new Date(
      a.createdAt || a.updatedAt || a.date || a.time || a.timestamp || 0,
    ).getTime();

    const bTime = new Date(
      b.createdAt || b.updatedAt || b.date || b.time || b.timestamp || 0,
    ).getTime();

    return bTime - aTime;
  });

function parseHeaderUserCookie():
  | {
      firstName?: string;
      lastName?: string;
      profilePicture?: string;
      profileImage?: string;
      image?: string;
      avatar?: string;
    }
  | null {
  try {
    const raw = getCookie("user");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getHeaderUserImage(user: any): string {
  const raw =
    user?.profilePicture ??
    user?.profileImage ??
    user?.image ??
    user?.avatar ??
    "";

  if (typeof raw !== "string" || !raw.trim()) return "";
  return resolveApiMediaUrl(raw.trim()) ?? raw.trim();
}

export default function AppHeader({ showFullHeader = false }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showCoursesDropdown, setShowCoursesDropdown] = useState(false);
  const [showCCCDropdown, setShowCCCDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [newInterestCount, setNewInterestCount] = useState(0);
  const [courseCompletedCount, setCourseCompletedCount] = useState(0);
  const pathname = usePathname();
  const router = useRouter();

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    roadmaps: any[];
    assessments: any[];
    people: any[];
  }>({ roadmaps: [], assessments: [], people: [] });

  const [notificationItems, setNotificationItems] = useState<NotificationPopupItem[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationBadge, setNotificationBadge] = useState(0);
  const [sessionUserId, setSessionUserId] = useState("");
  const [cookieUser, setCookieUser] = useState<{
    firstName?: string;
    lastName?: string;
    profilePicture?: string;
    profileImage?: string;
    image?: string;
    avatar?: string;
  } | null>(null);
  const [headerUser, setHeaderUser] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    setSessionUserId(resolveSessionUserId() ?? "");
    setCookieUser(parseHeaderUserCookie());
  }, []);

  useEffect(() => {
    const uid = resolveSessionUserId();
    if (!uid) return;

    let cancelled = false;

    const loadHeaderUser = async () => {
      try {
        const res = await apiGetUserById(uid);
        const user = unwrapUserResponse(res);
        if (!cancelled) {
          setHeaderUser(user as Record<string, unknown> | null);
        }
      } catch (error) {
        console.error("Director header user:", error);
        if (!cancelled) {
          setHeaderUser(null);
        }
      }
    };

    void loadHeaderUser();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const uid = resolveSessionUserId();
    if (!uid) return;

    let cancelled = false;
    const load = async () => {
      setNotificationsLoading(true);
      try {

        const res = await getNotification({ role: "director" });
const list: NotificationItem[] = unwrapNotificationsList(res);
const newestFirst = sortNotificationsNewestFirst(list);

if (cancelled) return;

const unread = newestFirst.filter((n) => n.isRead === false).length;
const badge = unread > 0 ? unread : newestFirst.length;

setNotificationBadge(badge);
setNotificationItems(newestFirst.slice(0, 10).map(mapNotificationItemToPopup));
      } catch (e) {
        console.error("Director notifications:", e);
        if (!cancelled) {
          setNotificationItems([]);
          setNotificationBadge(0);
        }
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults({ roadmaps: [], assessments: [], people: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const [roadmapsRes, assessmentsRes, peopleRes] = await Promise.all([
          apiGetRoadmaps("all", query),
          apiGetAssessments({ search: query }),
          apiGetAllUsers({ search: query, roleMatch: "mixed", limit: 10 }),
        ]);

        const roadmaps = Array.isArray(roadmapsRes.data?.data) ? roadmapsRes.data.data : [];
        const assessments = parseAssessmentsListPayload(assessmentsRes.data);
        const users = Array.isArray(peopleRes.data?.data?.users)
          ? peopleRes.data.data.users
          : Array.isArray(peopleRes.data?.data)
            ? peopleRes.data.data
            : [];

        setSearchResults({ roadmaps, assessments, people: users });
      } catch (e) {
        console.error("Director search failed:", e);
        setSearchResults({ roadmaps: [], assessments: [], people: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const personSearchHref = (u: { _id?: string; id?: string; role?: string }) => {
    const id = u._id || u.id;
    const role = (u.role || "").toLowerCase();
    if (role.includes("mentor") && id) return `/director/mentors/profile/${id}`;
    if (id) return `/director/track-progress/${id}`;
    return "/director/mentees";
  };

  useEffect(() => {
  let cancelled = false;

  const loadNewInterestCount = async () => {
    try {
     
     const res = await apiGetAllInterests({});
const raw: any = res.data?.data;

const list: any[] = Array.isArray(raw)
  ? raw
  : Array.isArray(raw?.interests)
    ? raw.interests
    : Array.isArray(raw?.items)
      ? raw.items
      : Array.isArray(raw?.data)
        ? raw.data
        : [];
      const count = list.filter(
        (item: any) => String(item?.status || "").trim().toLowerCase() === "new"
      ).length;

      if (!cancelled) {
        setNewInterestCount(count);
      }
    } catch (error) {
      console.error("Failed to load new interest count:", error);
      if (!cancelled) {
        setNewInterestCount(0);
      }
    }
  };

  void loadNewInterestCount();

  return () => {
    cancelled = true;
  };
}, []);
useEffect(() => {
  let cancelled = false;

  const loadCourseCompletedCount = async () => {
    try {
      const res = await apiGetAllUsers({
        role: "pastor",
        roleMatch: "mixed",
        limit: 1000,
      });

      const users = Array.isArray(res.data?.data?.users)
        ? res.data.data.users
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      const count = users.filter((u: any) => Boolean(u?.hasCompleted)).length;

      if (!cancelled) {
        setCourseCompletedCount(count);
      }
    } catch (error) {
      console.error("Failed to load course completed count:", error);
      if (!cancelled) {
        setCourseCompletedCount(0);
      }
    }
  };

  void loadCourseCompletedCount();

  return () => {
    cancelled = true;
  };
}, []);
  const navLinks = [
    { name: "Home", path: "/director/home" },
    { name: "Mentors", path: "/director/mentors" },
    { name: "Mentees", path: "/director/mentees" },
//     {
//       name: "Courses",
//       path: "/director/courses",
//       hasDropdown: true,
//       onClick: () => setShowCCCDropdown(!showCCCDropdown),
//     },
//    {
//   name: "New Interests",
//   path: "/director/interest-list",
//   hasBadge: newInterestCount > 0 ? String(newInterestCount) : undefined,
// },
//     {
//       name: "CCC",
//       path: "/director/ccc",
//       hasDropdown: true,
//       onClick: () => setShowCoursesDropdown(!showCoursesDropdown),
//     },
{
  name: "Courses",
  path: "/director/courses",
  hasDropdown: true,
  onClick: () => setShowCoursesDropdown(!showCoursesDropdown),
},
{
  name: "New Interests",
  path: "/director/interest-list",
  hasBadge: newInterestCount > 0 ? String(newInterestCount) : undefined,
},
{
  name: "CCC",
  path: "/director/ccc",
  hasDropdown: true,
  onClick: () => setShowCCCDropdown(!showCCCDropdown),
},
    { name: "Track Progress", path: "/director/track-progress" },
    { name: "Schedule", path: "/director/schedule" },
    { name: "Notes", path: "/director/notes" },
  {
  name: "Course Completed",
  path: "/director/course-completed",
  hasBadge:
    courseCompletedCount > 0
      ? String(Math.min(courseCompletedCount, 99))
      : undefined,
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

  const displayedName =
    `${String(headerUser?.firstName ?? cookieUser?.firstName ?? "").trim()} ${String(
      headerUser?.lastName ?? cookieUser?.lastName ?? "",
    ).trim()}`.trim() || "Admin";

  const headerAvatarSrc =
    getHeaderUserImage(headerUser) ||
    getHeaderUserImage(cookieUser) ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayedName)}&background=173653&color=ffffff`;

  return (
    <>
      <header className="relative z-50 flex items-center justify-between border-b border-white/10 bg-[#062946]/95 px-4 py-3 text-white shadow-[0_6px_20px_rgba(2,20,38,0.28)] backdrop-blur-md sm:px-6 lg:px-10 font-[Albert_Sans]">
        {/* Logo */}
        {/* <div className="flex items-center gap-3">
          <Image src={Framelogo1} alt="Logo" width={26} height={26} />
        </div> */}
        <Link
  href="/director/home"
  aria-label="Go to director home"
  className="flex items-center gap-3"
>
  <Image src={Framelogo1} alt="Logo" width={26} height={26} />
</Link>

        {/* Navigation */}
        {showFullHeader && (
          <nav className="hidden lg:flex items-center gap-6">
            {navLinks.map((link, index) => (
              <div key={index} className="relative">
                <button
                  onClick={(e) => handleNavClick(link, e)}
                  className={`text-sm transition relative flex items-center gap-1 ${pathname === link.path
                    ? "font-semibold text-white"
                    : "text-white/80 hover:text-white"
                    }`}
                >
                  {link.name}
                  {link.hasDropdown && (
                    <i className="fa-solid fa-chevron-down text-[10px]"></i>
                  )}
                  {link.hasBadge && (
                    <span className="absolute -top-2 -right-3 bg-[#FFD700] text-[#0f4a76] text-[9px] font-bold rounded-full w-[16px] h-[16px] flex items-center justify-center">
                      {link.hasBadge}
                    </span>
                  )}
                </button>
                {/* Dropdown for Courses */}
                {/* {link.name === "Courses" && (
                  <CCCDropdown
                    isOpen={showCCCDropdown && !showMobileMenu}
                    onClose={() => setShowCCCDropdown(false)}
                  />
                )} */}
                {/* Dropdown for CCC */}
                {/* {link.name === "CCC" && (
                  <CoursesDropdown
                    isOpen={showCoursesDropdown && !showMobileMenu}
                    onClose={() => setShowCoursesDropdown(false)}
                  />
                )}
     */}
     {link.name === "Courses" && (
  <CCCDropdown
    isOpen={showCoursesDropdown && !showMobileMenu}
    onClose={() => setShowCoursesDropdown(false)}
  />
)}

{link.name === "CCC" && (
  <CoursesDropdown
    isOpen={showCCCDropdown && !showMobileMenu}
    onClose={() => setShowCCCDropdown(false)}
  />
)}
              </div>
            ))}
          </nav>
        )}

        {/* Right side icons */}
        <div className="relative flex items-center gap-2 sm:gap-3 lg:gap-5">
          {showFullHeader && (
            <>
              <button
                type="button"
                onClick={() => {
                  setShowSearch((s) => !s);
                  setShowNotifications(false);
                  setShowProfileDropdown(false);
                }}
                className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 transition hover:bg-white/15 sm:flex"
                aria-expanded={showSearch}
                aria-label="Search"
              >
                <Image src={SearchIcon} alt="" width={18} height={18} />
              </button>

              {/* {showSearch && (
                <div className="absolute right-0 top-12 z-[60] w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-white/20 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] p-3 shadow-2xl sm:right-[120px]">
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search roadmaps, assessments, people…"
                    className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/70 outline-none focus:border-[#8ec5eb]/50"
                    autoFocus
                  /> */}
                  {showSearch && (
  <div className="absolute right-0 top-12 z-[60] w-[min(420px,calc(100vw-2rem))] rounded-2xl border border-white/20 bg-[linear-gradient(180deg,#0f4a76_0%,#0c3f66_100%)] p-3 shadow-2xl sm:right-[120px]">
    <div className="flex items-center gap-2">
      <input
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search roadmaps, assessments, people…"
        className="w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/70 outline-none focus:border-[#8ec5eb]/50"
        autoFocus
      />

      <button
        type="button"
        onClick={() => {
          setShowSearch(false);
          setSearchQuery("");
          setSearchResults({ roadmaps: [], assessments: [], people: [] });
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white/80 transition hover:bg-white/15 hover:text-white"
        aria-label="Close search"
      >
        <i className="fa-solid fa-xmark" />
      </button>
    </div>
                  <div className="mt-3 max-h-[360px] space-y-3 overflow-auto pr-1 text-left">
                    {searchLoading && <p className="text-xs text-white/80">Searching…</p>}
                    {!searchLoading && searchQuery.trim() && (
                      <>
                        <div>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#cde2f2]">Roadmaps</p>
                          {searchResults.roadmaps.slice(0, 4).map((item: { _id?: string; id?: string; name?: string; title?: string }) => (
                            <Link
                              key={item._id || item.id}
                              href="/director/revitalization-roadmap"
                              className="mb-1 block rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
                              onClick={() => setShowSearch(false)}
                            >
                              {item.name || item.title || "Roadmap"}
                            </Link>
                          ))}
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#cde2f2]">Assessments</p>
                          {searchResults.assessments.slice(0, 4).map((item: { _id?: string; id?: string; name?: string; title?: string }) => (
                            <Link
                              key={item._id || item.id}
                              href="/director/assessments"
                              className="mb-1 block rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
                              onClick={() => setShowSearch(false)}
                            >
                              {item.name || item.title || "Assessment"}
                            </Link>
                          ))}
                        </div>
                        <div>
                          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#cde2f2]">People</p>
                          {searchResults.people.slice(0, 6).map((item: { _id?: string; id?: string; firstName?: string; lastName?: string; role?: string }) => (
                            <Link
                              key={item._id || item.id}
                              href={personSearchHref(item)}
                              className="mb-1 block rounded-lg bg-white/10 px-3 py-2 text-sm text-white hover:bg-white/15"
                              onClick={() => setShowSearch(false)}
                            >
                              {`${item.firstName || ""} ${item.lastName || ""}`.trim() || "User"}{" "}
                              <span className="text-white/50">({item.role || "—"})</span>
                            </Link>
                          ))}
                        </div>
                        {searchResults.roadmaps.length === 0 &&
                          searchResults.assessments.length === 0 &&
                          searchResults.people.length === 0 && (
                            <p className="text-xs text-white/80">No results.</p>
                          )}
                      </>
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                className="relative"
                onClick={() => {
                  setShowNotifications((n) => !n);
                  setShowSearch(false);
                  setShowProfileDropdown(false);
                }}
                aria-label="Notifications"
              >
                <Image
                  src={NotificationIcon}
                  alt=""
                  width={20}
                  height={20}
                  className="hover:opacity-80 cursor-pointer"
                />
                {notificationBadge > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-[14px] min-w-[14px] items-center justify-center rounded-full bg-[#FFD700] px-1 text-[10px] font-bold text-[#0f4a76]">
                    {notificationBadge > 99 ? "99+" : notificationBadge}
                  </span>
                )}
              </button>

              {/* Connect - Hidden on small mobile */}
              <button className="hidden xs:block hover:opacity-80 transition">
                <Image src={Connecticon} alt="Connect" width={22} height={22} />
              </button>

              {/* User Profile - Responsive */}
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="flex cursor-pointer items-center gap-1 sm:gap-2 rounded-full border border-white/15 bg-white/10 px-2 sm:px-3 py-1 transition hover:bg-white/20"
              >
                <div className="hidden sm:block text-right text-[11px] leading-tight">
                  <p className="text-white/80">Good Morning</p>
                  <p className="text-white font-medium">{displayedName}</p>
                </div>
                <img
  src={headerAvatarSrc}
  alt="User"
  className="h-[30px] w-[30px] rounded-full border border-white/40 object-cover"
/>
              </button>

              {/* Mobile Menu Button */}
              <button
                // onClick={() => {
                //   setShowMobileMenu(!showMobileMenu);
                //   if (!showMobileMenu) {
                //     setShowCoursesDropdown(false);
                //     setShowCCCDropdown(false);
                //   }
                // }}
                onClick={() => {
  setShowMobileMenu(!showMobileMenu);
  setShowSearch(false);

  if (!showMobileMenu) {
    setShowCoursesDropdown(false);
    setShowCCCDropdown(false);
  }
}}
                className="lg:hidden p-2 hover:opacity-80 transition"
              >
                <i
                  className={`fa-solid ${showMobileMenu ? "fa-times" : "fa-bars"
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
        <div className="fixed left-0 right-0 top-[60px] z-40 max-h-[calc(100vh-60px)] overflow-y-auto border-t border-white/10 bg-[#062946]/98 shadow-lg backdrop-blur-md lg:hidden">
          <nav className="px-4 py-4 space-y-2">
            {navLinks.map((link, index) => (
              <div key={index}>
                <button
                  onClick={(e) => {
                    handleNavClick(link, e);
                    if (!link.hasDropdown) setShowMobileMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-md transition flex items-center justify-between ${pathname === link.path
                    ? "bg-[#8ec5eb]/20 font-semibold text-white"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <span className="flex items-center gap-2">
                    {link.name}
                    {link.hasBadge && (
                      <span className="bg-[#FFD700] text-[#0f4a76] text-[10px] font-bold rounded-full w-[18px] h-[18px] flex items-center justify-center">
                        {link.hasBadge}
                      </span>
                    )}
                  </span>
                  {link.hasDropdown && (
                    <i
                      className={`fa-solid fa-chevron-${(link.name === "Courses" && showCoursesDropdown) ||
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
                    {/* {[
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
                    ].map((item, idx) => ( */}
                    {[
  {
    icon: "fa-solid fa-route",
    label: "Roadmap",
    path: "/director/revitalization-roadmap",
  },
  {
    icon: "fa-regular fa-clipboard",
    label: "Assessments",
    path: "/director/assessments",
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
                        className="w-full text-left px-4 py-2 rounded-md text-white/80 transition hover:bg-white/10 hover:text-white flex items-center gap-3"
                      >
                        <i className={`${item.icon} text-sm`}></i>
                        <span className="text-sm">{item.label}</span>
                      </button>
                    ))}
                  </div>
                )}
{/* 
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
                      className="w-full text-left px-4 py-2 rounded-md text-white/80 transition hover:bg-white/10 hover:text-white flex items-center gap-3"
                    >
                      <i className="fa-solid fa-building text-sm"></i>
                      <span className="text-sm">CCC Options</span>
                    </button>
                  </div>
                )} */}
                {link.name === "CCC" && showCCCDropdown && (
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
      {
        icon: "fa-regular fa-circle-question",
        label: "Help",
        path: "/director/faq",
      },
    ].map((item, idx) => (
      <button
        key={idx}
        onClick={(e) => {
          e.stopPropagation();
          router.push(item.path);
          setShowMobileMenu(false);
          setShowCCCDropdown(false);
        }}
        className="w-full text-left px-4 py-2 rounded-md text-white/80 transition hover:bg-white/10 hover:text-white flex items-center gap-3"
      >
        <i className={`${item.icon} text-sm`} />
        <span className="text-sm">{item.label}</span>
      </button>
    ))}
  </div>
)}
              </div>
            ))}

            {/* Mobile Search */}
            {/* <button className="w-full text-left px-4 py-3 rounded-md text-white/90 transition hover:bg-white/10 hover:text-white flex items-center gap-3">
              <Image src={SearchIcon} alt="Search" width={18} height={18} />
              Search
            </button> */}
            <button
  type="button"
  onClick={() => {
    setShowSearch(true);
    setShowMobileMenu(false);
    setShowNotifications(false);
    setShowProfileDropdown(false);
  }}
  className="w-full text-left px-4 py-3 rounded-md text-white/90 transition hover:bg-white/10 hover:text-white flex items-center gap-3"
>
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
        notifications={notificationItems}
        loading={notificationsLoading}
        emptyMessage="No notifications yet."
        viewAllHref="/director/notifications"
      />

      {/* Profile Dropdown */}
      <ProfileDropdown
        isOpen={showProfileDropdown}
        onClose={() => setShowProfileDropdown(false)}
       
        onDocumentsClick={() => router.push("/director/documents")}
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
        userId={sessionUserId}
      />
    </>
  );
}
