"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import IconButton, { type IconButtonSize, type IconButtonTone } from "./IconButton";
import { BellIcon } from "./icons";

interface Props {
  to?: string;
  /** عدد غير المقروء — يُعرض كشارة، وإن كان 0 لا تظهر */
  count?: number | null;
  onClick?: () => void;
  tone?: IconButtonTone;
  size?: IconButtonSize;
  className?: string;
}

/** جرس الإشعارات الموحّد — نفس شكل جرس التطبيق مع شارة العدد */
const NotificationBell: React.FC<Props> = ({
  to = "/profile/notifications",
  count = null,
  onClick,
  tone = "soft",
  size = "md",
  className = "",
}) => {
  const { t } = useTranslation();
  const n = Number(count ?? 0);

  return (
    <IconButton
      label={t("ui.notifications", "الإشعارات")}
      tone={tone}
      size={size}
      className={className}
      to={onClick ? undefined : to}
      onClick={onClick}
      badge={n > 0 ? n : null}
      renderIcon={(s) => <BellIcon size={s} />}
    />
  );
};

export default NotificationBell;
