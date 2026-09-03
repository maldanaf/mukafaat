"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { FiSearch, FiX, FiGrid } from "react-icons/fi";
import { useIsRTL } from "@hooks";
import { Link, useNavigate, useParams } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";

import FAQSection from "@views/home/components/FAQSection";
import GetStartedSection from "@views/home/components/GetStartedSection";
import NewsCard from "@views/home/components/NewsCard";
import { useWebNews } from "@hooks/api/useMokafaatQueries";
import { mapApiNewsToModels } from "@network/mappers/newsMapper";
import type { NewsArticleModel } from "@network/mappers/newsMapper";
import { EmptyState, ErrorState, SkeletonGrid, FOCUS, PageHero } from "@ui";
import { BreadcrumbSchema } from "@components/seo";

/** تصنيف المدونة كما يصل من `/api/web/news` */
interface BlogCategory {
  id: number | string;
  name: string;
  slug?: string | null;
}

type SortKey = "newest" | "most_viewed" | "most_shared";

const PER_PAGE = 12;

/**
 * مدونة مكافآت.
 *
 * طلب مخصّص لا بيانات الرئيسية: كانت تقرأ من `useWebHome` فتعرض ما
 * ترسله الرئيسية من مقالات معدودة، بلا ترقيم ولا فلترة على الخادم —
 * فلا تظهر بقية المقالات مهما كثرت.
 */
const BlogsPage: React.FC = () => {
  const isRTL = useIsRTL();
  const { t } = useTranslation();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("newest");

  /**
   * التصنيف من المسار `/blogs/category/{slug}` لا من حالة داخلية:
   * الفلتر الداخلي لا يُنتج رابطاً يُشارَك أو تفهرسه المحرّكات.
   */
  const navigate = useNavigate();
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const activeSlug = categorySlug ?? "";
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<NewsArticleModel[]>([]);

  /** البحث بعد توقّف الكتابة — لا طلب لكل حرف */
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(id);
  }, [searchInput]);

  /** أي تغيير في الفلاتر يبدأ الترقيم من جديد */
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [search, activeSlug, sortBy]);

  const { data, isLoading, isFetching, isError, refetch } = useWebNews({
    per_page: PER_PAGE,
    page,
    search: search || undefined,
    category_slug: activeSlug || undefined,
    sort_by: sortBy,
  });

  const root = useMemo(() => {
    const r = (data as Record<string, unknown>) ?? {};
    return ((r.data as Record<string, unknown>) ?? r) as Record<string, unknown>;
  }, [data]);

  const categories: BlogCategory[] = useMemo(() => {
    const list = root.categories;
    return Array.isArray(list) ? (list as BlogCategory[]) : [];
  }, [root]);

  const pageItems: NewsArticleModel[] = useMemo(() => {
    const list = root.news;
    return Array.isArray(list)
      ? mapApiNewsToModels(list as Array<Record<string, unknown>>)
      : [];
  }, [root]);

  const meta = useMemo(() => {
    const p = (root.pagination ?? {}) as Record<string, unknown>;
    return {
      total: Number(p.total ?? 0),
      lastPage: Number(p.last_page ?? 1),
    };
  }, [root]);

  /** نراكم الصفحات بدل استبدالها — مع منع التكرار عند إعادة الجلب */
  useEffect(() => {
    if (!pageItems.length) return;
    setItems((prev) => {
      const seen = new Set(prev.map((a) => String(a.id)));
      const fresh = pageItems.filter((a) => !seen.has(String(a.id)));
      return fresh.length ? [...prev, ...fresh] : prev;
    });
  }, [pageItems]);

  const hasMore = page < meta.lastPage;
  const stateRef = useRef({ hasMore, isFetching });
  stateRef.current = { hasMore, isFetching };

  const observerRef = useRef<IntersectionObserver | null>(null);

  /**
   * ref callback لا useEffect: الحارس داخل فرع شرطي لا يُركَّب إلا بعد
   * وصول أول دفعة، فيكون المرجع فارغاً لحظة تشغيل الـ effect.
   */
  const attachSentinel = (el: HTMLDivElement | null) => {
    observerRef.current?.disconnect();
    if (!el) return;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        const { hasMore: more, isFetching: busy } = stateRef.current;
        if (more && !busy) setPage((p) => p + 1);
      },
      { rootMargin: "600px" },
    );
    observerRef.current.observe(el);
  };

  useEffect(() => () => observerRef.current?.disconnect(), []);

  const hasFilters = Boolean(search || activeSlug);
  const showSkeleton = isLoading && items.length === 0;

  /** التصنيف يُمسح بالتنقّل إلى /blogs لا بتغيير حالة داخلية */
  const clearAll = () => {
    setSearchInput("");
    setSearch("");
    if (activeSlug) navigate("/blogs");
  };

  const chip = (active: boolean) =>
    `inline-flex h-10 shrink-0 items-center rounded-full border px-4 text-[13px] font-extrabold transition-all duration-200 ${FOCUS} ${
      active
        ? "border-[#C9BCEC] bg-mk-tint2 text-mk-primary"
        : "border-mk-border bg-white text-mk-muted hover:border-[#C9BCEC]"
    }`;

  const sorts: { key: SortKey; label: string }[] = [
    { key: "newest", label: t("blogsPage.sort_newest", "الأحدث") },
    { key: "most_viewed", label: t("blogsPage.sort_viewed", "الأكثر قراءة") },
    { key: "most_shared", label: t("blogsPage.sort_shared", "الأكثر شيوعاً") },
  ];

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: t("home.navbar.home", "الرئيسية"), url: "/" },
          { name: t("blogsPage.title", "المدونة"), url: "/blogs" },
        ]}
      />

      <PageHero
        title={isRTL ? "مدونة مكافآت" : "Mukafaat Blog"}
        eyebrow={t("blogsPage.eyebrow", "اقرأ واستفد")}
        subtitle={t(
          "blogsPage.subtitle",
          "مقالات ونصائح حول العروض والخصومات والبطاقات والكوبونات في السعودية.",
        )}
        crumbs={[
          { label: t("home.navbar.home", "الرئيسية"), to: "/" },
          { label: t("blogsPage.title", "المدونة") },
        ]}
      />

      <div className="mx-auto w-full max-w-site px-4 py-6 sm:px-6">
        {/* شريط الأدوات: بحث وترتيب وعدّاد */}
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-mk-md border border-mk-border bg-white p-3 shadow-mk-card">
          <div className="relative min-w-[220px] flex-1">
            <FiSearch
              className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-mk-faint"
              size={16}
              aria-hidden
            />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t(
                "blogsPage.search_placeholder",
                "ابحث بعنوان المقالة أو كلمة مفتاحية…",
              )}
              className={`h-11 w-full rounded-mk-sm border border-mk-border bg-mk-tint3 pe-10 ps-10 text-[13.5px] text-mk-text outline-none transition-colors placeholder:text-mk-faint focus:border-mk-primary focus:bg-white ${FOCUS}`}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label={t("cardsPage.clearAll", "مسح")}
                className={`absolute end-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-mk-faint transition-colors hover:bg-mk-tint2 hover:text-mk-primary ${FOCUS}`}
              >
                <FiX size={14} />
              </button>
            )}
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            aria-label={t("blogsPage.sort", "الترتيب")}
            className={`h-11 shrink-0 rounded-mk-sm border border-mk-border bg-white px-3 text-[13px] font-bold text-mk-text outline-none focus:border-mk-primary ${FOCUS}`}
          >
            {sorts.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12.5px] font-bold text-mk-muted">
            <FiGrid size={13} aria-hidden />
            {t("blogsPage.showing", {
              shown: items.length,
              total: meta.total,
              defaultValue: "{{shown}} من {{total}} مقالة",
            })}
          </span>

          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className={`rounded-full bg-[#FDE9EB] px-3.5 py-1.5 text-[12px] font-extrabold text-mk-red transition-colors hover:brightness-95 ${FOCUS}`}
            >
              {t("cardsPage.clearAll", "مسح الفلاتر")}
            </button>
          )}
        </div>

        {/* تصنيفات المدونة */}
        {categories.length > 0 && (
          <div className="mk-scroll-x mb-6 gap-2 pb-1">
            <Link to="/blogs" className={chip(activeSlug === "")}>
              {t("blogsPage.all", "جميع المقالات")}
            </Link>
            {categories.map((c) => (
              <Link
                key={c.id}
                to={c.slug ? `/blogs/category/${c.slug}` : "/blogs"}
                className={chip(activeSlug === String(c.slug ?? ""))}
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}

        {showSkeleton ? (
          <SkeletonGrid
            count={PER_PAGE}
            className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          />
        ) : isError && items.length === 0 ? (
          <ErrorState onRetry={() => refetch()} />
        ) : items.length > 0 ? (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((news) => (
                <NewsCard key={news.id} {...news} />
              ))}
            </div>

            <div ref={attachSentinel} className="h-8 w-full" aria-hidden />

            {isFetching && items.length > 0 && (
              <div className="mt-5">
                <SkeletonGrid
                  count={4}
                  className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                />
              </div>
            )}

            {hasMore && !isFetching && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className={`rounded-full bg-[linear-gradient(135deg,#400198_0%,#6703EB_100%)] px-6 py-3 text-[13.5px] font-extrabold text-white transition-transform hover:-translate-y-0.5 ${FOCUS}`}
                >
                  {t("blogsPage.load_more", "عرض المزيد")}
                </button>
              </div>
            )}

            {!hasMore && (
              <p className="mt-8 text-center text-[12.5px] text-mk-faint">
                {t("blogsPage.end", "عرضنا كل المقالات")}
              </p>
            )}
          </>
        ) : (
          <EmptyState
            title={t("blogsPage.empty", "لا توجد مقالات مطابقة")}
            description=""
            actionLabel={hasFilters ? t("cardsPage.clearAll", "مسح الفلاتر") : undefined}
            onAction={hasFilters ? clearAll : undefined}
          />
        )}
      </div>

      <GetStartedSection className="mt-0 mb-0" />
      <FAQSection />
    </>
  );
};

export default BlogsPage;
