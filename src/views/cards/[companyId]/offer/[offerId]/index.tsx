"use client";

import { useState, useMemo, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useIsRTL } from "@hooks";
import { useTranslation } from "react-i18next";
import {
  FiArrowLeft,
  FiTag,
  FiEye,
} from "react-icons/fi";
import { ShareIcon, HeartIcon } from "@ui";
import CurrencyIcon from "@components/CurrencyIcon";
import QuantitySelector from "@components/QuantitySelector";
import { stripHtml } from "@utils/stripHtml";
import { AboutPattern } from "@assets";
import { useUserStore } from "@stores/userStore";
import {
  useCardDetail,
  useFavorites,
  useFavoriteToggle,
} from "@hooks/api/useMokafaatQueries";
import { normalizeFavoritesList } from "@utils/favorites";
import { toast } from "react-toastify";
import OfferCard from "@views/cards/[companyId]/components/OfferCard";
import type { CardOffer } from "@data/cards";
import { useShareSheetStore } from "@stores/shareSheetStore";

type TabKey = "description" | "terms" | "features";

function mapApiRelatedToCardOffer(raw: Record<string, unknown>): CardOffer & { companyId: string } {
  const merchant = (raw.merchant as Record<string, unknown>) || {};
  const id = String(raw.id ?? "");
  const companyId = String(merchant.id ?? raw.merchant_id ?? id);
  return {
    id,
    companyId,
    title: { ar: String(raw.name ?? ""), en: String(raw.name ?? "") },
    description: {
      ar: String(raw.description ?? ""),
      en: String(raw.description ?? ""),
    },
    price: Number(raw.final_price ?? raw.price ?? 0),
    currency: "SAR",
    validity: {
      ar: String(raw.validity_type ?? ""),
      en: String(raw.validity_type ?? ""),
    },
    features: [],
    image: String(raw.image ?? ""),
    rating: 0,
    purchases: Number(raw.purchase_count ?? 0),
    views: Number(raw.views_count ?? 0),
    downloads: 0,
    bookmarks: 0,
    originalPrice: raw.old_price != null ? Number(raw.old_price) : undefined,
  };
}

const CardOfferDetailPage = () => {
  const { merchantSlug: companyId, cardSlug: offerId } = useParams<{ merchantSlug: string; cardSlug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isRTL = useIsRTL();
  const { t } = useTranslation();
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<TabKey>("description");
  const handleQuantityChange = useCallback((q: number) => setQuantity(q), []);

  const token = useUserStore((s) => s.token);
  const { data: cardDetailData, isLoading } = useCardDetail(offerId);
  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useFavoriteToggle();
  const openShare = useShareSheetStore((s) => s.openShare);
  const favoritesList = useMemo(
    () => normalizeFavoritesList(favoritesData ?? null),
    [favoritesData],
  );

  const card = useMemo(() => {
    const raw = cardDetailData as Record<string, unknown> | undefined;
    const data = raw?.data ?? raw;
    const c = (data as Record<string, unknown>)?.card as Record<string, unknown> | undefined;
    return c ?? null;
  }, [cardDetailData]);

  const relatedCards = useMemo((): (CardOffer & { companyId: string })[] => {
    if (!card) return [];
    const arr = (card.related_cards as Array<Record<string, unknown>>) ?? [];
    return arr.map(mapApiRelatedToCardOffer).filter((o) => o.id && o.title.ar);
  }, [card]);

  const isCardFavorite = useMemo(
    () =>
      card &&
      favoritesList.some(
        (f) =>
          f.favorable_type === "card" &&
          String(f.favorable_id) === String(card.id),
      ),
    [card, favoritesList],
  );

  const cardName = card ? String(card.name ?? "") : "";
  const cardDescription = card ? String(card.description ?? "").trim() : "";
  const cardTerms = card ? String(card.terms ?? "").trim() : "";
  const cardFeatures = card
    ? (typeof card.features === "string"
        ? (card.features as string).split(/[،,;\n]/).map((s) => s.trim()).filter(Boolean)
        : Array.isArray(card.features)
          ? (card.features as string[])
          : [])
    : [];
  const imageUrl = card ? String(card.image ?? "") : "";
  const finalPrice = card != null ? Number(card.final_price ?? card.price ?? 0) : 0;
  const oldPrice = card?.old_price != null ? Number(card.old_price) : null;
  const discountPercentage = card?.discount_percentage != null ? Number(card.discount_percentage) : null;
  const validityType = card ? String(card.validity_type ?? "") : "";
  const isRenewable = card?.is_renewable === true;
  const deliveryType = card ? String(card.delivery_type ?? "") : "";
  const purchaseCount = card != null ? Number(card.purchase_count ?? 0) : 0;
  const viewsCount = card != null ? Number(card.views_count ?? 0) : 0;
  const inStock = card?.in_stock !== false && (card?.stock == null || Number(card.stock) > 0);
  const merchant = (card?.merchant as Record<string, unknown>) ?? {};
  const merchantName = String(merchant.name ?? "");
  const merchantLogo = String(merchant.logo ?? "");
  const category = (card?.category as Record<string, unknown>) ?? {};
  const categoryName = String(category.name ?? "");

  const unitPrice = finalPrice;
  const totalPrice = unitPrice * quantity;

  const handlePurchase = () => {
    if (!companyId || !offerId) return;
    if (!token) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }
    window.location.href = `/cards/${companyId}/payment?offer=${offerId}&quantity=${quantity}`;
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!token) {
      navigate(`/login?returnUrl=${encodeURIComponent(location.pathname)}`);
      return;
    }
    toggleFavorite.mutate(
      { favorable_type: "card", favorable_id: String(card?.id ?? offerId) },
      {
        onSuccess: () => {
          toast.success(
            isCardFavorite
              ? t("couponModal.removedFromFavorites")
              : t("couponModal.addedToFavorites"),
          );
        },
        onError: () => toast.error(t("couponModal.errorGeneric")),
      },
    );
  };

  if (isLoading) {
    return (
      <>
        <section className="relative w-full bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] overflow-hidden" style={{ minHeight: "200px" }}>
          <div className="absolute inset-0 bg-primary opacity-30" />
          <div className="relative pt-24 pb-10 px-6 mx-auto max-w-site w-full text-center">
            <div className="h-8 w-48 bg-white/20 rounded-mk-sm mx-auto mb-4" />
            <div className="h-4 w-3/4 max-w-md bg-white/15 rounded mx-auto" />
          </div>
        </section>
        <div className="bg-mk-tint3" style={{ minHeight: "60vh" }}>
          <div className="container mx-auto px-4 py-8 max-w-site">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-mk-border-strong/50 rounded-mk-2xl overflow-hidden" style={{ height: "280px" }} />
                <div className="bg-white rounded-mk-2xl shadow-mk-card p-6">
                  <div className="h-4 w-1/3 bg-mk-border-strong/50 rounded mb-4" />
                  <div className="h-3 w-full bg-mk-tint2 rounded mb-2" />
                  <div className="h-3 w-5/6 bg-mk-tint2 rounded mb-2" />
                  <div className="h-3 w-2/3 bg-mk-tint2 rounded" />
                </div>
              </div>
              <div className="lg:col-span-1">
                <div className="bg-white rounded-mk-2xl shadow-mk-card p-6">
                  <div className="h-5 w-2/3 bg-mk-border-strong/50 rounded mb-4" />
                  <div className="h-8 w-1/2 bg-mk-border-strong/50 rounded mb-6" />
                  <div className="h-3 w-full bg-mk-tint2 rounded mb-2" />
                  <div className="h-3 w-4/5 bg-mk-tint2 rounded mb-6" />
                  <div className="h-12 w-full bg-mk-border-strong/50 rounded-mk-md" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-mk-text mb-4">
            {t("cardOfferDetail.not_found")}
          </h2>
          <button
            onClick={() => navigate("/cards")}
            className="bg-mk-primary text-white px-6 py-2 rounded-mk-sm hover:bg-mk-primary transition-colors"
          >
            {t("cardOfferDetail.back_to_cards")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {cardName} - {merchantName} | {t("cardOfferDetail.cards_brand")}
        </title>
        <link
          rel="canonical"
          href={`https://mukafaat.com.sa/cards/${companyId}/${offerId}`}
        />
      </Helmet>

      {/* هيدر مثل صفحة العرض */}
      <section className="relative w-full bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] overflow-hidden min-h-[200px] flex items-center justify-center">
        <div className="absolute inset-0 bg-primary opacity-30" />
        <div className="relative pt-24 pb-10 px-6 mx-auto max-w-site w-full text-center lg:pt-24 lg:pb-10 lg:px-12 flex flex-col justify-center z-10">
          <div className="flex items-center justify-between absolute top-4 left-4 right-4">
            <button
              onClick={() => navigate(`/cards/${companyId}`)}
              className={`text-white hover:text-mk-lilac transition-colors flex items-center gap-2 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <FiArrowLeft className="text-xl" />
              <span className="text-sm">{t("cardOfferDetail.back")}</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  const title = stripHtml(cardName || merchantName || "");
                  const url = `${window.location.origin}/cards/${companyId}/${offerId}`;
                  openShare({ title, url });
                }}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                aria-label={t("offerDetail.aria_share")}
              >
                <ShareIcon size={18} />
              </button>
              <button
                type="button"
                onClick={handleFavoriteClick}
                className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors disabled:opacity-50"
                disabled={toggleFavorite.isPending}
              >
                {isCardFavorite ? (
                  <HeartIcon size={18} filled className="text-[#FCA5A5]" />
                ) : (
                  <HeartIcon size={18} />
                )}
              </button>
            </div>
          </div>

          {merchantLogo && (
            <div
              className="absolute top-4 w-12 h-12 rounded-full overflow-hidden border-2 border-white/30 hidden sm:block"
              style={isRTL ? { left: "1rem" } : { right: "1rem" }}
            >
              <img
                src={merchantLogo}
                alt={merchantName}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <h1 className="text-2xl md:text-3xl font-bold mb-2 tracking-tight leading-tight text-white px-4">
            {cardName}
          </h1>
          {cardDescription && (
            <p className="text-white/80 text-base mb-3 max-w-2xl mx-auto line-clamp-2">
              {stripHtml(cardDescription)}
            </p>
          )}
          <div className="flex items-center justify-center gap-2 text-white/90 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-white/70">
                {t("cardOfferDetail.sold")}
              </span>
              <span className="font-medium">{purchaseCount}</span>
            </div>
            <span className="text-white/50">|</span>
            <div className="flex items-center gap-2 text-white/90">
              <FiEye className="text-white/80 shrink-0" size={18} />
              <span>{viewsCount}</span>
              <span className="text-white/70">
                {t("cardOfferDetail.views_word")}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-center text-sm flex-wrap gap-x-1 text-white/80">
            <Link to="/" className="hover:text-white transition-colors text-xs">
              {t("propertyDetail.breadcrumb.home")}
            </Link>
            <span className="text-xs">|</span>
            <Link to="/cards" className="hover:text-white transition-colors text-xs">
              {t("home.navbar.cards")}
            </Link>
            {merchantName && (
              <>
                <span className="text-xs">|</span>
                <Link
                  to={`/cards/${companyId}`}
                  className="hover:text-white transition-colors text-xs"
                >
                  {merchantName}
                </Link>
              </>
            )}
            <span className="text-xs">|</span>
            <span className="text-[#fd671a] font-medium text-xs" aria-current="page">
              {cardName}
            </span>
          </div>
        </div>
        <div className="absolute -bottom-10 transform z-0">
          <img src={AboutPattern} alt="" className="w-full h-96 animate-float" />
        </div>
      </section>

      <div className="min-h-screen bg-mk-tint3" style={{ paddingTop: "0" }}>
        <div className="container mx-auto px-4 py-8 max-w-site -mt-2 relative z-10 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* عمود المحتوى: صورة واحدة أصغر + تابات */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-mk-2xl shadow-mk-raised overflow-hidden">
                <div className="p-4 flex items-center justify-center bg-mk-tint3">
                  <img
                    src={imageUrl}
                    alt={cardName}
                    className="max-h-[280px] w-auto object-contain rounded-mk-md"
                  />
                </div>
              </div>

              <div className="bg-white rounded-mk-2xl shadow-mk-raised overflow-hidden">
                <div className="flex border-b">
                  {[
                    {
                      key: "description" as TabKey,
                      label: t("cardOfferDetail.tab_description"),
                    },
                    {
                      key: "terms" as TabKey,
                      label: t("cardOfferDetail.tab_terms"),
                    },
                    {
                      key: "features" as TabKey,
                      label: t("cardOfferDetail.tab_features"),
                    },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-6 py-4 font-medium border-b-2 transition-colors ${activeTab === tab.key ? "border-primary text-primary" : "border-transparent text-mk-muted hover:text-mk-text"}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
                <div className="p-6">
                  {activeTab === "description" && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        {validityType && (
                          <div className="bg-mk-tint2 p-3 rounded-mk-sm">
                            <div className="text-sm text-mk-muted">
                              {t("cardOfferDetail.validity_type")}
                            </div>
                            <div className="font-medium text-mk-text">
                              {(() => {
                                const vk = validityType.toLowerCase();
                                return [
                                  "annual",
                                  "monthly",
                                  "quarterly",
                                  "semi_annual",
                                ].includes(vk)
                                  ? t(`cardOfferDetail.validity.${vk}`)
                                  : validityType;
                              })()}
                            </div>
                          </div>
                        )}
                        <div className="bg-mk-tint2 p-3 rounded-mk-sm">
                          <div className="text-sm text-mk-muted">
                            {t("cardOfferDetail.renewable")}
                          </div>
                          <div className="font-medium text-mk-text">
                            {isRenewable
                              ? t("cardOfferDetail.yes")
                              : t("cardOfferDetail.no")}
                          </div>
                        </div>
                        {deliveryType && (
                          <div className="bg-mk-tint2 p-3 rounded-mk-sm">
                            <div className="text-sm text-mk-muted">
                              {t("cardOfferDetail.delivery")}
                            </div>
                            <div className="font-medium text-mk-text">{deliveryType}</div>
                          </div>
                        )}
                      </div>
                      <p className="text-mk-muted text-sm whitespace-pre-wrap">
                        {stripHtml(cardDescription) || "—"}
                      </p>
                    </>
                  )}
                  {activeTab === "terms" && (
                    <p className="text-mk-muted text-sm whitespace-pre-wrap">
                      {stripHtml(cardTerms) || t("cardOfferDetail.no_terms")}
                    </p>
                  )}
                  {activeTab === "features" && (
                    <div className="space-y-2">
                      {cardFeatures.length > 0 ? (
                        cardFeatures.map((f, i) => (
                          <div key={i} className="flex items-center gap-2 text-mk-text-strong">
                            <div className="w-1.5 h-1.5 bg-mk-primary-light rounded-full flex-shrink-0" />
                            <span>{f}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-mk-muted text-sm">
                          {stripHtml(String(card.features ?? "")) ||
                            t("cardOfferDetail.no_features")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* الشريط الجانبي */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-6 bg-white rounded-mk-2xl shadow-mk-raised p-6 space-y-6">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      const title = stripHtml(cardName || merchantName || "");
                      const url = `${window.location.origin}/cards/${companyId}/${offerId}`;
                      openShare({ title, url });
                    }}
                    className="flex-1 py-2.5 rounded-mk-md border border-mk-border bg-white text-mk-text hover:bg-mk-tint3 transition-colors flex items-center justify-center gap-2"
                  >
                    <ShareIcon size={16} />
                    <span className="text-sm font-medium">
                      {t("cardOfferDetail.share")}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={handleFavoriteClick}
                    className="flex-1 py-2.5 rounded-mk-md border border-mk-border bg-white text-mk-text hover:bg-mk-tint3 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    disabled={toggleFavorite.isPending}
                  >
                    {isCardFavorite ? (
                      <HeartIcon size={16} filled className="text-mk-red" />
                    ) : (
                      <HeartIcon size={16} />
                    )}
                    <span className="text-sm font-medium">
                      {t("cardOfferDetail.favorites")}
                    </span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {categoryName && (
                    <span className="inline-flex items-center gap-1 text-sm text-mk-muted bg-mk-tint2 px-3 py-1.5 rounded-full">
                      <FiTag className="text-base" /> {categoryName}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-sm text-mk-muted bg-mk-tint2 px-3 py-1.5 rounded-full">
                    {purchaseCount} {t("cardOfferDetail.sold_badge")}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-mk-text">
                  {t("cardOfferDetail.choose_quantity")}
                </h3>
                <div className="border border-mk-border rounded-mk-md p-4 space-y-3">
                  <p className="text-mk-text font-medium mb-2">{cardName}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    {oldPrice != null && oldPrice > unitPrice && (
                      <span className="text-mk-faint line-through text-sm">{oldPrice}</span>
                    )}
                    <span className="text-xl font-bold text-mk-text">{unitPrice}</span>
                    <CurrencyIcon className="text-mk-text-strong" size={20} />
                    {discountPercentage != null && discountPercentage > 0 && (
                      <span className="text-green-600 text-sm font-medium bg-green-50 px-2 py-0.5 rounded-full">
                        {t("cardOfferDetail.save_pct", {
                          pct: discountPercentage,
                        })}
                      </span>
                    )}
                  </div>
                  {!inStock && (
                    <p className="p-3 bg-amber-50 border border-amber-200 rounded-mk-sm text-amber-800 text-sm">
                      {t("cardOfferDetail.out_of_stock")}
                    </p>
                  )}
                  {inStock && (
                    <>
                      <div className="mt-3">
                        <QuantitySelector
                          maxQty={Math.min(99, Number(card.stock) || 99)}
                          onQuantityChange={handleQuantityChange}
                        />
                      </div>
                      <p className="text-sm font-medium text-mk-text-strong mt-2">
                        {t("cardOfferDetail.total")}: {totalPrice}{" "}
                        <CurrencyIcon className="inline" size={14} />
                      </p>
                    </>
                  )}
                </div>
                {inStock && (
                  <button
                    onClick={handlePurchase}
                    className="w-full py-3 px-6 bg-primary text-white rounded-mk-md font-medium hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {t("cardOfferDetail.quick_buy")}
                  </button>
                )}
                <div>
                  <p className="text-sm text-mk-muted mb-2">
                    {t("cardOfferDetail.payment_methods")}
                  </p>
                  <div className="flex items-center gap-2 text-mk-muted text-xs font-medium">
                    <span>VISA</span>
                    <span>MasterCard</span>
                    <span>Mada</span>
                    <span>Apple Pay</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {relatedCards.length > 0 && (
            <section className="mt-12">
              <h2 className="text-xl font-bold text-mk-text mb-6">
                {t("cardOfferDetail.related_cards")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {relatedCards.map((related) => (
                  <OfferCard
                    key={related.id}
                    offer={related}
                    companyId={related.companyId}
                    onOfferClick={() =>
                      navigate(`/cards/${(related as unknown as Record<string, unknown>).merchantSlug || related.companyId}/${(related as unknown as Record<string, unknown>).slug || related.id}`)
                    }
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
};

export default CardOfferDetailPage;
