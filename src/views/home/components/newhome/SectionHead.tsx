"use client";

/**
 * ترويسة قسم الرئيسية — غلاف رقيق حول `SectionHeader` في نظام التصميم الموحّد
 * (`@ui`) للحفاظ على نفس الواجهة القديمة في الأقسام القائمة.
 */
import React from "react";
import SectionHeader from "@ui/SectionHeader";

interface Props {
  eyebrow?: string;
  title: string;
  /** وصف قصير تحت العنوان — يوضّح الهدف من القسم */
  subtitle?: string;
  linkLabel?: string;
  linkTo?: string;
  /** على الخلفيات الداكنة */
  dark?: boolean;
  /** عناصر جانبية (أسهم تنقّل، فلاتر…) */
  actions?: React.ReactNode;
  className?: string;
  /** أُبقي للتوافق — لون النص العلوي أصبح برتقالي الشعار دائماً */
  eyebrowColor?: string;
}

const SectionHead: React.FC<Props> = ({
  eyebrow,
  title,
  subtitle,
  linkLabel,
  linkTo,
  dark = false,
  actions,
  className,
}) => (
  <SectionHeader
    eyebrow={eyebrow}
    title={title}
    subtitle={subtitle}
    linkTo={linkTo}
    linkLabel={linkLabel}
    dark={dark}
    actions={actions}
    className={className}
  />
);

export default SectionHead;
