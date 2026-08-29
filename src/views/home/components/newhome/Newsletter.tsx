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
    <section className="mt-11 bg-grad-mist py-14">
      <div className={CONTAINER}>
        <div className="relative grid grid-cols-1 items-center gap-9 overflow-hidden rounded-mk-3xl bg-grad-night p-7 shadow-[0_28px_64px_-30px_rgba(27,17,80,0.95)] sm:p-11 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="pointer-events-none absolute -bottom-32 -start-20 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(253,103,26,0.55),transparent_70%)]" />
          <div className="pointer-events-none absolute -top-28 end-[6%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(103,3,235,0.5),transparent_70%)]" />

          <div className="relative flex flex-col items-start gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-[#FFA23A]">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-grad-accent" />
              {t("home.newsletter_new.eyebrow", "النشرة البريدية")}
            </span>
            <h3 className="m-0 text-[26px] font-extrabold leading-[1.3] tracking-[-0.015em] text-white sm:text-[34px]">
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
            className="relative flex flex-col gap-3 rounded-mk-2xl bg-white p-[22px] shadow-[0_20px_48px_-20px_rgba(9,3,32,0.7)]"
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
              className="h-[52px] rounded-mk-md border border-[#E1D9F3] bg-[#FBF9FF] px-4 text-[14px] outline-none transition-colors duration-200 focus:border-[#C9BCEC]"
            />
            <button
              type="submit"
              disabled={isPending}
              className={`mk-shine h-[52px] rounded-mk-md text-[14.5px] font-extrabold transition-all duration-200 ease-out disabled:opacity-60 ${
                subscribed
                  ? "bg-grad-success text-white"
                  : "bg-grad-accent text-white shadow-mk-glow-accent hover:-translate-y-0.5"
              }`}
            >
              {subscribed
                ? `${t("home.newsletter_new.done", "تم الاشتراك")} ✓`
                : t("home.newsletter_new.cta", "اشترك")}
            </button>
            <span className="text-[11.5px] leading-[1.7] text-[#9A99B0]">
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
