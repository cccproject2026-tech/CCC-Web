import Image from "next/image";

interface RoadmapCardProps {
  img: any;
  title: string;
  description: string;
  completionTime: string;
}

export default function RoadmapCard({
  img,
  title,
  description,
  completionTime,
}: RoadmapCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.05)] border border-[#E5EAF1] flex overflow-hidden hover:shadow-md transition-all">
      {/* Left Image Section */}
      <div className="relative w-[42%] h-[200px] shrink-0 m-3 rounded-l-2xl overflow-hidden">
        <Image
          src={img}
          alt={title}
          fill
          className="object-cover"
        />
      </div>

      {/* Right Content Section */}
      <div className="flex flex-col justify-between flex-1 px-5 py-4 relative">
        {/* Top Right Menu Icon - Absolutely positioned */}
        <div className="absolute top-4 right-5">
          <button className="text-[#214080] hover:text-[#1F2A6E] transition-all">
            <i className="fa-solid fa-ellipsis-vertical text-lg"></i>
          </button>
        </div>

        <div className="pt-6">
          {/* Title */}
          <h3 className="text-[17px] font-bold text-black mb-2">{title}</h3>

          {/* Description */}
          <p className="text-[14px] text-[#808080] leading-relaxed mb-6">
            {description}
          </p>

          {/* Completion Time */}
          <div>
            <p className="text-[14px] font-bold text-black mb-1">
              Completion Time
            </p>
            <p className="text-[14px] text-[#808080]">{completionTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

