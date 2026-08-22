"use client";

interface Chip {
  id: number | string | null;
  name: string;
}

interface Props {
  chips: Chip[];
  active: number | string | null;
  onSelect: (id: number | string | null) => void;
}

/** شرائح تصنيف قابلة للتمرير أفقياً (أسلوب التطبيقات) */
const MobileChips: React.FC<Props> = ({ chips, active, onSelect }) => (
  <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
    {chips.map((chip) => {
      const isActive = active === chip.id;
      return (
        <button
          key={String(chip.id ?? "all")}
          onClick={() => onSelect(chip.id)}
          className={`shrink-0 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition-colors ${
            isActive ? "bg-white text-[#4C1D95]" : "bg-white/15 text-white"
          }`}
        >
          {chip.name}
        </button>
      );
    })}
  </div>
);

export default MobileChips;
