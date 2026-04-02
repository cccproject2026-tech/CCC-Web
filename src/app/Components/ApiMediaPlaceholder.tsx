/** Neutral placeholder when the API does not provide an image URL. */

export function ApiImagePlaceholder({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-white/10 text-[#8ec5eb] ${className}`}
      role="img"
      aria-label="No image"
    >
      <i className="fa-regular fa-image text-2xl" aria-hidden />
    </div>
  );
}

export function ApiAvatarPlaceholder({
  label,
  className = "",
}: {
  /** e.g. first name or email — first character only, from API */
  label?: string;
  className?: string;
}) {
  const ch = label?.trim()?.[0]?.toUpperCase();
  return (
    <div
      className={`flex items-center justify-center bg-white/15 text-sm font-semibold text-white ${className}`}
      aria-hidden
    >
      {ch ? ch : <i className="fa-solid fa-user text-lg opacity-80" />}
    </div>
  );
}
