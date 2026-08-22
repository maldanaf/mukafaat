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

const BlogBand: React.FC<{ posts: Post[] }> = ({ posts }) => {
  if (!posts?.length) return null;

  return (
    <section className="mt-11 bg-[#F7F4FD] py-[52px]">
      <div className={CONTAINER}>
        <SectionHead
          eyebrow={t("home.blog_new.eyebrow", "آخر التحديثات")}
          title={t("home.blog_new.title", "الأخبار والمدونات")}
          linkLabel={t("home.blog_new.all_link", "عرض جميع المدونات")}
          linkTo="/blogs"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {posts.slice(0, 4).map((post, i) => (
            <Link
              key={post.id}
              to={`/blogs/${post.slug ?? post.id}`}
              className="overflow-hidden rounded-[18px] border border-[#EDE9F7] bg-white transition-shadow hover:shadow-[0_12px_30px_rgba(46,16,101,0.10)]"
            >
              <div className="aspect-[16/9] w-full overflow-hidden bg-[#F6F3FC]">
                <BrandImage
                  src={post.image}
                  name={post.title ?? ""}
                  variant="name"
                  className="h-full w-full text-[28px]"
                  bg="#F6F3FC"
                />
              </div>
              <div className="flex flex-col gap-2.5 p-[18px]">
                <span className="text-[12px] font-bold" style={{ color: pick(i + 1).c }}>
                  {t("home.blog_new.tag", "مدونة")}
                </span>
                <h3 className="m-0 line-clamp-2 text-[16px] font-bold leading-[1.5] text-[#17122A]">
                  {post.title}
                </h3>
                <p className="m-0 line-clamp-2 text-[13px] leading-[1.8] text-[#6B6480]">
                  {post.summary}
                </p>
                <span className="text-[12px] text-[#8B84A0]" dir="ltr">
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
