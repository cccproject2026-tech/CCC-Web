"use client";
import Image from "next/image";
import { isRemoteImageSrc } from "@/app/utils/image";

export interface FeaturedAvatarItem {
  id: number | string;
  name: string;
  img: any;
}

interface FeaturedAvatarsProps {
  items: FeaturedAvatarItem[];
  sizePx?: number; // avatar diameter in pixels
  gapClass?: string; // tailwind gap class (e.g., gap-8, gap-6)
  nameClass?: string; // tailwind class for the name text
  className?: string; // extra classes for wrapper
  showDivider?: boolean;
  onItemClick?: (item: FeaturedAvatarItem) => void;
  /** When set, that item shows a selected ring (e.g. current mentee for assign / remove). */
  selectedId?: string | number | null;
}

export default function FeaturedAvatars({
  items,
  sizePx = 88,
  gapClass = "gap-8",
  nameClass = "text-white text-[13px] font-medium",
  className = "",
  showDivider = false,
  onItemClick,
  selectedId,
}: FeaturedAvatarsProps) {
  return (
    <div className={`mb-2 ${className}`}>
      <div className={`flex ${gapClass} overflow-x-auto pb-4 scrollbar-hide`}>
<<<<<<< HEAD
        {items.map((item) => (
          <div key={item.id} className="flex-shrink-0 text-center">
            {onItemClick ? (
              <button
                type="button"
                onClick={() => onItemClick(item)}
                className="group flex w-full flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8ec5eb]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#041f35] rounded-lg pb-1"
                aria-label={`Open profile for ${item.name}`}
              >
                <div
                  className="relative mb-2"
                  style={{ width: sizePx, height: sizePx }}
                >
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 p-[3px] transition group-hover:opacity-90">
                    <div className="relative h-full w-full overflow-hidden rounded-full">
                      <Image
                        src={item.img}
                        alt=""
                        className="object-cover"
                        fill
                        unoptimized={isRemoteImageSrc(item.img)}
                        sizes={`${sizePx}px`}
                      />
                    </div>
                  </div>
                </div>
                <span
                  className={`${nameClass} max-w-[min(140px,22vw)] truncate group-hover:underline group-hover:underline-offset-2`}
                >
                  {item.name}
                </span>
              </button>
            ) : (
              <>
                <div
                  className="relative mb-2"
                  style={{ width: sizePx, height: sizePx }}
                >
                  <div className="h-full w-full rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 p-[3px]">
                    <div className="relative h-full w-full overflow-hidden rounded-full">
                      <Image
                        src={item.img}
                        alt={item.name}
                        className="object-cover"
                        fill
                        unoptimized={isRemoteImageSrc(item.img)}
                        sizes={`${sizePx}px`}
                      />
                    </div>
                  </div>
                </div>
                <p className={nameClass}>{item.name}</p>
              </>
            )}
          </div>
        ))}
=======
        {items.map((item) => {
          const isSelected =
            selectedId != null && String(selectedId) === String(item.id);
          const ringClass = isSelected
            ? "shadow-[0_0_0_2px_#0a1f2e,0_0_0_4px_#8ec5eb] sm:shadow-[0_0_0_2px_#0a1f2e,0_0_0_4px_#8ec5eb]"
            : "";

          const avatar = (
            <div
              className="relative mb-2"
              style={{ width: sizePx, height: sizePx }}
            >
              <div
                className={`h-full w-full rounded-full p-[3px] bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500 ${ringClass}`}
              >
                <div className="relative h-full w-full overflow-hidden rounded-full">
                  <Image
                    src={item.img}
                    alt=""
                    className="object-cover"
                    fill
                    unoptimized={isRemoteImageSrc(item.img)}
                    sizes={`${sizePx}px`}
                  />
                </div>
              </div>
            </div>
          );

          if (onItemClick) {
            return (
              <div key={item.id} className="flex-shrink-0 text-center">
                <button
                  type="button"
                  onClick={() => onItemClick(item)}
                  className="flex cursor-pointer flex-col items-center rounded-xl px-1 py-0.5 text-center transition hover:opacity-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8ec5eb]/80"
                  aria-pressed={isSelected}
                  aria-label={`Select ${item.name}`}
                >
                  {avatar}
                  <p className={nameClass}>{item.name}</p>
                </button>
              </div>
            );
          }

          return (
            <div key={item.id} className="flex-shrink-0 text-center">
              {avatar}
              <p className={nameClass}>{item.name}</p>
            </div>
          );
        })}
>>>>>>> 1a4b107 (changes)
      </div>
      {showDivider && <div className="h-px bg-white/30 mt-2"></div>}
    </div>
  );
}
