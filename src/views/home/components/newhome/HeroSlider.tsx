"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { t } from "i18next";
import { CONTAINER } from "./tokens";

interface Slide {
  id?: number | string;
  /** image = صورة فقط بلا تعتيم ولا نصوص · image_text = التصميم الكامل */
  display_type?: "image" | "image_text" | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  image?: string | null;
  button_text?: string | null;
  button_url?: string | null;
  secondary_button_text?: string | null;
  secondary_button_url?: string | null;
  link_type?: string | null;
  link_id?: number | string | null;
  link_url?: string | null;
}

interface Props {
  slides: Slide[];
}

/**
 * بانر الرئيسية — كل محتواه من لوحة التحكم (البانرات):
 * الصورة حسب اللغة، ونوع السلايد يحدد هل تظهر طبقة التعتيم والنصوص والأزرار.
 */
const HeroSlider: React.FC<Props> = ({ slides }) => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const items = slides ?? [];

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % items.length), 6500);
    return () => clearInterval(timer);
  }, [items.length]);

  if (items.length === 0) return null;

  const slide = items[Math.min(index, items.length - 1)];
  const imageOnly = slide?.display_type === "image";
  const slideKey = String(slide?.id ?? index);

  /** وجهة السلايد: رابط مباشر ثم تصنيف ثم صفحة العروض */
  const targetOf = (item: Slide): string | null => {
    if (item?.link_url) return item.link_url;
    if (item?.link_type === "category" && item?.link_id) return `/offers?category=${item.link_id}`;
    if (item?.link_type === "none") return null;
    return "/offers";
  };

  const openTarget = (href: string | null) => {
    if (!href) return;
    if (/^https?:\/\//i.test(href)) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    navigate(href);
  };

  const target = targetOf(slide);

  return (
    <section className={`${CONTAINER} pt-6`}>
      <div
        className={`relative overflow-hidden rounded-[24px] bg-[#2E1065] aspect-[1200/620] sm:aspect-[1200/440] ${
          imageOnly && target ? "cursor-pointer" : ""
        }`}
        onClick={imageOnly ? () => openTarget(target) : undefined}
      >
        {slide?.image && !brokenImages[slideKey] && (
          <img
            src={slide.image}
            alt={slide.title ?? ""}
            onError={() => setBrokenImages((c) => ({ ...c, [slideKey]: true }))}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* طبقة التعتيم والنصوص تظهر فقط في نوع «صورة ونصوص» */}
        {!imageOnly && (
          <>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(46,16,101,0.94),rgba(46,16,101,0.62)_55%,rgba(46,16,101,0.2))]" />

            <div className="relative flex h-full max-w-full flex-col items-start justify-center gap-3 px-6 sm:max-w-[62%] sm:gap-4 sm:px-16">
              {slide?.subtitle && (
                <span className="rounded-full bg-white/[0.12] px-3.5 py-1.5 text-[12px] font-semibold text-[#C4B5FD]">
                  {slide.subtitle}
                </span>
              )}

              {slide?.title && (
                <h1 className="m-0 text-[26px] font-bold leading-[1.2] text-white sm:text-[44px]">
                  {slide.title}
                </h1>
              )}

              {slide?.description && (
                <p className="m-0 max-w-[46ch] text-[13px] leading-[1.8] text-[#E3DCF4] sm:text-[16px]">
                  {slide.description}
                </p>
              )}

              {(slide?.button_text || slide?.secondary_button_text) && (
                <div className="mt-1.5 flex flex-wrap gap-3">
                  {slide?.button_text && (
                    <button
                      onClick={() => openTarget(slide.button_url || target)}
                      className="h-[46px] rounded-[14px] bg-[#E2680F] px-5 text-[13px] font-bold text-white shadow-[0_10px_26px_rgba(226,104,15,0.35)] transition-colors hover:bg-[#C85A0B] sm:h-[50px] sm:px-[26px] sm:text-[14.5px]"
                    >
                      {slide.button_text} ↗
                    </button>
                  )}

                  {slide?.secondary_button_text && (
                    <button
                      onClick={() => openTarget(slide.secondary_button_url || null)}
                      className="flex h-[44px] items-center rounded-[12px] border border-white/40 px-5 text-[13px] font-semibold text-white transition-colors hover:bg-white/[0.14] sm:h-[48px] sm:px-6 sm:text-[14px]"
                    >
                      {slide.secondary_button_text}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {items.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => (i + items.length - 1) % items.length);
              }}
              aria-label={t("home.hero_new.prev", "السابق")}
              className="absolute end-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[18px] text-[#2E1065] transition-colors hover:bg-white sm:flex"
            >
              ›
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIndex((i) => (i + 1) % items.length);
              }}
              aria-label={t("home.hero_new.next", "التالي")}
              className="absolute start-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[18px] text-[#2E1065] transition-colors hover:bg-white sm:flex"
            >
              ‹
            </button>
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2" dir="ltr">
              {items.map((item, i) => (
                <button
                  key={item.id ?? i}
                  aria-label={`slide-${i + 1}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(i);
                  }}
                  className={`h-2 rounded-full transition-all ${
                    i === index ? "w-[26px] bg-white" : "w-2 bg-white/40"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default HeroSlider;
