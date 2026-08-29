"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Helmet } from "@/lib/helmet-compat";
import { useSearchParams } from "@/lib/router-compat";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { toast } from "react-toastify";
import {
  useGeoCountries,
  useCitiesByCountry,
  useCreateStoreRequest,
} from "@hooks/api/useMokafaatQueries";
import { parseGeoCountries, getStoredCountryId } from "@utils/geo";
import { LoadingSpinner } from "@components/LoadingSpinner";
import { CONTAINER, PageHero } from "@ui";
import {
  IoStorefrontOutline,
  IoBulbOutline,
  IoCheckmarkCircle,
} from "react-icons/io5";

type RequestType = "join" | "suggest";

const inputClass =
  "w-full rounded-mk-md border border-mk-border bg-mk-tint3 px-4 py-3 text-mk-text focus:border-[#400198] focus:outline-none focus:ring-2 focus:ring-[#400198]/20";
const labelClass = "block text-sm font-semibold text-mk-text mb-1.5";

/**
 * صفحة «متاجر مكافآت» بتابين:
 *  - انضمام متجر (join): بيانات المسؤول ورقم التواصل مطلوبة
 *  - اقتراح متجر (suggest): اسم المتجر والموقع فقط
 * الاثنان يرسلان POST /api/store-requests بـ source=web.
 */
const StoreRequestPage: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();

  // ?tab=suggest يفتح تاب «اقتراح متجر» مباشرة (روابط الفوتر)
  const [searchParams] = useSearchParams();
  const [type, setType] = useState<RequestType>(
    searchParams.get("tab") === "suggest" ? "suggest" : "join",
  );
  const [submitted, setSubmitted] = useState<RequestType | null>(null);

  const [storeName, setStoreName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [email, setEmail] = useState("");
  const [countryId, setCountryId] = useState<number | null>(null);
  const [cityId, setCityId] = useState<number | null>(null);
  const [cityName, setCityName] = useState("");
  const [cityNotListed, setCityNotListed] = useState(false);
  const [notes, setNotes] = useState("");

  const { data: geoData, isLoading: geoLoading } = useGeoCountries();
  const geo = useMemo(() => parseGeoCountries(geoData), [geoData]);
  const { data: cities = [] } = useCitiesByCountry(countryId);
  const createRequest = useCreateStoreRequest();

  // الدولة الافتراضية: الدولة الوحيدة عند single_country، وإلا المختارة محلياً
  useEffect(() => {
    if (!geo.loaded || countryId != null) return;
    if (geo.singleCountry && geo.onlyCountry) {
      setCountryId(geo.onlyCountry.id);
      return;
    }
    const stored = getStoredCountryId();
    if (stored != null && geo.countries.some((c) => c.id === stored)) {
      setCountryId(stored);
      return;
    }
    if (geo.countries[0]) setCountryId(geo.countries[0].id);
  }, [geo, countryId]);

  const resetForm = () => {
    setStoreName("");
    setContactName("");
    setContactPhone("");
    setEmail("");
    setCityId(null);
    setCityName("");
    setCityNotListed(false);
    setNotes("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!storeName.trim()) {
      toast.error(t("storeRequest.err_store_name"));
      return;
    }
    if (type === "join") {
      if (!contactName.trim()) {
        toast.error(t("storeRequest.err_contact_name"));
        return;
      }
      if (contactPhone.replace(/\D/g, "").length < 8) {
        toast.error(t("storeRequest.err_contact_phone"));
        return;
      }
    }
    if (countryId == null) {
      toast.error(t("storeRequest.err_country"));
      return;
    }
    if (!cityNotListed && cityId == null) {
      toast.error(t("storeRequest.err_city"));
      return;
    }
    if (cityNotListed && !cityName.trim()) {
      toast.error(t("storeRequest.err_city"));
      return;
    }

    createRequest.mutate(
      {
        type,
        store_name: storeName.trim(),
        ...(type === "join" && {
          contact_name: contactName.trim(),
          contact_phone: contactPhone.replace(/\D/g, ""),
        }),
        ...(email.trim() && { email: email.trim() }),
        country_id: countryId,
        ...(cityNotListed
          ? { city_name: cityName.trim() }
          : { city_id: cityId as number }),
        ...(notes.trim() && { notes: notes.trim() }),
        source: "web",
      },
      {
        onSuccess: (res: unknown) => {
          const data = (res ?? {}) as Record<string, unknown>;
          if (data.status === false) {
            toast.error(
              (data.msg as string) || t("storeRequest.failed"),
            );
            return;
          }
          setSubmitted(type);
          resetForm();
        },
        onError: (err: unknown) => {
          const ax = err as {
            response?: { data?: { msg?: string; message?: string } };
          };
          toast.error(
            ax?.response?.data?.msg ??
              ax?.response?.data?.message ??
              t("storeRequest.failed"),
          );
        },
      },
    );
  };

  const tabs: { key: RequestType; label: string; Icon: typeof IoStorefrontOutline }[] = [
    { key: "join", label: t("storeRequest.tab_join"), Icon: IoStorefrontOutline },
    { key: "suggest", label: t("storeRequest.tab_suggest"), Icon: IoBulbOutline },
  ];

  return (
    <>
      <Helmet>
        <title>{t("storeRequest.meta_title")} | Mokafaat</title>
      </Helmet>

      <PageHero
        title={t("storeRequest.title")}
        subtitle={t("storeRequest.subtitle")}
        crumbs={[
          { label: t("home.navbar.home", "الرئيسية"), to: "/" },
          { label: t("storeRequest.title") },
        ]}
      />

      <section className={`${CONTAINER} bg-mk-bg pb-16 pt-10`}>
        <div
          className="mx-auto max-w-3xl overflow-hidden rounded-mk-xl border border-mk-border bg-white shadow-mk-card"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* التابان */}
          <div className="grid grid-cols-2 border-b border-mk-border">
            {tabs.map(({ key, label, Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setType(key);
                  setSubmitted(null);
                }}
                className={`flex items-center justify-center gap-2 px-4 py-4 text-sm font-semibold transition-colors ${
                  type === key
                    ? "border-b-2 border-[#400198] bg-[#400198]/5 text-[#400198]"
                    : "text-mk-muted hover:bg-mk-tint3"
                }`}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            ))}
          </div>

          {submitted ? (
            <div className="px-6 py-14 text-center">
              <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <IoCheckmarkCircle className="h-9 w-9" />
              </span>
              <h2 className="mb-2 text-xl font-bold text-mk-text">
                {t("storeRequest.thanks_title")}
              </h2>
              <p className="mb-6 text-sm text-mk-muted">
                {submitted === "join"
                  ? t("storeRequest.thanks_join")
                  : t("storeRequest.thanks_suggest")}
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(null)}
                className="rounded-mk-md bg-[#fd671a] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#D9500B]"
              >
                {t("storeRequest.new_request")}
              </button>
            </div>
          ) : geoLoading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              <p className="text-sm text-mk-muted">
                {type === "join"
                  ? t("storeRequest.join_desc")
                  : t("storeRequest.suggest_desc")}
              </p>

              <div>
                <label className={labelClass}>
                  {t("storeRequest.label_store_name")}
                </label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder={t("storeRequest.placeholder_store_name")}
                  className={inputClass}
                />
              </div>

              {type === "join" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      {t("storeRequest.label_contact_name")}
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder={t("storeRequest.placeholder_contact_name")}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      {t("storeRequest.label_contact_phone")}
                    </label>
                    <input
                      type="tel"
                      dir="ltr"
                      inputMode="numeric"
                      value={contactPhone}
                      onChange={(e) =>
                        setContactPhone(e.target.value.replace(/[^\d+]/g, ""))
                      }
                      placeholder={t("storeRequest.placeholder_contact_phone")}
                      className={`${inputClass} text-start`}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className={labelClass}>
                  {t("storeRequest.label_email")}{" "}
                  <span className="font-normal text-mk-faint">
                    ({t("storeRequest.optional")})
                  </span>
                </label>
                <input
                  type="email"
                  dir="ltr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("storeRequest.placeholder_email")}
                  className={`${inputClass} text-start`}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* بند «الدولة الواحدة»: لا نعرض المنتقي عند دولة مفعّلة واحدة */}
                {!geo.singleCountry && (
                  <div>
                    <label className={labelClass}>
                      {t("storeRequest.label_country")}
                    </label>
                    <select
                      value={countryId ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCountryId(v ? Number(v) : null);
                        setCityId(null);
                      }}
                      className={inputClass}
                    >
                      <option value="">
                        {t("storeRequest.select_country")}
                      </option>
                      {geo.countries.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className={geo.singleCountry ? "sm:col-span-2" : ""}>
                  <label className={labelClass}>
                    {t("storeRequest.label_city")}
                  </label>
                  {cityNotListed ? (
                    <input
                      type="text"
                      value={cityName}
                      onChange={(e) => setCityName(e.target.value)}
                      placeholder={t("storeRequest.label_city_name")}
                      className={inputClass}
                    />
                  ) : (
                    <select
                      value={cityId ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        setCityId(v ? Number(v) : null);
                      }}
                      className={inputClass}
                      disabled={!cities.length}
                    >
                      <option value="">{t("storeRequest.select_city")}</option>
                      {cities.map((c) => (
                        <option key={String(c.id)} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCityNotListed((v) => !v);
                      setCityId(null);
                      setCityName("");
                    }}
                    className="mt-1.5 text-xs font-medium text-[#400198] hover:underline"
                  >
                    {cityNotListed
                      ? t("storeRequest.select_city")
                      : t("storeRequest.city_not_listed")}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  {t("storeRequest.label_notes")}{" "}
                  <span className="font-normal text-mk-faint">
                    ({t("storeRequest.optional")})
                  </span>
                </label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("storeRequest.placeholder_notes")}
                  className={`${inputClass} resize-y`}
                />
              </div>

              <button
                type="submit"
                disabled={createRequest.isPending}
                className="w-full rounded-mk-md bg-[#fd671a] px-10 py-3.5 text-base font-bold text-white shadow-mk-raised transition-colors hover:bg-[#D9500B] disabled:opacity-60 sm:w-auto"
              >
                {createRequest.isPending
                  ? t("storeRequest.submitting")
                  : t("storeRequest.submit")}
              </button>
            </form>
          )}
        </div>
      </section>
    </>
  );
};

export default StoreRequestPage;
