"use client";

import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LuQrCode,
  LuMapPin,
  LuTicketPercent,
  LuStore,
  LuNavigation,
  LuBadgeCheck,
} from "react-icons/lu";
import { AppleStore, GooglePlay, Logo } from "@assets";
import { ChangePageTitle } from "@components";
import { api } from "@network/apiClient";
import { FOCUS } from "@ui";
import { DiscountBadge, Ribbon } from "@views/offers/components/CatalogKit";

/**
 * صفحة هبوط الـQR الدعائي الموحّد `/qr`.
 *
 * الـQR المطبوع على بنرات المتاجر يشير إلى هذا العنوان. إن كان التطبيق
 * مثبّتاً تتلقّفه ملفّات الربط (‎.well-known‎) ويُفتح مباشرة؛ وإن فُتح في
 * المتصفح (كمبيوتر أو جوال بلا تطبيق) تظهر هذه الصفحة التسويقية: هوية
 * مكافآت، خطوات ١-٢-٣، زرّا المتجرين، وزر يقرأ موقع المتصفح ويعرض العروض
 * القريبة داخل نفس النطاق المضبوط في اللوحة.
 */

/** مسار الـAPI العام — يقبل التوكن اختيارياً */
const QR_NEARBY_ENDPOINT = "/api/qr/nearby";

type QrOffer = {
  id: number;
  name: string | null;
  description: string | null;
  image: string | null;
  price_before: number | string | null;
  price_after: number | string | null;
  discount_percent: number | string | null;
  end_date: string | null;
};

type QrMerchant = {
  id: number;
  name: string | null;
  logo: string | null;
  distance_meters: number;
  is_verified: boolean;
  is_open_now: boolean;
  offers_count: number;
  offers: QrOffer[];
};

type QrLanding = {
  enabled: boolean;
  title: string | null;
  subtitle: string | null;
  radius_meters: number;
  app_store_url: string | null;
  google_play_url: string | null;
  logo: string | null;
};

type QrNearbyData = {
  feature_enabled: boolean;
  found: boolean;
  radius_meters: number;
  total_merchants: number;
  total_offers: number;
  merchants: QrMerchant[];
  nearest_outside: {
    id: number;
    name: string | null;
    logo: string | null;
    distance_meters: number;
  } | null;
  landing: QrLanding;
};

const QrLandingPage: React.FC = () => {
  const { t } = useTranslation();
  const [data, setData] = useState<QrNearbyData | null>(null);
  const [landing, setLanding] = useState<QrLanding | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** المسافة بصيغة مقروءة: أمتار حتى الكيلومتر ثم كم بخانة عشرية */
  const formatDistance = useCallback(
    (meters: number): string =>
      meters < 1000
        ? `${meters} ${t("qrLanding.unit_m", "م")}`
        : `${(meters / 1000).toFixed(1)} ${t("qrLanding.unit_km", "كم")}`,
    [t],
  );

  const title = landing?.title || t("qrLanding.title", "عروض من حولك الآن");
  const subtitle =
    landing?.subtitle ||
    t(
      "qrLanding.subtitle",
      "فعّل موقعك لتظهر لك عروض المتاجر القريبة منك خلال ثوانٍ.",
    );

  const appStoreUrl =
    landing?.app_store_url ||
    process.env.NEXT_PUBLIC_APPLE_STORE_LINK ||
    undefined;
  const googlePlayUrl =
    landing?.google_play_url ||
    process.env.NEXT_PUBLIC_GOOGLE_PLAY_LINK ||
    undefined;

  const fetchNearby = useCallback(
    (latitude: number, longitude: number) => {
      api
        .get(QR_NEARBY_ENDPOINT, { params: { latitude, longitude } })
        .then((res) => {
          const payload = res?.data?.data as QrNearbyData | undefined;
          if (!payload) {
            setError(
              t("qrLanding.error_fetch", "تعذّر جلب العروض القريبة، حاول مرة أخرى."),
            );
            return;
          }
          setData(payload);
          if (payload.landing) setLanding(payload.landing);
        })
        .catch(() =>
          setError(t("qrLanding.error_network", "تعذّر الاتصال بالخدمة، حاول مرة أخرى.")),
        )
        .finally(() => setLoading(false));
    },
    [t],
  );

  /** يطلب إذن الموقع من المتصفح ثم يستدعي نفس مسار qr/nearby */
  const handleShowNearby = useCallback(() => {
    setError(null);
    setData(null);

    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError(t("qrLanding.error_unsupported", "متصفحك لا يدعم تحديد الموقع."));
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchNearby(pos.coords.latitude, pos.coords.longitude),
      (geoErr) => {
        setLoading(false);
        setError(
          geoErr.code === geoErr.PERMISSION_DENIED
            ? t(
                "qrLanding.error_denied",
                "لم يُسمح بالوصول إلى موقعك. اسمح بالموقع من إعدادات المتصفح ثم أعد المحاولة.",
              )
            : t("qrLanding.error_locate", "تعذّر تحديد موقعك، حاول مرة أخرى."),
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, [fetchNearby, t]);

  const radiusLabel = useMemo(
    () => formatDistance(data?.radius_meters ?? landing?.radius_meters ?? 120),
    [data?.radius_meters, landing?.radius_meters, formatDistance],
  );

  /** خطوات ١-٢-٣ — نصوص فقط، بلا أي منطق إضافي */
  const steps = [
    {
      icon: <LuQrCode size={22} aria-hidden />,
      title: t("qrLanding.step1_title", "امسح الكود"),
      body: t("qrLanding.step1_body", "امسح كود مكافآت المعروض في المتجر أو افتح الرابط."),
    },
    {
      icon: <LuMapPin size={22} aria-hidden />,
      title: t("qrLanding.step2_title", "فعّل موقعك"),
      body: t("qrLanding.step2_body", "اسمح للمتصفح بمعرفة موقعك لنبحث في محيطك مباشرة."),
    },
    {
      icon: <LuTicketPercent size={22} aria-hidden />,
      title: t("qrLanding.step3_title", "استمتع بالخصم"),
      body: t("qrLanding.step3_body", "تصفّح عروض المتاجر القريبة واحصل على خصمك فوراً."),
    },
  ];

  return (
    <div className="min-h-screen bg-mk-bg pb-16">
      <ChangePageTitle
        pageTitle={t("ui.t_f1bada", "عروض قريبة منك | مكافآت")}
        path="/qr"
        description={t("ui.t_4d1d3a", "امسح كود مكافآت لتظهر لك عروض المتاجر القريبة من مكانك.")}
      />

      {/* ===== البانر التسويقي ===== */}
      <section className="relative overflow-hidden bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)]">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-32 end-[-90px] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(253,103,26,0.55),transparent_65%)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-40 start-[-70px] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(214,203,255,0.35),transparent_65%)]"
        />

        <div className="relative mx-auto w-full max-w-3xl px-4 py-12 text-center sm:py-16">
          <div className="mb-7 flex justify-center">
            <span className="inline-flex items-center justify-center rounded-mk-xl bg-white px-6 py-4 shadow-[0_16px_34px_-14px_rgba(0,0,0,0.5)] ring-1 ring-white/40">
              <img src={Logo} alt="مكافآت" className="h-10 w-auto object-contain sm:h-12" />
            </span>
          </div>

          <div className="mb-4 flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[12.5px] font-extrabold text-white ring-1 ring-white/20">
              <LuNavigation size={14} aria-hidden />
              {t("qrLanding.eyebrow", "عروض حصرية بجوارك")}
            </span>
          </div>

          <h1 className="m-0 text-[28px] font-extrabold leading-tight text-white sm:text-[40px]">
            {title}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-[14px] leading-relaxed text-white/80 sm:text-[16px]">
            {subtitle}
          </p>

          {/* الزر الرئيسي — يقرأ الموقع ويعرض النتائج في المتصفح */}
          <button
            type="button"
            onClick={handleShowNearby}
            disabled={loading}
            className={`mt-8 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(135deg,#FD671A,#E2560D)] px-8 text-[15px] font-extrabold text-white shadow-[0_16px_36px_-12px_rgba(226,86,13,0.95)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto ${FOCUS}`}
          >
            <LuMapPin size={18} aria-hidden />
            {loading
              ? t("qrLanding.cta_loading", "جارٍ تحديد موقعك…")
              : t("qrLanding.cta", "اعرض العروض القريبة الآن")}
          </button>

          <p className="mt-3 text-[12.5px] text-white/65">
            {t("qrLanding.radius_note", "نبحث داخل نطاق")} {radiusLabel}{" "}
            {t("qrLanding.radius_note_suffix", "من مكانك.")}
          </p>

          {error ? (
            <p
              role="alert"
              className="mx-auto mt-5 max-w-md rounded-mk-md bg-white/95 px-4 py-3 text-[13px] font-semibold text-mk-red"
            >
              {error}
            </p>
          ) : null}

          {/* أزرار المتجرين */}
          {(appStoreUrl || googlePlayUrl) && (
            <div className="mt-8">
              <p className="m-0 mb-3 text-[12.5px] font-bold text-white/70">
                {t("qrLanding.download_hint", "أو حمّل التطبيق لتجربة أسرع")}
              </p>
              <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
                {appStoreUrl ? (
                  <a
                    href={appStoreUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="App Store"
                    className={`rounded-mk-md transition-transform hover:-translate-y-0.5 ${FOCUS}`}
                  >
                    <img src={AppleStore} alt="App Store" className="h-12 w-auto" />
                  </a>
                ) : null}
                {googlePlayUrl ? (
                  <a
                    href={googlePlayUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Google Play"
                    className={`rounded-mk-md transition-transform hover:-translate-y-0.5 ${FOCUS}`}
                  >
                    <img src={GooglePlay} alt="Google Play" className="h-12 w-auto" />
                  </a>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ===== خطوات ١-٢-٣ ===== */}
      <section className="mx-auto -mt-8 w-full max-w-4xl px-4">
        <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="relative overflow-hidden rounded-mk-xl border border-mk-border bg-white p-5 text-center shadow-mk-card"
            >
              <span
                aria-hidden
                className="absolute -top-3 end-2 text-[56px] font-extrabold leading-none text-mk-tint"
                dir="ltr"
              >
                {i + 1}
              </span>
              <span className="relative mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[linear-gradient(135deg,#400198,#6703EB)] text-white shadow-[0_10px_22px_-10px_rgba(64,1,152,0.9)]">
                {step.icon}
              </span>
              <h2 className="relative m-0 text-[15px] font-extrabold text-mk-text">
                {step.title}
              </h2>
              <p className="relative m-0 mt-1.5 text-[12.5px] leading-relaxed text-mk-muted">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ===== النتائج ===== */}
      {data ? (
        <section className="mx-auto mt-8 w-full max-w-4xl px-4">
          {!data.feature_enabled ? (
            <div className="rounded-mk-xl border border-mk-border bg-white p-6 text-center text-[13.5px] text-mk-muted shadow-mk-card">
              {t("qrLanding.disabled", "الخدمة غير متاحة حالياً.")}
            </div>
          ) : data.found ? (
            <>
              <div className="mb-5 flex flex-wrap items-center gap-3 rounded-mk-lg border border-mk-border bg-white p-4 shadow-mk-card">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FD671A,#E2560D)] text-white">
                  <LuTicketPercent size={20} aria-hidden />
                </span>
                <p className="m-0 text-[14px] font-extrabold text-mk-text">
                  <span dir="ltr" className="text-[22px] text-mk-primary">
                    {data.total_offers}
                  </span>{" "}
                  {t("qrLanding.offers_in", "عرضاً في")}{" "}
                  <span dir="ltr" className="text-[22px] text-mk-primary">
                    {data.total_merchants}
                  </span>{" "}
                  {t("qrLanding.merchants_around", "متجراً حولك")}
                </p>
              </div>

              <div className="flex flex-col gap-4">
                {data.merchants.map((merchant) => (
                  <article
                    key={merchant.id}
                    className="overflow-hidden rounded-mk-xl border border-mk-border bg-white shadow-mk-card"
                  >
                    <div className="flex items-center gap-3 bg-[linear-gradient(135deg,#F7F5FC,#EFEAF8)] p-4">
                      {merchant.logo ? (
                        <img
                          src={merchant.logo}
                          alt=""
                          className="h-14 w-14 shrink-0 rounded-mk-md bg-white object-contain p-1 ring-1 ring-mk-border"
                        />
                      ) : (
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-mk-md bg-white text-mk-primary ring-1 ring-mk-border">
                          <LuStore size={22} aria-hidden />
                        </span>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="m-0 truncate text-[15px] font-extrabold text-mk-text">
                            {merchant.name}
                          </h3>
                          {merchant.is_verified ? (
                            <Ribbon tone="vip" icon={<LuBadgeCheck size={12} aria-hidden />}>
                              {t("qrLanding.verified", "موثّق")}
                            </Ribbon>
                          ) : null}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Ribbon tone="muted" icon={<LuNavigation size={11} aria-hidden />}>
                            {formatDistance(merchant.distance_meters)}
                          </Ribbon>
                          <Ribbon tone={merchant.is_open_now ? "new" : "hot"}>
                            {merchant.is_open_now
                              ? t("qrLanding.open_now", "مفتوح الآن")
                              : t("qrLanding.closed_now", "مغلق الآن")}
                          </Ribbon>
                        </div>
                      </div>
                    </div>

                    {merchant.offers.length ? (
                      <ul className="m-0 list-none divide-y divide-mk-divider p-0">
                        {merchant.offers.map((offer) => (
                          <li key={offer.id} className="flex items-center gap-3 p-3">
                            {offer.image ? (
                              <img
                                src={offer.image}
                                alt=""
                                className="h-14 w-14 shrink-0 rounded-mk-md bg-mk-tint2 object-cover"
                              />
                            ) : (
                              <span className="h-14 w-14 shrink-0 rounded-mk-md bg-mk-tint2" />
                            )}
                            <div className="min-w-0 flex-1">
                              <p className="m-0 truncate text-[13.5px] font-bold text-mk-text">
                                {offer.name}
                              </p>
                              {offer.price_after != null && (
                                <p
                                  dir="ltr"
                                  className="m-0 mt-0.5 flex items-center gap-2 text-[13px] font-extrabold text-mk-text"
                                >
                                  {offer.price_after}
                                  {offer.price_before != null &&
                                    Number(offer.price_before) > Number(offer.price_after) && (
                                      <span className="text-[11.5px] font-semibold text-mk-faint line-through">
                                        {offer.price_before}
                                      </span>
                                    )}
                                </p>
                              )}
                            </div>
                            <DiscountBadge percent={offer.discount_percent} size="md" />
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-mk-xl border border-mk-border bg-white p-8 text-center shadow-mk-card">
              <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mk-tint text-mk-primary">
                <LuStore size={24} aria-hidden />
              </span>
              <p className="m-0 text-[16px] font-extrabold text-mk-text">
                {t("qrLanding.empty_title", "لا توجد عروض في محيطك")}
              </p>
              {data.nearest_outside ? (
                <p className="m-0 mt-2 text-[13.5px] text-mk-muted">
                  {t("qrLanding.nearest_prefix", "أقرب متجر")} «{data.nearest_outside.name}»{" "}
                  {t("qrLanding.nearest_suffix", "يبعد")}{" "}
                  {formatDistance(data.nearest_outside.distance_meters)}.
                </p>
              ) : (
                <p className="m-0 mt-2 text-[13.5px] text-mk-muted">
                  {t(
                    "qrLanding.empty_body",
                    "جرّب لاحقاً أو حمّل التطبيق لتصفّح كل العروض.",
                  )}
                </p>
              )}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
};

export default QrLandingPage;
