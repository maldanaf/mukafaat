import { api } from "@network/apiClient";
import { API_ENDPOINTS } from "@network/apiEndpoints";

/**
 * بوابة الدفع الفعّالة — تُضبط من لوحة التحكم (الإعدادات → بوابة الدفع)
 * ويقرأها الفرونت من /api/web/settings، فالتبديل لا يحتاج رفع كود.
 */
export type PaymentGateway = "moyasar" | "arb";

export const DEFAULT_GATEWAY: PaymentGateway = "moyasar";

const CACHE_KEY = "mokafaat_payment_gateway";

let cached: PaymentGateway | null = null;
let inflight: Promise<PaymentGateway> | null = null;

function normalize(value: unknown): PaymentGateway | null {
  const v = String(value ?? "").toLowerCase();
  return v === "moyasar" || v === "arb" ? v : null;
}

function readSessionCache(): PaymentGateway | null {
  if (typeof window === "undefined") return null;
  try {
    return normalize(window.sessionStorage.getItem(CACHE_KEY));
  } catch {
    return null;
  }
}

function writeSessionCache(gateway: PaymentGateway) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CACHE_KEY, gateway);
  } catch {
    /* التخزين قد يكون معطّلاً — نكمل بالكاش في الذاكرة */
  }
}

/**
 * البوابة الفعّالة من السيرفر (مع كاش للجلسة).
 * عند أي فشل نرجع للافتراضي (ميسر) بدل ما نوقف الدفع.
 */
export async function getPaymentGateway(): Promise<PaymentGateway> {
  if (cached) return cached;

  const fromSession = readSessionCache();
  if (fromSession) {
    cached = fromSession;
    return cached;
  }

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const payment = await fetchPaymentConfig();
      const gateway = normalize(payment?.gateway) ?? DEFAULT_GATEWAY;
      cached = gateway;
      writeSessionCache(gateway);
      return gateway;
    } catch {
      return DEFAULT_GATEWAY;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

/* ================= تمارا ================= */

/**
 * إعدادات تمارا كما يرسلها الباك-إند داخل `settings.payment.tamara`.
 * تمارا وسيلة دفع *إضافية* تظهر بجانب البوابة الفعّالة ولا تحلّ محلّها،
 * لذلك لها إعدادها المستقل (تفعيل من اللوحة + حدود المبلغ).
 */
export interface TamaraConfig {
  enabled: boolean;
  minAmount: number;
  maxAmount: number;
  instalments: number;
}

export const TAMARA_DISABLED: TamaraConfig = {
  enabled: false,
  minAmount: 0,
  maxAmount: 0,
  instalments: 3,
};

let tamaraCached: TamaraConfig | null = null;
let tamaraInflight: Promise<TamaraConfig> | null = null;

/** قراءة قسم `payment` من إعدادات الموقع */
async function fetchPaymentConfig(): Promise<Record<string, unknown> | undefined> {
  const res = await api.get(API_ENDPOINTS.webSettings);
  const body = (res.data as Record<string, unknown>) ?? {};
  const data = (body.data ?? body) as Record<string, unknown>;
  const settings = (data.settings ?? data) as Record<string, unknown>;
  return settings.payment as Record<string, unknown> | undefined;
}

/**
 * إعدادات تمارا من السيرفر (مع كاش للجلسة).
 * عند أي فشل نرجع «غير متاحة» — الأسلم ألا يظهر خيار قد لا يعمل.
 */
export async function getTamaraConfig(): Promise<TamaraConfig> {
  if (tamaraCached) return tamaraCached;
  if (tamaraInflight) return tamaraInflight;

  tamaraInflight = (async () => {
    try {
      const payment = await fetchPaymentConfig();
      const tamara = payment?.tamara as Record<string, unknown> | undefined;

      const config: TamaraConfig = {
        enabled: tamara?.enabled === true || tamara?.enabled === 1,
        minAmount: Number(tamara?.min_amount ?? 0),
        maxAmount: Number(tamara?.max_amount ?? 0),
        instalments: Number(tamara?.instalments ?? 3) || 3,
      };

      tamaraCached = config;
      return config;
    } catch {
      return TAMARA_DISABLED;
    } finally {
      tamaraInflight = null;
    }
  })();

  return tamaraInflight;
}

/** هل يُعرض خيار تمارا لهذا المبلغ؟ (مفعّلة + المبلغ داخل حدود الحساب) */
export function isTamaraAvailableFor(config: TamaraConfig | null, amount: number): boolean {
  if (!config?.enabled) return false;
  if (!Number.isFinite(amount) || amount <= 0) return false;
  return amount >= config.minAmount && amount <= config.maxAmount;
}

/**
 * البوابة الخاصة بعملية دفع بعينها: الباك-إند يرسل `gateway` داخل `payment_info`،
 * وهي الأدق لأنها تعبّر عن لحظة إنشاء الطلب. وإلا نرجع للإعداد العام.
 */
export function gatewayFromPaymentInfo(
  paymentInfo?: Record<string, unknown> | null,
): PaymentGateway | null {
  return normalize(paymentInfo?.gateway);
}

/** لمسح الكاش بعد تبديل البوابة من اللوحة (يُستخدم في التطوير/الاختبار). */
export function clearPaymentGatewayCache() {
  cached = null;
  tamaraCached = null;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(CACHE_KEY);
    } catch {
      /* لا شيء */
    }
  }
}
