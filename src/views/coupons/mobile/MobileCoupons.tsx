"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import MobilePageHeader from "@components/mobile/MobilePageHeader";
import MobileChips from "@components/mobile/MobileChips";
import {
  CouponTile,
  EmptyState,
  ErrorState,
  Skeleton,
  type CouponTileData,
} from "@ui";
import { LuTicketPercent } from "react-icons/lu";
import {
  useCouponCopy,
  useWebCoupons,
  useWebHome,
} from "@hooks/api/useMokafaatQueries";

type Dict = Record<string, any>;

/** صفحة الكوبونات — نسخة الموبايل (الاتجاه الحيوي التجاري) */
const MobileCoupons: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<number | string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const couponCopy = useCouponCopy();
  /** تجاوزات محلية لعدّاد النسخ (زيادة تفاؤلية) */
  const [copies, setCopies] = useState<Record<string, number>>({});

  const { data: homeData } = useWebHome();
  const categories: Dict[] = (homeData as Dict)?.data?.categories ?? [];

  const params = useMemo(
    () => ({
      per_page: 30,
      page: 1,
      ...(category ? { category_ids: String(category) } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [category, search],
  );

  const { data, isLoading, isError, refetch } = useWebCoupons(params);
  const coupons: Dict[] = (data as Dict)?.data?.coupons ?? (data as Dict)?.data?.data ?? [];

  const copy = async (coupon: Dict, code: string) => {
    // زيادة تفاؤلية فورية ثم تسجيل النسخة في الخادم (fire-and-forget)
    const key = String(coupon.id);
    const base = Number(coupon.copies_count ?? 0) || 0;
    setCopies((prev) => ({ ...prev, [key]: (prev[key] ?? base) + 1 }));
    couponCopy.mutate(coupon.id, {
      onSuccess: (serverCount) => {
        if (typeof serverCount === "number")
          setCopies((prev) => ({ ...prev, [key]: serverCount }));
      },
    });

    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* تجاهل */
    }
    setCopied(code);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 2000);
  };

  const chips = [
    { id: null, name: t("home.categories_new.all", "الكل") },
    ...categories.map((c) => ({ id: c.id as number, name: c.name as string })),
  ];

  return (
    <div className="min-h-screen overflow-x-clip bg-mk-bg pb-6 lg:hidden">
      <MobilePageHeader
        title={t("home.navbar.coupons", "كوبونز")}
        subtitle={t("home.coupons_new.title", "أكواد خصم مميزة")}
        eyebrow={
          <>
            <LuTicketPercent size={12} className="text-mk-accent-light" aria-hidden />
            {coupons.length > 0
              ? t("ui.results_count", { count: coupons.length })
              : t("home.hero_new.tag", "عروض مختارة")}
          </>
        }
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("home.search_new.placeholder", "ابحث عن كوبون أو متجر...")}
      >
        <MobileChips chips={chips} active={category} onSelect={setCategory} />
      </MobilePageHeader>

      <div className="flex flex-col gap-3 px-4 pt-5">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[132px] w-full rounded-mk-lg" />
          ))}

        {!isLoading && isError && <ErrorState compact onRetry={() => refetch()} />}

        {!isLoading &&
          !isError &&
          coupons.map((coupon, i) => {
            const code = coupon.coupon_code ?? coupon.code ?? "";
            return (
              <CouponTile
                key={coupon.id}
                coupon={coupon as CouponTileData}
                index={i}
                copiesCount={copies[String(coupon.id)]}
                copied={!!code && copied === code}
                onCopy={(c) => copy(coupon, c)}
              />
            );
          })}

        {!isLoading && !isError && coupons.length === 0 && (
          <EmptyState
            compact
            title={t("ui.empty.coupons", "لا توجد كوبونات متاحة حالياً.")}
            description={t("ui.empty.description", "جرّب تغيير الفلاتر أو عُد لاحقاً.")}
            actionLabel={search || category ? t("ui.clearFilters", "مسح الفلاتر") : undefined}
            onAction={() => {
              setSearch("");
              setCategory(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MobileCoupons;
