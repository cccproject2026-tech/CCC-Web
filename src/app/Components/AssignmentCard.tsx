"use client";
import { useState } from "react";
import Image from "next/image";
import { isRemoteImageSrc } from "@/app/utils/image";
import {
  directorGlassCard,
  directorGlassCardHover,
} from "@/app/director/directorUi";

interface AssignmentCardProps {
  id: number | string;
  title: string;
  description: string;
  image: any;
  onView: () => void;
  onOptionsClick: (id: number | string) => void;
  /** Opens roadmap detail / edit flow (same destination as roadmap library Edit). */
  onEdit?: (id: number | string) => void;
  /** Single-card delete; parent should confirm and call API. */
  onDelete?: (id: number | string) => void;
  isSelected?: boolean;
  onSelect?: (id: number | string) => void;
  showCheckbox?: boolean;
  /** Matches director RoleShell pages (glass panels, light text). */
  variant?: "light" | "glass";
}

export default function AssignmentCard({
  id,
  title,
  description,
  image,
  onView,
  onOptionsClick,
  onEdit,
  onDelete,
  isSelected = false,
  onSelect,
  showCheckbox = false,
  variant = "light",
}: AssignmentCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const isGlass = variant === "glass";

  const shellClass = isGlass
    ? `rounded-xl overflow-hidden relative border border-white/15 ${directorGlassCard} ${directorGlassCardHover}`
    : "bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden relative";

  return (
    <div className={shellClass}>
      {/* Checkbox and Options Button in top-right corner */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        {/* Checkbox */}
        {showCheckbox && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect?.(id);
            }}
            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
              isGlass
                ? isSelected
                  ? "border-[#8ec5eb] bg-[#8ec5eb]/35"
                  : "border-white/35 bg-white/10"
                : isSelected
                  ? "border-[#2E3B8E] bg-[#2E3B8E]"
                  : "border-gray-300 bg-white"
            }`}
          >
            {isSelected && (
              <i
                className={`fa-solid fa-check text-[12px] ${isGlass ? "text-white" : "text-white"}`}
              ></i>
            )}
          </button>
        )}

        {/* Options Button */}
        {!showCheckbox && (
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={
              isGlass
                ? "flex h-9 w-9 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white/85 backdrop-blur-sm transition-colors hover:bg-white/15"
                : "w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/80 transition-colors bg-white/50 backdrop-blur-sm"
            }
            aria-label="More options"
          >
            <i
              className={`fa-solid fa-ellipsis-vertical ${isGlass ? "text-white/85" : "text-gray-600"}`}
            ></i>
          </button>
        )}
      </div>

      {/* Image */}
      <div className="h-40 relative overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          unoptimized={isRemoteImageSrc(image)}
        />
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col gap-3">
        <h3
          className={`text-[16px] font-bold leading-tight ${isGlass ? "text-white" : "text-gray-900"}`}
        >
          {title}
        </h3>
        <p
          className={`text-[14px] leading-relaxed ${isGlass ? "text-white/65" : "text-gray-600"}`}
        >
          {description}
        </p>

        {/* View Button */}
        <div className="flex items-center justify-end">
          <button
            onClick={onView}
            className={
              isGlass
                ? "rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-5 py-2 text-[14px] font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                : "px-5 py-2 bg-[#2E3B8E] text-white rounded-lg text-[14px] font-semibold hover:bg-[#1F2A6E] transition-all"
            }
          >
            View
          </button>
        </div>

        {/* Options Menu */}
        {showMenu && (
          <div
            className={`absolute top-3 right-3 z-50 min-w-[180px] animate-fade-in rounded-xl border py-2 shadow-2xl ${
              isGlass
                ? "border-white/15 bg-[#041f35]/98 backdrop-blur-md"
                : "border border-gray-100 bg-white"
            }`}
          >
            {/* <button
              onClick={() => {
                onOptionsClick(id);
                setShowMenu(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-all ${
                isGlass
                  ? "text-white/90 hover:bg-white/10"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <i
                className={`fa-solid fa-paperclip w-[18px] ${isGlass ? "text-[#8ec5eb]" : "text-blue-500"}`}
              ></i>
              <span>Assign to</span>
            </button> */}
            <button
              onClick={() => {
                setShowMenu(false);
                onEdit?.(id);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-all ${
                isGlass
                  ? "text-white/90 hover:bg-white/10"
                  : "text-gray-700 hover:bg-gray-50"
              }`}
            >
              <i
                className={`fa-solid fa-pencil w-[18px] ${isGlass ? "text-emerald-400" : "text-green-500"}`}
              ></i>
              <span>Edit</span>
            </button>
            <button
              onClick={() => {
                setShowMenu(false);
                onDelete?.(id);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-[14px] transition-all ${
                isGlass
                  ? "text-red-300 hover:bg-red-500/10"
                  : "text-red-600 hover:bg-red-50"
              }`}
            >
              <i className="fa-solid fa-trash w-[18px] text-red-500"></i>
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMenu(false)}
        ></div>
      )}
    </div>
  );
}
