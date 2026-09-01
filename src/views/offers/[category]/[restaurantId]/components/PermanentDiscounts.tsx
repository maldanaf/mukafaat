"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { FiLock, FiPercent } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { FOCUS } from "@ui";

export interface PermanentDiscount {
  id: number | string;
  title: string;
  discount_percentage: number;
  terms?: string | null;
  requires_subscription: boolean;
  /** مقفل ⇒ الزائر غير مشترك: النسبة تظهر وطريقة الاستفادة لا */
  is_locked: boolean;
}

/** يعرض ١٠ بدل ١٠٫٠٠ ويُبقي ٧٫٥ كما هي */
const fmt = (n: number): string =>
  Number.isInteger(n) ? String(n) : String(n).replace(/\.?0+$/, "");

/**
 * الخصومات الدائمة للمتجر — تتصدّر صفحته قبل العروض.
 *
 * هذه جوهر الاتفاقية مع المتجر وأهمّ ما يبحث عنه المشترك، بخلاف
 * العروض المؤقّتة. النسبة تظهر لكل الزوّار لتشجيع الاشتراك، أما
 * طريقة الاستفادة فتظهر للمشترك وحده.
 */
const PermanentDiscounts: React.FC<{ discounts: PermanentDiscount[] }> = ({
  discounts,
}) => {
  const { t } = useTranslation();

  if (!discounts?.length) return null;

  const anyLocked = discounts.some((d) => d.is_locked);

  return (
    <section className="mb-6 overflow-hidden rounded-mk-lg border border-mk-border bg-white shadow-mk-card">
      <header className="flex items-center gap-2 border-b border-mk-border bg-[linear-gradient(135deg,#400198_0%,#6703EB_100%)] px-4 py-3 text-white">
        <FiPercent size={17} aria-hidden />
        <h2 className="text-[14.5px] font-extrabold">
          {t("permanentDiscounts.title", "الخصومات الدائمة")}
        </h2>
        <span className="ms-auto rounded-full bg-white/20 px-2.5 py-0.5 text-[11.5px] font-bold">
          {discounts.length}
        </span>
      </header>

      <ul className="divide-y divide-mk-border">
        {discounts.map((d) => (
          <li key={d.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-12 w-14 shrink-0 flex-col items-center justify-center rounded-mk-md bg-mk-tint2 leading-none text-mk-primary">
              <span className="text-[17px] font-extrabold" dir="ltr">
                {fmt(Number(d.discount_percentage))}%
              </span>
            </span>

            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-[14px] font-extrabold text-mk-text-strong">
                {d.title}
              </p>
              {d.terms && (
                <p className="line-clamp-2 text-[12px] text-mk-muted">{d.terms}</p>
              )}
            </div>

            {d.is_locked && (
              <span
                className="flex shrink-0 items-center gap-1 rounded-full bg-mk-tint3 px-2.5 py-1 text-[11px] font-bold text-mk-muted"
                title={t("permanentDiscounts.subscribers_only", "للمشتركين فقط")}
              >
                <FiLock size={12} aria-hidden />
                {t("permanentDiscounts.subscribers_only", "للمشتركين فقط")}
              </span>
            )}
          </li>
        ))}
      </ul>

      {anyLocked ? (
        <footer className="flex flex-wrap items-center gap-3 border-t border-mk-border bg-mk-tint3 px-4 py-3">
          <p className="text-[12.5px] text-mk-muted">
            {t(
              "permanentDiscounts.subscribe_hint",
              "اشترك للاستفادة من هذه الخصومات عند الزيارة.",
            )}
          </p>
          <Link
            to="/subscription/plans"
            className={`ms-auto rounded-full bg-[linear-gradient(135deg,#400198_0%,#6703EB_100%)] px-4 py-2 text-[12.5px] font-extrabold text-white transition-transform hover:-translate-y-0.5 ${FOCUS}`}
          >
            {t("permanentDiscounts.subscribe_cta", "اشترك الآن")}
          </Link>
        </footer>
      ) : (
        <footer className="border-t border-mk-border bg-mk-tint3 px-4 py-3">
          <p className="text-[12.5px] text-mk-muted">
            {t(
              "permanentDiscounts.how_to_use",
              "أبرز بطاقة العضوية عند الدفع للاستفادة من الخصم.",
            )}
          </p>
        </footer>
      )}
    </section>
  );
};

export default PermanentDiscounts;
