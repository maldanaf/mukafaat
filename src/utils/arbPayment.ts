import { t } from "i18next";
import { api } from "@network/apiClient";
import { API_ENDPOINTS } from "@network/apiEndpoints";

/**
 * بدء الدفع عبر بوابة الراجحي / NeoLeap (Bank Hosted).
 *
 * التدفّق:
 *  1. نستدعي /api/payment/arb/pay بالـ order_id أو subscription_id + return_url.
 *  2. الباك-إند يشفّر الطلب ويستدعي الراجحي ويرجّع payment_url.
 *  3. نعيد توجيه المتصفح إلى payment_url (صفحة دفع الراجحي).
 *  4. بعد الدفع الراجحي يعيد التوجيه إلى return_url مع ?status=success|failed.
 */
export interface StartArbPaymentParams {
  orderId?: string | number;
  subscriptionId?: string | number;
  /** صفحة الفرونت للعودة إليها بعد الدفع (مع باراميترات النوع/التصنيف مضمّنة). */
  returnUrl: string;
}

export interface StartArbPaymentResult {
  ok: boolean;
  paymentUrl?: string;
  error?: string;
}

/**
 * ينشئ رابط دفع الراجحي ويعيد توجيه المتصفح إليه مباشرة.
 * يرجع النتيجة فقط في حال الفشل (للنجاح يحدث redirect ولا يكمل الكود).
 */
export async function startArbPayment(
  params: StartArbPaymentParams,
): Promise<StartArbPaymentResult> {
  try {
    const res = await api.post(API_ENDPOINTS.arbPay, {
      order_id: params.orderId ?? undefined,
      subscription_id: params.subscriptionId ?? undefined,
      return_url: params.returnUrl,
    });

    const body = (res.data as Record<string, unknown>) ?? {};
    if (body.status === false) {
      return { ok: false, error: String(body.msg || body.message || t("payment.t_b3f76f", "فشل بدء الدفع")) };
    }

    const data = (body.data ?? body) as Record<string, unknown>;
    const paymentUrl =
      (data.payment_url as string | undefined) ||
      ((data.payment as Record<string, unknown>)?.payment_url as string | undefined);

    if (paymentUrl && typeof paymentUrl === "string") {
      window.location.href = paymentUrl;
      return { ok: true, paymentUrl };
    }

    return { ok: false, error: t("payment.t_3ebc76", "لم يتم إرجاع رابط الدفع") };
  } catch (err) {
    const data = (err as { response?: { data?: { msg?: string; message?: string } } })
      ?.response?.data;
    return { ok: false, error: String(data?.msg || data?.message || t("payment.t_50ef45", "تعذّر بدء عملية الدفع")) };
  }
}
