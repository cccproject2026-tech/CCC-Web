"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface CoursesDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CoursesDropdown({
  isOpen,
  onClose,
}: CoursesDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
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

  const menuItems = [
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
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-full mt-10 left-0 w-[280px] bg-white rounded-lg shadow-2xl overflow-hidden z-50"
    >
      {/* Arrow pointer pointing up */}
      <div className="absolute -top-2 left-[15px] w-4 h-4 bg-white transform rotate-45 border-l border-t border-gray-200"></div>

      <div className="py-2 bg-white">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleNavigation(item.path)}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
          >
            <i
              className={`${item.icon} text-[#2E3B8E] text-base w-5 flex-shrink-0`}
            ></i>
            <span className="text-[#2E3B8E] font-medium text-sm">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
