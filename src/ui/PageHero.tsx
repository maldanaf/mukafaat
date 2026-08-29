"use client";

import React from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { LuChevronLeft } from "react-icons/lu";
import { CONTAINER, FOCUS } from "./tokens";

export interface Crumb {
  label: string;
  to?: string;
}

interface Props {
  title: string;
  subtitle?: string;
  /** نص علوي صغير */
  eyebrow?: string;
  /** أيقونة/شعار على يمين العنوان */
  icon?: React.ReactNode;
  crumbs?: Crumb[];
  /** زر رجوع (نفس هيدر التطبيق: مربع بنفسجي فاتح) */
  backTo?: string;
  /** عنصر إجراءات على الجانب */
  actions?: React.ReactNode;
  /** محتوى تحت العنوان (شريط بحث/فلاتر) */
  children?: React.ReactNode;
  className?: string;
}

/**
 * ترويسة صفحة داخلية — نفس مفهوم `AppHeader` في التطبيق لكن بمقاس ويب:
 * تدرّج بنفسجي، زر رجوع، مسار تنقّل، وعنوان واضح، بلا صور خلفية ثقيلة.
 */
const PageHero: React.FC<Props> = ({
  title,
  subtitle,
  eyebrow,
  icon,
  crumbs,
  backTo,
  actions,
  children,
  className = "",
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <section
      className={`bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] ${className}`}
    >
      <div className={`${CONTAINER} py-7 sm:py-10`}>
        {(backTo || crumbs?.length) && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {backTo && (
              <button
                type="button"
                onClick={() => navigate(backTo)}
                className={`inline-flex h-11 items-center gap-1.5 rounded-mk-md border border-white/25 bg-white/10 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-white/20 ${FOCUS}`}
              >
                <LuChevronLeft aria-hidden className="rtl:-scale-x-100" size={16} />
                {t("offerDetail.back", "رجوع")}
              </button>
            )}

            {!!crumbs?.length && (
              <nav aria-label="breadcrumb" className="min-w-0">
                <ol className="flex flex-wrap items-center gap-1.5 text-[12px] text-white/75">
                  {crumbs.map((crumb, i) => (
                    <li key={`${crumb.label}-${i}`} className="flex items-center gap-1.5">
                      {i > 0 && (
                        <span aria-hidden className="text-white/40">
                          /
                        </span>
                      )}
                      {crumb.to ? (
                        <Link to={crumb.to} className="transition-colors hover:text-white">
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className="font-semibold text-mk-accent">{crumb.label}</span>
                      )}
                    </li>
                  ))}
                </ol>
              </nav>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            {icon && (
              <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-mk-md bg-white/15 text-white">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {eyebrow && (
                <p className="m-0 text-[12px] font-bold tracking-wide text-mk-accent">
                  {eyebrow}
                </p>
              )}
              <h1 className="m-0 text-[24px] font-bold leading-tight text-white sm:text-[32px]">
                {title}
              </h1>
              {subtitle && (
                <p className="m-0 mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-white/75">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>

        {children && <div className="mt-5">{children}</div>}
      </div>
    </section>
  );
};

export default PageHero;
