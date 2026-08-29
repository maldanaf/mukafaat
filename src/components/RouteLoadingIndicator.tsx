"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";

export default function RouteLoadingIndicator() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const prevPath = useRef(pathname);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (pathname !== prevPath.current) {
      // Navigation completed
      setProgress(100);
      timerRef.current = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 300);
      prevPath.current = pathname;
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pathname]);

  // Listen for click on links to start loading
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as Element)?.closest?.("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        anchor.getAttribute("target") === "_blank"
      )
        return;

      // Internal navigation detected
      setLoading(true);
      setProgress(20);

      if (progressRef.current) clearInterval(progressRef.current);
      progressRef.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) {
            if (progressRef.current) clearInterval(progressRef.current);
            return 90;
          }
          return p + Math.random() * 15;
        });
      }, 200);
    };

    document.addEventListener("click", handleClick, true);
    return () => {
      document.removeEventListener("click", handleClick, true);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[99999] pointer-events-none">
      <div
        className="h-[3px] bg-gradient-to-r from-[#400198] via-[#fd671a] to-[#400198] transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          opacity: progress >= 100 ? 0 : 1,
          transition:
            progress >= 100
              ? "width 200ms ease-out, opacity 300ms ease-out 100ms"
              : "width 300ms ease-out",
        }}
      />
    </div>
  );
}
