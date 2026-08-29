"use client";

import { CONTAINER, PromoSection, isPromoVisible } from "@ui";
import type { LayoutSection } from "./types";

interface Props {
  section: LayoutSection;
}

/**
 * بانر ترويجي حرّ يضيفه الأدمن (يمكن إضافة أكثر من واحد) —
 * نصوصه وخلفيته ووجهة زره كلها من «بناء واجهة الموقع»،
 * ويُرسم بنفس مكوّن `PromoSection` الموحّد فيبقى منطق الوجهة واحداً.
 */
const LayoutPromoBanner: React.FC<Props> = ({ section }) => {
  const config = section.banner;
  if (!isPromoVisible(config)) return null;

  const layout = config?.layout === "card" ? "card" : "banner";

  return (
    <section className={`${CONTAINER} pt-9 sm:pt-11`}>
      <PromoSection config={config} layout={layout} />
    </section>
  );
};

export default LayoutPromoBanner;
