"use client";

import type { IconType } from "react-icons";
import {
  LuBadgePercent,
  LuBell,
  LuClock,
  LuCreditCard,
  LuCrown,
  LuFlame,
  LuGem,
  LuGift,
  LuMapPin,
  LuMegaphone,
  LuPercent,
  LuShoppingBag,
  LuShoppingCart,
  LuSparkles,
  LuStar,
  LuTicketPercent,
  LuTruck,
  LuWallet,
} from "react-icons/lu";
import { Link } from "@/lib/router-compat";
import { promoHref, isExternalPromo } from "@ui";
import type { PromoDestination } from "@ui";
import { useWebHome } from "@hooks/api/useMokafaatQueries";

/** إعلان واحد كما ترسله اللوحة في `/api/web/home → data.announcement_bar.items` */
export interface AnnouncementItem {
  id: number;
  text: string;
  /** مفتاح أيقونة من المجموعة المسمّاة في اللوحة (أو `none`) */
  icon?: string | null;
  /** لون مميّز اختياري — فارغ = يرث ألوان تدرّج الشريط */
  color?: string | null;
  destination?: PromoDestination | null;
}

/** إعدادات شريط الإعلانات العلوي من `/api/web/home → data.announcement_bar` */
export interface AnnouncementBarConfig {
  enabled?: boolean;
  /** ثوانٍ لكل إعلان — تتحكّم بسرعة حركة الشريط */
  interval_seconds?: number;
  items?: AnnouncementItem[];
}

/** مجموعة الأيقونات المسمّاة في اللوحة → أيقونات lucide */
const ICONS: Record<string, IconType> = {
  discount: LuBadgePercent,
  percent: LuPercent,
  coupon: LuTicketPercent,
  gift: LuGift,
  card: LuCreditCard,
  shipping: LuTruck,
  fire: LuFlame,
  star: LuStar,
  bell: LuBell,
  diamond: LuGem,
  cart: LuShoppingCart,
  bag: LuShoppingBag,
  clock: LuClock,
  sparkles: LuSparkles,
  wallet: LuWallet,
  crown: LuCrown,
  location: LuMapPin,
};

/** أيقونة الإعلان — `none` أو مفتاح غير معروف = بلا أيقونة */
const iconFor = (key?: string | null): IconType | null => {
  if (!key || key === "none") return null;
  return ICONS[key] ?? LuMegaphone;
};

const DEFAULT_INTERVAL = 11;

/**
 * شريط الإعلانات العلوي — أول ما تراه العين: تدرّج الهوية + رسائل قصيرة
 * يديرها الأدمن من لوحة التحكم (نص/أيقونة/لون/وجهة/ترتيب/فترة عرض).
 * تتحرّك ببطء بالسرعة المضبوطة في اللوحة، تتوقّف عند المرور،
 * ومعطّلة الحركة مع `prefers-reduced-motion`.
 */
const AnnouncementBar: React.FC = () => {
  const { data: homeData } = useWebHome();

  const home = (homeData as Record<string, any>)?.data ?? {};
  const bar = (home.announcement_bar ?? null) as AnnouncementBarConfig | null;

  const items = (bar?.items ?? []).filter((item) => !!item?.text?.trim());

  // معطّل من اللوحة أو بلا إعلانات سارية = لا شريط إطلاقاً
  if (!bar?.enabled || items.length === 0) return null;

  // سرعة التبديل بالثواني لكل إعلان → مدة دورة الشريط كاملة
  const interval = Number(bar.interval_seconds) > 0
    ? Number(bar.interval_seconds)
    : DEFAULT_INTERVAL;
  const duration = Math.max(6, interval * items.length);

  const message = (item: AnnouncementItem, cloned: boolean) => {
    const Icon = iconFor(item.icon);
    const href = promoHref(item.destination);
    const external = isExternalPromo(item.destination);

    const content = (
      <>
        {Icon ? (
          <Icon
            size={14}
            className="shrink-0"
            style={{ color: item.color || "#FFC98F" }}
            aria-hidden
          />
        ) : null}
        {item.text}
      </>
    );

    const className = "flex items-center gap-2 whitespace-nowrap";
    const style = item.color ? { color: item.color } : undefined;

    if (!href) {
      return (
        <span key={`${item.id}-${cloned ? "c" : "o"}`} className={className} style={style}>
          {content}
        </span>
      );
    }

    // النسخة المكرّرة (لدوران الشريط) خارج ترتيب التنقّل بلوحة المفاتيح
    const interactive = "transition-opacity hover:opacity-80 focus-visible:opacity-80";

    if (external) {
      return (
        <a
          key={`${item.id}-${cloned ? "c" : "o"}`}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={`${className} ${interactive}`}
          style={style}
          tabIndex={cloned ? -1 : undefined}
        >
          {content}
        </a>
      );
    }

    return (
      <Link
        key={`${item.id}-${cloned ? "c" : "o"}`}
        to={href}
        className={`${className} ${interactive}`}
        style={style}
        tabIndex={cloned ? -1 : undefined}
      >
        {content}
      </Link>
    );
  };

  const row = (cloned: boolean) => (
    <div className="flex shrink-0 items-center gap-10 px-5" aria-hidden={cloned || undefined}>
      {items.map((item) => message(item, cloned))}
    </div>
  );

  return (
    <div className="mk-ticker-wrap relative hidden overflow-hidden bg-grad-brand-deep text-[12.5px] font-bold text-white sm:block">
      {/* تلاشٍ على الحافّتين حتى لا تُقطع الكلمات بحدّ حادّ */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-[linear-gradient(to_right,#1B1150,transparent)]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-[linear-gradient(to_left,#40129B,transparent)]"
      />
      <div className="flex h-9 items-center">
        <div className="mk-ticker flex min-w-max items-center" style={{ animationDuration: `${duration}s` }}>
          {row(false)}
          {row(true)}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementBar;
