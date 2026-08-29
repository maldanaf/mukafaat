"use client";

import React from "react";
import { useNavigate } from "@/lib/router-compat";
import { MK, normalizeHex, isTransparentHex, FOCUS } from "./tokens";

/** وجهة زر القسم كما يرسلها الباك-إند في `home_sections[key].destination` */
export interface PromoDestination {
  type?: string | null;
  id?: number | string | null;
  url?: string | null;
}

/** إعدادات القسم الترويجي من `/api/web/home → data.home_sections` */
export interface PromoConfig {
  key?: string;
  status?: boolean;
  sort_order?: number;
  eyebrow?: string | null;
  title?: string | null;
  description?: string | null;
  button_text?: string | null;
  background?: {
    type?: string | null;
    color?: string | null;
    from?: string | null;
    to?: string | null;
    direction?: string | null;
    image?: string | null;
  } | null;
  text_color?: string | null;
  button_bg_color?: string | null;
  button_text_color?: string | null;
  destination?: PromoDestination | null;
}

/** اتجاهات التدرّج كما تُرسلها اللوحة → صيغة CSS */
const DIRECTION: Record<string, string> = {
  to_left: "to left",
  to_right: "to right",
  to_top: "to top",
  to_bottom: "to bottom",
  to_top_left: "to top left",
  to_top_right: "to top right",
  to_bottom_right: "to bottom right",
  to_bottom_left: "to bottom left",
};

/**
 * يحوّل وجهة اللوحة إلى مسار في الموقع.
 * أي نوع غير معروف يرجّع null فلا يُعرض الزر (بلا روابط مكسورة).
 */
export function promoHref(destination?: PromoDestination | null): string | null {
  const type = destination?.type ?? "none";
  const id = destination?.id ?? null;

  switch (type) {
    case "offer":
      return id ? `/offers/all/merchant/${id}` : null;
    case "category":
      return id ? `/offers/${id}` : "/offers";
    case "subscription":
      return "/subscription/plans";
    case "contact_us":
      return "/contact";
    case "store_join":
      return "/store-request";
    case "coupon":
      return id ? `/coupons?coupon=${id}` : "/coupons";
    case "card":
      return id ? `/cards?card=${id}` : "/cards";
    case "merchant":
      return id ? `/offers/all/${id}` : "/offers";
    case "external_url": {
      const url = destination?.url?.trim();
      return url ? url : null;
    }
    default:
      return null;
  }
}

export function isExternalPromo(destination?: PromoDestination | null): boolean {
  return destination?.type === "external_url";
}

/** هل القسم صالح للعرض؟ (مخفي من اللوحة أو بلا محتوى = لا يُعرض) */
export function isPromoVisible(config?: PromoConfig | null): boolean {
  if (!config) return false;
  if (config.status === false) return false;
  return Boolean(config.title || config.description || config.eyebrow);
}

interface Props {
  config?: PromoConfig | null;
  /** banner = صف أفقي مضغوط (بانر VIP) · card = كرت عمودي (جديد مكافآت) */
  layout?: "banner" | "card";
  className?: string;
}

/**
 * قسم ترويجي في الرئيسية تتحكم فيه لوحة التحكم بالكامل:
 * النصوص والخلفية (لون/تدرّج/صورة) ووجهة الزر — نفس
 * `HomePromoSection` في التطبيق حرفياً.
 */
const PromoSection: React.FC<Props> = ({ config, layout = "card", className = "" }) => {
  const navigate = useNavigate();

  if (!isPromoVisible(config)) return null;
  const c = config as PromoConfig;

  const textColor = normalizeHex(c.text_color) ?? "#FFFFFF";
  const buttonBg = normalizeHex(c.button_bg_color);
  const buttonText = normalizeHex(c.button_text_color) ?? "#FFFFFF";
  /** لون زر شفاف تماماً (`#00000000`) = زر بإطار */
  const outlined = !buttonBg || isTransparentHex(c.button_bg_color);

  const bg = c.background ?? {};
  const bgType = bg.type ?? "gradient";
  const bgImage = bg.image?.trim() || null;

  const style: React.CSSProperties = {};
  if (bgType === "image" && bgImage) {
    style.backgroundColor = normalizeHex(bg.color) ?? MK.primary;
    style.backgroundImage = `linear-gradient(rgba(0,0,0,0.28), rgba(0,0,0,0.28)), url("${bgImage}")`;
    style.backgroundSize = "cover";
    style.backgroundPosition = "center";
  } else if (bgType === "color") {
    style.backgroundColor = normalizeHex(bg.color) ?? MK.primary;
  } else {
    const from = normalizeHex(bg.from) ?? MK.deepest;
    const to = normalizeHex(bg.to) ?? MK.primaryLight;
    const dir = DIRECTION[bg.direction ?? "to_bottom_left"] ?? "to bottom left";
    style.backgroundImage = `linear-gradient(${dir}, ${from}, ${to})`;
  }

  const href = promoHref(c.destination);
  const external = isExternalPromo(c.destination);
  const hasAction = Boolean(href);
  const label = c.button_text?.trim() || null;

  const go = () => {
    if (!href) return;
    if (external) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(href);
  };

  const buttonEl =
    label && hasAction ? (
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          go();
        }}
        className={`mk-shine inline-flex min-h-[44px] items-center justify-center rounded-full px-5 text-[13.5px] font-extrabold shadow-[0_10px_26px_-10px_rgba(0,0,0,0.55)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:brightness-110 ${FOCUS}`}
        style={
          outlined
            ? { border: `1px solid ${textColor}99`, color: textColor }
            : { backgroundColor: buttonBg as string, color: buttonText }
        }
      >
        {label}
      </button>
    ) : null;

  if (layout === "banner") {
    return (
      <div
        className={`mk-lift group relative flex flex-wrap items-center gap-3 overflow-hidden rounded-mk-2xl px-5 py-5 shadow-mk-raised sm:px-6 ${className}`}
        style={style}
      >
        {c.eyebrow && (
          <span
            className="shrink-0 rounded-full px-2.5 py-1.5 text-[11.5px] font-extrabold uppercase leading-none tracking-[0.05em]"
            style={{
              backgroundColor: buttonBg ?? MK.gold,
              color: outlined ? MK.goldOnGold : buttonText,
            }}
          >
            {c.eyebrow}
          </span>
        )}
        <div className="min-w-[150px] flex-1">
          {c.title && (
            <p className="text-[15.5px] font-extrabold leading-snug sm:text-[17px]" style={{ color: textColor }}>
              {c.title}
            </p>
          )}
          {c.description && (
            <p className="mt-0.5 text-[11.5px] leading-snug" style={{ color: `${textColor}CC` }}>
              {c.description}
            </p>
          )}
        </div>
        {buttonEl}
      </div>
    );
  }

  /**
   * لا نجعل الغلاف زرّاً إذا كان بداخله زر فعل — زر داخل زر HTML غير صالح
   * ويسبّب خطأ ترطيب (hydration) في React.
   */
  const wrapperIsButton = hasAction && !buttonEl;
  const Wrapper: React.ElementType = wrapperIsButton ? "button" : "div";

  return (
    <Wrapper
      {...(wrapperIsButton ? { type: "button" as const, onClick: go } : {})}
      className={[
        "mk-lift group relative flex w-full flex-col items-start gap-1.5 overflow-hidden rounded-mk-2xl p-6 text-start shadow-mk-raised",
        wrapperIsButton ? FOCUS : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
    >
      {c.eyebrow && (
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.06em]"
          style={{ backgroundColor: `${textColor}22`, color: textColor }}
        >
          {c.eyebrow}
        </span>
      )}
      {c.title && (
        <p className="text-[20px] font-extrabold leading-snug tracking-[-0.01em] sm:text-[23px]" style={{ color: textColor }}>
          {c.title}
        </p>
      )}
      {c.description && (
        <p className="text-[12.5px] leading-relaxed" style={{ color: `${textColor}D9` }}>
          {c.description}
        </p>
      )}
      {buttonEl && <span className="pt-3">{buttonEl}</span>}
    </Wrapper>
  );
};

export default PromoSection;
