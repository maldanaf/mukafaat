"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { FiLock, FiPercent, FiTag } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { SmartImage, FOCUS } from "@ui";
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
 * صفٌّ مضغوط لا كرت بصورة كبيرة: الخصم معلومة قصيرة (بند + نسبة)،
 * وصورة بارتفاع ٢٥٠ بكسل لكل بند كانت تمدّ القسم إلى شاشتين لثلاثة
 * خصومات، فتزيح العروض والمنيو خارج الشاشة الأولى بلا فائدة.
 * الصورة بقيت مصغّرة لأنها تعطي البند سياقاً بصرياً سريعاً.
 */
const PermanentDiscounts: React.FC<{ discounts: PermanentDiscount[] }> = ({
  discounts,
}) => {
  const { t } = useTranslation();

  if (!discounts?.length) return null;

  const anyLocked = discounts.some((d) => d.is_locked);

  return (
    <section className="mb-6 overflow-hidden rounded-mk-lg border border-mk-border bg-white shadow-mk-card">
      <header className="flex items-center gap-2.5 border-b border-mk-border px-4 py-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-mk-sm bg-[linear-gradient(135deg,#400198_0%,#6703EB_100%)] text-white">
          <FiPercent size={15} aria-hidden />
        </span>
        <h2 className="m-0 text-[14.5px] font-extrabold text-mk-text-strong">
          {t("permanentDiscounts.title", "الخصومات الدائمة")}
        </h2>
        <span className="rounded-full bg-mk-tint2 px-2 py-0.5 text-[11.5px] font-extrabold text-mk-primary">
          {discounts.length}
        </span>
        <span className="ms-auto hidden text-[11.5px] text-mk-muted sm:inline">
          {t("permanentDiscounts.no_expiry", "سارية دائماً — بلا تاريخ انتهاء")}
        </span>
      </header>

      <ul className="divide-y divide-mk-border">
        {discounts.map((d) => {
          const { amount, isFixed } = valueOf(d);

          return (
            <li
              key={d.id}
              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-mk-tint3"
            >
              {/* مصغّرة تعطي البند سياقاً بصرياً بلا أن تبتلع الصفحة */}
              <span className="h-11 w-11 shrink-0 overflow-hidden rounded-mk-sm bg-mk-tint2">
                {d.image ? (
                  <SmartImage src={d.image} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center">
                    <FiTag className="text-mk-faint" size={16} aria-hidden />
                  </span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="m-0 line-clamp-1 text-[13.5px] font-extrabold text-mk-text-strong">
                  {d.title}
                </p>
                {(d.description || d.terms) && (
                  <p className="m-0 line-clamp-1 text-[11.5px] text-mk-muted">
                    {d.terms || d.description}
                  </p>
                )}
              </div>

              {d.max_discount_amount ? (
                <span className="hidden shrink-0 items-center gap-0.5 text-[11px] font-bold text-mk-muted sm:inline-flex">
                  {t("permanentDiscounts.max_cap", "بحد أقصى")}{" "}
                  <span dir="ltr">{fmt(Number(d.max_discount_amount))}</span>
                  <CurrencyIcon className="text-mk-muted" size={10} />
                </span>
              ) : null}

              {d.is_locked && (
                <FiLock
                  className="hidden shrink-0 text-mk-faint sm:block"
                  size={13}
                  aria-label={t("permanentDiscounts.subscribers_only", "للمشتركين فقط")}
                />
              )}

              {/* القيمة — أبرز ما في الصف */}
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-mk-sm bg-[linear-gradient(135deg,#400198_0%,#6703EB_100%)] px-2.5 py-1.5 font-extrabold leading-none text-white">
                <span className="text-[15px]" dir="ltr">
                  {fmt(amount)}
                </span>
                {isFixed ? (
                  <CurrencyIcon className="text-white" size={12} />
                ) : (
                  <span className="text-[13px]">%</span>
                )}
              </span>
            </li>
          );
        })}
      </ul>

      <footer className="flex flex-wrap items-center gap-2 border-t border-mk-border bg-mk-tint3 px-4 py-2.5">
        <p className="m-0 text-[12px] text-mk-muted">
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
            className={`ms-auto rounded-full bg-[linear-gradient(135deg,#400198_0%,#6703EB_100%)] px-3.5 py-1.5 text-[12px] font-extrabold text-white transition-transform hover:-translate-y-0.5 ${FOCUS}`}
          >
            {t("permanentDiscounts.subscribe_cta", "اشترك الآن")}
          </Link>
        )}
      </footer>
    </section>
  );
};

export default PermanentDiscounts;
