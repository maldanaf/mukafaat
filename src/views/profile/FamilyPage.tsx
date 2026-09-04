"use client";

import React, { useMemo, useState } from "react";
import { Navigate } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";
import { toast } from "react-toastify";
import { useUserStore } from "@stores/userStore";
import { useHydrated } from "@hooks/useHydrated";
import {
  useFamily,
  useFamilyInvitations,
  useFamilyInvite,
  useFamilyRemoveMember,
  useAcceptFamilyInvitation,
} from "@hooks/api/useMokafaatQueries";
import { Badge, Button, FOCUS } from "@ui";
import CountryCodeSelect from "@components/CountryCodeSelect";
import CurrencyIcon from "@components/CurrencyIcon";
import { formatPrice } from "@utils/subscriptionPricing";
import {
  IoPeopleOutline,
  IoPersonAddOutline,
  IoTrashOutline,
  IoLockClosedOutline,
  IoMailOpenOutline,
  IoSparklesOutline,
} from "react-icons/io5";
import {
  AccountEmpty,
  AccountError,
  AccountLoading,
  AccountPageHead,
  AccountPanel,
  AccountStat,
  AccountUpsell,
  IconBox,
  StatusBadge,
} from "./components/AccountKit";

interface FamilyMember {
  id: number | string;
  user_id?: number | null;
  name?: string | null;
  phone?: string | null;
  country_code?: string | null;
  relation?: string | null;
  role?: string;
  is_owner?: boolean;
  status?: string;
  avatar?: string | null;
  can_remove?: boolean;
  remove_blocked_reason?: string | null;
  membership_tier?: { name?: string; color?: string | null } | null;
}

interface FamilyData {
  has_family_plan?: boolean;
  is_owner?: boolean;
  is_member?: boolean;
  owner_name?: string | null;
  my_status?: string | null;
  group_id?: number;
  max_members?: number;
  used_seats?: number;
  remaining_seats?: number;
  plan?: {
    id?: number;
    name?: string;
    price?: number;
    status?: string;
    is_active?: boolean;
    end_date?: string | null;
  } | null;
  members?: FamilyMember[];
}

interface InvitationItem {
  id: number | string;
  owner_name?: string | null;
  invited_at?: string | null;
}

function parseFamily(payload: unknown): FamilyData | null {
  const raw = payload as Record<string, unknown> | undefined;
  if (!raw) return null;
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const family = (data.family ?? data) as Record<string, unknown> | undefined;
  if (!family || typeof family !== "object") return null;
  return family as FamilyData;
}

function parseInvitations(payload: unknown): InvitationItem[] {
  const raw = payload as Record<string, unknown> | undefined;
  if (!raw) return [];
  const data = (raw.data ?? raw) as Record<string, unknown>;
  const list = data.invitations ?? raw.invitations ?? data;
  return Array.isArray(list) ? (list as InvitationItem[]) : [];
}

function apiErrorMessage(err: unknown, fallback: string): string {
  const ax = err as {
    response?: { data?: { msg?: string; message?: string } };
  };
  return ax?.response?.data?.msg ?? ax?.response?.data?.message ?? fallback;
}

/** صفحة «أفراد العائلة»: العرض والإضافة ضمن حدّ الباقة، والمفعّل للعرض فقط */
const FamilyPage: React.FC = () => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const hydrated = useHydrated();
  const user = useUserStore((s) => s.user);

  const { data, isLoading, isError } = useFamily(!!user);
  const { data: invitationsData } = useFamilyInvitations(!!user);
  const inviteMutation = useFamilyInvite();
  const removeMutation = useFamilyRemoveMember();
  const acceptMutation = useAcceptFamilyInvitation();

  const family = useMemo(() => parseFamily(data), [data]);
  const invitations = useMemo(
    () => parseInvitations(invitationsData),
    [invitationsData],
  );

  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [countryDial, setCountryDial] = useState("966");

  if (!hydrated) return <AccountLoading hero rows={3} />;

  if (!user) {
    return (
      <Navigate
        to={`/login?returnUrl=${encodeURIComponent("/profile/family")}`}
        replace
      />
    );
  }

  const members = family?.members ?? [];
  const maxMembers = Number(family?.max_members ?? 0);
  const usedSeats = Number(family?.used_seats ?? 0);
  const remainingSeats = Number(family?.remaining_seats ?? 0);
  const seatsFull = maxMembers > 0 && remainingSeats <= 0;

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const phone = phoneDigits.replace(/\D/g, "");
    if (phone.length < 8) {
      toast.error(t("family.err_phone"));
      return;
    }
    inviteMutation.mutate(
      {
        phone,
        country_code: countryDial.replace(/\D/g, "") || "966",
        ...(name.trim() && { name: name.trim() }),
        ...(relation.trim() && { relation: relation.trim() }),
      },
      {
        onSuccess: () => {
          toast.success(t("family.invite_success"));
          setName("");
          setRelation("");
          setPhoneDigits("");
        },
        onError: (err) =>
          toast.error(apiErrorMessage(err, t("family.invite_failed"))),
      },
    );
  };

  const handleRemove = (member: FamilyMember) => {
    if (member.can_remove === false) return;
    if (!window.confirm(t("family.remove_confirm"))) return;
    removeMutation.mutate(member.id, {
      onSuccess: () => toast.success(t("family.remove_success")),
      onError: (err) =>
        toast.error(apiErrorMessage(err, t("family.remove_failed"))),
    });
  };

  const statusLabel = (status?: string) =>
    status === "active"
      ? t("family.status_active")
      : status === "pending"
        ? t("family.status_pending")
        : t("family.status_inactive");

  const inputClass =
    "w-full rounded-mk-md border border-mk-border-strong bg-white px-4 py-3 text-[13.5px] text-mk-text outline-none transition-colors placeholder:text-mk-faint focus:border-mk-primary focus:ring-2 focus:ring-[#400198]/15";

  return (
    <>
      <Helmet>
        <title>{t("family.meta_title")}</title>
      </Helmet>

      <div className="space-y-5" dir={isRTL ? "rtl" : "ltr"}>
        <AccountPageHead
          title={t("family.title")}
          subtitle={t("family.subtitle")}
          icon={<IoPeopleOutline />}
          tint="blue"
        />

        {/* ===== دعوات موجّهة لي ===== */}
        {invitations.length > 0 && (
          <AccountPanel
            title={t("family.invitations_title")}
            icon={<IoMailOpenOutline />}
            tint="amber"
            flush
          >
            <ul className="m-0 list-none divide-y divide-mk-divider p-0">
              {invitations.map((inv) => (
                <li
                  key={String(inv.id)}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:px-5"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <IconBox tint="amber" size="sm">
                      <IoMailOpenOutline className="h-[17px] w-[17px]" />
                    </IconBox>
                    <span className="min-w-0 truncate text-[13.5px] font-semibold text-mk-text">
                      {inv.owner_name || "—"}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="accent"
                    loading={acceptMutation.isPending}
                    onClick={() =>
                      acceptMutation.mutate(inv.id, {
                        onSuccess: () => toast.success(t("family.accept_success")),
                        onError: (err) =>
                          toast.error(
                            apiErrorMessage(err, t("family.accept_failed")),
                          ),
                      })
                    }
                  >
                    {acceptMutation.isPending
                      ? t("family.accepting")
                      : t("family.accept")}
                  </Button>
                </li>
              ))}
            </ul>
          </AccountPanel>
        )}

        {isLoading && <AccountLoading rows={4} />}

        {!isLoading && (isError || !family) && (
          <AccountError description={t("family.load_error")} />
        )}

        {/* ===== لست صاحب باقة عائلية ===== */}
        {!isLoading && family && !family.has_family_plan && (
          family.is_member ? (
            <AccountPanel
              title={t("family.member_of_title", { owner: family.owner_name || "—" })}
              icon={<IoPeopleOutline />}
              tint="blue"
            >
              <p className="m-0 text-[13px] leading-relaxed text-mk-muted">
                {t("family.member_of_desc")}
              </p>
            </AccountPanel>
          ) : (
            <AccountUpsell
              icon={<IoSparklesOutline />}
              title={t("family.no_plan_title")}
              description={t("family.no_plan_desc")}
              ctaLabel={t("family.upgrade_cta")}
              to="/subscription/plans?from=/profile/family"
            />
          )
        )}

        {/* ===== صاحب الباقة ===== */}
        {!isLoading && family?.has_family_plan && (
          <>
            {family.plan && (
              <AccountPanel
                title={family.plan.name || t("family.plan_title")}
                subtitle={
                  family.plan.end_date
                    ? t("family.plan_ends", { date: family.plan.end_date })
                    : t("family.plan_title")
                }
                icon={<IoSparklesOutline />}
                tint="violet"
                action={
                  <Badge
                    size="sm"
                    tone={family.plan.is_active ? "grad-success" : "neutral"}
                  >
                    {family.plan.is_active
                      ? t("family.plan_active")
                      : t("family.plan_inactive")}
                  </Badge>
                }
              >
                {family.plan.price != null && (
                  <p className="m-0 inline-flex items-center gap-1 text-[15px] font-bold text-mk-text">
                    {formatPrice(Number(family.plan.price))}
                    <CurrencyIcon className="text-mk-muted" size={12} />
                  </p>
                )}
              </AccountPanel>
            )}

            <div className="grid grid-cols-3 gap-2.5">
              <AccountStat tint="purple" label={t("family.max_members")} value={maxMembers} />
              <AccountStat tint="blue" label={t("family.used_seats")} value={usedSeats} />
              <AccountStat
                tint="teal"
                label={t("family.remaining_seats")}
                value={remainingSeats}
              />
            </div>

            {/* ===== الأفراد ===== */}
            <AccountPanel
              title={t("family.members_title")}
              icon={<IoPeopleOutline />}
              tint="blue"
              flush
            >
              {members.length === 0 ? (
                <div className="p-4 sm:p-5">
                  <AccountEmpty
                    icon={<IoPeopleOutline />}
                    title={t("family.no_members")}
                    description=""
                  />
                </div>
              ) : (
                <ul className="m-0 list-none divide-y divide-mk-divider p-0">
                  {members.map((member) => (
                    <li
                      key={String(member.id)}
                      className="flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-mk-md bg-grad-brand text-[15px] font-bold text-white">
                        {member.avatar ? (
                          <img
                            src={member.avatar}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          (member.name || member.phone || "?").toString().charAt(0)
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="m-0 flex flex-wrap items-center gap-1.5 truncate text-[13.5px] font-bold text-mk-text">
                          {member.name || member.phone}
                          {member.is_owner && (
                            <Badge size="sm" tone="grad-primary">
                              {t("family.owner")}
                            </Badge>
                          )}
                        </p>
                        <p className="m-0 mt-0.5 truncate text-[11.5px] text-mk-muted">
                          {member.phone}
                          {member.relation ? ` · ${member.relation}` : ""}
                          {member.membership_tier?.name
                            ? ` · ${member.membership_tier.name}`
                            : ""}
                        </p>
                      </div>

                      <StatusBadge
                        status={member.status}
                        label={statusLabel(member.status)}
                      />

                      {member.can_remove === false ? (
                        // بند 12: الفرد المفعّل يُعرض فقط ولا يُحذف — مع سبب المنع ظاهراً
                        <span
                          className="flex shrink-0 flex-col items-end gap-0.5"
                          title={member.remove_blocked_reason || t("family.cannot_remove")}
                        >
                          <span className="flex items-center gap-1 rounded-full bg-mk-tint2 px-2.5 py-1.5 text-[11px] font-semibold text-mk-muted">
                            <IoLockClosedOutline className="h-3.5 w-3.5" />
                            {t("family.view_only")}
                          </span>
                          <span className="max-w-[190px] text-end text-[10.5px] leading-snug text-mk-faint">
                            {member.remove_blocked_reason || t("family.cannot_remove")}
                          </span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemove(member)}
                          disabled={removeMutation.isPending}
                          aria-label={t("family.remove")}
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-mk-sm border border-[#F7DDE1] text-mk-red transition-colors hover:bg-[#FFF1F3] disabled:opacity-60 ${FOCUS}`}
                        >
                          <IoTrashOutline className="h-4 w-4" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </AccountPanel>

            {/* ===== إضافة فرد ضمن حدّ الباقة ===== */}
            <AccountPanel
              title={t("family.add_member")}
              subtitle={
                seatsFull
                  ? undefined
                  : t("family.remaining_seats") + ": " + remainingSeats
              }
              icon={<IoPersonAddOutline />}
              tint="orange"
            >
              {seatsFull ? (
                <p className="m-0 rounded-mk-md border border-[#FBE3C4] bg-[#FEF3E2] px-4 py-3 text-[13px] font-semibold text-mk-amber">
                  {t("family.seats_full")}
                </p>
              ) : (
                <form onSubmit={handleInvite}>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t("family.placeholder_name")}
                      className={inputClass}
                    />
                    <div className="flex gap-2" style={{ direction: "ltr" }}>
                      <div className="flex shrink-0 items-center rounded-mk-md border border-mk-border-strong bg-white px-1 py-1">
                        <CountryCodeSelect
                          value={countryDial}
                          onChange={setCountryDial}
                          className="w-auto"
                        />
                      </div>
                      <input
                        type="tel"
                        dir="ltr"
                        inputMode="numeric"
                        value={phoneDigits}
                        onChange={(e) =>
                          setPhoneDigits(e.target.value.replace(/[^\d]/g, ""))
                        }
                        placeholder={t("family.label_phone")}
                        className={`${inputClass} flex-1 text-start`}
                      />
                    </div>
                    <input
                      type="text"
                      value={relation}
                      onChange={(e) => setRelation(e.target.value)}
                      placeholder={t("family.placeholder_relation")}
                      className={inputClass}
                    />
                  </div>
                  <Button
                    type="submit"
                    variant="accent"
                    className="mt-3"
                    loading={inviteMutation.isPending}
                    icon={<IoPersonAddOutline />}
                  >
                    {inviteMutation.isPending
                      ? t("family.submitting")
                      : t("family.submit")}
                  </Button>
                </form>
              )}
            </AccountPanel>
          </>
        )}
      </div>
    </>
  );
};

export default FamilyPage;
