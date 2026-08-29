"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "@/lib/router-compat";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { useUserStore } from "@stores/userStore";
import { storeReferralCode } from "@components/ReferralBootstrap";
import { Button } from "@ui";
import { IoGiftOutline } from "react-icons/io5";

/**
 * صفحة هبوط رابط الإحالة `/ref/{code}` (نفس صيغة `referral_base_url` في اللوحة):
 * تحفظ الكود فوراً ثم توجّه الزائر للتسجيل (أو للرئيسية إن كان مسجّلاً بالفعل،
 * حيث يتولّى `ReferralBootstrap` ربط الكود بحسابه).
 */
const ReferralLandingPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const token = useUserStore((s) => s.token);
  const [saved, setSaved] = useState<string>("");

  const target = token ? "/" : "/register";

  useEffect(() => {
    if (!code) return;
    const clean = String(code).trim().toUpperCase();
    storeReferralCode(clean);
    setSaved(clean);
    const id = window.setTimeout(() => router.replace(target), 1600);
    return () => window.clearTimeout(id);
  }, [code, target, router]);

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-mk-bg px-5"
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="w-full max-w-sm rounded-mk-xl border border-mk-border bg-white px-6 py-9 text-center shadow-mk-card">
        <span
          aria-hidden
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mk-tint text-[28px] text-mk-primary"
        >
          <IoGiftOutline />
        </span>
        <h1 className="text-lg font-bold text-mk-text">
          {t("referralLanding.title")}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-mk-muted">
          {t("referralLanding.subtitle")}
        </p>
        {saved && (
          <p
            className="mx-auto mt-4 inline-block rounded-mk-md border border-dashed border-mk-border-2 px-4 py-2 font-mono text-base font-bold text-mk-primary"
            dir="ltr"
          >
            {saved}
          </p>
        )}
        <Button to={target} variant="accent" block className="mt-6">
          {token
            ? t("referralLanding.cta_home")
            : t("referralLanding.cta_register")}
        </Button>
        <p className="mt-3 text-[11.5px] text-mk-faint">
          {t("referralLanding.redirecting")}
        </p>
      </div>
    </div>
  );
};

export default ReferralLandingPage;
