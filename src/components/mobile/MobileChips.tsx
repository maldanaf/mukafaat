"use client";

import { FOCUS } from "@ui";

interface Chip {
  id: number | string | null;
  name: string;
  count?: number | null;
}

interface Props {
  chips: Chip[];
  active: number | string | null;
  onSelect: (id: number | string | null) => void;
  /** على خلفية بيضاء بدل تدرّج الترويسة البنفسجي */
  light?: boolean;
  className?: string;
}

/**
 * شرائح تصنيف قابلة للتمرير أفقياً (أسلوب التطبيق) — الاتجاه «الحيوي التجاري»:
 * الشريحة النشطة بيضاء صلبة فوق التدرّج (أو بتدرّج الهوية على الخلفية الفاتحة).
 * هدف اللمس ≥44px، والتمرير سلس بلا شريط ظاهر، و`aria-pressed` للحالة النشطة.
 */
const MobileChips: React.FC<Props> = ({
  chips,
  active,
  onSelect,
  light = false,
  className = "",
}) => (
  <div
    role="group"
    className={`no-scrollbar -mx-4 mt-3.5 flex gap-2 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-0.5 [-webkit-overflow-scrolling:touch] ${className}`}
  >
    {chips.map((chip) => {
      const isActive = active === chip.id;
      const tone = light
        ? isActive
          ? "bg-grad-brand text-white shadow-mk-glow"
          : "border border-mk-border bg-white text-mk-text-strong"
        : isActive
          ? "bg-white text-mk-primary shadow-mk-float"
          : "border border-white/20 bg-white/15 text-white backdrop-blur-sm";

      return (
        <button
          key={String(chip.id ?? "all")}
          type="button"
          onClick={() => onSelect(chip.id)}
          aria-pressed={isActive}
          className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-4 text-[12.5px] font-bold transition-all duration-200 active:scale-[0.96] ${tone} ${FOCUS}`}
        >
          {chip.name}
          {chip.count != null && (
            <span
              dir="ltr"
              className={`rounded-full px-1.5 text-[10.5px] font-bold leading-[17px] ${
                isActive
                  ? light
                    ? "bg-white/25 text-white"
                    : "bg-mk-tint text-mk-primary"
                  : "bg-white/20"
              }`}
            >
              {chip.count}
            </span>
          )}
        </button>
      );
    })}
  </div>
);

export default MobileChips;
