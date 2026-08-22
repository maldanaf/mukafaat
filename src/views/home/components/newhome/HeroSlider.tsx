"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { t } from "i18next";
import { CONTAINER } from "./tokens";

interface Slide {
  id?: number | string;
  title?: string | null;
  subtitle?: string | null;
  image?: string | null;
  link_type?: string | null;
  link_id?: number | string | null;
  link_url?: string | null;
}

interface Props {
  slides: Slide[];
  appLink?: string | null;
}

/** بانر الرئيسية: صور من لوحة التحكم (البانرات) مع تدرّج بنفسجي ونص فوقها */
const HeroSlider: React.FC<Props> = ({ slides, appLink }) => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  // بانرات صورتها غير متاحة (ملف محذوف) → نعرض التدرّج بدل صورة مكسورة
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  // بانر افتراضي حين لا توجد بانرات ويب مضافة في لوحة التحكم
  const items: Slide[] =
    slides && slides.length > 0
      ? slides
      : [
          {
            id: "default",
            title: t("home.hero_new.title", "كل مزاياك في مكان واحد"),
            subtitle: t(
              "home.hero_new.body",
              "عروض حصرية، كوبونات وأكواد خصم، بطاقات رقمية وخدمات توفر لك أكثر كل يوم.",
            ),
            image: null,
          },
        ];

  useEffect(() => {
    if (items.length < 2) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % items.length),
      6500,
    );
    return () => clearInterval(timer);
  }, [items.length]);

  const slide = items[Math.min(index, items.length - 1)];

  const openSlide = () => {
    if (slide?.link_url) {
      window.open(slide.link_url, "_blank", "noopener,noreferrer");
      return;
    }
    if (slide?.link_type === "category" && slide?.link_id) {
      navigate(`/offers?category=${slide.link_id}`);
      return;
    }
    navigate("/offers");
  };

  return (
    <section className={`${CONTAINER} pt-6`}>
      <div className="relative overflow-hidden rounded-[24px] bg-[#2E1065] aspect-[1200/620] sm:aspect-[1200/440]">
        {slide?.image && !brokenImages[String(slide.id ?? index)] && (
          <img
            src={slide.image}
            alt=""
            onError={() =>
              setBrokenImages((current) => ({
                ...current,
                [String(slide.id ?? index)]: true,
              }))
            }
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(46,16,101,0.94),rgba(46,16,101,0.62)_55%,rgba(46,16,101,0.2))]" />

        <div className="relative flex h-full max-w-full sm:max-w-[62%] flex-col items-start justify-center gap-3 sm:gap-4 px-6 sm:px-16">
          <span className="rounded-full bg-white/[0.12] px-3.5 py-1.5 text-[12px] font-semibold text-[#C4B5FD]">
            {slide?.subtitle || t("home.hero_new.tag", "عروض مختارة")}
          </span>
          <h1 className="m-0 text-[26px] sm:text-[44px] font-bold leading-[1.2] text-white">
            {slide?.title || t("home.hero_new.title", "كل مزاياك في مكان واحد")}
          </h1>
          <p className="m-0 max-w-[46ch] text-[13px] sm:text-[16px] leading-[1.8] text-[#E3DCF4]">
            {t(
              "home.hero_new.body",
              "عروض حصرية، كوبونات وأكواد خصم، بطاقات رقمية وخدمات توفر لك أكثر كل يوم.",
            )}
          </p>
          <div className="mt-1.5 flex flex-wrap gap-3">
            <button
              onClick={openSlide}
              className="h-[46px] sm:h-[50px] rounded-[14px] bg-[#E2680F] px-5 sm:px-[26px] text-[13px] sm:text-[14.5px] font-bold text-white shadow-[0_10px_26px_rgba(226,104,15,0.35)] transition-colors hover:bg-[#C85A0B]"
            >
              {t("home.hero_new.cta", "استكشف العروض")} ↗
            </button>
            <a
              href={appLink || "/download-app"}
              className="flex h-[44px] sm:h-[48px] items-center rounded-[12px] border border-white/40 px-5 sm:px-6 text-[13px] sm:text-[14px] font-semibold text-white transition-colors hover:bg-white/[0.14]"
            >
              {t("home.hero_new.app", "حمّل التطبيق")}
            </a>
          </div>
        </div>

        {items.length > 1 && (
          <>
            <button
              onClick={() => setIndex((i) => (i + items.length - 1) % items.length)}
              aria-label="prev"
              className="absolute end-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[18px] text-[#2E1065] transition-colors hover:bg-white sm:flex"
            >
              ›
            </button>
            <button
              onClick={() => setIndex((i) => (i + 1) % items.length)}
              aria-label="next"
              className="absolute start-4 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-[18px] text-[#2E1065] transition-colors hover:bg-white sm:flex"
            >
              ‹
            </button>
            <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2" dir="ltr">
              {items.map((it, i) => (
                <button
                  key={it.id ?? i}
                  aria-label={`slide-${i + 1}`}
                  onClick={() => setIndex(i)}
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
