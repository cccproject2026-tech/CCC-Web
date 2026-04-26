/**
 * Pastor module — shared visual tokens (Tailwind class strings).
 * Use these for cards, filters, search, modals, and page shells so screens stay aligned.
 */

/** Root layout: full-height navy shell + Albert Sans (default for authenticated pastor pages). */
export const pastorPageRoot =
  "flex min-h-screen flex-col bg-[#062946] font-[Albert_Sans] text-white";

/** Main content band under hero (radial accents + deep navy gradient). */
export const pastorMainGradient =
  "relative z-10 flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)]";

/** Horizontal padding + max width for list pages. */
export const pastorContainer =
  "mx-auto w-full max-w-7xl px-4 py-8 sm:px-8 md:px-16 md:py-10";

/** Hero overlay on top of background image. */
export const pastorHeroOverlay =
  "absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]";

/** “Leadership Support Network” pill. */
export const pastorEyebrowPill =
  "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]";

export const pastorEyebrowDot = "h-2 w-2 rounded-full bg-[#8ec5eb]";

/** Standard loading spinner on navy background. */
export const pastorSpinner =
  "h-12 w-12 animate-spin rounded-full border-4 border-[#8ec5eb] border-t-transparent";

/** Row: search + filter controls (stacks on mobile). */
export const pastorControlsRow =
  "mb-8 flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center";

/** Glass search field wrapper (icon + input) — pill shape to match pastor roadmap reference. */
export const pastorSearchBarWrap =
  "flex w-full min-w-0 items-center rounded-full border border-white/20 bg-white/10 px-4 py-2.5 shadow-sm backdrop-blur lg:max-w-md";

export const pastorSearchIcon = "fa-solid fa-magnifying-glass mr-3 shrink-0 text-[#8ec5eb]";

export const pastorSearchInput =
  "min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-[#cde2f2] outline-none";

/** Search with icon absolutely positioned (Assessments-style). */
export const pastorSearchAbsoluteShell = "relative w-full";

export const pastorSearchIconAbsolute =
  "fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 z-[1] -translate-y-1/2 text-sm text-[#cde2f2]";

export const pastorSearchInputAbsolute =
  "w-full rounded-xl border border-white/20 bg-white/10 py-2 pl-10 text-sm text-white shadow-sm outline-none backdrop-blur placeholder:text-[#cde2f2] focus:ring-2 focus:ring-[#8ec5eb]";

/** Horizontal pill filter tabs. */
export const pastorFilterStrip =
  "flex min-w-0 flex-1 items-center overflow-x-auto rounded-xl border border-white/20 bg-white/10 px-2 py-1 shadow-sm backdrop-blur lg:flex-none";

export const pastorFilterTabBase =
  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:text-sm";

export const pastorFilterTabActive = "bg-white text-[#0f4a76]";

export const pastorFilterTabIdle = "text-[#d9ebf8] hover:bg-white/15";

/** Primary roadmap/assessment glass card (image + body). */
export const pastorGlassCard =
  "flex flex-col overflow-hidden rounded-2xl border border-[#8ec5eb]/25 bg-[linear-gradient(180deg,rgba(12,58,95,0.9)_0%,rgba(10,53,88,0.95)_100%)] shadow-[0_8px_32px_rgba(2,20,40,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#8ec5eb]/35 hover:shadow-[0_12px_40px_rgba(2,24,48,0.5)] sm:flex-row";

/** Empty / notice panel on dark background. */
export const pastorEmptyPanel =
  "rounded-2xl border border-white/15 bg-white/5 p-8 text-center text-sm text-[#cde2f2]";

/** Primary CTA (View, Next, etc.) on dark pages. */
export const pastorPrimaryCta =
  "rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#0f4a76] transition hover:bg-[#e7f1fa]";

/** Secondary icon button (refresh). */
export const pastorIconButton =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#d9ebf8] shadow-sm transition hover:bg-white/20";

/** Form label on dark glass (filters). */
export const pastorFieldLabel = "mb-1.5 block text-xs font-medium text-[#d9ebf8]";

/** Dark select / native input on glass pages. */
export const pastorDarkSelect =
  "w-full rounded-xl border border-white/20 bg-[#062946] px-3 py-2 text-sm text-white outline-none focus:border-[#8ec5eb]/50 [&>option]:bg-[#062946] [&>option]:text-white";

export const pastorDarkDateInput =
  "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-sm text-[#0f4a76] outline-none focus:ring-2 focus:ring-[#8ec5eb]";

/** Modal — overlay (pastor-facing popups on dark sites often use white panel). */
export const pastorModalOverlay =
  "fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4";

export const pastorModalPanel =
  "w-full max-w-[420px] rounded-xl bg-white p-6 shadow-2xl";

export const pastorModalHeader =
  "mb-4 flex items-center justify-between border-b border-gray-100 pb-4 text-[16px] font-semibold text-[#0B1C58]";

export const pastorModalFooter = "mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4";

export const pastorModalBtnSecondary =
  "rounded-md border border-gray-300 px-5 py-2 text-sm text-[#0B1C58] hover:bg-gray-50";

export const pastorModalBtnPrimary =
  "rounded-md bg-[#103C8C] px-6 py-2 text-sm font-medium text-white hover:bg-[#0A2F70]";

/** Light dashboard card (legacy / white context). */
export const pastorCardLight =
  "overflow-hidden rounded-2xl border border-[#E5EAF1] bg-white shadow-md transition-all duration-300 hover:shadow-xl";

// ─── Roadmap / phase description copy (Albert Sans, one body style module-wide) ─

/** Default: dark glass / navy cards (#062946 family). */
export const pastorRoadmapDescription =
  "font-[Albert_Sans] text-sm font-normal leading-relaxed tracking-normal text-[#cde2f2] antialiased";

/** Same as above but preserves line breaks / numbered lists from API text. */
export const pastorRoadmapDescriptionPre =
  "font-[Albert_Sans] text-sm font-normal leading-relaxed tracking-normal text-[#cde2f2] antialiased whitespace-pre-line";

/** Card grids where space is tight — max 2 lines. */
export const pastorRoadmapDescriptionLineClamp2 = `${pastorRoadmapDescription} line-clamp-2`;

/** Card grids — max 3 lines. */
export const pastorRoadmapDescriptionLineClamp3 = `${pastorRoadmapDescription} line-clamp-3`;

/** Jumpstart / overview panel: light text, preserve line breaks. */
export const pastorRoadmapDescriptionOverview =
  "font-[Albert_Sans] text-sm font-normal leading-relaxed text-white/90 antialiased whitespace-pre-line";

/** Roadmap-detail & blue-tint panels (older gradient pages). */
export const pastorRoadmapDescriptionOnBluePanel =
  "font-[Albert_Sans] text-sm font-normal leading-relaxed text-white/95 antialiased";

/** White-card contexts (e.g. community tiles). */
export const pastorRoadmapDescriptionLight =
  "font-[Albert_Sans] text-sm font-normal leading-relaxed text-[#4b5563] antialiased";
