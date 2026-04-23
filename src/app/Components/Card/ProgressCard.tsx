"use client";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import {
  directorGlassCard,
  directorGlassCardHover,
} from "@/app/director/directorUi";
import { isRemoteImageSrc } from "@/app/utils/image";

interface ProgressCardProps {
  image: StaticImageData | string;
  name: string;
  description?: string;
  progress: number; // 0-100
  /** `directorGlass` — dark glass card for RoleShell (matches mentees/mentors). Default `light` for white cards. */
  variant?: "light" | "directorGlass";
  showCompleteButton?: boolean; // Show "Mark as Complete" button when progress is 100%
  slug?: string; // Slug for navigation
  onCompleteClick?: (e: React.MouseEvent) => void;
  onEmailClick?: (e: React.MouseEvent) => void;
  onMessageClick?: (e: React.MouseEvent) => void;
  onWhatsAppClick?: (e: React.MouseEvent) => void;
  onPhoneClick?: (e: React.MouseEvent) => void;
}

export default function ProgressCard({
  image,
  name,
  description = "Sub text area write something here. That you can read more about him",
  progress,
  variant = "light",
  showCompleteButton = false,
  slug,
  onCompleteClick,
  onEmailClick,
  onMessageClick,
  onWhatsAppClick,
  onPhoneClick,
}: ProgressCardProps) {
  const router = useRouter();
  const isComplete = progress === 100;
  const isGlass = variant === "directorGlass";

  const handleCardClick = () => {
    if (slug) {
      router.push(`/director/track-progress/${slug}`);
    }
  };

  const shell = isGlass
    ? `rounded-2xl border border-white/15 p-5 sm:p-6 cursor-pointer flex ${directorGlassCard} ${directorGlassCardHover}`
    : "bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer flex";

  return (
    <div className={shell} onClick={handleCardClick}>
      <div className="flex flex-1 items-stretch gap-4 sm:gap-5">
        <div
          className={
            isGlass
              ? "relative h-[min(8rem,22vw)] w-24 min-h-[5.5rem] flex-shrink-0 self-stretch overflow-hidden rounded-xl border border-white/10 bg-white/5 sm:h-32 sm:w-28"
              : "relative h-full min-h-[6rem] w-24 flex-shrink-0 self-stretch overflow-hidden rounded-lg bg-gray-200 sm:w-28"
          }
        >
          {typeof image === "string" ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              sizes="112px"
              unoptimized={isRemoteImageSrc(image) || image.startsWith("blob:")}
            />
          ) : (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              sizes="112px"
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <h3
            className={
              isGlass
                ? "mb-0.5 line-clamp-2 text-base font-bold text-white sm:text-[17px]"
                : "text-lg font-bold text-gray-900 mb-1"
            }
          >
            {name}
          </h3>

          <p
            className={
              isGlass
                ? "mb-3 line-clamp-2 text-[13px] capitalize leading-relaxed text-white/65 sm:mb-4"
                : "text-sm text-gray-600 mb-4 leading-relaxed"
            }
          >
            {description}
          </p>

          <div className="mb-3 sm:mb-4">
            <span
              className={
                isGlass
                  ? "mb-1.5 block text-[12px] font-semibold text-[#8ec5eb] sm:text-sm"
                  : "text-sm font-semibold text-gray-900 block mb-2"
              }
            >
              Progress
            </span>
            <div className="flex items-center gap-3">
              <div
                className={
                  isGlass
                    ? "h-2.5 flex-1 rounded-full bg-white/15"
                    : "flex-1 bg-gray-200 rounded-full h-2.5"
                }
              >
                <div
                  className={
                    isGlass
                      ? "h-2.5 rounded-full bg-[#8ec5eb] shadow-[0_0_12px_rgba(142,197,235,0.45)] transition-all"
                      : "h-2.5 rounded-full bg-green-500 transition-all"
                  }
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span
                className={
                  isGlass
                    ? "whitespace-nowrap text-sm font-bold tabular-nums text-white"
                    : "text-sm font-semibold text-gray-900 whitespace-nowrap"
                }
              >
                {progress}%
              </span>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between gap-2">
            <div
              className={`flex items-center gap-2 sm:gap-3 ${isGlass ? "text-[#8ec5eb]" : "text-black"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onEmailClick}
                className="transition hover:opacity-80"
                aria-label="Send email"
              >
                <i className="fa-regular fa-envelope text-base sm:text-lg" />
              </button>
              <button
                type="button"
                onClick={onMessageClick}
                className="transition hover:opacity-80"
                aria-label="Send message"
              >
                <i className="fa-regular fa-comment-dots text-base sm:text-lg" />
              </button>
              <button
                type="button"
                onClick={onWhatsAppClick}
                className="transition hover:opacity-80"
                aria-label="WhatsApp"
              >
                <i className="fa-brands fa-whatsapp text-base sm:text-lg" />
              </button>
              <button
                type="button"
                onClick={onPhoneClick}
                className="transition hover:opacity-80"
                aria-label="Call"
              >
                <i className="fa-solid fa-phone text-base sm:text-lg" />
              </button>
            </div>

            {isComplete && showCompleteButton && (
              <button
                type="button"
                onClick={onCompleteClick}
                className={
                  isGlass
                    ? "shrink-0 rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/15 px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#8ec5eb]/25 sm:px-5 sm:text-sm"
                    : "bg-[#1E366F] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#1a2f5a] transition-colors"
                }
              >
                Mark as Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
