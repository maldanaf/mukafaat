"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { LuTriangleAlert, LuRotateCw } from "react-icons/lu";
import Button from "./Button";

interface Props {
  title?: string;
  description?: string;
  /** إعادة المحاولة — عادة `refetch` من react-query */
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

/** حالة الخطأ الموحّدة مع زر «إعادة المحاولة» */
const ErrorState: React.FC<Props> = ({
  title,
  description,
  onRetry,
  className = "",
  compact = false,
}) => {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center rounded-mk-lg border border-[#F7DDE1] bg-[#FFF7F8] text-center ${
        compact ? "gap-2 px-5 py-6" : "gap-3 px-6 py-10"
      } ${className}`}
    >
      <span
        aria-hidden
        className={`flex items-center justify-center rounded-full bg-[#FDE9EB] text-mk-red ${
          compact ? "h-11 w-11 text-[20px]" : "h-14 w-14 text-[24px]"
        }`}
      >
        <LuTriangleAlert />
      </span>
      <p className={`font-bold text-mk-text ${compact ? "text-[14px]" : "text-[16px]"}`}>
        {title ?? t("ui.error.title", "تعذّر تحميل البيانات")}
      </p>
      <p className="max-w-md text-[13px] leading-relaxed text-mk-muted">
        {description ?? t("ui.error.description", "تحقّق من اتصالك بالإنترنت وحاول مرة أخرى.")}
      </p>
      {onRetry && (
        <div className="pt-2">
          <Button onClick={onRetry} variant="outline" size="sm" icon={<LuRotateCw />}>
            {t("ui.error.retry", "إعادة المحاولة")}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ErrorState;
