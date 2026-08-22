"use client";

import { Link } from "@/lib/router-compat";
import { t } from "i18next";
import { CONTAINER } from "./tokens";

interface Props {
  corporate?: {
    title?: string;
    description?: string;
    cta_label?: string;
    cta_link?: string;
    image?: string | null;
  };
  app?: {
    title?: string;
    description?: string;
    image?: string | null;
    app_store?: string | null;
    google_play?: string | null;
  };
}

/** قسمان جنباً إلى جنب: للشركات + حمّل التطبيق (النصوص من لوحة التحكم) */
const CorporateApp: React.FC<Props> = ({ corporate, app }) => (
  <section className={`${CONTAINER} pt-11`}>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="relative flex flex-col items-start gap-3.5 overflow-hidden rounded-[20px] bg-[#2E1065] p-8">
        {corporate?.image && (
          <img
            src={corporate.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
        )}
        <div className="absolute inset-0 bg-[linear-gradient(to_left,rgba(46,16,101,0.95),rgba(46,16,101,0.6))]" />
        <h3 className="relative m-0 text-[22px] sm:text-[24px] font-bold text-white">
          {corporate?.title || t("home.corporate_new.title", "للشركات والجهات الحكومية")}
        </h3>
        <p className="relative m-0 max-w-[46ch] text-[14px] leading-[1.8] text-[#D6CEEB]">
          {corporate?.description ||
            t(
              "home.corporate_new.body",
              "برنامج مزايا مخصص لموظفيك: عروض حصرية، بطاقات رقمية وتقارير استخدام شهرية على منصة واحدة.",
            )}
        </p>
        <Link
          to={corporate?.cta_link || "/contact"}
          className="relative flex h-11 items-center rounded-[11px] bg-white px-5 text-[13px] font-semibold text-[#2E1065] transition-colors hover:bg-[#EDE9FE]"
        >
          {corporate?.cta_label || t("home.corporate_new.cta", "اطلب عرض سعر")}
        </Link>
      </div>

      <div className="grid grid-cols-1 items-center gap-5 rounded-[20px] border border-[#EDE9F7] bg-[#F6F3FC] p-8 sm:grid-cols-[1.2fr_0.8fr]">
        <div className="flex flex-col items-start gap-3">
          <h3 className="m-0 text-[20px] sm:text-[22px] font-bold text-[#17122A]">
            {app?.title || t("home.app_new.title", "حمّل تطبيق مكافآت")}
          </h3>
          <p className="m-0 text-[14px] leading-[1.8] text-[#5A536D]">
            {app?.description ||
              t(
                "home.app_new.body",
                "كل عروضك وكوبوناتك وبطاقاتك في جيبك، مع تنبيهات عند وصول خصم جديد قريب منك.",
              )}
          </p>
          <div className="mt-1 flex flex-wrap gap-2.5">
            <a
              href={app?.app_store || "/download-app"}
              target={app?.app_store ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="flex h-[42px] items-center rounded-[10px] bg-[#2E1065] px-4 text-[12px] font-semibold text-white"
            >
              App Store
            </a>
            <a
              href={app?.google_play || "/download-app"}
              target={app?.google_play ? "_blank" : undefined}
              rel="noopener noreferrer"
              className="flex h-[42px] items-center rounded-[10px] border border-[#C9BCEC] bg-white px-4 text-[12px] font-semibold text-[#2E1065]"
            >
              Google Play
            </a>
          </div>
        </div>
        {app?.image && (
          <img
            src={app.image}
            alt=""
            className="h-[170px] w-full rounded-[16px] object-cover"
          />
        )}
      </div>
    </div>
  </section>
);

export default CorporateApp;
