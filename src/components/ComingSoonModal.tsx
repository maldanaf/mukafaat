"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { IoClose } from "react-icons/io5";
import { FiBell, FiCheck } from "react-icons/fi";
import { TbBuildingStore } from "react-icons/tb";

import { merchantsApi } from "@network/services/mokafaatService";
import { useUserStore } from "@stores/userStore";
import { useNavigate } from "@/lib/router-compat";

export interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  merchant: {
    id: number | string;
    name?: string;
    logo?: string | null;
    is_following?: boolean;
  } | null;
}

/**
 * نافذة متجر «قريباً».
 *
 * المتجر في هذه الحالة يظهر في القوائم ليعرف الزائر أنه قادم، لكن لا
 * صفحة له: لا عروض ولا خصومات بعد، وفتح صفحة فارغة يوحي بعطل لا
 * بترقّب. فنعرض هنا سبب عدم الفتح، ونعطيه ما يفيده فعلاً — متابعة
 * المتجر ليصله إشعار فور إطلاقه.
 */
const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  isOpen,
  onClose,
  merchant,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const token = useUserStore((s) => s.token);

  const [following, setFollowing] = useState(merchant?.is_following === true);
  const [busy, setBusy] = useState(false);

  /**
   * البوابة تُنشأ بعد التركيب فقط.
   *
   * `document` غير موجود أثناء التصيير على الخادم، وقراءته مباشرةً
   * تُسقط الصفحة.
   */
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // منع تمرير الصفحة خلف النافذة
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen || !merchant || !mounted) return null;

  const handleFollow = async () => {
    // المتابعة تحتاج حساباً — نرسله لتسجيل الدخول ثم يعود
    if (!token) {
      onClose();
      navigate(`/login?returnUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    setBusy(true);
    try {
      await merchantsApi.follow(merchant.id);
      setFollowing((prev) => !prev);
    } catch {
      // فشل الشبكة لا يغيّر الحالة المعروضة
    } finally {
      setBusy(false);
    }
  };

  /**
   * تُركَّب على `document.body` لا داخل الكرت.
   *
   * الكرت حاوية `overflow-hidden` ذات سياق تراصّ خاص، فالنافذة بداخله
   * تُقصّ بحوافه ولا تغطي الصفحة — ولا يصحّ أصلاً أن تكون أزرارٌ
   * تفاعلية داخل زرّ الكرت.
   */
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="coming-soon-title"
    >
      <div
        className="relative w-full max-w-sm overflow-hidden rounded-mk-xl bg-white text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t("common.close", "إغلاق")}
          className="absolute end-3 top-3 z-[2] grid h-8 w-8 place-items-center rounded-full bg-black/10 text-white transition hover:bg-black/20"
        >
          <IoClose size={18} />
        </button>

        {/* رأس بلون الهوية — «قريباً» هي رسالة النافذة لا تفصيل جانبي */}
        <div className="bg-[linear-gradient(135deg,#400198_0%,#6703EB_100%)] px-6 pb-7 pt-9 text-white">
          <span className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-white/15 ring-1 ring-white/25">
            <TbBuildingStore size={30} />
          </span>

          <p
            id="coming-soon-title"
            className="m-0 text-[30px] font-extrabold leading-none"
          >
            {t("merchantCard.coming_soon", "قريباً")}
          </p>

          {merchant.name && (
            <p className="mx-auto mt-2 mb-0 max-w-[85%] text-[15px] font-bold opacity-95">
              {merchant.name}
            </p>
          )}
        </div>

        <div className="px-6 pb-6 pt-5">
          <p className="m-0 text-[13.5px] leading-relaxed text-mk-muted">
            {t(
              "comingSoon.body",
              "هذا المتجر لم يُطلق بعد. تابعه ليصلك إشعار فور توفّر عروضه وخصوماته.",
            )}
          </p>

          <button
            type="button"
            onClick={handleFollow}
            disabled={busy}
            className={`mt-5 flex w-full items-center justify-center gap-2 rounded-mk-md px-4 py-3 text-[14px] font-extrabold transition disabled:opacity-60 ${
              following
                ? "bg-mk-tint2 text-mk-ink"
                : "bg-[linear-gradient(135deg,#400198_0%,#6703EB_100%)] text-white"
            }`}
          >
            {following ? <FiCheck size={17} /> : <FiBell size={17} />}
            {following
              ? t("comingSoon.following", "تتابع هذا المتجر")
              : t("comingSoon.follow", "تابعني عند الإطلاق")}
          </button>

          {following && (
            <p className="mb-0 mt-3 text-[12px] text-mk-muted">
              {t(
                "comingSoon.will_notify",
                "سنُعلمك فور إطلاق المتجر.",
              )}
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ComingSoonModal;
