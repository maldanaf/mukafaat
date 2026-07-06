"use client";

import { useEffect } from "react";
import { api } from "@network/apiClient";

/**
 * يضبط الدولة الافتراضية للموقع حسب عنوان الـ IP للزائر، عبر نداء
 * `/api/geo/country` في الباك اند (الذي يكتشف الدولة من الـ IP ويرجع
 * السعودية عند الفشل لأي سبب). لا يغيّر اختيار المستخدم إن كان قد اختار
 * دولة مسبقاً (المخزَّنة في localStorage["country_id"]).
 */
export default function GeoCountryBootstrap() {
  useEffect(() => {
    let alreadySelected = false;
    try {
      const existing = localStorage.getItem("country_id");
      alreadySelected = !!(existing && existing.trim() !== "");
    } catch {
      return;
    }

    api
      .get("/api/geo/country")
      .then((res) => {
        const c = (res as any)?.data?.data?.country;
        if (!c) return;
        // كود الدولة (يُستخدم في منتقيات الهاتف/الدولة)
        if (c.code) {
          try {
            localStorage.setItem("geo_country_code", String(c.code));
          } catch {
            /* ignore */
          }
        }
        // الدولة الافتراضية المختارة للموقع — فقط إن لم يختر المستخدم سابقاً
        if (!alreadySelected && c.id != null) {
          try {
            localStorage.setItem("country_id", String(c.id));
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        // تجاهل — الباك اند يفترض السعودية تلقائياً عند غياب country_id.
      });
  }, []);

  return null;
}
