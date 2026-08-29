"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * يرجع `true` متى مرّ العنصر المرجعي بالكامل فوق الهيدر اللاصق —
 * أي حان وقت إظهار شريط مثبّت بديل تحته.
 *
 * ارتفاع الهيدر يُقرأ من `--mk-header-h` الذي ينشره `StickyHeaderSlot`،
 * لأنه يتغيّر بظهور شريط الإعلانات أو اختفائه. الشريط المثبّت للديسكتوب
 * وحده، وعلى الموبايل الهيدر مخفي فيكون المتغيّر صفراً.
 */
export function usePinnedUnderHeader(ref: RefObject<HTMLElement | null>): boolean {
  const [pinned, setPinned] = useState(false);

  useEffect(() => {
    let frame = 0;

    const measure = () => {
      frame = 0;
      const el = ref.current;
      if (!el) return;
      const headerH =
        parseInt(
          getComputedStyle(document.documentElement).getPropertyValue("--mk-header-h"),
          10,
        ) || 0;
      const isDesktop = window.matchMedia("(min-width: 1024px)").matches;
      setPinned(isDesktop && headerH > 0 && el.getBoundingClientRect().bottom <= headerH);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [ref]);

  return pinned;
}

export default usePinnedUnderHeader;
