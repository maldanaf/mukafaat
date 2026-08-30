"use client";

import { useEffect, useState } from "react";
import {
  getTamaraConfig,
  isTamaraAvailableFor,
  TAMARA_DISABLED,
  type TamaraConfig,
} from "@utils/paymentGateway";

/**
 * إتاحة تمارا في شاشة دفع بعينها.
 *
 * تمارا وسيلة دفع *إضافية* تظهر بجانب البوابة الفعّالة (ميسر/الراجحي)،
 * وتظهر فقط عند تحقّق شرطين:
 *  1. مفعّلة من لوحة التحكم والمفاتيح مضبوطة (`settings.payment.tamara.enabled`)
 *  2. المبلغ داخل حدود الحساب لدى تمارا (min/max)
 *
 * @param amount المبلغ المستحق فعلياً (بعد الخصومات ورصيد المحفظة)
 */
export function useTamara(amount: number) {
  const [config, setConfig] = useState<TamaraConfig>(TAMARA_DISABLED);

  useEffect(() => {
    let active = true;
    getTamaraConfig()
      .then((c) => {
        if (active) setConfig(c);
      })
      .catch(() => {
        if (active) setConfig(TAMARA_DISABLED);
      });
    return () => {
      active = false;
    };
  }, []);

  return {
    config,
    /** يُعرض خيار تمارا الآن؟ */
    available: isTamaraAvailableFor(config, amount),
    instalments: config.instalments,
  };
}

export default useTamara;
