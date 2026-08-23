"use client";

import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import {
  LuTag,
  LuTicketPercent,
  LuCreditCard,
  LuMapPin,
  LuChevronLeft,
  LuLayoutGrid,
  LuStore,
  LuCopy,
  LuCheck,
} from "react-icons/lu";
import { pick } from "../components/newhome/tokens";
import BrandImage from "../components/newhome/BrandImage";
import { useNewsletterSubscribe } from "@hooks/api/useMokafaatQueries";
import { buildOfferUrl } from "@utils/offerUrl";
import { toast } from "react-toastify";

type Dict = Record<string, any>;

interface Props {
  home: Dict;
}

/** ترويسة قسم بأسلوب التطبيق: عنوان + «الكل ‹» */
const Head: React.FC<{ title: string; to?: string }> = ({ title, to }) => {
  const { t } = useTranslation();
  return (
    <div className="mb-3 flex items-center justify-between px-4">
      <h2 className="m-0 text-[16px] font-bold text-[#17122A]">{title}</h2>
      {to && (
        <Link to={to} className="flex items-center gap-0.5 text-[12.5px] font-semibold text-[#4C1D95]">
          {t("home.categories_new.all", "الكل")}
          <LuChevronLeft size={15} />
        </Link>
      )}
    </div>
  );
};

const percentOf = (offer: Dict): number => {
  const raw = Number(offer?.discount_percent ?? 0);
  if (raw > 0) return Math.round(raw);
  const before = Number(offer?.price_before ?? 0);
  const after = Number(offer?.price_after ?? 0);
  if (before > 0 && after > 0 && after < before) {
    return Math.round(((before - after) / before) * 100);
  }
  return 0;
};

/** الصفحة الرئيسية لنسخة الموبايل — تخطيط تطبيق جوال مستقل عن تصميم الديسكتوب */
const MobileHome: React.FC<Props> = ({ home }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const { mutate: subscribe, isPending } = useNewsletterSubscribe();

  const sliders: Dict[] = home.sliders ?? [];
  const categories: Dict[] = home.categories ?? [];
  const offers: Dict[] = [...(home.offers?.new ?? []), ...(home.offers?.today ?? [])].filter(
    (offer, index, all) => all.findIndex((o) => o.id === offer.id) === index,
  );
  const coupons: Dict[] = home.coupons?.all ?? [];
  const merchants: Dict[] = home.merchants ?? [];
  const restaurants: Dict[] = home.restaurants ?? [];
  const nearby: Dict[] = home.nearby ?? [];
  const news: Dict[] = home.news ?? [];
  const stats: Dict[] = home.stats ?? [];
  const sections: Dict = home.sections ?? {};

  const quickLinks = [
    { icon: LuTag, label: t("home.navbar.offers", "العروض"), to: "/offers" },
    { icon: LuTicketPercent, label: t("home.navbar.coupons", "كوبونز"), to: "/coupons" },
    { icon: LuCreditCard, label: t("home.navbar.cards", "البطاقات"), to: "/cards" },
    { icon: LuMapPin, label: t("home.services_new.nearby.title", "الأقرب إليك"), to: "/offers?sort=nearest" },
  ];

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* تجاهل */
    }
    setCopied(code);
    setTimeout(() => setCopied((c) => (c === code ? null : c)), 2000);
  };

  const submitNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    subscribe(
      { email: value, source: "mobile_home" },
      {
        onSuccess: () => {
          setSubscribed(true);
          setEmail("");
        },
        onError: () => toast.error(t("home.newsletter_new.error", "تعذّر إتمام الاشتراك")),
      },
    );
  };

  return (
    <div className="bg-[#FBFAFE] pb-8 lg:hidden">
      {/* بطاقة الترحيب + الاختصارات */}
      <section className="rounded-b-[28px] bg-[linear-gradient(160deg,#3B1C7D,#4C1D95_55%,#6D28D9)] px-4 pb-14 pt-4 text-white">
        <p className="m-0 text-[13px] text-[#C4B5FD]">
          {t("home.hero_new.tag", "عروض مختارة")}
        </p>
        <h1 className="mb-4 mt-1 text-[22px] font-bold leading-snug">
          {t("home.hero_new.title", "كل مزاياك في مكان واحد")}
        </h1>

        <button
          onClick={() => navigate("/offers")}
          className="flex w-full items-center gap-2 rounded-2xl bg-white/95 px-4 py-3 text-start text-[13.5px] text-[#8B84A0] shadow-[0_10px_24px_rgba(20,8,50,0.18)]"
        >
          <LuLayoutGrid size={17} className="text-[#4C1D95]" />
          {t("home.search_new.placeholder", "ابحث عن متجر، مطعم، عرض...")}
        </button>
      </section>

      {/* اختصارات دائرية تطفو فوق الترويسة */}
      <section className="-mt-10 px-4">
        <div className="grid grid-cols-4 gap-2 rounded-3xl border border-[#EDE9F7] bg-white p-3 shadow-[0_10px_30px_rgba(46,16,101,0.08)]">
          {quickLinks.map((item, i) => {
            const color = pick(i);
            const Icon = item.icon;
            return (
              <Link key={item.to} to={item.to} className="flex flex-col items-center gap-1.5">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl"
                  style={{ background: color.bg, color: color.c }}
                >
                  <Icon size={21} />
                </span>
                <span className="text-center text-[11px] font-semibold text-[#3D374E]">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* بانرات — الصورة والنصوص من لوحة التحكم، ونوع السلايد يحدد التعتيم */}
      {sliders.length > 0 && (
        <section className="mt-6">
          <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
            {sliders.map((slide) => {
              const imageOnly = slide.display_type === "image";
              const href =
                slide.link_url ||
                (slide.link_type === "category" && slide.link_id
                  ? `/offers?category=${slide.link_id}`
                  : slide.link_type === "none"
                    ? null
                    : "/offers");

              return (
                <button
                  key={slide.id}
                  onClick={() => {
                    if (!href) return;
                    if (/^https?:\/\//i.test(href)) {
                      window.open(href, "_blank", "noopener,noreferrer");
                      return;
                    }
                    navigate(href);
                  }}
                  className="relative aspect-[16/9] w-[85vw] shrink-0 snap-start overflow-hidden rounded-3xl bg-[#2E1065] text-start"
                >
                  <BrandImage
                    src={slide.image}
                    name={slide.title ?? ""}
                    variant="name"
                    className="h-full w-full"
                    bg="#2E1065"
                    color="#fff"
                  />

                  {!imageOnly && (
                    <>
                      <span className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,8,50,0.85),rgba(20,8,50,0.05))]" />
                      <span className="absolute inset-x-4 bottom-4 flex flex-col gap-1">
                        {slide.title && (
                          <span className="text-[15px] font-bold text-white">{slide.title}</span>
                        )}
                        {slide.description && (
                          <span className="line-clamp-2 text-[11.5px] text-[#E3DCF4]">
                            {slide.description}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* التصنيفات */}
      {categories.length > 0 && (
        <section className="mt-7">
          <Head title={t("home.categories_new.title", "التصنيفات")} to="/offers" />
          <div className="grid grid-cols-4 gap-3 px-4">
            {categories.slice(0, 8).map((category, i) => {
              const color = pick(i);
              return (
                <button
                  key={category.id}
                  onClick={() =>
                    navigate(category.slug ? `/offers/${category.slug}` : `/offers?category=${category.id}`)
                  }
                  className="flex flex-col items-center gap-2 rounded-2xl bg-white p-2.5 shadow-[0_2px_10px_rgba(46,16,101,0.05)]"
                >
                  <span
                    className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full"
                    style={{ background: color.bg, color: color.c }}
                  >
                    {category.image ? (
                      <img src={category.image} alt="" className="h-6 w-6 object-contain" />
                    ) : (
                      <LuLayoutGrid size={20} />
                    )}
                  </span>
                  <span className="line-clamp-2 text-center text-[10.5px] font-semibold leading-tight text-[#3D374E]">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* عروض مميزة — تمرير أفقي */}
      {offers.length > 0 && (
        <section className="mt-7">
          <Head title={t("home.offers_new.title", "أحدث وأقوى العروض")} to="/offers" />
          <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
            {offers.slice(0, 10).map((offer, i) => {
              const percent = percentOf(offer);
              const color = pick(i + 1);
              return (
                <Link
                  key={offer.id}
                  to={buildOfferUrl(offer)}
                  className="w-[62vw] shrink-0 snap-start overflow-hidden rounded-3xl border border-[#EDE9F7] bg-white"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#F6F3FC]">
                    <BrandImage
                      src={offer.image}
                      name={offer.name ?? ""}
                      variant="name"
                      className="h-full w-full"
                      bg="#F6F3FC"
                    />
                    {percent > 0 && (
                      <span
                        className="absolute top-2 end-2 rounded-full px-2 py-0.5 text-[11px] font-bold text-white"
                        style={{ background: color.c }}
                      >
                        {percent}%
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 p-3">
                    <span className="line-clamp-1 text-[13.5px] font-bold text-[#17122A]">
                      {offer.name}
                    </span>
                    <span className="line-clamp-1 text-[11.5px] text-[#8B84A0]">
                      {offer.merchant?.name ?? offer.category?.name ?? ""}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* كوبونات */}
      {coupons.length > 0 && (
        <section className="mt-7">
          <Head title={t("home.coupons_new.title", "كوبونات وأكواد خصم")} to="/coupons" />
          <div className="flex flex-col gap-3 px-4">
            {coupons.slice(0, 4).map((coupon, i) => {
              const color = pick(i);
              const code = coupon.coupon_code ?? "";
              const isCopied = copied === code && !!code;
              return (
                <div
                  key={coupon.id}
                  className="flex items-center gap-3 rounded-2xl border border-[#EDE9F7] bg-white p-3"
                >
                  <BrandImage
                    src={coupon.image || coupon.merchant?.logo}
                    name={coupon.merchant?.name ?? coupon.title ?? ""}
                    className="h-12 w-12 shrink-0 rounded-xl text-[16px]"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 line-clamp-1 text-[13.5px] font-bold text-[#17122A]">
                      {coupon.merchant?.name ?? coupon.title}
                    </p>
                    <p className="m-0 line-clamp-1 text-[11.5px] text-[#8B84A0]">
                      {coupon.description ?? coupon.title ?? ""}
                    </p>
                  </div>
                  {code && (
                    <button
                      onClick={() => copyCode(code)}
                      className="flex shrink-0 items-center gap-1 rounded-xl px-3 py-2 text-[11.5px] font-bold text-white"
                      style={{ background: isCopied ? "#0E9384" : color.c }}
                    >
                      {isCopied ? <LuCheck size={14} /> : <LuCopy size={14} />}
                      <span className="font-mono">{isCopied ? t("home.coupons_new.copied", "تم النسخ") : code}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* الأقرب إليك */}
      {nearby.length > 0 && (
        <section className="mt-7">
          <Head title={t("home.nearby_new.title", "الأقرب إليك")} to="/offers?sort=nearest" />
          <div className="flex flex-col gap-2.5 px-4">
            {nearby.slice(0, 3).map((place) => (
              <Link
                key={place.id}
                to={`/offers?merchant=${place.id}`}
                className="flex items-center gap-3 rounded-2xl border border-[#EDE9F7] bg-white p-3"
              >
                <BrandImage
                  src={place.logo || place.cover_image}
                  name={place.name}
                  className="h-12 w-12 shrink-0 rounded-xl text-[16px]"
                />
                <span className="min-w-0 flex-1">
                  <span className="block line-clamp-1 text-[13.5px] font-bold text-[#17122A]">
                    {place.name}
                  </span>
                  <span className="block text-[11.5px] text-[#8B84A0]">{place.type ?? ""}</span>
                </span>
                {place.distance_km != null && (
                  <span className="shrink-0 rounded-full bg-[#F1EBFB] px-2 py-1 text-[11px] font-semibold text-[#4C1D95]" dir="ltr">
                    {place.distance_km} km
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* أفضل المطاعم */}
      {restaurants.length > 0 && (
        <section className="mt-7">
          <Head title={t("home.restaurants_new.title", "أفضل المطاعم")} to="/offers" />
          <div className="no-scrollbar flex scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
            {restaurants.slice(0, 8).map((restaurant) => (
              <Link
                key={restaurant.id}
                to={`/offers?merchant=${restaurant.id}`}
                className="w-[42vw] shrink-0 overflow-hidden rounded-2xl border border-[#EDE9F7] bg-white"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-[#F6F3FC]">
                  <BrandImage
                    src={restaurant.cover_image || restaurant.logo}
                    name={restaurant.name}
                    variant="name"
                    className="h-full w-full"
                    bg="#F6F3FC"
                  />
                </div>
                <div className="p-2.5">
                  <span className="line-clamp-1 text-[12.5px] font-bold text-[#17122A]">
                    {restaurant.name}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-[#8B84A0]">
                    {restaurant.branches_count ?? 0} {t("home.restaurants_new.branches", "فرع")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* الأكثر استخداماً */}
      {merchants.length > 0 && (
        <section className="mt-7">
          <Head title={t("home.stores_new.title", "الأكثر استخداماً")} to="/offers" />
          <div className="no-scrollbar flex scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
            {merchants.slice(0, 10).map((merchant) => (
              <Link
                key={merchant.id}
                to={`/offers?merchant=${merchant.id}`}
                className="flex w-[72px] shrink-0 flex-col items-center gap-1.5"
              >
                <span className="flex h-[62px] w-[62px] items-center justify-center overflow-hidden rounded-2xl border border-[#EDE9F7] bg-white">
                  {merchant.logo ? (
                    <BrandImage
                      src={merchant.logo}
                      name={merchant.name}
                      objectFit="contain"
                      className="h-full w-full p-2 text-[15px]"
                      bg="#FFFFFF"
                    />
                  ) : (
                    <LuStore size={22} className="text-[#4C1D95]" />
                  )}
                </span>
                <span className="line-clamp-1 text-center text-[10.5px] font-semibold text-[#4A4459]">
                  {merchant.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* المدونة */}
      {news.length > 0 && (
        <section className="mt-7">
          <Head title={t("home.blog_new.title", "الأخبار والمدونات")} to="/blogs" />
          <div className="no-scrollbar flex scroll-px-4 gap-3 overflow-x-auto px-4 pb-1">
            {news.slice(0, 5).map((post) => (
              <Link
                key={post.id}
                to={`/blogs/${post.slug ?? post.id}`}
                className="w-[70vw] shrink-0 overflow-hidden rounded-2xl border border-[#EDE9F7] bg-white"
              >
                <div className="aspect-[16/9] w-full overflow-hidden bg-[#F6F3FC]">
                  <BrandImage
                    src={post.image}
                    name={post.title ?? ""}
                    variant="name"
                    className="h-full w-full"
                    bg="#F6F3FC"
                  />
                </div>
                <div className="p-3">
                  <span className="line-clamp-2 text-[13px] font-bold leading-snug text-[#17122A]">
                    {post.title}
                  </span>
                  <span className="mt-1 block text-[10.5px] text-[#8B84A0]" dir="ltr">
                    {post.published_at}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* للشركات */}
      <section className="mt-7 px-4">
        <div className="relative overflow-hidden rounded-3xl bg-[#2E1065] p-5 text-white">
          {sections?.corporate?.image && (
            <img
              src={sections.corporate.image}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-30"
            />
          )}
          <div className="relative">
            <h3 className="m-0 text-[17px] font-bold">
              {sections?.corporate?.title || t("home.corporate_new.title", "للشركات والجهات الحكومية")}
            </h3>
            <p className="mb-3 mt-1.5 text-[12.5px] leading-relaxed text-[#D6CEEB]">
              {sections?.corporate?.description ||
                t("home.corporate_new.body", "برنامج مزايا مخصص لموظفيك على منصة واحدة.")}
            </p>
            <Link
              to={sections?.corporate?.cta_link || "/contact"}
              className="inline-flex rounded-xl bg-white px-4 py-2.5 text-[12.5px] font-bold text-[#2E1065]"
            >
              {sections?.corporate?.cta_label || t("home.corporate_new.cta", "اطلب عرض سعر")}
            </Link>
          </div>
        </div>
      </section>

      {/* النشرة البريدية */}
      <section className="mt-4 px-4">
        <form
          onSubmit={submitNewsletter}
          className="rounded-3xl border border-[#EDE9F7] bg-white p-4"
        >
          <p className="m-0 text-[11.5px] font-bold tracking-wide text-[#E2680F]">
            {t("home.newsletter_new.eyebrow", "النشرة البريدية")}
          </p>
          <h3 className="mb-3 mt-1 text-[15px] font-bold text-[#17122A]">
            {sections?.newsletter?.title || t("home.newsletter_new.title", "ابق على تواصل مع أقوى العروض")}
          </h3>
          <input
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="mb-2 h-12 w-full rounded-2xl border border-[#E1D9F3] bg-[#FBF9FF] px-4 text-[13.5px] outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            className={`h-12 w-full rounded-2xl text-[13.5px] font-bold transition-colors ${
              subscribed ? "bg-[#FEF0E4] text-[#C2410C]" : "bg-[#E2680F] text-white"
            }`}
          >
            {subscribed
              ? `${t("home.newsletter_new.done", "تم الاشتراك")} ✓`
              : t("home.newsletter_new.cta", "اشترك")}
          </button>
        </form>
      </section>

      {/* إحصائيات مختصرة */}
      {stats.length > 0 && (
        <section className="mt-4 px-4">
          <div className="grid grid-cols-2 gap-2.5">
            {stats.slice(0, 4).map((stat, i) => {
              const color = pick(i);
              return (
                <div
                  key={`${stat.label}-${i}`}
                  className="rounded-2xl border border-[#EDE9F7] bg-white p-3"
                >
                  <span
                    className="block text-[16px] font-bold"
                    style={{ color: color.c }}
                    dir="ltr"
                  >
                    {stat.value}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-[#6B6480]">{stat.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};

export default MobileHome;
