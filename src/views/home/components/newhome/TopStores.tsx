"use client";

import { Link } from "@/lib/router-compat";
import { t } from "i18next";
import { CONTAINER } from "./tokens";
import { FOCUS } from "@ui";
import SectionHead from "./SectionHead";
import BrandImage from "./BrandImage";
import Reveal from "./Reveal";
import { merchantUrl } from "@utils/merchantUrl";

interface Store {
  id: number | string;
  slug?: string | null;
  name: string;
  logo?: string | null;
  category?: { slug?: string | null } | string | null;
}

const TopStores: React.FC<{ stores: Store[]; title?: string; showViewAll?: boolean }> = ({
  stores,
  title,
  showViewAll = true,
}) => {
  if (!stores?.length) return null;

  return (
    <section className={`${CONTAINER} pt-12 sm:pt-14`}>
      <SectionHead
        eyebrow={t("home.stores_new.eyebrow", "الأكثر طلباً")}
        title={title || t("home.stores_new.title", "الأكثر استخداماً")}
        linkLabel={showViewAll ? t("home.stores_new.all_link", "عرض جميع المتاجر") : undefined}
        linkTo={showViewAll ? "/offers" : undefined}
        className="!mb-6"
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {stores.slice(0, 8).map((store, i) => (
          <Reveal key={store.id} delay={(i % 8) * 45} className="h-full">
            <Link
              to={merchantUrl(store)}
              className={`group mk-lift relative flex h-full min-h-[118px] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-mk-xl border border-[#EFEDF7] bg-white p-3 text-center shadow-mk-card hover:border-[#C9BCEC] ${FOCUS}`}
            >
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-grad-mist p-[3px] shadow-[inset_0_0_0_1.5px_#EFEDF7] transition-all duration-200 group-hover:shadow-[inset_0_0_0_2px_#C9BCEC] group-hover:scale-110"
                aria-hidden
              >
                <BrandImage
                  src={store.logo}
                  name={store.name}
                  objectFit="contain"
                  className="h-full w-full rounded-full bg-white text-[15px]"
                />
              </span>
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] scale-x-0 bg-grad-accent transition-transform duration-200 group-hover:scale-x-100"
              />
              <span className="line-clamp-2 text-[12.5px] font-extrabold leading-tight text-[#4A4A63] transition-colors duration-200 group-hover:text-[#400198]">
                {store.name}
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

export default TopStores;
