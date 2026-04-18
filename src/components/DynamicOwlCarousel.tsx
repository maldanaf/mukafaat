"use client";

import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";

/**
 * Drop-in replacement for react-owl-carousel — zero jQuery.
 * Same DOM structure & CSS classes as OwlCarousel2.
 */

interface Props {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  loop?: boolean;
  margin?: number;
  nav?: boolean;
  dots?: boolean;
  autoplay?: boolean;
  autoplayTimeout?: number;
  autoplayHoverPause?: boolean;
  rtl?: boolean | string;
  responsive?: Record<number, { items: number }>;
  [key: string]: unknown;
}

const DynamicOwlCarousel = forwardRef<unknown, Props>(function OwlCarousel(
  {
    children,
    className = "",
    style,
    margin = 10,
    nav = true,
    dots = true,
    autoplay = false,
    autoplayTimeout = 5000,
    autoplayHoverPause = true,
    responsive,
  },
  ref,
) {
  const [idx, setIdx] = useState(0);
  const [perView, setPerView] = useState(1);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const items = React.Children.toArray(children);
  const total = items.length;

  // expose next/prev for external refs (compat)
  useImperativeHandle(ref, () => ({
    next: () => goNext(),
    prev: () => goPrev(),
  }));

  // responsive
  const calcPerView = useCallback(() => {
    if (!responsive || typeof window === "undefined") return 1;
    const w = window.innerWidth;
    let r = 1;
    for (const bp of Object.keys(responsive).map(Number).sort((a, b) => a - b)) {
      if (w >= bp) r = responsive[bp].items;
    }
    return r;
  }, [responsive]);

  useEffect(() => {
    const fn = () => setPerView(calcPerView());
    fn();
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [calcPerView]);

  const maxIdx = Math.max(0, total - perView);
  const safeIdx = Math.min(idx, maxIdx);

  const goNext = useCallback(() => setIdx(p => (p >= maxIdx ? 0 : p + 1)), [maxIdx]);
  const goPrev = useCallback(() => setIdx(p => (p <= 0 ? maxIdx : p - 1)), [maxIdx]);

  // autoplay
  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!autoplay || paused || total <= perView) return;
    timerRef.current = setInterval(goNext, autoplayTimeout);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [autoplay, autoplayTimeout, paused, goNext, total, perView]);

  if (total === 0) return null;

  const itemW = 100 / perView;
  const tx = -(safeIdx * itemW);
  const showNav = nav && total > perView;
  const showDots = dots && total > perView;
  const dotsCount = maxIdx + 1;

  return (
    <div
      className={`owl-carousel owl-theme owl-loaded ${className}`}
      style={style}
      onMouseEnter={() => autoplayHoverPause && setPaused(true)}
      onMouseLeave={() => autoplayHoverPause && setPaused(false)}
    >
      <div className="owl-stage-outer" style={{ overflow: "hidden" }}>
        <div
          className="owl-stage"
          style={{
            display: "flex",
            transition: "transform 0.4s ease",
            transform: `translateX(${tx}%)`,
          }}
        >
          {items.map((child, i) => (
            <div
              key={i}
              className={`owl-item${i >= safeIdx && i < safeIdx + perView ? " active" : ""}`}
              style={{
                flex: `0 0 ${itemW}%`,
                maxWidth: `${itemW}%`,
                paddingLeft: `${margin / 2}px`,
                paddingRight: `${margin / 2}px`,
                boxSizing: "border-box",
              }}
            >
              {child}
            </div>
          ))}
        </div>
      </div>

      {showNav && (
        <div className="owl-nav">
          <button type="button" className="owl-prev" onClick={goPrev}>
            <span aria-hidden="true">‹</span>
          </button>
          <button type="button" className="owl-next" onClick={goNext}>
            <span aria-hidden="true">›</span>
          </button>
        </div>
      )}

      {showDots && (
        <div className="owl-dots">
          {Array.from({ length: dotsCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              className={`owl-dot${i === safeIdx ? " active" : ""}`}
              onClick={() => setIdx(i)}
            >
              <span />
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

DynamicOwlCarousel.displayName = "DynamicOwlCarousel";
export default DynamicOwlCarousel;
