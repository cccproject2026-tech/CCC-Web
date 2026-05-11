/**
 * Mentor module — shared visual tokens (Tailwind class strings).
 * Accent #3498DB aligns with the director Revitalization Roadmap dashboard; RoleShell `variant="mentor"` supplies #0A1128 base.
 */

/** Root: fills RoleShell (transparent so dashboard / default shell shows through). */
export const mentorPageRoot =
  "flex min-h-screen flex-col bg-transparent font-[Albert_Sans] text-white antialiased";

/** Main band under hero (classic mentor pages); roadmap hub uses transparent main instead. */
export const mentorMainGradient =
  "relative z-10 flex-1 bg-[radial-gradient(circle_at_18%_8%,rgba(141,211,243,0.24),transparent_34%),radial-gradient(circle_at_82%_22%,rgba(245,204,118,0.18),transparent_35%),linear-gradient(180deg,#041f35_0%,#062946_100%)]";

/** Revitalization Roadmap hub — no second gradient over dashboard RoleShell. */
export const mentorRoadmapHubMain = "relative z-10 flex-1 bg-transparent";

/**
 * Vertical rhythm only — mentor `layout.tsx` uses no outer margin/padding; pages are full width unless they add their own inset.
 */
export const mentorContainer = "w-full py-8 sm:py-8 md:py-10";

/** Hero overlay on roadmap-bg / hero images */
export const mentorHeroOverlay =
  "absolute inset-0 bg-[radial-gradient(circle_at_18%_10%,rgba(141,211,243,0.22),transparent_36%),linear-gradient(180deg,rgba(4,31,53,0.82)_0%,rgba(6,41,70,0.9)_100%)]";

export const mentorEyebrowPill =
  "inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-[#d9ebf8]";

export const mentorEyebrowDot = "h-2 w-2 rounded-full bg-[#3498DB]";

export const mentorSpinner =
  "h-12 w-12 animate-spin rounded-full border-4 border-[#3498DB] border-t-transparent";

/** Row: search + filters (stacks on mobile) */
export const mentorControlsRow =
  "mb-8 flex flex-col items-stretch justify-between gap-4 lg:flex-row lg:items-center";

/** Pill search — same geometry as pastor module */
export const mentorSearchBarWrap =
  "flex w-full min-w-0 items-center rounded-full border border-white/20 bg-white/10 px-4 py-2.5 shadow-sm backdrop-blur lg:max-w-md";

export const mentorSearchIcon = "fa-solid fa-magnifying-glass mr-3 shrink-0 text-[#3498DB]";

export const mentorSearchInput =
  "min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-[#cde2f2] outline-none";

/** Assessments-style search (absolute icon) */
export const mentorSearchAbsoluteShell = "relative w-full";

export const mentorSearchIconAbsolute =
  "fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 z-[1] -translate-y-1/2 text-sm text-[#cde2f2]";

export const mentorSearchInputAbsolute =
  "w-full rounded-xl border border-white/20 bg-white/10 py-2 pl-10 pr-4 text-sm text-white shadow-sm outline-none backdrop-blur placeholder:text-[#cde2f2] focus:ring-2 focus:ring-[#3498DB]";

/** Filter pill tabs */
export const mentorFilterStrip =
  "flex min-w-0 flex-1 items-center overflow-x-auto rounded-xl border border-white/20 bg-white/10 px-2 py-1 shadow-sm backdrop-blur lg:flex-none";

export const mentorFilterTabBase =
  "whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-all sm:px-4 sm:text-sm";

/** Dashboard-style tab (Revitalization hub). */
export const mentorFilterTabActiveDashboard =
  "border-[#3498DB]/40 bg-[#3498DB]/20 text-white ring-1 ring-[#3498DB]/35 shadow-sm";

export const mentorFilterTabIdleDashboard = "border-transparent text-[#d9ebf8] hover:bg-white/10";

export const mentorFilterTabActive = "bg-white text-[#0f4a76]";

export const mentorFilterTabIdle = "text-[#d9ebf8] hover:bg-white/15";

/**
 * Primary list card — horizontal roadmap / assignment (matches Revitalization Roadmap mentor cards).
 */
export const mentorGlassCardRoadmap =
  "flex w-full flex-col overflow-hidden rounded-2xl border border-[#3498DB]/25 bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_100%)] backdrop-blur-xl shadow-[0_8px_40px_rgba(3,24,43,0.45)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#3498DB]/40 hover:shadow-[0_12px_48px_rgba(3,24,43,0.5)] sm:flex-row";

/**
 * Frosted glass — dashboard tiles (mentor home quick links, etc.)
 */
export const mentorGlassCardFrost =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.04)_100%)] backdrop-blur-xl shadow-[0_8px_40px_rgba(3,24,43,0.4)] transition-all duration-300 hover:border-white/25 hover:shadow-[0_12px_48px_rgba(3,24,43,0.45)]";

/** Filter toolbar panel (search + tabs grouped) */
export const mentorFilterPanel =
  "rounded-2xl border border-white/15 bg-white/5 p-4 shadow-sm backdrop-blur-sm sm:p-5";

export const mentorFieldLabel = "mb-1.5 block text-xs font-medium text-[#d9ebf8]";

export const mentorSelectDark =
  "w-full rounded-xl border border-white/20 bg-[#062946] px-3 py-2.5 text-sm text-white outline-none focus:border-[#3498DB]/50 focus:ring-2 focus:ring-[#3498DB]/30 [&>option]:bg-[#062946] [&>option]:text-white";

export const mentorDateInputDark =
  "w-full rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-sm text-white outline-none [color-scheme:dark] focus:border-[#3498DB]/50 focus:ring-2 focus:ring-[#3498DB]/30";

/** Dashboard primary CTA on dark glass (#3498DB). */
export const mentorPrimaryCtaDashboard =
  "rounded-lg border border-[#3498DB]/45 bg-[#3498DB]/20 px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-[#3498DB]/32";

export const mentorPrimaryCta =
  "rounded-lg bg-white px-5 py-2 text-sm font-semibold text-[#0f4a76] transition hover:bg-[#e7f1fa]";

export const mentorSecondaryCta =
  "rounded-lg border border-white/25 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/15";

export const mentorIconButton =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#d9ebf8] shadow-sm transition hover:bg-white/20";

export const mentorEmptyPanel =
  "rounded-2xl border border-white/15 bg-white/5 p-8 text-center text-sm text-[#cde2f2]";

export const mentorWarningPanel =
  "rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-center text-sm text-amber-100";

/** Body copy on dark glass */
export const mentorBodyText =
  "font-[Albert_Sans] text-sm font-normal leading-relaxed text-[#cde2f2]";

export const mentorMutedText = "text-sm text-[#d9ebf8]/90";

/** Modal — dark scrim + white content panel (mentor popups match director/pastor) */
export const mentorModalOverlay =
  "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]";

export const mentorModalPanel =
  "relative w-full max-w-[480px] rounded-2xl border border-white/10 bg-white p-6 shadow-2xl";

export const mentorModalHeader =
  "mb-4 flex items-start justify-between gap-3 border-b border-gray-100 pb-4";

export const mentorModalTitle = "text-lg font-semibold text-[#0B1C58] pr-2";

export const mentorModalCloseBtn =
  "rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800";

export const mentorModalFooter = "mt-6 flex flex-col-reverse gap-2 border-t border-gray-100 pt-4 sm:flex-row sm:justify-end sm:gap-3";

export const mentorModalBtnPrimary =
  "w-full rounded-lg bg-[#103C8C] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0A2F70] sm:w-auto";

export const mentorModalBtnSecondary =
  "w-full rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-[#0B1C58] transition hover:bg-gray-50 sm:w-auto";

/** Breadcrumb text on hero */
export const mentorBreadcrumbText = "text-sm text-[#d9ebf8] hover:text-white transition-colors";
