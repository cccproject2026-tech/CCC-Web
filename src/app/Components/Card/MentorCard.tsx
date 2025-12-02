import Image from 'next/image';
import type { StaticImageData } from 'next/image';

type MentorCardProps = {
  image: string | StaticImageData;
  name: string;
  role?: string;
  menteeCount?: number;
  onViewDetails?: () => void;
};

export default function MentorCard({
  image,
  name,
  role,
  menteeCount,
  onViewDetails,
}: MentorCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-6">
      <div className="relative mb-6 h-[340px] w-full rounded-xl overflow-hidden">
        <Image
          src={image}
          alt={name}
          className="w-full h-[340px] object-cover rounded-xl"
          fill
        />
      </div>

      {/* Name and Badge Section */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-semibold text-gray-900 text-[32px] leading-none mb-2">
            {name}
          </h4>
          <p className="text-[20px] text-gray-500">{role}</p>
        </div>

        {/* Mentee Count Badge */}
        <div className="bg-[#E8DAAE] text-[#6B5D3F] text-[14px] font-semibold px-4 py-2 rounded-full whitespace-nowrap">
          {menteeCount} Mentees
        </div>
      </div>

      {/* Actions Section */}
      <div className="flex justify-between items-center mt-8">
        <div className="flex gap-1 text-[#2E3B8E]">
          <button className="hover:opacity-70 transition" aria-label="Send email">
            <i className="fa-regular fa-envelope text-[28px]"></i>
          </button>
          <button className="hover:opacity-70 transition" aria-label="Send message">
            <i className="fa-regular fa-comment-dots text-[28px]"></i>
          </button>
          <button className="hover:opacity-70 transition" aria-label="WhatsApp">
            <i className="fa-brands fa-whatsapp text-[28px]"></i>
          </button>
          <button className="hover:opacity-70 transition" aria-label="Call">
            <i className="fa-solid fa-phone text-[24px]"></i>
          </button>
        </div>

        <button
          onClick={onViewDetails}
          className="w-12 h-12 flex items-center justify-center rounded-xl border-2 border-[#2E3B8E] text-[#2E3B8E] hover:bg-[#2E3B8E] hover:text-white transition"
          aria-label="View details"
        >
          <i className="fa-solid fa-arrow-up-right-from-square text-[18px]"></i>
        </button>
      </div>
    </div>
  );
}
