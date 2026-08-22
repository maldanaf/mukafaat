"use client";

import { useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import MobilePageHeader from "@components/mobile/MobilePageHeader";
import BrandImage from "@views/home/components/newhome/BrandImage";
import { useWebCards } from "@hooks/api/useMokafaatQueries";

type Dict = Record<string, any>;

/** صفحة البطاقات الرقمية — نسخة الموبايل */
const MobileCards: React.FC = () => {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");

  const params = useMemo(
    () => ({ per_page: 30, page: 1, ...(search.trim() ? { search: search.trim() } : {}) }),
    [search],
  );

  const { data, isLoading } = useWebCards(params);
  const cards: Dict[] = (data as Dict)?.data?.cards ?? (data as Dict)?.data?.data ?? [];

  return (
    <div className="min-h-screen bg-[#FBFAFE] pb-6 lg:hidden">
      <MobilePageHeader
        title={t("home.navbar.cards", "البطاقات الرقمية")}
        subtitle={t("home.services_new.cards.body", "بطاقات ألعاب وترفيه وتسوق تصلك فوراً")}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={t("home.search_new.placeholder", "ابحث عن بطاقة...")}
      />

      <div className="grid grid-cols-2 gap-3 px-4 pt-4">
        {isLoading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-[170px] animate-pulse rounded-2xl bg-[#F1EBFB]" />
          ))}

        {!isLoading &&
          cards.map((card) => (
            <Link
              key={card.id}
              to={`/cards/${card.slug ?? card.id}`}
              className="overflow-hidden rounded-2xl border border-[#EDE9F7] bg-white"
            >
              <div className="aspect-[16/10] w-full overflow-hidden bg-[#F6F3FC]">
                <BrandImage
                  src={card.image}
                  name={card.title ?? card.name ?? ""}
                  variant="name"
                  className="h-full w-full"
                  bg="#F6F3FC"
                />
              </div>
              <div className="p-2.5">
                <span className="line-clamp-2 text-[12.5px] font-bold leading-snug text-[#17122A]">
                  {card.title ?? card.name}
                </span>
                {card.price != null && Number(card.price) > 0 && (
                  <span className="mt-1 block text-[12px] font-bold text-[#4C1D95]" dir="ltr">
                    {Number(card.price)} {t("home.currency", "ريال")}
                  </span>
                )}
              </div>
            </Link>
          ))}
      </div>
    </div>
  );
};

export default MobileCards;
