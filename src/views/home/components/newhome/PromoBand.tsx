"use client";

import { useMemo } from "react";
import { CONTAINER } from "./tokens";
import { PromoSection, isPromoVisible, type PromoConfig } from "@ui";

interface Props {
  /** `data.home_sections` من `/api/web/home` */
  sections?: Record<string, PromoConfig> | null;
  className?: string;
}

/**
 * الأقسام الترويجية المُدارة من لوحة التحكم: «جديد مكافآت» و«بانر VIP».
 * الترتيب من `sort_order`، والشكل: `vip_banner` بانر أفقي والبقية كروت —
 * نفس ما يفعله التطبيق في `_buildNewMukafaatSection` و`_buildVipBanner`.
 * غياب `home_sections` أو إخفاؤها من اللوحة = لا يُعرض شيء.
 */
const PromoBand: React.FC<Props> = ({ sections, className = "" }) => {
  const items = useMemo(() => {
    if (!sections || typeof sections !== "object") return [];
    return Object.entries(sections)
      .map(([key, config]) => ({ key, config: { ...config, key } as PromoConfig }))
      .filter(({ config }) => isPromoVisible(config))
      .sort(
        (a, b) => Number(a.config.sort_order ?? 99) - Number(b.config.sort_order ?? 99),
      );
  }, [sections]);

  if (items.length === 0) return null;

  const banners = items.filter((item) => item.key === "vip_banner");
  const cards = items.filter((item) => item.key !== "vip_banner");

  return (
    <section className={`${CONTAINER} pt-9 sm:pt-11 ${className}`}>
      <div className="flex flex-col gap-4">
        {cards.length > 0 && (
          <div
            className={`grid gap-4 ${cards.length > 1 ? "sm:grid-cols-2" : "grid-cols-1"}`}
          >
            {cards.map(({ key, config }) => (
              <PromoSection key={key} config={config} layout="card" />
            ))}
          </div>
        )}
        {banners.map(({ key, config }) => (
          <PromoSection key={key} config={config} layout="banner" />
        ))}
      </div>
    </section>
  );
};

export default PromoBand;
