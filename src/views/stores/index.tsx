"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { FiSearch, FiX, FiGrid } from "react-icons/fi";
import { useMerchants } from "@hooks/api/useMokafaatQueries";
import MerchantCard, {
  type MerchantSummary,
} from "@views/offers/components/MerchantCard";
import { EmptyState, ErrorState, SkeletonGrid, FOCUS, SmartImage, paletteFor } from "@ui";
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

  const filterRef = useRef<HTMLDivElement | null>(null);

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
    <div className="mx-auto w-full max-w-site px-4 py-6 sm:px-6">
      <BreadcrumbSchema
        items={[
          { name: t("home.navbar.home", "الرئيسية"), url: "/" },
          { name: t("stores.title", "المتاجر"), url: "/stores" },
        ]}
      />

      <header className="mb-5">
        <h1 className="m-0 text-[22px] font-extrabold text-mk-text-strong sm:text-[27px]">
          {t("stores.title", "المتاجر")}
        </h1>
        <p className="m-0 mt-1 text-[13.5px] text-mk-muted">
          {t(
            "stores.subtitle",
            "تصفّح المتاجر الشريكة وخصوماتها الدائمة على مدار العام.",
          )}
        </p>
      </header>

      {/*
        الفلاتر لاصقة: القائمة طويلة والتصفية تفقد قيمتها إن اضطرّ
        المستخدم للعودة إلى أعلى الصفحة في كل مرّة.
      */}
      <div
        ref={filterRef}
        className="sticky z-30 -mx-4 mb-6 border-b border-mk-border bg-white/95 px-4 py-3 backdrop-blur-md sm:-mx-6 sm:px-6"
        style={{ top: "var(--mk-header-h, 0px)" }}
      >
        <div className="relative mb-3">
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
            className={`h-12 w-full rounded-mk-md border border-mk-border bg-mk-tint3 pe-11 ps-11 text-[14px] text-mk-text outline-none transition-colors placeholder:text-mk-faint focus:border-mk-primary focus:bg-white ${FOCUS}`}
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

        {/* شرائح التصنيفات — بشعار التصنيف ولونه */}
        <div className="mk-scroll-x gap-2 pb-0.5">
          <FilterChip
            active={categoryId === ""}
            label={t("home.categories_new.all", "الكل")}
            count={meta.total}
            color="#400198"
            onClick={() => setCategoryId("")}
          />
          {categories.map((c) => {
            const { c: color } = paletteFor(c.color, c.id);
            return (
              <FilterChip
                key={c.id}
                active={categoryId === String(c.id)}
                label={c.name}
                count={c.merchants_count}
                color={color}
                image={c.image}
                onClick={() =>
                  setCategoryId((prev) =>
                    prev === String(c.id) ? "" : String(c.id),
                  )
                }
              />
            );
          })}
        </div>
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
  );
};

/** شريحة تصنيف — بشعاره ولونه، ولون الهوية عند التفعيل */
const FilterChip: React.FC<{
  active: boolean;
  label: string;
  count?: number;
  color: string;
  image?: string | null;
  onClick: () => void;
}> = ({ active, label, count, color, image, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`group flex h-11 shrink-0 items-center gap-2 rounded-full border ps-1.5 pe-3.5 text-[13px] font-extrabold transition-all duration-200 hover:-translate-y-0.5 ${FOCUS}`}
    style={
      active
        ? { borderColor: color, backgroundColor: `${color}14`, color }
        : { borderColor: "#ECE9F5", backgroundColor: "#FFFFFF", color: "#4A4A63" }
    }
  >
    <span
      className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full"
      style={{ backgroundColor: `${color}1F` }}
    >
      {image ? (
        <SmartImage src={image} alt="" className="h-4.5 w-4.5 object-contain" />
      ) : (
        <FiGrid size={14} style={{ color }} aria-hidden />
      )}
    </span>
    <span className="whitespace-nowrap">{label}</span>
    {count != null && count > 0 && (
      <span
        className="rounded-full px-1.5 py-0.5 text-[10.5px] font-extrabold"
        style={{ backgroundColor: `${color}1F`, color }}
      >
        {count}
      </span>
    )}
  </button>
);

export default StoresPage;
