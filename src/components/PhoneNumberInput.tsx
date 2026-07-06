"use client";

import { useEffect, useState } from "react";
import { useIsRTL } from "@hooks";
import { Controller } from "react-hook-form";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/bootstrap.css";
import { defaultCountryCode } from "@utils/geoCountry";
import { api } from "@network/apiClient";
import { API_ENDPOINTS } from "@network/apiEndpoints";

const PhoneNumberInput: React.FC<{
  control: any;
  name: string;
  label: string;
  error?: string;
  dir?: "ltr" | "rtl";
}> = ({ control, name, label, error, dir = "ltr" }) => {
  const isRTL = useIsRTL();

  // اقتصار قائمة الدول على المفعّلة من لوحة التحكم (أكواد ISO بحروف صغيرة).
  const [onlyCountries, setOnlyCountries] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(API_ENDPOINTS.phoneCodes);
        const list = res?.data?.data?.phone_codes;
        if (cancelled || !Array.isArray(list)) return;
        const iso = list
          .map((c: any) => String(c.iso ?? "").toLowerCase())
          .filter((s: string) => s.length === 2);
        if (iso.length) setOnlyCountries(iso);
      } catch {
        // نتركها فارغة → تُعرض كل الدول (سلوك المكتبة الافتراضي).
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const restrictProps =
    onlyCountries.length > 0
      ? { onlyCountries, preferredCountries: onlyCountries.slice(0, 6) }
      : {};

  return (
    <div
      className={`input-group wow fadeInUp mt-3 ${
        isRTL ? "text-right" : "text-left"
      }`}
      dir={dir}
    >
      <label
        className={`text-sm text-title font-bold capitalize ${
          isRTL ? "text-right" : "text-left"
        }`}
      >
        {label}
      </label>
      <Controller
        name={name}
        control={control}
        rules={{ required: "Mobile Number Is Required" }}
        render={({ field }) => (
          <PhoneInput
            country={defaultCountryCode().toLowerCase()}
            {...restrictProps}
            value={field.value}
            onChange={(value) => field.onChange(value)}
            inputClass={`border-0 !w-full px-0 text-sm !border-[#e5e7eb] h-12 ${
              dir === "rtl" ? "pr-3" : "pl-3"
            }`}
            placeholder={
              dir === "rtl" ? "+966 5XXX XXX XX" : "+966 5XXX XXX XX"
            }
            enableSearch={true}
            disableSearchIcon={true}
            containerClass={dir === "rtl" ? "rtl-phone-input" : ""}
          />
        )}
      />
      {error && <span className="text-red-500 text-sm">{error}</span>}
    </div>
  );
};

export default PhoneNumberInput;
