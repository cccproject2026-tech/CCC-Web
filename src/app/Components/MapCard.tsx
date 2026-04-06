"use client";
import Image from "next/image";
import { directorGlassCard } from "@/app/director/directorUi";

export interface MapMarker {
  id: number | string;
  name: string;
  img: any;
  top: string;
  left: string;
}

interface MapCardProps {
  title?: string;
  iframeSrc?: string;
  imageSrc?: string;
  height?: string;
  markers?: MapMarker[];
}

export default function MapCard({
  title = "In-progress",
  iframeSrc,
  imageSrc,
  height = "h-[520px] md:h-[620px]",
  markers = [],
}: MapCardProps) {
  return (
    <div
      className={`rounded-2xl border border-white/15 p-3 sm:p-4 ${directorGlassCard}`}
    >
      {title ? (
        <div className="px-1 pb-3 text-[14px] font-semibold text-white sm:text-[15px]">
          {title}
        </div>
      ) : null}
      <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#062946]/40">
        {iframeSrc ? (
          <iframe
            title="map"
            className={`w-full ${height}`}
            src={iframeSrc}
            loading="lazy"
          />
        ) : imageSrc ? (
          <Image
            src={imageSrc}
            alt="map"
            width={1600}
            height={900}
            className={`w-full ${height} object-cover`}
          />
        ) : null}

        {markers.length > 0 ? (
          <div className="pointer-events-none absolute inset-0">
            {markers.map((m) => (
              <div
                key={String(m.id)}
                className="absolute -translate-x-1/2 -translate-y-full"
                style={{ top: m.top, left: m.left }}
              >
                <div className="h-9 w-9 overflow-hidden rounded-full shadow-lg ring-2 ring-[#8ec5eb]/90 ring-offset-2 ring-offset-[#062946]/80">
                  <Image
                    src={m.img}
                    alt={m.name}
                    width={36}
                    height={36}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
