import { useCallback, useEffect, useRef, useState } from "react";

/**
 * إشارة محور التمرير: ‎-1‎ في RTL و‎+1‎ في LTR.
 *
 * خارج الخطاف لا داخله: كانت مُعرَّفة بعد الـ useEffect الذي يستخدمها
 * فتقع في المنطقة الميتة الزمنية ويسقط المستمع بصمت.
 */
const axisSign = (el: HTMLElement): 1 | -1 =>
  getComputedStyle(el).direction === "rtl" ? -1 : 1;

/**
 * تمرير أفقي بأزرار وعجلة الماوس.
 *
 * منطق واحد بدل تكراره في كل شريط متمرّر: إشارة محور التمرير تُقرأ من
 * الاتجاه المحسوب لا من إشارة `scrollLeft` — فهي صفر عند الطرف الأول
 * في الاتجاهين، وكان الاستنتاج منها يخطئ في RTL فيُمرَّر عكس الجهة.
 */
export function useHorizontalScroller<T extends HTMLElement = HTMLDivElement>() {
  const trackRef = useRef<T | null>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  /** في RTL يكون scrollLeft سالباً، فنقيس بالقيمة المطلقة */
  const syncEdges = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const pos = Math.abs(el.scrollLeft);
    setEdges({ start: pos > 1, end: max - pos > 1 });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    syncEdges();
    el.addEventListener("scroll", syncEdges, { passive: true });

    // نراقب المسار وأبناءه: العناصر تُركَّب بعد وصول البيانات، وقياس
    // المسار وحده يقع قبلها فتخرج الحواف صفراً وتُخفى الأزرار
    const ro = new ResizeObserver(syncEdges);
    ro.observe(el);
    const mo = new MutationObserver(syncEdges);
    mo.observe(el, { childList: true, subtree: false });

    /**
     * عجلة الماوس العمودية تُحوَّل إلى تمرير أفقي.
     *
     * مستمع أصلي بـ passive:false — لأن onWheel في React سلبيّ افتراضياً
     * فيتجاهل المتصفّح فيه preventDefault ويبقى التمرير عمودياً.
     */
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = el.scrollWidth - el.clientWidth;
      if (max <= 0) return;

      const pos = Math.abs(el.scrollLeft);
      const forward = e.deltaY > 0;
      // عند الطرف نترك الحدث للصفحة حتى تُكمل تمريرها العمودي
      if ((forward && pos >= max - 1) || (!forward && pos <= 1)) return;

      e.preventDefault();
      el.scrollLeft += axisSign(el) * e.deltaY;
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      el.removeEventListener("scroll", syncEdges);
      el.removeEventListener("wheel", onWheel);
      ro.disconnect();
      mo.disconnect();
    };
  }, [syncEdges]);

  const scrollByStep = useCallback((dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({
      left: axisSign(el) * dir * Math.round(el.clientWidth * 0.75),
      behavior: "smooth",
    });
  }, []);

  return { trackRef, edges, scrollByStep, syncEdges };
}

export default useHorizontalScroller;
