"use client";

import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { LuMapPin } from "react-icons/lu";
import { t } from "i18next";
import { CONTAINER } from "./tokens";
import SectionHead from "./SectionHead";
import BrandImage from "./BrandImage";

interface Place {
  id: number | string;
  slug?: string;
  name: string;
  type?: string | null;
  logo?: string | null;
  cover_image?: string | null;
  distance_km?: number | null;
  discount?: number | string | null;
  latitude?: number | null;
  longitude?: number | null;
}

interface Props {
  places: Place[];
  /** يطلب إحداثيات المتصفح ثم يعيد تحميل القائمة بالمسافات */
  onUseMyLocation?: (coords: { lat: number; lng: number }) => void;
}

/** الأقرب إليك — خريطة مبسطة + قائمة أماكن قريبة */
const NearbySection: React.FC<Props> = ({ places, onUseMyLocation }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  const [locating, setLocating] = useState(false);

  if (!places?.length) return null;

  const useMyLocation = () => {
    if (!navigator.geolocation || !onUseMyLocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        onUseMyLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => setLocating(false),
      { timeout: 10000 },
    );
  };

  return (
    <section className="mt-11 bg-[#F7F4FD] py-[52px]">
      <div className={CONTAINER}>
        <SectionHead
          eyebrow={t("home.nearby_new.eyebrow", "حول موقعك")}
          title={t("home.nearby_new.title", "الأقرب إليك")}
          linkLabel={t("home.nearby_new.map_link", "عرض على الخريطة")}
          linkTo="/offers?sort=nearest"
        />

        <div className="grid grid-cols-1 gap-4 rounded-[20px] border border-[#EDE9F7] bg-white p-4 lg:grid-cols-2">
          {/* لوحة الخريطة المبسّطة (يمكن استبدالها بخريطة حقيقية لاحقاً) */}
          <div className="relative flex min-h-[280px] items-end justify-center rounded-[14px] border border-dashed border-[#D9CEF0] bg-[repeating-linear-gradient(135deg,#F1EBFB_0_8px,#F8F5FD_8px_20px)] p-4">
            <span className="pointer-events-none absolute inset-0 rounded-[13px] bg-[linear-gradient(#E5DCF5_1px,transparent_1px),linear-gradient(90deg,#E5DCF5_1px,transparent_1px)] bg-[length:44px_44px]" />
            <span className="absolute top-3.5 start-3.5 rounded-lg bg-white/90 px-2.5 py-1.5 text-[11px] font-semibold text-[#6B5E96]">
              {t("home.nearby_new.radius", "الأماكن القريبة منك")}
            </span>

            {places.slice(0, 4).map((place, i) => (
              <button
                key={place.id}
                onClick={() => setSelected(i)}
                aria-label={place.name}
                className="absolute rounded-full ring-[3px] ring-white transition-all"
                style={{
                  width: selected === i ? 22 : 16,
                  height: selected === i ? 22 : 16,
                  background: selected === i ? "#4C1D95" : "#A78BFA",
                  insetInlineStart: `${18 + i * 20}%`,
                  top: `${28 + (i % 2) * 26}%`,
                }}
              />
            ))}

            {onUseMyLocation && (
              <button
                onClick={useMyLocation}
                disabled={locating}
                className="relative z-10 flex h-10 items-center gap-2 rounded-[10px] bg-[#4C1D95] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#2E1065] disabled:opacity-60"
              >
                <LuMapPin size={16} />
                {locating
                  ? t("home.nearby_new.locating", "جارٍ تحديد موقعك...")
                  : t("home.nearby_new.use_location", "استخدم موقعي")}
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2.5">
            {places.slice(0, 4).map((place, i) => (
              <button
                key={place.id}
                onClick={() => {
                  setSelected(i);
                  navigate(`/offers?merchant=${place.id}`);
                }}
                onMouseEnter={() => setSelected(i)}
                className={`flex items-center gap-3 rounded-[14px] border p-3 text-start transition-colors ${
                  selected === i
                    ? "border-[#C9BCEC] bg-[#F6F3FC]"
                    : "border-[#EDE9F7] bg-white hover:border-[#C9BCEC]"
                }`}
              >
                <BrandImage
                  src={place.logo || place.cover_image}
                  name={place.name}
                  className="h-11 w-11 shrink-0 rounded-[12px] text-[16px]"
                />
                <span className="flex flex-1 flex-col gap-0.5">
                  <span className="line-clamp-1 text-[14px] font-semibold text-[#17122A]">
                    {place.name}
                  </span>
                  <span className="text-[12px] text-[#8B84A0]">{place.type ?? ""}</span>
                </span>
                {place.distance_km != null && (
                  <span className="shrink-0 text-[12px] text-[#8B84A0]" dir="ltr">
                    {place.distance_km} {t("home.nearby_new.km", "كم")}
                  </span>
                )}
                {place.discount != null && Number(place.discount) > 0 && (
                  <span className="flex shrink-0 flex-col items-end gap-0.5">
                    <span className="text-[11px] text-[#8B84A0]">
                      {t("home.nearby_new.up_to", "خصم حتى")}
                    </span>
                    <span className="text-[17px] font-bold text-[#E2680F]">
                      {Math.round(Number(place.discount))}%
                    </span>
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NearbySection;
