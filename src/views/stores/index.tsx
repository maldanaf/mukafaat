"use client";

import React, { useMemo, useState } from "react";
import { useSearchParams } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { FiSearch } from "react-icons/fi";
import { useMerchants, useCategories } from "@hooks/api/useMokafaatQueries";
import MerchantCard, {
  type MerchantSummary,
} from "@views/offers/components/MerchantCard";
import { EmptyState, ErrorState, SkeletonGrid, FOCUS } from "@ui";
import { BreadcrumbSchema } from "@components/seo";

/** التصنيف كما يصل من الـ API */
interface CategoryItem {
  id: number | string;
  name: string;
  slug?: string | null;
}

/**
 * كل المتاجر.
 *
 * المتجر صار وحدة التصفّح الأولى، فاحتاج صفحة جامعة يصل إليها المستخدم
 * من القائمة ومن زر «الكل» في شريط التصنيفات — كان الزر يقود إلى
 * العروض فيُخرج المستخدم من مسار المتاجر.
 */
const StoresPage: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string>(
    searchParams.get("category") ?? "",
  );

  const { data: categoriesRes } = useCategories();

  const categories: CategoryItem[] = useMemo(() => {
    const root = (categoriesRes as Record<string, unknown>) ?? {};
    const data = (root.data as Record<string, unknown>) ?? root;
    const list = (data.categories ?? data.data ?? data) as unknown;
    return Array.isArray(list) ? (list as CategoryItem[]) : [];
  }, [categoriesRes]);

  const {
    data: merchantsRes,
    isLoading,
    isError,
    refetch,
  } = useMerchants({
    per_page: 50,
    search: search || undefined,
    category_id: categoryId || undefined,
  });

  const merchants: MerchantSummary[] = useMemo(() => {
    const root = (merchantsRes as Record<string, unknown>) ?? {};
    const data = (root.data as Record<string, unknown>) ?? root;
    const list = (data.merchants ?? data.data ?? data) as unknown;
    return Array.isArray(list) ? (list as MerchantSummary[]) : [];
  }, [merchantsRes]);

  const chip = (active: boolean) =>
    `h-10 shrink-0 rounded-full border px-4 text-[13px] font-extrabold transition-colors ${FOCUS} ${
      active
        ? "border-[#C9BCEC] bg-mk-tint2 text-mk-primary"
        : "border-mk-border bg-white text-mk-muted hover:border-[#C9BCEC]"
    }`;

  return (
    <div className="mx-auto w-full max-w-site px-4 py-6 sm:px-6">
      <BreadcrumbSchema
        items={[
          { name: t("home.navbar.home", "الرئيسية"), url: "/" },
          { name: t("stores.title", "المتاجر"), url: "/stores" },
        ]}
      />

      <header className="mb-5">
        <h1 className="m-0 text-[22px] font-extrabold text-mk-text-strong sm:text-[26px]">
          {t("stores.title", "المتاجر")}
        </h1>
        <p className="m-0 mt-1 text-[13.5px] text-mk-muted">
          {t(
            "stores.subtitle",
            "تصفّح المتاجر الشريكة وخصوماتها الدائمة على مدار العام.",
          )}
        </p>
      </header>

      {/* البحث */}
      <div className="relative mb-4">
        <FiSearch
          className="pointer-events-none absolute top-1/2 -translate-y-1/2 text-mk-faint start-4"
          size={17}
          aria-hidden
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("stores.search_placeholder", "ابحث عن متجر…")}
          className={`h-12 w-full rounded-mk-md border border-mk-border bg-white pe-4 ps-11 text-[14px] text-mk-text outline-none transition-colors placeholder:text-mk-faint focus:border-mk-primary ${FOCUS}`}
        />
      </div>

      {/* تصفية بالتصنيف */}
      {categories.length > 0 && (
        <div className="mk-scroll-x mb-6 gap-2 pb-1">
          <button
            type="button"
            onClick={() => setCategoryId("")}
            className={chip(categoryId === "")}
          >
            {t("home.categories_new.all", "الكل")}
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(String(c.id))}
              className={chip(categoryId === String(c.id))}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      {isLoading && merchants.length === 0 ? (
        <SkeletonGrid
          count={8}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
        />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : merchants.length > 0 ? (
        <>
          <p className="mb-3 text-[12.5px] font-bold text-mk-muted">
            {t("stores.count", { count: merchants.length })}
          </p>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {merchants.map((m) => (
              <MerchantCard key={m.id} merchant={m} />
            ))}
          </div>
        </>
      ) : (
        <EmptyState
          title={t("merchantCard.empty", "لا توجد متاجر مطابقة")}
          description=""
          actionLabel={search || categoryId ? t("cardsPage.clearAll") : undefined}
          onAction={
            search || categoryId
              ? () => {
                  setSearch("");
                  setCategoryId("");
                }
              : undefined
          }
        />
      )}
    </div>
  );
};

export default StoresPage;
