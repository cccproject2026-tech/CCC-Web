"use client";
import Image from "next/image";
import GearsBg from "../Assets/gear.png";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  primaryBtn?: { label: string; onClick: () => void };
  secondaryBtn?: { label: string; onClick: () => void };
  showContactBox?: boolean;
}

export default function HeroSection({
  title,
  subtitle,
  primaryBtn,
  secondaryBtn,
  showContactBox = true,
}: HeroSectionProps) {
  return (
    <section
      className="relative flex items-center justify-between px-10 min-h-[500px] overflow-hidden max-sm:flex-col max-sm:items-center max-sm:text-center max-sm:px-3"
      style={{
        backgroundImage: `url(${GearsBg.src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain",
      }}
    >
      {/* LEFT CONTENT */}
      <div className="max-w-lg z-10 max-sm:max-w-full max-sm:mt-40">
        <h2 className="text-[28px] font-bold text-[#0D1B4C] mb-3 leading-snug max-sm:text-[22px] max-sm:mb-1 max-sm:max-w-full">
          {title}
        </h2>

        <p className="text-gray-700 text-base mb-6 leading-relaxed max-w-md max-sm:text-sm max-sm:mb-3 max-sm:max-w-full">
          {subtitle}
        </p>

        <div className="flex gap-4 max-sm:flex-col max-sm:items-center max-sm:gap-2 max-sm:mb-4">
          {secondaryBtn && (
            <button
              className="bg-transparent border border-[#1A2E7A] text-[#1A2E7A] px-6 py-2 rounded-md font-medium hover:bg-[#1A2E7A] hover:text-white transition-all cursor-pointer max-sm:px-4 max-sm:py-1.5 max-sm:text-sm w-fit"
              onClick={secondaryBtn.onClick}
            >
              {secondaryBtn.label}
            </button>
          )}

          {primaryBtn && (
            <button
              className="bg-[#1A2E7A] text-white px-6 py-2 rounded-md font-medium hover:opacity-90 transition-all cursor-pointer max-sm:px-4 max-sm:py-1.5 max-sm:text-sm w-fit"
              onClick={primaryBtn.onClick}
            >
              {primaryBtn.label}
            </button>
          )}
        </div>
      </div>

      {/* CONTACT BOX */}
      {showContactBox && (
        <div className="relative flex justify-end w-1/2 max-sm:w-full max-sm:flex max-sm:justify-center max-sm:mt-6">
          <div className="absolute top-18 right-0 bg-[#2891C31A] rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.15)] p-5 w-[270px] text-[#0D1B4C] text-sm max-sm:static max-sm:p-3 max-sm:w-[250px] max-sm:mb-10 max-sm:text-xs">
            <h3 className="font-semibold mb-2 max-sm:text-sm">
              Contact Information
            </h3>

            <p className="flex items-center gap-2 mb-1 max-sm:gap-1 max-sm:mb-0.5">
              <i className="fa-solid fa-phone text-[#1A2E7A] max-sm:text-[10px]"></i>
              269-471-6159
            </p>

            <p className="flex items-center gap-2 mb-1 break-all max-sm:gap-1 max-sm:mb-0.5">
              <i className="fa-solid fa-envelope text-[#1A2E7A] max-sm:text-[10px]"></i>
              communitychange@andrews.edu
            </p>

            <p className="flex items-center gap-2 max-sm:gap-1">
              <i className="fa-solid fa-globe text-[#1A2E7A] max-sm:text-[10px]"></i>
              communitychange.world
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
