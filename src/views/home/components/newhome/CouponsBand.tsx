"use client";

import { useMemo, useState } from "react";
import { LuChevronRight, LuChevronLeft } from "react-icons/lu";
import { t } from "i18next";
import { CONTAINER, pick } from "./tokens";
import SectionHead from "./SectionHead";
import BrandImage from "./BrandImage";

interface Coupon {
  id: number | string;
  slug?: string;
  title?: string | null;
  description?: string | null;
  terms?: string | null;
  image?: string | null;
  coupon_code?: string | null;
  discount_percentage?: number | string | null;
  merchant?: { id: number; name: string; logo?: string | null } | null;
}

interface Props {
  coupons: Coupon[];
}

const PER_SLIDE = 5;
const MAX_COUPONS = 15;

/** كوبونات وأكواد خصم مميزة — كروزيل ٣ شرائح × ٥ كوبونات مع نسخ الكود */
const CouponsBand: React.FC<Props> = ({ coupons }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);

  const slides = useMemo(() => {
    const items = (coupons ?? []).slice(0, MAX_COUPONS);
    const chunks: Coupon[][] = [];
    for (let i = 0; i < items.length; i += PER_SLIDE) {
      chunks.push(items.slice(i, i + PER_SLIDE));
    }
    return chunks;
  }, [coupons]);

  if (!slides.length) return null;

  const current = Math.min(slide, slides.length - 1);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* المتصفحات القديمة: نكتفي بالتأكيد البصري */
    }
    setCopied(code);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 2000);
  };

  /** نص البطاقة: الوصف ثم الشروط ثم الاسم ثم جملة افتراضية بالكود */
  const cardText = (coupon: Coupon) => {
    const text = coupon.description || coupon.terms || coupon.title;
    if (text) return text;
    const pct = Number(coupon.discount_percentage ?? 0);
    if (pct > 0 && coupon.coupon_code) {
      return `${t("home.coupons_new.discount", "خصم")} ${Math.round(pct)}% ${t("home.coupons_new.with_code", "مع الكود")} ${coupon.coupon_code}`;
    }
    return t("home.coupons_new.use_code", "استخدم الكود عند الدفع للحصول على الخصم");
  };

  return (
    <section className="mt-11 bg-[linear-gradient(160deg,#2E1065,#43167F)] py-[52px]">
      <div className={CONTAINER}>
        <SectionHead
          dark
          title={t("home.coupons_new.title", "كوبونات وأكواد خصم مميزة")}
          linkLabel={t("home.coupons_new.all_link", "عرض جميع الكوبونات")}
          linkTo="/coupons"
        />

        <div className="relative">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {slides[current].map((coupon, i) => {
              const color = pick(i + current * PER_SLIDE);
              const code = coupon.coupon_code ?? "";
              const isCopied = copied === code && code.length > 0;
              return (
                <div
                  key={coupon.id}
                  className="flex flex-col overflow-hidden rounded-[18px] border border-[#EDE9F7] bg-white"
                >
                  <div className="h-[5px] w-full" style={{ background: color.c }} />
                  <div className="relative aspect-[16/8] w-full overflow-hidden bg-[#F6F3FC]">
                    <BrandImage
                      src={coupon.image}
                      name=""
                      variant="name"
                      className="h-full w-full text-[26px]"
                      bg="#F6F3FC"
                    />
                    <span className="absolute inset-0 flex items-end bg-[linear-gradient(to_top,rgba(46,16,101,0.72),rgba(46,16,101,0.15))] p-2.5 text-[13px] font-bold text-white">
                      {coupon.merchant?.name ?? coupon.title ?? ""}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-3 p-3.5">
                    <p className="m-0 line-clamp-2 min-h-[42px] text-[13px] leading-[1.6] text-[#4A4459]">
                      {cardText(coupon)}
                    </p>
                    {code && (
                      <div className="mt-auto rounded-[10px] border border-dashed border-[#C9BCEC] bg-[#FBF9FF] px-3 py-2.5 text-center font-mono text-[14px] font-semibold tracking-[0.06em] text-[#2E1065]">
                        {code}
                      </div>
                    )}
                    <button
                      onClick={() => code && copy(code)}
                      disabled={!code}
                      className="h-[42px] rounded-[11px] text-[13px] font-semibold text-white transition-colors disabled:opacity-50"
                      style={isCopied ? { background: color.bg, color: color.c } : { background: color.c }}
                    >
                      {isCopied
                        ? `${t("home.coupons_new.copied", "تم النسخ")} ✓`
                        : t("home.coupons_new.copy", "نسخ الكود")}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {slides.length > 1 && (
            <div className="mt-7 flex items-center justify-center gap-4">
              <button
                onClick={() => setSlide((s) => (s + slides.length - 1) % slides.length)}
                aria-label="prev-coupons"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white hover:text-[#2E1065]"
              >
                <LuChevronRight size={20} />
              </button>

              <div className="flex items-center gap-2" dir="ltr">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    aria-label={`coupons-slide-${i + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      i === current ? "w-7 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setSlide((s) => (s + 1) % slides.length)}
                aria-label="next-coupons"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition-colors hover:bg-white hover:text-[#2E1065]"
              >
                <LuChevronLeft size={20} />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CouponsBand;
