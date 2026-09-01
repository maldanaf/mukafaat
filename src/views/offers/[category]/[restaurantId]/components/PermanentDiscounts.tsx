"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { FiLock, FiPercent, FiTag } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { SmartImage, Ratio, FOCUS } from "@ui";
import CurrencyIcon from "@components/CurrencyIcon";

export interface PermanentDiscount {
  id: number | string;
  title: string;
  description?: string | null;
  image?: string | null;
  /** percentage = نسبة مئوية | fixed = مبلغ ثابت */
  value_type?: "percentage" | "fixed";
  value?: number;
  unit?: "%" | "SAR";
  discount_percentage?: number;
  discount_amount?: number | null;
  max_discount_amount?: number | null;
  terms?: string | null;
  requires_subscription: boolean;
  /** مقفل ⇒ الزائر غير مشترك: القيمة تظهر وطريقة الاستفادة لا */
  is_locked: boolean;
}

/** يعرض ١٠ بدل ١٠٫٠٠ ويُبقي ٧٫٥ كما هي */
const fmt = (n: number): string =>
  Number.isInteger(n) ? String(n) : String(Number(n)).replace(/\.?0+$/, "");

/** قيمة الخصم كما تُعرض: النسبة أو المبلغ */
function valueOf(d: PermanentDiscount): { amount: number; isFixed: boolean } {
  if (d.value != null) {
    return { amount: Number(d.value), isFixed: d.unit === "SAR" };
  }
  // توافق مع استجابة أقدم لا تحمل value/unit
  return {
    amount: Number(d.discount_amount ?? d.discount_percentage ?? 0),
    isFixed: d.value_type === "fixed" || d.discount_amount != null,
  };
}

/**
 * الخصومات الدائمة للمتجر — تتصدّر صفحته قبل العروض.
 *
 * كل خصم كرت كامل: صورة واسم ووصف وقيمة، لأنه محتوى قائم بذاته
 * (اتفاقية مع المتجر) لا سطر في قائمة. القيمة قد تكون نسبة مئوية
 * أو مبلغاً ثابتاً حسب الاتفاقية.
 */
const PermanentDiscounts: React.FC<{ discounts: PermanentDiscount[] }> = ({
  discounts,
}) => {
  const { t } = useTranslation();

  if (!discounts?.length) return null;

  const anyLocked = discounts.some((d) => d.is_locked);

  return (
    <section className="mb-7">
      <header className="mb-4 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-mk-md bg-[linear-gradient(135deg,#400198_0%,#6703EB_100%)] text-white shadow-[0_8px_18px_-8px_rgba(64,1,152,0.85)]">
          <FiPercent size={17} aria-hidden />
        </span>
        <div className="min-w-0">
          <h2 className="m-0 text-[17px] font-extrabold text-mk-text-strong">
            {t("permanentDiscounts.title", "الخصومات الدائمة")}
          </h2>
          <p className="m-0 text-[12.5px] text-mk-muted">
            {t(
              "permanentDiscounts.subtitle",
              "خصومات سارية دائماً باتفاقية مع المتجر — بلا تاريخ انتهاء.",
            )}
          </p>
        </div>
        <span className="ms-auto shrink-0 rounded-full bg-mk-tint2 px-3 py-1 text-[12px] font-extrabold text-mk-primary">
          {discounts.length}
        </span>
      </header>

      <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {discounts.map((d) => {
          const { amount, isFixed } = valueOf(d);

          return (
            <li
              key={d.id}
              className="group flex flex-col overflow-hidden rounded-mk-lg border border-mk-border bg-white shadow-mk-card transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-mk-border-strong hover:shadow-[0_18px_38px_-14px_rgba(64,1,152,0.38)]"
            >
              <div className="relative overflow-hidden border-b border-mk-border bg-mk-tint2">
                <Ratio ratio="aspect-[16/10]">
                  {d.image ? (
                    <SmartImage
                      src={d.image}
                      alt={d.title}
                      className="h-full w-full object-cover transition-transform duration-[600ms] group-hover:scale-[1.07]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <FiTag className="text-mk-faint" size={26} aria-hidden />
                    </div>
                  )}
                </Ratio>

                {/* قيمة الخصم — أبرز عنصر على الكرت */}
                <span className="absolute end-3 top-3 z-[2] inline-flex items-center gap-1 rounded-full bg-[linear-gradient(135deg,#400198_0%,#6703EB_100%)] px-3 py-1.5 font-extrabold leading-none text-white shadow-[0_10px_24px_-8px_rgba(64,1,152,0.95)] ring-1 ring-white/25">
                  <span className="text-[17px]" dir="ltr">
                    {fmt(amount)}
                  </span>
                  {isFixed ? (
                    <CurrencyIcon className="text-white" size={13} />
                  ) : (
                    <span className="text-[15px]">%</span>
                  )}
                </span>

                {d.is_locked && (
                  <span className="absolute bottom-3 start-3 z-[2] inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10.5px] font-bold text-mk-muted shadow-sm backdrop-blur-sm">
                    <FiLock size={10} aria-hidden />
                    {t("permanentDiscounts.subscribers_only", "للمشتركين فقط")}
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <h3 className="line-clamp-1 text-[15px] font-extrabold text-mk-text-strong">
                  {d.title}
                </h3>

                {d.description && (
                  <p className="line-clamp-2 text-[12.5px] leading-relaxed text-mk-muted">
                    {d.description}
                  </p>
                )}

                {(d.terms || d.max_discount_amount) && (
                  <div className="mt-auto flex flex-col gap-1 border-t border-mk-border pt-2.5">
                    {d.max_discount_amount ? (
                      <p className="m-0 inline-flex items-center gap-1 text-[11.5px] font-bold text-mk-primary">
                        {t("permanentDiscounts.max_cap", "بحد أقصى")}{" "}
                        <span dir="ltr">{fmt(Number(d.max_discount_amount))}</span>
                        <CurrencyIcon className="text-mk-primary" size={11} />
                      </p>
                    ) : null}
                    {d.terms && (
                      <p className="m-0 line-clamp-2 text-[11.5px] leading-relaxed text-mk-faint">
                        {d.terms}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <footer className="mt-4 flex flex-wrap items-center gap-3 rounded-mk-md border border-mk-border bg-mk-tint3 px-4 py-3">
        <p className="m-0 text-[12.5px] text-mk-muted">
          {anyLocked
            ? t(
                "permanentDiscounts.subscribe_hint",
                "اشترك للاستفادة من هذه الخصومات عند الزيارة.",
              )
            : t(
                "permanentDiscounts.how_to_use",
                "أبرز بطاقة العضوية عند الدفع للاستفادة من الخصم.",
              )}
        </p>
        {anyLocked && (
          <Link
            to="/subscription/plans"
            className={`ms-auto rounded-full bg-[linear-gradient(135deg,#400198_0%,#6703EB_100%)] px-4 py-2 text-[12.5px] font-extrabold text-white transition-transform hover:-translate-y-0.5 ${FOCUS}`}
          >
            {t("permanentDiscounts.subscribe_cta", "اشترك الآن")}
          </Link>
        )}
      </footer>
    </section>
  );
};

export default PermanentDiscounts;
