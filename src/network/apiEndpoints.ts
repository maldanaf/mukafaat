/**
 * Mokafaat API Endpoints - مطابقة كوليكشن Postman
 * Base: https://mokafat.ivadso.com
 */

const API = "/api";

export const API_ENDPOINTS = {
  // ========== Auth ==========
  auth: {
    sendOtp: `${API}/auth/send-otp`,
    verifyOtp: `${API}/auth/verify-otp`,
    logout: `${API}/auth/logout`,
    completeProfile: `${API}/auth/complete-profile`,
    setLocation: `${API}/auth/set-location`,
    setInterests: `${API}/auth/set-interests`,
  },

  // ========== User / Favorites & Settings ==========
  favorites: `${API}/favorites`,
  favoritesToggle: `${API}/favorites/toggle`,
  settings: `${API}/settings`,
  webSettings: `${API}/web/settings`,
  appConfig: `${API}/app-config`,
  settingsUpdateLanguage: `${API}/settings/update-language`,
  settingsUpdate: `${API}/settings/update`,
  /** إعدادات الإشعارات التفصيلية (GET للقراءة، POST للتحديث) */
  settingsNotifications: `${API}/settings/notifications`,

  // ========== Notifications (تتطلب توكن) ==========
  notifications: {
    index: `${API}/notifications`,
    unreadCount: `${API}/notifications/unread-count`,
    markRead: (id: string | number) => `${API}/notifications/${id}/read`,
    markAllRead: `${API}/notifications/mark-all-read`,
    remove: (id: string | number) => `${API}/notifications/${id}`,
    removeAll: `${API}/notifications/delete-all`,
  },

  // ========== Pages (refund-policy, terms, etc.) ==========
  pages: `${API}/pages`,
  pageDetail: (slug: string) => `${API}/pages/${slug}`,
  faqs: `${API}/web/faqs`,

  // ========== General ==========
  categories: `${API}/categories`,
  phoneCodes: `${API}/phone-codes`,
  locations: {
    countries: `${API}/locations/countries`,
    regions: (id: string | number) => `${API}/locations/regions/${id}`,
    citiesByCountry: (id: string | number) =>
      `${API}/locations/cities-by-country/${id}`,
    cities: (id: string | number) => `${API}/locations/cities/${id}`,
  },

  // ========== Home & Discovery ==========
  home: `${API}/home`,
  filters: (categoryId: string | number) => `${API}/filters/${categoryId}`,
  offersByCategory: (categoryId: string | number) =>
    `${API}/offers-by-category/${categoryId}`,
  search: `${API}/search`,
  filterOptions: `${API}/filter-options`,
  offerDetail: (id: string | number) => `${API}/offers/${id}`,

  // ========== Merchants ==========
  merchants: `${API}/merchants`,
  merchantDetail: (id: string | number) => `${API}/merchants/${id}`,
  merchantFollow: (id: string | number) => `${API}/merchants/${id}/follow`,
  merchantReview: `${API}/merchants/review`,

  // ========== Points ==========
  points: {
    balance: `${API}/points/balance`,
    history: `${API}/points/history`,
    redeem: `${API}/points/redeem`,
  },

  // ========== Wallet ==========
  wallet: `${API}/wallet`,
  walletBalance: `${API}/wallet/balance`,
  walletHistory: `${API}/wallet/history`,
  /** مبالغ الشحن السريعة وحدّا الأدنى/الأعلى (تُضبط من لوحة التحكم) */
  walletTopupOptions: `${API}/wallet/topup-options`,
  /** بدء شحن الرصيد — يرجّع payment_info لبوابة الدفع */
  walletTopup: `${API}/wallet/topup`,
  myTransactions: `${API}/my-transactions`,

  // ========== Profile ==========
  profile: `${API}/profile`,
  profileUpdate: `${API}/profile/update`,
  /** حذف الحساب نهائياً */
  profileDelete: `${API}/profile/delete`,

  // ========== Subscription ==========
  subscription: {
    plans: `${API}/subscription/plans`,
    subscribe: `${API}/subscription/subscribe`,
    subscribeForOther: `${API}/subscription/subscribe-for-other`,
    status: `${API}/subscription/status`,
    history: `${API}/subscription/history`,
    checkPayment: `${API}/subscription/check-payment`,
    changePreview: `${API}/subscription/change-preview`,
    /** باقات الإهداء بأسعارها بعد خصم المستوى والكوبون */
    giftPlans: `${API}/subscription/gift/plans`,
    /** الاشتراكات التي أهديتها لآخرين */
    gifts: `${API}/subscription/gifts`,
    /** فاتورة اشتراك أهديته (تُعرض للمُهدي فقط) */
    giftInvoice: (id: string | number) => `${API}/subscription/gift/${id}/invoice`,
  },

  // ========== Referrals (شارك واربح) ==========
  referrals: {
    index: `${API}/referrals`,
    rewards: `${API}/referrals/rewards`,
    attach: `${API}/referrals/attach`,
  },

  // ========== Family (أفراد العائلة) ==========
  family: {
    index: `${API}/family`,
    invite: `${API}/family/invite`,
    removeMember: (id: string | number) => `${API}/family/members/${id}`,
    invitations: `${API}/family/invitations`,
    acceptInvitation: (id: string | number) =>
      `${API}/family/invitations/${id}/accept`,
  },

  // ========== Store Requests (انضمام متجر / اقتراح متجر) — عام ==========
  storeRequests: `${API}/store-requests`,

  // ========== Geo (الدولة الافتراضية + الدول المفعّلة مع single_country) ==========
  geo: {
    country: `${API}/geo/country`,
    countries: `${API}/geo/countries`,
  },

  // ========== Membership (تحقق من العضوية — عام، بدون توكن) ==========
  membership: {
    verify: (membershipNumber: string) =>
      `${API}/membership/verify/${encodeURIComponent(membershipNumber)}`,
  },
  // ========== Payment (callback after gateway redirect) ==========
  paymentCallback: `${API}/payment/callback`,

  // ========== ARB / NeoLeap (Bank Hosted redirect) ==========
  arbPay: `${API}/payment/arb/pay`,
  arbVerify: `${API}/payment/arb/verify`,

  // ========== Tamara BNPL (hosted checkout redirect) ==========
  tamaraPay: `${API}/payment/tamara/pay`,
  tamaraVerify: `${API}/payment/tamara/verify`,

  // ========== تغيير رقم الجوال (بتوثيق الرقم الجديد) ==========
  phoneChangeRequest: `${API}/profile/phone/request`,
  phoneChangeVerify: `${API}/profile/phone/verify`,

  // ========== Orders ==========
  orders: `${API}/orders`,
  orderDetail: (id: string | number) => `${API}/orders/${id}`,
  orderCancel: (id: string | number) => `${API}/orders/${id}/cancel`,
  orderVerifyMerchantCode: (id: string | number) =>
    `${API}/orders/${id}/verify-merchant-code`,

  // ========== Discount Codes (تطبق خصم على إجمالي الحجز) ==========
  discountCodes: {
    validate: `${API}/discount-codes/validate`,
  },

  // ========== Affiliate Public Stats (يفتح بدون توكن — protected by long token) ==========
  affiliatePublic: (token: string) => `${API}/affiliate/public/${token}`,

  // ========== Coupons (app) ==========
  coupons: {
    home: `${API}/coupons/home`,
    search: `${API}/coupons/search`,
    byCategory: (id: string | number) => `${API}/coupons/by-category/${id}`,
    byMerchant: (id: string | number) => `${API}/coupons/by-merchant/${id}`,
    detail: (id: string | number) => `${API}/coupons/${id}`,
    use: (id: string | number) => `${API}/coupons/${id}/use`,
    vote: (id: string | number) => `${API}/coupons/${id}/vote`,
    /** التحقق من كوبون خصم قبل الدفع (subscription | offer | card) */
    validate: `${API}/coupons/validate`,
  },

  // ========== Cards (app) ==========
  cards: {
    home: `${API}/cards/home`,
    search: `${API}/cards/search`,
    byCategory: (id: string | number) => `${API}/cards/by-category/${id}`,
    byMerchant: (id: string | number) => `${API}/cards/by-merchant/${id}`,
    detail: (id: string | number) => `${API}/cards/${id}`,
  },

  // ========== Web (public - للوحة ويب) — مطابقة كوليكشن Website ==========
  web: {
    home: `${API}/web/home`,
    about: `${API}/web/about`,
    contact: `${API}/web/contact`,
    cards: `${API}/web/cards`,
    cardDetail: (id: string | number) => `${API}/web/cards/${id}`,
    cardCountries: `${API}/web/card-countries`,
    categoriesCards: (platformSlug: string) =>
      `${API}/web/categories/${platformSlug}/cards`,
    news: `${API}/web/news`,
    newsDetail: (slug: string) => `${API}/web/news/${slug}`,
    newsByCategory: (categorySlug: string) =>
      `${API}/web/news/categories/${categorySlug}`,
    couponsHome: `${API}/web/coupons/home`,
    coupons: `${API}/web/coupons`,
    couponDetail: (id: string | number) => `${API}/web/coupons/${id}`,
    /** تسجيل نسخة كود كوبون (عام بدون توثيق) — يرجع copies_count المحدّث */
    couponCopy: (id: string | number) => `${API}/web/coupons/${id}/copy`,
    categoryCoupons: (categorySlug: string) =>
      `${API}/web/categories/${categorySlug}/coupons`,
    offers: `${API}/web/offers`,
    offerDetail: (id: string | number) => `${API}/web/offers/${id}`,
    popupAds: `${API}/web/popup-ads`,
    newsletterSubscribe: `${API}/web/newsletter/subscribe`,
    bookings: `${API}/web/bookings`,
  },

  // ========== توافق مع الكود القديم — لا تستخدم مع سيرفر مكافآت (ليس في الكوليكشن) ==========
  getAboutUs: "/website/aboutUs",
  /** @deprecated غير موجود في API مكافآت — استخدم API_ENDPOINTS.web.home واستخرج contact إن وُجد */
  getContactInfos: "/website/contactInfos",
  getGallery: "/website/v2/gallery",
  getServices: "/website/services",
  getEvents: "/website/events?",
  getClients: "/website/clients",
  getPrivacyPolicy: "/website/privacyPolicy",
  getTermsConditions: "/website/termsConditions",
  getCities: "/cities",
  getDepartments: "/departments/users",
  getWorkTypes: "/workTypes",
  registerJobSeeker: "/jobSeekers/regsiter",
  sendTechSupportMessage: "/techSupport/create",
  confirmEmail: "/auth/confirmEmail",
  getJobs: "/website/jobs",
  sendCompanyApplication: "/website/company-application",
  getContract: (contractId: string) => `/website/contract/${contractId}`,
  signContract: "/website/sign-contract",
  getContractTemplate: "/website/get-contract-template",
  getContractFont: "/website/get-contract-font",
  getRatingQuestions: (userId: number) =>
    `/rating/get-user-questions?userId=${userId}`,
  submitRating: "/rating/submit",
  getProjects: "/website/v2/projects?",
  getProject: (projectId: string) => `/website/v2/projects/${projectId}`,
  getUpcomingProjects: "/website/v2/projects/upcoming?",
  verifyEmail: "/website/verify_email",
  verifyOtp: "/website/verify_otp",
  uploadFreelancerIntroVideo: "/website/upload_freelancer_intro_video",
  businessRegistration: "/clients/register",
} as const;
