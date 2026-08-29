"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { LuArrowUpRight, LuChevronLeft, LuChevronRight } from "react-icons/lu";
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

/** مدة عرض الشريحة الواحدة — نفس مدة شريط التقدّم في المؤشرات */
const SLIDE_MS = 6500;

/** حلقة تركيز بيضاء — نسخة الهيرو من حلقة التركيز الموحّدة (خلفية داكنة) */
const HERO_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#2B1B5E]";

/**
 * بانر الرئيسية — كل محتواه من لوحة التحكم (البانرات):
 * الصورة حسب اللغة، ونوع السلايد يحدد هل تظهر طبقة التعتيم والنصوص والأزرار.
 *
 * التصميم: أرضية بتدرّج الهوية + تلاشٍ متقاطع بين الشرائح + عنوان كبير متدرّج
 * + زر رئيسي برتقالي وزر ثانوي شفاف + مؤشرات بشريط تقدّم.
 */
const HeroSlider: React.FC<Props> = ({ slides }) => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const items = slides ?? [];
  const count = items.length;

  const go = useCallback(
    (next: number) => setIndex((i) => (count ? (next + count) % count : 0)),
    [count],
  );

  useEffect(() => {
    if (count < 2 || paused) return;
    timerRef.current = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [count, paused]);

  if (count === 0) return null;

  const active = Math.min(index, count - 1);
  const slide = items[active];
  const imageOnly = slide?.display_type === "image";

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
    <section
      className={`${CONTAINER} pt-5`}
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className={`relative isolate overflow-hidden rounded-[28px] bg-grad-brand-deep shadow-[0_24px_60px_-24px_rgba(46,16,101,0.55)] aspect-[1200/700] sm:aspect-[1200/455] ${
          imageOnly && target ? "cursor-pointer" : ""
        }`}
        onClick={imageOnly ? () => openTarget(target) : undefined}
      >
        {/* طبقات الصور — تلاشٍ متقاطع، الصورة النشطة فقط مرئية */}
        {items.map((item, i) => {
          const key = String(item.id ?? i);
          if (!item.image || brokenImages[key]) return null;
          return (
            <img
              key={key}
              src={item.image}
              alt={i === active ? (item.title ?? "") : ""}
              aria-hidden={i !== active}
              loading={i === 0 ? "eager" : "lazy"}
              onError={() => setBrokenImages((c) => ({ ...c, [key]: true }))}
              className={`mk-slide-fade absolute inset-0 h-full w-full object-cover ${
                i === active ? "is-active" : ""
              }`}
            />
          );
        })}

        {/* لمعة هوية خفيفة فوق الصورة — تُبقي البانر داخل لوحة العلامة */}
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 -start-16 h-[320px] w-[320px] rounded-full bg-[#7C4DE0]/35 blur-[90px]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-24 end-[12%] h-[280px] w-[280px] rounded-full bg-[#FD671A]/25 blur-[90px]"
        />

        {/* طبقة التعتيم والنصوص تظهر فقط في نوع «صورة ونصوص» */}
        {!imageOnly && (
          <>
            <div
              aria-hidden
              className="absolute inset-0 bg-[linear-gradient(to_right,rgba(17,6,50,0.97)_0%,rgba(24,8,70,0.9)_40%,rgba(41,14,92,0.58)_72%,rgba(46,16,101,0.2)_100%)] rtl:bg-[linear-gradient(to_left,rgba(17,6,50,0.97)_0%,rgba(24,8,70,0.9)_40%,rgba(41,14,92,0.58)_72%,rgba(46,16,101,0.2)_100%)]"
            />
            <div
              aria-hidden
              className="absolute inset-x-0 bottom-0 h-1/2 bg-[linear-gradient(to_top,rgba(15,6,44,0.6),transparent)]"
            />

            <div
              key={`content-${active}`}
              className="mk-rise relative flex h-full max-w-full flex-col items-start justify-center gap-3.5 px-6 py-8 sm:max-w-[62%] sm:gap-4 sm:px-16 lg:px-20"
            >
              {slide?.subtitle && (
                <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/[0.14] px-4 py-2 text-[12.5px] font-extrabold uppercase tracking-[0.05em] text-[#E9E0FF] backdrop-blur-sm">
                  <span aria-hidden className="mk-badge-pulse h-2 w-2 rounded-full bg-grad-accent" />
                  {slide.subtitle}
                </span>
              )}

              {slide?.title && (
                <h1 className="m-0 bg-[linear-gradient(100deg,#FFFFFF_0%,#FFFFFF_45%,#D6CBFF_100%)] bg-clip-text text-[32px] font-extrabold leading-[1.1] tracking-[-0.01em] text-transparent drop-shadow-[0_2px_18px_rgba(9,3,32,0.35)] sm:text-[50px] lg:text-[60px]">
                  {slide.title}
                </h1>
              )}

              {slide?.description && (
                <p className="m-0 max-w-[48ch] text-[14px] leading-[1.85] text-[#E3DCF4] sm:text-[16.5px]">
                  {slide.description}
                </p>
              )}

              {(slide?.button_text || slide?.secondary_button_text) && (
                <div className="mt-2 flex flex-wrap gap-3">
                  {slide?.button_text && (
                    <button
                      onClick={() => openTarget(slide.button_url || target)}
                      className={`mk-shine group inline-flex h-[52px] items-center gap-2 rounded-mk-lg bg-grad-accent px-7 text-[15px] font-extrabold text-white shadow-mk-glow-accent transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-8px_rgba(226,86,13,0.9)] active:translate-y-0 sm:h-[56px] sm:px-9 sm:text-[16px] ${HERO_FOCUS}`}
                    >
                      {slide.button_text}
                      <LuArrowUpRight
                        size={18}
                        className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 rtl:-scale-x-100"
                      />
                    </button>
                  )}

                  {slide?.secondary_button_text && (
                    <button
                      onClick={() => openTarget(slide.secondary_button_url || null)}
                      className={`inline-flex h-[52px] items-center rounded-mk-lg border-[1.5px] border-white/50 bg-white/[0.08] px-7 text-[15px] font-extrabold text-white backdrop-blur-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-white hover:bg-white hover:text-[#400198] sm:h-[56px] sm:px-8 sm:text-[16px] ${HERO_FOCUS}`}
                    >
                      {slide.secondary_button_text}
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {count > 1 && (
          <>
            {/* أسهم التنقّل — حضور واضح مع ضباب خلفي */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                go(active - 1);
              }}
              aria-label={t("home.hero_new.prev", "السابق")}
              className={`absolute start-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/70 hover:bg-white hover:text-[#400198] sm:flex ${HERO_FOCUS}`}
            >
              <LuChevronLeft size={22} className="rtl:-scale-x-100" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                go(active + 1);
              }}
              aria-label={t("home.hero_new.next", "التالي")}
              className={`absolute end-4 top-1/2 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-md transition-all duration-300 hover:scale-105 hover:border-white/70 hover:bg-white hover:text-[#400198] sm:flex ${HERO_FOCUS}`}
            >
              <LuChevronRight size={22} className="rtl:-scale-x-100" />
            </button>

            {/* مؤشرات الشرائح — شريط تقدّم للشريحة النشطة */}
            <div className="absolute bottom-5 end-5 sm:bottom-6 sm:end-14">
              <div className="flex items-center gap-2.5" dir="ltr">
              {items.map((item, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={item.id ?? i}
                    aria-label={`${t("home.hero_new.slide", "شريحة")} ${i + 1}`}
                    aria-current={isActive}
                    onClick={(e) => {
                      e.stopPropagation();
                      go(i);
                    }}
                    className={`h-[6px] overflow-hidden rounded-full transition-all duration-500 ${HERO_FOCUS} ${
                      isActive
                        ? "w-11 bg-white/30"
                        : "w-[18px] bg-white/35 hover:w-6 hover:bg-white/60"
                    }`}
                  >
                    {isActive && (
                      <span
                        key={`bar-${active}-${paused}`}
                        className="mk-slide-progress block h-full w-full rounded-full bg-white"
                        style={{
                          animationDuration: `${SLIDE_MS}ms`,
                          animationPlayState: paused ? "paused" : "running",
                        }}
                      />
                    )}
                  </button>
                );
              })}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default HeroSlider;
