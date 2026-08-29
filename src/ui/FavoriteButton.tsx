"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import IconButton, { type IconButtonSize, type IconButtonTone } from "./IconButton";
import { HeartIcon } from "./icons";

interface Props {
  active?: boolean;
  onToggle?: () => void;
  disabled?: boolean;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  className?: string;
}

/** زر المفضلة الموحّد — قلب مفرّغ، يمتلئ بالأحمر عند التفعيل */
const FavoriteButton: React.FC<Props> = ({
  active = false,
  onToggle,
  disabled = false,
  tone = "overlay",
  size = "md",
  className = "",
}) => {
  const { t } = useTranslation();

  return (
    <IconButton
      label={
        active
          ? t("ui.favorite.remove", "إزالة من المفضلة")
          : t("ui.favorite.add", "إضافة للمفضلة")
      }
      tone={tone}
      size={size}
      disabled={disabled}
      className={`${active ? "text-mk-red" : ""} ${className}`}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle?.();
      }}
      renderIcon={(s) => <HeartIcon size={s} filled={active} />}
    />
  );
};

export default FavoriteButton;
