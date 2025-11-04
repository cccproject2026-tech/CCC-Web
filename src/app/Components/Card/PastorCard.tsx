"use client";
import Image, { StaticImageData } from "next/image";

interface PastorCardProps {
  image: StaticImageData;
  name: string;
  description: string;
  phase: string;
  progress: number;
  onViewDetails?: () => void;
}

const getProgressColor = (progress: number) => {
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
}: PastorCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-[#E5EAF1] hover:shadow-xl transition-all duration-300 overflow-hidden flex min-h-[200px]">
      {/* Left Section - Profile Image */}
      <div className="relative w-[42%] flex-shrink-0 min-h-[200px]">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover rounded-l-2xl"
        />
      </div>

      {/* Right Section - Content */}
      <div className="flex-1 p-6 flex flex-col justify-between">
        {/* Top Content */}
        <div>
          {/* Name */}
          <h3 className="text-[17px] font-bold text-gray-900 mb-2">{name}</h3>

          {/* Description */}
          <p className="text-[13px] text-gray-600 mb-3 leading-relaxed">
            {description}
          </p>

          {/* Phase Tag */}
          <div className="mb-4">
            <span className="inline-block px-3 py-1.5 bg-blue-100 text-[#2E3B8E] rounded-lg text-[12px] font-semibold">
              Phase : {phase}
            </span>
          </div>

          {/* Progress Section */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[14px] font-semibold text-gray-700">
                Tasks Completed
              </span>
              <span className="text-[14px] font-bold text-gray-900">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getProgressColor(progress)}`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Bottom Content - Actions */}
        <div className="flex justify-between items-center mt-4">
          {/* Contact Icons */}
          <div className="flex gap-4">
            <button
              className="hover:opacity-70 transition"
              aria-label="Send email"
            >
              <i className="fa-regular fa-envelope text-gray-600 text-lg"></i>
            </button>
            <button
              className="hover:opacity-70 transition"
              aria-label="Send message"
            >
              <i className="fa-regular fa-comment-dots text-gray-600 text-lg"></i>
            </button>
            <button
              className="hover:opacity-70 transition"
              aria-label="WhatsApp"
            >
              <i className="fa-brands fa-whatsapp text-gray-600 text-lg"></i>
            </button>
            <button className="hover:opacity-70 transition" aria-label="Call">
              <i className="fa-solid fa-phone text-gray-600 text-lg"></i>
            </button>
          </div>

          {/* View Details Button */}
          <button
            onClick={onViewDetails}
            className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-200 text-gray-600 hover:bg-[#2E3B8E] hover:border-[#2E3B8E] hover:text-white transition"
            aria-label="View details"
          >
            <i className="fa-solid fa-arrow-up-right-from-square text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

