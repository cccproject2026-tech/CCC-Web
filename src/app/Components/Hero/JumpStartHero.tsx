"use client";
import Link from "next/link";

interface JumpStartHeroProps {
  backgroundImageUrl: string;
  title: string;
  breadcrumbItems: Array<{ label: string; href?: string }>;
  status?: {
    label: string;
    color?: string;
  };
  completedOn?: string;
  lastUpdatedOn?: string;
  completionTime?: string;
  heightClasses?: string;
}

export default function JumpStartHero({
  backgroundImageUrl,
  title,
  breadcrumbItems,
  status,
  completedOn,
  lastUpdatedOn,
  completionTime,
  heightClasses = "h-[280px]",
}: JumpStartHeroProps) {
  const getStatusColor = () => {
    switch (status?.color) {
      case "green":
        return "bg-[#4CAF50]";
      case "orange":
        return "bg-[#FFB84D]";
      case "red":
        return "bg-[#F44336]";
      case "blue":
        return "bg-[#2E3B8E]";
      default:
        return "bg-[#4CAF50]";
    }
  };

  return (
    <section
      className={`relative bg-cover bg-center text-white ${heightClasses}`}
      style={{ backgroundImage: `url(${backgroundImageUrl})` }}
    >
      {/* Minimal overlay - no blur */}
      <div className="absolute inset-0 bg-[#1A2E5C]/10"></div>
      <div className="relative z-10 px-6 md:px-12 lg:px-20 pt-8 pb-10 flex flex-col h-full">
        {/* Breadcrumbs - Top */}
        <div className="text-sm text-white/80 mb-2">
          {breadcrumbItems.map((item, idx) => (
            <span key={idx}>
              {item.href ? (
                <Link
                  href={item.href}
                  className="hover:text-white cursor-pointer"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={
                    idx === breadcrumbItems.length - 1 ? "font-semibold" : ""
                  }
                >
                  {item.label}
                </span>
              )}
              {idx < breadcrumbItems.length - 1 && (
                <span className="mx-2">&gt;</span>
              )}
            </span>
          ))}
        </div>

        {/* Title and Status - Bottom aligned */}
        <div className="mt-auto">
          {/* here text-[24px] is enough for all screen size keep it as it is fixed don't change it*/}
          <h1 className="text-[24px] font-semibold leading-tight mb-3">
            {title}
          </h1>
          {(status || completedOn || lastUpdatedOn || completionTime) && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-4">
                {status && (
                  <span
                    className={`${getStatusColor()} text-white px-4 py-1.5 rounded-lg text-sm font-semibold`}
                  >
                    {status.label}
                  </span>
                )}
                {completedOn && (
                  <span className="text-white/90 text-sm">
                    Completed on {completedOn}
                  </span>
                )}
                {lastUpdatedOn && (
                  <span className="text-white/90 text-sm">
                    Last Updated on {lastUpdatedOn}
                  </span>
                )}
                {completionTime && (
                  <span className="text-white/90 text-sm">
                    Completion Time {completionTime}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
