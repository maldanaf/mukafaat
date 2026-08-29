"use client";

import React, { useEffect, useRef, useState } from "react";

interface Props {
  children: React.ReactNode;
  /** تأخير بسيط لتتابع العناصر داخل الشبكة (بالميلي ثانية) */
  delay?: number;
  className?: string;
  /** وسم العنصر الحاوي — `div` افتراضاً حتى لا تتغيّر بنية الصفحة */
  as?: "div" | "section";
}

/**
 * ظهور تدريجي عند التمرير — بلا أي مكتبة خارجية.
 *
 * ثلاث طبقات أمان حتى لا يبقى محتوى مخفيّاً في أي بيئة:
 *  1) فحص فوري للموضع عند التركيب: ما هو داخل الشاشة أصلاً يظهر مباشرة.
 *  2) `IntersectionObserver` لما هو أسفل الطيّة.
 *  3) مستمع تمرير احتياطي يُزال فور الظهور.
 *
 * الأنماط في `src/index.css` (`.mk-reveal` / `.is-in`) وتحترم
 * `prefers-reduced-motion` تلقائياً.
 */
const Reveal: React.FC<Props> = ({ children, delay = 0, className = "", as = "div" }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    /** هل دخل العنصر نافذة العرض (مع هامش صغير من الأسفل)؟ */
    const inView = () => {
      const rect = node.getBoundingClientRect();
      const height = window.innerHeight || document.documentElement.clientHeight || 0;
      return rect.top < height * 0.94 && rect.bottom > 0;
    };

    if (inView()) {
      setShown(true);
      return;
    }

    let observer: IntersectionObserver | null = null;
    const reveal = () => {
      setShown(true);
      cleanup();
    };
    const onScroll = () => {
      if (inView()) reveal();
    };
    const cleanup = () => {
      observer?.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };

    if (typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) reveal();
        },
        { rootMargin: "0px 0px -6% 0px", threshold: 0.04 },
      );
      observer.observe(node);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return cleanup;
  }, []);

  const Tag = as;

  return (
    <Tag
      ref={ref as React.Ref<never>}
      className={`mk-reveal ${shown ? "is-in" : ""} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
};

export default Reveal;
