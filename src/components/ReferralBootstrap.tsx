"use client";

import { useEffect, useRef } from "react";
import { useUserStore } from "@stores/userStore";
import { referralsApi } from "@network/services/mokafaatService";

export const REFERRAL_CODE_STORAGE_KEY = "mukafaat_referral_code";

/** حفظ كود الدعوة القادم من رابط `/ref/{code}` أو `?ref=` */
export function storeReferralCode(code: string): void {
  const clean = code.trim().toUpperCase();
  if (!clean) return;
  try {
    localStorage.setItem(REFERRAL_CODE_STORAGE_KEY, clean);
  } catch {
    /* ignore storage failures */
  }
}

function readReferralCode(): string | null {
  try {
    const v = localStorage.getItem(REFERRAL_CODE_STORAGE_KEY);
    return v && v.trim() !== "" ? v.trim() : null;
  } catch {
    return null;
  }
}

function clearReferralCode(): void {
  try {
    localStorage.removeItem(REFERRAL_CODE_STORAGE_KEY);
  } catch {
    /* ignore storage failures */
  }
}

/**
 * «شارك واربح» على الموقع: يلتقط كود الدعوة من رابط الإحالة، وبمجرّد
 * تسجيل دخول الزائر يربطه بـ POST /api/referrals/attach مرة واحدة.
 * فشل الربط (كود غير صالح أو مرتبط سابقاً) يُتجاهل بصمت.
 */
export default function ReferralBootstrap() {
  const token = useUserStore((s) => s.token);
  const attachedRef = useRef(false);

  // التقاط `?ref=` من أي صفحة
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) storeReferralCode(ref);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!token || attachedRef.current) return;
    const code = readReferralCode();
    if (!code) return;

    attachedRef.current = true;
    referralsApi
      .attach(code)
      .then(() => clearReferralCode())
      .catch(() => {
        // كود غير صالح أو مستخدم مسبقاً — لا نزعج المستخدم
        clearReferralCode();
      });
  }, [token]);

  return null;
}
