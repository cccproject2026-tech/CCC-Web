"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { isRemoteImageSrc } from "@/app/utils/image";
import {
  directorGlassCard,
  directorGlassCardHover,
} from "@/app/director/directorUi";

interface PersonListCardProps {
  id: string;
  name: string;
  role?: string;
  description: string;
  image: string;
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
  progress?: {
    phase?: string;
    value: number;
  };
  optionsMenu?: {
    icon: string;
    label: string;
    color: string;
    onClick: () => void;
  }[];
  /** Dark glass shell for director routes (RoleShell). */
  variant?: "light" | "glass";
  /** Compact horizontal row (mentees list view). */
  listLayout?: boolean;
}

function formatProgressPercent(value: number): string {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  const rounded = Math.round(v * 100) / 100;
  if (Number.isInteger(rounded)) return `${rounded}%`;
  return `${rounded.toFixed(1)}%`;
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
  variant = "light",
  listLayout = false,
}: PersonListCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const isGlass = variant === "glass";

  const shellClass = isGlass
    ? listLayout
      ? `rounded-xl p-4 flex flex-row items-stretch gap-4 relative border border-white/15 ${directorGlassCard} ${directorGlassCardHover}`
      : `rounded-xl p-4 sm:p-5 flex flex-col gap-4 sm:flex-row sm:items-start relative border border-white/15 ${directorGlassCard} ${directorGlassCardHover} sm:gap-5`
    : listLayout
      ? "bg-white rounded-xl p-4 flex flex-row items-stretch gap-4 shadow-lg hover:shadow-xl transition-all relative"
      : "bg-white rounded-xl p-5 flex gap-5 items-start shadow-lg hover:shadow-xl transition-all relative";

  const imgWrapClass = isGlass
    ? listLayout
      ? "relative w-[88px] h-[88px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 cursor-pointer"
      : "relative w-full max-w-[120px] h-[120px] mx-auto sm:mx-0 overflow-hidden rounded-xl border border-white/10 bg-white/5 flex-shrink-0 cursor-pointer"
    : listLayout
      ? "relative w-[88px] h-[88px] shrink-0 overflow-hidden rounded-xl bg-gray-100 cursor-pointer"
      : "relative w-[120px] h-[120px] overflow-hidden rounded-xl bg-gray-100 flex-shrink-0 cursor-pointer";

  const titleClass = isGlass
    ? "font-semibold text-white text-[16px]"
    : "font-bold text-[#1A2E7A] text-[16px]";

  const descClass = isGlass
    ? "text-[13px] text-white/65 mb-3 leading-relaxed"
    : "text-[13px] text-gray-500 mb-3 leading-relaxed";

  const iconRowClass = isGlass
    ? "flex items-center gap-3 text-[#8ec5eb] text-[17px] sm:gap-4"
    : "flex items-center gap-4 text-[#2E3B8E] text-[17px]";

  return (
    <div
      className={`${shellClass}${
        showOptions ? " z-[60] overflow-visible" : ""
      }`}
    >
      <Link href={profileLink} className={imgWrapClass}>
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover"
          unoptimized={isRemoteImageSrc(image)}
        />
        {isNew && (
          <span
            className={`absolute left-2 top-2 rounded-md px-2.5 py-1 text-[11px] font-bold shadow-sm ${
              isGlass
                ? "bg-[#FFD700] text-[#0f4a76]"
                : "bg-yellow-400 text-gray-900"
            }`}
          >
            New
          </span>
        )}
      </Link>

      {optionsMenu && optionsMenu.length > 0 && (
        <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)}
            className={
              isGlass
                ? "flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white/80 transition hover:bg-white/10"
                : "flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100"
            }
          >
            <i className="fa-solid fa-ellipsis-vertical" />
          </button>
          {showOptions && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowOptions(false)}
              />
              <div
                className={`absolute right-0 top-full z-50 mt-2 min-w-[220px] rounded-xl py-2 pl-1 pr-1 shadow-2xl ${
                  isGlass
                    ? "border border-white/15 bg-[#041f35]/98 backdrop-blur-md"
                    : "bg-white"
                }`}
              >
                {optionsMenu.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => {
                      item.onClick();
                      setShowOptions(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-left text-[13px] transition-all ${
                      isGlass
                        ? "text-white/90 hover:bg-white/10"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <i className={`${item.icon} ${item.color} w-5 text-base`} />
                    <span
                      className={
                        isGlass ? "font-medium text-white/90" : "font-medium text-gray-700"
                      }
                    >
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      <div
        className={`flex min-w-0 flex-1 flex-col justify-between ${
          listLayout ? "min-h-0" : "min-h-[120px]"
        }`}
      >
        <div>
          <Link
            href={profileLink}
            className="mb-1 flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <h3 className={titleClass}>{name}</h3>
            <i
              className={`fa-solid fa-circle-check text-sm ${
                isGlass ? "text-[#8ec5eb]" : "text-[#5B9FD7]"
              }`}
            />
          </Link>
          {role ? (
            <p className={`mb-1 text-[12px] capitalize ${isGlass ? "text-white/50" : "text-gray-400"}`}>
              {role}
            </p>
          ) : null}
          {!listLayout ? <p className={descClass}>{description}</p> : null}

          {badge && (
            <span
              className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${badge.color}`}
            >
              {badge.text}
            </span>
          )}

          {menteeCount !== undefined && (
            <div
              className={`inline-block rounded-full px-3 py-1 text-[11px] font-semibold ${
                isGlass
                  ? "border border-[#8ec5eb]/35 bg-[#8ec5eb]/15 text-[#cde2f2]"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {menteeCount} Mentees
            </div>
          )}

          {progress && (
            <div className="mb-3 mt-1">
              <p
                className={`mb-2 text-[12px] font-semibold leading-snug ${
                  isGlass ? "text-[#8ec5eb]" : "text-[#2E3B8E]"
                }`}
              >
                Phase: {progress.phase?.trim() ? progress.phase : "—"}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div
                    className={`mb-1 text-[11px] ${isGlass ? "text-white/55" : "text-gray-500"}`}
                  >
                    Progress
                  </div>
                  <div
                    className={`h-2 w-full overflow-hidden rounded-full ${
                      isGlass ? "bg-white/15" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`h-full transition-all ${
                        isGlass ? "bg-[#8ec5eb]" : "bg-green-500"
                      }`}
                      style={{
                        width: `${Math.min(100, Math.max(0, Number(progress.value) || 0))}%`,
                      }}
                    />
                  </div>
                </div>
                <span
                  className={`min-w-[3.25rem] text-right text-[14px] font-bold tabular-nums ${
                    isGlass ? "text-white" : "text-gray-700"
                  }`}
                >
                  {formatProgressPercent(progress.value)}
                </span>
              </div>
            </div>
          )}

          {invitationInfo && (
            <div
              className={`mb-3 mt-2 space-y-1 text-[12px] ${
                isGlass ? "text-white/80" : "text-gray-700"
              }`}
            >
              <p>
                <span className="font-semibold">Invitation sent on :</span>{" "}
                <span className="font-bold">{invitationInfo.date}</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="font-semibold">Response :</span>
                <span
                  className={`rounded-md px-2 py-1 text-[11px] font-semibold text-white ${
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

        <div className={iconRowClass}>
          <button type="button" className="transition hover:opacity-80" aria-label="Email">
            <i className="fa-regular fa-envelope" />
          </button>
          <button type="button" className="transition hover:opacity-80" aria-label="Message">
            <i className="fa-regular fa-comment" />
          </button>
          <button type="button" className="transition hover:opacity-80" aria-label="WhatsApp">
            <i className="fa-brands fa-whatsapp" />
          </button>
          <button type="button" className="transition hover:opacity-80" aria-label="Call">
            <i className="fa-solid fa-phone" />
          </button>
        </div>
      </div>

      {actionButton && (
        <div className="flex shrink-0 self-start sm:self-end">
          <button
            type="button"
            onClick={actionButton.onClick}
            className={
              isGlass
                ? "whitespace-nowrap rounded-lg border border-[#8ec5eb]/45 bg-[#8ec5eb]/15 px-4 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#8ec5eb]/25"
                : "whitespace-nowrap rounded-lg bg-[#1F2A6E] px-4 py-2.5 text-[13px] font-semibold text-white shadow-md transition hover:bg-[#2E3B8E]"
            }
          >
            {actionButton.text}
          </button>
        </div>
      )}
    </div>
  );
}
