"use client";

import { useEffect } from "react";
import { setAuthTokenGetter, setOnUnauthorized, api } from "@network/apiClient";
import { useUserStore } from "@stores/userStore";
import { appConfigApi } from "@network/services/mokafaatService";

/**
 * يربط مخزن المستخدم مع عميل API (توكن + تسجيل خروج عند 401).
 * يتحقق من صلاحية التوكن عند فتح الموقع — لو باطل يعمل logout تلقائي.
 */
export default function AuthApiBootstrap() {
  useEffect(() => {
    setAuthTokenGetter(() => useUserStore.getState().token);
    setOnUnauthorized(() => {
      const state = useUserStore.getState();
      if (state.token) {
        state.logout();
      }
    });
  }, []);

  // تحقق من صلاحية التوكن عند فتح الموقع
  useEffect(() => {
    const token = useUserStore.getState().token;
    if (!token) return;

    api.get("/api/profile")
      .then(() => {
        // التوكن صالح - ما نسوي شي
      })
      .catch((err) => {
        if (err?.response?.status === 401) {
          // التوكن باطل → يتم التعامل معه في الـ interceptor تلقائياً
          console.warn("[AuthBootstrap] Token expired or invalid, logging out...");
        }
      });
  }, []);

  useEffect(() => {
    appConfigApi
      .get()
      .then((res) => {
        console.log("[GET /api/app-config] Response:", res.data);
      })
      .catch((err) => {
        console.warn("[GET /api/app-config] Error:", err?.response?.data ?? err.message);
      });
  }, []);

  return null;
}
