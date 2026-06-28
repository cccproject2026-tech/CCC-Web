"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface CCCDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CCCDropdown({ isOpen, onClose }: CCCDropdownProps) {
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
      icon: "fa-solid fa-road",
      label: "Revitalization Roadmap",
      path: "/director/revitalization-roadmap",
    },
    {
      icon: "fa-solid fa-clipboard-check",
      label: "Assessments",
      path: "/director/assessments",
    },
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute top-[60px] left-0 w-[260px] bg-white rounded-xl shadow-2xl overflow-hidden z-50 animate-slide-down border border-gray-100"
    >
      <div className="py-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={() => handleNavigation(item.path)}
            className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left"
          >
            <i className={`${item.icon} text-[#2E3B8E] text-lg w-5`}></i>
            <span className="text-gray-800 font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
