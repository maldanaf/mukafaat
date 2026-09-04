"use client";

import { Fragment, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { t } from "i18next";
import { Helmet } from "@/lib/helmet-compat";

import { PopupAdsModal } from "@components";
import { webApi } from "@network/services/mokafaatService";
import { useLanguage } from "@context/language.context";
import {
  HeroSlider,
  SearchBar,
  ServiceCards,
  CategoriesBand,
  OffersGrid,
  CouponsBand,
  NearbySection,
  TopStores,
  CorporateApp,
  RestaurantsBand,
  BlogBand,
  Newsletter,
  StatsBand,
  PromoBand,
  CardsBand,
  HomeSkeleton,
} from "./components/newhome";
import {
  CategoryOffersSection,
  CategoryMerchantsSection,
  LayoutPromoBanner,
  readLayout,
  type LayoutSection,
} from "@components/home_builder";
import { CONTAINER, ErrorState, type PromoConfig } from "@ui";
import MobileHome from "./mobile/MobileHome";
import { merchantUrl } from "@utils/merchantUrl";

type Dict = Record<string, any>;

/** ترتيب الأقسام الاحتياطي حين لا يرسل الخادم `layout` (لا تُكسر الصفحة) */
const FALLBACK_ORDER: string[] = [
  "hero",
  "search_bar",
  "service_cards",
  "categories",
  "offers_grid",
  "coupons",
  "nearby",
  "top_stores",
  "promo",
  "corporate_app",
  "restaurants",
  "blog",
  "newsletter",
  "stats",
];

/**
 * الصفحة الرئيسية — تصميم design_handoff_mukafaat_homepage.
 * كل البيانات من GET /api/web/home (طلب واحد)، وترتيب الأقسام وعناوينها
 * وإظهارها من لوحة التحكم → «بناء واجهة الموقع» (`data.layout`).
 */
const HomePage = () => {
  const { currentLanguage: lang } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<number | string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["mokafaat", "web-home", lang, coords?.lat ?? null, coords?.lng ?? null],
    queryFn: () =>
      webApi
        .home(coords ? { lat: coords.lat, lng: coords.lng } : undefined)
        .then((r) => r.data),
  });

  const home: Dict = (data as Dict)?.data ?? {};

  const sliders: Dict[] = home.sliders ?? [];
  const categories: Dict[] = home.categories ?? [];
  const offersToday: Dict[] = home.offers?.today ?? [];
  const offersNew: Dict[] = home.offers?.new ?? [];
  const offersBest: Dict[] = home.offers?.best_selling ?? [];
  const coupons: Dict[] = home.coupons?.all ?? [];
  const merchants: Dict[] = home.merchants ?? [];
  const news: Dict[] = home.news ?? [];
  const cities: Dict[] = home.cities ?? [];
  const restaurants: Dict[] = home.restaurants ?? [];
  const nearby: Dict[] = home.nearby ?? [];
  const stats: Dict[] = home.stats ?? [];
  const giftCards: Dict[] = home.cards ?? [];
  const sections: Dict = home.sections ?? {};
  /** الأقسام الترويجية المُدارة من اللوحة: بانر VIP + جديد مكافآت */
  const homeSections = (home.home_sections ?? null) as Record<string, PromoConfig> | null;

  /** مجمّع العروض المعروضة: أحدث العروض ثم عروض اليوم ثم الأكثر مبيعاً بدون تكرار */
  const offers = useMemo(() => {
    const seen = new Set<number | string>();
    return [...offersNew, ...offersToday, ...offersBest].filter((offer) => {
      if (seen.has(offer.id)) return false;
      seen.add(offer.id);
      return true;
    });
  }, [offersNew, offersToday, offersBest]);

  /** مجمّع نتائج البحث الحيّ في شريط البحث */
  const searchPool = useMemo(
    () => [
      ...offers.map((offer) => ({
        title: String(offer.name ?? ""),
        meta: String(offer.merchant?.name ?? offer.category?.name ?? t("home.navbar.offers", "العروض")),
        href: `/offers/${offer.slug ?? offer.id}`,
      })),
      ...coupons.map((coupon) => ({
        title: String(coupon.title ?? coupon.merchant?.name ?? coupon.coupon_code ?? ""),
        meta: String(coupon.coupon_code ?? t("home.navbar.coupons", "كوبونز")),
        href: `/coupons`,
      })),
      ...merchants.map((merchant) => ({
        title: String(merchant.name ?? ""),
        meta: String(merchant.category ?? t("home.stores_new.title", "الأكثر استخداماً")),
        href: merchantUrl(merchant),
      })),
    ],
    [offers, coupons, merchants],
  );

  /**
   * رسم قسم جاهز واحد بمفتاحه — العنوان و«عرض الكل» من اللوحة إن وُجدا.
   * `prevKey` مفتاح القسم السابق في التخطيط: يُستخدم ليُرفَع شريط البحث
   * فوق حدّ الهيرو فقط عندما يأتي مباشرةً بعده.
   */
  const renderBuiltin = (key: string, section?: LayoutSection, prevKey?: string) => {
    const title = section?.title ?? undefined;
    const showViewAll = section?.show_view_all ?? true;

    switch (key) {
      case "hero":
        return <HeroSlider slides={sliders as any} />;
      case "search_bar":
        return (
          <SearchBar cities={cities as any} pool={searchPool} overlap={prevKey === "hero"} />
        );
      case "service_cards":
        return <ServiceCards />;
      case "categories":
        return (
          <CategoriesBand
            categories={categories as any}
            title={title}
            showViewAll={showViewAll}
          />
        );
      case "offers_grid":
        return (
          <OffersGrid
            offers={offers as any}
            categories={categories as any}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
            title={title}
            showViewAll={showViewAll}
          />
        );
      case "coupons":
        return <CouponsBand coupons={coupons as any} title={title} showViewAll={showViewAll} />;
      case "nearby":
        return (
          <NearbySection
            places={nearby as any}
            onUseMyLocation={setCoords}
            title={title}
            showViewAll={showViewAll}
          />
        );
      case "top_stores":
        return <TopStores stores={merchants as any} title={title} showViewAll={showViewAll} />;
      case "promo":
        // بانر VIP + جديد مكافآت (من home_sections في اللوحة)
        return <PromoBand sections={homeSections} />;
      case "corporate_app":
        return <CorporateApp corporate={sections?.corporate} app={sections?.app} />;
      case "restaurants":
        return (
          <RestaurantsBand
            restaurants={restaurants as any}
            title={title}
            showViewAll={showViewAll}
          />
        );
      case "cards":
        return <CardsBand cards={giftCards as any} title={title} showViewAll={showViewAll} />;
      case "blog":
        return <BlogBand posts={news as any} title={title} showViewAll={showViewAll} />;
      case "newsletter":
        return (
          <Newsletter
            title={title ?? sections?.newsletter?.title}
            description={sections?.newsletter?.description}
          />
        );
      case "stats":
        return <StatsBand stats={stats as any} />;
      default:
        return null;
    }
  };

  /** الأقسام النهائية: تخطيط اللوحة، أو الترتيب الاحتياطي إن غاب المفتاح */
  const renderedSections = useMemo(() => {
    const layout = readLayout(home);

    if (!layout) {
      return FALLBACK_ORDER.map((key, i) => (
        <Fragment key={key}>{renderBuiltin(key, undefined, FALLBACK_ORDER[i - 1])}</Fragment>
      ));
    }

    return layout.map((section, i) => {
      if (section.type === "category_offers") {
        return <CategoryOffersSection key={`cat-${section.id}`} section={section} />;
      }
      if (section.type === "category_merchants") {
        return <CategoryMerchantsSection key={`merch-${section.id}`} section={section} />;
      }
      if (section.type === "promo_banner") {
        return <LayoutPromoBanner key={`banner-${section.id}`} section={section} />;
      }
      const previous = layout[i - 1];
      return (
        <Fragment key={`builtin-${section.id}`}>
          {renderBuiltin(
            section.key,
            section,
            previous?.type === "builtin" ? previous.key : undefined,
          )}
        </Fragment>
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    home,
    sliders,
    categories,
    offers,
    coupons,
    nearby,
    merchants,
    restaurants,
    news,
    stats,
    giftCards,
    cities,
    searchPool,
    homeSections,
    sections,
    activeCategory,
  ]);

  return (
    <>
      <Helmet>
        {/* العنوان من الخادم — «مكافآت | عروض وخصومات…» المعتمد للسيو */}
        <link rel="canonical" href="https://mukafaat.com.sa" />
        <meta
          name="description"
          content="مكافآت — منصة العروض والخصومات والكوبونات والبطاقات الرقمية في المملكة العربية السعودية."
        />
        <meta property="og:title" content={`Mukafaat - ${t("home.navbar.home")}`} />
        <meta
          property="og:description"
          content="مكافآت — منصة العروض والخصومات والكوبونات والبطاقات الرقمية في المملكة العربية السعودية."
        />
      </Helmet>

      <div className="home bg-white text-[#1A1A2E]">
        <PopupAdsModal screen="home" />

        {/* حالة الخطأ — رسالة واحدة مع إعادة المحاولة بدل صفحة فارغة */}
        {isError && !isLoading && (
          <div className={`${CONTAINER} py-14`}>
            <ErrorState onRetry={() => refetch()} />
          </div>
        )}

        {/* حالة التحميل — هيكل بنفس أبعاد الأقسام */}
        {isLoading && (
          <div className="hidden lg:block">
            <HomeSkeleton />
          </div>
        )}

        {/* نسخة الموبايل (أقل من lg) */}
        {!isError && <MobileHome home={home} isLoading={isLoading} />}

        {/* نسخة الديسكتوب (lg فأعلى) — مبنية من تخطيط لوحة التحكم */}
        <div className={isLoading || isError ? "hidden" : "hidden lg:block"}>
          {renderedSections}
        </div>
      </div>
    </>
  );
};

export default HomePage;
