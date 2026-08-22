"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * المدينة المختارة — يستخدمها منتقي المدينة في الهيدر وشريط البحث في الرئيسية.
 * تُحفظ محلياً فقط؛ لا تغيّر أي طلب موجود إلا عند تمريرها صراحة.
 */
interface CityState {
  cityId: number | null;
  cityName: string | null;
  setCity: (cityId: number | null, cityName: string | null) => void;
  clearCity: () => void;
}

/** نسخة مبسّطة في localStorage يقرأها axios interceptor لحقن city_id */
const mirrorToStorage = (cityId: number | null) => {
  try {
    if (cityId == null) {
      localStorage.removeItem("city_id");
    } else {
      localStorage.setItem("city_id", String(cityId));
    }
  } catch {
    // ignore storage access failures
  }
};

export const useCityStore = create<CityState>()(
  persist(
    (set) => ({
      cityId: null,
      cityName: null,
      setCity: (cityId, cityName) => {
        mirrorToStorage(cityId);
        set({ cityId, cityName });
      },
      clearCity: () => {
        mirrorToStorage(null);
        set({ cityId: null, cityName: null });
      },
    }),
    {
      name: "mukafaat-city",
      onRehydrateStorage: () => (state) => mirrorToStorage(state?.cityId ?? null),
    },
  ),
);
