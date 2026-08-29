"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
  /** دائري (لوجو/أفاتار) */
  circle?: boolean;
}

/** مستطيل تحميل واحد */
export const Skeleton: React.FC<SkeletonProps> = ({ className = "h-4 w-full", circle }) => (
  <span
    aria-hidden
    className={`mk-skeleton block ${circle ? "rounded-full" : "rounded-mk-sm"} ${className}`}
  />
);

/** عدّة أسطر نصية بعرض متفاوت */
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = "",
}) => (
  <span className={`flex flex-col gap-2 ${className}`} aria-hidden>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-3 ${i === lines - 1 ? "w-2/3" : "w-full"}`}
      />
    ))}
  </span>
);

/** هيكل كرت عرض/متجر (صورة + سطرين + شرائح) */
export const SkeletonCard: React.FC<{ className?: string; ratio?: string }> = ({
  className = "",
  ratio = "aspect-[16/10]",
}) => (
  <div
    className={`overflow-hidden rounded-mk-xl border border-mk-border bg-white shadow-mk-card ${className}`}
    aria-hidden
  >
    <Skeleton className={`${ratio} w-full rounded-none`} />
    <div className="flex flex-col gap-2.5 p-3.5">
      <Skeleton className="h-3.5 w-4/5" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  </div>
);

/** شبكة هياكل تحميل — تُستخدم في كل قسم يجلب قائمة */
export const SkeletonGrid: React.FC<{
  count?: number;
  className?: string;
  ratio?: string;
}> = ({
  count = 5,
  className = "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5",
  ratio,
}) => (
  <div className={className} role="status" aria-label="loading">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} ratio={ratio} />
    ))}
  </div>
);

/** هيكل صفوف قائمة (طلبات، هدايا، معاملات…) */
export const SkeletonRows: React.FC<{ count?: number; className?: string }> = ({
  count = 4,
  className = "",
}) => (
  <div className={`flex flex-col gap-3 ${className}`} role="status" aria-label="loading">
    {Array.from({ length: count }).map((_, i) => (
      <div
        key={i}
        className="flex items-center gap-3 rounded-mk-lg border border-mk-border bg-white p-4"
      >
        <Skeleton className="h-12 w-12" circle />
        <div className="flex-1">
          <SkeletonText lines={2} />
        </div>
      </div>
    ))}
  </div>
);

export default Skeleton;
