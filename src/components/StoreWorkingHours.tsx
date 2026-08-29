"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { IoTimeOutline } from "react-icons/io5";

export interface WorkingHourRow {
  day_of_week?: number;
  day_name?: string;
  day_name_en?: string;
  opens_at?: string | null;
  closes_at?: string | null;
  is_closed?: boolean;
  is_today?: boolean;
}

interface Props {
  workingHours?: WorkingHourRow[] | null;
  className?: string;
}

/**
 * جدول ساعات العمل لكل يوم من مخرجات `working_hours` في تفاصيل المتجر.
 * لا يُعرض شيء عند غياب البيانات (متاجر أُنشئت قبل هذه الخاصية).
 */
const StoreWorkingHours: React.FC<Props> = ({ workingHours, className = "" }) => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const isArabicLike = (i18n.language ?? "ar").split("-")[0] !== "en";

  const rows = Array.isArray(workingHours) ? workingHours : [];
  if (rows.length === 0) return null;

  return (
    <div
      className={`rounded-mk-xl border border-mk-border bg-white p-5 ${className}`}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="mb-3 flex items-center gap-2">
        <IoTimeOutline className="h-5 w-5 text-[#400198]" />
        <h3 className="text-base font-bold text-mk-text">
          {t("storePage.working_hours")}
        </h3>
      </div>

      <ul className="divide-y divide-mk-divider">
        {rows.map((row, index) => {
          const dayName =
            (isArabicLike ? row.day_name : row.day_name_en) ||
            row.day_name ||
            row.day_name_en ||
            "";
          const closed = row.is_closed || !row.opens_at || !row.closes_at;
          return (
            <li
              key={`${row.day_of_week ?? index}`}
              className={`flex items-center justify-between gap-3 py-2.5 ${
                row.is_today ? "font-semibold text-[#400198]" : "text-mk-text-strong"
              }`}
            >
              <span className="flex items-center gap-2 text-sm">
                {dayName}
                {row.is_today && (
                  <span className="rounded-full bg-[#400198]/10 px-2 py-0.5 text-[10px] font-semibold text-[#400198]">
                    {t("storePage.today")}
                  </span>
                )}
              </span>
              <span
                className={`text-sm ${closed ? "text-mk-faint" : ""}`}
                dir="ltr"
              >
                {closed
                  ? t("storePage.closed_today")
                  : `${row.opens_at} - ${row.closes_at}`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default StoreWorkingHours;
