"use client";

import { useTranslation } from "react-i18next";
import { Link } from "@/lib/router-compat";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaSnapchat,
  FaTiktok,
  FaWhatsapp,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import { useAppConfig } from "@hooks/api/useMokafaatQueries";
import { LogoLight } from "@assets";

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

  const columns = [
    {
      title: t("home.navbar.brand", "مكافآت"),
      links: [
        { to: "/about", label: t("home.navbar.about", "من نحن") },
        { to: "/blogs", label: t("home.footer_new.blog", "المدونة") },
        { to: "/contact", label: t("home.navbar.contact", "تواصل معنا") },
        { to: "/faq", label: t("home.footer_new.faq", "الأسئلة الشائعة") },
      ],
    },
    {
      title: t("home.footer_new.services", "خدمات"),
      links: [
        { to: "/offers", label: t("home.navbar.offers", "العروض") },
        { to: "/coupons", label: t("home.navbar.coupons", "كوبونز") },
        { to: "/cards", label: t("home.navbar.cards", "البطاقات") },
      ],
    },
    {
      title: t("home.footer_new.business", "الشركات والجهات"),
      links: [
        { to: "/business-registration", label: t("home.footer_new.join", "انضم كشريك") },
        { to: "/contact", label: t("home.corporate_new.cta", "اطلب عرض سعر") },
      ],
    },
    {
      title: t("home.footer_new.help", "مساعدة"),
      links: [
        { to: "/privacy-policy", label: t("home.footer.privacy", "سياسة الخصوصية") },
        { to: "/terms-and-conditions", label: t("home.footer.terms", "الشروط والأحكام") },
        { to: "/download-app", label: t("home.hero_new.app", "حمّل التطبيق") },
      ],
    },
  ];

  return (
    <footer className="mt-12 bg-[#17161A] text-[#B9B6C2]">
      <div className="mx-auto grid w-full max-w-site grid-cols-1 gap-7 px-4 sm:px-6 pb-7 pt-[52px] sm:grid-cols-2 lg:grid-cols-[1.3fr_repeat(4,1fr)]">
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

          <div className="text-[13px] leading-8">
            {contact?.phone && (
              <a
                href={`tel:${contact.phone}`}
                dir="ltr"
                className="block text-[#B9B6C2] [unicode-bidi:isolate] hover:text-white"
              >
                {contact.phone}
              </a>
            )}
            {contact?.email && (
              <a
                href={`mailto:${contact.email}`}
                dir="ltr"
                className="block text-[#B9B6C2] [unicode-bidi:isolate] hover:text-white"
              >
                {contact.email}
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
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.06] text-white transition-colors hover:border-[#4C1D95] hover:bg-[#4C1D95]"
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
                className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-white/[0.14] bg-white/[0.06] text-white transition-colors hover:border-[#4C1D95] hover:bg-[#4C1D95]"
              >
                <FaWhatsapp size={17} />
              </a>
            )}
          </div>
        </div>

        {columns.map((column) => (
          <div key={column.title} className="flex flex-col gap-3">
            <span className="text-[14px] font-bold text-white">{column.title}</span>
            {column.links.map((link) => (
              <Link
                key={`${column.title}-${link.to}-${link.label}`}
                to={link.to}
                className="text-[13px] text-[#A7A4B0] transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        ))}
      </div>

      <div className="border-t border-white/[0.12]">
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
