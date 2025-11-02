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
}

export default function MicroGrantCard({
  image,
  name,
  role,
  date,
  slug,
  onViewClick,
}: MicroGrantCardProps) {
  const router = useRouter();

  const handleViewClick = () => {
    if (onViewClick) {
      onViewClick();
    } else if (slug) {
      router.push(`/director/micro-grant/${slug}`);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5 w-full h-[160px] flex items-center justify-between gap-4">
      {/* Left section - Profile */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Profile Picture */}
        <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-[#EFEBE0]">
          {typeof image === "string" ? (
            <img
              src={image}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
            />
          )}
        </div>

        {/* Name, Role, and Contact Icons */}
        <div className="flex flex-col justify-between h-full py-1 flex-1 min-w-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{name}</h3>
            <p className="text-sm text-gray-500">{role}</p>
          </div>
          
          {/* Contact Icons */}
          <div className="flex items-center gap-3 mt-2">
            <button
              className="text-black hover:opacity-70 transition"
              aria-label="Send email"
            >
              <i className="fa-regular fa-envelope text-lg"></i>
            </button>
            <button
              className="text-black hover:opacity-70 transition"
              aria-label="Send message"
            >
              <i className="fa-regular fa-comment-dots text-lg"></i>
            </button>
            <button
              className="text-black hover:opacity-70 transition"
              aria-label="Call"
            >
              <i className="fa-solid fa-phone text-lg"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Right section - Date and View Button */}
      <div className="flex flex-col items-end justify-between h-full py-2 flex-shrink-0">
        <p className="text-xs text-gray-400">{date}</p>
        <button
          onClick={handleViewClick}
          className="bg-[#1E366F] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[#1a2f5a] transition-colors"
        >
          View
        </button>
      </div>
    </div>
  );
}

