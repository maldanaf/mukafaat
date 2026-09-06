"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useIsRTL } from "@hooks";
import { useTranslation } from "react-i18next";
import { pickLocalized } from "@utils/pickLocalized";
import {
  FiArrowLeft,
  FiTag,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiEye,
} from "react-icons/fi";
import {
  getRestaurantById,
  offerCategories,
  type Offer,
  type Restaurant,
} from "@data/offers";
import CurrencyIcon from "@components/CurrencyIcon";
import { LuCrown, LuCalendarDays, LuPercent, LuStore, LuEye, LuCheck } from "react-icons/lu";
import { FOCUS } from "@ui";
import QuantitySelector from "@components/QuantitySelector";
import SubscribersOnlyModal from "@components/SubscribersOnlyModal";
import { stripHtml } from "@utils/stripHtml";
import {
  Pro1,
  Pro2,
  Pro3,
  Pro4,
  Pro5,
  Pro6,
  Pro7,
  Pro8,
  AboutPattern,
  Visa,
  Master,
  ApplePay,
  Mada,
} from "@assets";
import { useUserStore } from "@stores/userStore";
import { useQueryClient } from "@tanstack/react-query";
import {
  useWebOfferDetail,
  useSubscriptionStatus,
  useFavorites,
  useFavoriteToggle,
  useCreateOrder,
  mokafaatKeys,
} from "@hooks/api/useMokafaatQueries";
import {
  mapApiOfferToModel,
  mapRelatedOfferToModel,
} from "@network/mappers/offersMapper";
import { isUserSubscribed } from "@utils/subscription";
import { normalizeFavoritesList } from "@utils/favorites";
import { ShareIcon, HeartIcon } from "@ui";
import { toast } from "react-toastify";
import OfferCard from "@views/offers/components/OfferCard";
import OfferStats from "@components/OfferStats";
import { PriceTag, Badge } from "@ui";
import { useShareSheetStore } from "@stores/shareSheetStore";

const getOfferImageSrc = (imageName: string) => {
  if (imageName.startsWith("http")) return imageName;
  switch (imageName) {
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

const OfferDetailPage = () => {
  const { category, merchantSlug, offerSlug } = useParams<{
    category: string;
    merchantSlug: string;
    offerSlug: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isRTL = useIsRTL();
  const { t, i18n } = useTranslation();
  const langBase = i18n.language?.split("-")[0] || "en";
  const [quantity, setQuantity] = useState(1);
  const [subscribersOnlyModalOpen, setSubscribersOnlyModalOpen] =
    useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [brokenImages, setBrokenImages] = useState<Record<number, boolean>>({});
  const [galleryOpen, setGalleryOpen] = useState(false);
  type TabKey = "description" | "terms" | "privacy";
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const handleQuantityChange = useCallback((q: number) => setQuantity(q), []);

  const token = useUserStore((s) => s.token);
  const { data: webOfferDetailData, isLoading: isOfferLoading } =
    useWebOfferDetail(offerSlug);
  const queryClient = useQueryClient();
  const createOrder = useCreateOrder();
  const { data: subscriptionStatusData } = useSubscriptionStatus(!!token);
  const isSubscribed = isUserSubscribed(subscriptionStatusData);
  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useFavoriteToggle();
  const openShare = useShareSheetStore((s) => s.openShare);
  const favoritesList = useMemo(
    () => normalizeFavoritesList(favoritesData ?? null),
    [favoritesData],
  );

  const staticRestaurant = merchantSlug
    ? getRestaurantById(merchantSlug)
    : null;

  const apiRestaurantAndOffer = useMemo<{
    restaurant: Restaurant | null;
    offer: Offer | null;
  }>(() => {
    const apiRoot = webOfferDetailData as Record<string, unknown> | undefined;
    const data = apiRoot?.data as Record<string, unknown> | undefined;
    const apiOfferRaw = data?.offer as Record<string, unknown> | undefined;
    if (!apiOfferRaw) {
      return { restaurant: null, offer: null };
    }

    const mappedOffer = mapApiOfferToModel(apiOfferRaw);
    if (!mappedOffer) {
      return { restaurant: null, offer: null };
    }

    const merchant = apiOfferRaw.merchant as
      | Record<string, unknown>
      | undefined;
    const apiCategory = apiOfferRaw.category as
      | Record<string, unknown>
      | undefined;

    const categoryKey =
      (category as string) || mappedOffer.category || "restaurants";
    const categoryInfo = offerCategories.find((c) => c.key === categoryKey);
    const categoryName =
      mappedOffer.categoryName ||
      (apiCategory?.name as string | undefined) ||
      categoryInfo?.["ar"] ||
      categoryKey;

    const merchantName =
      mappedOffer.merchantName || (merchant?.name as string | undefined) || "";
    const merchantLogo =
      mappedOffer.merchantLogo ||
      (merchant?.logo as string | undefined) ||
      mappedOffer.image ||
      "Pro1";

    const restaurantModel: Restaurant = {
      id:
        (merchant?.id !== undefined
          ? String(merchant.id)
          : String(mappedOffer.companyId)) || String(merchantSlug || ""),
      slug:
        (merchant?.id !== undefined
          ? String(merchant.id)
          : String(mappedOffer.companyId)) || String(merchantSlug || ""),
      name: {
        ar: merchantName || mappedOffer.title.ar,
        en: merchantName || mappedOffer.title.en,
      },
      logo: merchantLogo,
      category: {
        key: categoryKey,
        ar: categoryInfo?.ar || categoryName,
        en: categoryInfo?.en || categoryName,
      },
      description: {
        ar: mappedOffer.description.ar,
        en: mappedOffer.description.en,
      },
      location: { ar: "-", en: "-" },
      distance: "-",
      rating: mappedOffer.rating ?? 0,
      reviewsCount: mappedOffer.reviewsCount ?? 0,
      views: mappedOffer.views ?? 0,
      saves: mappedOffer.bookmarks ?? 0,
      color: "#400198",
      topColor: "bg-[#400198]",
      offers: [mappedOffer],
      menu: [],
      isOpen: true,
      deliveryTime: "-",
      minimumOrder: 0,
      deliveryFee: 0,
    };

    return { restaurant: restaurantModel, offer: mappedOffer };
  }, [webOfferDetailData, category, merchantSlug]);

  const apiDetailExtras = useMemo(() => {
    const apiRoot = webOfferDetailData as Record<string, unknown> | undefined;
    const data = apiRoot?.data as Record<string, unknown> | undefined;
    const apiOfferRaw = data?.offer as Record<string, unknown> | undefined;
    const relatedRaw = data?.related_offers as
      | Array<Record<string, unknown>>
      | undefined;
    const privacyPolicy =
      apiOfferRaw && typeof apiOfferRaw.privacy_policy === "string"
        ? apiOfferRaw.privacy_policy
        : "";
    const relatedOffers: Offer[] = Array.isArray(relatedRaw)
      ? relatedRaw
          .map((item) =>
            mapRelatedOfferToModel(item, (category as string) || "all"),
          )
          .filter((o): o is Offer => o !== null)
      : [];
    const userPurchaseCount =
      apiOfferRaw?.user_purchase_count != null
        ? Number(apiOfferRaw.user_purchase_count)
        : undefined;
    return { privacyPolicy, relatedOffers, userPurchaseCount };
  }, [webOfferDetailData, category]);

  const restaurant: Restaurant | null =
    apiRestaurantAndOffer.restaurant || staticRestaurant;
  const offer: Offer | null = apiRestaurantAndOffer.offer;

  const isOfferFavorite = useMemo(
    () =>
      offer &&
      favoritesList.some(
        (f) =>
          f.favorable_type === "offer" &&
          String(f.favorable_id) === String(offer.id),
      ),
    [offer, favoritesList],
  );

  const maxQty = offer ? Math.max(1, Number(offer.maxQuantity) || 1) : 1;

  // منطق شراء العرض من الـ API
  // 1) per_user_limit === 0 → استفاد من العرض مسبقاً (إخفاء العداد والزر)
  // 2) usage_limit != null && usage_limit <= purchase_count → لقد انتهى العرض (لا مخزون)
  // 3) غير ذلك: إظهار زر الشراء والعداد عندما usage_limit > purchase_count و per_user_limit > 0
  const perUserLimit = offer ? Number(offer.maxQuantity) || 0 : 0;
  const userPurchaseCount =
    offer?.userPurchaseCount ?? apiDetailExtras.userPurchaseCount ?? 0;
  const totalSold = offer?.purchases ?? 0;
  const usageLimit = offer?.usageLimit;
  const usedQuotaBefore = perUserLimit === 0; // استفاد من العرض مسبقاً
  const offerEndedNoStock = usageLimit != null && totalSold >= usageLimit; // usage_limit > purchase_count → متوفر
  const hasStock = usageLimit == null || totalSold < usageLimit;
  const canPurchase =
    !usedQuotaBefore &&
    hasStock &&
    perUserLimit > 0 &&
    userPurchaseCount < perUserLimit;

  // معرض الصور: الصورة الرئيسية تكون أول مصغرة (المحددة عند الفتح)
  const galleryImages = useMemo(() => {
    if (!restaurant || !offer) return [Pro1, Pro1, Pro1, Pro1];

    const mainSrc = getOfferImageSrc(offer.image);
    const apiImages: string[] =
      Array.isArray(offer.images) && offer.images.length > 0
        ? offer.images.map((src) => getOfferImageSrc(src))
        : [];

    if (apiImages.length > 0) {
      // الصورة الرئيسية أولاً حتى تكون المحددة/المختارة عند التحميل
      if (apiImages[0] !== mainSrc) {
        return [mainSrc, ...apiImages.filter((src) => src !== mainSrc)];
      }
      return apiImages;
    }

    const logo = getOfferImageSrc(restaurant.logo);
    return [mainSrc, logo, mainSrc, mainSrc];
  }, [offer, restaurant]);
  const mainImageSrc = galleryImages[selectedImageIndex] ?? galleryImages[0];

  const categoryInfo = offerCategories.find((c) => c.key === category);
  const categoryName = offer?.categoryName
    || (categoryInfo ? (langBase === "ar" ? categoryInfo.ar : categoryInfo.en) : null)
    || category;
  const restaurantName = pickLocalized(restaurant?.name, langBase);
  const offerTitle = pickLocalized(offer?.title, langBase);

  const handlePurchase = () => {
    if (!category || !merchantSlug || !offerSlug || !offer) return;
    if (!token) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }
    // لو يحتاج اشتراك وما عنده سعر لغير المشتركين → يطلب اشتراك
    if (!isSubscribed && offer.requiresSubscription && (offer.nonSubscriberPrice == null || offer.nonSubscriberPrice <= 0)) {
      setSubscribersOnlyModalOpen(true);
      return;
    }
    createOrder.mutate(
      {
        order_type: "offer",
        item_id: offerSlug,
        quantity,
        branch_id: undefined,
      },
      {
        onSuccess: (res: unknown) => {
          const raw = res as { data?: unknown };
          const data = raw?.data ?? raw;
          const root = (data as Record<string, unknown>) ?? {};
          if (root.status === false) {
            const errNum = root.errNum as string | undefined;
            if (errNum === "E005") {
              void queryClient.invalidateQueries({
                queryKey: mokafaatKeys.subscriptionStatus,
              });
              setSubscribersOnlyModalOpen(true);
              toast.error(
                (root.msg as string) || t("offerDetail.subscription_required"),
              );
              return;
            }
            toast.error(
              (root.msg as string) || t("offerDetail.could_not_create_order"),
            );
            return;
          }
          const inner = (root.data ?? root) as Record<string, unknown>;
          const order = (inner?.order ?? root.order) as
            | Record<string, unknown>
            | undefined;

          const paymentUrl = (root.payment_url ??
            inner?.payment_url ??
            root.redirect_url ??
            inner?.redirect_url) as string | undefined;
          if (paymentUrl && typeof paymentUrl === "string") {
            window.location.href = paymentUrl;
            return;
          }

          const orderId =
            order?.id != null
              ? order.id
              : ((root.order_id ?? inner?.order_id) as
                  | string
                  | number
                  | undefined);
          const requiresPayment = order?.requires_payment === true;

          if (requiresPayment && orderId != null) {
            try {
              sessionStorage.setItem("mokafaat_payment", JSON.stringify({
                orderId,
                order,
                offer: { id: offer.id, title: offer.title, image: offer.image, discountPrice: offer.discountPrice, originalPrice: offer.originalPrice, discountPercentage: offer.discountPercentage, platformPrice: offer.platformPrice, subscriberPrice: offer.subscriberPrice, nonSubscriberPrice: offer.nonSubscriberPrice },
                restaurant: { id: restaurant?.id, name: restaurant?.name, logo: restaurant?.logo, category: restaurant?.category },
              }));
            } catch {}
            window.location.href = `/offers/${category}/${merchantSlug}/payment?offer=${offerSlug}&quantity=${quantity}&order_id=${orderId}`;
            return;
          }

          if (!requiresPayment) {
            // Free offer — go directly to order details (activation + PDF)
            toast.success(t("offerDetail.order_created_success") || (t("offersPage.t_67eba3", "تم إنشاء طلبك بنجاح")));
            if (orderId != null) {
              window.location.href = `/orders/${orderId}`;
            } else {
              window.location.href = "/orders";
            }
            return;
          }

          try {
            sessionStorage.setItem("mokafaat_payment", JSON.stringify({
              orderId, order,
              offer: { id: offer.id, title: offer.title, image: offer.image, discountPrice: offer.discountPrice, originalPrice: offer.originalPrice, discountPercentage: offer.discountPercentage, platformPrice: offer.platformPrice },
              restaurant: { id: restaurant?.id, name: restaurant?.name, logo: restaurant?.logo, category: restaurant?.category },
            }));
          } catch {}
          window.location.href = `/offers/${category}/${merchantSlug}/payment?offer=${offerSlug}&quantity=${quantity}&order_id=${orderId}`;
        },
        onError: () => {
          toast.error(t("offerDetail.failed_create_order"));
        },
      },
    );
  };

  if (isOfferLoading) {
    return (
      <>
        {/* سكيلتون الهيدر */}
        <section className="relative w-full bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] overflow-hidden min-h-[200px] flex items-center justify-center">
          <div className="absolute inset-0 bg-primary opacity-30" />
          <div className="relative pt-24 pb-10 px-6 mx-auto max-w-site w-full text-center lg:pt-24 lg:pb-10 lg:px-12 flex flex-col justify-center z-10">
            <div className="flex items-center justify-between absolute top-4 left-4 right-4">
              <div className="h-8 w-20 bg-white/20 rounded-mk-sm animate-pulse" />
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white/20 animate-pulse" />
                <div className="w-10 h-10 rounded-full bg-white/20 animate-pulse" />
              </div>
            </div>
            <div
              className="absolute top-4 w-12 h-12 rounded-full bg-white/20 animate-pulse hidden sm:block"
              style={isRTL ? { left: "1rem" } : { right: "1rem" }}
            />
            <div className="h-8 w-3/4 max-w-xl bg-white/20 rounded-mk-sm animate-pulse mx-auto mb-2" />
            <div className="h-4 w-1/2 max-w-md bg-white/15 rounded animate-pulse mx-auto mb-4" />
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-4 w-16 bg-white/20 rounded animate-pulse" />
              <div className="h-4 w-24 bg-white/15 rounded animate-pulse" />
            </div>
            <div className="flex items-center justify-center gap-1 flex-wrap">
              <div className="h-3 w-12 bg-white/15 rounded animate-pulse" />
              <div className="h-3 w-4 bg-white/15 rounded animate-pulse" />
              <div className="h-3 w-14 bg-white/15 rounded animate-pulse" />
              <div className="h-3 w-4 bg-white/15 rounded animate-pulse" />
              <div className="h-3 w-20 bg-white/15 rounded animate-pulse" />
            </div>
          </div>
        </section>

        <div className="min-h-screen bg-mk-tint3">
          <div className="container mx-auto px-4 py-8 max-w-site -mt-2 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* سكيلتون عمود المحتوى */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-mk-2xl shadow-mk-raised overflow-hidden animate-pulse">
                  <div
                    className={`flex gap-3 p-4 items-stretch h-[400px] ${isRTL ? "flex-row-reverse" : ""}`}
                  >
                    <div className="grid grid-cols-1 grid-rows-4 gap-0 w-32 flex-shrink-0 h-full overflow-hidden rounded-mk-md">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`w-full h-full bg-mk-border-strong/50 ${i === 0 ? "rounded-t-xl" : ""} ${i === 3 ? "rounded-b-xl" : ""}`}
                        />
                      ))}
                    </div>
                    <div className="flex-1 min-h-0 h-[365px] max-h-[365px] rounded-mk-md bg-mk-border-strong/50" />
                  </div>
                </div>

                <div className="bg-white rounded-mk-2xl shadow-mk-raised overflow-hidden animate-pulse">
                  <div className="flex border-b">
                    <div className="h-12 w-32 bg-mk-tint2 mx-1 rounded-t" />
                    <div className="h-12 w-36 bg-mk-tint2 mx-1 rounded-t" />
                    <div className="h-12 w-28 bg-mk-tint2 mx-1 rounded-t" />
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="h-16 bg-mk-tint2 rounded-mk-sm" />
                      <div className="h-16 bg-mk-tint2 rounded-mk-sm" />
                    </div>
                    <div className="h-4 w-full bg-mk-tint2 rounded" />
                    <div className="h-4 w-4/5 bg-mk-tint2 rounded" />
                    <div className="h-4 w-3/4 bg-mk-tint2 rounded" />
                    <div className="flex flex-wrap gap-2 mt-4">
                      <div className="h-6 w-16 bg-mk-tint2 rounded-full" />
                      <div className="h-6 w-20 bg-mk-tint2 rounded-full" />
                      <div className="h-6 w-14 bg-mk-tint2 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              {/* سكيلتون الشريط الجانبي */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-6 bg-white rounded-mk-2xl shadow-mk-raised p-6 space-y-6 animate-pulse">
                  <div className="flex flex-wrap gap-2">
                    <div className="h-8 w-28 bg-mk-tint2 rounded-full" />
                    <div className="h-8 w-24 bg-mk-tint2 rounded-full" />
                    <div className="h-8 w-20 bg-mk-tint2 rounded-full" />
                  </div>
                  <div className="h-6 w-48 bg-mk-tint2 rounded" />
                  <div className="border border-mk-border rounded-mk-md p-4 space-y-3">
                    <div className="h-5 w-3/4 bg-mk-tint2 rounded" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="h-4 w-10 bg-mk-tint2 rounded" />
                      <div className="h-6 w-14 bg-mk-tint2 rounded" />
                      <div className="h-5 w-16 bg-mk-tint2 rounded-full" />
                    </div>
                    <div className="h-3 w-40 bg-mk-tint3 rounded" />
                    <div className="flex items-center gap-2 mt-3">
                      <div className="h-10 w-24 bg-mk-tint2 rounded-mk-sm" />
                    </div>
                    <div className="h-4 w-20 bg-mk-tint2 rounded" />
                  </div>
                  <div className="h-12 w-full bg-mk-border-strong/50 rounded-mk-md" />
                  <div className="h-12 w-full bg-mk-tint3 rounded-mk-md" />
                  <div>
                    <div className="h-4 w-24 bg-mk-tint2 rounded mb-2" />
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-12 bg-mk-tint3 rounded" />
                      <div className="h-4 w-16 bg-mk-tint3 rounded" />
                      <div className="h-4 w-10 bg-mk-tint3 rounded" />
                      <div className="h-4 w-14 bg-mk-tint3 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!restaurant || !offer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-mk-text mb-4">
            {t("offerDetail.offer_not_found")}
          </h2>
          <button
            onClick={() => navigate("/offers")}
            className="bg-mk-primary text-white px-6 py-2 rounded-mk-sm hover:bg-mk-primary transition-colors"
          >
            {t("offerDetail.back_to_offers")}
          </button>
        </div>
      </div>
    );
  }

  // مجاني: من API `pricing_type === "free"`؛ عند غياب الحقل نستخدم سعر المنصة كما سابقاً.
  const isFree =
    offer.pricingType === "free" ||
    (offer.pricingType == null &&
      (offer.platformPrice == null || Number(offer.platformPrice) <= 0));

  /** عرض وحساب: `price_after` / `price_before` من الموديل (من الـ API) */
  const displayPriceAfter = offer.priceAfter ?? offer.discountPrice;
  const displayPriceBefore = offer.priceBefore ?? offer.originalPrice;

  // سعر الدفع الفعلي حسب حالة الاشتراك
  const unitPrice = (() => {
    if (isFree && isSubscribed) return 0;
    // لو فيه سعر لغير المشتركين وما عنده اشتراك
    if (!isSubscribed && offer.nonSubscriberPrice != null && offer.nonSubscriberPrice > 0) {
      return Number(offer.nonSubscriberPrice);
    }
    // سعر المشتركين (أو السعر العادي)
    return Number(offer.platformPrice ?? offer.priceAfter ?? offer.discountPrice ?? 0) || 0;
  })();

  const totalPrice = unitPrice * quantity;

  return (
    <>
      <SubscribersOnlyModal
        isOpen={subscribersOnlyModalOpen}
        onClose={() => setSubscribersOnlyModalOpen(false)}
        onSubscribe={() =>
          navigate(`/subscription/plans?from=${encodeURIComponent(location.pathname)}`, {
            state: {
              from: `${location.pathname}${location.search}`,
            },
          })
        }
        onBackToOffer={() => setSubscribersOnlyModalOpen(false)}
      />
      {/* العنوان من الخادم — الوسم هنا كان يُخرج «العرض, - ,المتجر, | ,عروض» */}
      <Helmet>
        <link
          rel="canonical"
          href={`https://mukafaat.com.sa/offers/${category}/${merchantSlug}/${offerSlug}`}
        />
      </Helmet>

      {/* هيدر: عنوان، تقييم، أيقونات، لوجو */}
      <section className="relative w-full bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] overflow-hidden min-h-[200px] flex items-center justify-center">
        <div className="absolute inset-0 bg-primary opacity-30" />
        <div className="relative pt-24 pb-10 px-6 mx-auto max-w-site w-full text-center lg:pt-24 lg:pb-10 lg:px-12 flex flex-col justify-center z-10">
          <div className="flex items-center justify-between absolute top-4 left-4 right-4">
            <button
              onClick={() => navigate(`/offers/${category}/${merchantSlug}`)}
              className="text-white hover:text-mk-lilac transition-colors flex items-center gap-2"
            >
              <FiArrowLeft className="text-xl" />
              <span className="text-sm">{t("offerDetail.back")}</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  if (!offer) return;
                  const title = stripHtml(
                    pickLocalized(offer.title, langBase) ?? "",
                  );
                  const url = `${window.location.origin}/offers/${category}/${merchantSlug}/${offerSlug}`;
                  openShare({ title, url });
                }}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label={t("offerDetail.aria_share")}
              >
                <ShareIcon size={18} />
              </button>
              {offer && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!token) {
                      navigate(
                        `/login?returnUrl=${encodeURIComponent(location.pathname)}`,
                      );
                      return;
                    }
                    toggleFavorite.mutate(
                      { favorable_type: "offer", favorable_id: offer.id },
                      {
                        onSuccess: () => {
                          toast.success(
                            isOfferFavorite
                              ? t("couponModal.removedFromFavorites")
                              : t("couponModal.addedToFavorites"),
                          );
                        },
                        onError: () =>
                          toast.error(t("couponModal.errorGeneric")),
                      },
                    );
                  }}
                  className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                  disabled={toggleFavorite.isPending}
                >
                  {isOfferFavorite ? (
                    <HeartIcon size={18} filled className="text-[#FCA5A5]" />
                  ) : (
                    <HeartIcon size={18} />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* لوجو المتجر أعلى اليمين */}
          <div
            className="absolute top-4 w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 hidden sm:block"
            style={isRTL ? { left: "1rem" } : { right: "1rem" }}
          >
            <img
              src={getOfferImageSrc(restaurant.logo)}
              alt={restaurantName}
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight leading-tight text-white px-4">
            {offerTitle}
          </h1>
          {pickLocalized(restaurant.description, langBase) && (
            <p className="text-white/80 text-base mb-3 max-w-2xl mx-auto line-clamp-2">
              {stripHtml(pickLocalized(restaurant.description, langBase))}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 text-white/90 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400">★</span>
              <span className="font-medium">{offer.rating}</span>
              <span className="text-white/70">
                {t("offerDetail.reviews_word")}
              </span>
              <span>{offer.reviewsCount ?? offer.purchases ?? 0}</span>
            </div>
            <span className="text-white/50">|</span>
            <div className="flex items-center gap-2 text-white/90">
              <FiEye className="text-white/80 shrink-0" size={18} />
              <span>{offer.views ?? 0}</span>
              <span className="text-white/70">
                {t("offerDetail.views_word")}
              </span>
            </div>
            {/* المفضلة والمشاركات — تظهر عند توفرها في مخرجات الـ API */}
            {(offer.favoritesCount != null || offer.sharesCount != null) && (
              <>
                <span className="text-white/50">|</span>
                <OfferStats
                  favorites={offer.favoritesCount}
                  shares={offer.sharesCount}
                  className="text-white/90"
                  iconSize="w-4 h-4"
                  textSize="text-sm"
                  gap="gap-3"
                />
              </>
            )}
          </div>
          <div className="flex items-center justify-center text-sm flex-wrap gap-x-1 text-white/80">
            <Link to="/" className="hover:text-white transition-colors text-xs">
              {t("propertyDetail.breadcrumb.home")}
            </Link>
            <span className="text-xs">|</span>
            <Link
              to="/offers"
              className="hover:text-white transition-colors text-xs"
            >
              {t("home.navbar.offers")}
            </Link>
            {category && (
              <>
                <span className="text-xs">|</span>
                <Link
                  to={`/offers/${category}`}
                  className="hover:text-white transition-colors text-xs"
                >
                  {categoryName}
                </Link>
              </>
            )}
            <span className="text-xs">|</span>
            <Link
              to={`/store/${merchantSlug}`}
              className="hover:text-white transition-colors text-xs"
            >
              {restaurantName}
            </Link>
            <span className="text-xs">|</span>
            <span
              className="text-[#fd671a] font-medium text-xs"
              aria-current="page"
            >
              {offerTitle}
            </span>
          </div>
        </div>
        <div className="absolute -bottom-10 transform z-0">
          <img
            src={AboutPattern}
            alt=""
            className="w-full h-96 animate-float"
          />
        </div>
      </section>

      <div className="min-h-screen bg-mk-tint3" style={{ paddingTop: "0" }}>
        <div className="container mx-auto px-4 py-8 max-w-site -mt-2 relative z-10 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* عمود المحتوى: معرض الصور + التابات */}
            <div className="lg:col-span-2 space-y-6">
              {/* معرض الصور — ديسكتوب: مصغّرات عمودية جانبية · موبايل: مصغّرات أفقية تحت الصورة */}
              <div className="bg-white rounded-mk-2xl shadow-mk-raised overflow-hidden mb-6">
                {/* ديسكتوب (lg فأعلى) */}
                <div
                  className={`hidden lg:flex gap-3 p-4 items-stretch h-[400px] ${isRTL ? "flex-row-reverse" : ""}`}
                >
                  <div className="grid grid-cols-1 grid-rows-4 gap-0 w-32 flex-shrink-0 h-full overflow-hidden rounded-mk-md">
                    {galleryImages.slice(0, 4).map((src, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedImageIndex(i)}
                        className={`w-full h-full min-h-0 overflow-hidden border-2 transition-colors ${selectedImageIndex === i ? "border-primary" : "border-transparent"} ${i === 0 ? "rounded-t-xl" : ""} ${i === 3 ? "rounded-b-xl" : ""}`}
                      >
                        <img
                          src={src}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setGalleryOpen(true)}
                    className="flex-1 min-h-0 h-[365px] max-h-[365px] rounded-mk-md overflow-hidden border-2 border-transparent bg-mk-tint2 text-left cursor-zoom-in"
                  >
                    <img
                      src={mainImageSrc}
                      alt={offerTitle}
                      className="w-full h-full object-cover"
                    />
                  </button>
                </div>

                {/* موبايل وتابلت (أقل من lg) */}
                <div className="flex flex-col gap-3 p-3 lg:hidden">
                  <button
                    type="button"
                    onClick={() => setGalleryOpen(true)}
                    className="w-full aspect-[16/10] overflow-hidden rounded-mk-xl bg-mk-tint2 cursor-zoom-in"
                  >
                    <img
                      src={mainImageSrc}
                      alt={offerTitle}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  {galleryImages.filter((_, i) => !brokenImages[i]).length > 1 && (
                    <div className="no-scrollbar flex gap-2.5 overflow-x-auto pb-1">
                      {galleryImages.map((src, i) =>
                        brokenImages[i] ? null : (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedImageIndex(i)}
                            aria-label={`صورة ${i + 1}`}
                            className={`h-16 w-20 shrink-0 overflow-hidden rounded-mk-md border-2 transition-colors ${
                              selectedImageIndex === i ? "border-primary" : "border-transparent"
                            }`}
                          >
                            <img
                              src={src}
                              alt=""
                              className="h-full w-full object-cover"
                              onError={() =>
                                setBrokenImages((current) => ({ ...current, [i]: true }))
                              }
                            />
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* تابات: وصف العرض | الشروط والأحكام | سياسة الخصوصية */}
              <div className="bg-white rounded-mk-2xl shadow-mk-raised overflow-hidden">
                <div className="flex gap-2 border-b border-mk-border bg-mk-tint3 px-4 py-3">
                  {[
                    {
                      key: "description" as TabKey,
                      label: t("offerDetail.tab_description"),
                    },
                    {
                      key: "terms" as TabKey,
                      label: t("offerDetail.tab_terms"),
                    },
                    {
                      key: "privacy" as TabKey,
                      label: t("offerDetail.tab_privacy"),
                    },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      aria-pressed={activeTab === tab.key}
                      className={`h-10 rounded-full px-4 text-[13.5px] font-extrabold transition-all duration-200 ${FOCUS} ${
                        activeTab === tab.key
                          ? "bg-grad-brand text-white shadow-[0_10px_22px_-12px_rgba(64,1,152,0.9)]"
                          : "bg-white text-mk-text-strong hover:text-mk-primary"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="p-6">
                  {activeTab === "description" && (
                    <>
                      {/* شبكة معلومات العرض — بطاقات صغيرة بأيقونة وعنوان
                          وقيمة بدل مربّعين باهتين بلا تسلسل بصري. */}
                      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
                        {[
                          {
                            icon: <LuCalendarDays size={16} aria-hidden />,
                            label: t("offerDetail.offer_validity"),
                            value: pickLocalized(offer.validity, langBase),
                          },
                          {
                            icon: <LuPercent size={16} aria-hidden />,
                            label: t("offerDetail.discount"),
                            value: Number(offer.discountPercentage) > 0
                              ? `${offer.discountPercentage}%`
                              : null,
                          },
                          {
                            icon: <LuStore size={16} aria-hidden />,
                            label: t("offerDetail.merchant", "التاجر"),
                            value: restaurant?.name
                              ? pickLocalized(restaurant.name, langBase)
                              : null,
                          },
                          {
                            icon: <LuEye size={16} aria-hidden />,
                            label: t("offerCard.viewsLabel", "مشاهدات"),
                            value: Number(offer.views) > 0 ? String(offer.views) : null,
                          },
                        ]
                          .filter((item) => item.value)
                          .map((item) => (
                            <div
                              key={item.label}
                              className="rounded-mk-md border border-mk-border bg-white p-3 shadow-[0_2px_10px_-6px_rgba(46,16,101,0.4)]"
                            >
                              <span className="mb-1.5 flex items-center gap-1.5 text-[11.5px] font-bold text-mk-muted">
                                <span className="text-mk-primary">{item.icon}</span>
                                {item.label}
                              </span>
                              <span className="block text-[14px] font-extrabold text-mk-text">
                                {item.value}
                              </span>
                            </div>
                          ))}
                      </div>

                      <h3 className="mb-2 text-[15px] font-extrabold text-mk-text">
                        {t("offerDetail.tab_description")}
                      </h3>
                      <p className="whitespace-pre-wrap text-[14px] leading-[1.9] text-mk-text-strong">
                        {stripHtml(pickLocalized(offer.description, langBase))}
                      </p>

                      {offer.features.length > 0 && (
                        <div className="mt-5 border-t border-mk-border pt-4">
                          <h3 className="mb-2.5 text-[15px] font-extrabold text-mk-text">
                            {t("offerDetail.features", "ما يشمله العرض")}
                          </h3>
                          <ul className="m-0 grid list-none grid-cols-1 gap-2 p-0 sm:grid-cols-2">
                            {offer.features.map((f, i) => (
                              <li
                                key={i}
                                className="flex items-start gap-2 text-[13.5px] font-medium text-mk-text-strong"
                              >
                                <LuCheck
                                  size={16}
                                  aria-hidden
                                  className="mt-0.5 shrink-0 text-mk-green"
                                />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                  {activeTab === "terms" && (
                    <p className="whitespace-pre-wrap text-[14px] leading-[1.9] text-mk-text-strong">
                      {stripHtml(pickLocalized(offer.terms, langBase))}
                    </p>
                  )}
                  {activeTab === "privacy" && (
                    <p className="whitespace-pre-wrap text-[14px] leading-[1.9] text-mk-text-strong">
                      {apiDetailExtras.privacyPolicy
                        ? stripHtml(apiDetailExtras.privacyPolicy)
                        : null}
                      {apiDetailExtras.privacyPolicy ? null : (
                        <>
                          {t("offerDetail.privacy_fallback")}{" "}
                          <Link
                            to="/privacy-policy"
                            className="text-primary underline"
                          >
                            {t("offerDetail.privacy_link")}
                          </Link>
                        </>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* الشريط الجانبي: التسعير والكمية والأزرار */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6 bg-white rounded-mk-2xl shadow-mk-raised p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!offer) return;
                      const title = stripHtml(
                        pickLocalized(offer.title, langBase) ?? "",
                      );
                      const url = `${window.location.origin}/offers/${category}/${merchantSlug}/${offerSlug}`;
                      openShare({ title, url });
                    }}
                    className="flex-1 py-2.5 rounded-mk-md border border-mk-border bg-white text-mk-text hover:bg-mk-tint3 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShareIcon size={16} />
                    <span className="text-sm font-medium">
                      {t("offerDetail.share")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      if (!offer) return;
                      if (!token) {
                        navigate(
                          `/login?returnUrl=${encodeURIComponent(location.pathname)}`,
                        );
                        return;
                      }
                      toggleFavorite.mutate(
                        { favorable_type: "offer", favorable_id: offer.id },
                        {
                          onSuccess: () => {
                            toast.success(
                              isOfferFavorite
                                ? t("couponModal.removedFromFavorites")
                                : t("couponModal.addedToFavorites"),
                            );
                          },
                          onError: () =>
                            toast.error(t("couponModal.errorGeneric")),
                        },
                      );
                    }}
                    className="flex-1 py-2.5 rounded-mk-md border border-mk-border bg-white text-mk-text hover:bg-mk-tint3 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    disabled={toggleFavorite.isPending}
                  >
                    {isOfferFavorite ? (
                      <HeartIcon size={16} filled className="text-mk-red" />
                    ) : (
                      <HeartIcon size={16} />
                    )}
                    <span className="text-sm font-medium">
                      {t("offerDetail.favorites_action")}
                    </span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {offer.features.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 text-sm text-mk-muted bg-mk-tint2 px-3 py-1.5 rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1 text-sm text-mk-muted bg-mk-tint2 px-3 py-1.5 rounded-full">
                    <FiTag className="text-base" />{" "}
                    {t("offerDetail.sold_count", {
                      count: offer.purchases ?? 0,
                    })}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-mk-text">
                  {t("offerDetail.choose_option")}
                </h3>
                <div className="space-y-3">
                  <div className="border border-mk-border rounded-mk-md p-4">
                    <p className="text-mk-text font-medium mb-2">
                      {offerTitle}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {/* السعر مع شطب سعر ما قبل الخصم (يظهر فقط عند وجود خصم فعلي) */}
                      <PriceTag
                        price={displayPriceAfter}
                        priceBefore={displayPriceBefore}
                        size="md"
                      />
                      {Number(offer.discountPercentage) > 0 && (
                        <Badge tone="success" size="sm">
                          {t("offerDetail.save_pct", { pct: offer.discountPercentage })}
                        </Badge>
                      )}
                    </div>
                    {/* أسعار الاشتراك.
                        المشترك يرى سعره وحده — لا معنى لعرض سعر غير
                        المشتركين له. وغير المشترك يرى سعره ثم دعوة صريحة
                        تقول ماذا يكسب بالاشتراك: مجاناً أم خصم بمقداره. */}
                    {offer.nonSubscriberPrice != null && offer.nonSubscriberPrice > 0 ? (
                      <div className="mt-3 space-y-2.5">
                        {isSubscribed ? (
                          <div className="rounded-mk-md border-2 border-mk-primary bg-mk-tint2 p-3.5">
                            <p className="mb-1 text-[11.5px] font-bold text-mk-muted">
                              {langBase === "ar" ? "سعرك كمشترك" : "Your subscriber price"}
                            </p>
                            {(offer.subscriberPrice ?? 0) <= 0 ? (
                              <p className="m-0 text-[20px] font-extrabold text-mk-green">
                                {langBase === "ar" ? "مشمول بالاشتراك — مجاناً" : "Included — free"}
                              </p>
                            ) : (
                              <p className="m-0 flex items-center gap-1 text-[22px] font-extrabold text-mk-primary">
                                {offer.subscriberPrice}
                                <CurrencyIcon className="inline" size={17} />
                              </p>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="rounded-mk-md border border-mk-border bg-mk-tint3 p-3.5">
                              <p className="mb-1 text-[11.5px] font-bold text-mk-muted">
                                {langBase === "ar" ? "سعرك الحالي" : "Your price"}
                              </p>
                              <p className="m-0 flex items-center gap-1 text-[22px] font-extrabold text-mk-text">
                                {offer.nonSubscriberPrice}
                                <CurrencyIcon className="inline" size={17} />
                              </p>
                            </div>

                            <Link
                              to={`/subscription/plans?from=${encodeURIComponent(location.pathname)}`}
                              className={`flex items-center justify-between gap-3 rounded-mk-md bg-grad-brand p-3.5 text-white no-underline shadow-[0_14px_30px_-16px_rgba(64,1,152,0.9)] transition-transform hover:-translate-y-0.5 ${FOCUS}`}
                            >
                              <span className="min-w-0">
                                <span className="flex items-center gap-1.5 text-[14px] font-extrabold">
                                  <LuCrown size={16} aria-hidden />
                                  {(offer.subscriberPrice ?? 0) <= 0
                                    ? langBase === "ar"
                                      ? "اشترك الآن واحصل عليه مجاناً"
                                      : "Subscribe now and get it free"
                                    : langBase === "ar"
                                      ? `اشترك الآن ووفّر ${(offer.nonSubscriberPrice - (offer.subscriberPrice ?? 0)).toFixed(0)} ر.س`
                                      : `Subscribe now and save ${(offer.nonSubscriberPrice - (offer.subscriberPrice ?? 0)).toFixed(0)} SAR`}
                                </span>
                                <span className="mt-0.5 block text-[11.5px] text-white/85">
                                  {(offer.subscriberPrice ?? 0) <= 0
                                    ? langBase === "ar"
                                      ? "هذا العرض مشمول بالاشتراك بالكامل"
                                      : "This offer is fully included in the subscription"
                                    : langBase === "ar"
                                      ? `سعر المشتركين ${offer.subscriberPrice} ر.س بدل ${offer.nonSubscriberPrice} ر.س`
                                      : `Subscribers pay ${offer.subscriberPrice} instead of ${offer.nonSubscriberPrice} SAR`}
                                </span>
                              </span>
                              <span
                                aria-hidden
                                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-[17px] leading-none rtl:-scale-x-100"
                              >
                                &#8594;
                              </span>
                            </Link>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2 p-3 bg-primary/5 border border-primary/20 rounded-mk-sm">
                        <p className="text-sm text-mk-text-strong mb-1">
                          {!isFree && unitPrice > 0
                            ? t("offerDetail.cta_price")
                            : t("offerDetail.cta_free")}
                        </p>
                        {!isFree && unitPrice > 0 ? (
                          <p className="text-lg font-bold text-primary flex items-center gap-1">
                            {unitPrice}{" "}
                            <CurrencyIcon className="inline" size={18} />
                          </p>
                        ) : (
                          <p className="text-lg font-bold text-green-600">
                            {t("offerDetail.free")}
                          </p>
                        )}
                      </div>
                    )}
                    {usedQuotaBefore && (
                      <p className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-mk-sm text-amber-800 text-sm">
                        {t("offerDetail.already_used")}
                      </p>
                    )}
                    {offerEndedNoStock && (
                      <p className="mt-3 p-3 bg-mk-tint2 border border-mk-border rounded-mk-sm text-mk-text-strong text-sm">
                        {t("offerDetail.offer_ended")}
                      </p>
                    )}
                    {canPurchase && (
                      <>
                        <div className="mt-3">
                          <QuantitySelector
                            maxQty={maxQty}
                            onQuantityChange={handleQuantityChange}
                          />
                          <p className="text-xs text-mk-muted mt-1">
                            {t("offerDetail.max_purchase", { max: maxQty })}
                          </p>
                        </div>
                        <p className="text-sm font-medium text-mk-text-strong mt-2">
                          {t("offerDetail.total")}: {totalPrice}{" "}
                          <CurrencyIcon className="inline" size={14} />
                        </p>
                      </>
                    )}
                  </div>
                </div>
                {canPurchase && (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handlePurchase}
                      disabled={createOrder.isPending}
                      className="w-full py-3 px-6 bg-primary text-white rounded-mk-md font-medium hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {createOrder.isPending
                        ? t("offerDetail.creating_order")
                        : isFree
                          ? t("home.product.viewNow")
                          : t("offerDetail.quick_buy")}
                    </button>
                  </div>
                )}
                {/* <div className="text-sm text-mk-muted bg-mk-tint3 rounded-mk-md p-3">
                  {t("offersPage.t_fe434d", "قسائم الهاتف المحمول")}
                </div> */}
                {/* طرق الدفع — نفس شعارات صفحة الدفع بدل أسماء نصّية */}
                <div>
                  <p className="mb-2 text-[12.5px] font-bold text-mk-muted">
                    {t("offerDetail.payment_methods")}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { src: Mada, alt: "mada" },
                      { src: Visa, alt: "Visa" },
                      { src: Master, alt: "Mastercard" },
                      { src: ApplePay, alt: "Apple Pay" },
                    ].map((brand) => (
                      <span
                        key={brand.alt}
                        className="flex h-9 w-[54px] items-center justify-center rounded-mk-sm border border-mk-border bg-white px-1.5 shadow-[0_2px_8px_-4px_rgba(46,16,101,0.35)]"
                      >
                        <img
                          src={brand.src}
                          alt={brand.alt}
                          loading="lazy"
                          className="max-h-6 w-auto max-w-full object-contain"
                        />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* العروض المتعلقة */}
          {apiDetailExtras.relatedOffers.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-mk-text mb-6">
                {t("offerDetail.related_offers")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {apiDetailExtras.relatedOffers.map((relatedOffer) => (
                  <OfferCard
                    key={relatedOffer.id}
                    offer={relatedOffer}
                    onOfferClick={(o) =>
                      navigate(
                        `/offers/${category}/${o.merchantSlug || o.companyId}/${o.slug || o.id}`,
                      )
                    }
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* نافذة معرض الصور - التقلب بين الصور */}
      {galleryOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setGalleryOpen(false)}
          role="dialog"
          aria-label={t("offerDetail.gallery_aria")}
        >
          <button
            type="button"
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 z-10"
            onClick={() => setGalleryOpen(false)}
            aria-label={t("offerDetail.gallery_close")}
          >
            <FiX className="text-2xl" />
          </button>
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-2 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex((prev) =>
                prev <= 0 ? galleryImages.length - 1 : prev - 1,
              );
            }}
            aria-label={t("pagination.previous")}
          >
            <FiChevronLeft className="text-3xl" />
          </button>
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 rounded-full p-2 z-10"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex((prev) =>
                prev >= galleryImages.length - 1 ? 0 : prev + 1,
              );
            }}
            aria-label={t("pagination.next")}
          >
            <FiChevronRight className="text-3xl" />
          </button>
          <img
            src={galleryImages[selectedImageIndex] ?? galleryImages[0]}
            alt=""
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
            {selectedImageIndex + 1} / {galleryImages.length}
          </span>
        </div>
      )}
    </>
  );
};

export default OfferDetailPage;
