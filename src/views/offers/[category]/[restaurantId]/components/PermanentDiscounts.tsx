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

      {/*
        شبكة لا قائمة: المتجر قد يحمل ثلاثة بنود أو أكثر (أشعة/تحاليل/أسنان).
        عدد الأعمدة يتبع عدد البنود حتى لا يتيتّم بندٌ واحد في شبكة ثلاثية.
      */}
      <ul
        className={`grid grid-cols-1 gap-3 p-4 ${
          discounts.length === 1
            ? ""
            : discounts.length === 2
              ? "sm:grid-cols-2"
              : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {discounts.map((d) => (
          <li
            key={d.id}
            className="group relative flex flex-col gap-2 overflow-hidden rounded-mk-md border border-mk-border bg-mk-tint3 p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9BCEC] hover:shadow-[0_12px_26px_-14px_rgba(64,1,152,0.5)]"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-14 w-16 shrink-0 flex-col items-center justify-center rounded-mk-md bg-[linear-gradient(135deg,#400198_0%,#6703EB_100%)] leading-none text-white shadow-[0_8px_18px_-8px_rgba(64,1,152,0.85)]">
                <span className="text-[20px] font-extrabold" dir="ltr">
                  {fmt(Number(d.discount_percentage))}%
                </span>
              </span>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-[14px] font-extrabold leading-snug text-mk-text-strong">
                  {d.title}
                </p>
                {d.is_locked && (
                  <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10.5px] font-bold text-mk-muted ring-1 ring-mk-border">
                    <FiLock size={10} aria-hidden />
                    {t("permanentDiscounts.subscribers_only", "للمشتركين فقط")}
                  </span>
                )}
              </div>
            </div>

            {d.terms && (
              <p className="line-clamp-2 border-t border-mk-border pt-2 text-[11.5px] leading-relaxed text-mk-muted">
                {d.terms}
              </p>
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
