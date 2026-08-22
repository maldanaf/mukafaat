import axios, { AxiosError } from "axios";
import { API_BASE_URL } from "@config/api";
import i18n from "../i18n";

/** لغة الطلب لرأس Accept-Language (وفق لغة الواجهة في i18n) */
const ACCEPT_LANGUAGE_CODES = ["ar", "en", "fr", "ur", "hi"] as const;

/** قيمة رأس Accept-Language لكل طلبات الـ API (تتبع لغة الواجهة) */
export function getAcceptLanguage(): string {
  const lang = i18n.language?.split("-")[0] || "ar";
  return (ACCEPT_LANGUAGE_CODES as readonly string[]).includes(lang)
    ? lang
    : "ar";
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// تجنب الاعتماد الدائري: التوكن يُحقَن من التطبيق عبر setAuthTokenGetter
type TokenGetter = () => string | null;
type LogoutFn = () => void;
let getAuthToken: TokenGetter = () => null;
let onUnauthorized: LogoutFn = () => {};

export function setAuthTokenGetter(fn: TokenGetter) {
  getAuthToken = fn;
}

export function setOnUnauthorized(fn: LogoutFn) {
  onUnauthorized = fn;
}


/**
 * المدينة تُطبَّق على العروض والمطاعم والمتاجر فقط.
 * الكوبونات والبطاقات تتبع الدولة فقط (لا تتأثر باختيار المدينة).
 */
const CITY_FILTERED_PATHS = [
  "/api/web/home",
  "/api/web/offers",
  "/api/web/filters",
  "/api/home",
  "/api/offers-by-category",
  "/api/offers",
  "/api/search",
  "/api/merchants",
  "/api/filter-options",
];

/**
 * المدينة المختارة: المصدر الأساسي هو مخزن zustand المحفوظ (mukafaat-city)،
 * ونسخة `city_id` احتياطية — هكذا لا تتأثر القراءة بترتيب إعادة ترطيب المخزن.
 */
export function getSelectedCityId(): number | null {
  try {
    const raw = localStorage.getItem("mukafaat-city");
    if (raw) {
      const parsed = JSON.parse(raw) as { state?: { cityId?: number | null } };
      const id = parsed?.state?.cityId;
      if (typeof id === "number" && Number.isFinite(id)) return id;
      if (id === null) return null;
    }
  } catch {
    // ignore parse/storage failures
  }

  try {
    const fallback = localStorage.getItem("city_id");
    const id = fallback && fallback.trim() !== "" ? Number(fallback) : NaN;
    return Number.isFinite(id) ? id : null;
  } catch {
    return null;
  }
}

export function shouldApplyCityFilter(url?: string): boolean {
  if (!url) return false;
  // البطاقات والكوبونات خارج فلترة المدينة مهما كان المسار
  if (url.includes("/coupons") || url.includes("/cards")) return false;
  // مسار تصنيف: /api/web/categories/{slug}/offers
  if (url.includes("/api/web/categories/") && url.includes("/offers")) return true;
  return CITY_FILTERED_PATHS.some((path) => url.includes(path));
}

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["Accept-Language"] = getAcceptLanguage();

    // Inject selected country_id into ALL requests as query param (unless explicitly provided).
    // Selected country is stored by LanguageToggle in localStorage.
    try {
      const storedCountryId = localStorage.getItem("country_id");
      const countryIdNum =
        storedCountryId && storedCountryId.trim() !== ""
          ? Number(storedCountryId)
          : NaN;
      if (Number.isFinite(countryIdNum)) {
        const params = (config.params ?? {}) as Record<string, unknown>;
        if (params.country_id == null || String(params.country_id).trim() === "") {
          config.params = { ...params, country_id: countryIdNum };
        }
      }
    } catch {
      // ignore storage access failures
    }

    // حقن المدينة المختارة (العروض/المطاعم/المتاجر فقط)
    try {
      if (shouldApplyCityFilter(config.url)) {
        const cityId = getSelectedCityId();
        if (cityId != null) {
          const params = (config.params ?? {}) as Record<string, unknown>;
          if (params.city_id == null || String(params.city_id).trim() === "") {
            config.params = { ...params, city_id: cityId };
          }
        }
      }
    } catch {
      // ignore storage access failures
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// حماية من استدعاء logout أكثر من مرة بنفس الوقت
let isLoggingOut = false;

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError) => {
    if (err.response?.status === 401 && !isLoggingOut) {
      // التوكن باطل أو منتهي → logout فوري
      const token = getAuthToken();
      if (token) {
        isLoggingOut = true;
        onUnauthorized();
        // redirect لصفحة الدخول بعد تأخير بسيط عشان الـ state يتحدث
        setTimeout(() => {
          isLoggingOut = false;
          if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
            window.location.href = `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
          }
        }, 100);
      }
    }
    return Promise.reject(err);
  }
);
