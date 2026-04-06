import Image from "next/image";
import type { StaticImageData } from "next/image";

const glassShell =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.04)_100%)] backdrop-blur-xl shadow-[0_8px_40px_rgba(3,24,43,0.4)] transition-all duration-300 hover:border-white/25 hover:shadow-[0_12px_48px_rgba(3,24,43,0.45)]";

type MentorCardProps = {
  image: string | StaticImageData;
  name: string;
  role?: string;
  menteeCount?: number;
  onViewDetails?: () => void;
  /** Dark glass style for director / mentor shells (compact, #8ec5eb accents). */
  variant?: "light" | "glass";
};

export default function MentorCard({
  image,
  name,
  role,
  menteeCount,
  onViewDetails,
  variant = "light",
}: MentorCardProps) {
  const isGlass = variant === "glass";

  return (
    <div
      className={
        isGlass
          ? `${glassShell} flex h-full flex-col p-4 sm:p-5`
          : "rounded-2xl bg-white p-6 shadow-md transition-all duration-300 hover:shadow-xl"
      }
    >
      <div
        className={
          isGlass
            ? "relative mb-4 aspect-[3/4] w-full max-h-[240px] min-h-[180px] overflow-hidden rounded-xl border border-white/10 sm:max-h-[260px]"
            : "relative mb-6 h-[340px] w-full overflow-hidden rounded-xl"
        }
      >
        <Image
          src={image}
          alt={name}
          className={isGlass ? "object-cover" : "h-[340px] rounded-xl object-cover"}
          fill
          sizes={isGlass ? "(max-width: 640px) 100vw, (max-width: 1280px) 33vw, 25vw" : "(max-width: 768px) 100vw, 400px"}
        />
        {isGlass ? (
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#062946]/50 to-transparent" />
        ) : null}
      </div>

      <div className={`flex flex-1 flex-col ${isGlass ? "min-h-0" : ""}`}>
        <div className={`mb-3 flex items-start justify-between gap-3 ${isGlass ? "" : ""}`}>
          <div className="min-w-0 flex-1">
            <h4
              className={
                isGlass
                  ? "mb-1 line-clamp-2 text-base font-semibold leading-snug text-white sm:text-lg"
                  : "mb-2 text-[32px] font-semibold leading-none text-gray-900"
              }
            >
              {name}
            </h4>
            <p
              className={
                isGlass
                  ? "line-clamp-2 text-xs capitalize text-white/65 sm:text-sm"
                  : "text-[20px] text-gray-500"
              }
            >
              {role}
            </p>
          </div>

          <div
            className={
              isGlass
                ? "shrink-0 rounded-full border border-[#8ec5eb]/35 bg-[#8ec5eb]/15 px-2.5 py-1 text-[11px] font-semibold text-[#cde2f2] sm:px-3 sm:text-xs"
                : "whitespace-nowrap rounded-full bg-[#E8DAAE] px-4 py-2 text-[14px] font-semibold text-[#6B5D3F]"
            }
          >
            {menteeCount} Mentees
          </div>
        </div>

        <div
          className={`mt-auto flex items-center justify-between gap-2 pt-2 ${isGlass ? "border-t border-white/10" : "mt-8"}`}
        >
          <div
            className={`flex flex-wrap gap-1 sm:gap-2 ${isGlass ? "text-[#8ec5eb]" : "text-[#2E3B8E]"}`}
          >
            <button type="button" className="hover:opacity-80 transition" aria-label="Send email">
              <i className={`fa-regular fa-envelope ${isGlass ? "text-xl sm:text-2xl" : "text-[28px]"}`} />
            </button>
            <button type="button" className="hover:opacity-80 transition" aria-label="Send message">
              <i className={`fa-regular fa-comment-dots ${isGlass ? "text-xl sm:text-2xl" : "text-[28px]"}`} />
            </button>
            <button type="button" className="hover:opacity-80 transition" aria-label="WhatsApp">
              <i className={`fa-brands fa-whatsapp ${isGlass ? "text-xl sm:text-2xl" : "text-[28px]"}`} />
            </button>
            <button type="button" className="hover:opacity-80 transition" aria-label="Call">
              <i className={`fa-solid fa-phone ${isGlass ? "text-lg sm:text-xl" : "text-[24px]"}`} />
            </button>
          </div>

          <button
            type="button"
            onClick={onViewDetails}
            className={
              isGlass
                ? "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#8ec5eb]/45 bg-[#8ec5eb]/10 text-[#8ec5eb] transition hover:bg-[#8ec5eb]/20"
                : "flex h-12 w-12 items-center justify-center rounded-xl border-2 border-[#2E3B8E] text-[#2E3B8E] transition hover:bg-[#2E3B8E] hover:text-white"
            }
            aria-label="View details"
          >
            <i className={`fa-solid fa-arrow-up-right-from-square ${isGlass ? "text-sm" : "text-[18px]"}`} />
          </button>
        </div>
      </div>
    </div>
  );
}
