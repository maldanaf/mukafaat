"use client";

import { useState } from "react";
import { t } from "i18next";
import { toast } from "react-toastify";
import { CONTAINER } from "./tokens";
import { useNewsletterSubscribe } from "@hooks/api/useMokafaatQueries";

interface Props {
  title?: string;
  description?: string;
}

/** النشرة البريدية — يرسل الاشتراك إلى /api/web/newsletter/subscribe */
const Newsletter: React.FC<Props> = ({ title, description }) => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { mutate, isPending } = useNewsletterSubscribe();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;

    mutate(
      { email: value, source: "web_home" },
      {
        onSuccess: () => {
          setSubscribed(true);
          setEmail("");
        },
        onError: () => {
          toast.error(t("home.newsletter_new.error", "تعذّر إتمام الاشتراك، حاول مرة أخرى"));
        },
      },
    );
  };

  return (
    <section className="mt-11 bg-[#F7F4FD] py-14">
      <div className={CONTAINER}>
        <div className="relative grid grid-cols-1 items-center gap-9 overflow-hidden rounded-[24px] bg-[#2E1065] p-7 sm:p-11 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="pointer-events-none absolute -bottom-32 -start-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(226,104,15,0.45),transparent_70%)]" />

          <div className="relative flex flex-col items-start gap-3">
            <span className="text-[12px] font-bold tracking-[0.04em] text-[#F0A868]">
              {t("home.newsletter_new.eyebrow", "النشرة البريدية")}
            </span>
            <h3 className="m-0 text-[24px] sm:text-[30px] font-bold leading-[1.35] text-white">
              {title || t("home.newsletter_new.title", "ابق على تواصل مع أقوى العروض")}
            </h3>
            <p className="m-0 max-w-[44ch] text-[14.5px] leading-[1.85] text-[#D6CEEB]">
              {description ||
                t(
                  "home.newsletter_new.body",
                  "اشترك ليصلك بريد أسبوعي واحد يجمع أفضل الكوبونات والخصومات في مدينتك، دون رسائل مزعجة.",
                )}
            </p>
          </div>

          <form
            onSubmit={submit}
            className="relative flex flex-col gap-3 rounded-[18px] bg-white p-[22px]"
          >
            <span className="text-[13px] font-semibold text-[#3D374E]">
              {t("home.newsletter_new.label", "بريدك الإلكتروني")}
            </span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              dir="ltr"
              className="h-[50px] rounded-[12px] border border-[#E1D9F3] bg-[#FBF9FF] px-4 text-[14px] outline-none focus:border-[#C9BCEC]"
            />
            <button
              type="submit"
              disabled={isPending}
              className={`h-[48px] rounded-[12px] text-[14px] font-bold transition-colors disabled:opacity-60 ${
                subscribed
                  ? "bg-[#FEF0E4] text-[#C2410C]"
                  : "bg-[#E2680F] text-white hover:bg-[#C85A0B]"
              }`}
            >
              {subscribed
                ? `${t("home.newsletter_new.done", "تم الاشتراك")} ✓`
                : t("home.newsletter_new.cta", "اشترك")}
            </button>
            <span className="text-[11.5px] leading-[1.7] text-[#8B84A0]">
              {t(
                "home.newsletter_new.privacy",
                "بالاشتراك أنت توافق على سياسة الخصوصية. يمكنك إلغاء الاشتراك في أي وقت.",
              )}
            </span>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
