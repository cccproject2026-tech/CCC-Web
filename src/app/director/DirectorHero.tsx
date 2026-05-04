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
  /** Shorter min-heights below `lg` for dense mobile dashboards (e.g. pastor roadmap). */
  tightenMobileLayout?: boolean;
  /** Title block alignment (`start` = left). Default matches legacy director hero (right). */
  titleAlign?: "start" | "end";
  /** e.g. “Change banner” — aligned to the top-right of the hero. */
  topRight?: ReactNode;
  /** Small pill above the title (e.g. Leadership Support Network). */
  pill?: string;
  breadcrumbItems?: Array<{ label: string; href?: string }>;
};

export default function DirectorHero({
  title,
  subtitle,
  detail,
  image,
  className = "",
  compact = false,
  tightenMobileLayout = false,
  titleAlign = "end",
  topRight,
  breadcrumbItems,
  pill,
}: DirectorHeroProps) {
  const hasCrumbs = breadcrumbItems && breadcrumbItems.length > 0;
  const hasImage = typeof image === "string" ? image.trim().length > 0 : Boolean(image);

  const innerMinH = compact
    ? hasCrumbs
      ? "min-h-[120px] sm:min-h-[140px]"
      : "min-h-[100px] sm:min-h-[120px]"
    : hasCrumbs
      ? tightenMobileLayout
        ? "min-h-[168px] sm:min-h-[220px] lg:min-h-[280px]"
        : "min-h-[220px] sm:min-h-[260px] lg:min-h-[280px]"
      : tightenMobileLayout
        ? "min-h-[148px] sm:h-[200px] lg:h-[260px]"
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
        {hasImage ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-[#041f35]/93 via-[#062946]/55 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#062946]/90 via-[#062946]/35 to-[#0a3558]/45" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(145deg,#070f22_0%,#0A1128_45%,#0f1f42_100%)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#041f35]/90 via-[#0A1128]/75 to-[#0d1836]/90" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1128]/92 via-transparent to-[#1e4d7b]/18" />
          </>
        )}
        <div className="relative z-10 flex h-full w-full flex-col justify-between gap-4 p-4 sm:gap-6 sm:p-8">
          <div className="flex min-w-0 w-full flex-1 flex-col justify-between gap-4 sm:gap-6">
            <div className="flex w-full flex-wrap items-start justify-between gap-3">
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
                      {idx < breadcrumbItems!.length - 1 && (
                        <span className="mx-2 font-normal text-white/45">&gt;</span>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <div />
              )}
              {topRight ? <div className="shrink-0">{topRight}</div> : null}
            </div>
            <div
              className={
                titleAlign === "start"
                  ? "w-full max-w-3xl text-left lg:max-w-2xl"
                  : "ml-auto w-full max-w-3xl text-right lg:max-w-xl"
              }
            >
              {pill ? (
                <p className="mb-2 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] text-[#d9ebf8] sm:mb-3 sm:text-xs">
                  <span className="h-2 w-2 shrink-0 rounded-full bg-[#3498DB]" aria-hidden />
                  <span className="min-w-0 truncate">{pill}</span>
                </p>
              ) : null}
              <h1
                className={`font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl lg:text-4xl ${tightenMobileLayout ? "text-xl" : "text-2xl"}`}
              >
                {title}
              </h1>
              {subtitle ? (
                <p
                  className={`mt-1.5 text-sm leading-snug text-white/85 sm:mt-2 sm:text-base sm:leading-normal ${tightenMobileLayout ? "line-clamp-3 lg:line-clamp-none" : ""}`}
                >
                  {subtitle}
                </p>
              ) : null}
              {detail ? <p className="mt-1.5 text-xs text-white/60 sm:text-sm">{detail}</p> : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
