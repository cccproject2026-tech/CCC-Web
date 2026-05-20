"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { clearAllCookies } from "@/app/utils/cookies";
import { apiLogout } from "@/app/Services/api";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onDocumentsClick: () => void;
  onSettingsClick: () => void;
}

export default function ProfileDropdown({
  isOpen,
  onClose,
  onDocumentsClick,
  onSettingsClick,
}: ProfileDropdownProps) {
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

  const handleProfileClick = () => {
    router.push("/director/profile");
    onClose();
  };

  const handleLogout = () => {
    void apiLogout().catch(() => {});
    clearAllCookies();
    router.push("/director/login");
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-[60px] right-10 w-[280px] bg-white rounded-xl shadow-2xl overflow-hidden z-50 animate-slide-down border border-gray-100"
    >
      <div className="py-2">
        <button
          onClick={handleProfileClick}
          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
        >
          <i className="fa-solid fa-user text-[#2E3B8E] text-lg w-5"></i>
          <span className="text-gray-800 font-medium">Profile</span>
        </button>

        <button
          onClick={() => {
            onDocumentsClick();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
        >
          <i className="fa-regular fa-file-lines text-[#2E3B8E] text-lg w-5"></i>
          <span className="text-gray-800 font-medium">Documents</span>
        </button>
<button
  onClick={() => {
    router.push("/director/mentoring-session");
    onClose();
  }}
  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
>
  <i className="fa-solid fa-chalkboard-user text-[#2E3B8E] text-lg w-5"></i>
  <span className="text-gray-800 font-medium">Mentoring Sessions</span>
</button>
        <button
          onClick={() => {
            onSettingsClick();
            onClose();
          }}
          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
        >
          <i className="fa-solid fa-gear text-[#2E3B8E] text-lg w-5"></i>
          <span className="text-gray-800 font-medium">Settings</span>
        </button>

        <div className="border-t border-gray-100 my-2"></div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-red-50 transition-colors text-left"
        >
          <i className="fa-solid fa-arrow-right-from-bracket text-red-600 text-lg w-5"></i>
          <span className="text-red-600 font-medium">Log out</span>
        </button>
      </div>
    </div>
  );
}
