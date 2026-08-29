"use client";

import React from "react";
import { LuSearch, LuChevronRight, LuX } from "react-icons/lu";
import { useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { FOCUS } from "@ui";

interface Props {
  title: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  /** زر رجوع في الترويسة (صفحات التفاصيل) */
  showBack?: boolean;
  /** أزرار إضافية على الطرف (مشاركة/إشعارات) */
  actions?: React.ReactNode;
  /** شارة صغيرة فوق العنوان (عدد النتائج، «جديد»…) */
  eyebrow?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * ترويسة صفحة داخلية في نسخة الموبايل — الاتجاه «الحيوي التجاري»:
 * تدرّج الهوية العميق + هالة برتقالية، عنوان بارز، بحث مرتفع، ثم الشرائح.
 * كل الأهداف القابلة للنقر ≥44px، والسهم يتبع اتجاه الصفحة.
 */
const MobilePageHeader: React.FC<Props> = ({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  showBack = false,
  actions,
  eyebrow,
  children,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="relative isolate overflow-hidden rounded-b-mk-3xl bg-grad-brand-deep px-4 pb-4 pt-5 text-white shadow-mk-glow">
      {/* هالات لونية تعطي عمقاً بلا صور */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 end-[-70px] h-56 w-56 rounded-full bg-mk-accent/35 blur-3xl"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-32 start-[-60px] h-56 w-56 rounded-full bg-mk-primary-light/50 blur-3xl"
      />

      <div className="relative">
        <div className="flex items-start gap-2">
          {showBack && (
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label={t("ui.previous", "السابق")}
              className={`-ms-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20 active:scale-95 ${FOCUS}`}
            >
              <LuChevronRight size={20} className="ltr:rotate-180 rtl:rotate-0" />
            </button>
          )}

          <div className="min-w-0 flex-1">
            {eyebrow && (
              <span className="mb-1 inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/15 px-2.5 py-1 text-[10.5px] font-bold backdrop-blur-sm">
                {eyebrow}
              </span>
            )}
            <h1 className="m-0 truncate text-[21px] font-bold leading-tight">{title}</h1>
            {subtitle && (
              <p className="m-0 mt-1 line-clamp-1 text-[12.5px] text-mk-lilac">{subtitle}</p>
            )}
          </div>

          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </div>

        {onSearchChange && (
          <div className="mt-4 flex h-12 items-center gap-2 rounded-mk-md bg-white px-3.5 shadow-mk-float">
            <LuSearch size={17} className="shrink-0 text-mk-accent" aria-hidden />
            <input
              value={searchValue ?? ""}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder ?? t("ui.searchPlaceholder", "ابحث…")}
              aria-label={searchPlaceholder ?? t("ui.searchPlaceholder", "ابحث…")}
              className="h-full w-full min-w-0 bg-transparent text-[13.5px] text-mk-text outline-none placeholder:text-mk-faint"
            />
            {!!searchValue && (
              <button
                type="button"
                onClick={() => onSearchChange("")}
                aria-label={t("ui.clearFilters", "مسح")}
                className={`-me-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-mk-faint transition-colors hover:bg-mk-tint2 ${FOCUS}`}
              >
                <LuX size={16} />
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

export default MobilePageHeader;
