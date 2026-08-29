"use client";

import { Link } from "@/lib/router-compat";
import { t } from "i18next";
import { CONTAINER, pick } from "./tokens";
import SectionHead from "./SectionHead";
import BrandImage from "./BrandImage";

interface Post {
  id: number | string;
  slug?: string;
  title?: string;
  summary?: string | null;
  image?: string | null;
  published_at?: string | null;
}

const BlogBand: React.FC<{ posts: Post[]; title?: string; showViewAll?: boolean }> = ({
  posts,
  title,
  showViewAll = true,
}) => {
  if (!posts?.length) return null;

  return (
    <section className="mt-11 bg-grad-mist py-[54px]">
      <div className={CONTAINER}>
        <SectionHead
          eyebrow={t("home.blog_new.eyebrow", "آخر التحديثات")}
          title={title || t("home.blog_new.title", "الأخبار والمدونات")}
          linkLabel={showViewAll ? t("home.blog_new.all_link", "عرض جميع المدونات") : undefined}
          linkTo={showViewAll ? "/blogs" : undefined}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {posts.slice(0, 4).map((post, i) => (
            <Link
              key={post.id}
              to={`/blogs/${post.slug ?? post.id}`}
              className="group mk-lift overflow-hidden rounded-mk-2xl border border-[#EFEDF7] bg-white shadow-mk-card hover:border-[#DED7F2]"
            >
              <div className="mk-zoom aspect-[16/9] w-full overflow-hidden bg-[#F2EFFA]">
                <BrandImage
                  src={post.image}
                  name={post.title ?? ""}
                  variant="name"
                  className="h-full w-full text-[28px]"
                  bg="#F2EFFA"
                />
              </div>
              <div className="flex flex-col gap-2.5 p-[18px]">
                <span
                  className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-[0.05em] text-white"
                  style={{ backgroundImage: `linear-gradient(135deg, ${pick(i + 1).c}, ${pick(i + 1).c}CC)` }}
                >
                  {t("home.blog_new.tag", "مدونة")}
                </span>
                <h3 className="m-0 line-clamp-2 text-[16px] font-extrabold leading-[1.5] text-[#1A1A2E] transition-colors duration-200 group-hover:text-[#400198]">
                  {post.title}
                </h3>
                <p className="m-0 line-clamp-2 text-[13px] leading-[1.8] text-[#6B6B85]">
                  {post.summary}
                </p>
                <span className="text-[12px] text-[#9A99B0]" dir="ltr">
                  {post.published_at}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BlogBand;
