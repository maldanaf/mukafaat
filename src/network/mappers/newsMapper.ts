/**
 * Frontend News Article model
 */
export interface NewsArticleModel {
  id: number;
  image: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  date: string;
  dateEn: string;
  views: string;
  category: string;
  categoryEn: string;
  categoryAr: string;
  slug: string;
  /** من أضاف المقالة — فارغ إن لم يُسجَّل */
  author?: string | null;
}

/**
 * Maps API news response to frontend NewsArticle model
 */
export function mapApiNewsToModel(
  apiNews: Record<string, unknown>
): NewsArticleModel | null {
  try {
    const id = Number(apiNews.id ?? 0);
    const title = String(apiNews.title ?? "");
    const summary = String(apiNews.summary ?? "");
    const image = String(apiNews.image ?? "");
    const slug = String(apiNews.slug ?? "");
    const publishedAt = apiNews.published_at
      ? String(apiNews.published_at)
      : null;

    if (!id || !title) {
      console.warn("News missing id or title:", apiNews);
      return null;
    }

    // Format date
    let dateAr = "غير محدد";
    let dateEn = "Not specified";
    if (publishedAt) {
      try {
        const date = new Date(publishedAt);
        dateAr = date.toLocaleDateString("ar-SA", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        dateEn = date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
      } catch (e) {
        console.warn("Error parsing date:", publishedAt);
      }
    }

    // Fix duplicate URL in image if present
    let fixedImage = image;
    if (image && image.includes("/storage/https://")) {
      const storageIndex = image.indexOf("/storage/https://");
      fixedImage =
        image.substring(0, storageIndex + "/storage".length) +
        image.substring(storageIndex + "/storage/https://".length);
    }

    // Use placeholder if no image
    const newsImage =
      fixedImage || "https://via.placeholder.com/800x600?text=News";

    // تصنيف المقالة كما يصل من الـ API — كان ثابتاً «أخبار» لكل مقالة
    // مهما كان تصنيفها الحقيقي
    const apiCategory = (apiNews.category ?? null) as
      | { name?: string }
      | null;
    const categoryAr = apiCategory?.name?.trim() || "أخبار";
    const categoryEn = apiCategory?.name?.trim() || "News";
    const category = categoryAr;

    return {
      id,
      image: newsImage,
      title,
      titleEn: title, // API doesn't provide English, use Arabic as fallback
      description: summary,
      descriptionEn: summary,
      date: dateAr,
      dateEn,
      // الـ API يُرجع عدد المشاهدات فعلاً — كان ثابتاً صفراً
      views: String(apiNews.views ?? 0),
      category,
      categoryEn,
      categoryAr,
      author: (apiNews.author as string | null) ?? null,
      slug: slug || `news-${id}`,
    };
  } catch (error) {
    console.error("Error mapping news:", error, apiNews);
    return null;
  }
}

/**
 * Maps array of API news to frontend NewsArticle models
 */
export function mapApiNewsToModels(
  apiNews: Array<Record<string, unknown>>
): NewsArticleModel[] {
  if (!Array.isArray(apiNews)) return [];
  return apiNews
    .map(mapApiNewsToModel)
    .filter((news): news is NewsArticleModel => news !== null);
}
