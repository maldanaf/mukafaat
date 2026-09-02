"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { FiSearch, FiX, FiGrid } from "react-icons/fi";
import { useMerchants } from "@hooks/api/useMokafaatQueries";
import MerchantCard, {
  type MerchantSummary,
} from "@views/offers/components/MerchantCard";
import {
  EmptyState,
  ErrorState,
  SkeletonGrid,
  FOCUS,
  PageHero,
  PinnedChipsBar,
  paletteFor,
} from "@ui";
import usePinnedUnderHeader from "@hooks/usePinnedUnderHeader";
import CategoryCard from "@components/CategoryCard";
import { BreadcrumbSchema } from "@components/seo";

/** التصنيف كما يصل من `/api/merchants` — مع عدد متاجره */
interface CategoryChip {
  id: number | string;
  name: string;
  slug?: string | null;
  image?: string | null;
  color?: string | null;
  merchants_count?: number;
}

const PER_PAGE = 12;

/** استخراج قائمة من استجابة قد تأتي بأشكال مختلفة */
function pick<T>(res: unknown, ...keys: string[]): T[] {
  const root = (res as Record<string, unknown>) ?? {};
  const data = (root.data as Record<string, unknown>) ?? root;
  for (const k of keys) {
    const v = data[k];
    if (Array.isArray(v)) return v as T[];
  }
  return [];
}

/**
 * كل المتاجر.
 *
 * المتجر وحدة التصفّح الأولى في المنصة، فصفحته الجامعة تحتاج فلاتر
 * حاضرة دائماً وتحميلاً متدرّجاً: ٤٢ متجراً اليوم وقابلة للنمو، ودفعة
 * واحدة كبيرة تُبطئ أول رسم بلا فائدة.
 */
const StoresPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>(
    searchParams.get("category") ?? "",
  );
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<MerchantSummary[]>([]);

  const categoriesRef = useRef<HTMLElement | null>(null);
  const pinned = usePinnedUnderHeader(categoriesRef);

  /** البحث بعد توقّف الكتابة — لا طلب لكل حرف */
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  /** أي تغيير في الفلاتر يبدأ الترقيم من جديد */
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [search, categoryId]);

  const { data, isLoading, isFetching, isError, refetch } = useMerchants({
    per_page: PER_PAGE,
    page,
    search: search || undefined,
    category_id: categoryId || undefined,
  });

  const categories = useMemo(
    () => pick<CategoryChip>(data, "categories"),
    [data],
  );

  const pageMerchants = useMemo(
    () => pick<MerchantSummary>(data, "merchants", "data"),
    [data],
  );

  const meta = useMemo(() => {
    const root = (data as Record<string, unknown>) ?? {};
    const d = (root.data as Record<string, unknown>) ?? root;
    return {
      lastPage: Number(d.last_page ?? 1),
      total: Number(d.total ?? 0),
    };
  }, [data]);

  /** نراكم الصفحات بدل استبدالها — مع منع التكرار عند إعادة الجلب */
  useEffect(() => {
    if (!pageMerchants.length) return;
    setItems((prev) => {
      const seen = new Set(prev.map((m) => String(m.id)));
      const fresh = pageMerchants.filter((m) => !seen.has(String(m.id)));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  }, [pageMerchants]);

  const hasMore = page < meta.lastPage;

  /**
   * الحالة الحيّة للمراقب.
   *
   * `IntersectionObserver` يلتقط ما تراه عينه لحظة الإنشاء؛ ولو أعدنا
   * إنشاءه عند كل تغيّر في `isFetching` لانفصل وأعيد ربطه بينما الحارس
   * ظاهر أصلاً فلا يُطلق حدثاً جديداً ويتوقّف التحميل عند الصفحة الأولى.
   * لذا نُنشئه مرّة ونقرأ الحالة من مرجع.
   */
  const stateRef = useRef({ hasMore, isFetching });
  stateRef.current = { hasMore, isFetching };

  const observerRef = useRef<IntersectionObserver | null>(null);

  /**
   * ref callback لا useEffect: الحارس يُركَّب داخل فرع شرطي بعد وصول
   * أول دفعة، فكان `sentinelRef.current` فارغاً لحظة تشغيل الـ effect
   * ولا يُراقَب شيء، فيتوقّف التحميل عند الصفحة الأولى.
   */
  const attachSentinel = (el: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    if (!el) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        const { hasMore: more, isFetching: busy } = stateRef.current;
        if (more && !busy) setPage((prev) => prev + 1);
      },
      { rootMargin: "600px" },
    );
    observerRef.current.observe(el);
  };

  /** فصل المراقب عند مغادرة الصفحة */
  useEffect(() => () => observerRef.current?.disconnect(), []);

  const hasFilters = Boolean(search || categoryId);
  const showSkeleton = isLoading && items.length === 0;

  const clearAll = () => {
    setSearchInput("");
    setSearch("");
    setCategoryId("");
  };

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: t("home.navbar.home", "الرئيسية"), url: "/" },
          { name: t("stores.title", "المتاجر"), url: "/stores" },
        ]}
      />

      {/* الترويسة الموحّدة — نفس ترويسة صفحة العروض */}
      <PageHero
        title={t("stores.title", "المتاجر")}
        eyebrow={t("stores.eyebrow", "شركاؤنا")}
        subtitle={t(
          "stores.subtitle",
          "تصفّح المتاجر الشريكة وخصوماتها الدائمة على مدار العام.",
        )}
        crumbs={[
          { label: t("home.navbar.home", "الرئيسية"), to: "/" },
          { label: t("stores.title", "المتاجر") },
        ]}
      />

      {/* شريط التصنيفات — كروت مربّعة تطفو على الترويسة كصفحة العروض */}
      <section ref={categoriesRef} className="relative z-10 mx-auto w-full max-w-site px-4 sm:px-6">
        <div className="-mt-10">
          <div className="mk-scroll-x gap-3 pb-2">
            <div className="w-[120px] shrink-0 lg:w-[150px]">
              <CategoryCard
                icon=""
                title={t("home.categories_new.all", "الكل")}
                alt=""
                selected={categoryId === ""}
                onClick={() => setCategoryId("")}
              />
            </div>
            {categories.map((c) => (
              <div key={c.id} className="w-[120px] shrink-0 lg:w-[150px]">
                <CategoryCard
                  icon={c.image ?? ""}
                  title={c.name}
                  alt={c.name}
                  selected={categoryId === String(c.id)}
                  onClick={() =>
                    setCategoryId((prev) =>
                      prev === String(c.id) ? "" : String(c.id),
                    )
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* الشريط المثبّت عند تمرير شريط التصنيفات خارج الشاشة */}
      <PinnedChipsBar
        pinned={pinned}
        title={t("home.categories_new.title", "التصنيفات")}
        items={[
          {
            id: "all",
            name: t("home.categories_new.all", "الكل"),
            image: null,
            color: "#400198",
            active: categoryId === "",
            onClick: () => setCategoryId(""),
          },
          ...categories.map((c) => ({
            id: c.id,
            name: c.name,
            image: c.image ?? null,
            color: paletteFor(c.color, c.id).c,
            active: categoryId === String(c.id),
            onClick: () =>
              setCategoryId((prev) =>
                prev === String(c.id) ? "" : String(c.id),
              ),
          })),
        ]}
      />

      <div className="mx-auto w-full max-w-site px-4 py-6 sm:px-6">

      {/* البحث — التصنيفات صارت في شريط الكروت أعلاه */}
      <div className="relative mb-6">
        <FiSearch
          className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-mk-faint"
          size={17}
          aria-hidden
        />
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t("stores.search_placeholder", "ابحث عن متجر…")}
          className={`h-12 w-full rounded-mk-md border border-mk-border bg-white pe-11 ps-11 text-[14px] text-mk-text outline-none transition-colors placeholder:text-mk-faint focus:border-mk-primary ${FOCUS}`}
        />
        {searchInput && (
          <button
            type="button"
            onClick={() => setSearchInput("")}
            aria-label={t("cardsPage.clearAll", "مسح")}
            className={`absolute end-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-mk-faint transition-colors hover:bg-mk-tint2 hover:text-mk-primary ${FOCUS}`}
          >
            <FiX size={15} />
          </button>
        )}
      </div>


      {showSkeleton ? (
        <SkeletonGrid
          count={PER_PAGE}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        />
      ) : isError && items.length === 0 ? (
        <ErrorState onRetry={() => refetch()} />
      ) : items.length > 0 ? (
        <>
          <div className="mb-3 flex items-center gap-2 text-[12.5px] font-bold text-mk-muted">
            <FiGrid size={13} aria-hidden />
            {t("stores.showing", {
              shown: items.length,
              total: meta.total,
              defaultValue: "{{shown}} من {{total}} متجر",
            })}
            {hasFilters && (
              <button
                type="button"
                onClick={clearAll}
                className={`ms-auto rounded-full bg-[#FDE9EB] px-3 py-1 text-[12px] font-semibold text-mk-red transition-colors hover:brightness-95 ${FOCUS}`}
              >
                {t("cardsPage.clearAll", "مسح الفلاتر")}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((m) => (
              <MerchantCard key={m.id} merchant={m} />
            ))}
          </div>

          {/* حارس التحميل — يُشغّل الدفعة التالية قبل بلوغ النهاية */}
          <div ref={attachSentinel} className="h-8 w-full" aria-hidden />

          {isFetching && items.length > 0 && (
            <div className="mt-5">
              <SkeletonGrid
                count={4}
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              />
            </div>
          )}

          {!hasMore && (
            <p className="mt-8 text-center text-[12.5px] text-mk-faint">
              {t("stores.end", "عرضنا كل المتاجر المتاحة")}
            </p>
          )}
        </>
      ) : (
        <EmptyState
          title={t("merchantCard.empty", "لا توجد متاجر مطابقة")}
          description=""
          actionLabel={hasFilters ? t("cardsPage.clearAll", "مسح الفلاتر") : undefined}
          onAction={hasFilters ? clearAll : undefined}
        />
      )}
      </div>
    </>
  );
};

export default StoresPage;
