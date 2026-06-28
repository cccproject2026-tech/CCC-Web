"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Image, { type StaticImageData } from "next/image";
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
  image: string | StaticImageData;
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
  showPhase?: boolean;
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
  /** When set, contact row opens mail / SMS / WhatsApp / call like MentorCard. */
  email?: string;
  phoneNumber?: string;
}

function formatProgressPercent(value: number): string {
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  const rounded = Math.round(v * 100) / 100;
  if (Number.isInteger(rounded)) return `${rounded}%`;
  return `${rounded.toFixed(1)}%`;
}

function mailtoHref(email: string) {
  const addr = email.trim().replace(/[\u200B-\u200D\uFEFF]/g, "");
  if (!addr.includes("@")) return "";
  return `mailto:${addr}`;
}

function telHref(phone: string) {
  return `tel:${phone.replace(/\s/g, "")}`;
}

function smsHref(phone: string) {
  return `sms:${phone.replace(/\s/g, "")}`;
}

function whatsappHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `https://wa.me/${digits}`;
}

function IconLink({
  href,
  ariaLabel,
  className,
  children,
  title,
}: {
  href?: string;
  ariaLabel: string;
  className: string;
  children: ReactNode;
  title?: string;
}) {
  if (href) {
    return (
      // <a
      //   href={href}
      //   target={href.startsWith("http") ? "_blank" : undefined}
      //   rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      //   className={className}
      //   aria-label={ariaLabel}
      //   title={title ?? ariaLabel}
      // >
      <a
  href={href}
  target={href.startsWith("http") ? "_blank" : undefined}
  rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
  className={className}
  aria-label={ariaLabel}
  title={title ?? ariaLabel}
  onClick={(e) => e.stopPropagation()}
>
        {children}
      </a>
    );
  }
  return (
    <span
      className={`${className} cursor-not-allowed opacity-40`}
      aria-label={ariaLabel}
      title={title ?? "Not available"}
    >
      {children}
    </span>
  );
}

function imageUnoptimized(
  image: string | StaticImageData
): boolean {
  if (typeof image !== "string") return false;
  return (
    isRemoteImageSrc(image) ||
    image.startsWith("blob:") ||
    image.startsWith("data:")
  );
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
  showPhase = true,
  optionsMenu,
  variant = "light",
  listLayout = false,
  email,
  phoneNumber,
}: PersonListCardProps) {
  const [showOptions, setShowOptions] = useState(false);
  const isGlass = variant === "glass";
  const optionsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!showOptions) return;

    const handleOutsidePointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;

      if (optionsRef.current && target && !optionsRef.current.contains(target)) {
        setShowOptions(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsidePointerDown, true);

    return () => {
      document.removeEventListener("pointerdown", handleOutsidePointerDown, true);
    };
  }, [showOptions]);

  const emailTrim = email?.trim().replace(/[\u200B-\u200D\uFEFF]/g, "") ?? "";
  const hasEmail = emailTrim.length > 0 && emailTrim.includes("@");
  const mailto = hasEmail ? mailtoHref(emailTrim) : "";
  const phoneTrim = phoneNumber?.trim() ?? "";
  const hasPhone = phoneTrim.length > 0;
  const wa = hasPhone ? whatsappHref(phoneTrim) : null;

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
    ? "flex flex-wrap items-center gap-0.5 text-[#8ec5eb] sm:gap-1"
    : "flex flex-wrap items-center gap-0.5 text-[#2E3B8E] sm:gap-1";

  const iconWrapperBase = isGlass
    ? "inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#8ec5eb] transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#8ec5eb]/60 sm:h-10 sm:w-10"
    : "inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#2E3B8E] transition hover:bg-[#2E3B8E]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2E3B8E]/50 sm:h-10 sm:w-10";
  const iconLg = isGlass ? "text-lg sm:text-xl" : "text-[22px] leading-none";
  const iconPhone = isGlass ? "text-base sm:text-lg" : "text-[20px] leading-none";

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
          unoptimized={imageUnoptimized(image)}
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

      {/* {optionsMenu && optionsMenu.length > 0 && (
        <div className="absolute right-3 top-3 sm:right-4 sm:top-4">
          <button
            type="button"
            onClick={() => setShowOptions(!showOptions)} */}
            {optionsMenu && optionsMenu.length > 0 && (
  <div
    ref={optionsRef}
    className="absolute right-3 top-3 z-30 sm:right-4 sm:top-4"
    onPointerDown={(e) => e.stopPropagation()}
    onMouseDown={(e) => e.stopPropagation()}
    onClick={(e) => e.stopPropagation()}
  >
    <button
      type="button"
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowOptions((prev) => !prev);
      }}
            className={
              isGlass
                ? "flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 text-white/80 transition hover:bg-white/10"
                : "flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 transition hover:bg-gray-100"
            }
          >
            <i className="fa-solid fa-ellipsis-vertical" />
          </button>
          {/* {showOptions && (
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
              > */}
              {showOptions && (
    <div
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
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
                    // onClick={() => {
                    //   item.onClick();
                    //   setShowOptions(false);
                    // }}
                    onClick={(e) => {
  e.preventDefault();
  e.stopPropagation();
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
              {menteeCount} {menteeCount === 1 ? "Mentee" : "Mentees"}
            </div>
          )}

          {progress && (
            <div className="mb-3 mt-1">
              {showPhase ? (
                <p
                  className={`mb-2 text-[12px] font-semibold leading-snug ${
                    isGlass ? "text-[#8ec5eb]" : "text-[#2E3B8E]"
                  }`}
                >
                  Phase: {progress.phase?.trim() ? progress.phase : "—"}
                </p>
              ) : null}
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

        {/* <div className={iconRowClass}>
          {mailto ? (
            <a
              href={mailto}
              className={iconWrapperBase}
              aria-label={`Send email to ${name} at ${emailTrim}`}
              title={`Open your email app to message ${emailTrim}`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                window.location.assign(mailto);
              }}
            >
              <i className={`fa-regular fa-envelope ${iconLg}`} />
            </a>
          ) : (
            <span
              className={`${iconWrapperBase} cursor-not-allowed opacity-40`}
              aria-label="Email not available for this person"
              title="No email on file"
            >
              <i className={`fa-regular fa-envelope ${iconLg}`} />
            </span>
          )}
          <IconLink
            href={hasPhone ? smsHref(phoneTrim) : hasEmail ? mailto : undefined}
            ariaLabel={
              hasPhone
                ? `Text ${name}`
                : hasEmail
                  ? `Message ${name} via email`
                  : "SMS not available"
            }
            className={iconWrapperBase}
          >
            <i className={`fa-regular fa-comment-dots ${iconLg}`} />
          </IconLink>
          <IconLink
            href={wa ?? undefined}
            ariaLabel={
              wa
                ? `WhatsApp ${name}`
                : "WhatsApp not available (add a phone number with country code)"
            }
            className={iconWrapperBase}
          >
            <i className={`fa-brands fa-whatsapp ${iconLg}`} />
          </IconLink>
          <IconLink
            href={hasPhone ? telHref(phoneTrim) : undefined}
            ariaLabel={hasPhone ? `Call ${name}` : "Phone number not available"}
            className={iconWrapperBase}
          >
            <i className={`fa-solid fa-phone ${iconPhone}`} />
          </IconLink>
        </div> */}
        {/* <div className={iconRowClass}>
  {mailto ? (
    <a
      href={mailto}
      className={iconWrapperBase}
      aria-label={`Send email to ${name}`}
      title={`Email ${emailTrim}`}
    >
      <i className={`fa-regular fa-envelope ${iconLg}`} />
    </a>
  ) : (
    <span className={`${iconWrapperBase} cursor-not-allowed opacity-40`}>
      <i className={`fa-regular fa-envelope ${iconLg}`} />
    </span>
  )}

  <span className={`${iconWrapperBase} cursor-not-allowed opacity-40`}>
    <i className={`fa-regular fa-comment-dots ${iconLg}`} />
  </span>

  <span className={`${iconWrapperBase} cursor-not-allowed opacity-40`}>
    <i className={`fa-brands fa-whatsapp ${iconLg}`} />
  </span>

  <span className={`${iconWrapperBase} cursor-not-allowed opacity-40`}>
    <i className={`fa-solid fa-phone ${iconPhone}`} />
  </span>
</div> */}
<div className={iconRowClass}>
  {mailto ? (
    <a
      href={mailto}
      className={iconWrapperBase}
      aria-label={`Send email to ${name}`}
      title={`Email ${emailTrim}`}
      onClick={(e) => e.stopPropagation()}
    >
      <i className={`fa-regular fa-envelope ${iconLg}`} />
    </a>
  ) : (
    <span
      className={`${iconWrapperBase} cursor-not-allowed opacity-40`}
      aria-label="Email not available"
      title="No email on file"
    >
      <i className={`fa-regular fa-envelope ${iconLg}`} />
    </span>
  )}

  <IconLink
    href={hasPhone ? smsHref(phoneTrim) : hasEmail ? mailto : undefined}
    ariaLabel={
      hasPhone
        ? `Text ${name}`
        : hasEmail
          ? `Message ${name} via email`
          : "SMS not available"
    }
    className={iconWrapperBase}
    title={hasPhone ? `Text ${name}` : hasEmail ? `Email ${name}` : "No phone number on file"}
  >
    <i className={`fa-regular fa-comment-dots ${iconLg}`} />
  </IconLink>

  <IconLink
    href={wa ?? undefined}
    ariaLabel={wa ? `WhatsApp ${name}` : "WhatsApp not available"}
    className={iconWrapperBase}
    title={wa ? `WhatsApp ${name}` : "No WhatsApp number on file"}
  >
    <i className={`fa-brands fa-whatsapp ${iconLg}`} />
  </IconLink>

  <IconLink
    href={hasPhone ? telHref(phoneTrim) : undefined}
    ariaLabel={hasPhone ? `Call ${name}` : "Phone number not available"}
    className={iconWrapperBase}
    title={hasPhone ? `Call ${name}` : "No phone number on file"}
  >
    <i className={`fa-solid fa-phone ${iconPhone}`} />
  </IconLink>
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
