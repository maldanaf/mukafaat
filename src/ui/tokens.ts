/**
 * ===== نظام تصميم «مكافآت» للموقع =====
 *
 * مصدر واحد لكل الألوان والتباعد وأنصاف الأقطار والظلال ومقاسات الخط في الموقع،
 * مطابق للغة تصميم تطبيق العميل (`HomeTokens` في
 * `mokafat-flutter-client/lib/core/config/theme/app_colors.dart`).
 *
 * الهوية: بنفسجي أساسي `#400198` + برتقالي الشعار `#FD671A` للتمييز،
 * أسطح بيضاء على خلفية `#F5F4FA`، حواف 18–20px وظلال بنفسجية ناعمة.
 *
 * تُستخدم هذه التوكنات بثلاث طرق:
 *  1) من TS مباشرة: `MK.primary`
 *  2) من Tailwind: `bg-mk-primary` / `rounded-mk-lg` / `shadow-mk-card`
 *  3) من CSS خام: `var(--mk-primary)` (معرّفة في `src/index.css`)
 */

/** ألوان الهوية والأسطح — نفس قيم التطبيق حرفياً */
export const MK = {
  // الهوية
  primary: "#400198",
  primaryLight: "#6703EB",
  primarySoft: "#7C4DE0",
  accent: "#FD671A",
  accentDark: "#D9500B",

  // بنفسجي داكن (خلفيات الأقسام والبانرات)
  deep: "#2B1B5E",
  deepest: "#1B1150",
  lilac: "#D6CBFF",
  lilac2: "#C3B6EA",

  // ذهبي VIP
  gold: "#F7B62C",
  goldText: "#F7E6BD",
  goldOnGold: "#241A04",
  vipDark1: "#1A1408",
  vipDark2: "#3A2C0C",
  vipDark3: "#5C4410",

  // حالات
  red: "#E8384F",
  green: "#12A06A",
  amber: "#E2680F",
  info: "#1D4ED8",

  // أسطح وحدود
  pageBg: "#F5F4FA",
  surface: "#FFFFFF",
  tint: "#EFEAF8",
  tint2: "#F2EFFA",
  tint3: "#F7F5FC",
  border: "#EFEDF7",
  border2: "#ECE9F5",
  borderStrong: "#DED7F2",
  divider: "#ECEAF4",
  dotIdle: "#CFCADE",

  // نصوص
  text: "#1A1A2E",
  textStrong: "#4A4A63",
  textSecondary: "#6B6B85",
  textMuted: "#9A99B0",
  onPrimary: "#FFFFFF",

  /* ===== إضافات الاتجاه «الحيوي التجاري» ===== */
  /** برتقالي فاتح — بداية تدرّج الخصم */
  accentLight: "#FFA23A",
  /** أحمر دافئ — نهاية تدرّج الخصم والعروض المستعجلة */
  hot: "#E01F3D",
  /** وردي حار — شارات «الأكثر طلباً» */
  hotPink: "#FF4D6D",
  /** أخضر فاتح — بداية تدرّج النجاح */
  greenLight: "#22C55E",
  /** حالات صريحة (اسم واضح بجانب الألوان القديمة) */
  success: "#12A06A",
  warning: "#E2680F",
  danger: "#E8384F",
  /** أسطح دافئة للأقسام التجارية */
  warmBg: "#FFF7F1",
  warmTint: "#FEF0E4",
} as const;

/**
 * تدرّجات الهوية — العمود الفقري للاتجاه «الحيوي التجاري».
 * تُستخدم من TS (`GRADIENT.accent`) ومن CSS (`.mk-grad-accent`)
 * ومن Tailwind (`bg-mk-grad-accent`).
 */
export const GRADIENT = {
  /** بنفسجي → بنفسجي فاتح (الأزرار الرئيسية والتبويبات النشطة) */
  brand: "linear-gradient(135deg,#400198 0%,#6703EB 100%)",
  /** بنفسجي عميق → فاتح (الهيرو والأسطح الكبيرة) */
  brandDeep: "linear-gradient(135deg,#1B1150 0%,#400198 52%,#6703EB 100%)",
  /** برتقالي → أحمر دافئ (شارات الخصم وأزرار الفعل) */
  accent: "linear-gradient(135deg,#FFA23A 0%,#FD671A 45%,#E01F3D 100%)",
  /** برتقالي مضغوط (شارة صغيرة) */
  accentTight: "linear-gradient(135deg,#FD671A 0%,#E2560D 100%)",
  /** وردي حار (الأكثر طلباً) */
  hot: "linear-gradient(135deg,#FF4D6D 0%,#C2185B 100%)",
  /** ذهبي VIP */
  gold: "linear-gradient(135deg,#F7B62C 0%,#E08A0B 100%)",
  /** أخضر النجاح */
  success: "linear-gradient(135deg,#22C55E 0%,#12A06A 100%)",
  /** ليل بنفسجي — خلفيات الأقسام الداكنة */
  night: "linear-gradient(160deg,#1B1150 0%,#2B1B5E 45%,#43167F 100%)",
  /** فاتح جداً — خلفيات الأقسام الهادئة */
  mist: "linear-gradient(180deg,#FFFFFF 0%,#F7F5FC 22%,#F4F1FC 100%)",
  /** دافئ — خلفية أقسام المطاعم والعروض السريعة */
  warm: "linear-gradient(180deg,#FFFFFF 0%,#FFF7F1 24%,#FFF1E6 100%)",
} as const;

/** أنصاف الأقطار — الكرت 18px والبانر 20px كما في التطبيق */
export const RADIUS = {
  xs: "8px",
  sm: "10px",
  md: "14px",
  lg: "18px",
  xl: "20px",
  "2xl": "24px",
  pill: "999px",
} as const;

/** ظلال بنفسجية ناعمة — لا ظل رمادي في أي مكان */
export const SHADOW = {
  card: "0 2px 8px rgba(64, 1, 152, 0.04)",
  raised: "0 3px 10px rgba(64, 1, 152, 0.06)",
  hover: "0 12px 30px rgba(46, 16, 101, 0.10)",
  float: "0 16px 40px rgba(46, 16, 101, 0.14)",
  bar: "0 -4px 16px rgba(64, 1, 152, 0.06)",

  /* ===== توهّج ملوّن للاتجاه الحيوي ===== */
  /** توهّج بنفسجي تحت الأزرار الرئيسية */
  glow: "0 14px 32px -10px rgba(64, 1, 152, 0.55)",
  /** توهّج برتقالي تحت أزرار الفعل وشارات الخصم */
  glowAccent: "0 14px 32px -10px rgba(226, 86, 13, 0.65)",
  /** رفع الكرت عند المرور */
  pop: "0 22px 48px -18px rgba(46, 16, 101, 0.42)",
  /** شارة صغيرة بارزة */
  badge: "0 8px 20px -6px rgba(226, 86, 13, 0.85)",
} as const;

/** إيقاع الحركة — 150–250ms للانتقالات القصيرة */
export const MOTION = {
  fast: "150ms",
  base: "200ms",
  slow: "250ms",
  image: "500ms",
  ease: "cubic-bezier(0.22, 0.61, 0.36, 1)",
  /** أصناف Tailwind جاهزة للانتقال القياسي */
  tw: "transition-all duration-200 ease-out",
} as const;

/** إيقاع تباعد ثابت (4px grid) */
export const SPACE = {
  0.5: "2px",
  1: "4px",
  1.5: "6px",
  2: "8px",
  2.5: "10px",
  3: "12px",
  3.5: "14px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
} as const;

/** مقاسات الخط — سلّم واحد لكل الموقع */
export const FONT = {
  caption: "text-[11px]",
  small: "text-[12px]",
  body: "text-[13px]",
  bodyLg: "text-[14px]",
  subtitle: "text-[15px]",
  title: "text-[17px]",
  h3: "text-[20px]",
  h2: "text-[20px] sm:text-[26px]",
  h1: "text-[26px] sm:text-[34px]",

  /* ===== سلّم الاتجاه الحيوي: عناوين أكبر وأثقل ===== */
  /** عنوان قسم كبير وثقيل */
  section: "text-[23px] sm:text-[31px] font-extrabold tracking-[-0.015em]",
  /** عنوان قسم مصغّر */
  sectionSm: "text-[19px] sm:text-[23px] font-extrabold tracking-[-0.01em]",
  /** عنوان كرت متوسط */
  cardTitle: "text-[14.5px] font-bold leading-snug",
  /** نص ثانوي أخف */
  meta: "text-[12px] font-medium",
  /** رقم السعر — أثقل وأكبر */
  price: "text-[19px] font-extrabold tracking-[-0.01em]",
} as const;

/** الحاوية الموحّدة — نفس عرض الموقع (`--site-max-width`) */
export const CONTAINER = "mx-auto w-full max-w-site px-4 sm:px-6";

/** إيقاع رأسي موحّد بين أقسام الصفحة */
export const SECTION = "pt-9 sm:pt-11";

/** هدف لمس ≥44px — يُضاف لكل زر أيقوني صغير */
export const TAP = "min-h-[44px] min-w-[44px]";

/** حلقة تركيز لوحة المفاتيح الموحّدة */
export const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#400198] focus-visible:ring-offset-2";

/**
 * لوحة ألوان دوّارة للعناصر المتكررة (شرائح التصنيفات، نسب الخصم…)
 * أول لون هو البنفسجي الأساسي حتى تبقى الهوية مسيطرة.
 */
export const PALETTE = [
  { c: MK.primary, bg: "#F1EBFB" },
  { c: MK.accent, bg: "#FEF0E4" },
  { c: "#0E9384", bg: "#E4F5F2" },
  { c: "#C2246E", bg: "#FCE9F1" },
  { c: MK.primaryLight, bg: "#F0EAFD" },
  { c: "#B45309", bg: "#FDF1DF" },
  { c: MK.info, bg: "#E8EEFD" },
] as const;

export const pick = (i: number) => PALETTE[Math.abs(i) % PALETTE.length];

/**
 * لون عنصر من اللوحة إن ضُبط، وإلا لون ثابت مشتقّ من معرّفه.
 *
 * مهم: لا نشتقّ من **ترتيب** العنصر في القائمة، لأن إضافة تصنيف في المنتصف
 * أو تغيير الترتيب كان يُبدّل ألوان كل ما بعده. الاشتقاق من المعرّف يُبقي
 * لون التصنيف ثابتاً مدى الحياة.
 */
export function paletteFor(
  serverColor: unknown,
  id: string | number | null | undefined,
): { c: string; bg: string } {
  const custom = normalizeHex(serverColor);
  if (custom) return { c: custom, bg: `${custom}1A` }; // 1A ≈ 10% شفافية

  const key = String(id ?? "");
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

/** يحوّل `#RRGGBB` (أو `#AARRGGBB` القادم من الباك-إند) إلى `#RRGGBB` صالح للويب */
export function normalizeHex(value: unknown): string | null {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  let hex = raw.replace(/^#/, "");
  // #AARRGGBB (صيغة فلاتر) → نأخذ RGB ونحوّل الشفافية لاحقاً
  if (hex.length === 8) hex = hex.slice(2);
  if (hex.length === 3) {
    hex = hex
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  return `#${hex.toUpperCase()}`;
}

/** هل اللون شفاف تماماً؟ (`#00000000` تعني «زر بإطار» في إعدادات اللوحة) */
export function isTransparentHex(value: unknown): boolean {
  const raw = typeof value === "string" ? value.trim().replace(/^#/, "") : "";
  return raw.length === 8 && raw.slice(0, 2).toLowerCase() === "00";
}
