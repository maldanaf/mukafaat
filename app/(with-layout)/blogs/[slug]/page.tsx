import type { Metadata } from "next";
import { Suspense } from "react";
import { absoluteUrl, SITE_URL } from "@config/site";
import { getSiteSettings } from "@config/siteSettings";
import BlogArticlePage from "@views/blogs/[slug]";

const API_BASE = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://admin.mukafaat.com.sa"
).replace(/\/$/, "");

interface Article {
  id?: number | string;
  title?: string;
  summary?: string;
  image?: string | null;
  slug?: string;
  published_at_iso?: string | null;
  updated_at_iso?: string | null;
  tags?: string[];
  category?: { name?: string } | null;
}

/**
 * جلب المقالة على الخادم.
 *
 * وسوم Helmet داخل المكوّن تُحقن بجافاسكربت بعد التحميل، فلا يراها
 * زاحف المحرّك ولا معاينة المشاركة في واتساب وتويتر — فكانت كل مقالة
 * تُشارَك بعنوان الرئيسية وصورتها.
 */
async function getArticle(slug: string): Promise<Article | null> {
  try {
    const res = await fetch(`${API_BASE}/api/web/news/${slug}`, {
      headers: { Accept: "application/json", "Accept-Language": "ar" },
      next: { revalidate: 600 },
    });
    if (!res.ok) return null;
    const body = await res.json();
    return (body?.data?.news ?? null) as Article | null;
  } catch {
    return null;
  }
}

/** نزع وسوم HTML من الملخّص قبل وضعه في وسم meta */
const plain = (html?: string | null): string =>
  (html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);

  const url = absoluteUrl(`/blogs/${slug}`);

  if (!article) {
    return { alternates: { canonical: url } };
  }

  const title = article.title || "مقالة";
  const description =
    plain(article.summary).slice(0, 160) ||
    "اقرأ أحدث المقالات والنصائح من مكافآت.";
  const image = article.image || absoluteUrl("/assets/logo-BcBtrMQ_.svg");

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    keywords: article.tags?.length ? article.tags.join(", ") : undefined,
    // رابط أساسي مستقل لكل مقالة — كان يرث رابط الرئيسية
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "article",
      locale: "ar_SA",
      images: [image],
      publishedTime: article.published_at_iso ?? undefined,
      modifiedTime: article.updated_at_iso ?? undefined,
      tags: article.tags,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [article, settings] = await Promise.all([
    getArticle(slug),
    getSiteSettings(),
  ]);

  const general = (settings?.general ?? {}) as Record<string, unknown>;
  const siteName = String(general.site_name || "").trim() || "مكافآت";

  /** سكيما BlogPosting — تُصيَّر على الخادم ليقرأها الزاحف */
  const schema = article
    ? {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: article.title,
        description: plain(article.summary).slice(0, 300),
        image: article.image ? [article.image] : undefined,
        datePublished: article.published_at_iso ?? undefined,
        dateModified:
          article.updated_at_iso ?? article.published_at_iso ?? undefined,
        author: { "@type": "Organization", name: siteName, url: SITE_URL },
        publisher: {
          "@type": "Organization",
          name: siteName,
          logo: {
            "@type": "ImageObject",
            url: absoluteUrl("/assets/logo-BcBtrMQ_.svg"),
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": absoluteUrl(`/blogs/${slug}`),
        },
        articleSection: article.category?.name,
        keywords: article.tags?.length ? article.tags.join(", ") : undefined,
      }
    : null;

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      )}
      <Suspense>
        <BlogArticlePage />
      </Suspense>
    </>
  );
}
