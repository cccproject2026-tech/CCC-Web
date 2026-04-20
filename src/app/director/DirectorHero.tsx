"use client";

import Image from "next/image";
import type { StaticImageData } from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { directorGlassCard } from "./directorUi";

type DirectorHeroProps = {
  title: string;
  subtitle?: string;
  /** Muted line under subtitle (e.g. parent roadmap name on phase editor). */
  detail?: string;
  image?: StaticImageData | string | null;
  className?: string;
  /** Shorter header when there is no background image. */
  compact?: boolean;
  /** e.g. “Change banner” — aligned to the top-right of the hero. */
  topRight?: ReactNode;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
};

export default function DirectorHero({
  title,
  subtitle,
  detail,
  image,
  className = "",
  compact = false,
  topRight,
  breadcrumbItems,
}: DirectorHeroProps) {
  const hasCrumbs = breadcrumbItems && breadcrumbItems.length > 0;
  const hasImage = typeof image === "string" ? image.trim().length > 0 : Boolean(image);

  const innerMinH = compact
    ? hasCrumbs
      ? "min-h-[120px] sm:min-h-[140px]"
      : "min-h-[100px] sm:min-h-[120px]"
    : hasCrumbs
      ? "min-h-[220px] sm:min-h-[260px] lg:min-h-[280px]"
      : "h-[180px] sm:h-[220px] lg:h-[260px]";

  const imageUnoptimized =
    typeof image === "string" &&
    (image.startsWith("http") || image.startsWith("//") || image.startsWith("blob:"));

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border border-white/10 ${directorGlassCard} ${compact ? "mb-4" : "mb-6"} ${className}`}
    >
      <div className={`relative ${innerMinH}`}>
        {hasImage ? (
          <Image
            src={image as StaticImageData | string}
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
            unoptimized={imageUnoptimized}
          />
        ) : null}
        {/* Reference-style readability: strong dark blue on the left, image visible toward the right */}
        <div
          className={`absolute inset-0 ${hasImage ? "bg-gradient-to-r from-[#041f35]/93 via-[#062946]/55 to-transparent" : ""}`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#062946]/90 via-[#062946]/35 to-[#0a3558]/45" />
        {!hasImage ? (
          <div className="absolute inset-0 bg-gradient-to-r from-[#041f35]/85 via-transparent to-transparent" />
        ) : null}
        <div className="relative z-10 flex h-full flex-col justify-between gap-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            {hasCrumbs ? (
              <div className="min-w-0 flex-1 text-sm text-white/75">
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
            ) : (
              <div />
            )}
            {topRight ? <div className="shrink-0">{topRight}</div> : null}
          </div>
          <div className="max-w-3xl lg:max-w-4xl">
            <h1 className="text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-2 text-sm text-white/85 sm:text-base">{subtitle}</p>
            ) : null}
            {detail ? <p className="mt-1.5 text-xs text-white/60 sm:text-sm">{detail}</p> : null}
          </div>
        </div>
      </div>
    </section>
  );
}
