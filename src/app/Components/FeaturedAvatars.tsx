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
}

export default function FeaturedAvatars({
  items,
  sizePx = 88,
  gapClass = "gap-8",
  nameClass = "text-white text-[13px] font-medium",
  className = "",
  showDivider = false,
  onItemClick,
}: FeaturedAvatarsProps) {
  return (
    <div className={`mb-2 ${className}`}>
      <div className={`flex ${gapClass} overflow-x-auto pb-4 scrollbar-hide`}>
        {items.map((item) => (
          <div key={item.id} className="flex-shrink-0 text-center">
            <div
              className="relative mb-2"
              style={{ width: sizePx, height: sizePx }}
            >
              <div className="w-full h-full rounded-full p-[3px] bg-gradient-to-br from-purple-400 via-pink-400 to-purple-500">
                <button
                  type="button"
                  onClick={() => onItemClick && onItemClick(item)}
                  className="w-full h-full rounded-full overflow-hidden focus:outline-none"
                  style={{ cursor: onItemClick ? "pointer" : "default" }}
                >
                  <Image
                    src={item.img}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-full"
                    fill
                    unoptimized={isRemoteImageSrc(item.img)}
                    sizes={`${sizePx}px`}
                  />
                </button>
              </div>
            </div>
            <p className={nameClass}>{item.name}</p>
          </div>
        ))}
      </div>
      {showDivider && <div className="h-px bg-white/30 mt-2"></div>}
    </div>
  );
}
