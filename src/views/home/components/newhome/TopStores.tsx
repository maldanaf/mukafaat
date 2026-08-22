"use client";

import { Link } from "@/lib/router-compat";
import { t } from "i18next";
import { CONTAINER } from "./tokens";
import SectionHead from "./SectionHead";
import BrandImage from "./BrandImage";

interface Store {
  id: number | string;
  slug?: string | null;
  name: string;
  logo?: string | null;
}

const TopStores: React.FC<{ stores: Store[] }> = ({ stores }) => {
  if (!stores?.length) return null;

  return (
    <section className={`${CONTAINER} pt-11`}>
      <SectionHead
        eyebrow={t("home.stores_new.eyebrow", "الأكثر طلباً")}
        title={t("home.stores_new.title", "الأكثر استخداماً")}
        linkLabel={t("home.stores_new.all_link", "عرض جميع المتاجر")}
        linkTo="/offers"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {stores.slice(0, 8).map((store) => (
          <Link
            key={store.id}
            to={`/offers?merchant=${store.id}`}
            className="flex h-[74px] items-center gap-2 overflow-hidden rounded-[14px] border border-[#EDE9F7] bg-[#FBF9FF] px-2.5 transition-colors hover:border-[#C9BCEC]"
          >
            <BrandImage
              src={store.logo}
              name={store.name}
              objectFit="contain"
              className="h-10 w-10 shrink-0 rounded-[10px] bg-white text-[14px]"
            />
            <span className="line-clamp-2 text-[12.5px] font-semibold text-[#4C1D95]">
              {store.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default TopStores;
