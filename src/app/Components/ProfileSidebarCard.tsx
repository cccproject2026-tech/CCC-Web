"use client";
import React from "react";
import Image from "next/image";

export interface ProfileSidebarCardProps {
  // Basic Info
  name: string;
  role?: string;
  subtitle?: string; // e.g., "(Mentee - Reborn)"
  image: any;
  showEditIcon?: boolean;
  onEditImage?: () => void;
  showGalleryIcon?: boolean; // Purple gallery/image icon
  onGalleryClick?: () => void;

  // Info text (under name) - e.g., "Total Mentees : 5", "Last Contacted : 3 Days Ago"
  infoLines?: {
    label?: string;
    value: string;
    color?: string;
  }[];

  // Badge (e.g., "5 Mentees")
  badge?: {
    icon?: string;
    text: string;
    color?: string; // e.g., "bg-yellow-50 text-yellow-700"
  };

  // Contact Icons
  showContactIcons?: boolean;
  onEmailClick?: () => void;
  onMessageClick?: () => void;
  onWhatsAppClick?: () => void;
  onPhoneClick?: () => void;

  // Progress Bar
  progress?: {
    value: number;
    label?: string;
  };

  // Stats (Total/Active/Completed)
  stats?: {
    label: string;
    value: number | string;
    color?: string; // e.g., "text-green-600"
  }[];

  // Specialization
  specialization?: string;

  // Profile Information / Bio
  profileInfo?: string;

  // Documents
  documents?: {
    count: number;
    onClick?: () => void;
  };

  // Action Buttons
  primaryButton?: {
    icon: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "primary" | "secondary" | "outline";
  };

  secondaryButton?: {
    icon: string;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    variant?: "primary" | "secondary" | "outline";
  };

  // Variant type
  variant?: "mentor" | "mentee" | "edit";
}

export default function ProfileSidebarCard({
  name,
  role,
  subtitle,
  image,
  showEditIcon = false,
  onEditImage,
  showGalleryIcon = false,
  onGalleryClick,
  infoLines,
  badge,
  showContactIcons = false,
  onEmailClick,
  onMessageClick,
  onWhatsAppClick,
  onPhoneClick,
  progress,
  stats,
  specialization,
  profileInfo,
  documents,
  primaryButton,
  secondaryButton,
  variant = "mentor",
}: ProfileSidebarCardProps) {
  const getButtonClasses = (
    buttonVariant: "primary" | "secondary" | "outline" = "primary",
    disabled = false
  ) => {
    if (disabled) {
      return "w-full py-3 bg-gray-200 text-gray-500 cursor-not-allowed rounded-lg text-[14px] font-semibold transition-all shadow-md flex items-center justify-center gap-2";
    }

    switch (buttonVariant) {
      case "outline":
        return "w-full py-3 bg-white border-2 border-[#1F2A6E] text-[#1F2A6E] rounded-lg text-[14px] font-semibold hover:bg-gray-50 transition-all shadow-md flex items-center justify-center gap-2";
      case "secondary":
        return "w-full py-3 bg-gray-100 text-gray-700 rounded-lg text-[14px] font-semibold hover:bg-gray-200 transition-all shadow-md flex items-center justify-center gap-2";
      default:
        return "w-full py-3 bg-[#1F2A6E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#2E3B8E] transition-all shadow-md flex items-center justify-center gap-2";
    }
  };

  return (
    <div className="w-[300px] flex-shrink-0">
      <div className="bg-white rounded-xl p-6 shadow-lg">
        {/* Profile Image */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-[140px] h-[140px] rounded-full overflow-hidden bg-gray-100 mb-4 relative">
            <Image
              src={image}
              alt={name}
              className="w-full h-full object-cover"
            />
            {showEditIcon && (
              <button
                onClick={onEditImage}
                className="absolute bottom-2 right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition"
              >
                <i className="fa-solid fa-pencil text-xs"></i>
              </button>
            )}
            {showGalleryIcon && (
              <div className="absolute top-2 right-2 flex gap-1.5">
                <button
                  onClick={onGalleryClick}
                  className="w-7 h-7 bg-purple-100 rounded-md flex items-center justify-center text-purple-600 shadow-sm hover:bg-purple-200 transition"
                >
                  <i className="fa-regular fa-image text-xs"></i>
                </button>
                <button
                  onClick={onGalleryClick}
                  className="w-7 h-7 bg-blue-100 rounded-md flex items-center justify-center text-blue-600 shadow-sm hover:bg-blue-200 transition"
                >
                  <i className="fa-solid fa-camera text-xs"></i>
                </button>
              </div>
            )}
          </div>
          <h3 className="text-[18px] font-bold text-[#1A2E7A] text-center">
            {name}
          </h3>
          {role && <p className="text-[13px] text-gray-500 mb-1">{role}</p>}
          {subtitle && <p className="text-[12px] text-gray-400">{subtitle}</p>}
          {badge && (
            <div
              className={`mt-2 px-3 py-1 rounded-full text-[12px] font-semibold flex items-center gap-1.5 ${
                badge.color ||
                "bg-yellow-50 text-yellow-700 border border-yellow-200"
              }`}
            >
              {badge.icon && <i className={badge.icon}></i>}
              <span>{badge.text}</span>
            </div>
          )}
          {infoLines && infoLines.length > 0 && (
            <div className="mt-2 space-y-0.5 text-center w-full">
              {infoLines.map((line, index) => (
                <p
                  key={index}
                  className={`text-[12px] ${
                    line.color || "text-gray-600"
                  } font-medium`}
                >
                  {line.label && (
                    <span className="font-normal">{line.label} : </span>
                  )}
                  <span className="font-semibold">{line.value}</span>
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Contact Icons */}
        {showContactIcons && (
          <div className="flex items-center justify-center gap-4 text-[#2E3B8E] text-[18px] mb-6 pb-6 border-b border-gray-200">
            <button
              onClick={onEmailClick}
              className="hover:opacity-70 transition"
            >
              <i className="fa-regular fa-envelope"></i>
            </button>
            <button
              onClick={onMessageClick}
              className="hover:opacity-70 transition"
            >
              <i className="fa-regular fa-comment"></i>
            </button>
            <button
              onClick={onWhatsAppClick}
              className="hover:opacity-70 transition"
            >
              <i className="fa-brands fa-whatsapp"></i>
            </button>
            <button
              onClick={onPhoneClick}
              className="hover:opacity-70 transition"
            >
              <i className="fa-solid fa-phone"></i>
            </button>
          </div>
        )}

        {/* Progress Bar */}
        {progress && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[13px] text-gray-600 font-semibold">
                {progress.label || "Progress"}
              </span>
              <span className="text-[13px] text-gray-900 font-bold">
                {progress.value}%
              </span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${progress.value}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Stats */}
        {stats && stats.length > 0 && (
          <div className="mb-6 pb-6 border-b border-gray-200 space-y-4">
            {stats.map((stat, index) => (
              <div key={index}>
                <div className="flex justify-between items-center">
                  <span className="text-[13px] text-gray-600 font-semibold">
                    {stat.label}
                  </span>
                  <span
                    className={`text-[16px] font-bold ${
                      stat.color || "text-gray-900"
                    }`}
                  >
                    {stat.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Specialization */}
        {specialization && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h4 className="text-[13px] font-semibold text-gray-600 mb-3">
              Specialization
            </h4>
            <p className="text-[13px] text-gray-700 font-medium">
              {specialization}
            </p>
          </div>
        )}

        {/* Profile Information */}
        {profileInfo && (
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h4 className="text-[13px] font-semibold text-gray-600 mb-3">
              Profile Information
            </h4>
            <p className="text-[12px] text-gray-600 leading-relaxed">
              {profileInfo}
            </p>
          </div>
        )}

        {/* Documents */}
        {documents && (
          <div className="mb-6">
            <button
              onClick={documents.onClick}
              className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2">
                <i className="fa-regular fa-file-lines text-blue-600 text-sm"></i>
                <span className="text-[13px] font-semibold text-gray-700">
                  Documents
                </span>
              </div>
              <span className="text-[12px] bg-white text-gray-700 px-2 py-1 rounded-full font-semibold border border-gray-200">
                {documents.count}
              </span>
            </button>
          </div>
        )}

        {/* Primary Button */}
        {primaryButton && (
          <button
            onClick={primaryButton.onClick}
            disabled={primaryButton.disabled}
            className={getButtonClasses(
              primaryButton.variant,
              primaryButton.disabled
            )}
          >
            <i className={primaryButton.icon}></i>
            <span>{primaryButton.label}</span>
          </button>
        )}

        {/* Secondary Button */}
        {secondaryButton && (
          <button
            onClick={secondaryButton.onClick}
            disabled={secondaryButton.disabled}
            className={`${getButtonClasses(
              secondaryButton.variant,
              secondaryButton.disabled
            )} ${primaryButton ? "mt-3" : ""}`}
          >
            <i className={secondaryButton.icon}></i>
            <span>{secondaryButton.label}</span>
          </button>
        )}
      </div>
    </div>
  );
}
