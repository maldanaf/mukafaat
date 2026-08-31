"use client";

import React from "react";
import { absoluteUrl } from "@config/site";

/**
 * سكيما عرض/بطاقة (Product + Offer) — تُظهر السعر والتوفّر في نتيجة البحث.
 */
export interface ProductSchemaProps {
  name: string;
  description?: string;
  image?: string | null;
  price?: number | string | null;
  currency?: string;
  path: string;
  brand?: string | null;
  inStock?: boolean;
  rating?: { value: number; count: number } | null;
}

const ProductSchema: React.FC<ProductSchemaProps> = ({
  name,
  description,
  image,
  price,
  currency = "SAR",
  path,
  brand,
  inStock = true,
  rating,
}) => {
  if (!name) return null;

  const numericPrice =
    price === null || price === undefined ? null : Number(price);

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    url: absoluteUrl(path),
    ...(description
      ? { description: description.replace(/<[^>]*>/g, " ").trim() }
      : {}),
    ...(image ? { image } : {}),
    ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
  };

  if (numericPrice !== null && Number.isFinite(numericPrice)) {
    schema.offers = {
      "@type": "Offer",
      price: numericPrice,
      priceCurrency: currency,
      url: absoluteUrl(path),
      availability: inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    };
  }

  // لا نُصرّح بتقييم صفري — جوجل يعدّه بيانات مضلّلة
  if (rating && rating.count > 0 && rating.value > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: rating.value,
      reviewCount: rating.count,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
};

export default ProductSchema;
