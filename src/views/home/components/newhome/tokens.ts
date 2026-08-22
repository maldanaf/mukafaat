/**
 * توكنات تصميم الصفحة الرئيسية الجديدة (design_handoff_mukafaat_homepage).
 * تُستخدم في كل أقسام الرئيسية والهيدر والفوتر للحفاظ على إيقاع لوني واحد.
 */
export const PALETTE = [
  { c: "#4C1D95", bg: "#F1EBFB" },
  { c: "#E2680F", bg: "#FEF0E4" },
  { c: "#0E9384", bg: "#E4F5F2" },
  { c: "#C2246E", bg: "#FCE9F1" },
  { c: "#6D28D9", bg: "#F0EAFD" },
  { c: "#B45309", bg: "#FDF1DF" },
  { c: "#1D4ED8", bg: "#E8EEFD" },
] as const;

export const pick = (i: number) => PALETTE[Math.abs(i) % PALETTE.length];

export const TOKENS = {
  purple900: "#2E1065",
  purple800: "#43167F",
  purple700: "#4C1D95",
  purple600: "#5B21B6",
  lilac50: "#F7F4FD",
  lilac100: "#F6F3FC",
  border: "#EDE9F7",
  border2: "#E9E4F5",
  ink: "#17122A",
  inkMuted: "#6B6480",
  inkFaint: "#8B84A0",
  orange600: "#E2680F",
  orange700: "#C2410C",
  warm: "#FFF7F1",
  footerBg: "#17161A",
};

/** الحاوية الأساسية — نفس عرض الموقع الموحّد (--site-max-width في index.css) */
export const CONTAINER = "mx-auto w-full max-w-site px-4 sm:px-6";
