"use client";
import Image from "next/image";

export interface MapMarker {
  id: number | string;
  name: string;
  img: any;
  top: string; // percentage string e.g., "35%"
  left: string; // percentage string e.g., "45%"
}

interface MapCardProps {
  title?: string;
  iframeSrc?: string; // when using Google Maps embed
  imageSrc?: string; // alternative static map image
  height?: string; // tailwind height
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
    <div className="bg-gradient-to-b from-[#1f4b86]/70 to-[#143d74]/70 rounded-xl p-3 border border-white/20">
      {title && (
        <div className="px-3 py-2 text-white text-[14px] font-semibold">
          {title}
        </div>
      )}
      <div className="relative rounded-xl overflow-hidden bg-white">
        {iframeSrc ? (
          <iframe
            title="map"
            className={`w-full ${height}`}
            src={iframeSrc}
            loading="lazy"
          ></iframe>
        ) : imageSrc ? (
          <Image
            src={imageSrc}
            alt="map"
            width={1600}
            height={900}
            className={`w-full ${height} object-cover`}
          />
        ) : null}

        {/* Overlay markers */}
        {markers.length > 0 && (
          <div className="absolute inset-0 pointer-events-none">
            {markers.map((m) => (
              <div
                key={m.id}
                className="absolute -translate-x-1/2 -translate-y-full"
                style={{ top: m.top, left: m.left }}
              >
                <div className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-yellow-300 shadow-md">
                  <Image
                    src={m.img}
                    alt={m.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
