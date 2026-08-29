"use client";

import React from "react";

/**
 * ===== أيقونات الموقع الموحّدة =====
 *
 * قبل هذا الملف كانت أيقونة المشاركة تُرسم بثلاث مكتبات مختلفة
 * (`BsShare` و`IoShareSocialOutline` و`LuShare2`)، والقلب بأربع صيغ،
 * والجرس بصيغتين. هنا مصدر واحد لكل منها — مرسومة كـ SVG داخلي
 * حتى تبقى متطابقة تماماً في كل مكان ومطابقة لتطبيق العميل:
 *
 *  - المشاركة: الأيقونة الكلاسيكية بثلاث نقاط موصولة بخطّين.
 *  - الإشعارات: جرس بخط خارجي + نقطة حمراء اختيارية عند وجود جديد.
 *  - المفضلة: قلب بخط خارجي، ويُملأ بالأحمر عند التفعيل.
 *
 * كلها ترث `currentColor` وتقبل `size` بالبكسل.
 */

export interface IconProps {
  /** الحجم بالبكسل (العرض = الارتفاع) */
  size?: number;
  className?: string;
  /** سماكة الخط للأيقونات المرسومة بخط خارجي */
  strokeWidth?: number;
  title?: string;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
}

/** توقيع موحّد يسمح بتبادل أيقوناتنا مع أيقونات `react-icons` في نفس المصفوفة */
export type MkIcon = React.ComponentType<{ size?: number; className?: string }>;

const base = (size: number, className: string) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  className,
  focusable: "false" as const,
  "aria-hidden": true,
});

/** أيقونة المشاركة الكلاسيكية — ثلاث نقاط موصولة (نفس شكل التطبيق) */
export const ShareIcon: React.FC<IconProps> = ({
  size = 18,
  className = "",
  strokeWidth = 1.7,
}) => (
  <svg {...base(size, className)} fill="none" stroke="currentColor">
    <circle cx="18" cy="5" r="2.6" strokeWidth={strokeWidth} />
    <circle cx="6" cy="12" r="2.6" strokeWidth={strokeWidth} />
    <circle cx="18" cy="19" r="2.6" strokeWidth={strokeWidth} />
    <path
      d="M8.35 10.78 15.66 6.6M8.35 13.22l7.31 4.18"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
  </svg>
);

/** جرس الإشعارات — مع نقطة حمراء عند وجود إشعارات غير مقروءة */
export const BellIcon: React.FC<IconProps & { dot?: boolean }> = ({
  size = 18,
  className = "",
  strokeWidth = 1.7,
  dot = false,
}) => (
  <svg {...base(size, className)} fill="none" stroke="currentColor">
    <path
      d="M18 8.4a6 6 0 1 0-12 0c0 5.2-1.8 6.6-1.8 6.6h15.6S18 13.6 18 8.4Z"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
    <path
      d="M13.6 18.6a1.9 1.9 0 0 1-3.2 0"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
    />
    {dot && <circle cx="18.4" cy="5.6" r="3" fill="#E8384F" stroke="none" />}
  </svg>
);

/** قلب المفضلة — مفرّغ افتراضياً، ممتلئ بالأحمر عند التفعيل */
export const HeartIcon: React.FC<IconProps & { filled?: boolean }> = ({
  size = 18,
  className = "",
  strokeWidth = 1.7,
  filled = false,
}) => (
  <svg
    {...base(size, className)}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
  >
    <path
      d="M12 20.3s-7.6-4.6-7.6-9.7A4.3 4.3 0 0 1 12 7.5a4.3 4.3 0 0 1 7.6 3.1c0 5.1-7.6 9.7-7.6 9.7Z"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
    />
  </svg>
);

export default { ShareIcon, BellIcon, HeartIcon };
