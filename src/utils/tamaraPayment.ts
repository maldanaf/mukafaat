import { api } from "@network/apiClient";
import { API_ENDPOINTS } from "@network/apiEndpoints";

/**
 * تمارا (Tamara) — اشترِ الآن وادفع لاحقاً.
 *
 * وسيلة دفع إضافية تظهر بجانب ميسر/الراجحي ولا تحلّ محلّهما.
 *
 * التدفّق:
 *  1. نستدعي /api/payment/tamara/pay بالـ order_id أو subscription_id + return_url.
 *  2. الباك-إند ينشئ جلسة لدى تمارا ويرجّع checkout_url.
 *  3. نعيد توجيه المتصفح إلى checkout_url (صفحة تمارا).
 *  4. بعد الدفع تمارا تعيد التوجيه للباك-إند الذي يفعّل الطلب
 *     ثم يوجّه إلى return_url مع ?status=success|failed&gateway=tamara.
 */
export interface StartTamaraPaymentParams {
  orderId?: string | number;
  subscriptionId?: string | number;
  /** صفحة الفرونت للعودة إليها بعد الدفع (مع باراميترات النوع/التصنيف مضمّنة). */
  returnUrl: string;
}

export interface StartTamaraPaymentResult {
  ok: boolean;
  checkoutUrl?: string;
  error?: string;
}

/**
 * ينشئ جلسة دفع تمارا ويعيد توجيه المتصفح إليها مباشرة.
 * يرجع النتيجة فقط في حال الفشل (عند النجاح يحدث redirect ولا يكمل الكود).
 */
export async function startTamaraPayment(
  params: StartTamaraPaymentParams,
): Promise<StartTamaraPaymentResult> {
  try {
    const res = await api.post(API_ENDPOINTS.tamaraPay, {
      order_id: params.orderId ?? undefined,
      subscription_id: params.subscriptionId ?? undefined,
      return_url: params.returnUrl,
    });

    const body = (res.data as Record<string, unknown>) ?? {};
    if (body.status === false) {
      return {
        ok: false,
        error: String(body.msg || body.message || "فشل بدء الدفع عبر تمارا"),
      };
    }

    const data = (body.data ?? body) as Record<string, unknown>;
    const payment = (data.payment ?? data) as Record<string, unknown>;
    const checkoutUrl =
      (payment.checkout_url as string | undefined) ||
      (payment.payment_url as string | undefined);

    if (checkoutUrl && typeof checkoutUrl === "string") {
      window.location.href = checkoutUrl;
      return { ok: true, checkoutUrl };
    }

    return { ok: false, error: "لم يتم إرجاع رابط الدفع" };
  } catch (err) {
    const data = (err as { response?: { data?: { msg?: string; message?: string } } })
      ?.response?.data;
    return {
      ok: false,
      error: String(data?.msg || data?.message || "تعذّر بدء الدفع عبر تمارا"),
    };
  }
}
