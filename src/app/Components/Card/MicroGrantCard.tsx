"use client";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";

interface MicroGrantCardProps {
  image: StaticImageData | string;
  name: string;
  role: string;
  date: string;
  slug?: string;
  onViewClick?: () => void;
  /** Defaults to `/director/micro-grant` for backward compatibility. */
  detailBasePath?: string;
  /** `navy` = mentor/director glass panel on dark background. */
  appearance?: "light" | "navy";
  /** @deprecated use `appearance="navy"` — still supported for existing pages */
  variant?: string;
}

export default function MicroGrantCard({
  image,
  name,
  role,
  date,
  slug,
  onViewClick,
  detailBasePath = "/director/micro-grant",
  appearance = "light",
  variant,
}: MicroGrantCardProps) {
  const router = useRouter();
  const isNavy = appearance === "navy" || variant === "directorGlass";

  const shell = isNavy
    ? "rounded-2xl border border-[#8ec5eb]/25 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] p-5 shadow-[0_8px_32px_rgba(2,20,40,0.45)] transition hover:border-[#8ec5eb]/35"
    : "rounded-2xl bg-white p-5 shadow-lg";

  const titleCls = isNavy ? "text-lg font-semibold text-white mb-1" : "text-lg font-semibold text-gray-900 mb-1";
  const roleCls = isNavy ? "text-sm text-[#cde2f2]" : "text-sm text-gray-500";
  const dateCls = isNavy ? "text-xs text-[#cde2f2]/80" : "text-xs text-gray-400";
  const iconCls = isNavy ? "text-[#8ec5eb] hover:text-white transition" : "text-black hover:opacity-70 transition";
  const btnCls = isNavy
    ? "rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#0f4a76] transition hover:bg-[#e7f1fa]"
    : "rounded-lg bg-[#1E366F] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#1a2f5a]";

  const handleViewClick = () => {
    if (onViewClick) {
      onViewClick();
    } else if (slug) {
      const safe = encodeURIComponent(slug);
      router.push(`${detailBasePath.replace(/\/$/, "")}/${safe}`);
    }
  };

  return (
    <div className={`flex h-auto min-h-[140px] w-full flex-col items-stretch justify-between gap-4 sm:h-[160px] sm:flex-row sm:items-center ${shell}`}>
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div
          className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl ${
            isNavy ? "border border-white/15 bg-white/5" : "bg-[#EFEBE0]"
          }`}
        >
          {typeof image === "string" ? (
            <img src={image} alt={name} className="h-full w-full object-cover" />
          ) : (
            <Image src={image} alt={name} fill className="object-cover" />
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between py-1">
          <div>
            <h3 className={titleCls}>{name}</h3>
            <p className={`truncate ${roleCls}`}>{role}</p>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <button type="button" className={iconCls} aria-label="Send email">
              <i className="fa-regular fa-envelope text-lg" />
            </button>
            <button type="button" className={iconCls} aria-label="Send message">
              <i className="fa-regular fa-comment-dots text-lg" />
            </button>
            <button type="button" className={iconCls} aria-label="Call">
              <i className="fa-solid fa-phone text-lg" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-shrink-0 flex-row items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-between sm:py-2">
        <p className={dateCls}>{date}</p>
        <button type="button" onClick={handleViewClick} disabled={!slug && !onViewClick} className={`${btnCls} disabled:cursor-not-allowed disabled:opacity-45`}>
          View
        </button>
      </div>
    </div>
  );
}
