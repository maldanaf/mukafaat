"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { LuLayoutGrid } from "react-icons/lu";
import { t } from "i18next";
import { CONTAINER, pick } from "./tokens";
import SectionHead from "./SectionHead";

export interface CategoryItem {
  id: number | string;
  name: string;
  slug?: string;
  image?: string | null;
}

interface Props {
  categories: CategoryItem[];
}

const VISIBLE = 8;

/** شريط التصنيفات بخلفية بنفسجية فاتحة مع أسهم تدوير */
const CategoriesBand: React.FC<Props> = ({ categories }) => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);

  /** صفحة القسم تعتمد الـ slug: /offers/{slug} — وإلا نمرّر المعرّف كباراميتر */
  const openCategory = (category: CategoryItem | { id: "all" }) => {
    if (category.id === "all") {
      navigate("/offers");
      return;
    }
    const item = category as CategoryItem;
    navigate(item.slug ? `/offers/${item.slug}` : `/offers?category=${item.id}`);
  };

  const all = [
    { id: "all" as const, name: t("home.categories_new.all", "الكل"), image: null, slug: undefined },
    ...categories,
  ];
  const count = all.length;
  const rotated = count > VISIBLE ? [...all.slice(page % count), ...all.slice(0, page % count)] : all;
  const shown = rotated.slice(0, VISIBLE);

  return (
    <section className="mt-11 bg-[#F7F4FD] py-[52px]">
      <div className={CONTAINER}>
        <SectionHead
          eyebrow={t("home.categories_new.eyebrow", "تنقّل سريع")}
          title={t("home.categories_new.title", "التصنيفات")}
          linkLabel={t("home.categories_new.all_link", "عرض جميع التصنيفات")}
          linkTo="/offers"
        />

        <div className="flex items-center gap-2.5">
          {count > VISIBLE && (
            <button
              onClick={() => setPage((p) => (p + count - 1) % count)}
              aria-label="prev-categories"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E9E4F5] bg-white text-[#4C1D95] transition-colors hover:border-[#C9BCEC] sm:flex"
            >
              ›
            </button>
          )}

          <div className="grid flex-1 grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
            {shown.map((category, i) => {
              const color = pick(i);
              return (
                <button
                  key={String(category.id)}
                  onClick={() => openCategory(category as CategoryItem)}
                  className="group flex flex-col items-center gap-2.5 border-0 bg-transparent px-1 py-2.5"
                >
                  <span
                    className="flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-full border border-transparent transition-all group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_24px_rgba(46,16,101,0.12)]"
                    style={{ background: color.bg, color: color.c }}
                  >
                    {category.image ? (
                      <img src={category.image} alt="" className="h-7 w-7 object-contain" />
                    ) : (
                      <LuLayoutGrid size={24} />
                    )}
                  </span>
                  <span
                    className="text-center text-[13px] font-semibold leading-tight text-[#4A4459] transition-colors group-hover:text-[#2E1065]"
                  >
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>

          {count > VISIBLE && (
            <button
              onClick={() => setPage((p) => (p + 1) % count)}
              aria-label="next-categories"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E9E4F5] bg-white text-[#4C1D95] transition-colors hover:border-[#C9BCEC] sm:flex"
            >
              ‹
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default CategoriesBand;
