"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import Badge from "./Badge";

interface Props {
  /** من `is_open_now` في مخرجات المتجر */
  isOpenNow?: boolean | null;
  /** من `is_temporarily_closed` — يتقدّم على حالة ساعات العمل */
  isTemporarilyClosed?: boolean | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * شارة «مفتوح الآن / مغلق حالياً / مغلق مؤقتاً» — نفس أولويات التطبيق:
 * الإغلاق المؤقت يتقدّم دائماً، وعند غياب البيانات لا تُعرض شارة.
 */
const OpenStatusBadge: React.FC<Props> = ({
  isOpenNow,
  isTemporarilyClosed,
  size = "md",
  className = "",
}) => {
  const { t } = useTranslation();

  if (isTemporarilyClosed) {
    return (
      <Badge tone="danger" size={size} className={className}>
        {t("storePage.temporarily_closed", "مغلق مؤقتاً")}
      </Badge>
    );
  }

  if (isOpenNow === true) {
    return (
      <Badge tone="success" size={size} className={className}>
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-mk-green" />
        {t("storePage.open_now", "مفتوح الآن")}
      </Badge>
    );
  }

  if (isOpenNow === false) {
    return (
      <Badge tone="danger" size={size} className={className}>
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-mk-red" />
        {t("storePage.closed_now", "مغلق الآن")}
      </Badge>
    );
  }

  return null;
};

export default OpenStatusBadge;
