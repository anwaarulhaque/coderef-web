"use client";

import { type ComponentProps, type ReactNode, useEffect, useRef, useState } from "react";

/**
 * A screenshot that steps aside when it cannot load (missing file, blocked request), so the default
 * design preview shows instead of a broken image. Also catches failures that happen before hydration.
 */
export function ShotImage({ fallback = null, onFail, ...props }: ComponentProps<"img"> & { fallback?: ReactNode; onFail?: () => void }) {
  const ref = useRef<HTMLImageElement>(null);
  const [failed, setFailed] = useState(false);
  const fail = () => {
    setFailed(true);
    onFail?.();
  };

  useEffect(() => {
    const img = ref.current;
    // The error fired before React was listening.
    if (img?.complete && img.naturalWidth === 0) fail();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- checked once, on mount
  }, []);

  if (failed) return fallback;
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text -- static export, pre-sized webp; alt comes from props
  return <img ref={ref} {...props} onError={fail} />;
}
