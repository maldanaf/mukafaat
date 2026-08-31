"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { useIsRTL } from "@hooks";
import { useTranslation } from "react-i18next";
import { IoMdClose } from "react-icons/io";
import {
  FiCheck,
  FiShare2,
  FiExternalLink,
  FiUsers,
} from "react-icons/fi";
import { FaRegCopy } from "react-icons/fa";
import { HeartIcon } from "@ui";
import type { CouponModel } from "@network/mappers/couponsMapper";
import { stripHtml } from "@utils/stripHtml";
import { useUserStore } from "@stores/userStore";
import {
  useCouponCopy,
  useCouponVote,
  useFavorites,
  useFavoriteToggle,
} from "@hooks/api/useMokafaatQueries";
import { normalizeFavoritesList } from "@utils/favorites";
import { toast } from "react-toastify";
import ShareModal from "@components/ShareModal";
import { Badge, StatChips } from "@ui";
import { usedCountText } from "@utils/usedCount";

import { localeTag } from "@utils/localeFormat";
export type CouponWithIcon = CouponModel & { icon: React.ReactNode };

interface CouponModalProps {
  coupon: CouponWithIcon;
  onClose: () => void;
  relatedCoupons?: CouponWithIcon[];
  onRelatedClick?: (coupon: CouponWithIcon) => void;
  getLogoUrl?: (coupon: CouponModel) => string;
}

const CouponModal: React.FC<CouponModalProps> = ({
  coupon,
  onClose,
  getLogoUrl,
}) => {
  const isRTL = useIsRTL();
  const { t } = useTranslation();
  // تقويم ميلادي وأرقام لاتينية في كل اللغات — عبر الأداة المركزية
  const dateLocale = localeTag();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const couponCopy = useCouponCopy();
  // عدّاد النسخ — يبدأ من قيمة الـAPI ويزداد تفاؤلياً عند النسخ
  const [copiesCount, setCopiesCount] = useState<number>(
    coupon.copiesCount ?? 0,
  );
  useEffect(() => {
    setCopiesCount(coupon.copiesCount ?? 0);
  }, [coupon.id, coupon.copiesCount]);
  const isAuthenticated = useUserStore((s) => !!s.token);
  const couponVote = useCouponVote();
  const [voteState, setVoteState] = useState<{
    workingCount: number;
    notWorkingCount: number;
    userVote?: "working" | "not_working";
  } | null>(null);
  const { data: favoritesData } = useFavorites();
  const toggleFavorite = useFavoriteToggle();
  const favoritesList = useMemo(
    () => normalizeFavoritesList(favoritesData ?? null),
    [favoritesData],
  );
  const isFavorite = useMemo(
    () =>
      favoritesList.some(
        (f) =>
          f.favorable_type === "coupon" &&
          String(f.favorable_id) === String(coupon.id),
      ),
    [favoritesList, coupon.id],
  );

  const handleFavoriteClick = useCallback(() => {
    if (!isAuthenticated) {
      navigate(
        `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`,
      );
      onClose();
      return;
    }
    toggleFavorite.mutate(
      { favorable_type: "coupon", favorable_id: coupon.id },
      {
        onSuccess: () => {
          toast.success(
            isFavorite
              ? t("couponModal.removedFromFavorites")
              : t("couponModal.addedToFavorites"),
          );
        },
        onError: () => toast.error(t("couponModal.errorGeneric")),
      },
    );
  }, [
    isAuthenticated,
    navigate,
    onClose,
    toggleFavorite,
    coupon.id,
    isFavorite,
    t,
  ]);

  const code =
    coupon.couponCode && coupon.couponCode.trim().length > 0
      ? coupon.couponCode
      : `CPN${String(coupon.id).padStart(4, "0")}`;

  const copyCode = useCallback(() => {
    const markCopied = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    // زيادة تفاؤلية فورية ثم تسجيل النسخة في الخادم (fire-and-forget)
    setCopiesCount((c) => c + 1);
    couponCopy.mutate(coupon.id, {
      onSuccess: (serverCount) => {
        if (typeof serverCount === "number") setCopiesCount(serverCount);
      },
    });

    const done = navigator.clipboard?.writeText(code);
    if (done) done.then(markCopied).catch(markCopied);
    else markCopied();
  }, [code, coupon.id, couponCopy]);

  const couponShareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/coupons?coupon=${coupon.id}`
    : `/coupons?coupon=${coupon.id}`;

  const shareCoupon = useCallback(() => {
    setShowShareModal(true);
  }, []);

  const submitVote = useCallback(
    (vote: "working" | "not_working") => {
      if (!isAuthenticated) {
        navigate(
          `/login?returnUrl=${encodeURIComponent(window.location.pathname)}`,
        );
        onClose();
        return;
      }
      couponVote.mutate(
        { id: coupon.id, vote },
        {
          onSuccess: (res) => {
            const wrapper = res as {
              msg?: unknown;
              data?: unknown;
            };

            const msg =
              typeof wrapper?.msg === "string" && wrapper.msg.trim() !== ""
                ? wrapper.msg
                : null;
            if (msg) {
              toast.success(msg);
            }

            const inner = (() => {
              const d = wrapper?.data;
              if (d && typeof d === "object") {
                const dObj = d as Record<string, unknown>;
                if (dObj.data && typeof dObj.data === "object") {
                  return dObj.data as Record<string, unknown>;
                }
                return dObj;
              }
              return {} as Record<string, unknown>;
            })();

            const payload = inner as {
              working_count?: unknown;
              not_working_count?: unknown;
              user_vote?: unknown;
            };
            const next = {
              workingCount: Number(payload?.working_count ?? 0) || 0,
              notWorkingCount: Number(payload?.not_working_count ?? 0) || 0,
              userVote:
                payload?.user_vote === "working" ||
                payload?.user_vote === "not_working"
                  ? (payload.user_vote as "working" | "not_working")
                  : undefined,
            };
            setVoteState(next);
          },
          onError: () => toast.error(t("couponModal.errorGeneric")),
        },
      );
    },
    [coupon.id, couponVote, isAuthenticated, navigate, onClose, t],
  );

  const goToStore = () => {
    const url = coupon.storeUrl;
    if (url && url.trim().length > 0) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      navigate("/coupons");
    }
    onClose();
  };

  const logoUrl = getLogoUrl?.(coupon);
  const workingCount = voteState?.workingCount ?? 0;
  const notWorkingCount = voteState?.notWorkingCount ?? 0;
  const userVote = voteState?.userVote;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[9998] flex items-center justify-center p-4"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-2xl z-[9999]"
        style={{ direction: isRTL ? "rtl" : "ltr" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="coupon-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-2 end-2 w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
          aria-label={t("couponModal.closeAria")}
        >
          <IoMdClose className="text-xl" />
        </button>

        <div className="px-5 pt-5 pb-6">
          {/* Store name + logo + stats */}
          <div className={`flex items-start gap-3 mb-4`}>
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-green-500 flex items-center justify-center">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={coupon.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white font-bold text-lg">
                  {coupon.title.charAt(0)}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2
                id="coupon-modal-title"
                className="text-base font-bold text-gray-900"
              >
                {stripHtml(coupon.title)}
              </h2>
              {/* عدّادات موحّدة: مشاهدات / مشاركات / نسخ */}
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <StatChips
                  compact
                  views={coupon.viewsCount}
                  shares={coupon.sharesCount}
                  copies={copiesCount}
                />
                {Number(coupon.rating) > 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FDF4DE] px-2 py-0.5 text-[10.5px] font-bold text-[#8A6209]">
                    ★ {coupon.rating}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Title + شارة الخصم */}
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h3 className="m-0 text-xl font-bold text-gray-900">
              {coupon.dealText}
            </h3>
            {coupon.discountPercentage ? (
              <Badge tone="solid-accent">{`${coupon.discountPercentage}%`}</Badge>
            ) : null}
          </div>
          {/* <p className="text-base font-semibold text-gray-700 mb-2">
            {coupon.dealSubtext}
          </p> */}

          {/* Description */}
          {/* <p className="text-sm text-gray-500 mb-6 line-clamp-3">
            {stripHtml(coupon.savings)}
          </p> */}

          {/* Action icons: فعال، أضف للمفضلة، مشاركة، تسوق بالموقع */}
          <div className={`flex flex-wrap gap-4 mb-6 `}>
            {/* Vote: working */}
            <button
              type="button"
              onClick={() => submitVote("working")}
              disabled={couponVote.isPending}
              className={`flex flex-col items-center gap-1 focus:outline-none disabled:opacity-50 ${
                userVote === "working"
                  ? "text-green-700"
                  : "text-green-600 hover:text-green-700"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  userVote === "working" ? "bg-green-200" : "bg-green-100"
                }`}
              >
                <FiCheck className="w-6 h-6 text-green-700" />
              </div>
              <span className="text-xs font-medium">
                {t("couponModal.working")} ({workingCount})
              </span>
            </button>

            {/* Vote: not working */}
            <button
              type="button"
              onClick={() => submitVote("not_working")}
              disabled={couponVote.isPending}
              className={`flex flex-col items-center gap-1 focus:outline-none disabled:opacity-50 ${
                userVote === "not_working"
                  ? "text-red-700"
                  : "text-red-600 hover:text-red-700"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  userVote === "not_working" ? "bg-red-200" : "bg-red-100"
                }`}
              >
                <span className="text-xl font-bold text-red-700">×</span>
              </div>
              <span className="text-xs font-medium">
                {t("couponModal.notWorking")} ({notWorkingCount})
              </span>
            </button>
            <button
              type="button"
              onClick={handleFavoriteClick}
              disabled={toggleFavorite.isPending}
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${isFavorite ? "bg-red-100 text-red-600" : "bg-gray-100"}`}
              >
                {isFavorite ? (
                  <HeartIcon size={20} filled />
                ) : (
                  <HeartIcon size={20} />
                )}
              </div>
              <span className="text-xs font-medium">
                {isFavorite
                  ? t("couponModal.removeFavorite")
                  : t("couponModal.addFavorite")}
              </span>
            </button>
            <button
              type="button"
              onClick={shareCoupon}
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <FiShare2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">
                {t("couponModal.share")}
              </span>
            </button>
            <a
              href={
                coupon.storeUrl && coupon.storeUrl.trim()
                  ? coupon.storeUrl
                  : "/coupons"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-gray-500 hover:text-gray-700"
            >
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                <FiExternalLink className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">
                {t("couponModal.shopOnSite")}
              </span>
            </a>
          </div>

          {/* Coupon code box */}
          <div
            onClick={copyCode}
            className="flex items-center justify-between gap-3 py-4 px-5 mb-3 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-[#400198] hover:bg-mk-tint3/50 transition-colors"
          >
            <span className="text-xl font-bold text-gray-900 tracking-wider">
              {code}
            </span>
            <div className="flex items-center gap-2">
              <FaRegCopy className="w-5 h-5 text-gray-500" />
              {copied && (
                <span className="text-sm text-green-600 font-medium">
                  {t("couponModal.copied")}
                </span>
              )}
            </div>
          </div>

          {/* Expiry (من end_date إن وُجد) */}
          <p className="text-sm text-gray-500">
            {coupon.endDate
              ? (() => {
                  const d = new Date(coupon.endDate as string);
                  const formatted = Number.isNaN(d.getTime())
                    ? coupon.endDate
                    : d.toLocaleDateString(dateLocale, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      });
                  return t("couponModal.expiresOn", {
                    date: String(formatted),
                  });
                })()
              : t("couponModal.noExpiryDate")}
          </p>

          {/* عدّاد الاستخدام (عدد مرات نسخ الكود) — يُخفى عند الصفر */}
          {copiesCount > 0 && (
            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-gray-400">
              <FiUsers className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{usedCountText(copiesCount)}</span>
            </p>
          )}

          {/* CTA - الذهاب إلى متجر الكوبون (إن وجد) */}
          <button
            type="button"
            onClick={goToStore}
            className="block w-full mt-6 py-4 rounded-2xl bg-[#fd671a] text-white text-center font-bold text-lg hover:opacity-95 transition-opacity"
          >
            {t("couponModal.goToStore")}
          </button>
        </div>
      </div>
      {showShareModal && (
        <ShareModal
          url={couponShareUrl}
          title={stripHtml(coupon.title)}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </>
  );
};

export default CouponModal;
