"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { LuFlame, LuSparkles, LuTimer } from "react-icons/lu";
import { buildOfferUrl } from "@utils/offerUrl";
import { SmartImage, Ratio } from "./SmartImage";
import StatChips from "./StatChips";
import PriceTag from "./PriceTag";
import Badge from "./Badge";
import { FOCUS } from "./tokens";

export interface OfferTileData {
  id: number | string;
  slug?: string | null;
  name?: string | null;
  image?: string | null;
  discount_percent?: number | string | null;
  discount_percentage?: number | string | null;
  price?: number | string | null;
  price_before?: number | string | null;
  price_after?: number | string | null;
  pricing_type?: string | null;
  end_date?: string | null;
  start_date?: string | null;
  category?: { id?: number | string; name?: string | null; slug?: string | null } | null;
  merchant?: {
    id?: number | string;
    name?: string | null;
    slug?: string | null;
    logo?: string | null;
  } | null;
  views_count?: number | string | null;
  favorites_count?: number | string | null;
  shares_count?: number | string | null;
}

/** نسبة الخصم: من الحقل مباشرة، أو محسوبة من السعرين (نفس منطق التطبيق) */
export function offerDiscountPercent(offer: OfferTileData): number {
  const raw = Number(offer.discount_percent ?? offer.discount_percentage ?? 0);
  if (Number.isFinite(raw) && raw > 0) return Math.round(raw);
  const before = Number(offer.price_before ?? 0);
  const after = Number(offer.price_after ?? 0);
  if (before > 0 && after > 0 && after < before) {
    return Math.round(((before - after) / before) * 100);
  }
  return 0;
}

/** عدد الأيام المتبقية حتى انتهاء العرض (null = بلا تاريخ انتهاء صالح) */
function daysLeft(endDate?: string | null): number | null {
  if (!endDate) return null;
  const ms = new Date(endDate).getTime();
  if (Number.isNaN(ms)) return null;
  return Math.ceil((ms - Date.now()) / 86400000);
}

/**
 * نسبة ما تبقّى من عمر العرض (0..1) — تُرسم كشريط عدّاد تنازلي.
 * تحتاج تاريخ بداية؛ وإلا نفترض نافذة ٣٠ يوماً.
 */
function remainingRatio(offer: OfferTileData): number | null {
  const days = daysLeft(offer.end_date);
  if (days === null || days < 0) return null;
  const startMs = offer.start_date ? new Date(offer.start_date).getTime() : NaN;
  const endMs = new Date(offer.end_date as string).getTime();
  const total = Number.isNaN(startMs) ? 30 * 86400000 : Math.max(endMs - startMs, 86400000);
  const left = Math.max(endMs - Date.now(), 0);
  return Math.min(Math.max(left / total, 0.04), 1);
}

interface Props {
  offer: OfferTileData;
  /** grid = بطاقة عمودية · row = صف أفقي (قوائم الموبايل) */
  layout?: "grid" | "row";
  /** إظهار عدّادات المشاهدات/المفضلة/المشاركات */
  showStats?: boolean;
  className?: string;
  /** عنصر في الزاوية (زر مفضلة مثلاً) */
  corner?: React.ReactNode;
  href?: string;
  /**
   * إبراز إضافي لكروت الواجهات الرئيسية: شارة خصم أكبر، تقريب ناعم للصورة
   * عند المرور، ورفع الكرت قليلاً. اختياري حتى تبقى بقية الصفحات كما هي.
   */
  highlight?: boolean;
  /** شارة تحفيزية صريحة تعلو الكرت — تُشتق تلقائياً من البيانات إن لم تُمرّر */
  flag?: "hot" | "new" | "ending" | null;
  /** إخفاء شريط العدّاد التنازلي للعروض المحدودة */
  hideCountdown?: boolean;
}

type Translate = (key: string, fallback?: string) => string;

const expiryLabel = (endDate: string | null | undefined, t: Translate) => {
  const days = daysLeft(endDate);
  if (days === null) return "";
  if (days < 0) return t("home.offers_new.ended", "انتهى");
  if (days === 0) return t("home.offers_new.today", "ينتهي اليوم");
  return `${t("home.offers_new.ends_in", "ينتهي بعد")} ${days} ${t("home.offers_new.days", "يوم")}`;
};

/** عتبة «الأكثر طلباً» — تُشتق من المشاهدات القادمة فعلياً من الـ API */
const HOT_VIEWS = 500;

/** يستنتج الشارة التحفيزية من بيانات العرض نفسها (لا أرقام وهمية) */
function autoFlag(offer: OfferTileData): "hot" | "new" | "ending" | null {
  const days = daysLeft(offer.end_date);
  if (days !== null && days >= 0 && days <= 2) return "ending";
  if (Number(offer.views_count ?? 0) >= HOT_VIEWS) return "hot";
  const startMs = offer.start_date ? new Date(offer.start_date).getTime() : NaN;
  if (!Number.isNaN(startMs) && Date.now() - startMs <= 7 * 86400000) return "new";
  return null;
}

/**
 * كرت العرض الموحّد — الاتجاه «الحيوي التجاري»:
 * شارة خصم متدرّجة كبيرة، شارة تحفيزية نابضة، صورة تتقرّب عند المرور،
 * وشريط سفلي ملوّن يجمع السعر القديم المشطوب والسعر الجديد.
 */
const OfferTile: React.FC<Props> = ({
  offer,
  layout = "grid",
  showStats = true,
  className = "",
  corner,
  href,
  highlight = false,
  flag,
  hideCountdown = false,
}) => {
  const { t: rawT } = useTranslation();
  const t = rawT as unknown as Translate;
  const percent = offerDiscountPercent(offer);
  const to = href ?? buildOfferUrl(offer);
  const isFree = offer.pricing_type === "free";
  const priceAfter = offer.price_after ?? offer.price;

  const activeFlag = flag === undefined ? autoFlag(offer) : flag;
  const ratio = hideCountdown ? null : remainingRatio(offer);
  const showCountdown = ratio !== null && ratio <= 0.35;

  const FLAGS = {
    hot: {
      tone: "grad-hot" as const,
      icon: <LuFlame size={12} aria-hidden />,
      label: t("ui.flag.hot", "الأكثر طلباً"),
      pulse: false,
    },
    new: {
      tone: "grad-primary" as const,
      icon: <LuSparkles size={12} aria-hidden />,
      label: t("ui.flag.new", "جديد"),
      pulse: false,
    },
    ending: {
      tone: "grad-accent" as const,
      icon: <LuTimer size={12} aria-hidden />,
      label: t("ui.flag.ending", "ينتهي قريباً"),
      pulse: true,
    },
  };

  if (layout === "row") {
    return (
      <div
        className={`relative overflow-hidden rounded-mk-xl border border-mk-border bg-white shadow-mk-card ${className}`}
      >
        <Link to={to} className={`flex items-stretch gap-3 p-2.5 ${FOCUS}`}>
          <div className="relative w-[104px] shrink-0 overflow-hidden rounded-mk-md bg-mk-tint2">
            <Ratio ratio="aspect-square">
              <SmartImage src={offer.image} name={offer.name ?? ""} alt={offer.name ?? ""} />
            </Ratio>
            {percent > 0 && (
              <span
                dir="ltr"
                className="absolute start-1.5 top-1.5 rounded-full bg-grad-accent px-2 py-0.5 text-[11px] font-extrabold leading-none text-white shadow-mk-badge"
              >
                {percent}%
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between gap-1.5 py-0.5">
            <div className="flex items-start justify-between gap-2">
              <span className="mk-clamp-2 text-[13.5px] font-bold text-mk-text">
                {offer.name}
              </span>
              {activeFlag && (
                <Badge
                  tone={FLAGS[activeFlag].tone}
                  size="sm"
                  pulse={FLAGS[activeFlag].pulse}
                  icon={FLAGS[activeFlag].icon}
                >
                  {FLAGS[activeFlag].label}
                </Badge>
              )}
            </div>
            {offer.merchant?.name && (
              <span className="mk-clamp-1 text-[11.5px] text-mk-muted">
                {offer.merchant.name}
              </span>
            )}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <PriceTag
                price={priceAfter}
                priceBefore={offer.price_before}
                size="sm"
                freeLabel={isFree ? t("offerCard.free", "مجاناً") : undefined}
              />
              {showStats && (
                <StatChips
                  compact
                  views={offer.views_count}
                  favorites={offer.favorites_count}
                  shares={offer.shares_count}
                />
              )}
            </div>
          </div>
        </Link>
        {corner && <div className="absolute end-2 top-2 z-10">{corner}</div>}
      </div>
    );
  }

  return (
    <div
      className={`group mk-lift relative flex h-full flex-col overflow-hidden rounded-mk-xl border border-mk-border bg-white shadow-mk-card hover:border-mk-border-strong ${className}`}
    >
      <Link to={to} className={`flex h-full flex-col ${FOCUS}`}>
        <div className="mk-zoom relative overflow-hidden bg-mk-tint2">
          <Ratio ratio="aspect-[16/10]">
            <SmartImage
              src={offer.image}
              name={offer.name ?? ""}
              alt={offer.name ?? ""}
              variant="name"
            />
          </Ratio>

          {/* تدرّج داكن أسفل الصورة يرفع وضوح اسم التاجر */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(20,8,52,0.62),transparent)]"
          />

          {/* شارة الخصم المتدرّجة — أبرز عنصر في الكرت */}
          {percent > 0 && (
            <span
              dir="ltr"
              className={`mk-shine absolute start-2.5 top-2.5 inline-flex items-baseline gap-0.5 rounded-full bg-grad-accent font-extrabold leading-none text-white shadow-mk-badge ${
                highlight ? "px-3.5 py-2 text-[15px]" : "px-3 py-1.5 text-[13.5px]"
              }`}
            >
              {percent}
              <span className="text-[10px] font-bold">%</span>
            </span>
          )}

          {/* شارة تحفيزية مشتقّة من البيانات */}
          {activeFlag && (
            <Badge
              tone={FLAGS[activeFlag].tone}
              size="sm"
              pulse={FLAGS[activeFlag].pulse}
              icon={FLAGS[activeFlag].icon}
              className="absolute end-2.5 top-2.5"
            >
              {FLAGS[activeFlag].label}
            </Badge>
          )}

          {offer.merchant?.name && (
            <span className="absolute bottom-2.5 start-2.5 max-w-[80%] truncate rounded-full bg-white/95 px-2.5 py-1 text-[11.5px] font-extrabold text-mk-primary shadow-[0_4px_12px_-4px_rgba(46,16,101,0.5)]">
              {offer.merchant.name}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3.5 pb-0">
          <span className="mk-clamp-2 text-[14.5px] font-bold leading-snug text-mk-text transition-colors duration-200 group-hover:text-mk-primary">
            {offer.name}
          </span>

          <div className="flex items-center justify-between gap-2 text-[11.5px] font-medium text-mk-faint">
            <span className="mk-clamp-1">{offer.category?.name ?? ""}</span>
            <span className="shrink-0">{expiryLabel(offer.end_date, t)}</span>
          </div>

          {showStats && (
            <StatChips
              compact
              views={offer.views_count}
              favorites={offer.favorites_count}
              shares={offer.shares_count}
            />
          )}

          {/* شريط عدّاد تنازلي للعروض التي شارفت على الانتهاء */}
          {showCountdown && (
            <span className="mk-countdown-track" aria-hidden>
              <span
                className="mk-countdown-fill"
                style={{ width: `${Math.round((ratio as number) * 100)}%` }}
              />
            </span>
          )}
        </div>

        {/* الشريط السفلي للسعر — سطح بنفسجي فاتح يفصله عن جسم الكرت */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-mk-border bg-mk-tint3 px-3.5 py-3">
          <PriceTag
            price={priceAfter}
            priceBefore={offer.price_before}
            size="sm"
            freeLabel={isFree ? t("offerCard.free", "مجاناً") : undefined}
          />
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-grad-brand text-[15px] leading-none text-white opacity-0 transition-all duration-200 group-hover:opacity-100 rtl:-scale-x-100"
          >
            &#8594;
          </span>
        </div>
      </Link>
      {corner && <div className="absolute end-2 top-2 z-10">{corner}</div>}
    </div>
  );
};

export default OfferTile;
