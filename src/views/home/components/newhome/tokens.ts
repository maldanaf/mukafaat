/**
 * توكنات أقسام الرئيسية — مشتقّة الآن من نظام تصميم الموقع الموحّد (`@ui`)
 * حتى تبقى الرئيسية والصفحات الداخلية والتطبيق على إيقاع لوني واحد.
 *
 * أُبقيت الأسماء القديمة (`TOKENS.purple700` …) حتى لا تُكسر الأقسام القائمة.
 */
import { MK, PALETTE as UI_PALETTE, pick as uiPick, CONTAINER as UI_CONTAINER } from "@ui";

export const PALETTE = UI_PALETTE;
export const pick = uiPick;

export const TOKENS = {
  purple900: MK.deep,
  purple800: "#33017A",
  purple700: MK.primary,
  purple600: MK.primaryLight,
  lilac50: MK.tint3,
  lilac100: MK.tint2,
  border: MK.border,
  border2: MK.border2,
  ink: MK.text,
  inkMuted: MK.textSecondary,
  inkFaint: MK.textMuted,
  orange600: MK.accent,
  orange700: MK.accentDark,
  warm: "#FFF7F1",
  footerBg: "#17161A",
};

/** الحاوية الأساسية — نفس عرض الموقع الموحّد (--site-max-width في index.css) */
export const CONTAINER = UI_CONTAINER;
