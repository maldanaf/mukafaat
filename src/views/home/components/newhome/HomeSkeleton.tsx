"use client";

import { CONTAINER } from "./tokens";
import { Skeleton, SkeletonGrid } from "@ui";

/** هيكل تحميل الرئيسية — يحفظ نفس أبعاد الأقسام فلا تقفز الصفحة عند وصول البيانات */
const HomeSkeleton: React.FC = () => (
  <div role="status" aria-label="loading" className="pb-10">
    {/* الهيرو */}
    <div className={`${CONTAINER} pt-5`}>
      <Skeleton className="aspect-[1200/455] w-full rounded-[28px]" />
    </div>

    {/* شريط البحث المرفوع فوق حدّ الهيرو */}
    <div className={`${CONTAINER} relative z-20 -mt-7 sm:-mt-9 lg:-mt-11`}>
      <Skeleton className="mx-auto h-[76px] w-full max-w-[1000px] rounded-[22px]" />
    </div>

    {/* بطاقات الخدمات */}
    <div className={`${CONTAINER} grid grid-cols-1 gap-4 pt-8 sm:grid-cols-2 sm:pt-10 lg:grid-cols-4`}>
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-[196px] w-full rounded-[20px]" />
      ))}
    </div>

    {/* شريط التصنيفات */}
    <div className="mt-12 bg-[#F7F5FC] py-[54px]">
      <div className={CONTAINER}>
        <Skeleton className="mb-2 h-4 w-24" />
        <Skeleton className="mb-6 h-8 w-56" />
        <div className="mk-scroll-x gap-3 py-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-[150px] w-[140px] rounded-[20px]" />
          ))}
        </div>
      </div>
    </div>

    {/* شبكة العروض */}
    <div className={`${CONTAINER} pt-12 sm:pt-14`}>
      <Skeleton className="mb-2 h-4 w-24" />
      <Skeleton className="mb-6 h-8 w-64" />
      <div className="mb-6 flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-24 rounded-full" />
        ))}
      </div>
      <SkeletonGrid count={5} />
    </div>
  </div>
);

export default HomeSkeleton;
