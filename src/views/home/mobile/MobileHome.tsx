"use client";

import { useState } from "react";
import { Link, useNavigate } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import {
  LuTag,
  LuTicketPercent,
  LuCreditCard,
  LuMapPin,
  LuLayoutGrid,
  LuStore,
  LuSearch,
  LuFlame,
  LuArrowLeft,
} from "react-icons/lu";
import {
  PromoSection,
  isPromoVisible,
  MobileSection,
  HScroll,
  SmartImage,
  Ratio,
  StatChips,
  PriceTag,
  Badge,
  Button,
  Skeleton,
  ShareButton,
  CouponTile,
  type CouponTileData,
  pick,
  FOCUS,
  type PromoConfig,
} from "@ui";
import {
  useCouponCopy,
  useNewsletterSubscribe,
} from "@hooks/api/useMokafaatQueries";
import { buildOfferUrl } from "@utils/offerUrl";
import { toast } from "react-toastify";

type Dict = Record<string, any>;

interface Props {
  home: Dict;
  /** أثناء أول تحميل نعرض هيكلاً بنفس أبعاد الأقسام (بلا قفزات تخطيط) */
  isLoading?: boolean;
}

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

/**
 * الصفحة الرئيسية لنسخة الموبايل — تخطيط تطبيق جوال بالاتجاه «الحيوي التجاري»:
 * تدرّجات قوية، شارات خصم بارزة، كروت ملوّنة، وحركة عند اللمس.
 * كل الصفوف الأفقية داخل حاويات `HScroll` حتى لا تمرّر الصفحة أفقياً.
 */
const MobileHome: React.FC<Props> = ({ home, isLoading = false }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [copied, setCopied] = useState<string | null>(null);
  const couponCopy = useCouponCopy();
  /** تجاوزات محلية لعدّاد النسخ (زيادة تفاؤلية) */
  const [copies, setCopies] = useState<Record<string, number>>({});
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

  /** الأقسام الترويجية من لوحة التحكم مرتّبة بـ sort_order */
  const promos = Object.entries(
    (home.home_sections ?? {}) as Record<string, PromoConfig>,
  )
    .map(([key, config]) => ({ key, config: { ...config, key } }))
    .filter(({ config }) => isPromoVisible(config))
    .sort((a, b) => Number(a.config.sort_order ?? 99) - Number(b.config.sort_order ?? 99));

  const quickLinks = [
    { icon: LuTag, label: t("home.navbar.offers", "العروض"), to: "/offers" },
    { icon: LuTicketPercent, label: t("home.navbar.coupons", "كوبونز"), to: "/coupons" },
    { icon: LuCreditCard, label: t("home.navbar.cards", "البطاقات"), to: "/cards" },
    { icon: LuMapPin, label: t("home.services_new.nearby.title", "الأقرب إليك"), to: "/offers?sort=nearest" },
  ];

  const copyCode = async (coupon: Dict, code: string) => {
    // زيادة تفاؤلية فورية ثم تسجيل النسخة في الخادم (fire-and-forget)
    const key = String(coupon.id);
    const base = Number(coupon.copies_count ?? 0) || 0;
    setCopies((prev) => ({ ...prev, [key]: (prev[key] ?? base) + 1 }));
    couponCopy.mutate(coupon.id, {
      onSuccess: (serverCount) => {
        if (typeof serverCount === "number")
          setCopies((prev) => ({ ...prev, [key]: serverCount }));
      },
    });

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

  if (isLoading) {
    return (
      <div className="overflow-x-clip bg-mk-bg pb-8 lg:hidden" role="status" aria-label="loading">
        <Skeleton className="h-[186px] w-full rounded-none rounded-b-mk-3xl" />
        <div className="-mt-10 px-4">
          <Skeleton className="h-[100px] w-full rounded-mk-xl" />
        </div>
        <div className="mt-6 px-4">
          <Skeleton className="aspect-[16/9] w-full rounded-mk-xl" />
        </div>
        <div className="mt-7 grid grid-cols-4 gap-3 px-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-[90px] w-full rounded-mk-md" />
          ))}
        </div>
        <div className="mt-7 flex gap-3 overflow-hidden px-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-[62vw] shrink-0 rounded-mk-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-clip bg-mk-bg pb-8 lg:hidden">
      {/* ===== الترويسة: تدرّج عميق + هالات + بحث ===== */}
      <section className="relative isolate overflow-hidden rounded-b-mk-3xl bg-grad-brand-deep px-4 pb-14 pt-5 text-white shadow-mk-glow">
        <span
          aria-hidden
          className="pointer-events-none absolute -top-24 end-[-70px] h-56 w-56 rounded-full bg-mk-accent/40 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-24 start-[-60px] h-52 w-52 rounded-full bg-mk-primary-light/50 blur-3xl"
        />

        <div className="relative">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-[11px] font-bold backdrop-blur-sm">
            <LuFlame size={13} className="text-mk-accent-light" aria-hidden />
            {t("home.hero_new.tag", "عروض مختارة")}
          </span>
          <h1 className="mb-4 mt-2.5 text-[24px] font-bold leading-snug">
            {t("home.hero_new.title", "كل مزاياك في مكان واحد")}
          </h1>

          <button
            type="button"
            onClick={() => navigate("/offers")}
            className={`flex min-h-[50px] w-full items-center gap-2.5 rounded-mk-md bg-white px-4 text-start text-[13.5px] font-medium text-mk-faint shadow-mk-float active:scale-[0.99] ${FOCUS}`}
          >
            <LuSearch size={18} className="shrink-0 text-mk-accent" aria-hidden />
            <span className="min-w-0 flex-1 truncate">
              {t("home.search_new.placeholder", "ابحث عن متجر، مطعم، عرض...")}
            </span>
            <span
              aria-hidden
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-grad-accent text-white shadow-mk-badge"
            >
              <LuArrowLeft size={15} className="ltr:rotate-180" />
            </span>
          </button>
        </div>
      </section>

      {/* ===== اختصارات تطفو فوق الترويسة (z-10 لأن الترويسة تنشئ سياق تراص) ===== */}
      <section className="relative z-10 -mt-10 px-4">
        <div className="grid grid-cols-4 gap-2 rounded-mk-xl border border-mk-border bg-white p-3 shadow-mk-pop">
          {quickLinks.map((item, i) => {
            const color = pick(i);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex min-h-[80px] flex-col items-center justify-center gap-1.5 rounded-mk-md transition-transform active:scale-[0.95] ${FOCUS}`}
              >
                <span
                  aria-hidden
                  className="flex h-12 w-12 items-center justify-center rounded-mk-md text-white"
                  style={{
                    backgroundImage: `linear-gradient(135deg, ${color.c} 0%, ${color.c}C0 100%)`,
                    boxShadow: `0 10px 20px -10px ${color.c}`,
                  }}
                >
                  <Icon size={21} />
                </span>
                <span className="text-center text-[11px] font-bold text-mk-text-strong">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ===== بانرات — الصورة والنصوص من لوحة التحكم ===== */}
      {sliders.length > 0 && (
        <MobileSection flush>
          <HScroll>
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
                  type="button"
                  onClick={() => {
                    if (!href) return;
                    if (/^https?:\/\//i.test(href)) {
                      window.open(href, "_blank", "noopener,noreferrer");
                      return;
                    }
                    navigate(href);
                  }}
                  className={`relative w-[85vw] max-w-[420px] shrink-0 snap-start overflow-hidden rounded-mk-xl bg-mk-deep text-start shadow-mk-raised transition-transform active:scale-[0.985] ${FOCUS}`}
                >
                  <Ratio ratio="aspect-[16/9]">
                    <SmartImage
                      src={slide.image}
                      name={slide.title ?? ""}
                      alt={slide.title ?? ""}
                      variant="name"
                      bg="#2B1B5E"
                      color="#fff"
                    />
                  </Ratio>

                  {!imageOnly && (
                    <>
                      <span
                        aria-hidden
                        className="absolute inset-0 bg-[linear-gradient(to_top,rgba(20,8,50,0.9),rgba(20,8,50,0.05))]"
                      />
                      <span className="absolute inset-x-4 bottom-4 flex flex-col gap-1">
                        {slide.title && (
                          <span className="text-[16px] font-bold text-white">{slide.title}</span>
                        )}
                        {slide.description && (
                          <span className="mk-clamp-2 text-[11.5px] text-mk-lilac">
                            {slide.description}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </HScroll>
        </MobileSection>
      )}

      {/* ===== التصنيفات ===== */}
      {categories.length > 0 && (
        <MobileSection title={t("home.categories_new.title", "التصنيفات")} to="/offers">
          <div className="grid grid-cols-4 gap-2.5">
            {categories.slice(0, 8).map((category, i) => {
              const color = pick(i);
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() =>
                    navigate(category.slug ? `/offers/${category.slug}` : `/offers?category=${category.id}`)
                  }
                  className={`mk-lift flex min-h-[92px] flex-col items-center justify-center gap-2 rounded-mk-md border border-mk-border bg-white p-2 shadow-mk-card active:scale-[0.96] ${FOCUS}`}
                >
                  <span
                    aria-hidden
                    className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full"
                    style={{ background: color.bg, color: color.c }}
                  >
                    {category.image ? (
                      <img src={category.image} alt="" loading="lazy" className="h-6 w-6 object-contain" />
                    ) : (
                      <LuLayoutGrid size={21} />
                    )}
                  </span>
                  <span className="mk-clamp-2 text-center text-[10.5px] font-bold leading-tight text-mk-text-strong">
                    {category.name}
                  </span>
                </button>
              );
            })}
          </div>
        </MobileSection>
      )}

      {/* ===== عروض مميزة — تمرير أفقي ===== */}
      {offers.length > 0 && (
        <MobileSection title={t("home.offers_new.title", "أحدث وأقوى العروض")} to="/offers" flush>
          <HScroll>
            {offers.slice(0, 10).map((offer) => {
              const percent = percentOf(offer);
              return (
                <div
                  key={offer.id}
                  className="mk-lift relative w-[62vw] max-w-[300px] shrink-0 snap-start overflow-hidden rounded-mk-lg border border-mk-border bg-white shadow-mk-card"
                >
                  <Link to={buildOfferUrl(offer)} className={`mk-zoom block ${FOCUS}`}>
                    <div className="relative border-b border-mk-border bg-mk-tint2">
                      <Ratio ratio="aspect-[16/10]">
                        <SmartImage
                          src={offer.image}
                          name={offer.name ?? ""}
                          alt={offer.name ?? ""}
                          variant="name"
                          bg="#F2EFFA"
                        />
                      </Ratio>
                      {percent > 0 && (
                        <span className="absolute start-2 top-2">
                          <Badge tone="grad-accent" size="sm">
                            {percent}%
                          </Badge>
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 p-3">
                      <span className="mk-clamp-1 text-[13.5px] font-bold text-mk-text">
                        {offer.name}
                      </span>
                      <span className="mk-clamp-1 text-[11.5px] text-mk-faint">
                        {offer.merchant?.name ?? offer.category?.name ?? ""}
                      </span>
                      {/* السعر مع شطب سعر ما قبل الخصم */}
                      <PriceTag
                        size="sm"
                        price={offer.price_after ?? offer.price}
                        priceBefore={offer.price_before}
                        freeLabel={
                          offer.pricing_type === "free"
                            ? t("offerCard.free", "بدون رسوم")
                            : undefined
                        }
                      />
                      {/* مشاهدات / مفضلة / مشاركات */}
                      <StatChips
                        compact
                        views={offer.views_count}
                        favorites={offer.favorites_count}
                        shares={offer.shares_count}
                      />
                    </div>
                  </Link>
                  <div className="absolute end-2 top-2 z-10">
                    <ShareButton
                      size="sm"
                      tone="overlay"
                      title={offer.name ?? ""}
                      url={
                        typeof window !== "undefined"
                          ? `${window.location.origin}${buildOfferUrl(offer)}`
                          : undefined
                      }
                    />
                  </div>
                </div>
              );
            })}
          </HScroll>
        </MobileSection>
      )}

      {/* ===== كوبونات ===== */}
      {coupons.length > 0 && (
        <MobileSection title={t("home.coupons_new.title", "كوبونات وأكواد خصم")} to="/coupons">
          <div className="flex flex-col gap-3">
            {coupons.slice(0, 4).map((coupon, i) => {
              const code = coupon.coupon_code ?? "";
              return (
                <CouponTile
                  key={coupon.id}
                  coupon={coupon as CouponTileData}
                  index={i}
                  layout="row"
                  copiesCount={copies[String(coupon.id)]}
                  copied={!!code && copied === code}
                  onCopy={(c) => copyCode(coupon, c)}
                />
              );
            })}
          </div>
        </MobileSection>
      )}

      {/* ===== الأقرب إليك ===== */}
      {nearby.length > 0 && (
        <MobileSection title={t("home.nearby_new.title", "الأقرب إليك")} to="/offers?sort=nearest">
          <div className="flex flex-col gap-2.5">
            {nearby.slice(0, 3).map((place) => (
              <Link
                key={place.id}
                to={`/offers?merchant=${place.id}`}
                className={`mk-lift flex min-h-[74px] items-center gap-3 rounded-mk-lg border border-mk-border bg-white p-3 shadow-mk-card active:scale-[0.99] ${FOCUS}`}
              >
                <span className="h-12 w-12 shrink-0 overflow-hidden rounded-mk-md bg-mk-tint2">
                  <SmartImage
                    src={place.logo || place.cover_image}
                    name={place.name}
                    alt=""
                    className="h-full w-full text-[16px]"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="mk-clamp-1 block text-[13.5px] font-bold text-mk-text">
                    {place.name}
                  </span>
                  <span className="block text-[11.5px] text-mk-faint">{place.type ?? ""}</span>
                </span>
                {place.distance_km != null && (
                  <Badge tone="grad-primary" size="sm" className="shrink-0">
                    <span dir="ltr">{place.distance_km} km</span>
                  </Badge>
                )}
              </Link>
            ))}
          </div>
        </MobileSection>
      )}

      {/* ===== أفضل المطاعم ===== */}
      {restaurants.length > 0 && (
        <MobileSection title={t("home.restaurants_new.title", "أفضل المطاعم")} to="/offers" flush>
          <HScroll snap={false}>
            {restaurants.slice(0, 8).map((restaurant) => (
              <Link
                key={restaurant.id}
                to={`/offers?merchant=${restaurant.id}`}
                className={`mk-lift mk-zoom w-[42vw] max-w-[190px] shrink-0 overflow-hidden rounded-mk-lg border border-mk-border bg-white shadow-mk-card ${FOCUS}`}
              >
                <div className="border-b border-mk-border bg-mk-tint2">
                  <Ratio ratio="aspect-[4/3]">
                    <SmartImage
                      src={restaurant.cover_image || restaurant.logo}
                      name={restaurant.name}
                      alt={restaurant.name ?? ""}
                      variant="name"
                      bg="#F2EFFA"
                    />
                  </Ratio>
                </div>
                <div className="p-2.5">
                  <span className="mk-clamp-1 text-[12.5px] font-bold text-mk-text">
                    {restaurant.name}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-mk-faint">
                    {restaurant.branches_count ?? 0} {t("home.restaurants_new.branches", "فرع")}
                  </span>
                </div>
              </Link>
            ))}
          </HScroll>
        </MobileSection>
      )}

      {/* ===== الأكثر استخداماً ===== */}
      {merchants.length > 0 && (
        <MobileSection title={t("home.stores_new.title", "الأكثر استخداماً")} to="/offers" flush>
          <HScroll snap={false}>
            {merchants.slice(0, 10).map((merchant) => (
              <Link
                key={merchant.id}
                to={`/offers?merchant=${merchant.id}`}
                className={`flex w-[74px] shrink-0 flex-col items-center gap-1.5 rounded-mk-md transition-transform active:scale-[0.95] ${FOCUS}`}
              >
                <span className="flex h-[64px] w-[64px] items-center justify-center overflow-hidden rounded-mk-md border border-mk-border bg-white shadow-mk-card">
                  {merchant.logo ? (
                    <SmartImage
                      src={merchant.logo}
                      name={merchant.name}
                      alt=""
                      objectFit="contain"
                      className="h-full w-full p-2 text-[15px]"
                      bg="#FFFFFF"
                    />
                  ) : (
                    <LuStore size={22} className="text-mk-primary" aria-hidden />
                  )}
                </span>
                <span className="mk-clamp-1 w-full text-center text-[10.5px] font-bold text-mk-text-strong">
                  {merchant.name}
                </span>
              </Link>
            ))}
          </HScroll>
        </MobileSection>
      )}

      {/* ===== بانر VIP + جديد مكافآت (من home_sections في اللوحة) ===== */}
      {promos.length > 0 && (
        <MobileSection>
          <div className="flex flex-col gap-3">
            {promos.map(({ key, config }) => (
              <PromoSection
                key={key}
                config={config}
                layout={key === "vip_banner" ? "banner" : "card"}
              />
            ))}
          </div>
        </MobileSection>
      )}

      {/* ===== المدونة ===== */}
      {news.length > 0 && (
        <MobileSection title={t("home.blog_new.title", "الأخبار والمدونات")} to="/blogs" flush>
          <HScroll snap={false}>
            {news.slice(0, 5).map((post) => (
              <Link
                key={post.id}
                to={`/blogs/${post.slug ?? post.id}`}
                className={`mk-lift mk-zoom w-[70vw] max-w-[320px] shrink-0 overflow-hidden rounded-mk-lg border border-mk-border bg-white shadow-mk-card ${FOCUS}`}
              >
                <div className="border-b border-mk-border bg-mk-tint2">
                  <Ratio ratio="aspect-[16/9]">
                    <SmartImage
                      src={post.image}
                      name={post.title ?? ""}
                      alt={post.title ?? ""}
                      variant="name"
                      bg="#F2EFFA"
                    />
                  </Ratio>
                </div>
                <div className="p-3">
                  <span className="mk-clamp-2 text-[13px] font-bold leading-snug text-mk-text">
                    {post.title}
                  </span>
                  <span className="mt-1 block text-[10.5px] text-mk-faint" dir="ltr">
                    {post.published_at}
                  </span>
                </div>
              </Link>
            ))}
          </HScroll>
        </MobileSection>
      )}

      {/* ===== للشركات ===== */}
      <MobileSection>
        <div className="relative isolate overflow-hidden rounded-mk-xl bg-grad-night p-5 text-white shadow-mk-glow">
          {sections?.corporate?.image && (
            <img
              src={sections.corporate.image}
              alt=""
              loading="lazy"
              aria-hidden
              className="absolute inset-0 -z-10 h-full w-full object-cover opacity-25"
            />
          )}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-16 end-[-40px] h-40 w-40 rounded-full bg-mk-accent/35 blur-3xl"
          />
          <div className="relative">
            <h3 className="m-0 text-[17px] font-bold">
              {sections?.corporate?.title || t("home.corporate_new.title", "للشركات والجهات الحكومية")}
            </h3>
            <p className="mb-3.5 mt-1.5 text-[12.5px] leading-relaxed text-mk-lilac">
              {sections?.corporate?.description ||
                t("home.corporate_new.body", "برنامج مزايا مخصص لموظفيك على منصة واحدة.")}
            </p>
            <Button
              to={sections?.corporate?.cta_link || "/contact"}
              size="sm"
              variant="accent"
              className="mk-shine"
            >
              {sections?.corporate?.cta_label || t("home.corporate_new.cta", "اطلب عرض سعر")}
            </Button>
          </div>
        </div>
      </MobileSection>

      {/* ===== النشرة البريدية ===== */}
      <section className="mt-4 px-4">
        <form
          onSubmit={submitNewsletter}
          className="rounded-mk-xl border border-[#FBE3C4] bg-grad-warm p-4 shadow-mk-card"
        >
          <p className="m-0 inline-flex items-center gap-1.5 rounded-full bg-grad-accent px-2.5 py-1 text-[10.5px] font-bold tracking-wide text-white shadow-mk-badge">
            {t("home.newsletter_new.eyebrow", "النشرة البريدية")}
          </p>
          <h3 className="mb-3 mt-2 text-[15.5px] font-bold text-mk-text">
            {sections?.newsletter?.title || t("home.newsletter_new.title", "ابق على تواصل مع أقوى العروض")}
          </h3>
          <label className="sr-only" htmlFor="mk-mobile-newsletter">
            {t("home.newsletter_new.eyebrow", "النشرة البريدية")}
          </label>
          <input
            id="mk-mobile-newsletter"
            type="email"
            dir="ltr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="mb-2 h-12 w-full rounded-mk-md border border-mk-border-strong bg-white px-4 text-[13.5px] text-mk-text outline-none placeholder:text-mk-faint focus:border-mk-accent"
          />
          <Button
            type="submit"
            block
            loading={isPending}
            variant={subscribed ? "soft" : "accent"}
            className={subscribed ? "" : "mk-shine"}
          >
            {subscribed
              ? `${t("home.newsletter_new.done", "تم الاشتراك")} ✓`
              : t("home.newsletter_new.cta", "اشترك")}
          </Button>
        </form>
      </section>

      {/* ===== إحصائيات مختصرة ===== */}
      {stats.length > 0 && (
        <section className="mt-4 px-4">
          <div className="grid grid-cols-2 gap-2.5">
            {stats.slice(0, 4).map((stat, i) => {
              const color = pick(i);
              return (
                <div
                  key={`${stat.label}-${i}`}
                  className="rounded-mk-md border border-mk-border bg-white p-3 shadow-mk-card"
                  style={{ borderBottom: `3px solid ${color.c}` }}
                >
                  <span
                    className="block text-[18px] font-bold tabular-nums"
                    style={{ color: color.c }}
                    dir="ltr"
                  >
                    {stat.value}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-mk-muted">{stat.label}</span>
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
