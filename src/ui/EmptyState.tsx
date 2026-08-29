"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { LuInbox } from "react-icons/lu";
import Button from "./Button";

interface Props {
  /** أيقونة القسم (افتراضي صندوق فارغ) */
  icon?: React.ReactNode;
  title?: string;
  description?: string;
  /** زر إجراء اختياري */
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  className?: string;
  /** نسخة مضغوطة داخل كرت صغير */
  compact?: boolean;
}

/** حالة الفراغ الموحّدة — نفس نبرة التطبيق: أيقونة دائرية بنفسجية + عنوان + وصف */
const EmptyState: React.FC<Props> = ({
  icon,
  title,
  description,
  actionLabel,
  actionTo,
  onAction,
  className = "",
  compact = false,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-mk-xl border border-mk-border bg-white text-center shadow-mk-card ${
        compact ? "gap-2 px-5 py-7" : "gap-3 px-6 py-12"
      } ${className}`}
    >
      <span
        aria-hidden
        className={`flex items-center justify-center rounded-full bg-grad-brand text-white shadow-mk-glow ${
          compact ? "h-11 w-11 text-[20px]" : "h-16 w-16 text-[28px]"
        }`}
      >
        {icon ?? <LuInbox />}
      </span>
      <p className={`font-bold text-mk-text ${compact ? "text-[14px]" : "text-[16px]"}`}>
        {title ?? t("ui.empty.title", "لا يوجد شيء هنا بعد")}
      </p>
      {description !== "" && (
        <p className="max-w-md text-[13px] leading-relaxed text-mk-muted">
          {description ?? t("ui.empty.description", "جرّب تغيير الفلاتر أو عُد لاحقاً.")}
        </p>
      )}
      {actionLabel && (actionTo || onAction) && (
        <div className="pt-2">
          {actionTo ? (
            <Button to={actionTo} variant="soft" size="sm">
              {actionLabel}
            </Button>
          ) : (
            <Button onClick={onAction} variant="soft" size="sm">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
