"use client";
import { useState } from "react";
import Image, { StaticImageData } from "next/image";
import Link from "next/link";

interface PersonListCardProps {
  id: number;
  name: string;
  role?: string;
  description: string;
  image: StaticImageData;
  isNew?: boolean;
  badge?: {
    text: string;
    color: string;
  };
  actionButton?: {
    text: string;
    onClick: () => void;
  };
  profileLink: string;
  invitationInfo?: {
    date: string;
    response: "Accepted" | "Waiting" | "Not Interested";
  };
  menteeCount?: number;
  // Progress info for mentees
  progress?: {
    phase: string;
    value: number;
  };
  // Options menu items
  optionsMenu?: {
    icon: string;
    label: string;
    color: string;
    onClick: () => void;
  }[];
}

export default function PersonListCard({
  id,
  name,
  role,
  description,
  image,
  isNew,
  badge,
  actionButton,
  profileLink,
  invitationInfo,
  menteeCount,
  progress,
  optionsMenu,
}: PersonListCardProps) {
  const [showOptions, setShowOptions] = useState(false);

  return (
    <div className="bg-white rounded-xl p-5 flex gap-5 items-start shadow-lg hover:shadow-xl transition-all relative">
      {/* Image with relative positioning for "New" badge - Clickable */}
      <Link
        href={profileLink}
        className="relative w-[120px] h-[120px] overflow-hidden rounded-xl bg-gray-100 flex-shrink-0 cursor-pointer"
      >
        <Image src={image} alt={name} className="w-full h-full object-cover" />
        {isNew && (
          <span className="absolute top-2 left-2 px-2.5 py-1 bg-yellow-400 text-gray-900 rounded-md text-[11px] font-bold shadow-sm">
            New
          </span>
        )}
      </Link>

      {/* Three-dot menu */}
      {optionsMenu && optionsMenu.length > 0 && (
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-all text-gray-600"
          >
            <i className="fa-solid fa-ellipsis-vertical"></i>
          </button>
          {showOptions && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowOptions(false)}
              ></div>
              <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-2xl py-2 px-1 min-w-[220px] z-50">
                {optionsMenu.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      item.onClick();
                      setShowOptions(false);
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-lg text-[13px] transition-all flex items-center gap-3 hover:bg-gray-50"
                  >
                    <i
                      className={`${item.icon} ${item.color} text-base w-5`}
                    ></i>
                    <span className="text-gray-700 font-medium">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between min-h-[120px]">
        <div>
          <Link
            href={profileLink}
            className="flex items-center gap-2 mb-1 hover:opacity-80 transition-opacity"
          >
            <h3 className="font-bold text-[#1A2E7A] text-[16px]">{name}</h3>
            <i className="fa-solid fa-circle-check text-[#5B9FD7] text-sm"></i>
          </Link>
          <p className="text-[13px] text-gray-500 mb-3 leading-relaxed">
            {description}
          </p>

          {badge && (
            <span
              className={`inline-block px-3 py-1 rounded-full text-[11px] font-semibold ${badge.color}`}
            >
              {badge.text}
            </span>
          )}

          {menteeCount !== undefined && (
            <div className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-[11px] font-semibold">
              {menteeCount} Mentees
            </div>
          )}

          {progress && (
            <div className="mb-3">
              <p className="text-[12px] font-semibold text-[#2E3B8E] mb-2">
                Phase : {progress.phase}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="text-[11px] text-gray-500 mb-1">Progress</div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{ width: `${progress.value}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-[14px] font-bold text-gray-700">
                  {progress.value}%
                </span>
              </div>
            </div>
          )}

          {invitationInfo && (
            <div className="text-[12px] text-gray-700 space-y-1 mb-3 mt-2">
              <p>
                <span className="font-semibold">Invitation sent on :</span>{" "}
                <span className="font-bold">{invitationInfo.date}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold">Response :</span>
                <span
                  className={`px-2 py-1 rounded-md text-white text-[11px] font-semibold ${
                    invitationInfo.response === "Accepted"
                      ? "bg-green-500"
                      : invitationInfo.response === "Waiting"
                      ? "bg-gray-400"
                      : "bg-red-500"
                  }`}
                >
                  {invitationInfo.response}
                </span>
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-4 text-[#2E3B8E] text-[17px]">
          <button className="hover:opacity-70 transition" aria-label="Email">
            <i className="fa-regular fa-envelope"></i>
          </button>
          <button className="hover:opacity-70 transition" aria-label="Message">
            <i className="fa-regular fa-comment"></i>
          </button>
          <button className="hover:opacity-70 transition" aria-label="WhatsApp">
            <i className="fa-brands fa-whatsapp"></i>
          </button>
          <button className="hover:opacity-70 transition" aria-label="Call">
            <i className="fa-solid fa-phone"></i>
          </button>
        </div>
      </div>

      {/* Action Button */}
      {actionButton && (
        <div className="self-end flex-shrink-0">
          <button
            onClick={actionButton.onClick}
            className="px-4 py-2.5 bg-[#1F2A6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#2E3B8E] transition-all shadow-md whitespace-nowrap"
          >
            {actionButton.text}
          </button>
        </div>
      )}
    </div>
  );
}
