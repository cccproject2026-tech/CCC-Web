"use client";
import Image from "next/image";
import GearsBg from "../Assets/gear.png";
import { useRouter } from "next/navigation";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  primaryBtn?: {
    label: string;
    onClick: () => void;
  };
  secondaryBtn?: {
    label: string;
    onClick: () => void;
  };
  showContactBox?: boolean; // ✅ optional toggle for contact info box
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
      className="relative flex items-center justify-between px-10 min-h-[500px] overflow-hidden"
      style={{
        backgroundImage: `url(${GearsBg.src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain",
      }}
    >
      {/* LEFT CONTENT */}
      <div className="max-w-lg z-10">
        <h2 className="text-[28px] font-bold text-[#0D1B4C] mb-3 leading-snug">
          {title}
        </h2>
        <p className="text-gray-700 text-base mb-6 leading-relaxed max-w-md">
          {subtitle}
        </p>

        {/* ✅ Buttons appear only if provided */}
        <div className="flex gap-4">
          {secondaryBtn && (
            <button
              className="bg-transparent border border-[#1A2E7A] text-[#1A2E7A] px-6 py-2 rounded-md font-medium hover:bg-[#1A2E7A] hover:text-white transition-all cursor-pointer"
              onClick={secondaryBtn.onClick}
            >
              {secondaryBtn.label}
            </button>
          )}
          {primaryBtn && (
            <button
              className="bg-[#1A2E7A] text-white px-6 py-2 rounded-md font-medium hover:opacity-90 transition-all cursor-pointer"
              onClick={primaryBtn.onClick}
            >
              {primaryBtn.label}
            </button>
          )}
        </div>
      </div>

      {/* ✅ CONTACT BOX (toggle visibility via prop) */}
      {showContactBox && (
        <div className="relative flex justify-end w-1/2">
          <div className="absolute top-18 right-0 bg-[#2891C31A] rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.15)] p-5 w-[270px] text-[#0D1B4C] text-sm">
            <h3 className="font-semibold mb-2">Contact Information</h3>
            <p className="flex items-center gap-2 mb-1">
              <i className="fa-solid fa-phone text-[#1A2E7A]"></i>
              269-471-6159
            </p>
            <p className="flex items-center gap-2 mb-1 break-all">
              <i className="fa-solid fa-envelope text-[#1A2E7A]"></i>
              communitychange@andrews.edu
            </p>
            <p className="flex items-center gap-2">
              <i className="fa-solid fa-globe text-[#1A2E7A]"></i>
              communitychange.world
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
