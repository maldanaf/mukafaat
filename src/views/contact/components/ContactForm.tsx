"use client";

// Removed unused imports
import { yupResolver } from "@hookform/resolvers/yup";
import { useTranslate } from "@hooks";
import { useMutation } from "@tanstack/react-query";
import { webApi } from "@network/services/mokafaatService";
import { contactFormSchema } from "@validations";
import { t } from "i18next";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { FaRegUser } from "react-icons/fa";
import { IoMailOutline, IoLocationOutline } from "react-icons/io5";
import { FiPhone } from "react-icons/fi";
import { BsSendSlash } from "react-icons/bs";
import { useIsRTL } from "@hooks";
import { useUserStore } from "@stores/userStore";
import { useProfile } from "@hooks/api/useMokafaatQueries";

type ContactFormValues = {
  fullName: string;
  mobileNumber: string;
  email: string;
  companyName: string | null;
  message: string;
};

const ContactForm = () => {
  const { translateValidationMessage } = useTranslate();
  const isRTL = useIsRTL();

  // تعبئة تلقائية لبيانات المستخدم المسجّل (قابلة للتعديل قبل الإرسال)
  const storeUser = useUserStore((s) => s.user);
  const token = useUserStore((s) => s.token);
  const { data: profileData, isFetched: profileFetched } = useProfile(!!token);
  const prefill = useMemo(() => {
    const raw = profileData as Record<string, unknown> | undefined;
    const data = (raw?.data ?? raw) as Record<string, unknown> | undefined;
    const u = (data?.user ?? data) as Record<string, unknown> | undefined;
    const fullName =
      [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() ||
      (u?.name as string) ||
      storeUser?.name ||
      "";
    const phone = String(u?.phone ?? storeUser?.phone ?? "").trim();
    const dial = String(u?.country_code ?? "").replace(/^\+/, "").trim();
    return {
      fullName,
      email: String(u?.email ?? storeUser?.email ?? "").trim(),
      mobileNumber: phone && dial ? `+${dial}${phone}` : phone,
    };
  }, [profileData, storeUser]);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors },
  } = useForm<ContactFormValues>({
    // Casting resolver due to mismatch between yup and RHF resolver generics
    resolver: yupResolver(
      contactFormSchema(translateValidationMessage)
    ) as unknown as import("react-hook-form").Resolver<ContactFormValues>,
    defaultValues: {
      fullName: "",
      email: "",
      mobileNumber: "",
      companyName: null,
      message: "",
    },
  });

  // تُطبَّق مرة واحدة فقط ولا تمسح ما كتبه المستخدم
  const prefilled = useRef(false);
  useEffect(() => {
    if (prefilled.current) return;
    // ننتظر وصول بيانات البروفايل حتى لا نعبّئ رقماً بلا مقدمة الدولة
    if (token && !profileFetched) return;
    if (!prefill.fullName && !prefill.email && !prefill.mobileNumber) return;
    const current = getValues();
    if (current.fullName || current.email || current.mobileNumber) return;
    prefilled.current = true;
    reset({
      fullName: prefill.fullName,
      email: prefill.email,
      mobileNumber: prefill.mobileNumber,
      companyName: null,
      message: "",
    });
  }, [prefill, getValues, reset, token, profileFetched]);

  const {
    mutate,
    data: response,
    isPending,
  } = useMutation({
    mutationFn: (params: {
      name: string;
      email: string;
      phone: string;
      subject: string;
      message: string;
    }) => webApi.contact(params),
  });

  const body = response?.data as
    | { status?: boolean; message?: string }
    | undefined;

  useEffect(() => {
    if (body?.status === true) {
      toast(t("messages.messageSent"));
      reset({
        fullName: prefill.fullName,
        email: prefill.email,
        mobileNumber: prefill.mobileNumber,
        companyName: null,
        message: "",
      });
    } else if (body?.status === false && body?.message) {
      toast(body.message);
    }
  }, [body?.status, body?.message, reset, prefill]);

  const submitForm = (data: ContactFormValues) => {
    mutate({
      name: data.fullName,
      email: data.email,
      phone: data.mobileNumber,
      subject: data.companyName ?? "",
      message: data.message,
    });
  };

  return (
    <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-8 lg:w-2/3 w-full">
      {prefilled.current && (
        <p className="mb-4 rounded-mk-md bg-mk-tint3 px-4 py-2.5 text-[13px] text-mk-muted">
          {t("contactUs.prefill_note")}
        </p>
      )}
      <form onSubmit={handleSubmit(submitForm)} className="space-y-4">
        {/* Two Column Input Section */}
        <div className="grid md:grid-cols-2 grid-cols-1 gap-4">
          {/* Left Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {isRTL ? "الاسم الكامل" : t("contact.fName")}
              </label>
              <div className="relative">
                <input
                  {...register("fullName")}
                  type="text"
                  placeholder={t("contact.t_802b71", "أدخل اسمك")}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#400198] focus:border-transparent pr-10"
                />
                <FaRegUser className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              </div>
              {errors.fullName?.message && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {isRTL ? "رقم الهاتف" : t("contact.mNumber")}
              </label>
              <div className="relative">
                <input
                  {...register("mobileNumber")}
                  type="tel"
                  placeholder={t("contact.t_decebe", "أدخل رقم الهاتف")}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#400198] focus:border-transparent pr-10"
                />
                <FiPhone className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              </div>
              {errors.mobileNumber?.message && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.mobileNumber.message}
                </p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {isRTL ? "البريد الإلكتروني" : t("contact.email")}
              </label>
              <div className="relative">
                <input
                  {...register("email")}
                  type="email"
                  placeholder={
                    t("contact.t_0ad388", "أدخل بريدك الإلكتروني")
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#400198] focus:border-transparent pr-10"
                />
                <IoMailOutline className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              </div>
              {errors.email?.message && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                {isRTL ? "اسم الشركة" : t("contact.cName")}
              </label>
              <div className="relative">
                <input
                  {...register("companyName")}
                  type="text"
                  placeholder={t("contact.t_390f0c", "أدخل اسم الشركة")}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#400198] focus:border-transparent pr-10"
                />
                <IoLocationOutline className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
              </div>
              {errors.companyName?.message && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.companyName.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Message Textarea */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">
            {isRTL ? "الرسالة" : t("contact.msg")}
          </label>
          <textarea
            {...register("message")}
            placeholder={t("contact.t_8c9c16", "أدخل رسالتك هنا")}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#400198] focus:border-transparent resize-none"
          />
          {errors.message?.message && (
            <p className="text-red-500 text-sm mt-1">
              {errors.message.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="text-center pt-0">
          <button
            type="submit"
            disabled={isPending}
            className="bg-[#400198] h-[45px]  justify-center hover:scale-105 transition-transform duration-300 text-sm sm:text-md px-8 sm:px-8 lg:px-8 py-2 sm:py-2 font-semibold rounded-full text-white flex items-center justify-center gap-2 cursor-pointer"
          >
            {isPending ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <BsSendSlash className="text-lg" />
            )}
            {isRTL ? "إرسال" : t("contact.send")}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
