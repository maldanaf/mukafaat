"use client";

import { Link } from "@/lib/router-compat";
import { LuTag, LuTicketPercent, LuCreditCard, LuMapPin, LuArrowRight } from "react-icons/lu";
import { t } from "i18next";
import { CONTAINER } from "./tokens";
import { FOCUS } from "@ui";
import Reveal from "./Reveal";

/**
 * تدرّج مخصّص لكل خدمة — الاتجاه «الحيوي التجاري» يعتمد
 * سطحاً ملوّناً كاملاً بدل الكرت الأبيض الهادئ.
 */
const GRADIENTS = [
  "linear-gradient(135deg,#400198 0%,#6703EB 100%)",
  "linear-gradient(135deg,#FFA23A 0%,#FD671A 45%,#E01F3D 100%)",
  "linear-gradient(135deg,#0E9384 0%,#0B7268 100%)",
  "linear-gradient(135deg,#C2246E 0%,#7A1146 100%)",
];

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
    <section className={`${CONTAINER} pt-9 sm:pt-11`}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service, i) => {
          const Icon = service.icon;
          return (
            <Reveal key={service.to} delay={i * 70} className="h-full">
              <Link
                to={service.to}
                className={`mk-lift group relative flex h-full flex-col gap-3 overflow-hidden rounded-mk-2xl p-6 text-white shadow-[0_16px_34px_-18px_rgba(46,16,101,0.55)] ${FOCUS}`}
                style={{ backgroundImage: GRADIENTS[i % GRADIENTS.length] }}
              >
                {/* لمعة قطرية تعبر الكرت عند المرور */}
                <span className="mk-shine pointer-events-none absolute inset-0" aria-hidden />

                {/* هالة بيضاء ناعمة تكسر التدرّج المسطّح */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute -top-16 -end-12 h-40 w-40 rounded-full bg-white/20 blur-3xl transition-opacity duration-500 group-hover:opacity-80"
                />

                <span className="relative flex h-14 w-14 items-center justify-center rounded-mk-lg border border-white/25 bg-white/20 text-white backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
                  <Icon size={27} aria-hidden />
                </span>

                <h3 className="relative m-0 text-[18px] font-extrabold leading-snug tracking-[-0.01em]">
                  {service.title}
                </h3>

                <p className="relative m-0 text-[13px] leading-[1.75] text-white/80">
                  {service.body}
                </p>

                <span className="relative mt-auto inline-flex items-center gap-1.5 pt-2 text-[13.5px] font-extrabold text-white">
                  {service.cta}
                  <LuArrowRight
                    size={15}
                    aria-hidden
                    className="transition-transform duration-200 group-hover:translate-x-1 rtl:-scale-x-100"
                  />
                </span>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
};

export default ServiceCards;
