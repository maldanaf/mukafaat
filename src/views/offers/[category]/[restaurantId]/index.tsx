"use client";

import React, { useState, useMemo } from "react";
import { useParams, useNavigate, Link as RouterLink } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useIsRTL } from "@hooks";
import {
  FiBookmark,
  FiEye,
  FiClock,
  FiTruck,
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
} from "react-icons/fi";
import {
  offerCategories,
  type Offer,
  type MenuItem,
  type Restaurant,
} from "@data/offers";
import OfferCard from "./components/OfferCard";
import { Pro1, Pro2, Pro3, Pro4, Pro5, Pro6, Pro7, Pro8 } from "@assets";
import {
  CONTAINER,
  Card,
  EmptyState,
  Skeleton,
  SkeletonGrid,
  OpenStatusBadge,
  PriceTag,
  SmartImage,
  Ratio,
  FOCUS,
} from "@ui";
import { LuChevronLeft } from "react-icons/lu";
import { Ribbon } from "@views/offers/components/CatalogKit";
import GetStartedSection from "@views/home/components/GetStartedSection";
import { useWebHome, useMerchantDetail } from "@hooks/api/useMokafaatQueries";
import { stripHtml } from "@utils/stripHtml";
import { mapApiOffersToModels } from "@network/mappers/offersMapper";
import StoreWorkingHours, {
  type WorkingHourRow,
} from "@components/StoreWorkingHours";
import { useTranslation } from "react-i18next";

/**
 * وقت التوصيل كما في التطبيق: القيمة التي تحمل وحدتها تُترك كما هي،
 * والأرقام المجرّدة (مثل «25-35») تُلحَق بكلمة «دقيقة».
 */
function formatDeliveryTime(raw: unknown, minuteUnit: string): string {
  const value = raw == null ? "" : String(raw).trim();
  if (!value) return "";
  if (/دقيق|ساع|min|hour|hr/i.test(value)) return value;
  if (/^[\d\s\-–—/إلى]+$/.test(value)) return `${value} ${minuteUnit}`;
  return value;
}

/** قيمة مالية: الفراغ والصفر يعنيان «غير معبّأ» فلا يُعرض الحقل إطلاقاً */
function formatMoneyValue(raw: unknown): string {
  if (raw == null) return "";
  const text = String(raw).trim();
  if (!text) return "";
  const value = Number(text);
  if (!Number.isFinite(value)) return text;
  if (value === 0) return "";
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

const RestaurantDetailsPage = () => {
  const { category, merchantSlug } = useParams<{
    category: string;
    merchantSlug: string;
  }>();
  const navigate = useNavigate();
  const isRTL = useIsRTL();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"offers" | "menu">("offers");
  const { data: merchantDetailData, isLoading: merchantLoading } = useMerchantDetail(merchantSlug);

  const restaurant = useMemo<Restaurant | null>(() => {
    if (!merchantDetailData) return null;
    const res = merchantDetailData as Record<string, unknown>;
    const data = (res?.data ?? res) as Record<string, unknown>;
    const m = data?.merchant as Record<string, unknown> | undefined;
    if (!m) return null;

    const merchantName = String(m.name ?? merchantSlug);
    const merchantLogo = m.logo ? String(m.logo) : "Pro1";
    const cat = m.category as Record<string, unknown> | undefined;
    const categoryKey = (category as string) || String(cat?.slug ?? "all");
    const categoryName = String(cat?.name ?? categoryKey);

    // عروض التاجر
    const offersRaw = (m.offers ?? []) as Array<Record<string, unknown>>;
    const offers = mapApiOffersToModels(offersRaw);

    // المنتجات
    const productsRaw = (m.products ?? []) as Array<Record<string, unknown>>;
    const menu = productsRaw.map((p, i) => ({
      id: String(p.id ?? `p-${i}`),
      title: { ar: String(p.name ?? ""), en: String(p.name ?? "") },
      description: { ar: String(p.description ?? ""), en: String(p.description ?? "") },
      image: String(p.image ?? ""),
      price: Number(p.price ?? 0),
      originalPrice: p.old_price ? Number(p.old_price) : undefined,
      features: [] as string[],
      rating: 0, reviewsCount: 0, views: 0, purchases: 0, bookmarks: 0,
      isPopular: false, isNew: false, isBestSeller: false,
      category: categoryKey, companyId: String(m.id ?? merchantSlug),
      maxQuantity: 10, isAvailable: true, preparationTime: "-",
    }));

    return {
      id: String(m.id ?? merchantSlug),
      slug: String(m.slug ?? merchantSlug),
      name: { ar: merchantName, en: merchantName },
      logo: merchantLogo,
      category: { key: categoryKey, ar: categoryName, en: categoryName },
      description: { ar: String(m.description ?? ""), en: String(m.description ?? "") },
      location: { ar: "-", en: "-" },
      distance: "-",
      rating: Number(m.avg_rating ?? 0),
      reviewsCount: Number(m.reviews_count ?? 0),
      views: Number(m.views_count ?? 0),
      saves: Number(m.followers_count ?? 0),
      color: "#400198",
      topColor: "bg-[#400198]",
      offers,
      menu,
      isOpen: Boolean(m.is_open),
      deliveryTime: String(m.delivery_time ?? "-"),
      minimumOrder: Number(m.min_order ?? 0),
      deliveryFee: Number(m.delivery_fee ?? 0),
      whatsapp: m.whatsapp ? String(m.whatsapp) : null,
    } as Restaurant & { whatsapp?: string | null };
  }, [merchantDetailData, merchantSlug, category]);

  // متجر «قريباً»: يظهر في الموقع لكن بلا عروض مع رسالة ترقّب
  const isComingSoon = useMemo(() => {
    const res = (merchantDetailData ?? {}) as Record<string, unknown>;
    const data = (res?.data ?? res) as Record<string, unknown>;
    const m = data?.merchant as Record<string, unknown> | undefined;
    return m?.is_coming_soon === true || m?.status === "coming_soon";
  }, [merchantDetailData]);

  /**
   * حالة المتجر وساعات عمله واسم تاب المحتوى — كلها من تفاصيل التاجر،
   * وكلها اختيارية حتى لا تنكسر الصفحة مع متجر بلا بيانات جديدة.
   */
  const storeMeta = useMemo(() => {
    const res = (merchantDetailData ?? {}) as Record<string, unknown>;
    const data = (res?.data ?? res) as Record<string, unknown>;
    const m = (data?.merchant ?? {}) as Record<string, unknown>;
    const cat = m.category as Record<string, unknown> | undefined;

    const workingHours = Array.isArray(m.working_hours)
      ? (m.working_hours as WorkingHourRow[])
      : null;

    const isOpenNow =
      typeof m.is_open_now === "boolean"
        ? m.is_open_now
        : typeof m.is_open === "boolean"
          ? m.is_open
          : null;

    const contentTabLabel =
      (typeof m.content_tab_label === "string" && m.content_tab_label.trim()) ||
      (typeof cat?.content_tab_label === "string" &&
        (cat.content_tab_label as string).trim()) ||
      "";

    return {
      workingHours,
      isOpenNow,
      isTemporarilyClosed: m.is_temporarily_closed === true,
      isVerified: m.is_verified === true,
      closedReason:
        typeof m.closed_reason === "string" && m.closed_reason.trim()
          ? m.closed_reason.trim()
          : null,
      contentTabLabel,
      deliveryTime: formatDeliveryTime(
        m.delivery_time,
        t("storePage.minute_unit", "دقيقة"),
      ),
      minOrder: formatMoneyValue(m.min_order),
      deliveryFee: formatMoneyValue(m.delivery_fee),
      todayHours: (() => {
        const today = workingHours?.find((row) => row.is_today === true);
        if (!today) return "";
        if (today.is_closed) return t("storePage.closed_today", "مغلق");
        const opens = (today.opens_at ?? "").toString().trim();
        const closes = (today.closes_at ?? "").toString().trim();
        return opens && closes ? `${opens} - ${closes}` : "";
      })(),
    };
  }, [merchantDetailData, t]);

  /** بطاقات التوصيل — تُبنى من الحقول المعبّأة فقط (نفس منطق التطبيق) */
  const deliveryDetails = useMemo(() => {
    const currency = isRTL ? "ريال" : "SAR";
    const rows: Array<{
      key: string;
      icon: React.ReactNode;
      label: string;
      value: string;
    }> = [];
    if (storeMeta.deliveryTime) {
      rows.push({
        key: "delivery_time",
        icon: <FiClock />,
        label: t("storePage.delivery_time", "وقت التوصيل"),
        value: storeMeta.deliveryTime,
      });
    }
    if (storeMeta.minOrder) {
      rows.push({
        key: "min_order",
        icon: <FiDollarSign />,
        label: t("storePage.minimum_order", "الحد الأدنى للطلب"),
        value: `${storeMeta.minOrder} ${currency}`,
      });
    }
    if (storeMeta.deliveryFee) {
      rows.push({
        key: "delivery_fee",
        icon: <FiTruck />,
        label: t("storePage.delivery_fee", "رسوم التوصيل"),
        value: `${storeMeta.deliveryFee} ${currency}`,
      });
    }
    if (storeMeta.todayHours) {
      rows.push({
        key: "today_hours",
        icon: <FiCalendar />,
        label: t("storePage.working_hours_today", "ساعات العمل اليوم"),
        value: storeMeta.todayHours,
      });
    }
    return rows;
  }, [storeMeta, t, isRTL]);

  const categoryInfo = offerCategories.find((cat) => cat.key === category);

  if (merchantLoading) {
    return (
      <div className="bg-mk-bg">
        <div className="bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] py-10">
          <div className={CONTAINER}>
            <Skeleton className="h-9 w-64 bg-white/20" />
            <Skeleton className="mt-3 h-4 w-80 bg-white/15" />
          </div>
        </div>
        <div className={`${CONTAINER} py-8`}>
          <SkeletonGrid count={8} className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className={`${CONTAINER} flex min-h-[60vh] items-center justify-center py-16`}>
        <EmptyState
          title={isRTL ? "التاجر غير موجود" : "Merchant not found"}
          description=""
          actionLabel={isRTL ? "العودة للعروض" : "Back to Offers"}
          actionTo="/offers"
          className="w-full max-w-lg"
        />
      </div>
    );
  }

  // Function to get restaurant image
  const getRestaurantImage = (logoName: string) => {
    // If it's already a URL, return it directly
    if (logoName.startsWith("http")) {
      return logoName;
    }

    // Otherwise, use the local images
    switch (logoName) {
      case "Pro1":
        return Pro1;
      case "Pro2":
        return Pro2;
      case "Pro3":
        return Pro3;
      case "Pro4":
        return Pro4;
      case "Pro5":
        return Pro5;
      case "Pro6":
        return Pro6;
      case "Pro7":
        return Pro7;
      case "Pro8":
        return Pro8;
      default:
        return Pro1;
    }
  };

  const handleOfferClick = (offer: Offer) => {
    navigate(`/offers/${category}/${merchantSlug}/${offer.slug || offer.id}`);
  };

  const handleMenuItemClick = (menuItem: MenuItem) => {
    navigate(`/offers/${category}/${merchantSlug}/${menuItem.id}`);
  };

  return (
    <>
      <Helmet>
        <title>
          {isRTL ? restaurant.name.ar : restaurant.name.en} -{" "}
          {isRTL ? "العروض" : "Offers"}
        </title>
        <link
          rel="canonical"
          href={`https://mukafaat.com/offers/${category}/${merchantSlug}`}
        />
      </Helmet>

      {/* ===== غلاف المتجر — صورة بتدرّج فوقها + شعار بارز + شارات ===== */}
      <section className="relative overflow-hidden bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)]">
        {/* الصورة كخلفية ناعمة تحت التدرّج */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-25 blur-[3px]"
          style={{ backgroundImage: `url(${getRestaurantImage(restaurant.logo)})` }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(150deg,rgba(27,17,80,0.92),rgba(64,1,152,0.86)_55%,rgba(103,3,235,0.78))]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -top-28 end-[-80px] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(253,103,26,0.5),transparent_65%)]"
        />

        <div className={`${CONTAINER} relative py-7 sm:py-10`}>
          {/* رجوع + مسار تنقّل */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(`/offers/${category}`)}
              className={`inline-flex h-11 items-center gap-1.5 rounded-mk-md border border-white/25 bg-white/10 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-white/20 ${FOCUS}`}
            >
              <LuChevronLeft aria-hidden className="rtl:-scale-x-100" size={16} />
              {t("offerDetail.back", "رجوع")}
            </button>
            <nav aria-label="breadcrumb" className="min-w-0">
              <ol className="flex flex-wrap items-center gap-1.5 text-[12px] text-white/75">
                {[
                  { label: t("propertyDetail.breadcrumb.home", "الرئيسية"), to: "/" },
                  { label: t("home.navbar.offers", "العروض"), to: "/offers" },
                  {
                    label:
                      restaurant?.category?.ar ||
                      (categoryInfo ? (isRTL ? categoryInfo.ar : categoryInfo.en) : "") ||
                      String(category ?? ""),
                    to: `/offers/${category}`,
                  },
                  { label: isRTL ? restaurant.name.ar : restaurant.name.en },
                ].map((crumb, i) => (
                  <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                    {i > 0 && (
                      <span aria-hidden className="text-white/40">
                        /
                      </span>
                    )}
                    {crumb.to ? (
                      <RouterLink to={crumb.to} className="transition-colors hover:text-white">
                        {crumb.label}
                      </RouterLink>
                    ) : (
                      <span className="font-bold text-mk-accent">{crumb.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              {/* شعار بارز */}
              <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-mk-xl bg-white p-2 shadow-[0_16px_34px_-14px_rgba(0,0,0,0.55)] ring-4 ring-white/20 sm:h-24 sm:w-24">
                <SmartImage
                  src={getRestaurantImage(restaurant.logo)}
                  name={isRTL ? restaurant.name.ar : restaurant.name.en}
                  alt=""
                  objectFit="contain"
                  className="h-full w-full"
                  bg="#FFFFFF"
                />
              </span>

              <div className="min-w-0">
                <p className="m-0 text-[12px] font-extrabold tracking-wide text-mk-accent">
                  {restaurant?.category?.ar ||
                    (categoryInfo ? (isRTL ? categoryInfo.ar : categoryInfo.en) : "")}
                </p>
                <h1 className="m-0 text-[26px] font-extrabold leading-tight text-white sm:text-[34px]">
                  {isRTL ? restaurant.name.ar : restaurant.name.en}
                </h1>
                <p className="m-0 mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-white/75">
                  {stripHtml(restaurant.description[isRTL ? "ar" : "en"])}
                </p>
              </div>
            </div>

            {(restaurant as unknown as Record<string, unknown>).whatsapp ? (
              <a
                href={`https://wa.me/${(restaurant as unknown as Record<string, unknown>).whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[linear-gradient(135deg,#12A06A,#0B7B50)] px-6 text-[14px] font-extrabold text-white shadow-[0_12px_28px_-10px_rgba(18,160,106,0.9)] transition-transform hover:-translate-y-0.5 ${FOCUS}`}
              >
                {t("storePage.whatsapp", "تواصل واتساب")}
              </a>
            ) : null}
          </div>

          {/* الشارات: موثّق / مفتوح-مغلق / قريباً / التقييم / العدّادات */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <OpenStatusBadge
              isOpenNow={storeMeta.isOpenNow}
              isTemporarilyClosed={storeMeta.isTemporarilyClosed}
            />
            {storeMeta.isVerified && (
              <Ribbon tone="info" icon={<FiCheckCircle aria-hidden />}>
                {t("storePage.verified", "متجر موثّق")}
              </Ribbon>
            )}
            {isComingSoon && (
              <Ribbon tone="ending">{t("storePage.coming_soon", "قريباً")}</Ribbon>
            )}
            {Number(restaurant.rating) > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-bold text-white ring-1 ring-white/15">
                <span aria-hidden className="text-mk-gold">
                  ★
                </span>
                {restaurant.rating}
                {restaurant.reviewsCount ? ` (${restaurant.reviewsCount})` : ""}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white ring-1 ring-white/15">
              <FiEye aria-hidden />
              {restaurant.views}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white ring-1 ring-white/15">
              <FiBookmark aria-hidden />
              {restaurant.saves}
            </span>
          </div>
        </div>
      </section>

      {/* ===== محتوى المتجر: عمود العروض + بطاقة معلومات جانبية ===== */}
      <section className={`${CONTAINER} min-h-[50vh] bg-mk-bg py-8 sm:py-10`}>
        {/* مغلق مؤقتاً — تنبيه واضح داخل الصفحة */}
        {storeMeta.isTemporarilyClosed && (
          <div
            role="status"
            className="mb-7 rounded-mk-lg border border-[#F7DDE1] bg-[#FFF7F8] px-5 py-4"
          >
            <p className="m-0 font-bold text-mk-red">{t("storePage.temporarily_closed")}</p>
            {storeMeta.closedReason && (
              <p className="m-0 mt-1 text-[13px] text-mk-text-strong">{storeMeta.closedReason}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          {/* العمود الرئيسي */}
          <div className="min-w-0">
            {/* التبويبات — شرائح بنفسجية واضحة */}
            <div
              role="tablist"
              aria-label={isRTL ? "أقسام المتجر" : "Store sections"}
              className="mb-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-mk-md border border-mk-border bg-white p-1 shadow-mk-card"
            >
              {([
                {
                  key: "offers" as const,
                  label: t("home.navbar.offers", isRTL ? "العروض" : "Offers"),
                  count: restaurant.offers.length,
                },
                {
                  key: "menu" as const,
                  label: storeMeta.contentTabLabel || t("storePage.content_tab_default"),
                  count: restaurant.menu.length,
                },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-mk-sm px-5 text-[13.5px] font-extrabold transition-colors ${FOCUS} ${
                    activeTab === tab.key
                      ? "bg-[linear-gradient(135deg,#400198,#6703EB)] text-white shadow-[0_8px_20px_-10px_rgba(64,1,152,0.9)]"
                      : "text-mk-muted hover:bg-mk-tint2"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span
                      dir="ltr"
                      className={`rounded-full px-1.5 py-0.5 text-[10.5px] font-extrabold leading-none ${
                        activeTab === tab.key
                          ? "bg-white/20 text-white"
                          : "bg-mk-tint text-mk-primary"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* المحتوى حسب التبويب */}
            {activeTab === "offers" && isComingSoon && (
              <EmptyState
                icon={<FiClock />}
                title={isRTL ? "قريباً على مكافآت" : "Coming soon to Mukafaat"}
                description={
                  isRTL
                    ? `عروض وخصومات ${restaurant.name.ar} ستتوفر قريباً — تابعنا ليصلك كل جديد.`
                    : `${restaurant.name.en}'s offers are launching soon — stay tuned.`
                }
                actionLabel={t("offerDetail.back_to_offers", isRTL ? "كل العروض" : "All offers")}
                actionTo="/offers"
              />
            )}

            {activeTab === "offers" &&
              !isComingSoon &&
              (restaurant.offers.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                  {restaurant.offers.map((offer) => (
                    <OfferCard key={offer.id} offer={offer} onOfferClick={handleOfferClick} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={t("ui.empty.offers", isRTL ? "لا توجد عروض حالياً" : "No offers right now")}
                  description=""
                  actionLabel={t("offerDetail.back_to_offers", isRTL ? "كل العروض" : "All offers")}
                  actionTo="/offers"
                />
              ))}

            {activeTab === "menu" &&
              (restaurant.menu.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                  {restaurant.menu.map((menuItem) => (
                    <Card key={menuItem.id} padding="none" interactive className="flex flex-col">
                      {menuItem.image && (
                        <div className="border-b border-mk-border bg-mk-tint2">
                          <Ratio ratio="aspect-[16/10]">
                            <SmartImage
                              src={menuItem.image}
                              name={menuItem.title[isRTL ? "ar" : "en"]}
                              alt={menuItem.title[isRTL ? "ar" : "en"]}
                              variant="name"
                            />
                          </Ratio>
                        </div>
                      )}
                      <div className="flex flex-1 flex-col gap-2 p-4">
                        <h3 className="mk-clamp-2 m-0 text-[14.5px] font-bold text-mk-text">
                          {menuItem.title[isRTL ? "ar" : "en"]}
                        </h3>
                        {menuItem.description[isRTL ? "ar" : "en"] && (
                          <p className="mk-clamp-2 m-0 text-[12.5px] leading-relaxed text-mk-muted">
                            {menuItem.description[isRTL ? "ar" : "en"]}
                          </p>
                        )}
                        <div className="mt-auto pt-1">
                          {/* سعر مشطوب عند وجود سعر أصلي أعلى */}
                          <PriceTag price={menuItem.price} priceBefore={menuItem.originalPrice} />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title={isRTL ? "لا توجد منتجات حالياً" : "No products available"}
                  description=""
                />
              ))}
          </div>

          {/* بطاقة المعلومات الجانبية — التوصيل وساعات العمل */}
          <aside className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-24">
            {deliveryDetails.length > 0 && (
              <div className="overflow-hidden rounded-mk-lg border border-mk-border bg-white shadow-mk-card">
                <p className="m-0 bg-[linear-gradient(135deg,#F2EFFA,#EFEAF8)] px-4 py-3 text-[13px] font-extrabold text-mk-primary">
                  {t("storePage.delivery_details", "تفاصيل التوصيل")}
                </p>
                <ul className="m-0 list-none divide-y divide-mk-divider p-0">
                  {deliveryDetails.map((item) => (
                    <li key={item.key} className="flex items-center gap-3 px-4 py-3">
                      <span
                        aria-hidden
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mk-tint text-mk-primary"
                      >
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11.5px] text-mk-faint">{item.label}</span>
                        <span className="block truncate text-[13.5px] font-extrabold text-mk-text">
                          {item.value}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ساعات العمل لكل يوم */}
            <StoreWorkingHours workingHours={storeMeta.workingHours} />
          </aside>
        </div>
      </section>

      <GetStartedSection className="mt-16 mb-28" />
    </>
  );
};

export default RestaurantDetailsPage;
