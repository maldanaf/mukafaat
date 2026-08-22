"use client";

import { Link } from "@/lib/router-compat";
import { LuTag, LuTicketPercent, LuCreditCard, LuMapPin } from "react-icons/lu";
import { t } from "i18next";
import { CONTAINER, pick } from "./tokens";

/** أربع بطاقات خدمات تحت شريط البحث */
const ServiceCards: React.FC = () => {
  const services = [
    {
      icon: LuTag,
      title: t("home.services_new.offers.title", "العروض والخصومات"),
      body: t("home.services_new.offers.body", "خصومات مستمرة لدى مئات العلامات التجارية."),
      cta: t("home.services_new.offers.cta", "استعرض العروض"),
      to: "/offers",
    },
    {
      icon: LuTicketPercent,
      title: t("home.services_new.coupons.title", "كوبونات وأكواد خصم"),
      body: t("home.services_new.coupons.body", "أكواد محدثة تعمل على المتاجر الإلكترونية."),
      cta: t("home.services_new.coupons.cta", "تصفح الكوبونات"),
      to: "/coupons",
    },
    {
      icon: LuCreditCard,
      title: t("home.services_new.cards.title", "البطاقات الرقمية"),
      body: t("home.services_new.cards.body", "بطاقات ألعاب وترفيه وتسوق تصلك فوراً."),
      cta: t("home.services_new.cards.cta", "تسوق البطاقات"),
      to: "/cards",
    },
    {
      icon: LuMapPin,
      title: t("home.services_new.nearby.title", "الأقرب إليك"),
      body: t("home.services_new.nearby.body", "اكتشف الخصومات المتاحة في محيطك الآن."),
      cta: t("home.services_new.nearby.cta", "استكشف الآن"),
      to: "/offers?sort=nearest",
    },
  ];

  return (
    <section className={`${CONTAINER} pt-[22px]`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service, i) => {
          const color = pick(i);
          const Icon = service.icon;
          return (
            <Link
              key={service.to}
              to={service.to}
              className="flex flex-col gap-2.5 rounded-[18px] border border-[#EDE9F7] bg-white p-[22px] transition-all hover:border-[#C9BCEC] hover:shadow-[0_10px_28px_rgba(46,16,101,0.08)]"
            >
              <span
                className="flex h-11 w-11 items-center justify-center rounded-[12px]"
                style={{ background: color.bg, color: color.c }}
              >
                <Icon size={22} />
              </span>
              <h3 className="m-0 text-[16px] font-bold text-[#17122A]">{service.title}</h3>
              <p className="m-0 text-[13px] leading-[1.7] text-[#6B6480]">{service.body}</p>
              <span className="mt-1 text-[13px] font-semibold" style={{ color: color.c }}>
                {service.cta} ←
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
};

export default ServiceCards;
