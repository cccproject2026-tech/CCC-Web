"use client";

interface ExploreCCCCardProps {
  title: string;
  description: string;
  icon: string;
  onMoreClick?: () => void;
}

export default function ExploreCCCCard({
  title,
  description,
  icon,
  onMoreClick,
}: ExploreCCCCardProps) {
  return (
    <div
      className="relative rounded-3xl text-white p-8 flex flex-col justify-between 
                 bg-gradient-to-br from-[#1F5B7F] via-[#2B4B7C] to-[#2E3B8E] overflow-hidden
                 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl min-h-[380px]
                 cursor-pointer group"
      onClick={onMoreClick}
    >
      {/* Decorative Background Circles */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-8 right-8 w-32 h-32 border-2 border-white rounded-full"></div>
        <div className="absolute top-24 right-20 w-32 h-32 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-8 left-8 w-32 h-32 border-2 border-white rounded-full"></div>
        <div className="absolute bottom-24 left-20 w-32 h-32 border-2 border-white rounded-full"></div>
      </div>

      {/* Icon */}
      <div className="relative z-10">
        <div className="w-16 h-16 flex items-center justify-center">
          <i className={`${icon} text-4xl text-white`}></i>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 mt-auto">
        <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
        <p className="text-[15px] text-white/90 leading-relaxed">
          {description}
        </p>
      </div>

      {/* More Button */}
      <div className="relative z-10 flex justify-end mt-6">
        <button className="flex items-center gap-3 text-[17px] font-bold text-white hover:text-white/80 transition-all group-hover:gap-4">
          More
          <div className="w-12 h-12 flex items-center justify-center border-2 border-white rounded-2xl transition-all group-hover:bg-white/10 group-hover:scale-105">
            <i className="fa-solid fa-arrow-up-right text-[16px] text-white"></i>
          </div>
        </button>
      </div>
    </div>
  );
}
