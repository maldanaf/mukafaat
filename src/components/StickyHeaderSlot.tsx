"use client";

import { useEffect, useRef } from "react";

/**
 * غلاف الهيدر اللاصق على الديسكتوب.
 *
 * الالتصاق هنا لا داخل `<header>`: العنصر اللاصق يتحرك في حدود أقرب سلف
 * يولّد كتلة، وارتفاع الغلاف يساوي ارتفاع الهيدر تماماً — فلو بقي
 * `sticky` على الهيدر وحده لما بقي له أي مجال وانزلق مع التمرير.
 *
 * كما ينشر ارتفاعه الفعلي في `--mk-header-h` ليستند إليه أي شريط لاصق
 * تحته (شريط التصنيفات في الرئيسية)، لأن الارتفاع يتغيّر بظهور أو
 * اختفاء شريط الإعلانات.
 */
export default function StickyHeaderSlot({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const publish = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty("--mk-header-h", `${h}px`);
    };

    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="sticky top-0 z-[60] hidden lg:block">
      {children}
    </div>
  );
}
