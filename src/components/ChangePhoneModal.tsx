"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { IoMdClose } from "react-icons/io";
import { FaWhatsapp } from "react-icons/fa6";
import { HiOutlineChatAlt2 } from "react-icons/hi";
import { useTranslation } from "react-i18next";
import { api } from "@network/apiClient";
import { API_ENDPOINTS } from "@network/apiEndpoints";
import CountryCodeSelect from "@components/CountryCodeSelect";
import { FOCUS } from "@ui";

/**
 * مودال تغيير رقم الجوال — خطوتان:
 *  1. إدخال الرقم الجديد واختيار طريقة الإرسال (واتساب/SMS)
 *  2. إدخال رمز التحقق الواصل للرقم الجديد
 *
 * الخادم هو من يفحص توفّر الرقم ويطبّق حدّ الاستخدام، والواجهة تعرض رسالته
 * كما هي (رقم مستخدم بحساب آخر / تجاوز الحد / نفس الرقم الحالي).
 */
export interface ChangePhoneModalProps {
  /** الرقم الحالي للعرض في الأعلى (مع بادئة الدولة) */
  currentPhone?: string;
  currentCountryCode?: string;
  onClose: () => void;
  /** يُستدعى بعد نجاح التغيير كي تُحدّث الصفحة الأم بيانات المستخدم */
  onChanged: () => void;
}

type DeliveryMethod = "whatsapp" | "sms";

const ChangePhoneModal: React.FC<ChangePhoneModalProps> = ({
  currentPhone,
  currentCountryCode,
  onClose,
  onChanged,
}) => {
  const { t } = useTranslation();

  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [countryCode, setCountryCode] = useState(currentCountryCode || "966");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<DeliveryMethod>("whatsapp");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  /** الرقم الذي أُرسل إليه الرمز فعلاً — نتحقق به لا بما في الحقل */
  const sentRef = useRef<{ phone: string; countryCode: string }>({
    phone: "",
    countryCode: "",
  });

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendIn]);

  // إغلاق بمفتاح Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  /** رسالة الخطأ من الخادم — هي المرجع لأنها تحمل سبب الرفض الدقيق */
  const serverMessage = (err: unknown): string | null => {
    const data = (err as { response?: { data?: { msg?: string; message?: string } } })
      ?.response?.data;
    return (data?.msg || data?.message) ?? null;
  };

  const requestCode = useCallback(async () => {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) {
      setError(t("profile.err_phone_invalid", "رقم الهاتف غير صحيح"));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await api.post(API_ENDPOINTS.phoneChangeRequest, {
        phone: digits,
        country_code: `+${countryCode.replace(/^\+/, "")}`,
        type: method,
      });

      const body = (res.data as Record<string, unknown>) ?? {};
      if (body.status === false) {
        setError(String(body.msg || t("common.error", "حدث خطأ")));
        return;
      }

      sentRef.current = {
        phone: digits,
        countryCode: `+${countryCode.replace(/^\+/, "")}`,
      };
      setOtp("");
      setStep("otp");
      setResendIn(60);
    } catch (err) {
      setError(serverMessage(err) || t("common.error", "حدث خطأ"));
    } finally {
      setBusy(false);
    }
  }, [phone, countryCode, method, t]);

  const verifyCode = useCallback(async () => {
    if (otp.trim().length < 4) {
      setError(t("profile.phone_change_err_code", "يرجى إدخال رمز التحقق"));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await api.post(API_ENDPOINTS.phoneChangeVerify, {
        phone: sentRef.current.phone,
        country_code: sentRef.current.countryCode,
        otp_code: otp.trim(),
      });

      const body = (res.data as Record<string, unknown>) ?? {};
      if (body.status === false) {
        setError(String(body.msg || t("common.error", "حدث خطأ")));
        return;
      }

      onChanged();
      onClose();
    } catch (err) {
      setError(serverMessage(err) || t("common.error", "حدث خطأ"));
    } finally {
      setBusy(false);
    }
  }, [otp, onChanged, onClose, t]);

  const methodButton = (
    value: DeliveryMethod,
    label: string,
    Icon: React.ComponentType<{ className?: string }>,
  ) => {
    const selected = method === value;
    return (
      <button
        type="button"
        onClick={() => setMethod(value)}
        className={[
          "flex flex-1 items-center justify-center gap-2 rounded-mk-sm border py-2.5 text-[13px] transition-all",
          selected
            ? "border-[1.5px] border-mk-primary bg-[#F0E9FE] font-semibold text-mk-primary"
            : "border-mk-border bg-white text-mk-muted hover:border-mk-lilac",
          FOCUS,
        ].join(" ")}
      >
        <Icon className="h-4 w-4" />
        {label}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-[420px] rounded-t-mk-xl bg-white p-5 shadow-mk-raised sm:rounded-mk-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={t("profile.phone_change_title", "تغيير رقم الجوال")}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3 className="m-0 text-[16px] font-bold text-mk-text-strong">
              {step === "phone"
                ? t("profile.phone_change_title", "تغيير رقم الجوال")
                : t("profile.phone_change_verify_title", "تأكيد الرقم الجديد")}
            </h3>
            <p className="m-0 mt-1.5 text-[12.5px] leading-relaxed text-mk-muted">
              {step === "phone"
                ? t(
                    "profile.phone_change_sub",
                    "أدخل رقمك الجديد وسنرسل لك رمز تحقق للتأكد من ملكيته.",
                  )
                : `${t("profile.phone_change_verify_sub", "أدخل الرمز المُرسل إلى")} ${sentRef.current.countryCode} ${sentRef.current.phone}`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close", "إغلاق")}
            className={`shrink-0 rounded-full p-1 text-mk-muted hover:bg-mk-tint3 ${FOCUS}`}
          >
            <IoMdClose className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-3 rounded-mk-sm border border-red-200 bg-red-50 px-3 py-2 text-[12.5px] text-red-700">
            {error}
          </div>
        )}

        {step === "phone" ? (
          <>
            {currentPhone && (
              <div className="mb-3 flex items-center gap-2 rounded-mk-sm bg-[#F7F5FD] px-3 py-2 text-[12.5px]">
                <span className="text-mk-muted">
                  {t("profile.phone_change_current", "الحالي:")}
                </span>
                <span dir="ltr" className="font-semibold text-mk-text-strong">
                  {currentPhone}
                </span>
              </div>
            )}

            <label className="mb-1.5 block text-[13px] font-semibold text-mk-text-strong">
              {t("profile.phone_change_new_number", "الرقم الجديد")}
            </label>
            <div className="mb-4 flex items-center gap-2 rounded-mk-sm border border-mk-border bg-white px-2 py-1">
              <CountryCodeSelect value={countryCode} onChange={setCountryCode} />
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="5XXXXXXXX"
                dir="ltr"
                className="flex-1 bg-transparent px-2 py-2 text-[13.5px] outline-none"
              />
            </div>

            <label className="mb-1.5 block text-[13px] font-semibold text-mk-text-strong">
              {t("profile.phone_change_send_via", "إرسال الرمز عبر")}
            </label>
            <div className="mb-5 flex gap-2.5">
              {methodButton("whatsapp", t("profile.otp_whatsapp", "واتساب"), FaWhatsapp)}
              {methodButton("sms", t("profile.otp_sms", "رسالة نصية"), HiOutlineChatAlt2)}
            </div>

            <button
              type="button"
              onClick={requestCode}
              disabled={busy}
              className={`w-full rounded-mk-md bg-mk-primary py-3 text-[14.5px] font-bold text-white disabled:opacity-60 ${FOCUS}`}
            >
              {busy
                ? t("common.loading", "جارٍ...")
                : t("profile.phone_change_send_code", "إرسال رمز التحقق")}
            </button>
          </>
        ) : (
          <>
            <label className="mb-1.5 block text-[13px] font-semibold text-mk-text-strong">
              {t("profile.phone_change_code", "رمز التحقق")}
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              dir="ltr"
              className="mb-4 w-full rounded-mk-sm border border-mk-border bg-white py-3 text-center text-[20px] font-bold tracking-[8px] outline-none"
            />

            <button
              type="button"
              onClick={verifyCode}
              disabled={busy}
              className={`w-full rounded-mk-md bg-mk-primary py-3 text-[14.5px] font-bold text-white disabled:opacity-60 ${FOCUS}`}
            >
              {busy
                ? t("common.loading", "جارٍ...")
                : t("profile.phone_change_confirm", "تأكيد وتغيير الرقم")}
            </button>

            <div className="mt-2 flex items-center justify-center gap-4 text-[12.5px]">
              <button
                type="button"
                onClick={requestCode}
                disabled={busy || resendIn > 0}
                className={`text-mk-primary disabled:text-mk-muted ${FOCUS}`}
              >
                {resendIn > 0
                  ? `${t("profile.phone_change_resend_in", "إعادة الإرسال بعد")} ${resendIn}`
                  : t("profile.phone_change_resend", "إعادة إرسال الرمز")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("phone");
                  setError(null);
                }}
                disabled={busy}
                className={`text-mk-muted ${FOCUS}`}
              >
                {t("profile.phone_change_edit_number", "تعديل الرقم")}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChangePhoneModal;
