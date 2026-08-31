"use client";

import { useTranslation } from "react-i18next";
import { Link } from "@/lib/router-compat";
import {
  FaPhoneAlt,
  FaEnvelope,
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaSnapchat,
  FaTiktok,
  FaWhatsapp,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useAppConfig, usePages } from "@hooks/api/useMokafaatQueries";
import { LogoLight } from "@assets";

type CmsPage = {
  slug: string;
  title: string;
  footer_column?: string | null;
};

const SOCIAL_ICONS: Record<
  string,
  { Icon: React.ComponentType<{ size?: number }>; label: string }
> = {
  twitter: { Icon: FaXTwitter, label: "X" },
  instagram: { Icon: FaInstagram, label: "Instagram" },
  youtube: { Icon: FaYoutube, label: "YouTube" },
  linkedin: { Icon: FaLinkedin, label: "LinkedIn" },
  facebook: { Icon: FaFacebook, label: "Facebook" },
  snapchat: { Icon: FaSnapchat, label: "Snapchat" },
  tiktok: { Icon: FaTiktok, label: "TikTok" },
};

type AppConfigData = {
  data?: {
    config?: {
      contact?: { address?: string; email?: string; phone?: string; whatsapp?: string };
      site?: { name?: string; description?: string; logo?: string };
      social?: Record<string, string>;
    };
  };
};

/**
 * الفوتر المشترك لكل صفحات الموقع — تصميم design_handoff_mukafaat_homepage:
 * خلفية داكنة، عمود العلامة + ٤ أعمدة روابط + شريط الحقوق.
 */
const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { data: appConfig } = useAppConfig() as { data?: AppConfigData };

  const contact = appConfig?.data?.config?.contact;
  const site = appConfig?.data?.config?.site;
  const social = appConfig?.data?.config?.social ?? {};

  const socialEntries = Object.entries(social).filter(
    ([key, url]) => url && typeof url === "string" && SOCIAL_ICONS[key],
  );

  /**
   * صفحات لوحة التحكم تُضاف إلى أعمدة الفوتر تلقائياً.
   *
   * كانت روابط الفوتر كلها مكتوبة هنا، فأي صفحة تُنشأ من اللوحة تبقى
   * بلا رابط يصل إليها رغم أن مسارها /pages/{slug} يعمل. الآن تحدَّد
   * الوجهة من حقل «عمود الفوتر» في شاشة الصفحة.
   */
  const { data: pagesData } = usePages("web") as {
    data?: { data?: { pages?: CmsPage[] } };
  };

  const cmsByColumn = (pagesData?.data?.pages ?? []).reduce<
    Record<string, { to: string; label: string }[]>
  >((acc, page) => {
    if (!page.footer_column) return acc;
    (acc[page.footer_column] ??= []).push({
      to: `/pages/${page.slug}`,
      label: page.title,
    });
    return acc;
  }, {});

  const columns = [
    {
      title: t("home.navbar.brand", "مكافآت"),
      links: [
        { to: "/about", label: t("home.navbar.about", "من نحن") },
        { to: "/blogs", label: t("home.footer_new.blog", "المدونة") },
        { to: "/contact", label: t("home.navbar.contact", "تواصل معنا") },
        { to: "/faq", label: t("home.footer_new.faq", "الأسئلة الشائعة") },
        ...(cmsByColumn.brand ?? []),
      ],
    },
    {
      title: t("home.footer_new.services", "خدمات"),
      links: [
        { to: "/offers", label: t("home.navbar.offers", "العروض") },
        { to: "/coupons", label: t("home.navbar.coupons", "كوبونز") },
        { to: "/cards", label: t("home.navbar.cards", "البطاقات") },
        ...(cmsByColumn.services ?? []),
      ],
    },
    {
      title: t("home.footer_new.business", "الشركات والجهات"),
      links: [
        { to: "/store-request", label: t("storeRequest.tab_join") },
        { to: "/store-request?tab=suggest", label: t("storeRequest.tab_suggest") },
        { to: "/contact", label: t("home.corporate_new.cta", "اطلب عرض سعر") },
        ...(cmsByColumn.business ?? []),
      ],
    },
    {
      title: t("home.footer_new.help", "مساعدة"),
      links: [
        { to: "/privacy-policy", label: t("home.footer.privacy", "سياسة الخصوصية") },
        { to: "/terms-and-conditions", label: t("home.footer.terms", "الشروط والأحكام") },
        { to: "/download-app", label: t("home.hero_new.app", "حمّل التطبيق") },
        ...(cmsByColumn.help ?? []),
      ],
    },
  ];

  return (
    <footer className="relative mt-12 overflow-hidden bg-[#17161A] text-[#B9B6C2]">
      {/* شريط تدرّج الهوية أعلى الفوتر */}
      <span aria-hidden className="block h-[5px] w-full bg-grad-accent" />

      {/* هالات هوية ناعمة تكسر السواد المسطّح */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-28 start-[10%] h-[280px] w-[280px] rounded-full bg-[#400198]/35 blur-[110px]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-28 end-[8%] h-[240px] w-[240px] rounded-full bg-[#FD671A]/14 blur-[110px]"
      />

      <div className="relative mx-auto grid w-full max-w-site grid-cols-1 gap-7 px-4 sm:px-6 pb-7 pt-[52px] sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center">
            <img
              src={LogoLight}
              alt={site?.name || t("home.navbar.brand", "مكافآت")}
              className="h-11 w-auto"
            />
          </div>

          <p className="m-0 max-w-[34ch] text-[13px] leading-[1.9]">
            {site?.description ||
              t(
                "home.footer_new.about",
                "منصة العروض والخصومات والكوبونات في المملكة العربية السعودية.",
              )}
          </p>

          <div className="flex flex-col gap-2 text-[13px]">
            {contact?.phone && (
              <a
                href={`tel:${contact.phone}`}
                className="group flex items-center gap-2.5 text-[#B9B6C2] transition-colors hover:text-white"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white transition-all duration-200 ease-out group-hover:scale-110 group-hover:bg-grad-brand">
                  <FaPhoneAlt size={12} />
                </span>
                <span dir="ltr" className="[unicode-bidi:isolate]">
                  {contact.phone}
                </span>
              </a>
            )}
            {contact?.email && (
              <a
                href={`mailto:${contact.email}`}
                className="group flex items-center gap-2.5 text-[#B9B6C2] transition-colors hover:text-white"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-white transition-all duration-200 ease-out group-hover:scale-110 group-hover:bg-grad-brand">
                  <FaEnvelope size={12} />
                </span>
                <span dir="ltr" className="[unicode-bidi:isolate]">
                  {contact.email}
                </span>
              </a>
            )}
          </div>

          <div className="mt-1 flex flex-wrap gap-2">
            {socialEntries.map(([key, url]) => {
              const { Icon, label } = SOCIAL_ICONS[key];
              return (
                <a
                  key={key}
                  href={url}
                  title={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.06] text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-transparent hover:bg-grad-brand hover:shadow-mk-glow"
                >
                  <Icon size={17} />
                </a>
              );
            })}
            {contact?.whatsapp && (
              <a
                href={`https://wa.me/${String(contact.whatsapp).replace(/[^0-9]/g, "")}`}
                title="WhatsApp"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.06] text-white transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-transparent hover:bg-grad-success hover:shadow-[0_14px_30px_-12px_rgba(18,160,106,0.8)]"
              >
                <FaWhatsapp size={17} />
              </a>
            )}
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <span className="flex flex-col gap-2 text-[14.5px] font-extrabold text-white">
              {column.title}
              <span aria-hidden className="h-[3px] w-8 rounded-full bg-grad-accent" />
            </span>
            {column.links.map((link) => (
              <Link
                key={`${column.title}-${link.to}-${link.label}`}
                to={link.to}
                className="group/link inline-flex w-fit items-center gap-1.5 text-[13px] font-medium text-[#A7A4B0] transition-colors duration-200 hover:text-white"
              >
                <span
                  aria-hidden
                  className="h-1 w-0 rounded-full bg-grad-accent transition-all duration-200 group-hover/link:w-2.5"
                />
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="relative border-t border-white/[0.12]">
        <div className="mx-auto flex w-full max-w-site flex-col items-center justify-between gap-2 px-4 sm:px-6 py-[18px] text-[12px] text-[#807D8A] sm:flex-row">
          <span>
            {t("home.footer_new.rights", "جميع الحقوق محفوظة © مكافآت")}{" "}
            <span dir="ltr">{new Date().getFullYear()}</span>
          </span>
          <span>{contact?.address || t("home.footer_new.country", "المملكة العربية السعودية")}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
