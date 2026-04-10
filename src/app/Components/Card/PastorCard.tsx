"use client";
import Image, { StaticImageData } from "next/image";
import { pastorCardLight } from "@/app/Components/pastor/pastor-theme";
import { mentorGlassCardFrost } from "@/app/Components/mentor/mentor-theme";
import { isRemoteImageSrc } from "@/app/utils/image";

interface PastorCardProps {
  image: string | StaticImageData;
  name: string;
  description: string;
  phase: string;
  progress: number;
  onViewDetails?: () => void;
  /** Dark glass style for director shell (#8ec5eb accents). */
  variant?: "light" | "glass";
}

const getProgressColor = (progress: number, glass: boolean) => {
  if (glass) {
    if (progress >= 70) return "bg-emerald-400/90";
    if (progress >= 50) return "bg-amber-400/90";
    return "bg-rose-400/90";
  }
  if (progress >= 100) return "bg-green-500";
  if (progress >= 70) return "bg-green-500";
  if (progress >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

export default function PastorCard({
  image,
  name,
  description,
  phase,
  progress,
  onViewDetails,
  variant = "light",
}: PastorCardProps) {
  const isGlass = variant === "glass";

  if (isGlass) {
    return (
      <div
        className={`${mentorGlassCardFrost} flex min-h-[200px] overflow-hidden transition-all hover:border-[#8ec5eb]/25`}
      >
        <div className="relative min-h-[200px] w-[42%] shrink-0">
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover"
            unoptimized={typeof image === "string" && isRemoteImageSrc(image)}
            sizes="(max-width: 768px) 42vw, 200px"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/25 to-transparent" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-between p-5 sm:p-6">
          <div>
            <h3 className="mb-2 text-[17px] font-bold leading-snug text-white">{name}</h3>
            <p className="mb-3 text-[13px] leading-relaxed text-white/70">{description}</p>
            <div className="mb-4">
              <span className="inline-block rounded-lg border border-[#8ec5eb]/35 bg-[#8ec5eb]/10 px-3 py-1.5 text-[12px] font-semibold text-[#cde2f2]">
                Phase: {phase}
              </span>
            </div>
            <div className="mb-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[14px] font-semibold text-white/85">Tasks completed</span>
                <span className="text-[14px] font-bold text-[#8ec5eb]">{progress}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-white/15">
                <div
                  className={`h-2 rounded-full ${getProgressColor(progress, true)}`}
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <div className="flex gap-3 text-[#8ec5eb]">
              <button type="button" className="transition hover:opacity-80" aria-label="Send email">
                <i className="fa-regular fa-envelope text-lg" />
              </button>
              <button type="button" className="transition hover:opacity-80" aria-label="Send message">
                <i className="fa-regular fa-comment-dots text-lg" />
              </button>
              <button type="button" className="transition hover:opacity-80" aria-label="WhatsApp">
                <i className="fa-brands fa-whatsapp text-lg" />
              </button>
              <button type="button" className="transition hover:opacity-80" aria-label="Call">
                <i className="fa-solid fa-phone text-base" />
              </button>
            </div>
            <button
              type="button"
              onClick={onViewDetails}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#8ec5eb]/45 bg-[#8ec5eb]/10 text-[#8ec5eb] transition hover:bg-[#8ec5eb]/20"
              aria-label="View details"
            >
              <i className="fa-solid fa-arrow-up-right-from-square text-sm" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`${pastorCardLight} flex min-h-[200px] hover:shadow-xl`}>
      <div className="relative min-h-[200px] w-[42%] shrink-0">
        <Image
          src={image}
          alt={name}
          fill
          className="rounded-l-2xl object-cover"
          unoptimized={typeof image === "string" && isRemoteImageSrc(image)}
        />
      </div>

      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <h3 className="mb-2 text-[17px] font-bold text-gray-900">{name}</h3>
          <p className="mb-3 text-[13px] leading-relaxed text-gray-600">{description}</p>
          <div className="mb-4">
            <span className="inline-block rounded-lg bg-blue-100 px-3 py-1.5 text-[12px] font-semibold text-[#2E3B8E]">
              Phase : {phase}
            </span>
          </div>
          <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[14px] font-semibold text-gray-700">Tasks Completed</span>
              <span className="text-[14px] font-bold text-gray-900">{progress}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-gray-200">
              <div
                className={`h-2 rounded-full ${getProgressColor(progress, false)}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <div className="flex gap-4">
            <button className="transition hover:opacity-70" aria-label="Send email">
              <i className="fa-regular fa-envelope text-lg text-gray-600" />
            </button>
            <button className="transition hover:opacity-70" aria-label="Send message">
              <i className="fa-regular fa-comment-dots text-lg text-gray-600" />
            </button>
            <button className="transition hover:opacity-70" aria-label="WhatsApp">
              <i className="fa-brands fa-whatsapp text-lg text-gray-600" />
            </button>
            <button className="transition hover:opacity-70" aria-label="Call">
              <i className="fa-solid fa-phone text-lg text-gray-600" />
            </button>
          </div>
          <button
            onClick={onViewDetails}
            className="flex h-10 w-10 items-center justify-center rounded-lg border-2 border-gray-200 text-gray-600 transition hover:border-[#2E3B8E] hover:bg-[#2E3B8E] hover:text-white"
            aria-label="View details"
          >
            <i className="fa-solid fa-arrow-up-right-from-square text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
