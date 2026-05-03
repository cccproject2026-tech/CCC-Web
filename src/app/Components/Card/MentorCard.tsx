import type { ReactNode } from "react";
import Image from "next/image";
import type { StaticImageData } from "next/image";
import { mentorGlassCardFrost } from "@/app/Components/mentor/mentor-theme";
import { isRemoteImageSrc } from "@/app/utils/image";

type MentorCardProps = {
  image: string | StaticImageData;
  name: string;
  role?: string;
  menteeCount?: number;
  /** When set, badge uses "Mentee" / "Mentees" (mentors) or your copy (e.g. pastors). */
  menteeLabelSingular?: string;
  menteeLabelPlural?: string;
  email?: string;
  phoneNumber?: string;
  onViewDetails?: () => void;
  /** Dark glass style for director / mentor shells (compact, #8ec5eb accents). */
  variant?: "light" | "glass";
};

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

/** WhatsApp click-to-chat; requires country code in practice — digits only, no + */
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
      <a
        href={href}
        target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        className={className}
        aria-label={ariaLabel}
        title={title ?? ariaLabel}
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

export default function MentorCard({
  image,
  name,
  role,
  menteeCount,
  menteeLabelSingular = "Mentee",
  menteeLabelPlural = "Mentees",
  email,
  phoneNumber,
  onViewDetails,
  variant = "light",
}: MentorCardProps) {
  const isGlass = variant === "glass";
  const emailTrim = email?.trim().replace(/[\u200B-\u200D\uFEFF]/g, "") ?? "";
  const hasEmail = emailTrim.length > 0 && emailTrim.includes("@");
  const mailto = hasEmail ? mailtoHref(emailTrim) : "";
  const phoneTrim = phoneNumber?.trim() ?? "";
  const hasPhone = phoneTrim.length > 0;
  const wa = hasPhone ? whatsappHref(phoneTrim) : null;

  const countLabel =
    menteeCount === undefined
      ? null
      : `${menteeCount} ${menteeCount === 1 ? menteeLabelSingular : menteeLabelPlural}`;

  const iconWrapperBase = isGlass
    ? "inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#8ec5eb] transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#8ec5eb]/60 sm:h-11 sm:w-11"
    : "inline-flex h-11 w-11 items-center justify-center rounded-lg text-[#2E3B8E] transition hover:bg-[#2E3B8E]/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#2E3B8E]/50";

  const iconLg = isGlass ? "text-xl sm:text-2xl" : "text-[28px] leading-none";
  const iconPhone = isGlass ? "text-lg sm:text-xl" : "text-[24px] leading-none";

  return (
    <div
      className={
        isGlass
          ? `${mentorGlassCardFrost} flex h-full flex-col p-4 sm:p-5`
          : "rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-xl"
      }
    >
      <div
        className={
          isGlass
            ? "relative mb-4 aspect-[4/5] w-full max-h-[220px] min-h-[200px] overflow-hidden rounded-xl border border-white/10 sm:max-h-[240px]"
            : "relative mb-6 h-[340px] w-full overflow-hidden rounded-xl"
        }
      >
        <Image
          src={image}
          alt={name}
          className={isGlass ? "object-cover" : "h-[340px] rounded-xl object-cover"}
          fill
          unoptimized={isRemoteImageSrc(image)}
          sizes={isGlass ? "(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw" : "(max-width: 768px) 100vw, 400px"}
        />
        {isGlass ? (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#062946]/55 via-[#062946]/10 to-transparent" />
        ) : null}
      </div>

      <div className={`flex flex-1 flex-col ${isGlass ? "min-h-0" : ""}`}>
        <div className={`mb-3 space-y-1.5 ${isGlass ? "" : ""}`}>
          <div className="flex items-start justify-between gap-3">
            <h4
              className={
                isGlass
                  ? "line-clamp-2 min-w-0 flex-1 text-left text-base font-semibold leading-snug text-white sm:text-lg"
                  : "line-clamp-2 min-w-0 text-[32px] font-semibold leading-tight text-gray-900"
              }
            >
              {name}
            </h4>
            {countLabel != null ? (
              <div
                className={
                  isGlass
                    ? "shrink-0 whitespace-nowrap rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/15 px-2.5 py-1.5 text-[11px] font-semibold leading-tight text-[#cde2f2] sm:px-3 sm:text-xs"
                    : "shrink-0 whitespace-nowrap rounded-full bg-[#E8DAAE] px-4 py-2 text-[14px] font-semibold text-[#6B5D3F]"
                }
                title="Assigned mentees"
              >
                {countLabel}
              </div>
            ) : null}
          </div>
          {role ? (
            <p
              className={
                isGlass
                  ? "text-xs capitalize text-white/65 sm:text-sm"
                  : "text-[20px] text-gray-500"
              }
            >
              {role}
            </p>
          ) : null}
        </div>

        <div
          className={`mt-auto flex items-center justify-between gap-2 pt-3 ${isGlass ? "border-t border-white/10" : "mt-8"}`}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-0.5 sm:gap-1">
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
              ariaLabel={wa ? `WhatsApp ${name}` : "WhatsApp not available (add a phone number with country code)"}
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
          </div>

          <button
            type="button"
            onClick={onViewDetails}
            className={
              isGlass
                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#8ec5eb]/45 bg-[#8ec5eb]/10 text-[#8ec5eb] transition hover:bg-[#8ec5eb]/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#8ec5eb]/60"
                : "flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#2E3B8E] text-[#2E3B8E] transition hover:bg-[#2E3B8E] hover:text-white"
            }
            aria-label="View profile"
          >
            <i className={`fa-solid fa-arrow-up-right-from-square ${isGlass ? "text-sm" : "text-[18px]"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
