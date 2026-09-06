"use client";

import { useMemo, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { LuMapPin, LuNavigation, LuLockKeyhole, LuStore, LuArrowRight } from "react-icons/lu";
import { t } from "i18next";
import { CONTAINER } from "./tokens";
import { FOCUS } from "@ui";
import SectionHead from "./SectionHead";
import BrandImage from "./BrandImage";
import Reveal from "./Reveal";
import { merchantUrl } from "@utils/merchantUrl";
import ComingSoonModal from "@components/ComingSoonModal";

interface Place {
  id: number | string;
  slug?: string;
  name: string;
  type?: string | null;
  logo?: string | null;
  is_coming_soon?: boolean;
  cover_image?: string | null;
  distance_km?: number | null;
  discount?: number | string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface Props {
  /** عنوان القسم من لوحة التحكم «بناء واجهة الموقع» (فارغ = العنوان الافتراضي) */
  title?: string;
  /** إظهار رابط «عرض الكل» — يتحكم فيه الأدمن */
  showViewAll?: boolean;
  places: Place[];
  /** يطلب إحداثيات المتصفح ثم يعيد تحميل القائمة بالمسافات */
  onUseMyLocation?: (coords: { lat: number; lng: number }) => void;
}

const SHOWN = 5;

/** موضع ثابت لكل علامة على الرادار — مشتق من المعرّف فلا يقفز بين الرسمات */
const seededAngle = (seed: string, i: number) => {
  let hash = 0;
  for (let c = 0; c < seed.length; c += 1) hash = (hash * 31 + seed.charCodeAt(c)) % 360;
  return (hash + i * 67) % 360;
};

/**
 * الأقرب إليك — بطاقة رادار للأماكن حولك + قائمة بأقرب المتاجر ومسافاتها.
 * قبل منح إذن الموقع تُعرض حالة تشجيعية واضحة بدل مساحة فارغة.
 */
const NearbySection: React.FC<Props> = ({ places, onUseMyLocation, title, showViewAll = true }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  // متجر «قريباً» لا تُفتح صفحته — نافذة الترقّب بدلها
  const [pending, setPending] = useState<Place | null>(null);
  const [locating, setLocating] = useState(false);
  const [denied, setDenied] = useState(false);

  const list = useMemo(() => (places ?? []).slice(0, SHOWN), [places]);

  /** هل وصلت مسافات فعلية من الخادم؟ (تصل فقط بعد إرسال الإحداثيات) */
  const hasDistances = useMemo(
    () => list.some((place) => place.distance_km != null),
    [list],
  );

  /** توزيع العلامات على حلقتين حول المستخدم */
  const pins = useMemo(
    () =>
      list.map((place, i) => {
        const angle = (seededAngle(String(place.id), i) * Math.PI) / 180;
        const radius = i % 2 === 0 ? 26 : 37;
        return {
          place,
          x: 50 + Math.cos(angle) * radius,
          y: 50 + Math.sin(angle) * radius * 0.82,
        };
      }),
    [list],
  );

  if (!list.length) return null;

  const useMyLocation = () => {
    if (!navigator.geolocation || !onUseMyLocation) return;
    setLocating(true);
    setDenied(false);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onUseMyLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setLocating(false);
        setDenied(true);
      },
      { timeout: 10000, maximumAge: 300000 },
    );
  };

  const locationButton = (
    <button
      type="button"
      onClick={useMyLocation}
      disabled={locating}
      className={`inline-flex h-[50px] items-center gap-2 mk-shine rounded-mk-lg bg-grad-accent px-6 text-[14.5px] font-extrabold text-white shadow-mk-glow-accent transition-all duration-200 ease-out hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70 ${FOCUS} focus-visible:ring-white focus-visible:ring-offset-[#2B1B5E]`}
    >
      <LuNavigation size={17} aria-hidden className={locating ? "animate-pulse" : ""} />
      {locating
        ? t("home.nearby_new.locating", "جارٍ تحديد موقعك...")
        : t("home.nearby_new.use_location", "استخدم موقعي")}
    </button>
  );

  return (
    <section className="mt-12 bg-[#F7F5FC] py-[54px]">
      <div className={CONTAINER}>
        <SectionHead
          eyebrow={t("home.nearby_new.eyebrow", "حول موقعك")}
          title={title || t("home.nearby_new.title", "الأقرب إليك")}
          subtitle={t(
            "home.nearby_new.subtitle",
            "اعرف أقرب المتاجر والمطاعم التي تقدّم خصومات في محيطك الآن.",
          )}
          linkLabel={showViewAll ? t("home.nearby_new.map_link", "عرض على الخريطة") : undefined}
          linkTo={showViewAll ? "/offers?sort=nearest" : undefined}
          className="!mb-6"
        />

        <Reveal>
          <div className="grid grid-cols-1 gap-5 rounded-mk-3xl border border-[#EFEDF7] bg-white p-5 shadow-mk-raised lg:grid-cols-[1.05fr_1fr]">
            {/* بطاقة الرادار — علامات الأماكن حول المستخدم */}
            <div className="relative min-h-[340px] overflow-hidden rounded-mk-2xl bg-grad-night">
              <span
                aria-hidden
                className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.055)_1px,transparent_1px)] bg-[length:38px_38px]"
              />

              {/* حلقات المسافة */}
              {[0.42, 0.66, 0.92].map((scale) => (
                <span
                  key={scale}
                  aria-hidden
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/12"
                  style={{ width: `${scale * 100}%`, aspectRatio: "1 / 0.82" }}
                />
              ))}

              {/* موقع المستخدم في المركز */}
              <span
                aria-hidden
                className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FD671A] ring-4 ring-[#FD671A]/25"
              />
              <span
                aria-hidden
                className="mk-ping absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#FD671A]/60"
              />

              {/* علامات الأماكن */}
              {pins.map(({ place, x, y }, i) => {
                const isActive = selected === i;
                return (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => setSelected(i)}
                    onMouseEnter={() => setSelected(i)}
                    aria-label={place.name}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-300 ${FOCUS} focus-visible:ring-white focus-visible:ring-offset-[#2B1B5E]`}
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <span
                      className={`flex items-center justify-center rounded-full ring-2 ring-white/85 transition-all duration-300 ${
                        isActive
                          ? "h-9 w-9 bg-white text-[#400198] shadow-[0_10px_24px_-6px_rgba(0,0,0,0.6)]"
                          : "h-6 w-6 bg-[#7C4DE0] text-white hover:bg-[#A78BFA]"
                      }`}
                    >
                      <LuStore size={isActive ? 17 : 12} aria-hidden />
                    </span>
                  </button>
                );
              })}

              {/* بطاقة العنصر المحدّد */}
              {hasDistances && list[selected] && (
                <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-mk-lg bg-white/95 p-3 shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] backdrop-blur-sm">
                  <BrandImage
                    src={list[selected].logo || list[selected].cover_image}
                    name={list[selected].name}
                    className="h-10 w-10 shrink-0 rounded-[12px] text-[15px]"
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="line-clamp-1 text-[13.5px] font-bold text-[#1A1A2E]">
                      {list[selected].name}
                    </span>
                    <span className="line-clamp-1 text-[11.5px] text-[#6B6B85]">
                      {list[selected].type ?? ""}
                    </span>
                  </span>
                  {list[selected].distance_km != null && (
                    <span
                      className="shrink-0 rounded-full bg-[#F2EFFA] px-2.5 py-1 text-[11.5px] font-bold text-[#400198]"
                      dir="ltr"
                    >
                      {list[selected].distance_km} {t("home.nearby_new.km", "كم")}
                    </span>
                  )}
                </div>
              )}

              {/* حالة تشجيعية قبل منح إذن الموقع */}
              {!hasDistances && onUseMyLocation && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[linear-gradient(180deg,rgba(27,17,80,0.45),rgba(27,17,80,0.86))] px-6 text-center backdrop-blur-[2px]">
                  <span className="flex h-14 w-14 items-center justify-center rounded-mk-2xl border border-white/20 bg-white/12 text-white">
                    <LuMapPin size={26} aria-hidden />
                  </span>
                  <h3 className="m-0 text-[18px] font-bold text-white">
                    {t("home.nearby_new.enable_title", "فعّل موقعك لترى الأقرب إليك")}
                  </h3>
                  <p className="m-0 max-w-[38ch] text-[13px] leading-[1.8] text-[#D6CBFF]">
                    {t(
                      "home.nearby_new.enable_body",
                      "نستخدم موقعك مرة واحدة لترتيب المتاجر حسب المسافة — بلا حفظ ولا مشاركة.",
                    )}
                  </p>
                  {locationButton}
                  <p className="m-0 inline-flex items-center gap-1.5 text-[11.5px] text-[#B9A9E8]">
                    <LuLockKeyhole size={12} aria-hidden />
                    {denied
                      ? t(
                          "home.nearby_new.denied",
                          "تم رفض إذن الموقع — فعّله من إعدادات المتصفح ثم أعد المحاولة.",
                        )
                      : t("home.nearby_new.privacy", "لا نحتفظ بموقعك في أي وقت.")}
                  </p>
                </div>
              )}
            </div>

            {/* قائمة أقرب المتاجر */}
            <div className="flex flex-col gap-2.5">
              {list.map((place, i) => (
                <button
                  key={place.id}
                  onClick={() => {
                    setSelected(i);
                    // متجر «قريباً» لا تُفتح صفحته
                    if (place.is_coming_soon) {
                      setPending(place);
                      return;
                    }
                    navigate(merchantUrl(place));
                  }}
                  onMouseEnter={() => setSelected(i)}
                  className={`group flex items-center gap-3 rounded-mk-lg border p-3.5 text-start transition-all duration-300 ${FOCUS} ${
                    selected === i
                      ? "border-[#C9BCEC] bg-[#F7F5FC] shadow-[0_10px_26px_-14px_rgba(46,16,101,0.5)]"
                      : "border-[#EFEDF7] bg-white hover:border-[#C9BCEC] hover:bg-[#FBF9FF]"
                  }`}
                >
                  <span className="relative shrink-0">
                    <BrandImage
                      src={place.logo || place.cover_image}
                      name={place.name}
                      className="h-12 w-12 rounded-[14px] text-[16px]"
                    />
                    <span className="absolute -bottom-1 -end-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#400198] shadow-[0_2px_8px_rgba(46,16,101,0.25)]">
                      <LuMapPin size={11} aria-hidden />
                    </span>
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="line-clamp-1 text-[14.5px] font-extrabold text-[#1A1A2E] transition-colors duration-200 group-hover:text-[#400198]">
                      {place.name}
                    </span>
                    <span className="line-clamp-1 text-[12px] text-[#9A99B0]">
                      {place.type ?? ""}
                    </span>
                  </span>

                  {place.distance_km != null && (
                    <span
                      className="shrink-0 rounded-full bg-[#F2EFFA] px-2.5 py-1 text-[11.5px] font-bold text-[#400198]"
                      dir="ltr"
                    >
                      {place.distance_km} {t("home.nearby_new.km", "كم")}
                    </span>
                  )}

                  {place.discount != null && Number(place.discount) > 0 && (
                    <span className="flex shrink-0 flex-col items-center gap-0.5 rounded-mk-md bg-grad-accent px-2.5 py-1.5 text-white shadow-mk-badge">
                      <span className="text-[9.5px] font-bold uppercase leading-none tracking-[0.04em] text-white/85">
                        {t("home.nearby_new.up_to", "خصم حتى")}
                      </span>
                      <span dir="ltr" className="text-[17px] font-extrabold leading-none">
                        {Math.round(Number(place.discount))}%
                      </span>
                    </span>
                  )}

                  <LuArrowRight
                    size={16}
                    aria-hidden
                    className="shrink-0 text-[#C9BCEC] transition-all duration-300 group-hover:text-[#400198] rtl:-scale-x-100"
                  />
                </button>
              ))}

              {/* دعوة لتفعيل الموقع تحت القائمة أيضاً */}
              {!hasDistances && onUseMyLocation && (
                <div className="mt-1 flex flex-wrap items-center justify-between gap-3 rounded-mk-lg border border-dashed border-[#DED7F2] bg-[#FBF9FF] p-4">
                  <span className="text-[13px] font-semibold leading-[1.7] text-[#4A4A63]">
                    {t("home.nearby_new.sort_hint", "فعّل موقعك ليُرتَّب المتاجر حسب الأقرب إليك.")}
                  </span>
                  <button
                    type="button"
                    onClick={useMyLocation}
                    disabled={locating}
                    className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-mk-md bg-grad-brand px-4 text-[13px] font-extrabold text-white shadow-mk-glow transition-all duration-200 ease-out hover:-translate-y-0.5 disabled:translate-y-0 disabled:opacity-70 ${FOCUS}`}
                  >
                    <LuNavigation size={15} aria-hidden />
                    {locating
                      ? t("home.nearby_new.locating", "جارٍ تحديد موقعك...")
                      : t("home.nearby_new.use_location", "استخدم موقعي")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      </div>

      <ComingSoonModal
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        merchant={pending}
      />
    </section>
  );
};

export default NearbySection;
