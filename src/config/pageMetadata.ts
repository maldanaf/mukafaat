import type { Metadata } from "next";
import { SITE_URL, absoluteUrl, alternateLanguages } from "./site";

/**
 * ميتاداتا صفحة على الخادم.
 *
 * مهم: وسوم Helmet داخل المكوّنات تُحقن بجافاسكربت بعد التحميل، فلا يراها
 * زاحف محرّك البحث — فكانت كل صفحات الموقع تعلن canonical الصفحة الرئيسية،
 * وهو تكرار محتوى صريح. هذه الدالة تُخرجها في HTML المُرسَل.
 */
export function pageMetadata(opts: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const url = absoluteUrl(opts.path);
  const image = opts.image ?? absoluteUrl("/assets/logo-BcBtrMQ_.svg");

  return {
    metadataBase: new URL(SITE_URL),
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    robots: opts.noIndex ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      type: "website",
      locale: "ar_SA",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
      images: [image],
    },
    other: {
      // روابط اللغات — نمرّرها كوسوم خام لأن Next يُسقط معامل الاستعلام
      ...Object.fromEntries(
        Object.entries(alternateLanguages(opts.path)).map(([locale, href]) => [
          `alternate:${locale}`,
          href,
        ]),
      ),
    },
  };
}
