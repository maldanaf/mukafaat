"use client";

import { useEffect, useRef } from "react";

/**
 * Sentinel-based infinite scroll. Triggers `loadMore()` ONCE per visibility cycle.
 * User must scroll AWAY from the sentinel and back before another trigger fires.
 * This prevents the "cascade load all pages until footer" bug.
 *
 * Pair with a manual "Load More" button using the same `loadMore`.
 */
export function useLoadMoreOnScroll({
  hasMore,
  loading,
  loadMore,
  rootMargin = "200px",
}: {
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
  rootMargin?: string;
}) {
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // قُفل لكل دورة ظهور: لا يطلق مرة ثانية حتى يخرج السنتنل من الشاشة ثم يعود
  const armedRef = useRef(true);
  // نحفظ القيم الحالية في ref ليلتقطها الـ observer بأحدث نسخة
  const stateRef = useRef({ hasMore, loading, loadMore });
  stateRef.current = { hasMore, loading, loadMore };

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          const s = stateRef.current;
          if (armedRef.current && s.hasMore && !s.loading) {
            armedRef.current = false;
            s.loadMore();
          }
        } else {
          // السنتنل خرج من الشاشة → أعد التسليح للضغطة التالية
          armedRef.current = true;
        }
      },
      { rootMargin, threshold: 0 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return sentinelRef;
}
