"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { LuCopy, LuCheck } from "react-icons/lu";
import MobilePageHeader from "@components/mobile/MobilePageHeader";
import MobileChips from "@components/mobile/MobileChips";
import BrandImage from "@views/home/components/newhome/BrandImage";
import { pick } from "@views/home/components/newhome/tokens";
import { useWebCoupons, useWebHome } from "@hooks/api/useMokafaatQueries";

type Dict = Record<string, any>;

/** صفحة الكوبونات — نسخة الموبايل */
const MobileCoupons: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<number | string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

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

  const { data, isLoading } = useWebCoupons(params);
  const coupons: Dict[] = (data as Dict)?.data?.coupons ?? (data as Dict)?.data?.data ?? [];

  const copy = async (code: string) => {
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
    <div className="min-h-screen bg-[#FBFAFE] pb-6 lg:hidden">
      <MobilePageHeader
        title={t("home.navbar.coupons", "كوبونز")}
        subtitle={t("home.coupons_new.title", "أكواد خصم مميزة")}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("home.search_new.placeholder", "ابحث عن كوبون أو متجر...")}
      >
        <MobileChips chips={chips} active={category} onSelect={setCategory} />
      </MobilePageHeader>

      <div className="flex flex-col gap-3 px-4 pt-4">
        {isLoading &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[86px] animate-pulse rounded-2xl bg-[#F1EBFB]" />
          ))}

        {!isLoading &&
          coupons.map((coupon, i) => {
            const color = pick(i);
            const code = coupon.coupon_code ?? coupon.code ?? "";
            const isCopied = copied === code && !!code;
            const pct = Number(coupon.discount_percentage ?? 0);
            return (
              <div
                key={coupon.id}
                className="overflow-hidden rounded-2xl border border-[#EDE9F7] bg-white"
              >
                <div className="h-1 w-full" style={{ background: color.c }} />
                <div className="flex items-center gap-3 p-3">
                  <BrandImage
                    src={coupon.image || coupon.merchant?.logo}
                    name={coupon.merchant?.name ?? coupon.title ?? coupon.name ?? ""}
                    className="h-14 w-14 shrink-0 rounded-xl text-[18px]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {pct > 0 && (
                        <span className="text-[15px] font-bold" style={{ color: color.c }}>
                          {Math.round(pct)}%
                        </span>
                      )}
                      <span className="line-clamp-1 text-[13.5px] font-bold text-[#17122A]">
                        {coupon.merchant?.name ?? coupon.title ?? coupon.name}
                      </span>
                    </div>
                    <p className="m-0 mt-0.5 line-clamp-1 text-[11.5px] text-[#8B84A0]">
                      {coupon.description ?? coupon.terms ?? ""}
                    </p>
                  </div>
                </div>
                {code && (
                  <button
                    onClick={() => copy(code)}
                    className="flex w-full items-center justify-between gap-2 border-t border-dashed border-[#E1D9F3] bg-[#FBF9FF] px-4 py-3"
                  >
                    <span className="font-mono text-[13.5px] font-bold tracking-widest text-[#2E1065]">
                      {code}
                    </span>
                    <span
                      className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-[11.5px] font-bold text-white"
                      style={{ background: isCopied ? "#0E9384" : color.c }}
                    >
                      {isCopied ? <LuCheck size={14} /> : <LuCopy size={14} />}
                      {isCopied
                        ? t("home.coupons_new.copied", "تم النسخ")
                        : t("home.coupons_new.copy", "نسخ")}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default MobileCoupons;
