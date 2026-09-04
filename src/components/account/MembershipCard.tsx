"use client";

import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";

/** تجميع الأرقام بمسافات (مثل 242 325 678 122) */
function formatDigitsSpaced(raw: string) {
  const d = String(raw).replace(/\D/g, "");
  if (!d) return raw;
  const parts: string[] = [];
  let i = d.length;
  while (i > 0) {
    parts.unshift(d.slice(Math.max(0, i - 3), i));
    i -= 3;
  }
  return parts.join(" ");
}

/** بطاقة تعريفية — مطابقة التصميم المرجعي (فعالة أخضر / منتهية رمادي) */
function MembershipCard({
  fullName,
  membershipNumber,
  idNumber,
  isActive = true,
  membershipQrUrl,
  membershipBarcodeUrl,
}: {
  fullName: string;
  membershipNumber: string;
  /** يظهر في سطر «رقم إثبات»؛ إن لم يُمرَّر يُستخدم رقم العضوية */
  idNumber?: string;
  /** إن false تُعرض «الحالة منتهية» بتصميم رمادي */
  isActive?: boolean;
  /** رابط صورة QR من API البروفايل (membership_qr_url) — يُستخدم عند توفره */
  membershipQrUrl?: string | null;
  /** باركود Code128 لرقم العضوية — يقرأه ماسح الكاشير على اللابتوب */
  membershipBarcodeUrl?: string | null;
}) {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const proofLine = String(idNumber || membershipNumber || "").trim();
  const qrValue = useMemo(
    () =>
      JSON.stringify({
        type: "mokafaat_member",
        membership_number: membershipNumber,
      }),
    [membershipNumber],
  );
  const qrSrcFallback = useMemo(() => {
    const enc = encodeURIComponent(qrValue);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&ecc=M&data=${enc}`;
  }, [qrValue]);
  const qrSrc = membershipQrUrl?.trim() || qrSrcFallback;

  /**
   * الباركود الخطّي — مكمّل للـ QR لا بديل عنه.
   *
   * كاشير الجوال يمسح الـ QR، وكاشير اللابتوب يستعمل ماسحاً خطّياً
   * يُدخل الرقم كأنه لوحة مفاتيح، فنشفّر رقم العضوية وحده.
   */
  const barcodeSrc = useMemo(() => {
    const digits = String(membershipNumber ?? "").replace(/\s/g, "");
    if (!digits) return null;
    return (
      membershipBarcodeUrl?.trim() ||
      `https://barcodeapi.org/api/128/${encodeURIComponent(digits)}`
    );
  }, [membershipBarcodeUrl, membershipNumber]);
  const displayBig = formatDigitsSpaced(membershipNumber);
  /** تدرج خلفية: فوق #6A0DAD → تحت #4B0082 */
  const cardGradient = "linear-gradient(180deg, #6A0DAD 0%, #4B0082 100%)";
  const purpleDeep = "#4B0082";

  return (
    <div
      className="mb-6 rounded-mk-xl px-3 py-4 shadow-xl sm:px-4 sm:py-5"
      style={{
        backgroundImage: cardGradient,
        backgroundAttachment: "fixed",
      }}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div
        className="px-4 py-3.5 text-center text-white sm:py-4"
        style={{
          backgroundImage: cardGradient,
          backgroundAttachment: "fixed",
        }}
      >
        <h3 className="text-base font-bold tracking-wide sm:text-lg">
          {t("profile.membership_card_title")}
        </h3>
      </div>
      <div className="relative mx-auto max-w-sm overflow-hidden rounded-mk-xl bg-white shadow-[0_8px_32px_rgba(0,0,0,0.18)] sm:rounded-mk-2xl">
        {/* شريط العنوان — نفس تدرج الخلفية */}

        {/* قصّ تذكرة — يكمل التدرج مع بقية الصفحة */}
        <div
          className="pointer-events-none absolute left-0 top-1/2 z-10 h-9 w-4 -translate-y-1/2 rounded-r-full sm:h-10 sm:w-5"
          style={{
            marginLeft: "-2px",
            backgroundImage: cardGradient,
            backgroundAttachment: "fixed",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute right-0 top-1/2 z-10 h-9 w-4 -translate-y-1/2 rounded-l-full sm:h-10 sm:w-5"
          style={{
            marginRight: "-2px",
            backgroundImage: cardGradient,
            backgroundAttachment: "fixed",
            boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
          }}
          aria-hidden
        />

        <div className="px-5 pb-8 pt-5 text-center sm:px-6 sm:pb-10 sm:pt-6">
          <p className="mb-4 text-xs leading-relaxed text-mk-muted sm:text-sm">
            {t("profile.membership_card_hint")}
          </p>

          <div className="mb-5 flex justify-center sm:mb-6">
            <img
              src={qrSrc}
              alt=""
              width={200}
              height={200}
              className="block h-[180px] w-[180px] sm:h-[200px] sm:w-[200px]"
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* الباركود — لماسحات الكاشير على اللابتوب */}
          {barcodeSrc && (
            <div className="mb-5 flex flex-col items-center gap-1.5 sm:mb-6">
              <img
                src={barcodeSrc}
                alt=""
                className="block h-[62px] w-auto max-w-[86%] object-contain"
                loading="lazy"
                decoding="async"
              />
              <span className="font-mono text-[11px] tracking-[0.2em] text-mk-muted">
                {String(membershipNumber ?? "")}
              </span>
            </div>
          )}

          <div className="my-4 border-t border-dashed border-mk-border-2 sm:my-5" />

          <p className="mb-3 text-lg font-bold text-mk-text sm:text-xl">
            {fullName}
          </p>
          <p className="mb-4 text-xs text-mk-muted sm:mb-4 sm:text-sm">
            {t("profile.membership_proof_label")} /{" "}
            <span className="font-mono font-semibold text-mk-text">
              {proofLine}
            </span>
          </p>

          <p
            className="mb-5 font-mono text-2xl font-bold leading-snug sm:mb-5 sm:text-2xl "
            style={{
              wordBreak: "break-word",
              color: purpleDeep,
            }}
          >
            {displayBig}
          </p>

          {/* حالة البطاقة — فعالة (أخضر) أو منتهية (رمادي) */}
          <div
            className={`mx-auto flex max-w-[150px] flex-col items-center gap-1 rounded-mk-xl px-5 py-4 ${
              isActive ? "" : "bg-mk-tint2"
            }`}
            style={isActive ? { backgroundColor: "#EAF8EE" } : undefined}
          >
            <div
              className={`flex items-center justify-center rounded-mk-md p-2 sm:p-2 ${
                isActive ? "" : "bg-mk-border-strong/50"
              }`}
              style={
                isActive
                  ? { backgroundColor: "rgb(4 120 87 / 15%)" }
                  : undefined
              }
            >
              {isActive ? (
                <svg
                  className="h-8 w-8 sm:h-8 sm:w-8"
                  viewBox="0 0 32 32"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M16 2.5L5.5 6.2v7.8c0 6.2 4.3 12 10.5 13.5 6.2-1.5 10.5-7.3 10.5-13.5V6.2L16 2.5z"
                    fill="#047857"
                  />
                  <path
                    d="M14 16.2l2.2 2.2 4.8-4.8"
                    stroke="white"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <svg
                  className="h-8 w-8 sm:h-8 sm:w-8 text-mk-muted"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              )}
            </div>
            <span className="text-[11px] text-mk-muted sm:text-xs">
              {t("profile.membership_status_label")}
            </span>
            <span
              className={`text-base font-bold sm:text-lg ${
                isActive ? "text-mk-text" : "text-mk-muted"
              }`}
            >
              {isActive
                ? t("profile.membership_status_active")
                : t("profile.membership_status_expired")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MembershipCard;
