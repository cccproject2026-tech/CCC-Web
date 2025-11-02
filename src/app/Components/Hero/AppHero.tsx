"use client";
import React from "react";
import Link from "next/link";

interface AppHeroProps {
  title: string;
  backgroundImageUrl: string;
  heightClasses?: string; // override height if needed
  children?: React.ReactNode; // optional right/top content if needed later
  breadcrumbItems?: Array<{ label: string; href?: string }>;
}

export default function AppHero({
  title,
  backgroundImageUrl,
  heightClasses = "h-[240px] sm:h-[260px] md:h-[280px]",
  children,
  breadcrumbItems = [],
}: AppHeroProps) {
  const hasBreadcrumbs = breadcrumbItems.length > 0;

  if (hasBreadcrumbs) {
    // Breadcrumb variant: lower visual height with fixed paddings (pt-8 pb-16)
    return (
      <section
        className="relative bg-cover bg-center text-white min-h-[220px] sm:min-h-[260px] md:min-h-[300px]"
        style={{ backgroundImage: `url(${backgroundImageUrl})` }}
      >
        <div className="relative h-full flex flex-col gap-10 justify-between z-10 px-6 md:px-12 lg:px-20 pt-8 pb-10">
          <div className="text-sm text-white/80 mb-6">
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
          <div>
            {children && <div className="mb-2">{children}</div>}
            <h1 className="text-[24px] md:text-[32px] lg:text-[40px] font-semibold leading-tight">
              {title}
            </h1>
          </div>
        </div>
      </section>
    );
  }

  // Default variant: tall hero with content anchored to bottom
  return (
    <section
      className={`relative bg-cover bg-center ${heightClasses} text-white flex items-end px-4 sm:px-6 md:px-12 lg:px-20`}
      style={{ backgroundImage: `url(${backgroundImageUrl})` }}
    >
      <div className="relative z-10 pb-8 md:pb-10 w-full">
        <h1 className="text-[32px] font-semibold leading-tight">
          {title}
        </h1>
        {children}
      </div>
    </section>
  );
}
