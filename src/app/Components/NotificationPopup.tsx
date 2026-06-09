"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
export type NotificationPopupItem = {
  id: string;
  icon: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  link?: string;
  linkText?: string;
  time: string;
  isStarred?: boolean;
  avatarGroup?: boolean;
  count?: string;
};

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
  notifications?: NotificationPopupItem[];
  /** When true, shows a loading state instead of the list */
  loading?: boolean;
  /** Shown when there are no notifications and `loading` is false (skips demo placeholders) */
  emptyMessage?: string;
  /** "View all" link target */
  viewAllHref?: string;
}

export default function NotificationPopup({
  isOpen,
  onClose,
  notifications = [],
  loading = false,
  emptyMessage,
  viewAllHref = "/director/notifications",
}: NotificationPopupProps) {
  const router = useRouter();
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const defaultNotifications = [
    {
      id: "1",
      icon: "fa-solid fa-user-plus",
      iconColor: "text-blue-500",
      title: "NEW MENTEE ASSIGNMENT",
      subtitle: "Pr. John Doe has been assigned to you Lorem Ipsum",
      time: "9:43 am",
      isStarred: true,
    },
    {
      id: "2",
      icon: "fa-regular fa-clipboard",
      iconColor: "text-cyan-500",
      title: "ROADMAP NOTIFICATION",
      subtitle: "Roadmap: Complete a Community Engagement Project",
      time: "9:43 am",
      isStarred: true,
    },
    {
      id: "3",
      icon: "fa-regular fa-file",
      iconColor: "text-yellow-600",
      title: "NEW ASSIGNMENT SUBMISSION",
      avatarGroup: true,
      count: "3+ Mentees",
      link: "Click here to Review",
      time: "9:43 am",
      isStarred: true,
    },
    {
      id: "4",
      icon: "fa-regular fa-book",
      iconColor: "text-green-600",
      title: "COURSE COMPLETION",
      avatarGroup: true,
      count: "3+ Mentees",
      link: "Mark program as completed",
      time: "9:43 am",
    },
    {
      id: "5",
      icon: "fa-solid fa-link",
      iconColor: "text-red-500",
      title: "PROFILE INCOMPLETE",
      avatarGroup: true,
      count: "4+ Mentees",
      link: "Click here for more details",
      time: "9:43 am",
    },
  ];

  const displayNotifications =
    notifications.length > 0
      ? notifications
      : emptyMessage !== undefined
        ? []
        : defaultNotifications;

  return (
    <div
      ref={popupRef}
      className="fixed right-3 top-[68px] z-50 w-[calc(100vw-1.5rem)] max-w-[430px] overflow-hidden rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.98)_0%,rgba(6,36,62,0.98)_100%)] text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl animate-slide-down sm:absolute sm:right-6 sm:rounded-3xl"
      // className="absolute right-6 top-[68px] z-50 w-[430px] overflow-hidden rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,58,95,0.98)_0%,rgba(6,36,62,0.98)_100%)] text-white shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl animate-slide-down"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <h3 className="text-xl font-semibold text-white">Notifications</h3>
        <a
          href={viewAllHref}
          className="text-sm font-medium text-[#8ec5eb] transition hover:text-white"
        >
          View All
        </a>
      </div>

      {/* Notification List */}
      <div className="max-h-[520px] space-y-3 overflow-y-auto p-3">
        {loading && (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-gray-500">
            <i className="fa-solid fa-spinner fa-spin" />
            Loading…
          </div>
        )}
        {!loading && displayNotifications.length === 0 && emptyMessage !== undefined && (
          <p className="px-6 py-10 text-center text-sm text-gray-500">{emptyMessage}</p>
        )}
        {!loading &&
          displayNotifications.map((notification) => (
       

<div
  key={notification.id}
  role={notification.link ? "button" : undefined}
  tabIndex={notification.link ? 0 : undefined}
  onClick={() => {
    console.log("POPUP NOTIFICATION CLICKED:", notification.link);

    if (notification.link) {
      onClose();
      router.push(notification.link);
    }
  }}
  onKeyDown={(e) => {
    if (!notification.link) return;

    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClose();
      router.push(notification.link);
    }
  }}
  className={`relative rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition hover:bg-white/[0.1] ${
    notification.link ? "cursor-pointer" : "cursor-default"
  }`}
>

            <div className="flex gap-4">
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                  <i
                    className={`${notification.icon} ${notification.iconColor}`}
                  ></i>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1">
                <h4 className="mb-1 text-sm font-semibold text-white">
                  {notification.title}
                </h4>

                {notification.avatarGroup && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex -space-x-2">
                      <div className="w-5 h-5 rounded-full bg-gray-300 border-2 border-white"></div>
                      <div className="w-5 h-5 rounded-full bg-gray-400 border-2 border-white"></div>
                      <div className="w-5 h-5 rounded-full bg-gray-500 border-2 border-white"></div>
                    </div>
                    <span className="text-[11px] text-gray-600">
                      {notification.count}
                    </span>
                  </div>
                )}

                {notification.subtitle && (
                  <p className="mb-1 text-xs leading-5 text-[#cde2f2]">
                    {notification.subtitle}
                  </p>
                )}

                {notification.link && (
      
<a
  href={notification.link}
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();

    if (notification.link) {
      onClose();
      router.push(notification.link);
    }
  }}
  className="text-[12px] text-[#2E3B8E] hover:underline"
>
                    {'linkText' in notification && notification.linkText ? notification.linkText : notification.link}
                  </a>
                )}

                <p className="text-[11px] text-gray-400 mt-2">
                  {notification.time}
                </p>
              </div>

              {/* Star Icon */}
              {notification.isStarred && (
                <div className="flex-shrink-0">
                  <i className="fa-solid fa-star text-[#FFD700] text-sm"></i>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
