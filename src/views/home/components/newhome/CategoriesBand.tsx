"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { LuLayoutGrid, LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { t } from "i18next";
import { CONTAINER } from "./tokens";
import { paletteFor } from "@ui";
import { FOCUS, PinnedChipsBar } from "@ui";
import usePinnedUnderHeader from "@hooks/usePinnedUnderHeader";
import SectionHead from "./SectionHead";
import Reveal from "./Reveal";

export interface CategoryItem {
  id: number | string;
  name: string;
  slug?: string;
  image?: string | null;
  /** لون التصنيف من لوحة التحكم (#RRGGBB) — فارغ يعني لوناً تلقائياً ثابتاً */
  color?: string | null;
}

interface Props {
  /** عنوان القسم من لوحة التحكم «بناء واجهة الموقع» (فارغ = العنوان الافتراضي) */
  title?: string;
  /** إظهار رابط «عرض الكل» — يتحكم فيه الأدمن */
  showViewAll?: boolean;
  categories: CategoryItem[];
}

/** شريط التصنيفات — تمرير أفقي سلس بأزرار على الديسكتوب */
const CategoriesBand: React.FC<Props> = ({ categories, title, showViewAll = true }) => {
  const navigate = useNavigate();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const sectionRef = useRef<HTMLElement | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });
  /** القسم تجاوز الهيدر لأعلى — عندها يظهر شريط التصنيفات المثبّت */
  const pinned = usePinnedUnderHeader(sectionRef);

  /**
   * التصنيف يفتح متاجره لا عروضه.
   *
   * المتجر وحدة التصفّح الأولى في المنصّة وخصوماته الدائمة هي جوهرها،
   * فإرسال المستخدم من التصنيف إلى العروض كان يُخرجه من مسار المتاجر.
   */
  /** وجهة التصنيف — تُستعمل كـ href في الشبكة وكوجهة تنقّل في الشريط اللاصق */
  const categoryHref = (category: CategoryItem | { id: "all" }): string => {
    if (category.id === "all") return "/stores";
    const item = category as CategoryItem;
    return item.slug ? `/stores/${item.slug}` : "/stores";
  };

  const openCategory = (category: CategoryItem | { id: "all" }) => {
    navigate(categoryHref(category));
  };

  const all: (CategoryItem | { id: "all"; name: string; image: null; slug: undefined })[] = [
    { id: "all" as const, name: t("home.categories_new.all", "الكل"), image: null, slug: undefined },
    ...categories,
  ];

  /** يحسب إن كان هناك ما يُمرَّر يميناً/يساراً (يعمل مع القيم السالبة في RTL) */
  const syncEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setEdges({ start: pos > 4, end: max - pos > 4 });
  }, []);

  useEffect(() => {
    syncEdges();
    window.addEventListener("resize", syncEdges);
    return () => window.removeEventListener("resize", syncEdges);
  }, [syncEdges, categories.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: dir * (rtl ? -1 : 1) * Math.round(el.clientWidth * 0.8), behavior: "smooth" });
  };

  const ARROW = `hidden h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#ECE9F5] bg-white text-[#400198] shadow-[0_4px_14px_rgba(46,16,101,0.08)] transition-all duration-300 hover:border-[#C9BCEC] hover:bg-[#F2EFFA] disabled:cursor-default disabled:opacity-35 disabled:shadow-none lg:flex ${FOCUS}`;

  if (!categories?.length) return null;

  return (
    <>
    <section ref={sectionRef} className="mt-12 bg-grad-mist py-[56px]">
      <div className={CONTAINER}>
        <SectionHead
          eyebrow={t("home.categories_new.eyebrow", "تنقّل سريع")}
          title={title || t("home.categories_new.title", "التصنيفات")}
          subtitle={t(
            "home.categories_new.subtitle",
            "اختر التصنيف الذي يناسبك وتصفّح عروضه فوراً.",
          )}
          linkLabel={showViewAll ? t("home.categories_new.all_link", "عرض جميع التصنيفات") : undefined}
          linkTo={showViewAll ? "/stores" : undefined}
          className="!mb-6"
          actions={
            <div className="hidden items-center gap-2 lg:flex">
              <button
                type="button"
                onClick={() => scrollBy(-1)}
                disabled={!edges.start}
                aria-label={t("home.common.prev", "السابق")}
                className={ARROW}
              >
                <LuChevronLeft size={18} className="rtl:-scale-x-100" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => scrollBy(1)}
                disabled={!edges.end}
                aria-label={t("home.common.next", "التالي")}
                className={ARROW}
              >
                <LuChevronRight size={18} className="rtl:-scale-x-100" aria-hidden />
              </button>
            </div>
          }
        />

        <Reveal>
          <div
            ref={trackRef}
            onScroll={syncEdges}
            className="mk-scroll-x -mx-1 gap-3 px-1 py-3"
          >
            {all.map((category, i) => {
              const color = paletteFor(
                (category as CategoryItem).color,
                category.id,
              );
              return (
                <Link
                  key={String(category.id)}
                  to={categoryHref(category as CategoryItem)}
                  className={`group mk-lift flex w-[124px] shrink-0 flex-col items-center gap-3 rounded-mk-2xl border border-[#EFEDF7] bg-white px-3 py-5 text-inherit no-underline shadow-mk-card hover:border-[#C9BCEC] sm:w-[140px] ${FOCUS}`}
                >
                  <span
                    className="relative flex h-[70px] w-[70px] items-center justify-center overflow-hidden rounded-mk-2xl shadow-[0_10px_22px_-12px_rgba(46,16,101,0.5)] transition-transform duration-200 group-hover:scale-110"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${color.c} 0%, ${color.c}CC 100%)`,
                      color: "#FFFFFF",
                    }}
                  >
                    {category.image ? (
                      <img
                        src={category.image}
                        alt=""
                        loading="lazy"
                        className="h-9 w-9 object-contain brightness-0 invert"
                      />
                    ) : (
                      <LuLayoutGrid size={28} aria-hidden />
                    )}
                  </span>
                  <span className="line-clamp-2 text-center text-[13.5px] font-extrabold leading-tight text-[#4A4A63] transition-colors duration-200 group-hover:text-[#400198]">
                    {category.name}
                  </span>
                </Link>
              );
            })}
          </div>
        </Reveal>
      </div>
    </section>

    <PinnedChipsBar
      pinned={pinned}
      title={title || t("home.categories_new.title", "التصنيفات")}
      items={all.map((category, i) => ({
        id: category.id,
        name: category.name,
        image: category.image,
        color: paletteFor((category as CategoryItem).color, category.id).c,
        onClick: () => openCategory(category as CategoryItem),
      }))}
    />
    </>
  );
};

export default CategoriesBand;
