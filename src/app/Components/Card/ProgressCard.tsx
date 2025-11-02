"use client";
import Image, { StaticImageData } from "next/image";
import { useRouter } from "next/navigation";

interface ProgressCardProps {
  image: StaticImageData | string;
  name: string;
  description?: string;
  progress: number; // 0-100
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

  const handleCardClick = () => {
    if (slug) {
      router.push(`/director/track-progress/${slug}`);
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-all cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="flex gap-4">
        {/* Profile Picture - Square */}
        <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
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

        {/* Content Section */}
        <div className="flex-1 min-w-0">
          {/* Name */}
          <h3 className="text-lg font-bold text-gray-900 mb-1">{name}</h3>

          {/* Description */}
          <p className="text-sm text-gray-600 mb-4 leading-relaxed">
            {description}
          </p>

          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-900">
                Progress
              </span>
              <span className="text-sm font-semibold text-green-600">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="h-2.5 rounded-full bg-green-500 transition-all"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Contact Icons and Button */}
          <div className="flex items-center justify-between">
            {/* Contact Icons */}
            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onEmailClick}
                className="text-gray-600 hover:opacity-70 transition"
                aria-label="Send email"
              >
                <i className="fa-regular fa-envelope text-lg"></i>
              </button>
              <button
                onClick={onMessageClick}
                className="text-gray-600 hover:opacity-70 transition"
                aria-label="Send message"
              >
                <i className="fa-regular fa-comment-dots text-lg"></i>
              </button>
              <button
                onClick={onWhatsAppClick}
                className="text-gray-600 hover:opacity-70 transition"
                aria-label="WhatsApp"
              >
                <i className="fa-brands fa-whatsapp text-lg"></i>
              </button>
              <button
                onClick={onPhoneClick}
                className="text-gray-600 hover:opacity-70 transition"
                aria-label="Call"
              >
                <i className="fa-solid fa-phone text-lg"></i>
              </button>
            </div>

            {/* Complete Button - Only show when progress is 100% and showCompleteButton is true */}
            {isComplete && showCompleteButton && (
              <button
                onClick={onCompleteClick}
                className="bg-[#1E366F] text-white text-sm font-semibold px-5 py-2 rounded-lg hover:bg-[#1a2f5a] transition-colors"
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

