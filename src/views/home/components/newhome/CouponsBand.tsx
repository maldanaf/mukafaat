"use client";

import { useMemo, useState } from "react";
import { LuChevronRight, LuChevronLeft, LuUsers, LuCopy, LuCheck } from "react-icons/lu";
import { t } from "i18next";
import { useCouponCopy } from "@hooks/api/useMokafaatQueries";
import { CONTAINER, pick } from "./tokens";
import { FOCUS } from "@ui";
import SectionHead from "./SectionHead";
import BrandImage from "./BrandImage";
import Reveal from "./Reveal";
import { usedCountText } from "@utils/usedCount";

interface Coupon {
  id: number | string;
  slug?: string;
  title?: string | null;
  description?: string | null;
  terms?: string | null;
  image?: string | null;
  coupon_code?: string | null;
  copies_count?: number | string | null;
  discount_percentage?: number | string | null;
  merchant?: { id: number; name: string; logo?: string | null } | null;
}

interface Props {
  /** عنوان القسم من لوحة التحكم «بناء واجهة الموقع» (فارغ = العنوان الافتراضي) */
  title?: string;
  /** إظهار رابط «عرض الكل» — يتحكم فيه الأدمن */
  showViewAll?: boolean;
  coupons: Coupon[];
}

const PER_SLIDE = 5;
const MAX_COUPONS = 15;

/** كوبونات وأكواد خصم مميزة — كروزيل ٣ شرائح × ٥ كوبونات مع نسخ الكود */
const CouponsBand: React.FC<Props> = ({ coupons, title, showViewAll = true }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [slide, setSlide] = useState(0);
  const couponCopy = useCouponCopy();
  /** تجاوزات محلية لعدّاد النسخ (زيادة تفاؤلية) */
  const [copies, setCopies] = useState<Record<string, number>>({});

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

  const copy = async (coupon: Coupon, code: string) => {
    // زيادة تفاؤلية فورية ثم تسجيل النسخة في الخادم (fire-and-forget)
    const key = String(coupon.id);
    const base = Number(coupon.copies_count ?? 0) || 0;
    setCopies((prev) => ({ ...prev, [key]: (prev[key] ?? base) + 1 }));
    couponCopy.mutate(coupon.id, {
      onSuccess: (serverCount) => {
        if (typeof serverCount === "number")
          setCopies((prev) => ({ ...prev, [key]: serverCount }));
      },
    });

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
    <section className="relative mt-12 overflow-hidden bg-grad-night py-[56px]">
      {/* هالات هوية ناعمة تكسر الخلفية المسطّحة */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 start-[8%] h-[300px] w-[300px] rounded-full bg-[#6703EB]/40 blur-[110px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-28 end-[6%] h-[280px] w-[280px] rounded-full bg-[#FD671A]/20 blur-[110px]"
      />

      <div className={`${CONTAINER} relative`}>
        <SectionHead
          dark
          eyebrow={t("home.coupons_new.eyebrow", "وفّر أكثر")}
          title={title || t("home.coupons_new.title", "كوبونات وأكواد خصم مميزة")}
          subtitle={t(
            "home.coupons_new.subtitle",
            "انسخ الكود واستخدمه عند الدفع لتحصل على الخصم فوراً.",
          )}
          linkLabel={showViewAll ? t("home.coupons_new.all_link", "عرض جميع الكوبونات") : undefined}
          linkTo={showViewAll ? "/coupons" : undefined}
          className="!mb-6"
        />

        <div className="relative">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {slides[current].map((coupon, i) => {
              const color = pick(i + current * PER_SLIDE);
              const code = coupon.coupon_code ?? "";
              const isCopied = copied === code && code.length > 0;
              const copiesCount =
                copies[String(coupon.id)] ??
                (Number(coupon.copies_count ?? 0) || 0);
              const percent = Math.round(Number(coupon.discount_percentage ?? 0));
              return (
                <Reveal key={coupon.id} delay={i * 60} className="h-full">
                  <div className="group mk-lift flex h-full flex-col overflow-hidden rounded-mk-2xl border border-white/10 bg-white shadow-[0_10px_30px_-12px_rgba(9,3,32,0.55)] hover:!shadow-[0_28px_58px_-18px_rgba(9,3,32,0.85)]">
                    <div
                      className="h-[6px] w-full"
                      style={{ backgroundImage: `linear-gradient(90deg, ${color.c}, ${color.c}99)` }}
                    />

                    <div className="mk-zoom relative aspect-[16/9] w-full overflow-hidden bg-[#F2EFFA]">
                      <BrandImage
                        src={coupon.image}
                        name=""
                        variant="name"
                        className="h-full w-full text-[26px]"
                        bg="#F2EFFA"
                      />
                      <span className="pointer-events-none absolute inset-0 flex items-end bg-[linear-gradient(to_top,rgba(27,17,80,0.82),rgba(27,17,80,0.05))] p-3 text-[13.5px] font-bold text-white">
                        <span className="line-clamp-1">
                          {coupon.merchant?.name ?? coupon.title ?? ""}
                        </span>
                      </span>
                      {percent > 0 && (
                        <span
                          dir="ltr"
                          className="mk-shine absolute start-2.5 top-2.5 inline-flex items-baseline gap-0.5 rounded-full bg-grad-accent px-3.5 py-2 text-[15px] font-extrabold leading-none text-white shadow-mk-badge"
                        >
                          {percent}
                          <span className="text-[10px] font-bold">%</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-1 flex-col gap-3 p-4">
                      <p className="m-0 line-clamp-2 min-h-[42px] text-[13px] leading-[1.7] text-[#4A4A63]">
                        {cardText(coupon)}
                      </p>

                      {code && (
                        <div className="mt-auto rounded-mk-md border-[1.5px] border-dashed border-[#C9BCEC] bg-[#FBF9FF] px-3 py-3 text-center font-mono text-[16px] font-extrabold tracking-[0.1em] text-[#2B1B5E]">
                          {code}
                        </div>
                      )}

                      {copiesCount > 0 && (
                        <p className="m-0 flex items-center justify-center gap-1 text-[11.5px] font-medium text-[#9A99B0]">
                          <LuUsers size={13} aria-hidden />
                          {usedCountText(copiesCount)}
                        </p>
                      )}

                      <button
                        onClick={() => code && copy(coupon, code)}
                        disabled={!code}
                        className={`mk-shine inline-flex h-[48px] items-center justify-center gap-2 rounded-mk-md text-[14px] font-extrabold text-white shadow-[0_12px_26px_-12px_rgba(46,16,101,0.85)] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:brightness-110 disabled:opacity-50 ${FOCUS}`}
                        style={
                          isCopied
                            ? { background: "linear-gradient(135deg,#22C55E,#12A06A)", color: "#FFFFFF" }
                            : { backgroundImage: `linear-gradient(135deg, ${color.c}, ${color.c}CC)` }
                        }
                      >
                        {isCopied ? (
                          <>
                            <LuCheck size={16} aria-hidden />
                            {t("home.coupons_new.copied", "تم النسخ")}
                          </>
                        ) : (
                          <>
                            <LuCopy size={15} aria-hidden />
                            {t("home.coupons_new.copy", "نسخ الكود")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>

          {slides.length > 1 && (
            <div className="mt-7 flex items-center justify-center gap-4">
              <button
                onClick={() => setSlide((s) => (s + slides.length - 1) % slides.length)}
                aria-label={t("home.common.prev", "السابق")}
                className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white hover:text-[#2B1B5E] ${FOCUS} focus-visible:ring-offset-[#2B1B5E]`}
              >
                <LuChevronLeft size={20} className="rtl:-scale-x-100" aria-hidden />
              </button>

              <div className="flex items-center gap-2" dir="ltr">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    aria-label={`coupons-slide-${i + 1}`}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current ? "w-7 bg-white" : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() => setSlide((s) => (s + 1) % slides.length)}
                aria-label={t("home.common.next", "التالي")}
                className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white hover:text-[#2B1B5E] ${FOCUS} focus-visible:ring-offset-[#2B1B5E]`}
              >
                <LuChevronRight size={20} className="rtl:-scale-x-100" aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default CouponsBand;
