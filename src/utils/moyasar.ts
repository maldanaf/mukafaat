declare global {
  interface Window {
    Moyasar?: {
      init: (config: Record<string, unknown>) => void;
    };
  }
}

// سكربت وستايل ميسر من jsDelivr (بديل عن CDN ميسر عند حدوث AccessDenied)
// https://www.jsdelivr.com/package/npm/moyasar-payment-form
const MOYASAR_CSS_URL =
  process.env.NEXT_PUBLIC_MOYASAR_CSS_URL ||
  "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.7/dist/moyasar.css";
const MOYASAR_SCRIPT_SRC =
  process.env.NEXT_PUBLIC_MOYASAR_SCRIPT_URL ||
  "https://cdn.jsdelivr.net/npm/moyasar-payment-form@2.2.7/dist/moyasar.umd.min.js";

let moyasarPromise: Promise<typeof window.Moyasar> | null = null;

async function loadMoyasarScript(): Promise<typeof window.Moyasar> {
  if (typeof window === "undefined") {
    throw new Error("Moyasar can only be used in the browser.");
  }
  if (window.Moyasar) {
    return window.Moyasar;
  }
  if (!moyasarPromise) {
    moyasarPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src="${MOYASAR_SCRIPT_SRC}"]`
      );
      if (existing) {
        existing.addEventListener("load", () => resolve(window.Moyasar!));
        existing.addEventListener("error", () =>
          reject(new Error("Failed to load Moyasar script"))
        );
        return;
      }
      // تحميل الـ CSS أولاً
      const existingCss = document.querySelector<HTMLLinkElement>(
        `link[href="${MOYASAR_CSS_URL}"]`
      );
      if (!existingCss) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = MOYASAR_CSS_URL;
        document.head.appendChild(link);
      }
      const script = document.createElement("script");
      script.src = MOYASAR_SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve(window.Moyasar!);
      script.onerror = () =>
        reject(new Error("Failed to load Moyasar script"));
      document.head.appendChild(script);
    });
  }
  return moyasarPromise;
}

export interface MoyasarPaymentConfig {
  amountHalala: number;
  currency: string;
  description: string;
  publishableKey: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
  elementSelector?: string;
  methods?: string[];
  /** شبكات البطاقات المدعومة — حسب التوثيق: visa, mastercard, mada, amex */
  supportedNetworks?: string[];
  /** إعدادات Apple Pay (تُرسل فقط عندما تكون applepay ضمن methods) */
  applePay?: {
    country?: string;
    label?: string;
    validateMerchantUrl?: string;
  };
}

/** هل يدعم متصفح الزائر Apple Pay فعلياً؟ (Safari على أجهزة Apple فقط) */
export function isApplePayAvailable(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as {
    ApplePaySession?: { canMakePayments?: () => boolean };
  };
  try {
    return !!w.ApplePaySession?.canMakePayments?.();
  } catch {
    return false;
  }
}

/**
 * تهيئة نموذج الدفع من ميسر باستخدام publishable key و metadata و callback_url.
 * لا يتعامل مع إنشاء الـ payment نفسه، بل يفتح الفورم حسب توثيق ميسر.
 */
export async function initMoyasarPayment(config: MoyasarPaymentConfig) {
  const Moyasar = await loadMoyasarScript();
  if (!Moyasar?.init) {
    throw new Error("Moyasar is not available on window.");
  }

  const element = config.elementSelector ?? ".mysr-form";
  const amount = Math.max(100, Math.floor(config.amountHalala));

  const methods = config.methods ?? ["creditcard"];

  Moyasar.init({
    element,
    amount,
    currency: config.currency || "SAR",
    description: config.description,
    publishable_api_key: config.publishableKey,
    callback_url: config.callbackUrl,
    methods,
    supported_networks: config.supportedNetworks ?? ["visa", "mastercard", "mada"],
    metadata: config.metadata ?? {},
    ...(methods.includes("applepay")
      ? {
          apple_pay: {
            country: config.applePay?.country ?? "SA",
            label: config.applePay?.label ?? config.description,
            ...(config.applePay?.validateMerchantUrl
              ? { validate_merchant_url: config.applePay.validateMerchantUrl }
              : {}),
          },
        }
      : {}),
  });
}

export {};

