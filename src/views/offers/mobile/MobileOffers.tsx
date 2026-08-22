"use client";

import { useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import MobilePageHeader from "@components/mobile/MobilePageHeader";
import MobileChips from "@components/mobile/MobileChips";
import BrandImage from "@views/home/components/newhome/BrandImage";
import { pick } from "@views/home/components/newhome/tokens";
import { useWebHome, useWebOffers } from "@hooks/api/useMokafaatQueries";
import { buildOfferUrl } from "@utils/offerUrl";

type Dict = Record<string, any>;

const percentOf = (offer: Dict): number => {
  const raw = Number(offer?.discount_percent ?? 0);
  if (raw > 0) return Math.round(raw);
  const before = Number(offer?.price_before ?? 0);
  const after = Number(offer?.price_after ?? 0);
  if (before > 0 && after > 0 && after < before) {
    return Math.round(((before - after) / before) * 100);
  }
  return 0;
};

/** صفحة العروض — نسخة الموبايل بأسلوب التطبيق */
const MobileOffers: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<number | string | null>(null);

  const { data: homeData } = useWebHome();
  const categories: Dict[] = (homeData as Dict)?.data?.categories ?? [];

  const params = useMemo(
    () => ({
      per_page: 20,
      page: 1,
      ...(category ? { category_ids: String(category) } : {}),
      ...(search.trim() ? { search: search.trim() } : {}),
    }),
    [category, search],
  );

  const { data, isLoading } = useWebOffers(params);
  const offers: Dict[] = (data as Dict)?.data?.offers ?? [];

  const chips = [
    { id: null, name: t("home.categories_new.all", "الكل") },
    ...categories.map((c) => ({ id: c.id as number, name: c.name as string })),
  ];

  return (
    <div className="min-h-screen bg-[#FBFAFE] pb-6 lg:hidden">
      <MobilePageHeader
        title={t("home.navbar.offers", "العروض")}
        subtitle={t("home.offers_new.title", "أحدث وأقوى العروض")}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("home.search_new.placeholder", "ابحث عن عرض أو متجر...")}
      >
        <MobileChips chips={chips} active={category} onSelect={setCategory} />
      </MobilePageHeader>

      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[190px] animate-pulse rounded-2xl bg-[#F1EBFB]" />
          ))}

        {!isLoading &&
          offers.map((offer, i) => {
            const percent = percentOf(offer);
            const color = pick(i + 1);
            return (
              <Link
                key={offer.id}
                to={buildOfferUrl(offer)}
                className="overflow-hidden rounded-2xl border border-[#EDE9F7] bg-white"
              >
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F6F3FC]">
                  <BrandImage
                    src={offer.image}
                    name={offer.name ?? ""}
                    variant="name"
                    className="h-full w-full"
                    bg="#F6F3FC"
                  />
                  {percent > 0 && (
                    <span
                      className="absolute top-2 end-2 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                      style={{ background: color.c }}
                    >
                      {percent}%
                    </span>
                  )}
                </div>
                <div className="p-2.5">
                  <span className="line-clamp-2 text-[12.5px] font-bold leading-snug text-[#17122A]">
                    {offer.name}
                  </span>
                  <span className="mt-1 block line-clamp-1 text-[11px] text-[#8B84A0]">
                    {offer.merchant?.name ?? offer.category?.name ?? ""}
                  </span>
                </div>
              </Link>
            );
          })}
      </div>

      {!isLoading && offers.length === 0 && (
        <p className="mx-4 mt-6 rounded-2xl bg-white p-6 text-center text-[13px] text-[#6B6480]">
          {t("home.offers_new.empty", "لا توجد عروض مطابقة")}
        </p>
      )}
    </div>
  );
};

export default MobileOffers;
