"use client";

import { useMemo, useState } from "react";
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
} from "./components/newhome";
import MobileHome from "./mobile/MobileHome";

type Dict = Record<string, any>;

/**
 * الصفحة الرئيسية — تصميم design_handoff_mukafaat_homepage.
 * كل البيانات من GET /api/web/home (طلب واحد)، والنصوص القابلة للتحرير من الإعدادات.
 */
const HomePage = () => {
  const { currentLanguage: lang } = useLanguage();
  const [activeCategory, setActiveCategory] = useState<number | string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const { data } = useQuery({
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
  const sections: Dict = home.sections ?? {};

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
        href: `/offers?merchant=${merchant.id}`,
      })),
    ],
    [offers, coupons, merchants],
  );

  return (
    <>
      <Helmet>
        <title>{`Mukafaat - ${t("home.navbar.home")}`}</title>
        <link rel="canonical" href="https://mukafaat.com" />
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

      <div className="home bg-white text-[#17122A]">
        <PopupAdsModal screen="home" />

        {/* نسخة الموبايل (أقل من lg) */}
        <MobileHome home={home} />

        {/* نسخة الديسكتوب (lg فأعلى) */}
        <div className="hidden lg:block">
        <HeroSlider slides={sliders as any} />

        <SearchBar cities={cities as any} pool={searchPool} />

        <ServiceCards />

        <CategoriesBand categories={categories as any} />

        <OffersGrid
          offers={offers as any}
          categories={categories as any}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />

        <CouponsBand coupons={coupons as any} />

        <NearbySection places={nearby as any} onUseMyLocation={setCoords} />

        <TopStores stores={merchants as any} />

        <CorporateApp corporate={sections?.corporate} app={sections?.app} />

        <RestaurantsBand restaurants={restaurants as any} />

        <BlogBand posts={news as any} />

        <Newsletter
          title={sections?.newsletter?.title}
          description={sections?.newsletter?.description}
        />

        <StatsBand stats={stats as any} />
        </div>
      </div>
    </>
  );
};

export default HomePage;
