import React from "react";

interface WindowsFolderIconProps {
  size?: number;
  className?: string;
}

/**
 * Windows-style golden/amber folder icon.
 * Features classic warm manila palette (#f59e0b / #fbbf24 / #d97706)
 * matching the default Windows 10/11 File Explorer folder design.
 */
export function WindowsFolderIcon({
  size = 48,
  className = "",
}: WindowsFolderIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 drop-shadow-xs ${className}`}
    >
      <defs>
        {/* Back Plate & Tab Gradient (Deep Warm Manila) */}
        <linearGradient id="winFolderBack" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        {/* Front Flap Gradient (Bright Windows Manila Yellow) */}
        <linearGradient id="winFolderFront" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="25%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        {/* Front Flap Subtle Top Highlight */}
        <linearGradient id="winFolderHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#fef08a" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fde047" stopOpacity="0.4" />
        </linearGradient>

        {/* Inner Paper Shadow */}
        <linearGradient id="winPaperShadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#f1f5f9" />
        </linearGradient>
      </defs>

      {/* Back Plate with Tab (Windows Explorer folder tab on top left) */}
      <path
        d="M4 11C4 8.79086 5.79086 7 8 7H18.5C19.8261 7 21.0979 7.52678 22.0355 8.46447L24.5 10.9289C25.4376 11.8666 26.7094 12.3934 28.0355 12.3934H40C42.2091 12.3934 44 14.1825 44 16.3934V37C44 39.2091 42.2091 41 40 41H8C5.79086 41 4 39.2091 4 37V11Z"
        fill="url(#winFolderBack)"
      />

      {/* White Paper Sheet Inside Peeking Out */}
      <rect
        x="9"
        y="12"
        width="30"
        height="12"
        rx="2"
        fill="url(#winPaperShadow)"
      />
      <rect
        x="13"
        y="15"
        width="16"
        height="1.5"
        rx="0.75"
        fill="#cbd5e1"
      />
      <rect
        x="13"
        y="18.5"
        width="10"
        height="1.5"
        rx="0.75"
        fill="#e2e8f0"
      />

      {/* Front Body Flap (Classic Windows Explorer angled front flap) */}
      <path
        d="M4 18.5C4 16.8431 5.34315 15.5 7 15.5H41C42.6569 15.5 44 16.8431 44 18.5V37C44 39.2091 42.2091 41 40 41H8C5.79086 41 4 39.2091 4 37V18.5Z"
        fill="url(#winFolderFront)"
        stroke="url(#winFolderHighlight)"
        strokeWidth="0.75"
      />
    </svg>
  );
}
