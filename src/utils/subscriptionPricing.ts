/**
 * أدوات مشتركة لقراءة أسعار باقات الاشتراك ومستوى العضوية.
 *
 * الباك-إند يرجع مع كل باقة (في /api/subscription/plans و/api/subscription/gift/plans):
 *   price_original، tier_discount_type (renewal|new)، tier_discount_percent،
 *   tier_discount_amount، price_after_discount — وفي باقات الإهداء أيضاً
 *   coupon_discount / discount_code_discount / total_discount.
 *
 * كل الحقول اختيارية: عند غيابها نرجع لسعر `price` الأساسي بلا خصم،
 * حتى لا تنكسر أي صفحة مع نسخة أقدم من الـ API.
 */

export interface RawPlan {
  id: number | string;
  name?: string;
  name_ar?: string;
  name_en?: string;
  type?: string;
  price?: number | string;
  duration?: string;
  duration_label?: string;
  duration_months?: number;
  duration_days?: number;
  description?: string | null;
  features?: string[] | { ar?: string; en?: string }[];
  is_family?: boolean;
  max_family_members?: number | null;
  price_original?: number | string;
  tier_discount_type?: string;
  tier_discount_percent?: number | string;
  tier_discount_amount?: number | string;
  price_after_discount?: number | string;
  coupon_discount?: number | string;
  coupon_applied?: boolean;
  discount_code_discount?: number | string;
  discount_code_applied?: boolean;
  total_discount?: number | string;
  [key: string]: unknown;
}

export interface PlanPricing {
  /** السعر قبل أي خصم (price_original أو price) */
  original: number;
  /** السعر النهائي المعروض (price_after_discount أو price) */
  final: number;
  /** نسبة خصم مستوى العضوية */
  tierPercent: number;
  /** قيمة خصم مستوى العضوية */
  tierAmount: number;
  /** renewal = خصم التجديد | new = خصم الاشتراك الجديد */
  tierType: "renewal" | "new" | null;
  /** خصم الكوبون (في باقات الإهداء) */
  couponDiscount: number;
  /** خصم كود الخصم (في باقات الإهداء) */
  discountCodeDiscount: number;
  /** مجموع الخصومات */
  totalDiscount: number;
  /** هل نعرض السعر القديم مشطوباً؟ */
  hasDiscount: boolean;
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

/** قراءة تسعير الباقة بأمان (يحتمل غياب كل الحقول الجديدة) */
export function getPlanPricing(plan: RawPlan | null | undefined): PlanPricing {
  const base = toNumber(plan?.price, 0);
  const original = plan?.price_original != null
    ? toNumber(plan.price_original, base)
    : base;
  const final = plan?.price_after_discount != null
    ? toNumber(plan.price_after_discount, original)
    : original;

  const tierPercent = toNumber(plan?.tier_discount_percent, 0);
  const tierAmountRaw = toNumber(plan?.tier_discount_amount, 0);
  const tierAmount = tierAmountRaw > 0
    ? tierAmountRaw
    : tierPercent > 0
      ? Math.round(((original * tierPercent) / 100) * 100) / 100
      : 0;

  const couponDiscount = toNumber(plan?.coupon_discount, 0);
  const discountCodeDiscount = toNumber(plan?.discount_code_discount, 0);
  const totalDiscount = plan?.total_discount != null
    ? toNumber(plan.total_discount, 0)
    : Math.max(Math.round((original - final) * 100) / 100, 0);

  const rawType = String(plan?.tier_discount_type ?? "").toLowerCase();
  const tierType: PlanPricing["tierType"] =
    rawType === "renewal" ? "renewal" : rawType === "new" ? "new" : null;

  return {
    original,
    final,
    tierPercent,
    tierAmount,
    tierType,
    couponDiscount,
    discountCodeDiscount,
    totalDiscount,
    hasDiscount: original > 0 && final < original,
  };
}

/** اسم الباقة حسب اللغة (يتحمّل name أو name_ar/name_en) */
export function getPlanName(plan: RawPlan | null | undefined, isRTL: boolean): string {
  if (!plan) return "";
  const name =
    (plan.name as string) ??
    (isRTL ? plan.name_ar ?? plan.name_en : plan.name_en ?? plan.name_ar);
  return name || "";
}

/**
 * مفتاح مدة الباقة الموحّد — نفس قيم الباك-إند التي يعالجها التطبيق:
 * monthly | 3_months | 6_months | yearly | 2_years، وإلا `null` (نعرض النص الخام).
 */
export type PlanDurationKey =
  | "monthly"
  | "3_months"
  | "6_months"
  | "yearly"
  | "2_years";

export function getPlanDurationKey(
  plan: RawPlan | null | undefined,
): PlanDurationKey | null {
  const raw = String(plan?.duration ?? "").toLowerCase().trim();
  switch (raw) {
    case "monthly":
      return "monthly";
    case "3_months":
    case "quarterly":
      return "3_months";
    case "6_months":
    case "semi-annual":
    case "semi_annual":
      return "6_months";
    case "yearly":
    case "annual":
      return "yearly";
    case "2_years":
      return "2_years";
    default:
      break;
  }
  // لا قيمة نصية معروفة — نشتقّ من عدد الأشهر إن وُجد
  const months = plan?.duration_months != null ? Number(plan.duration_months) : null;
  if (months === 1) return "monthly";
  if (months === 3) return "3_months";
  if (months === 6) return "6_months";
  if (months === 12) return "yearly";
  if (months === 24) return "2_years";
  return null;
}

/**
 * نص المدة الجاهز للعرض: الترجمة إن عرفنا المفتاح، وإلا `duration_label`
 * من الخادم (باقات الإهداء ترسله)، وإلا النص الخام، وإلا سلسلة فارغة.
 */
export function getPlanDurationLabel(
  plan: RawPlan | null | undefined,
  t: (key: string) => string,
): string {
  const key = getPlanDurationKey(plan);
  if (key) return t(`subscription.duration.${key}`);
  const fromServer = String(plan?.duration_label ?? "").trim();
  if (fromServer) return fromServer;
  return String(plan?.duration ?? "").trim();
}

/** عدد أفراد العائلة المسموح (0 = الباقة لا تسمح بأفراد) */
export function getPlanFamilySeats(plan: RawPlan | null | undefined): number {
  const n = Number(plan?.max_family_members ?? 0);
  return Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0;
}

/** نسبة الخصم المعروضة على الكرت (من الخادم أو محسوبة من الفرق) */
export function getDiscountPercent(pricing: PlanPricing): number {
  if (pricing.tierPercent > 0) return Math.round(pricing.tierPercent);
  if (pricing.original <= 0) return 0;
  return Math.round(((pricing.original - pricing.final) / pricing.original) * 100);
}

/** مدة الباقة بالأشهر (monthly/yearly أو duration_months/duration_days) */
export function getPlanDurationMonths(plan: RawPlan | null | undefined): number {
  if (!plan) return 0;
  if (plan.duration_months != null) return Number(plan.duration_months);
  if (plan.duration_days != null) return Math.round(Number(plan.duration_days) / 30);
  const d = String(plan.duration ?? "").toLowerCase();
  if (d === "monthly") return 1;
  if (d === "yearly" || d === "annual") return 12;
  return 0;
}

/**
 * مزايا الباقة — نفس منطق التطبيق (`_features` في choose_package_view.dart):
 * `features` إن أرسلها الخادم، وإلا تقسيم `description` على الأسطر
 * وفواصل القوائم الشائعة (• ؛ |) مع إزالة الرموز البادئة.
 */
export function getPlanFeatures(
  plan: RawPlan | null | undefined,
  isRTL: boolean,
): string[] {
  const raw = (plan?.features ?? plan?.description) as unknown;
  if (raw == null) return [];

  let parts: string[];
  if (Array.isArray(raw)) {
    parts = raw.map((f) => {
      if (typeof f === "string") return f;
      const o = f as Record<string, unknown>;
      const localized = isRTL ? o.ar : o.en;
      return String(localized ?? o.title ?? o.name ?? o.text ?? o.ar ?? o.en ?? "");
    });
  } else {
    parts = String(raw).split(/[\n\r•؛|]+/);
  }

  return parts
    .map((f) => f.trim().replace(/^[-–—*✓•]\s*/, "").trim())
    .filter((f) => f.length > 0);
}

/** استخراج قائمة الباقات من أي شكل استجابة ({data:{plans}} أو {plans} أو مصفوفة) */
export function parsePlansList(payload: unknown): RawPlan[] {
  const raw = payload as Record<string, unknown> | undefined;
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as RawPlan[];
  const data = raw.data as Record<string, unknown> | undefined;
  const gift = (data?.gift ?? raw.gift) as Record<string, unknown> | undefined;
  const list =
    gift?.plans ?? data?.plans ?? raw.plans ?? data?.data ?? raw.data ?? raw;
  return Array.isArray(list) ? (list as RawPlan[]) : [];
}

/** غلاف استجابة باقات الإهداء (المستوى + رسائل الكوبون) */
export interface GiftPlansMeta {
  tier: MembershipTier | null;
  tierPercent: number;
  couponCode: string | null;
  couponMessage: string | null;
  discountCode: string | null;
  discountCodeMessage: string | null;
  currency: string;
}

export function parseGiftPlansMeta(payload: unknown): GiftPlansMeta {
  const raw = (payload ?? {}) as Record<string, unknown>;
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const gift = (data.gift ?? data) as Record<string, unknown>;
  const tierRaw = gift.tier as Record<string, unknown> | null | undefined;

  return {
    tier: tierRaw
      ? {
          id: Number(tierRaw.id ?? 0),
          name: String(tierRaw.name ?? ""),
          color: (tierRaw.color as string) ?? null,
          icon: (tierRaw.icon as string) ?? null,
          level: toNumber(tierRaw.level, 0),
          description: (tierRaw.description as string) ?? null,
          renewalDiscountPercent: toNumber(tierRaw.renewal_discount_percent, 0),
          newSubscriptionDiscountPercent: toNumber(
            tierRaw.new_subscription_discount_percent,
            0,
          ),
        }
      : null,
    tierPercent: toNumber(gift.tier_discount_percent, 0),
    couponCode: (gift.coupon_code as string) ?? null,
    couponMessage: (gift.coupon_message as string) ?? null,
    discountCode: (gift.discount_code as string) ?? null,
    discountCodeMessage: (gift.discount_code_message as string) ?? null,
    currency: String(gift.currency ?? "SAR"),
  };
}

/* ===================== مستوى العضوية ===================== */

export interface MembershipTierNext {
  id: number;
  name: string;
  color: string | null;
  minPaidOrders: number;
  minSpend: number;
  currentOrders: number;
  currentSpend: number;
  remainingOrders: number;
  remainingSpend: number;
  renewalDiscountPercent: number;
  newSubscriptionDiscountPercent: number;
}

export interface MembershipTier {
  id: number;
  name: string;
  description?: string | null;
  level: number;
  color: string | null;
  icon?: string | null;
  renewalDiscountPercent: number;
  newSubscriptionDiscountPercent: number;
  evaluationMonths?: number;
  currentOrders?: number;
  currentSpend?: number;
  next?: MembershipTierNext | null;
}

/**
 * استخراج مستوى العضوية من استجابة /api/profile
 * (`data.user.membership_tier` بحسب AuthController::profile).
 */
export function parseMembershipTier(profilePayload: unknown): MembershipTier | null {
  const raw = profilePayload as Record<string, unknown> | undefined;
  if (!raw) return null;
  const data = (raw.data ?? raw) as Record<string, unknown> | undefined;
  const userObj = (data?.user ?? data) as Record<string, unknown> | undefined;
  const tierRaw = (userObj?.membership_tier ?? raw.membership_tier) as
    | Record<string, unknown>
    | null
    | undefined;
  if (!tierRaw || typeof tierRaw !== "object") return null;

  const nextRaw = tierRaw.next_tier as Record<string, unknown> | null | undefined;

  return {
    id: Number(tierRaw.id ?? 0),
    name: String(tierRaw.name ?? ""),
    description: (tierRaw.description as string) ?? null,
    level: toNumber(tierRaw.level, 0),
    color: (tierRaw.color as string) ?? null,
    icon: (tierRaw.icon as string) ?? null,
    renewalDiscountPercent: toNumber(tierRaw.renewal_discount_percent, 0),
    newSubscriptionDiscountPercent: toNumber(
      tierRaw.new_subscription_discount_percent,
      0,
    ),
    evaluationMonths: toNumber(tierRaw.evaluation_months, 0),
    currentOrders: toNumber(tierRaw.current_orders, 0),
    currentSpend: toNumber(tierRaw.current_spend, 0),
    next: nextRaw
      ? {
          id: Number(nextRaw.id ?? 0),
          name: String(nextRaw.name ?? ""),
          color: (nextRaw.color as string) ?? null,
          minPaidOrders: toNumber(nextRaw.min_paid_orders, 0),
          minSpend: toNumber(nextRaw.min_spend, 0),
          currentOrders: toNumber(nextRaw.current_orders, 0),
          currentSpend: toNumber(nextRaw.current_spend, 0),
          remainingOrders: toNumber(nextRaw.remaining_orders, 0),
          remainingSpend: toNumber(nextRaw.remaining_spend, 0),
          renewalDiscountPercent: toNumber(nextRaw.renewal_discount_percent, 0),
          newSubscriptionDiscountPercent: toNumber(
            nextRaw.new_subscription_discount_percent,
            0,
          ),
        }
      : null,
  };
}

/** تنسيق رقم السعر بلا أصفار زائدة (99.00 → 99) */
export function formatPrice(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 100) / 100);
}
