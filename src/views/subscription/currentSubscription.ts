/**
 * قراءة اشتراك المستخدم الحالي من `GET /api/subscription/status` ومطابقته
 * بكرت الباقة في صفحة الباقات.
 *
 * شكل الاستجابة الفعلي (SubscriptionController::status):
 *   { status, errNum, msg, data: { subscription: {
 *       has_subscription, is_active, id, plan_name, plan_description, type,
 *       price, payment_status, start_date, end_date, days_remaining, status,
 *       membership_card
 *   } }, user_meta: { has_active_subscription } }
 *
 * ملاحظة مهمة: الاستجابة **لا** تحتوي على `subscription_plan_id` رغم وجود
 * العمود في جدول `subscriptions`. لذلك نحاول أولاً أي معرّف صريح إن أضافه
 * الخادم مستقبلاً (`subscription_plan_id` / `plan_id` / `plan.id`)، وإلا
 * نرجع لمطابقة الاسم (`plan_name`) مع اسم الباقة في الكرت.
 */

import type { RawPlan } from "@utils/subscriptionPricing";

/** عتبة «قارب على الانتهاء» بالأيام */
export const RENEW_THRESHOLD_DAYS = 30;

export interface CurrentSubscription {
  /** معرّف الباقة إن أرسله الخادم (غير متوفر حالياً) */
  planId: string | null;
  /** اسم الباقة كما أرسله الخادم — يُستخدم للمطابقة الاحتياطية */
  planName: string;
  /** اشتراك فعّال (غير منتهٍ) */
  isActive: boolean;
  /** تاريخ الانتهاء الخام (Y-m-d) */
  endDate: string | null;
  /** الأيام المتبقية (من الخادم أو محسوبة من تاريخ الانتهاء) */
  daysRemaining: number | null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function toId(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number" && !Number.isFinite(value)) return null;
  const s = String(value).trim();
  return s.length > 0 ? s : null;
}

/** تطبيع الاسم للمقارنة: مسافات موحّدة، حروف صغيرة، بلا تشكيل/تطويل عربي */
export function normalizePlanName(value: unknown): string {
  return String(value ?? "")
    // تطويل (U+0640) + علامات التشكيل (U+064B–U+065F, U+0670)
    // مفصولة إلى ثلاث خطوات تفادياً لتحذير no-misleading-character-class
    .replace(/\u0640/gu, "")
    .replace(/[\u064B-\u065F]/gu, "")
    .replace(/\u0670/gu, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىي]/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** عدد الأيام بين اليوم وتاريخ الانتهاء (قد يكون سالباً إن انتهى) */
function daysUntil(dateStr: string): number | null {
  const ts = Date.parse(`${dateStr}T00:00:00`);
  const parsed = Number.isNaN(ts) ? Date.parse(dateStr) : ts;
  if (Number.isNaN(parsed)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((parsed - today.getTime()) / 86_400_000);
}

/** استخراج اشتراك المستخدم الحالي من استجابة /api/subscription/status */
export function parseCurrentSubscription(
  payload: unknown,
): CurrentSubscription | null {
  const root = asRecord(payload);
  if (!root) return null;

  const data = asRecord(root.data) ?? root;
  const sub = asRecord(data.subscription) ?? asRecord(root.subscription) ?? data;
  if (!sub) return null;

  // has_subscription = false → لا يوجد اشتراك (ولا حتى منتهٍ)
  if (sub.has_subscription === false) return null;

  const planName = String(sub.plan_name ?? sub.planName ?? "").trim();
  const planId =
    toId(sub.subscription_plan_id) ??
    toId(sub.plan_id) ??
    toId(asRecord(sub.plan)?.id);

  // بلا معرّف ولا اسم لا يمكن مطابقة أي كرت
  if (!planId && !planName) return null;

  const endDate =
    typeof sub.end_date === "string" && sub.end_date.trim()
      ? sub.end_date.trim()
      : null;

  const rawDays = sub.days_remaining;
  const serverDays =
    rawDays === null || rawDays === undefined || rawDays === ""
      ? null
      : Number.isFinite(Number(rawDays))
        ? Math.round(Number(rawDays))
        : null;

  const computedDays = endDate ? daysUntil(endDate) : null;

  const isActive =
    sub.is_active === true ||
    (sub.is_active === undefined &&
      sub.status === "active" &&
      (computedDays === null || computedDays >= 0));

  // الخادم يرجع days_remaining = 0 للاشتراك المنتهي؛ نعتمد المحسوب حينها
  const daysRemaining = isActive
    ? (serverDays ?? computedDays)
    : (computedDays ?? serverDays);

  return { planId, planName, isActive, endDate, daysRemaining };
}

/** هل هذا الكرت هو باقة المستخدم الحالية؟ */
export function isCurrentPlan(
  plan: RawPlan,
  current: CurrentSubscription | null,
): boolean {
  if (!current) return false;

  if (current.planId) return String(plan.id) === current.planId;

  const target = normalizePlanName(current.planName);
  if (!target) return false;

  return [plan.name, plan.name_ar, plan.name_en]
    .map(normalizePlanName)
    .some((n) => n.length > 0 && n === target);
}

/** هل حان وقت التجديد؟ (منتهٍ أو ≤ 30 يوماً) */
export function needsRenewal(current: CurrentSubscription): boolean {
  if (!current.isActive) return true;
  const d = current.daysRemaining;
  return d !== null && d <= RENEW_THRESHOLD_DAYS;
}

/** تنسيق تاريخ Y-m-d بحسب لغة الواجهة، مع رجوع آمن للنص الخام */
export function formatEndDate(dateStr: string, lang: string): string {
  const ts = Date.parse(`${dateStr}T00:00:00`);
  const parsed = Number.isNaN(ts) ? Date.parse(dateStr) : ts;
  if (Number.isNaN(parsed)) return dateStr;
  try {
    return new Intl.DateTimeFormat(`${lang}-u-ca-gregory-nu-latn`, {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(parsed));
  } catch {
    return dateStr;
  }
}
