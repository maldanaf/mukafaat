"use client";

import React from "react";
import {
  RiUserLine,
  RiMedalLine,
  RiVipDiamondLine,
  RiVipCrownLine,
  RiStarLine,
  RiAwardLine,
  RiShieldStarLine,
} from "react-icons/ri";

/**
 * أيقونة مستوى العضوية — الـ API يرجع اسم أيقونة Remix (`icon: "ri-medal-line"`).
 * نخرّطها لمكوّن من `react-icons/ri` بدل استيراد الحزمة كاملة ديناميكياً.
 */
const MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  "ri-user-line": RiUserLine,
  "ri-medal-line": RiMedalLine,
  "ri-vip-diamond-line": RiVipDiamondLine,
  "ri-vip-crown-line": RiVipCrownLine,
  "ri-star-line": RiStarLine,
  "ri-award-line": RiAwardLine,
  "ri-shield-star-line": RiShieldStarLine,
};

interface Props {
  /** اسم الأيقونة كما يرد من الـ API (`membership_tier.icon`) */
  icon?: string | null;
  className?: string;
}

const TierIcon: React.FC<Props> = ({ icon, className = "h-6 w-6" }) => {
  const key = String(icon ?? "").trim().toLowerCase();
  const Cmp = MAP[key] ?? RiMedalLine;
  return <Cmp className={className} />;
};

export default TierIcon;
