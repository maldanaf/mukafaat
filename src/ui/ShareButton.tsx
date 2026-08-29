"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import ShareModal from "@components/ShareModal";
import IconButton, { type IconButtonSize, type IconButtonTone } from "./IconButton";
import { ShareIcon } from "./icons";

interface Props {
  /** الرابط المُشارَك — افتراضياً رابط الصفحة الحالية */
  url?: string;
  title?: string;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  className?: string;
  /** يُستدعى بعد نجاح المشاركة (لتحديث عدّاد المشاركات تفاؤلياً) */
  onShared?: () => void;
}

/**
 * زر المشاركة الموحّد: يستخدم مشاركة النظام على الجوال إن توفّرت،
 * وإلا يفتح `ShareModal` (واتساب/تيليجرام/X/فيسبوك/لينكدإن/نسخ الرابط).
 */
const ShareButton: React.FC<Props> = ({
  url,
  title,
  tone = "soft",
  size = "md",
  className = "",
  onShared,
}) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const href = url ?? (typeof window !== "undefined" ? window.location.href : "");
  const label = t("ui.share", "مشاركة");
  const shareTitle = title ?? (typeof document !== "undefined" ? document.title : "");

  const handle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const nav = typeof navigator !== "undefined" ? navigator : undefined;
    if (nav && typeof nav.share === "function") {
      try {
        await nav.share({ title: shareTitle, url: href });
        onShared?.();
        return;
      } catch {
        /* المستخدم ألغى المشاركة أو المتصفح رفضها — نكمل للنافذة البديلة */
      }
    }
    setOpen(true);
  };

  return (
    <>
      <IconButton
        label={label}
        tone={tone}
        size={size}
        className={className}
        onClick={handle}
        renderIcon={(s) => <ShareIcon size={s} />}
      />
      {open && (
        <ShareModal
          url={href}
          title={shareTitle}
          onClose={() => {
            setOpen(false);
            onShared?.();
          }}
        />
      )}
    </>
  );
};

export default ShareButton;
