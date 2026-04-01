"use client";
import Image from "next/image";
import GearsBg from "../Assets/gear.png";

interface HeroSectionProps {
  title: string;
  subtitle: string;
  primaryBtn?: { label: string; onClick: () => void };
  secondaryBtn?: { label: string; onClick: () => void };
  tertiaryBtn?: { label: string; onClick: () => void };
  showContactBox?: boolean;
  theme?: "light" | "dark";
}

export default function HeroSection({
  title,
  subtitle,
  primaryBtn,
  secondaryBtn,
  tertiaryBtn,
  showContactBox = true,
  theme = "light",
}: HeroSectionProps) {
  const isDark = theme === "dark";

  return (
    <section
      className={`relative flex items-center justify-between px-6 lg:px-10 min-h-[540px] overflow-hidden max-sm:flex-col max-sm:items-center max-sm:text-center max-sm:px-4 ${
        isDark ? "bg-[linear-gradient(180deg,#072844_0%,#0a3558_100%)]" : ""
      }`}
      style={{
        backgroundImage: `url(${GearsBg.src})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain",
      }}
    >
      {isDark && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(141,211,243,0.18),transparent_36%),radial-gradient(circle_at_82%_20%,rgba(245,204,118,0.12),transparent_35%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(4,28,48,0.72)_0%,rgba(4,28,48,0.56)_45%,rgba(4,28,48,0.20)_70%,rgba(4,28,48,0)_100%)]" />
        </>
      )}
      {/* LEFT CONTENT */}
      <div className="max-w-[560px] z-10 max-sm:max-w-full max-sm:mt-14">
        <h2 className={`text-[28px] font-bold mb-3 leading-snug max-sm:text-[22px] max-sm:mb-1 max-sm:max-w-full ${
          isDark ? "text-white" : "text-[#0D1B4C]"
        }`}>
          {title}
        </h2>

        <p className={`text-base mb-6 leading-relaxed max-w-md max-sm:text-sm max-sm:mb-3 max-sm:max-w-full ${
          isDark ? "text-[#eef6ff]" : "text-gray-700"
        }`}>
          {subtitle}
        </p>

        <div className="flex gap-4 max-sm:flex-col max-sm:items-center max-sm:gap-2 max-sm:mb-4 mt-1">
          {secondaryBtn && (
            <button
              className={`px-6 py-2 rounded-md font-medium transition-all cursor-pointer max-sm:px-4 max-sm:py-1.5 max-sm:text-sm w-fit ${
                isDark
                  ? "bg-transparent border border-white/40 text-white hover:bg-white/10"
                  : "bg-transparent border border-[#1A2E7A] text-[#1A2E7A] hover:bg-[#1A2E7A] hover:text-white"
              }`}
              onClick={secondaryBtn.onClick}
            >
              {secondaryBtn.label}
            </button>
          )}

          {primaryBtn && (
            <button
              className={`text-white px-6 py-2 rounded-md font-medium transition-all cursor-pointer max-sm:px-4 max-sm:py-1.5 max-sm:text-sm w-fit ${
                isDark ? "bg-white !text-[#0f4a76] hover:bg-[#e7f1fa]" : "bg-[#1A2E7A] hover:opacity-90"
              }`}
              onClick={primaryBtn.onClick}
            >
              {primaryBtn.label}
            </button>
          )}
        </div>
        {tertiaryBtn && (
          <button
            className={`text-sm underline mt-1 transition-all ${
              isDark ? "text-[#cde2f2] hover:text-white" : "text-[#1A2E7A] hover:opacity-80"
            }`}
            onClick={tertiaryBtn.onClick}
          >
            {tertiaryBtn.label}
          </button>
        )}
      </div>

      {/* CONTACT BOX */}
      {showContactBox && (
        <div className="relative flex justify-end w-1/2 max-sm:w-full max-sm:flex max-sm:justify-center max-sm:mt-6">
          <div className={`absolute right-0 top-1/2 -translate-y-1/2 rounded-xl shadow-[0_10px_25px_rgba(0,0,0,0.25)] p-5 w-[290px] text-sm max-sm:static max-sm:translate-y-0 max-sm:p-3 max-sm:w-[260px] max-sm:mb-6 max-sm:text-xs ${
            isDark ? "bg-[#0a3558]/95 text-white border border-white/30 backdrop-blur" : "bg-[#2891C31A] text-[#0D1B4C]"
          }`}>
            <h3 className={`font-semibold mb-2 max-sm:text-sm ${isDark ? "text-white" : ""}`}>
              Contact Information
            </h3>

            <p className={`flex items-center gap-2 mb-1 max-sm:gap-1 max-sm:mb-0.5 ${isDark ? "text-[#e7f2fb]" : ""}`}>
              <i className={`fa-solid fa-phone max-sm:text-[10px] ${isDark ? "text-[#f5cc76]" : "text-[#1A2E7A]"}`}></i>
              269-471-6159
            </p>

            <p className={`flex items-center gap-2 mb-1 break-all max-sm:gap-1 max-sm:mb-0.5 ${isDark ? "text-[#e7f2fb]" : ""}`}>
              <i className={`fa-solid fa-envelope max-sm:text-[10px] ${isDark ? "text-[#f5cc76]" : "text-[#1A2E7A]"}`}></i>
              communitychange@andrews.edu
            </p>

            <p className={`flex items-center gap-2 max-sm:gap-1 ${isDark ? "text-[#e7f2fb]" : ""}`}>
              <i className={`fa-solid fa-globe max-sm:text-[10px] ${isDark ? "text-[#f5cc76]" : "text-[#1A2E7A]"}`}></i>
              communitychange.world
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
