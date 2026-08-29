"use client";

import { useEffect } from "react";
import { api } from "@network/apiClient";
import { API_ENDPOINTS } from "@network/apiEndpoints";
import {
  parseGeoCountries,
  getStoredCountryId,
  reconcileStoredCountry,
} from "@utils/geo";

/**
 * ضبط الدولة الافتراضية للموقع:
 *  1) `/api/geo/countries` — يوحّد التخزين مع الدول المفعّلة فعلاً:
 *     عند «دولة واحدة» تُثبَّت تلقائياً، وإن كانت الدولة المخزّنة قد عُطّلت
 *     في اللوحة تُحذف من localStorage حتى لا يبقى الزائر عالقاً عليها.
 *  2) `/api/geo/country` — الدولة المقترحة حسب الـ IP لأول زيارة فقط
 *     (لا تُغيَّر إن كان الزائر قد اختار دولة).
 */
export default function GeoCountryBootstrap() {
  useEffect(() => {
    let cancelled = false;

    const resolveDefaultCountry = () => {
      let alreadySelected = false;
      try {
        const existing = localStorage.getItem("country_id");
        alreadySelected = !!(existing && existing.trim() !== "");
      } catch {
        return;
      }

      api
        .get(API_ENDPOINTS.geo.country)
        .then((res) => {
          if (cancelled) return;
          const payload = res?.data as
            | { data?: { country?: { id?: number; code?: string } } }
            | undefined;
          const c = payload?.data?.country;
          if (!c) return;

          if (c.code) {
            try {
              localStorage.setItem("geo_country_code", String(c.code));
            } catch {
              /* ignore */
            }
          }
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
    };

    api
      .get(API_ENDPOINTS.geo.countries)
      .then((res) => {
        if (cancelled) return;
        const geo = parseGeoCountries(res?.data);
        const before = getStoredCountryId();
        const changed = reconcileStoredCountry(geo);

        // تغيّرت الدولة المخزّنة عن اختيار سابق ⇒ نعيد التحميل لتحديث البيانات
        if (changed && before != null) {
          window.location.reload();
          return;
        }
        if (!changed) resolveDefaultCountry();
      })
      .catch(() => {
        if (!cancelled) resolveDefaultCountry();
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
