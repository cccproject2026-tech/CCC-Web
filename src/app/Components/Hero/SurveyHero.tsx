"use client";
import React from "react";
import Link from "next/link";
import Image from "next/image";

interface SurveyHeroProps {
  title: string;
  subtitle: string;
  breadcrumbItems: Array<{ label: string; href?: string }>;
  rightContent?: React.ReactNode; // For PMP text or CMA logo
  backgroundColor?: string; // Override default teal
}

export default function SurveyHero({
  title,
  subtitle,
  breadcrumbItems,
  rightContent,
  backgroundColor = "#008e94",
}: SurveyHeroProps) {
  return (
    <>
      {/* Breadcrumbs */}
      <div className="px-6 md:px-8 lg:px-20 py-4">
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
      </div>

      {/* Teal Hero Section with geometric shapes */}
      <section
        className="relative bg-cover bg-center text-white px-6 md:px-8 lg:px-20 py-8 md:py-10"
        style={{ backgroundColor: backgroundColor }}
      >
        {/* Subtle geometric shapes pattern */}
        <div className="absolute inset-0 opacity-20 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-40 h-40 border-2 border-white/30 rotate-45"></div>
          <div className="absolute top-20 left-32 w-20 h-20 border-2 border-white/30 rotate-12"></div>
          <div className="absolute bottom-10 left-20 w-32 h-32 border-2 border-white/30 rotate-[-45deg]"></div>
          <div className="absolute top-1/2 right-20 w-24 h-24 border-2 border-white/30 rotate-45"></div>
        </div>

        <div className="relative z-10 flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-2 leading-tight">
              {title}
            </h1>
            <p className="text-white/90 text-sm md:text-base">{subtitle}</p>
          </div>
          {rightContent && (
            <div className="ml-8 flex-shrink-0">{rightContent}</div>
          )}
        </div>
      </section>
    </>
  );
}
