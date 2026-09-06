"use client";

import { t } from "i18next";
import { Link } from "@/lib/router-compat";
import { useState } from "react";
import { CONTAINER, SectionHeader, SmartImage, FOCUS } from "@ui";
import ComingSoonModal from "@components/ComingSoonModal";
import { API_BASE_URL } from "@config/api";
import MerchantCard, {
  type MerchantSummary,
} from "@views/offers/components/MerchantCard";
import { merchantUrl } from "@utils/merchantUrl";
import type { LayoutMerchant, LayoutSection, MerchantDisplayStyle } from "./types";

interface Props {
  section: LayoutSection;
}

/** أعمدة الشبكة لكل شكل عرض */
const GRID_CLASS: Record<string, string> = {
  grid_4: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4",
  grid_3: "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
};

const absolute = (path?: string | null): string | undefined => {
  if (!path) return undefined;
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}/${path.replace(/^\/+/, "")}`;
};

/**
 * بلوك متاجر يضيفه الأدمن من «بناء واجهة الموقع».
 *
 * يعرض متاجر تصنيف واحد أو أكثر بالشكل والترتيب اللذين اختارهما.
 * العناصر تصل جاهزة داخل `layout` فلا حاجة لطلب إضافي، ونستخدم كرت
 * المتجر نفسه المستعمل في صفحة المتاجر حتى لا يختلف الشكل بين الصفحتين.
 */

/**
 * متجر «قريباً» لا تُفتح صفحته — لا عروض ولا خصومات بعد، وصفحة فارغة
 * توحي بعطل لا بترقّب. فيبقى الكرت ظاهراً بلا رابط.
 */
function MerchantShell({
  merchant,
  className,
  children,
  onComingSoon,
}: {
  merchant: { is_coming_soon?: boolean };
  className: string;
  children: React.ReactNode;
  onComingSoon: () => void;
}) {
  if (merchant.is_coming_soon) {
    // لا رابط، لكن الضغط يشرح السبب بدل ألا يفعل شيئاً
    return (
      <button type="button" onClick={onComingSoon} className={`${className} w-full text-start`}>
        {children}
      </button>
    );
  }

  return (
    <Link to={merchantUrl(merchant as never)} className={className}>
      {children}
    </Link>
  );
}

const CategoryMerchantsSection: React.FC<Props> = ({ section }) => {
  const merchants = (section.items ?? []) as LayoutMerchant[];

  // متجر «قريباً» لا تُفتح صفحته — نافذة الترقّب بدلها
  const [pending, setPending] = useState<LayoutMerchant | null>(null);

  if (!merchants.length) return null;

  const style = (section.display_style as MerchantDisplayStyle) || "grid_4";
  const title = section.title || t("homeBuilder.categoryMerchants", "متاجر مختارة");

  // «عرض الكل» يقود لصفحة المتاجر — مُصفّاة على التصنيف حين يكون واحداً
  const viewAllHref = section.category_slug
    ? `/stores/${section.category_slug}`
    : "/stores";

  const head = (
    <SectionHeader
      title={title}
      linkTo={section.show_view_all ? viewAllHref : undefined}
      linkLabel={section.show_view_all ? t("homeBuilder.viewAll", "عرض الكل") : undefined}
    />
  );

  /** شعارات مضغوطة — أكبر عدد من المتاجر في أقلّ مساحة */
  if (style === "logos") {
    return (
      <section className={`${CONTAINER} pt-11`}>
        {head}
        <div className="-mx-1 flex snap-x gap-3 overflow-x-auto px-1 pb-2">
          {merchants.map((m) => (
            <MerchantShell
              key={m.id}
              merchant={m}
              onComingSoon={() => setPending(m)}
              className={`group flex w-[104px] shrink-0 snap-start flex-col items-center gap-2 rounded-mk-lg border border-[#EFEDF7] bg-white p-3 transition-colors hover:border-[#DED7F2] ${FOCUS}`}
            >
              <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-mk-border bg-white">
                {m.logo ? (
                  <SmartImage
                    src={absolute(m.logo)}
                    name={m.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-[20px] font-extrabold text-mk-faint">
                    {m.name?.charAt(0)}
                  </span>
                )}
              </span>
              <span className="line-clamp-2 text-center text-[12px] font-bold leading-tight text-[#1A1A2E] transition-colors group-hover:text-[#400198]">
                {m.name}
              </span>
              {Number(m.max_discount ?? 0) > 0 && (
                <span
                  dir="ltr"
                  className="rounded-full bg-grad-accent px-2 py-0.5 text-[11px] font-extrabold text-white"
                >
                  {Math.round(Number(m.max_discount))}%
                </span>
              )}
            </MerchantShell>
          ))}
        </div>

        <ComingSoonModal
          isOpen={pending !== null}
          onClose={() => setPending(null)}
          merchant={pending}
        />
      </section>
    );
  }

  /** قائمة صفوف — تفاصيل أوسع بجانب الشعار */
  if (style === "list") {
    return (
      <section className={`${CONTAINER} pt-11`}>
        {head}
        <div className="flex flex-col gap-3">
          {merchants.map((m) => (
            <MerchantShell
              key={m.id}
              merchant={m}
              onComingSoon={() => setPending(m)}
              className={`group mk-lift flex items-center gap-4 rounded-mk-xl border border-[#EFEDF7] bg-white p-3 shadow-mk-card hover:border-[#DED7F2] ${FOCUS}`}
            >
              <span className="flex h-[64px] w-[64px] shrink-0 items-center justify-center overflow-hidden rounded-mk-md border border-mk-border bg-white">
                {m.logo ? (
                  <SmartImage
                    src={absolute(m.logo)}
                    name={m.name}
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-[20px] font-extrabold text-mk-faint">
                    {m.name?.charAt(0)}
                  </span>
                )}
              </span>

              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-[15px] font-extrabold text-[#1A1A2E] transition-colors duration-200 group-hover:text-[#400198]">
                  {m.name}
                  {m.is_coming_soon && (
                    <span className="ms-2 rounded-full bg-[linear-gradient(135deg,#FFA23A_0%,#FD671A_100%)] px-3 py-1 text-[13px] font-extrabold text-white">
                      {t("storePage.coming_soon", "قريباً")}
                    </span>
                  )}
                </p>
                <p className="line-clamp-1 text-[12px] text-[#9A99B0]">
                  {[m.category?.name, m.city].filter(Boolean).join(" · ")}
                </p>
              </div>

              {Number(m.rating ?? 0) > 0 && (
                <span className="shrink-0 text-[12px] font-bold text-[#9A99B0]" dir="ltr">
                  ★ {Number(m.rating).toFixed(1)}
                </span>
              )}

              {Number(m.max_discount ?? 0) > 0 && (
                <span
                  dir="ltr"
                  className="mk-shine shrink-0 rounded-full bg-grad-accent px-3 py-1.5 text-[13px] font-extrabold text-white shadow-mk-badge"
                >
                  {Math.round(Number(m.max_discount))}%
                </span>
              )}
            </MerchantShell>
          ))}
        </div>

        <ComingSoonModal
          isOpen={pending !== null}
          onClose={() => setPending(null)}
          merchant={pending}
        />
      </section>
    );
  }

  /** شريط أفقي — كرت المتجر نفسه بعرض ثابت */
  if (style === "carousel") {
    return (
      <section className={`${CONTAINER} pt-11`}>
        {head}
        <div className="-mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto px-1 pb-2">
          {merchants.map((m) => (
            <div key={m.id} className="w-[280px] shrink-0 snap-start">
              <MerchantCard merchant={m as MerchantSummary} />
            </div>
          ))}
        </div>

        <ComingSoonModal
          isOpen={pending !== null}
          onClose={() => setPending(null)}
          merchant={pending}
        />
      </section>
    );
  }

  /** الشبكة — الشكل الافتراضي */
  return (
    <section className={`${CONTAINER} pt-11`}>
      {head}
      <div className={GRID_CLASS[style] ?? GRID_CLASS.grid_4}>
        {merchants.map((m) => (
          <MerchantCard key={m.id} merchant={m as MerchantSummary} />
        ))}
      </div>

      <ComingSoonModal
        isOpen={pending !== null}
        onClose={() => setPending(null)}
        merchant={pending}
      />
    </section>
  );
};

export default CategoryMerchantsSection;
