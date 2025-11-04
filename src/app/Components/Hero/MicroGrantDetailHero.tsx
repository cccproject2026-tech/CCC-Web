"use client";
import React from "react";
import Link from "next/link";

interface MicroGrantDetailHeroProps {
  title: string;
  subtitle?: string;
  backgroundImageUrl: string;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
  rightCard?: React.ReactNode;
}

export default function MicroGrantDetailHero({
  title,
  subtitle,
  backgroundImageUrl,
  breadcrumbItems = [],
  rightCard,
}: MicroGrantDetailHeroProps) {
  return (
    <section
      className="relative bg-cover bg-center text-white min-h-[300px] "
      style={{ backgroundImage: `url(${backgroundImageUrl})` }}
    >
      <div className="relative h-full flex flex-col justify-between z-10 px-6 md:px-12 lg:px-20 pt-8 pb-10">
        {/* Breadcrumbs at the top */}
        {breadcrumbItems.length > 0 && (
          <div className="text-sm text-white/80">
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
        )}

        {/* Content Section - Title on left, Card on right */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6 mt-auto">
          {/* Title on the left */}
          <div className="flex-1">
            <h1 className="text-[32px] font-semibold leading-tight mb-3">
              {title}
            </h1>
            {subtitle && (
              <p className="text-white/90 text-sm md:text-base leading-relaxed max-w-2xl">
                {subtitle}
              </p>
            )}
          </div>

          {/* Card on the right */}
          {rightCard && (
            <div className="flex-shrink-0 w-full md:w-auto">{rightCard}</div>
          )}
        </div>
      </div>
    </section>
  );
}
