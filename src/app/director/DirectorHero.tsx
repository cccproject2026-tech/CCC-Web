"use client";

import Image from "next/image";
import type { StaticImageData } from "next/image";
import Link from "next/link";
import { directorGlassCard } from "./directorUi";

type DirectorHeroProps = {
  title: string;
  subtitle?: string;
  image?: StaticImageData | string | null;
  className?: string;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
};

export default function DirectorHero({
  title,
  subtitle,
  image,
  className = "",
  breadcrumbItems,
}: DirectorHeroProps) {
  const hasCrumbs = breadcrumbItems && breadcrumbItems.length > 0;
  const hasImage = typeof image === "string" ? image.trim().length > 0 : Boolean(image);

  return (
    <section
      className={`relative mb-6 overflow-hidden rounded-3xl border border-white/10 ${directorGlassCard} ${className}`}
    >
      <div className={`relative ${hasCrumbs ? "min-h-[220px] sm:min-h-[260px] lg:min-h-[280px]" : "h-[180px] sm:h-[220px] lg:h-[260px]"}`}>
        {hasImage ? (
          <Image
            src={image as StaticImageData | string}
            alt=""
            fill
            className="object-cover object-center"
            priority
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-[#062946] via-[#062946]/70 to-[#0a3558]/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#041f35]/85 via-transparent to-transparent" />
        <div className="relative z-10 flex h-full flex-col justify-between p-6 sm:p-8">
          {hasCrumbs ? (
            <div className="text-sm text-white/75">
              {breadcrumbItems!.map((item, idx) => (
                <span key={`${item.label}-${idx}`}>
                  {item.href ? (
                    <Link href={item.href} className="hover:text-white">
                      {item.label}
                    </Link>
                  ) : (
                    <span className={idx === breadcrumbItems!.length - 1 ? "font-semibold text-white" : ""}>
                      {item.label}
                    </span>
                  )}
                  {idx < breadcrumbItems!.length - 1 && <span className="mx-2">&gt;</span>}
                </span>
              ))}
            </div>
          ) : null}
          <div>
            <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
            {subtitle ? (
              <p className="mt-2 max-w-2xl text-sm text-white/75 sm:text-base">{subtitle}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
