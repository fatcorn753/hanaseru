import type { ReactNode } from "react";

/** 線のアイコン(fatcorn753-design の規則: 線幅 1.75、色は文字色に従う) */
function Svg({ children, size }: { children: ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const IconHome = () => (
  <Svg><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M10 21v-6h4v6" /></Svg>
);
export const IconFlask = () => (
  <Svg><path d="M9 3h6" /><path d="M10 3v6.5L4.5 19a1.5 1.5 0 0 0 1.3 2h12.4a1.5 1.5 0 0 0 1.3-2L14 9.5V3" /><path d="M7 15h10" /></Svg>
);
export const IconChat = () => (
  <Svg><path d="M21 11.5a8.5 8.5 0 0 1-12.6 7.4L3 20.5l1.6-5.2A8.5 8.5 0 1 1 21 11.5Z" /></Svg>
);
export const IconWind = () => (
  <Svg><path d="M3 8h11a3 3 0 1 0-3-3" /><path d="M3 12h16a3 3 0 1 1-3 3" /><path d="M3 16h7" /></Svg>
);
export const IconChart = () => (
  <Svg><path d="M3 20h18" /><path d="M6 20v-8" /><path d="M12 20V5" /><path d="M18 20v-5" /></Svg>
);
export const IconCheck = ({ size = 16 }: { size?: number }) => (
  <Svg size={size}><circle cx="12" cy="12" r="9" /><path d="m8.5 12.5 2.5 2.5 5-5.5" /></Svg>
);
export const IconStar = ({ size = 14 }: { size?: number }) => (
  <Svg size={size}><path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9L12 3.5Z" /></Svg>
);
export const IconInfo = () => (
  <Svg><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5" /><path d="M12 7.5h.01" /></Svg>
);
export const IconAlert = () => (
  <Svg><path d="M12 4 2.8 19.5h18.4L12 4Z" /><path d="M12 10v4.5" /><path d="M12 17.5h.01" /></Svg>
);
