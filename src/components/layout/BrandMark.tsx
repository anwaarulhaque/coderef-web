/** The CodeRef mark (same drawing as public/mark.svg). `gradientId` must be unique on the page. */
export function BrandMark({ size = 24, gradientId, className = "" }: { size?: number; gradientId: string; className?: string }) {
  return (
    <svg viewBox="0 0 128 128" width={size} height={size} aria-hidden className={`shrink-0 ${className}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3b82f6" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
      </defs>
      <rect width="128" height="128" rx="30" fill={`url(#${gradientId})`} />
      <rect x="28" y="28" width="32" height="44" rx="9" fill="#fff" />
      <rect x="68" y="28" width="32" height="24" rx="9" fill="#fff" fillOpacity=".6" />
      <rect x="28" y="80" width="32" height="20" rx="8" fill="#fff" fillOpacity=".6" />
      <rect x="68" y="60" width="32" height="40" rx="9" fill="#fff" />
    </svg>
  );
}
