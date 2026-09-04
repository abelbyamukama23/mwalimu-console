"use client";

import Image from "next/image";

export interface MwalimuLogoProps {
  size?: number;
  className?: string;
  priority?: boolean;
  alt?: string;
}

/**
 * Official Mwalimu brand icon / logo mark.
 */
export function MwalimuLogo({
  size = 28,
  className = "",
  priority = false,
  alt = "Mwalimu",
}: MwalimuLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      className={`shrink-0 select-none object-contain ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export default MwalimuLogo;
