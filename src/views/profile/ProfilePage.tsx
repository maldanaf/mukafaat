"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { useUserStore } from "@stores/userStore";
import { toast } from "react-toastify";
import {
  IoPersonOutline,
  IoMailOutline,
  IoCallOutline,
  IoCalendarOutline,
  IoCheckmarkCircleOutline,
  IoCameraOutline,
  IoSparklesOutline,
  IoEarthOutline,
  IoLocationOutline,
  IoFlashOutline,
  IoWalletOutline,
  IoHeartOutline,
  IoReceiptOutline,
} from "react-icons/io5";
import {
  useProfile,
  useProfileUpdate,
  useSubscriptionStatus,
  useCountries,
  useGeoCountries,
  useCitiesByCountry,
  mokafaatKeys,
} from "@hooks/api/useMokafaatQueries";
import { useQueryClient } from "@tanstack/react-query";
import { isUserSubscribed } from "@utils/subscription";
import CountryCodeSelect from "@components/CountryCodeSelect";
import MembershipTierCard from "@components/MembershipTierCard";
import MembershipCard from "@components/account/MembershipCard";
import DeleteAccountSection from "@components/account/DeleteAccountSection";
import { Badge, Button, EmptyState, FOCUS } from "@ui";
import { parseMembershipTier } from "@utils/subscriptionPricing";
import { parseGeoCountries } from "@utils/geo";
import {
  AccountPageHead,
  AccountPanel,
  AccountRow,
  AccountUpsell,
} from "./components/AccountKit";

/**
 * حقل بيانات موحّد — عرض أو تحرير بنفس الإطار.
 * مُعرَّف على مستوى الوحدة حتى لا يُعاد بناء الحقول عند كل ضغطة مفتاح.
 */
const Field: React.FC<{
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}> = ({ icon, label, children }) => (
  <div className="rounded-mk-md border border-mk-border bg-grad-mist p-3.5">
    <span className="mb-2 flex items-center gap-1.5 text-[11.5px] font-bold text-mk-muted">
      <span aria-hidden className="text-mk-primary">
        {icon}
      </span>
      {label}
    </span>
    {children}
  </div>
);

/** أصناف حقول الإدخال في منطقة الحساب */
const INPUT_CLASS =
  "w-full rounded-mk-sm border border-mk-border-strong bg-white px-3.5 py-2.5 text-[13.5px] text-mk-text outline-none transition-colors focus:border-mk-primary focus:ring-2 focus:ring-[#400198]/15";

const ProfilePage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isRTL = useIsRTL();
  const dateLocale = useMemo(() => {
    const b = i18n.language?.split("-")[0] || "en";
    if (b === "ar") return "ar-SA";
    if (b === "ur") return "ur-PK";
    if (b === "hi") return "hi-IN";
    return "en-US";
  }, [i18n.language]);
  const { user } = useUserStore();
  const { data: profileData, refetch: refetchProfile } = useProfile();
  const { data: subscriptionData } = useSubscriptionStatus(!!user);
  const profileUpdateMutation = useProfileUpdate();

  // استخراج بيانات البروفايل من استجابة API: { data: { user: { first_name, last_name, email, phone, ... } }, user_meta }
  const profile = useMemo(() => {
    const raw = profileData as Record<string, unknown> | undefined;
    if (!raw) return null;
    const data = raw.data as Record<string, unknown> | undefined;
    const userObj = (data?.user ?? data) as Record<string, unknown> | undefined;
    if (!userObj) return null;
    const firstName = (userObj.first_name ?? userObj.name) as
      | string
      | undefined;
    const lastName = userObj.last_name as string | undefined;
    const fullName =
      [firstName, lastName].filter(Boolean).join(" ").trim() ||
      (userObj.name as string) ||
      "";
    const stats = (userObj.stats ?? {}) as Record<string, number | undefined>;
    return {
      name: fullName || (user?.name ?? ""),
      email: (userObj.email ?? user?.email ?? "") as string,
      phone: (userObj.phone ?? userObj.mobile ?? user?.phone ?? "") as string,
      countryCode:
        (((userObj.country_code as string) ?? "").replace(/^\+/, "") || "966"),
      avatar: (userObj.avatar ?? userObj.image ?? user?.avatar) as
        | string
        | undefined,
      createdAt: (userObj.created_at ??
        userObj.createdAt ??
        user?.createdAt) as string | undefined,
      isVerified: (userObj.is_profile_completed ??
        userObj.is_verified ??
        user?.isVerified) as boolean | undefined,
      favoritesCount: stats.favorites_count ?? 0,
      ordersCount: stats.orders_count ?? 0,
      followingCount: stats.following_count ?? 0,
    };
  }, [profileData, user]);

  // مستوى العضوية (تصنيف العميل) — يأتي مع /api/profile
  const membershipTier = useMemo(
    () => parseMembershipTier(profileData),
    [profileData],
  );

  const userMeta = useMemo(() => {
    const raw = profileData as Record<string, unknown> | undefined;
    const data = raw?.data as Record<string, unknown> | undefined;
    return (raw?.user_meta ?? data?.user_meta) as
      | Record<string, unknown>
      | undefined;
  }, [profileData]);

  const displayUser = profile ?? {
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    countryCode: "966",
    avatar: user?.avatar,
    createdAt: user?.createdAt,
    isVerified: user?.isVerified,
    favoritesCount: 0,
    ordersCount: 0,
    followingCount: 0,
  };

  const profileUser = profileData as Record<string, unknown> | undefined;
  const profileUserObj = (
    profileUser?.data as Record<string, unknown> | undefined
  )?.user as Record<string, unknown> | undefined;
  const hasSubscriptionFromProfile = Boolean(
    profileUserObj?.has_subscription ?? userMeta?.has_active_subscription,
  );
  const isSubscribed =
    hasSubscriptionFromProfile || isUserSubscribed(subscriptionData);
  const subRaw =
    (subscriptionData as Record<string, unknown>)?.data ?? subscriptionData;
  const sub = subRaw as Record<string, unknown> | undefined;
  const planObj = sub?.plan as Record<string, unknown> | undefined;
  const subObj = sub?.subscription as Record<string, unknown> | undefined;
  const profileSubscription = profileUserObj?.subscription as
    | Record<string, unknown>
    | null
    | undefined;
  const planFromSub = profileSubscription?.plan as
    | Record<string, unknown>
    | undefined;
  const planName = (profileSubscription?.plan_name ??
    planFromSub?.name ??
    sub?.plan_name ??
    planObj?.name ??
    subObj?.plan_name) as string | undefined;
  const expiresAt = (profileSubscription?.end_date ??
    profileSubscription?.expires_at ??
    sub?.expires_at ??
    subObj?.expires_at ??
    sub?.end_date) as string | undefined;
  const walletBalance =
    Number(profileUserObj?.wallet_balance ?? userMeta?.wallet_balance ?? 0) ||
    0;

  const subscriptionStatusActive =
    String(profileSubscription?.status ?? "").toLowerCase() === "active";
  const showMembershipCard =
    Boolean(
      profileUserObj?.has_subscription ?? userMeta?.has_active_subscription,
    ) && subscriptionStatusActive;
  const membershipNumber = String(
    profileUserObj?.membership_number ?? "",
  ).trim();
  const cardFullName =
    [profileUserObj?.first_name, profileUserObj?.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() || displayUser.name;

  const [isEditing, setIsEditing] = useState(false);
  const initialCountryId = useMemo(() => {
    const c = profileUserObj?.country as Record<string, unknown> | undefined;
    return c?.id != null ? Number(c.id) : null;
  }, [profileUserObj]);
  const initialRegionId = useMemo(() => {
    const r = profileUserObj?.region as Record<string, unknown> | undefined;
    return r?.id != null ? Number(r.id) : null;
  }, [profileUserObj]);
  const initialCityId = useMemo(() => {
    const c = profileUserObj?.city as Record<string, unknown> | undefined;
    return c?.id != null ? Number(c.id) : null;
  }, [profileUserObj]);

  const [formData, setFormData] = useState({
    name: displayUser.name || "",
    email: displayUser.email || "",
    phone: displayUser.phone || "",
    countryCode: displayUser.countryCode || "966",
    countryId: initialCountryId as number | null,
    regionId: initialRegionId as number | null,
    cityId: initialCityId as number | null,
  });
  const [isLoading, setIsLoading] = useState(false);

  // Location dropdowns — كل مدن الدولة بدون فلتر بالمنطقة
  const { data: countries = [] } = useCountries();
  // «دولة واحدة مفعّلة» → لا نعرض خطوة اختيار الدولة إطلاقاً
  const { data: geoData } = useGeoCountries();
  const geo = useMemo(() => parseGeoCountries(geoData), [geoData]);
  const singleCountry = geo.loaded && geo.singleCountry && !!geo.onlyCountry;
  const { data: cities = [] } = useCitiesByCountry(formData.countryId);
  const queryClient = useQueryClient();
  // في وضع «الدولة الواحدة» نثبّت الدولة تلقائياً بلا خطوة اختيار
  useEffect(() => {
    if (!singleCountry || !geo.onlyCountry) return;
    setFormData((p) =>
      p.countryId === geo.onlyCountry!.id
        ? p
        : { ...p, countryId: geo.onlyCountry!.id },
    );
  }, [singleCountry, geo.onlyCountry, isEditing]);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setFormData({
        name: displayUser.name || "",
        email: displayUser.email || "",
        phone: displayUser.phone || "",
        countryCode: displayUser.countryCode || "966",
        countryId: initialCountryId,
        regionId: initialRegionId,
        cityId: initialCityId,
      });
    }
  }, [
    displayUser.name,
    displayUser.email,
    displayUser.phone,
    displayUser.countryCode,
    isEditing,
    initialCountryId,
    initialRegionId,
    initialCityId,
  ]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async () => {
    const phoneDigits = (formData.phone || "").replace(/\D/g, "");
    if (phoneDigits && phoneDigits.length < 8) {
      toast.error(t("profile.err_phone_invalid", "رقم الهاتف غير صحيح"));
      return;
    }
    setIsLoading(true);
    try {
      const [first, ...rest] = (formData.name || "").trim().split(/\s+/);
      const last = rest.join(" ") || "";
      const dial = (formData.countryCode || "966").replace(/\D/g, "");
      const res = await profileUpdateMutation.mutateAsync({
        name: formData.name?.trim() || undefined,
        first_name: first || formData.name || undefined,
        last_name: last || undefined,
        email: formData.email?.trim() || undefined,
        phone: phoneDigits || undefined,
        country_code: phoneDigits ? `+${dial}` : undefined,
        country_id: formData.countryId ?? undefined,
        region_id: formData.regionId ?? undefined,
        city_id: formData.cityId ?? undefined,
      });
      const payload = (res?.data ?? res) as Record<string, unknown>;
      const ok = payload?.status !== false && payload?.status !== "error";
      if (ok) {
        setIsEditing(false);
        toast.success(
          (payload?.msg ??
            payload?.message ??
            t("profile.toast_profile_updated")) as string,
        );
        await refetchProfile();
        // إعادة تحميل البيانات المعتمدة على الموقع بعد تغيير المدينة/الدولة
        queryClient.invalidateQueries({ queryKey: ["mokafaat", "web", "home"] });
        queryClient.invalidateQueries({ queryKey: ["mokafaat", "web", "offers"] });
        queryClient.invalidateQueries({ queryKey: ["mokafaat", "home"] });
        queryClient.invalidateQueries({ queryKey: ["mokafaat", "web", "cards"] });
        queryClient.invalidateQueries({ queryKey: ["mokafaat", "web", "coupons"] });
        queryClient.invalidateQueries({ queryKey: ["mokafaat", "web", "popupAds"] });
      } else {
        toast.error(
          (payload?.msg ??
            payload?.message ??
            t("profile.toast_profile_failed")) as string,
        );
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      const errResponse = (
        error as { response?: { data?: { message?: string; msg?: string } } }
      )?.response?.data;
      const msg =
        errResponse?.message ??
        (error as { response?: { data?: { msg?: string } } })?.response?.data
          ?.msg;
      toast.error(msg ?? t("profile.toast_profile_error"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: displayUser.name || "",
      email: displayUser.email || "",
      phone: displayUser.phone || "",
      countryCode: displayUser.countryCode || "966",
      countryId: initialCountryId,
      regionId: initialRegionId,
      cityId: initialCityId,
    });
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error(t("profile.toast_image_invalid"));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t("profile.toast_image_too_large"));
      return;
    }
    setAvatarPreview(URL.createObjectURL(file));
    setIsUploadingAvatar(true);
    e.target.value = "";
    try {
      const res = await profileUpdateMutation.mutateAsync({ avatar: file });
      const payload = (res?.data ?? res) as Record<string, unknown>;
      const ok = payload?.status !== false && payload?.status !== "error";
      if (ok) {
        toast.success(t("profile.toast_avatar_ok"));
        setAvatarPreview(null);
        await refetchProfile();
      } else {
        toast.error(
          (payload?.msg ??
            payload?.message ??
            t("profile.toast_avatar_failed")) as string,
        );
        setAvatarPreview(null);
      }
    } catch (error) {
      console.error("Error updating avatar:", error);
      const errResponse = (
        error as { response?: { data?: { message?: string; msg?: string } } }
      )?.response?.data;
      const msg =
        errResponse?.message ??
        (error as { response?: { data?: { msg?: string } } })?.response?.data
          ?.msg;
      toast.error(msg ?? t("profile.toast_avatar_error"));
      setAvatarPreview(null);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const avatarSrc = avatarPreview ?? displayUser.avatar;


  if (!user) {
    return (
      <div className="flex min-h-[45vh] items-center justify-center px-4">
        <EmptyState
          icon={<IoPersonOutline />}
          title={t("profile.guest_title")}
          description={t("profile.guest_subtitle")}
          actionLabel={t("home.navbar.login", "تسجيل الدخول")}
          actionTo="/login"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
      <AccountPageHead
        title={t("profile.profile_info")}
        subtitle={
          isEditing ? t("profile.edit_mode_badge") : t("profile.view_mode_hint")
        }
        icon={<IoPersonOutline />}
        tint="purple"
        actions={
          <Button
            size="sm"
            variant={isEditing ? "outline" : "primary"}
            onClick={() => setIsEditing(!isEditing)}
          >
            {isEditing ? t("profile.cancel_editing") : t("profile.edit_profile")}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* ===== العمود الرئيسي: البيانات ===== */}
        <div className="space-y-5 lg:col-span-7 xl:col-span-8">
          <AccountPanel
            title={t("profile.profile_info")}
            subtitle={t("profile.label_full_name")}
            icon={<IoPersonOutline />}
            tint="purple"
          >
            {/* صورة الحساب + حالة التوثيق */}
            <div className="mb-4 flex items-center gap-4 rounded-mk-lg border border-mk-border bg-grad-mist p-3">
              <div className="relative shrink-0">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt=""
                    className="h-16 w-16 rounded-mk-md object-cover ring-2 ring-[#400198]/15"
                  />
                ) : (
                  <span className="flex h-16 w-16 items-center justify-center rounded-mk-md bg-grad-brand text-[24px] font-bold text-white shadow-mk-glow">
                    {(displayUser.name || "?").trim().charAt(0)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                  title={t("profile.change_photo")}
                  aria-label={t("profile.change_photo")}
                  className={`absolute -bottom-1.5 -end-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-grad-accent text-white shadow-mk-badge transition-transform hover:scale-105 active:scale-95 disabled:opacity-70 ${FOCUS}`}
                >
                  {isUploadingAvatar ? (
                    <span className="block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <IoCameraOutline className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <p className="m-0 truncate text-[15px] font-bold text-mk-text">
                  {displayUser.name}
                </p>
                <p className="m-0 mt-0.5 truncate text-[12px] text-mk-muted">
                  {displayUser.email}
                </p>
                <span className="mt-1.5 inline-flex">
                  <Badge
                    size="sm"
                    tone={displayUser.isVerified ? "grad-success" : "warning"}
                    icon={
                      displayUser.isVerified ? (
                        <IoCheckmarkCircleOutline className="h-3.5 w-3.5" />
                      ) : undefined
                    }
                  >
                    {displayUser.isVerified
                      ? t("profile.account_verified")
                      : t("profile.account_unverified")}
                  </Badge>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                icon={<IoPersonOutline className="h-4 w-4" />}
                label={t("profile.label_full_name")}
              >
                {isEditing ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={INPUT_CLASS}
                  />
                ) : (
                  <p className="m-0 text-[13.5px] font-bold text-mk-text">
                    {displayUser.name}
                  </p>
                )}
              </Field>

              <Field
                icon={<IoMailOutline className="h-4 w-4" />}
                label={t("profile.label_email")}
              >
                {isEditing ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={INPUT_CLASS}
                  />
                ) : (
                  <p className="m-0 break-all text-[13.5px] text-mk-text">
                    {displayUser.email}
                  </p>
                )}
              </Field>

              <Field
                icon={<IoCallOutline className="h-4 w-4" />}
                label={t("profile.label_phone")}
              >
                {isEditing ? (
                  <div
                    className="flex items-stretch gap-2 rounded-mk-sm border border-mk-border-strong bg-white px-2 focus-within:border-mk-primary focus-within:ring-2 focus-within:ring-[#400198]/15"
                    dir="ltr"
                  >
                    <div className="flex items-center border-e border-mk-border">
                      <CountryCodeSelect
                        value={formData.countryCode}
                        onChange={(dial) =>
                          setFormData((prev) => ({ ...prev, countryCode: dial }))
                        }
                      />
                    </div>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="5XXXXXXXX"
                      className="flex-1 bg-transparent px-2 py-2 text-[13.5px] outline-none"
                    />
                  </div>
                ) : (
                  <p className="m-0 text-[13.5px] text-mk-text" dir="ltr">
                    {displayUser.phone
                      ? `+${(displayUser.countryCode || "966").replace(/^\+/, "")} ${displayUser.phone}`
                      : t("profile.phone_not_set")}
                  </p>
                )}
              </Field>

              <Field
                icon={<IoCalendarOutline className="h-4 w-4" />}
                label={t("profile.label_join_date")}
              >
                <p className="m-0 text-[13.5px] text-mk-text">
                  {displayUser.createdAt
                    ? new Date(displayUser.createdAt).toLocaleDateString(dateLocale)
                    : t("profile.date_em_dash")}
                </p>
              </Field>

              <Field
                icon={<IoEarthOutline className="h-4 w-4" />}
                label={t("profile.label_country", "الدولة")}
              >
                {isEditing && !singleCountry ? (
                  <select
                    value={formData.countryId ?? ""}
                    onChange={(e) => {
                      const v = e.target.value ? Number(e.target.value) : null;
                      setFormData((p) => ({
                        ...p,
                        countryId: v,
                        regionId: null,
                        cityId: null,
                      }));
                    }}
                    className={INPUT_CLASS}
                  >
                    <option value="">
                      {t("profile.select_country", "اختر الدولة")}
                    </option>
                    {(countries as Array<{ id: number | string; name?: string }>).map(
                      (c) => (
                        <option key={String(c.id)} value={c.id}>
                          {c.name}
                        </option>
                      ),
                    )}
                  </select>
                ) : (
                  <p className="m-0 text-[13.5px] text-mk-text">
                    {(singleCountry ? geo.onlyCountry?.name : undefined) ||
                      ((profileUserObj?.country as Record<string, unknown> | undefined)
                        ?.name as string | undefined) ||
                      t("profile.not_set", "غير محدد")}
                  </p>
                )}
              </Field>

              <Field
                icon={<IoLocationOutline className="h-4 w-4" />}
                label={t("profile.label_city", "المدينة")}
              >
                {isEditing ? (
                  <select
                    value={formData.cityId ?? ""}
                    onChange={(e) => {
                      const v = e.target.value ? Number(e.target.value) : null;
                      setFormData((p) => ({ ...p, cityId: v }));
                    }}
                    disabled={!formData.countryId}
                    className={`${INPUT_CLASS} disabled:bg-mk-tint2 disabled:text-mk-faint`}
                  >
                    <option value="">
                      {formData.countryId
                        ? t("profile.select_city", "اختر المدينة")
                        : t("profile.select_country_first", "اختر الدولة أولاً")}
                    </option>
                    {(cities as Array<{ id: number | string; name?: string }>).map(
                      (c) => (
                        <option key={String(c.id)} value={c.id}>
                          {c.name}
                        </option>
                      ),
                    )}
                  </select>
                ) : (
                  <p className="m-0 text-[13.5px] text-mk-text">
                    {((profileUserObj?.city as Record<string, unknown> | undefined)
                      ?.name as string | undefined) ||
                      t("profile.not_set", "غير محدد")}
                  </p>
                )}
              </Field>
            </div>

            {isEditing && (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button onClick={handleSave} loading={isLoading} variant="accent">
                  {isLoading ? t("profile.saving") : t("profile.save_changes")}
                </Button>
                <Button onClick={handleCancel} variant="outline">
                  {t("profile.cancel")}
                </Button>
              </div>
            )}
          </AccountPanel>

          {/* روابط سريعة — نفس مربّعات «المزيد» في التطبيق */}
          <AccountPanel
            title={t("account.quick_links", "روابط سريعة")}
            icon={<IoFlashOutline />}
            tint="orange"
            flush
          >
            <div className="divide-y divide-mk-divider">
              <AccountRow
                to="/wallet"
                icon={<IoWalletOutline className="h-[17px] w-[17px]" />}
                tint="orange"
                label={t("profile.stat_wallet")}
                value={
                  <span className="shrink-0 text-[13.5px] font-bold tabular-nums text-mk-accent-dark">
                    {walletBalance}
                    {t("profile.wallet_currency_suffix")}
                  </span>
                }
              />
              <AccountRow
                to="/saved"
                icon={<IoHeartOutline className="h-[17px] w-[17px]" />}
                tint="red"
                label={t("profile.stat_favorites")}
                value={
                  <span className="shrink-0 text-[13.5px] font-bold tabular-nums text-mk-red">
                    {(displayUser as { favoritesCount?: number }).favoritesCount ?? 0}
                  </span>
                }
              />
              <AccountRow
                to="/orders"
                icon={<IoReceiptOutline className="h-[17px] w-[17px]" />}
                tint="teal"
                label={t("profile.stat_orders")}
                value={
                  <span className="shrink-0 text-[13.5px] font-bold tabular-nums text-[#0E9384]">
                    {(displayUser as { ordersCount?: number }).ordersCount ?? 0}
                  </span>
                }
              />
            </div>
          </AccountPanel>
        </div>

        {/* ===== العمود الجانبي: الاشتراك والعضوية ===== */}
        <div className="space-y-5 lg:col-span-5 xl:col-span-4">
          {isSubscribed ? (
            <AccountPanel
              title={t("profile.subscription_active")}
              subtitle={planName ?? undefined}
              icon={<IoSparklesOutline />}
              tint="teal"
            >
              <div className="space-y-2 text-[13px]">
                {planName && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-mk-muted">{t("profile.subscription_plan")}</span>
                    <span className="font-bold text-mk-text">{planName}</span>
                  </div>
                )}
                {expiresAt && (
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-mk-muted">{t("profile.subscription_expires")}</span>
                    <span className="font-bold text-mk-text">
                      {new Date(expiresAt).toLocaleDateString(dateLocale)}
                    </span>
                  </div>
                )}
                <Button
                  to="/subscription/plans?from=/profile"
                  variant="soft"
                  size="sm"
                  block
                  className="mt-2"
                >
                  {t("profileDashboard.menu_upgrade")}
                </Button>
              </div>
            </AccountPanel>
          ) : (
            <AccountUpsell
              icon={<IoSparklesOutline />}
              title={t("profile.subscription_inactive")}
              description={t(
                "account.upsell_desc",
                "فعّل اشتراكك لتفتح كل العروض والخصومات في مكان واحد.",
              )}
              ctaLabel={t("profile.subscribe_now")}
              to={`/subscription/plans?from=${encodeURIComponent("/profile")}`}
            />
          )}

          <MembershipTierCard tier={membershipTier} />

          {showMembershipCard && membershipNumber && (
            <MembershipCard
              fullName={cardFullName}
              membershipNumber={membershipNumber}
              idNumber={String(profileUserObj?.id_number ?? "").trim()}
              membershipQrUrl={
                profileUserObj?.membership_qr_url != null
                  ? String(profileUserObj.membership_qr_url)
                  : undefined
              }
            />
          )}

          {membershipNumber && (
            <Button to="/profile/card" variant="outline" block>
              {t("membershipCard.title")}
            </Button>
          )}

          <DeleteAccountSection />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
