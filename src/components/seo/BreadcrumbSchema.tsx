"use client";

import React from "react";
import { absoluteUrl } from "@config/site";

/**
 * سكيما فتات المسار (BreadcrumbList).
 *
 * تجعل جوجل يعرض مسار الصفحة في نتيجة البحث
 * (مكافآت › العروض › مطاعم) بدل الرابط الخام، فترتفع نسبة النقر.
 */
export interface Crumb {
  /** الاسم كما يظهر في النتيجة */
  name: string;
  /** المسار الداخلي — يُحوّل لرابط مطلق. اتركه فارغاً للصفحة الحالية */
  path?: string;
}

const BreadcrumbSchema: React.FC<{ items: Crumb[] }> = ({ items }) => {
  if (!items.length) return null;

  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      // العنصر الأخير بلا رابط — هو الصفحة الحالية
      ...(crumb.path ? { item: absoluteUrl(crumb.path) } : {}),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default BreadcrumbSchema;
