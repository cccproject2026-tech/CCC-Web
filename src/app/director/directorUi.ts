/** Shared design tokens for director routes (RoleShell background). */

export const directorGlassCard =
  "rounded-2xl border border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.1)_0%,rgba(255,255,255,0.04)_100%)] backdrop-blur-xl shadow-[0_8px_40px_rgba(3,24,43,0.4)]";

export const directorGlassCardHover =
  "transition-all duration-300 hover:border-white/25 hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.06)_100%)] hover:shadow-[0_12px_48px_rgba(3,24,43,0.45)]";

/** Single-line fields on glass surfaces (forms, filters beside search). */
export const directorInputClass =
  "w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 text-[15px] text-white placeholder:text-white/45 outline-none focus:border-[#8ec5eb]/50 focus:ring-1 focus:ring-[#8ec5eb]/30";

/**
 * Search inputs on dark glass (icon is absolutely positioned with pl-11 in SearchBar).
 * Keep in sync with `SearchBar` variant="dark".
 */
export const directorSearchInputClass =
  "w-full rounded-lg border border-white/20 bg-white/10 px-4 py-3 pl-11 text-[15px] text-white placeholder:text-white/45 outline-none focus:border-[#8ec5eb]/50 focus:ring-1 focus:ring-[#8ec5eb]/30";

export const directorSearchIconClass =
  "fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8ec5eb]/70 text-sm";

/** Standard content width used across director screens. */
export const directorPageContainer = "mx-auto w-full max-w-[1400px]";

/** Fills director `main` so footers with `mt-auto` sit at the bottom on short pages. */
export const directorPageRoot =
  "flex min-h-0 flex-1 flex-col bg-transparent font-[Albert_Sans] text-white";

/** Filter / toolbar strip: glass card + consistent padding + responsive inner row. */
export const directorFilterSectionClass = `mb-8 p-5 sm:p-6 ${directorGlassCard}`;
export const directorFilterSectionRow =
  "flex flex-col items-stretch justify-between gap-4 md:flex-row md:items-center";

/** Default width for primary search on filter bars (matches mentees/mentors). */
export const directorSearchBarWidth = "min-w-0 w-full md:max-w-md";

/** Form labels on glass. */
export const directorLabelClass = "mb-1.5 block text-[13px] font-semibold text-white/85 sm:text-sm";

/** Select-styled triggers (custom dropdowns). */
export const directorSelectTriggerClass =
  "flex w-full min-w-[160px] items-center justify-between gap-3 rounded-lg border border-white/15 bg-white/10 px-4 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all hover:bg-white/15 sm:min-w-[180px] sm:text-[14px]";

/** Primary / secondary actions in filter toolbars (accent aligns with dashboard #3498DB). */
export const directorBtnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-[#3498DB]/45 bg-[#3498DB]/20 px-6 py-3 text-[15px] font-semibold text-white shadow-md transition hover:bg-[#3498DB]/32 disabled:cursor-not-allowed disabled:opacity-50";

export const directorBtnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-[15px] font-semibold text-white shadow-md transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50";

export const directorIconButton =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-[#8ec5eb] shadow-sm transition-all hover:bg-white/15";

/** List cards: shared corner radius with glass cards. */
export const directorListCardRadius = "rounded-2xl";

/** Loading spinner on dark backgrounds. */
export const directorSpinner =
  "h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[#8ec5eb]";

/** Modal: backdrop + centered panel (light surfaces for readability). */
export const directorModalBackdropClass =
  "fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 animate-fade-in";

export const directorModalPanelClass =
  "relative w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl";

export const directorModalCloseButtonClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-800";

/** Slide-over panel (e.g. assign flows). */
export const directorSlideOverBackdropClass =
  "fixed inset-0 z-[100] flex justify-end bg-black/50 animate-fade-in";

export const directorSlideOverPanelClass =
  "flex h-full w-full max-w-md flex-col bg-white shadow-2xl animate-slide-left";

/** Inputs on white modal / slide-over bodies. */
export const directorModalInputClass =
  "w-full rounded-lg border border-gray-200 bg-white py-3 pl-12 pr-4 text-[15px] text-gray-900 placeholder:text-gray-400 outline-none focus:border-[#2E3B8E]/40 focus:ring-2 focus:ring-[#2E3B8E]/20";

export const directorModalBtnPrimaryClass =
  "w-full rounded-lg bg-[#2E3B8E] px-6 py-3 font-semibold text-white transition hover:bg-[#1F2A6E] disabled:cursor-not-allowed disabled:opacity-50";

/** Toast/snackbar on director pages. */
export const directorToastClass =
  "rounded-xl border border-gray-100 bg-white px-6 py-4 shadow-2xl flex items-center gap-3";
