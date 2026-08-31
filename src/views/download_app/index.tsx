"use client";

import { AppleStore, GooglePlay } from "@assets";
import { useTranslation } from "react-i18next";
import { useAppConfig } from "@hooks/api/useMokafaatQueries";

type AppConfigResponse = {
  data?: {
    config?: {
      app_links?: { app_store?: string; google_play?: string };
      share?: { ios_link?: string; android_link?: string };
    };
  };
};

/**
 * صفحة تحميل التطبيق.
 *
 * الروابط تأتي من إعدادات لوحة التحكم عبر /api/app-config. كانت الصفحة
 * تقرأ NEXT_PUBLIC_APPLE_STORE_LINK و NEXT_PUBLIC_GOOGLE_PLAY_LINK وهما
 * غير معرَّفين، فكان كلا الزرّين يشير إلى undefined.
 */
const DownloadAppPage = () => {
  const { t } = useTranslation();
  const { data: appConfig } = useAppConfig() as { data?: AppConfigResponse };
  const config = appConfig?.data?.config;

  const appStoreUrl =
    config?.app_links?.app_store || config?.share?.ios_link || "";
  const googlePlayUrl =
    config?.app_links?.google_play || config?.share?.android_link || "";

  /** لا نعرض زراً بلا وجهة — الرابط الفارغ يعيد المستخدم لأعلى الصفحة */
  const stores = [
    { url: googlePlayUrl, img: GooglePlay, label: "Google Play" },
    { url: appStoreUrl, img: AppleStore, label: "App Store" },
  ].filter((s) => s.url);

  return (
    <div className="container mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-6 rounded-mk-2xl border border-mk-border bg-white p-8 text-center shadow-mk-raised sm:p-12">
        <h1 className="text-2xl font-extrabold text-mk-title sm:text-3xl">
          {t("download_app.header", "حمّل تطبيق مكافآت")}
        </h1>

        <p className="text-sm leading-relaxed text-mk-muted sm:text-base">
          {t(
            "download_app.description",
            "احصل على العروض والخصومات والبطاقات الرقمية أينما كنت.",
          )}
        </p>

        {stores.length > 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            {stores.map((s) => (
              <a
                key={s.label}
                href={s.url}
                title={s.label}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-transform duration-200 hover:-translate-y-0.5"
              >
                <img src={s.img} alt={s.label} className="w-40" />
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-mk-muted">
            {t("download_app.soon", "روابط التحميل ستتوفّر قريباً.")}
          </p>
        )}
      </div>
    </div>
  );
};

export default DownloadAppPage;
