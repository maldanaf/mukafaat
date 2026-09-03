import React from "react";

/**
 * هيكل الصفحة أثناء التنقّل.
 *
 * بلا `loading.tsx` كان Next يعرض الصفحة فارغة حتى تصل بياناتها،
 * فيلتصق الفوتر بالهيدر لثوانٍ ويبدو الموقع مكسوراً. هذا الهيكل
 * يحجز مساحة المحتوى فلا يقفز التخطيط عند وصول البيانات.
 */
export default function PageSkeleton({
  cards = 8,
  withHero = true,
}: {
  cards?: number;
  withHero?: boolean;
}) {
  return (
    <div className="min-h-[70vh]" role="status" aria-label="جارٍ التحميل">
      {withHero && (
        <div className="bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] py-10">
          <div className="mx-auto w-full max-w-site px-4 sm:px-6">
            <div className="h-3 w-24 animate-pulse rounded-full bg-white/25" />
            <div className="mt-3 h-8 w-56 animate-pulse rounded-mk-sm bg-white/30" />
            <div className="mt-3 h-3 w-80 max-w-full animate-pulse rounded-full bg-white/20" />
          </div>
        </div>
      )}

      <div className="mx-auto w-full max-w-site px-4 py-6 sm:px-6">
        <div className="mb-6 h-12 animate-pulse rounded-mk-md bg-mk-tint2" />

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: cards }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-mk-lg border border-mk-border bg-white"
            >
              <div className="aspect-[2/1] w-full animate-pulse bg-mk-tint2" />
              <div className="space-y-2 p-3.5">
                <div className="h-4 w-3/4 animate-pulse rounded bg-mk-tint2" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-mk-tint3" />
                <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-mk-tint3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
