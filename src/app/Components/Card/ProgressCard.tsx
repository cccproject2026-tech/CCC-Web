"use client";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";
import { isRemoteImageSrc } from "@/app/utils/image";
import { directorGlassCard, directorGlassCardHover } from "@/app/director/directorUi";

interface ProgressCardProps {
  image: StaticImageData | string;
  name: string;
  description?: string;
  progress: number; // 0-100
  /** `director` — dark glass card for RoleShell (matches mentees/mentors). */
  variant?: "default" | "director";
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
  variant = "default",
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
  const isDirector = variant === "director";

  const handleCardClick = () => {
    if (slug) {
      router.push(`/director/track-progress/${slug}`);
    }
  };

  const rootClass = isDirector
    ? `rounded-2xl border border-white/15 p-5 sm:p-6 cursor-pointer flex ${directorGlassCard} ${directorGlassCardHover}`
    : "bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer flex";

  const titleClass = isDirector
    ? "text-lg font-bold text-white mb-1"
    : "text-lg font-bold text-gray-900 mb-1";

  const descClass = isDirector
    ? "text-sm text-white/65 mb-4 leading-relaxed capitalize"
    : "text-sm text-gray-600 mb-4 leading-relaxed";

  const labelClass = isDirector
    ? "text-sm font-semibold text-white/90 block mb-2"
    : "text-sm font-semibold text-gray-900 block mb-2";

  const trackClass = isDirector ? "flex-1 bg-white/15 rounded-full h-2.5" : "flex-1 bg-gray-200 rounded-full h-2.5";

  const fillClass = isDirector
    ? "h-2.5 rounded-full bg-[#8ec5eb] transition-all"
    : "h-2.5 rounded-full bg-green-500 transition-all";

  const pctClass = isDirector
    ? "text-sm font-semibold text-white whitespace-nowrap"
    : "text-sm font-semibold text-gray-900 whitespace-nowrap";

  const iconBtn = isDirector
    ? "text-[#8ec5eb] hover:text-white transition"
    : "text-black hover:opacity-70 transition";

  const imgShell = isDirector
    ? "relative w-28 min-h-[120px] sm:w-32 sm:min-h-[128px] shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white/5"
    : "relative w-28 min-h-[120px] sm:w-32 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 h-full self-stretch";

  return (
    <div className={rootClass} onClick={handleCardClick}>
      <div className="flex min-h-0 flex-1 items-stretch gap-4">
        <div className={imgShell}>
          {typeof image === "string" ? (
            <img
              src={image}
              alt={name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 112px, 128px"
              unoptimized={isDirector && isRemoteImageSrc(image)}
            />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className={titleClass}>{name}</h3>

          <p className={descClass}>{description}</p>

          <div className="mb-4">
            <span className={labelClass}>Progress</span>
            <div className="flex items-center gap-3">
              <div className={trackClass}>
                <div className={fillClass} style={{ width: `${progress}%` }} />
              </div>
              <span className={pctClass}>{progress}%</span>
            </div>
          </div>

          <div className="mt-auto flex items-center justify-between">
            <div
              className="flex items-center gap-3"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={onEmailClick}
                className={iconBtn}
                aria-label="Send email"
              >
                <i className="fa-regular fa-envelope text-lg"></i>
              </button>
              <button
                type="button"
                onClick={onMessageClick}
                className={iconBtn}
                aria-label="Send message"
              >
                <i className="fa-regular fa-comment-dots text-lg"></i>
              </button>
              <button
                type="button"
                onClick={onWhatsAppClick}
                className={iconBtn}
                aria-label="WhatsApp"
              >
                <i className="fa-brands fa-whatsapp text-lg"></i>
              </button>
              <button
                type="button"
                onClick={onPhoneClick}
                className={iconBtn}
                aria-label="Call"
              >
                <i className="fa-solid fa-phone text-lg"></i>
              </button>
            </div>

            {isComplete && showCompleteButton && (
              <button
                type="button"
                onClick={onCompleteClick}
                className={
                  isDirector
                    ? "rounded-lg border border-[#8ec5eb]/40 bg-[#8ec5eb]/20 px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8ec5eb]/30"
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
