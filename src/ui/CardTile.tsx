"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { LuZap, LuFlame } from "react-icons/lu";
import { buildCardUrl } from "@utils/cardUrl";
import { SmartImage, Ratio } from "./SmartImage";
import StatChips from "./StatChips";
import PriceTag from "./PriceTag";
import Badge from "./Badge";
import { FOCUS } from "./tokens";

export interface CardTileData {
  id: number | string;
  slug?: string | null;
  /** الاسم من `name`، و`title` للتوافق مع الردود القديمة */
  name?: string | null;
  title?: string | null;
  description?: string | null;
  image?: string | null;
  old_price?: number | string | null;
  price?: number | string | null;
  final_price?: number | string | null;
  discount_percentage?: number | string | null;
  /** email/instant = يصل الكود فوراً بعد الشراء */
  delivery_type?: string | null;
  views_count?: number | string | null;
  favorites_count?: number | string | null;
  shares_count?: number | string | null;
  purchase_count?: number | string | null;
  category?: { id?: number | string; name?: string | null; slug?: string | null } | null;
  merchant?: {
    id?: number | string;
    name?: string | null;
    slug?: string | null;
    logo?: string | null;
  } | null;
}

/** نسبة الخصم: من الحقل مباشرة، أو محسوبة من السعرين */
export function cardDiscountPercent(card: CardTileData): number {
  const raw = Number(card.discount_percentage ?? 0);
  if (Number.isFinite(raw) && raw > 0) return Math.round(raw);
  const before = Number(card.old_price ?? 0);
  const after = Number(card.final_price ?? card.price ?? 0);
  if (before > 0 && after > 0 && after < before) {
    return Math.round(((before - after) / before) * 100);
  }
  return 0;
}

/** عتبة «الأكثر شراءً» — مشتقّة من عدّاد الشراء القادم من الـ API */
const HOT_PURCHASES = 200;

interface Props {
  card: CardTileData;
  /** إظهار عدّادات المشاهدات/المفضلة/المشاركات/الشراء */
  showStats?: boolean;
  className?: string;
  href?: string;
}

/**
 * كرت بطاقة الشحن الموحّد — نفس لغة `OfferTile`: شارة خصم متدرّجة،
 * شريحة التاجر فوق الصورة، عدّادات نشاط، وشريط سعر سفلي يشطب السعر
 * قبل الخصم. الرابط يذهب لصفحة تفاصيل البطاقة لا لقائمة البطاقات.
 */
const CardTile: React.FC<Props> = ({
  card,
  showStats = true,
  className = "",
  href,
}) => {
  const { t } = useTranslation();
  const percent = cardDiscountPercent(card);
  const to = href ?? buildCardUrl(card);
  const name = card.name || card.title || card.category?.name || "";
  const purchases = Number(card.purchase_count ?? 0);
  const instant = ["email", "instant", "auto"].includes(
    String(card.delivery_type ?? "").toLowerCase(),
  );

  return (
    <div
      className={`group mk-lift relative flex h-full flex-col overflow-hidden rounded-mk-xl border border-mk-border bg-white shadow-mk-card hover:border-mk-border-strong ${className}`}
    >
      <Link to={to} className={`flex h-full flex-col ${FOCUS}`}>
        <div className="mk-zoom relative overflow-hidden bg-mk-tint2">
          <Ratio ratio="aspect-[16/10]">
            <SmartImage src={card.image} name={name} alt={name} variant="name" />
          </Ratio>

          {/* تدرّج داكن أسفل الصورة يرفع وضوح اسم التاجر */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(20,8,52,0.62),transparent)]"
          />

          {/* شارة الخصم في بداية الكرت (يمين في العربية). `dir="ltr"`
              يبقى على النص وحده — لو وُضع على العنصر المُموضَع لانقلب
              معنى `start` فسقطت الشارة يساراً فوق شارة الحالة. */}
          {percent > 0 && (
            <span className="mk-shine absolute start-2.5 top-2.5 inline-flex items-baseline gap-0.5 rounded-full bg-grad-accent px-3 py-1.5 text-[13.5px] font-extrabold leading-none text-white shadow-mk-badge">
              <span dir="ltr" className="inline-flex items-baseline">
                {percent}
                <span className="text-[10px] font-bold">%</span>
              </span>
            </span>
          )}

          {purchases >= HOT_PURCHASES ? (
            <Badge
              tone="grad-hot"
              size="sm"
              icon={<LuFlame size={12} aria-hidden />}
              className="absolute end-2.5 top-2.5"
            >
              {t("cardTile.bestSeller", "الأكثر شراءً")}
            </Badge>
          ) : (
            instant && (
              <Badge
                tone="grad-success"
                size="sm"
                icon={<LuZap size={12} aria-hidden />}
                className="absolute end-2.5 top-2.5"
              >
                {t("cardTile.instant", "تسليم فوري")}
              </Badge>
            )
          )}

          {card.merchant?.name && (
            <span className="absolute bottom-2.5 start-2.5 max-w-[80%] truncate rounded-full bg-white/95 px-2.5 py-1 text-[11.5px] font-extrabold text-mk-primary shadow-[0_4px_12px_-4px_rgba(46,16,101,0.5)]">
              {card.merchant.name}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3.5 pb-0">
          <span className="mk-clamp-2 text-[14.5px] font-bold leading-snug text-mk-text transition-colors duration-200 group-hover:text-mk-primary">
            {name}
          </span>

          <span className="mk-clamp-1 text-[11.5px] font-medium text-mk-faint">
            {card.category?.name || t("cardTile.digital", "بطاقة رقمية")}
          </span>

          {showStats && (
            <StatChips
              compact
              views={card.views_count}
              favorites={card.favorites_count}
              shares={card.shares_count}
              purchases={card.purchase_count}
            />
          )}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t border-mk-border bg-mk-tint3 px-3.5 py-3">
          <PriceTag
            price={card.final_price ?? card.price}
            priceBefore={card.old_price}
            size="sm"
          />
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-grad-brand text-[15px] leading-none text-white opacity-0 transition-all duration-200 group-hover:opacity-100 rtl:-scale-x-100"
          >
            &#8594;
          </span>
        </div>
      </Link>
    </div>
  );
};

export default CardTile;
