"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useUserStore } from "@stores/userStore";
import { useDeleteAccount } from "@hooks/api/useMokafaatQueries";
import { Button, FOCUS } from "@ui";
import { IoTrashOutline, IoWarningOutline } from "react-icons/io5";

/**
 * قسم «حذف الحساب» — `POST /api/profile/delete`.
 * يتطلّب كتابة كلمة تأكيد قبل التنفيذ (الحذف يلغي الاشتراكات الفعّالة).
 */
const DeleteAccountSection: React.FC = () => {
  const { t } = useTranslation();
  const logout = useUserStore((s) => s.logout);
  const remove = useDeleteAccount();

  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [reason, setReason] = useState("");

  const confirmWord = t("accountDelete.confirm_word");
  const canSubmit =
    confirm.trim().toLowerCase() === confirmWord.trim().toLowerCase();

  const handleDelete = () => {
    if (!canSubmit || remove.isPending) return;
    remove.mutate(reason.trim() || undefined, {
      onSuccess: (res: unknown) => {
        const body = (res ?? {}) as Record<string, unknown>;
        if (body.status === false) {
          toast.error((body.msg as string) || t("accountDelete.failed"));
          return;
        }
        toast.success(t("accountDelete.success"));
        logout();
        // إعادة تحميل كاملة لمسح كل الحالة والكاش بعد حذف الحساب
        window.location.replace("/");
      },
      onError: (err: unknown) => {
        const ax = err as { response?: { data?: { msg?: string } } };
        toast.error(ax?.response?.data?.msg ?? t("accountDelete.failed"));
      },
    });
  };

  return (
    <section className="mt-6 overflow-hidden rounded-mk-xl border border-[#F7DDE1] bg-white shadow-mk-card">
      <div className="flex items-start gap-3 px-5 py-4">
        <span
          aria-hidden
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-mk-md bg-[#FDE9EB] text-mk-red"
        >
          <IoWarningOutline className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-mk-text">
            {t("accountDelete.title")}
          </h3>
          <p className="mt-1 text-sm leading-relaxed text-mk-muted">
            {t("accountDelete.description")}
          </p>

          {!open ? (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 border-[#F0B9C1] text-mk-red hover:bg-[#FFF7F8]"
              icon={<IoTrashOutline />}
              onClick={() => setOpen(true)}
            >
              {t("accountDelete.cta")}
            </Button>
          ) : (
            <div className="mt-4 rounded-mk-md border border-[#F7DDE1] bg-[#FFF7F8] p-4">
              <p className="mb-3 text-sm font-semibold text-mk-text">
                {t("accountDelete.confirm_title")}
              </p>

              <label className="mb-1.5 block text-xs font-medium text-mk-muted">
                {t("accountDelete.reason_label")}
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className={`mb-3 w-full rounded-mk-md border border-mk-border bg-white px-4 py-2.5 text-sm text-mk-text ${FOCUS}`}
              />

              <label className="mb-1.5 block text-xs font-medium text-mk-muted">
                {t("accountDelete.confirm_hint")}
              </label>
              <input
                type="text"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder={confirmWord}
                className={`w-full rounded-mk-md border border-mk-border bg-white px-4 py-2.5 text-sm text-mk-text ${FOCUS}`}
              />

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  variant="danger"
                  size="sm"
                  disabled={!canSubmit || remove.isPending}
                  loading={remove.isPending}
                  onClick={handleDelete}
                >
                  {remove.isPending
                    ? t("accountDelete.submitting")
                    : t("accountDelete.submit")}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={remove.isPending}
                  onClick={() => {
                    setOpen(false);
                    setConfirm("");
                    setReason("");
                  }}
                >
                  {t("accountDelete.cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default DeleteAccountSection;
