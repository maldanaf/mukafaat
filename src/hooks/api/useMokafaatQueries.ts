/**
 * React Query hooks لـ API مكافآت - للاستخدام في الصفحات والمكونات
 * تضمين اللغة في الـ query keys ليعاد طلب الـ API عند تغيير اللغة (Accept-Language)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  homeApi,
  categoriesApi,
  offersApi,
  searchApi,
  favoritesApi,
  ordersApi,
  couponsApi,
  cardsApi,
  webApi,
  locationsApi,
  settingsApi,
  pagesApi,
  appConfigApi,
  subscriptionApi,
  paymentApi,
  pointsApi,
  walletApi,
  merchantsApi,
  profileApi,
  filtersApi,
  membershipApi,
  discountCodesApi,
  couponValidateApi,
  referralsApi,
  familyApi,
  storeRequestsApi,
  geoApi,
  notificationsApi,
  type SubscribeForOtherBody,
  type DiscountCodeValidateParams,
  type CouponValidateParams,
  type FamilyInviteBody,
  type StoreRequestBody,
} from "@network/services/mokafaatService";

/** لغة حالية للـ query key (يعيد طلب البيانات عند تغيير اللغة) */
function useQueryLang() {
  const { i18n } = useTranslation();
  return i18n.language?.split("-")[0] || "ar";
}

// ========== Query Keys ==========
export const mokafaatKeys = {
  home: ["mokafaat", "home"] as const,
  categories: ["mokafaat", "categories"] as const,
  offersByCategory: (id: string | number) =>
    ["mokafaat", "offers", "category", id] as const,
  offerDetail: (id: string | number) => ["mokafaat", "offers", id] as const,
  webOfferDetail: (id: string | number) =>
    ["mokafaat", "web", "offers", id] as const,
  search: (q: string) => ["mokafaat", "search", q] as const,
  filterOptions: ["mokafaat", "filterOptions"] as const,
  filters: (categoryId: string | number) =>
    ["mokafaat", "filters", categoryId] as const,
  favorites: (type?: string) => ["mokafaat", "favorites", type] as const,
  settings: ["mokafaat", "settings"] as const,
  pages: (platform?: string) => ["mokafaat", "pages", platform] as const,
  pageDetail: (slug: string) => ["mokafaat", "pages", slug] as const,
  orders: (type?: string) => ["mokafaat", "orders", type] as const,
  orderDetail: (id: string | number) => ["mokafaat", "orders", id] as const,
  couponsHome: ["mokafaat", "coupons", "home"] as const,
  cardsHome: ["mokafaat", "cards", "home"] as const,
  cardDetail: (id: string | number) =>
    ["mokafaat", "cards", "detail", id] as const,
  cardsByMerchant: (id: string | number, params?: Record<string, unknown>) =>
    ["mokafaat", "cards", "byMerchant", id, params] as const,
  webCards: (params?: Record<string, unknown>) =>
    ["mokafaat", "web", "cards", params] as const,
  webCardCountries: ["mokafaat", "web", "cardCountries"] as const,
  webCategoryCards: (slug: string, params?: Record<string, unknown>) =>
    ["mokafaat", "web", "categories", slug, "cards", params] as const,
  webOffers: (params?: Record<string, unknown>) =>
    ["mokafaat", "web", "offers", params] as const,
  webCoupons: (params?: Record<string, unknown>) =>
    ["mokafaat", "web", "coupons", params] as const,
  webCouponsHome: ["mokafaat", "web", "coupons", "home"] as const,
  webCouponCategories: (categorySlug: string) =>
    ["mokafaat", "web", "categories", categorySlug, "coupons"] as const,
  webNews: ["mokafaat", "web", "news"] as const,
  webPopupAds: (screen: string) => ["mokafaat", "web", "popupAds", screen] as const,
  webBookings: ["mokafaat", "web", "bookings"] as const,
  webBookingsByType: (type: string, params?: Record<string, unknown>) =>
    ["mokafaat", "web", "bookings", type, params] as const,
  webHome: ["mokafaat", "web", "home"] as const,
  appConfig: ["mokafaat", "appConfig"] as const,
  countries: ["mokafaat", "locations", "countries"] as const,
  regions: (id: string | number) =>
    ["mokafaat", "locations", "regions", id] as const,
  cities: (id: string | number) =>
    ["mokafaat", "locations", "cities", id] as const,
  citiesByCountry: (id: string | number) =>
    ["mokafaat", "locations", "cities-by-country", id] as const,
  subscriptionPlans: ["mokafaat", "subscription", "plans"] as const,
  subscriptionStatus: ["mokafaat", "subscription", "status"] as const,
  subscriptionHistory: ["mokafaat", "subscription", "history"] as const,
  pointsBalance: ["mokafaat", "points", "balance"] as const,
  pointsHistory: ["mokafaat", "points", "history"] as const,
  wallet: ["mokafaat", "wallet"] as const,
  walletBalance: ["mokafaat", "wallet", "balance"] as const,
  walletHistory: ["mokafaat", "wallet", "history"] as const,
  profile: ["mokafaat", "profile"] as const,
  membershipVerify: (membershipNumber: string) =>
    ["mokafaat", "membership", "verify", membershipNumber] as const,
  giftPlans: (params?: Record<string, unknown>) =>
    ["mokafaat", "subscription", "gift", "plans", params] as const,
  gifts: ["mokafaat", "subscription", "gifts"] as const,
  giftInvoice: (id: string | number) =>
    ["mokafaat", "subscription", "gift", id, "invoice"] as const,
  referrals: ["mokafaat", "referrals"] as const,
  referralRewards: ["mokafaat", "referrals", "rewards"] as const,
  family: ["mokafaat", "family"] as const,
  familyInvitations: ["mokafaat", "family", "invitations"] as const,
  geoCountries: ["mokafaat", "geo", "countries"] as const,
  notifications: (page: number) =>
    ["mokafaat", "notifications", page] as const,
  notificationsUnread: ["mokafaat", "notifications", "unread-count"] as const,
  notificationSettings: ["mokafaat", "settings", "notifications"] as const,
};

// ========== Home ==========
export function useHome() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.home, lang],
    queryFn: () => homeApi.get().then((r) => r.data),
  });
}

// ========== Web Home (Index Page - للسلايدر وبيانات الصفحة الرئيسية للويب) ==========
export function useWebHome() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.webHome, lang],
    queryFn: () => webApi.home().then((r) => r.data),
  });
}

// ========== Categories ==========
export function useCategories() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.categories, lang],
    queryFn: () => categoriesApi.list().then((r) => r.data),
  });
}

// ========== Filters (لتصفية العروض حسب التصنيف) ==========
export function useFilters(categoryId: string | number | null | undefined) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: categoryId
      ? [...mokafaatKeys.filters(categoryId), lang]
      : (["mokafaat", "filters", "none", lang] as const),
    queryFn: () => filtersApi.get(categoryId!).then((r) => r.data),
    enabled: !!categoryId,
  });
}

// ========== Offers ==========
export function useOffersByCategory(
  categoryId: string | number,
  params?: Record<string, unknown>
) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.offersByCategory(categoryId), lang],
    queryFn: () => offersApi.byCategory(categoryId, params).then((r) => r.data),
    enabled: !!categoryId,
  });
}

export function useOfferDetail(id: string | number) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.offerDetail(id), lang],
    queryFn: () => offersApi.detail(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useWebOfferDetail(id?: string | number) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: id
      ? [...mokafaatKeys.webOfferDetail(id), lang]
      : (["mokafaat", "web", "offers", "none", lang] as const),
    queryFn: () => webApi.offerDetail(id as string | number).then((r) => r.data),
    enabled: !!id,
  });
}

// ========== Search ==========
export function useSearch(q: string, params?: Record<string, unknown>) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.search(q), lang],
    queryFn: () => searchApi.search(q, params).then((r) => r.data),
    enabled: q.length >= 2,
  });
}

// ========== Favorites (يتطلب تسجيل دخول) ==========
export function useFavorites(type?: "offer" | "card" | "coupon") {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.favorites(type), lang],
    queryFn: () => favoritesApi.list(type).then((r) => r.data),
  });
}

export function useFavoriteToggle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      favorable_type,
      favorable_id,
    }: {
      favorable_type: string;
      favorable_id: string | number;
    }) => favoritesApi.toggle(favorable_type, favorable_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mokafaat", "favorites"] });
    },
  });
}

// ========== Coupons Vote (يتطلب توكن) ==========
export function useCouponVote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      vote,
    }: {
      id: string | number;
      vote: "working" | "not_working";
    }) => couponsApi.vote(id, vote).then((r) => r.data),
    onSuccess: () => {
      // Refresh coupons lists if needed (web/app)
      queryClient.invalidateQueries({ queryKey: ["mokafaat", "web", "coupons"] });
      queryClient.invalidateQueries({ queryKey: ["mokafaat", "coupons"] });
    },
  });
}

// ========== Coupon Copy Counter (عام - بدون توثيق) ==========
/**
 * تسجيل نسخة لكود الكوبون: POST /web/coupons/{id}/copy
 * fire-and-forget — الفشل لا يزعج المستخدم، والزيادة تتم تفاؤلياً في الواجهة.
 * يرجع copies_count المحدّث من الخادم إن توفّر، وإلا null.
 */
export function useCouponCopy() {
  return useMutation<number | null, unknown, string | number>({
    mutationFn: (id: string | number) =>
      webApi.couponCopy(id).then((r) => {
        const wrapper = r.data as
          | { data?: { copies_count?: unknown } | null }
          | undefined;
        const n = Number(wrapper?.data?.copies_count);
        return Number.isFinite(n) ? n : null;
      }),
    // لا نُبطل أي كاش ولا نعرض أي خطأ — العدّاد تفاؤلي بالكامل
    onError: () => {},
  });
}

// ========== Settings ==========
export function useSettings() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.settings, lang],
    queryFn: () => settingsApi.get().then((r) => r.data),
  });
}

// Site settings (public) - for homepage texts, social links, etc.
export function useSiteSettings() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: ["mokafaat", "site-settings", lang],
    queryFn: () => settingsApi.getSiteSettings().then((r) => r.data),
    staleTime: 60 * 1000,
  });
}

// ========== Pages ==========
export function usePages(platform?: string) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.pages(platform), lang],
    queryFn: () => pagesApi.list(platform).then((r) => r.data),
  });
}

export function usePageDetail(slug: string) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.pageDetail(slug), lang],
    queryFn: () => pagesApi.detail(slug).then((r) => r.data),
    enabled: !!slug,
  });
}

// ========== Orders ==========
export function useOrders(orderType?: string, options?: { enabled?: boolean }) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.orders(orderType), lang],
    queryFn: () =>
      ordersApi
        .list(orderType as "offer" | "card" | "coupon")
        .then((r) => r.data),
    enabled: options?.enabled !== false,
  });
}

export function useOrderDetail(id: string | number) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.orderDetail(id), lang],
    queryFn: () => ordersApi.detail(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      order_type: "offer" | "card";
      item_id: string | number;
      quantity: number;
      branch_id?: string | number;
      order_id?: string | number;
      use_wallet?: boolean;
      discount_code?: string;
    }) => ordersApi.create(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mokafaat", "orders"] });
    },
  });
}

/** التحقق من كود الخصم قبل إتمام الحجز (POST /api/discount-codes/validate) */
export function useValidateDiscountCode() {
  return useMutation({
    mutationFn: (params: DiscountCodeValidateParams) =>
      discountCodesApi.validate(params).then((r) => r.data),
  });
}

/** التحقق من كوبون الخصم قبل الدفع (POST /api/coupons/validate) */
export function useValidateCoupon() {
  return useMutation({
    mutationFn: (params: CouponValidateParams) =>
      couponValidateApi.validate(params).then((r) => r.data),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => ordersApi.cancel(id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: ["mokafaat", "orders"] });
      queryClient.invalidateQueries({ queryKey: ["mokafaat", "orders", id] });
    },
  });
}

/** تفعيل عرض مجاني: المستخدم يُدخل رمز التحقق الذي يعطيه التاجر بعد مسح QR */
export function useVerifyMerchantOrderCode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      verification_code,
    }: {
      orderId: string | number;
      verification_code: string;
    }) => ordersApi.verifyMerchantCode(orderId, verification_code),
    onSuccess: (_res, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: ["mokafaat", "orders"] });
      queryClient.invalidateQueries({
        queryKey: ["mokafaat", "orders", orderId],
      });
    },
  });
}

// ========== Coupons ==========
export function useCouponsHome() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.couponsHome, lang],
    queryFn: () => couponsApi.home().then((r) => r.data),
  });
}

// ========== Cards ==========
export function useCardsHome() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.cardsHome, lang],
    queryFn: () => cardsApi.home().then((r) => r.data),
  });
}

/** GET /api/cards/:id — تفاصيل البطاقة (لصفحة البطاقة) */
export function useCardDetail(cardIdOrSlug: string | undefined) {
  return useQuery({
    queryKey: cardIdOrSlug ? mokafaatKeys.cardDetail(cardIdOrSlug) : ["mokafaat", "cards", "detail", "skip"],
    queryFn: () => webApi.cardDetail(cardIdOrSlug!).then((r) => r.data),
    enabled: !!cardIdOrSlug,
  });
}

/** GET /api/cards/by-merchant/:id — تفاصيل التاجر وبطاقاته */
export function useCardsByMerchant(
  merchantId: string | undefined,
  params?: Record<string, unknown>
) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: merchantId
      ? [...mokafaatKeys.cardsByMerchant(merchantId, params), lang]
      : ["mokafaat", "cards", "byMerchant", "skip"],
    queryFn: () => cardsApi.byMerchant(merchantId!, params).then((r) => r.data),
    enabled: !!merchantId,
  });
}

// ========== Web (للوحة الويب) ==========
export function useWebCards(params?: Record<string, unknown>) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.webCards(params), lang],
    queryFn: () => webApi.cards(params).then((r) => r.data),
  });
}

export function useWebCardCountries() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.webCardCountries, lang],
    queryFn: () => webApi.cardCountries().then((r) => r.data),
  });
}

export function useWebCategoryCards(
  slug: string,
  params?: Record<string, unknown>,
) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.webCategoryCards(slug, params), lang],
    queryFn: () =>
      webApi.categoriesCards(slug, params).then((r) => r.data),
    enabled: !!slug,
  });
}

export function useWebOffers(
  params?: Record<string, unknown>,
  options?: { enabled?: boolean }
) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.webOffers(params), lang],
    queryFn: () => webApi.offers(params).then((r) => r.data),
    enabled: options?.enabled !== false,
  });
}

export function useWebCoupons(params?: Record<string, unknown>) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.webCoupons(params), lang],
    queryFn: () => webApi.coupons(params).then((r) => r.data),
  });
}

export function useWebCouponsHome() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.webCouponsHome, lang],
    queryFn: () => webApi.couponsHome().then((r) => r.data),
  });
}

export function useWebCouponCategories(categorySlug: string) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.webCouponCategories(categorySlug), lang],
    queryFn: () => webApi.categoryCoupons(categorySlug).then((r) => r.data),
    enabled: !!categorySlug,
  });
}

export function useWebNews() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.webNews, lang],
    queryFn: () => webApi.news().then((r) => r.data),
  });
}

export function useWebNewsDetail(slug: string | undefined) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: slug
      ? ["mokafaat", "web", "news", slug, lang]
      : ["mokafaat", "web", "news", "skip"],
    queryFn: () => webApi.newsDetail(slug!).then((r) => r.data),
    enabled: !!slug,
  });
}

// ========== Bookings (web) ==========
export function useBookings() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.webBookings, lang],
    queryFn: () => webApi.bookings().then((r) => r.data),
  });
}

export function useBookingsByType(
  type: string,
  params?: Record<string, unknown>,
  options?: { enabled?: boolean }
) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.webBookingsByType(type, params), lang],
    queryFn: () => webApi.bookingsByType(type, params).then((r) => r.data),
    enabled: options?.enabled !== false && !!type,
  });
}

export function useNewsletterSubscribe() {
  return useMutation({
    mutationFn: (payload: { email: string; source?: string }) =>
      webApi.newsletterSubscribe(payload).then((r) => r.data),
  });
}

export function useWebPopupAds(screen: string) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.webPopupAds(screen), lang],
    queryFn: () => webApi.popupAds({ screen }).then((r) => r.data),
    enabled: !!screen,
  });
}

// ========== App Config (GET /api/app-config) ==========
export function useAppConfig() {
  return useQuery({
    queryKey: mokafaatKeys.appConfig,
    queryFn: () => appConfigApi.get().then((r) => r.data),
  });
}

// ========== Locations ==========
/** الـ API يرجع { data: { countries|regions|cities: [...] } } وليس مصفوفة مباشرة */
export function normalizeLocationListResponse(
  payload: unknown,
  listKey: "countries" | "regions" | "cities",
): { id: number | string; name?: string; code?: string }[] {
  if (payload == null) return [];
  if (Array.isArray(payload)) {
    return payload as { id: number | string; name?: string; code?: string }[];
  }
  if (typeof payload !== "object") return [];
  const o = payload as Record<string, unknown>;
  if (Array.isArray(o[listKey])) {
    return o[listKey] as { id: number | string; name?: string; code?: string }[];
  }
  const inner = o.data;
  if (inner && typeof inner === "object") {
    const d = inner as Record<string, unknown>;
    if (Array.isArray(d[listKey])) {
      return d[listKey] as {
        id: number | string;
        name?: string;
        code?: string;
      }[];
    }
  }
  if (Array.isArray(inner)) {
    return inner as { id: number | string; name?: string; code?: string }[];
  }
  return [];
}

export function useCountries() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.countries, lang],
    queryFn: () =>
      locationsApi
        .countries()
        .then((r) => normalizeLocationListResponse(r.data, "countries")),
  });
}

/** تفعيل الطلب حتى لو id === 0 (!!0 كان يعطي false ويكسر المناطق/المدن) */
function locationQueryEnabled(id: string | number | null | undefined) {
  if (id == null) return false;
  if (typeof id === "string") return id.length > 0;
  return true;
}

export function useRegions(id: string | number | null) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.regions(id ?? 0), lang],
    queryFn: () =>
      locationsApi
        .regions(id as string | number)
        .then((r) => normalizeLocationListResponse(r.data, "regions")),
    enabled: locationQueryEnabled(id),
  });
}

export function useCities(id: string | number | null) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.cities(id ?? 0), lang],
    queryFn: () =>
      locationsApi
        .cities(id as string | number)
        .then((r) => normalizeLocationListResponse(r.data, "cities")),
    enabled: locationQueryEnabled(id),
  });
}

/** كل مدن الدولة (بدون تقسيم على مناطق) */
export function useCitiesByCountry(id: string | number | null) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.citiesByCountry(id ?? 0), lang],
    queryFn: () =>
      locationsApi
        .citiesByCountry(id as string | number)
        .then((r) => normalizeLocationListResponse(r.data, "cities")),
    enabled: locationQueryEnabled(id),
  });
}

// ========== Subscription ==========
export function useSubscriptionPlans(type?: string) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.subscriptionPlans, lang, type ?? "all"],
    queryFn: () => subscriptionApi.plans(type).then((r) => r.data),
  });
}

export function useSubscriptionStatus(enabled = true) {
  return useQuery({
    queryKey: mokafaatKeys.subscriptionStatus,
    queryFn: () => subscriptionApi.status().then((r) => r.data),
    enabled,
  });
}

export function useSubscriptionHistory() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.subscriptionHistory, lang],
    queryFn: () => subscriptionApi.history().then((r) => r.data),
  });
}

/** GET /api/membership/verify/{membership_number} — للتحقق من العضوية (صفحة مسح QR، بدون توكن) */
export function useMembershipVerify(membershipNumber: string | undefined) {
  return useQuery({
    queryKey: membershipNumber
      ? mokafaatKeys.membershipVerify(membershipNumber)
      : ["mokafaat", "membership", "verify", "skip"],
    queryFn: () =>
      membershipApi.verify(membershipNumber!).then((r) => r.data),
    enabled: !!membershipNumber && membershipNumber.length > 0,
  });
}

export function useSubscribe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      planId,
      paymentMethod,
      useWallet,
      discountCode,
      couponCode,
      confirmChange,
    }: {
      planId: string | number;
      paymentMethod?: "online" | "cash" | "bank" | "card";
      useWallet?: boolean;
      discountCode?: string;
      couponCode?: string;
      confirmChange?: boolean;
    }) =>
      subscriptionApi.subscribe(
        planId,
        paymentMethod,
        useWallet,
        discountCode,
        couponCode,
        confirmChange,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.subscriptionStatus });
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.subscriptionHistory });
    },
  });
}

export function useSubscribeForOther() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: SubscribeForOtherBody) =>
      subscriptionApi.subscribeForOther(body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.subscriptionStatus });
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.subscriptionHistory });
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.profile });
    },
  });
}

// ========== Payment callback (after gateway redirect) ==========
export function usePaymentCallback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { id: string; status: string }) =>
      paymentApi.callback(params).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.subscriptionStatus });
      queryClient.invalidateQueries({ queryKey: ["mokafaat", "orders"] });
    },
  });
}

// ========== Points ==========
export function usePointsBalance() {
  return useQuery({
    queryKey: mokafaatKeys.pointsBalance,
    queryFn: () => pointsApi.balance().then((r) => r.data),
  });
}

export function usePointsHistory() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.pointsHistory, lang],
    queryFn: () => pointsApi.history().then((r) => r.data),
  });
}

export function usePointsRedeem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params?: { points?: number }) => pointsApi.redeem(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.pointsBalance });
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.pointsHistory });
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.wallet });
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.walletBalance });
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.walletHistory });
    },
  });
}

// ========== Wallet ==========
export function useWallet() {
  return useQuery({
    queryKey: mokafaatKeys.wallet,
    queryFn: () => walletApi.get().then((r) => r.data),
  });
}

export function useWalletBalance() {
  return useQuery({
    queryKey: mokafaatKeys.walletBalance,
    queryFn: () => walletApi.balance().then((r) => r.data),
  });
}

export function useWalletHistory() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.walletHistory, lang],
    queryFn: () => walletApi.history().then((r) => r.data),
  });
}

/** GET /api/wallet/topup-options — مبالغ الشحن السريعة وحدود المبلغ */
export function useWalletTopupOptions() {
  return useQuery({
    queryKey: ["mokafaat", "wallet", "topup-options"],
    queryFn: () => walletApi.topupOptions().then((r) => r.data),
  });
}

/** POST /api/wallet/topup — يبدأ عملية الشحن ويرجّع payment_info */
export function useWalletTopup() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (amount: number) => walletApi.topup(amount).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.wallet });
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.walletBalance });
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.walletHistory });
    },
  });
}

export function useMyTransactions(params?: Record<string, unknown>) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: ["mokafaat", "my-transactions", lang, params ?? null],
    queryFn: () => walletApi.myTransactions(params).then((r) => r.data),
  });
}

// ========== Merchants ==========
export function useMerchantDetail(idOrSlug: string | number | undefined) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: ["mokafaat", "merchant", idOrSlug, lang],
    queryFn: () => merchantsApi.detail(idOrSlug!).then((r) => r.data),
    enabled: !!idOrSlug,
  });
}

// ========== Profile ==========
export function useProfile(enabled = true) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.profile, lang],
    queryFn: () => profileApi.get().then((r) => r.data),
    enabled,
  });
}

export function useProfileUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: Parameters<typeof profileApi.update>[0]) =>
      profileApi.update(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.profile });
    },
  });
}


// ========== Subscription — الإهداء (باقات/فواتير) ==========
/**
 * GET /api/subscription/gift/plans — أسعار الإهداء الحقيقية:
 * price_original / tier_discount_* / coupon_discount / price_after_discount.
 */
export function useGiftPlans(params?: {
  coupon_code?: string;
  discount_code?: string;
}) {
  const lang = useQueryLang();
  const key = {
    coupon_code: params?.coupon_code || "",
    discount_code: params?.discount_code || "",
  };
  return useQuery({
    queryKey: [...mokafaatKeys.giftPlans(key), lang],
    queryFn: () =>
      subscriptionApi
        .giftPlans({
          ...(key.coupon_code && { coupon_code: key.coupon_code }),
          ...(key.discount_code && { discount_code: key.discount_code }),
        })
        .then((r) => r.data),
  });
}

/** GET /api/subscription/gifts — الاشتراكات التي أهديتها */
export function useMyGifts(enabled = true) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.gifts, lang],
    queryFn: () => subscriptionApi.gifts().then((r) => r.data),
    enabled,
  });
}

/** GET /api/subscription/gift/{id}/invoice — فاتورة اشتراك مُهدى */
export function useGiftInvoice(id: string | number | undefined) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: id
      ? [...mokafaatKeys.giftInvoice(id), lang]
      : (["mokafaat", "subscription", "gift", "none", "invoice", lang] as const),
    queryFn: () =>
      subscriptionApi.giftInvoice(id as string | number).then((r) => r.data),
    enabled: id != null && String(id) !== "",
    retry: false,
  });
}

// ========== Referrals — شارك واربح ==========
export function useReferrals(enabled = true) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.referrals, lang],
    queryFn: () => referralsApi.get().then((r) => r.data),
    enabled,
  });
}

export function useReferralRewards(enabled = true) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.referralRewards, lang],
    queryFn: () => referralsApi.rewards().then((r) => r.data),
    enabled,
  });
}

export function useAttachReferral() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => referralsApi.attach(code).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.referrals });
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.referralRewards });
    },
  });
}

// ========== Family — أفراد العائلة ==========
export function useFamily(enabled = true) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.family, lang],
    queryFn: () => familyApi.get().then((r) => r.data),
    enabled,
  });
}

export function useFamilyInvitations(enabled = true) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.familyInvitations, lang],
    queryFn: () => familyApi.invitations().then((r) => r.data),
    enabled,
  });
}

export function useFamilyInvite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: FamilyInviteBody) =>
      familyApi.invite(body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.family });
    },
  });
}

export function useFamilyRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) =>
      familyApi.removeMember(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.family });
    },
  });
}

export function useAcceptFamilyInvitation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) =>
      familyApi.acceptInvitation(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.family });
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.familyInvitations });
      queryClient.invalidateQueries({ queryKey: mokafaatKeys.subscriptionStatus });
    },
  });
}

// ========== Store Requests — انضمام متجر / اقتراح متجر (عام) ==========
export function useCreateStoreRequest() {
  return useMutation({
    mutationFn: (body: StoreRequestBody) =>
      storeRequestsApi.create(body).then((r) => r.data),
  });
}

// ========== Geo — الدول المفعّلة مع علامة «دولة واحدة» ==========
export function useGeoCountries() {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.geoCountries, lang],
    queryFn: () => geoApi.countries().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
}

// ========== Notifications — الإشعارات ==========
/** GET /api/notifications?page=n */
export function useNotifications(page = 1, enabled = true) {
  const lang = useQueryLang();
  return useQuery({
    queryKey: [...mokafaatKeys.notifications(page), lang],
    queryFn: () => notificationsApi.list(page).then((r) => r.data),
    enabled,
    placeholderData: (prev) => prev,
  });
}

/** GET /api/notifications/unread-count — عدّاد الشارة */
export function useNotificationsUnreadCount(enabled = true) {
  return useQuery({
    queryKey: mokafaatKeys.notificationsUnread,
    queryFn: () => notificationsApi.unreadCount().then((r) => r.data),
    enabled,
    staleTime: 60 * 1000,
  });
}

function useInvalidateNotifications() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["mokafaat", "notifications"] });
  };
}

export function useMarkNotificationRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id: string | number) =>
      notificationsApi.markRead(id).then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useMarkAllNotificationsRead() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead().then((r) => r.data),
    onSuccess: invalidate,
  });
}

export function useDeleteNotification() {
  const invalidate = useInvalidateNotifications();
  return useMutation({
    mutationFn: (id: string | number) =>
      notificationsApi.remove(id).then((r) => r.data),
    onSuccess: invalidate,
  });
}

// ========== Notification settings — إعدادات الإشعارات ==========
/** GET /api/settings/notifications */
export function useNotificationSettings(enabled = true) {
  return useQuery({
    queryKey: mokafaatKeys.notificationSettings,
    queryFn: () => settingsApi.getNotifications().then((r) => r.data),
    enabled,
  });
}

/** POST /api/settings/notifications — تحديث المفاتيح */
export function useUpdateNotificationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, boolean>) =>
      settingsApi.updateNotifications(body).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: mokafaatKeys.notificationSettings,
      });
    },
  });
}

// ========== Account deletion — حذف الحساب ==========
export function useDeleteAccount() {
  return useMutation({
    mutationFn: (reason?: string) => profileApi.remove(reason).then((r) => r.data),
  });
}
