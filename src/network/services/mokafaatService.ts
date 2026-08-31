/**
 * خدمات API مكافآت - استدعاءات الـ Backend حسب الكوليكشن
 */
import { api } from "@network/apiClient";
import { API_ENDPOINTS } from "@network/apiEndpoints";

// ========== Home ==========
export const homeApi = {
  get: () => api.get(API_ENDPOINTS.home),
};

// ========== Categories ==========
export const categoriesApi = {
  list: () => api.get(API_ENDPOINTS.categories),
};

// ========== Locations ==========
export const locationsApi = {
  countries: () => api.get(API_ENDPOINTS.locations.countries),
  regions: (id: string | number) =>
    api.get(API_ENDPOINTS.locations.regions(id)),
  cities: (id: string | number) => api.get(API_ENDPOINTS.locations.cities(id)),
  citiesByCountry: (id: string | number) =>
    api.get(API_ENDPOINTS.locations.citiesByCountry(id)),
};

// ========== Offers ==========
export const offersApi = {
  byCategory: (categoryId: string | number, params?: Record<string, unknown>) =>
    api.get(API_ENDPOINTS.offersByCategory(categoryId), { params }),
  detail: (id: string | number) => api.get(API_ENDPOINTS.offerDetail(id)),
};

// ========== Search & Filters ==========
export const searchApi = {
  search: (q: string, params?: Record<string, unknown>) =>
    api.get(API_ENDPOINTS.search, { params: { q, ...params } }),
  filterOptions: () => api.get(API_ENDPOINTS.filterOptions),
};

export const filtersApi = {
  get: (categoryId: string | number) =>
    api.get(API_ENDPOINTS.filters(categoryId)),
};

// ========== Favorites (يتطلب توكن) ==========
export const favoritesApi = {
  list: (type?: "offer" | "card" | "coupon") =>
    api.get(API_ENDPOINTS.favorites, { params: type ? { type } : {} }),
  toggle: (favorable_type: string, favorable_id: string | number) =>
    api.post(API_ENDPOINTS.favoritesToggle, null, {
      params: { favorable_type, favorable_id },
    }),
};

// ========== Settings (يتطلب توكن) ==========
export const settingsApi = {
  get: () => api.get(API_ENDPOINTS.settings),
  getSiteSettings: () => api.get(API_ENDPOINTS.webSettings),
  updateLanguage: (language: string) =>
    api.post(API_ENDPOINTS.settingsUpdateLanguage, null, {
      params: { language },
    }),
  update: (params: {
    country_id?: number;
    dark_mode?: boolean;
    app_notifications?: boolean;
    sms_notifications?: boolean;
    whatsapp_notifications?: boolean;
  }) =>
    api.post(API_ENDPOINTS.settingsUpdate, null, {
      params,
    }),
  /** GET /api/settings/notifications — إعدادات الإشعارات التفصيلية */
  getNotifications: () => api.get(API_ENDPOINTS.settingsNotifications),
  /** POST /api/settings/notifications — تحديث مفتاح واحد أو أكثر */
  updateNotifications: (body: Record<string, boolean>) =>
    api.post(API_ENDPOINTS.settingsNotifications, body),
};

// ========== Notifications (يتطلب توكن) ==========
export const notificationsApi = {
  list: (page = 1) =>
    api.get(API_ENDPOINTS.notifications.index, { params: { page } }),
  unreadCount: () => api.get(API_ENDPOINTS.notifications.unreadCount),
  markRead: (id: string | number) =>
    api.post(API_ENDPOINTS.notifications.markRead(id)),
  markAllRead: () => api.post(API_ENDPOINTS.notifications.markAllRead),
  remove: (id: string | number) =>
    api.delete(API_ENDPOINTS.notifications.remove(id)),
  removeAll: () => api.delete(API_ENDPOINTS.notifications.removeAll),
};

// ========== App Config (GET - عام) ==========
export const appConfigApi = {
  get: () => api.get(API_ENDPOINTS.appConfig),
};

// ========== Pages (يتطلب توكن اختياري) ==========
export const pagesApi = {
  list: (platform?: string) =>
    api.get(API_ENDPOINTS.pages, { params: platform ? { platform } : {} }),
  detail: (slug: string) => api.get(API_ENDPOINTS.pageDetail(slug)),
};

// ========== Merchants ==========
export const merchantsApi = {
  detail: (id: string | number) => api.get(API_ENDPOINTS.merchantDetail(id)),
  follow: (id: string | number) => api.post(API_ENDPOINTS.merchantFollow(id)),
  review: (merchantId: string | number) =>
    api.get(API_ENDPOINTS.merchantReview, {
      params: { merchant_id: merchantId },
    }),
};

// ========== Points (يتطلب توكن) ==========
export const pointsApi = {
  balance: () => api.get(API_ENDPOINTS.points.balance),
  history: () => api.get(API_ENDPOINTS.points.history),
  redeem: (params?: { points?: number }) =>
    api.post(API_ENDPOINTS.points.redeem, params),
};

// ========== Wallet (يتطلب توكن) ==========
export const walletApi = {
  get: () => api.get(API_ENDPOINTS.wallet),
  balance: () => api.get(API_ENDPOINTS.walletBalance),
  history: (params?: Record<string, unknown>) =>
    api.get(API_ENDPOINTS.walletHistory, { params }),
  /** GET /api/wallet/topup-options — مبالغ الشحن السريعة والحدود */
  topupOptions: () => api.get(API_ENDPOINTS.walletTopupOptions),
  /** POST /api/wallet/topup — يرجّع payment_info لبوابة الدفع */
  topup: (amount: number) =>
    api.post(API_ENDPOINTS.walletTopup, { amount }),
  myTransactions: (params?: Record<string, unknown>) =>
    api.get(API_ENDPOINTS.myTransactions, { params }),
};

// ========== Profile (يتطلب توكن) ==========
export const profileApi = {
  get: () => api.get(API_ENDPOINTS.profile),
  /** POST /api/profile/update - إرسال body كـ JSON (أو FormData عند رفع صورة) */
  update: (params: {
    first_name?: string;
    last_name?: string;
    name?: string;
    email?: string;
    phone?: string;
    country_code?: string;
    id_number?: string;
    gender?: string;
    city_id?: string | number;
    region_id?: string | number;
    country_id?: string | number;
    bank_name?: string;
    bank_account?: string;
    avatar?: File | null;
  }) => {
    const keys = [
      "first_name", "last_name", "name", "email", "phone", "country_code", "id_number", "gender",
      "city_id", "region_id", "country_id", "bank_name", "bank_account",
    ] as const;
    const body: Record<string, string | number> = {};
    keys.forEach((key) => {
      const v = params[key];
      if (v !== undefined && v !== null && v !== "") body[key] = v as string | number;
    });
    if (params.avatar && params.avatar instanceof File) {
      const formData = new FormData();
      formData.append("avatar", params.avatar);
      Object.entries(body).forEach(([k, v]) => formData.append(k, String(v)));
      return api.post(API_ENDPOINTS.profileUpdate, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    }
    return api.post(API_ENDPOINTS.profileUpdate, body);
  },
  /** POST /api/profile/delete — حذف الحساب نهائياً (سبب اختياري) */
  remove: (reason?: string) =>
    api.post(API_ENDPOINTS.profileDelete, reason ? { reason } : {}),
};

// ========== Subscription (يتطلب توكن) - مطابق لـ Postman: Subscriptions ==========
export type SubscribeForOtherBody = {
  name: string;
  phone: string;
  country_code: string;
  plan_id: number;
  use_wallet?: boolean;
  country_id?: number;
  city_id?: number;
  gender?: "male" | "female";
  /** كوبون خصم على الاشتراك المُهدى (يستفيد منه الدافع) */
  coupon_code?: string;
  /** كود خصم على الاشتراك المُهدى (يستفيد منه الدافع) */
  discount_code?: string;
};

export const subscriptionApi = {
  plans: (type?: string) => api.get(API_ENDPOINTS.subscription.plans, { params: type ? { type } : undefined }),
  subscribeForOther: (body: SubscribeForOtherBody) =>
    api.post(API_ENDPOINTS.subscription.subscribeForOther, body),
  subscribe: (
    planId: string | number,
    paymentMethod?: "online" | "cash" | "bank" | "card",
    useWallet?: boolean,
    discountCode?: string,
    /** كوبون خصم (يُطبَّق قبل كود الخصم على الخادم) */
    couponCode?: string,
    /** تأكيد تغيير الباقة (ترقية/تقليل) بعد عرض المعاينة للعميل */
    confirmChange?: boolean
  ) =>
    api.post(API_ENDPOINTS.subscription.subscribe, null, {
      params: {
        plan_id: planId,
        // Spec: payment_method مطلوب مثلاً card للدفع عبر ميسر
        ...(paymentMethod && { payment_method: paymentMethod === "online" ? "card" : paymentMethod }),
        ...(useWallet && { use_wallet: true }),
        ...(couponCode && { coupon_code: couponCode }),
        ...(discountCode && { discount_code: discountCode }),
        ...(confirmChange && { confirm_change: true }),
      },
    }),

  /**
   * معاينة تغيير الباقة قبل تنفيذه: ترقية أم تقليل، كم يدفع أو كم يُودَع
   * في محفظته، وكم فرداً من عائلته سيفقد اشتراكه.
   */
  changePreview: (planId: string | number) =>
    api.get(API_ENDPOINTS.subscription.changePreview, {
      params: { plan_id: planId },
    }),
  status: () => api.get(API_ENDPOINTS.subscription.status),
  history: () => api.get(API_ENDPOINTS.subscription.history),
  /** باقات الإهداء بأسعارها الحقيقية بعد خصم المستوى والكوبون */
  giftPlans: (params?: { coupon_code?: string; discount_code?: string }) =>
    api.get(API_ENDPOINTS.subscription.giftPlans, { params }),
  /** الاشتراكات التي أهديتها لآخرين */
  gifts: () => api.get(API_ENDPOINTS.subscription.gifts),
  /** فاتورة اشتراك أهديته */
  giftInvoice: (id: string | number) =>
    api.get(API_ENDPOINTS.subscription.giftInvoice(id)),
};

// ========== Referrals — شارك واربح (يتطلب توكن) ==========
export const referralsApi = {
  get: () => api.get(API_ENDPOINTS.referrals.index),
  rewards: () => api.get(API_ENDPOINTS.referrals.rewards),
  attach: (code: string) => api.post(API_ENDPOINTS.referrals.attach, { code }),
};

// ========== Family — أفراد العائلة (يتطلب توكن) ==========
export type FamilyInviteBody = {
  phone: string;
  country_code?: string;
  name?: string;
  relation?: string;
  notify_sms?: boolean;
  notify_whatsapp?: boolean;
};

export const familyApi = {
  get: () => api.get(API_ENDPOINTS.family.index),
  invite: (body: FamilyInviteBody) =>
    api.post(API_ENDPOINTS.family.invite, body),
  removeMember: (id: string | number) =>
    api.delete(API_ENDPOINTS.family.removeMember(id)),
  invitations: () => api.get(API_ENDPOINTS.family.invitations),
  acceptInvitation: (id: string | number) =>
    api.post(API_ENDPOINTS.family.acceptInvitation(id)),
};

// ========== Store Requests — طلب انضمام متجر / اقتراح متجر (عام) ==========
export type StoreRequestBody = {
  type: "join" | "suggest";
  store_name: string;
  contact_name?: string;
  contact_phone?: string;
  email?: string;
  country_id?: number;
  city_id?: number;
  country_name?: string;
  city_name?: string;
  notes?: string;
  source?: string;
};

export const storeRequestsApi = {
  create: (body: StoreRequestBody) =>
    api.post(API_ENDPOINTS.storeRequests, { source: "web", ...body }),
};

// ========== Geo — الدولة الافتراضية والدول المفعّلة (عام) ==========
export const geoApi = {
  country: () => api.get(API_ENDPOINTS.geo.country),
  countries: () => api.get(API_ENDPOINTS.geo.countries),
};

// ========== Membership verify (عام — بدون توكن، للتحقق من العضوية عند مسح QR) ==========
export const membershipApi = {
  verify: (membershipNumber: string) =>
    api.get(API_ENDPOINTS.membership.verify(membershipNumber)),
};

// ========== Payment callback (بعد العودة من بوابة الدفع) ==========
// الباكند قد يرد بصفحة HTML — نطلب النص فقط حتى لا يفشل التحويل لـ JSON
export const paymentApi = {
  callback: (params: { id: string; status: string }) =>
    api.get(API_ENDPOINTS.paymentCallback, { params, responseType: "text" }),
};

// ========== Orders (يتطلب توكن) ==========
export const ordersApi = {
  list: (orderType?: "offer" | "card" | "coupon") =>
    api.get(API_ENDPOINTS.orders, {
      params: orderType ? { order_type: orderType } : {},
    }),
  detail: (id: string | number) => api.get(API_ENDPOINTS.orderDetail(id)),
  create: (params: {
    order_type: string;
    item_id: string | number;
    quantity?: number;
    branch_id?: string | number;
    use_wallet?: boolean;
    /** كود خصم على إجمالي الحجز (DiscountCode) */
    discount_code?: string;
    /** عند الدفع لطلب مُنشأ مسبقاً (من صفحة الشراء السريع) */
    order_id?: string | number;
  }) => api.post(API_ENDPOINTS.orders, null, { params }),
  cancel: (id: string | number) => api.post(API_ENDPOINTS.orderCancel(id)),
  verifyMerchantCode: (id: string | number, verification_code: string) =>
    api.post(API_ENDPOINTS.orderVerifyMerchantCode(id), { verification_code }),
};

// ========== Discount Codes (يتطلب توكن) ==========
export type DiscountCodeScope = "offer" | "card" | "subscription";

export interface DiscountCodeValidateParams {
  code: string;
  amount: number;
  scope: DiscountCodeScope;
  item_id?: number | string;
  merchant_id?: number | string;
}

export interface DiscountCodeResult {
  code: string;
  title: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  discount_amount: number;
  original_amount: number;
  final_amount: number;
}

/** كوبون الخصم — نفس نطاقات كود الخصم */
export interface CouponValidateParams {
  code: string;
  scope: DiscountCodeScope;
  item_id?: number | string;
}

export interface CouponValidateResult {
  coupon_id: number | string;
  coupon_code: string;
  original_amount: number;
  discount: number;
  final_amount: number;
}

export const couponValidateApi = {
  validate: (body: CouponValidateParams) =>
    api.post(API_ENDPOINTS.coupons.validate, body),
};

export const discountCodesApi = {
  validate: (body: DiscountCodeValidateParams) =>
    api.post(API_ENDPOINTS.discountCodes.validate, body),
};

// ========== Coupons (app - يتطلب توكن للبعض) ==========
export const couponsApi = {
  home: () => api.get(API_ENDPOINTS.coupons.home),
  search: (q: string) =>
    api.get(API_ENDPOINTS.coupons.search, { params: { q } }),
  byCategory: (id: string | number) =>
    api.get(API_ENDPOINTS.coupons.byCategory(id)),
  byMerchant: (id: string | number) =>
    api.get(API_ENDPOINTS.coupons.byMerchant(id)),
  detail: (id: string | number) => api.get(API_ENDPOINTS.coupons.detail(id)),
  use: (id: string | number) => api.post(API_ENDPOINTS.coupons.use(id)),
  vote: (id: string | number, vote: "working" | "not_working") =>
    api.post(API_ENDPOINTS.coupons.vote(id), { vote }),
};

// ========== Cards (app) ==========
export const cardsApi = {
  home: () => api.get(API_ENDPOINTS.cards.home),
  search: (q: string, params?: Record<string, unknown>) =>
    api.get(API_ENDPOINTS.cards.search, { params: { q, ...params } }),
  byCategory: (id: string | number, params?: Record<string, unknown>) =>
    api.get(API_ENDPOINTS.cards.byCategory(id), { params }),
  byMerchant: (id: string | number, params?: Record<string, unknown>) =>
    api.get(API_ENDPOINTS.cards.byMerchant(id), { params }),
  detail: (id: string | number, params?: Record<string, unknown>) =>
    api.get(API_ENDPOINTS.cards.detail(id), { params }),
};

// ========== Web (عام - للوحة الويب بدون توكن أو معه) ==========
export const webApi = {
  home: (params?: Record<string, unknown>) =>
    api.get(API_ENDPOINTS.web.home, { params }),
  cards: (params?: Record<string, unknown>) =>
    api.get(API_ENDPOINTS.web.cards, { params }),
  cardDetail: (id: string | number) =>
    api.get(API_ENDPOINTS.web.cardDetail(id)),
  cardCountries: () => api.get(API_ENDPOINTS.web.cardCountries),
  categoriesCards: (platformSlug: string, params?: Record<string, unknown>) =>
    api.get(API_ENDPOINTS.web.categoriesCards(platformSlug), { params }),
  news: (params?: Record<string, unknown>) =>
    api.get(API_ENDPOINTS.web.news, { params }),
  newsDetail: (slug: string) => api.get(API_ENDPOINTS.web.newsDetail(slug)),
  newsByCategory: (categorySlug: string) =>
    api.get(API_ENDPOINTS.web.newsByCategory(categorySlug)),
  couponsHome: () => api.get(API_ENDPOINTS.web.couponsHome),
  coupons: (params?: Record<string, unknown>) =>
    api.get(API_ENDPOINTS.web.coupons, { params }),
  couponDetail: (id: string | number) =>
    api.get(API_ENDPOINTS.web.couponDetail(id)),
  /** تسجيل نسخة كود الكوبون (fire-and-forget) */
  couponCopy: (id: string | number) =>
    api.post(API_ENDPOINTS.web.couponCopy(id)),
  categoryCoupons: (categorySlug: string) =>
    api.get(API_ENDPOINTS.web.categoryCoupons(categorySlug)),
  offers: (params?: Record<string, unknown>) =>
    api.get(API_ENDPOINTS.web.offers, { params }),
  offerDetail: (id: string | number) =>
    api.get(API_ENDPOINTS.web.offerDetail(id)),
  popupAds: (params: { screen: string }) =>
    api.get(API_ENDPOINTS.web.popupAds, { params }),
  newsletterSubscribe: (payload: { email: string; source?: string }) =>
    api.post(API_ENDPOINTS.web.newsletterSubscribe, payload),
  bookings: () => api.get(API_ENDPOINTS.web.bookings),
  bookingsByType: (type: string, params?: Record<string, unknown>) =>
    api.get(`${API_ENDPOINTS.web.bookings}/${type}`, { params }),
  bookingClick: (id: number) =>
    api.post(`${API_ENDPOINTS.web.bookings}/${id}/click`),
  bookingDetail: (idOrSlug: string | number) =>
    api.get(`${API_ENDPOINTS.web.bookings}/detail/${idOrSlug}`),
  contact: (params: {
    name: string;
    email: string;
    phone: string;
    subject: string;
    message: string;
  }) =>
    api.post(API_ENDPOINTS.web.contact, null, {
      params,
    }),
};
