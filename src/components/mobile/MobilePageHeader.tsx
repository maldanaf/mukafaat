"use client";

import { LuSearch } from "react-icons/lu";

interface Props {
  title: string;
  subtitle?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
}

/** ترويسة صفحة داخلية في نسخة الموبايل: عنوان + بحث + شرائح تصنيف */
const MobilePageHeader: React.FC<Props> = ({
  title,
  subtitle,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  children,
}) => (
  <div className="rounded-b-[26px] bg-[linear-gradient(160deg,#3B1C7D,#4C1D95_60%,#6D28D9)] px-4 pb-4 pt-5 text-white">
    <h1 className="m-0 text-[20px] font-bold">{title}</h1>
    {subtitle && <p className="m-0 mt-1 text-[12.5px] text-[#C4B5FD]">{subtitle}</p>}

    {onSearchChange && (
      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/95 px-3.5 py-2.5">
        <LuSearch size={17} className="shrink-0 text-[#8B84A0]" />
        <input
          value={searchValue ?? ""}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full bg-transparent text-[13.5px] text-[#17122A] outline-none placeholder:text-[#9A93AD]"
        />
      </div>
    )}

    {children}
  </div>
);

export default MobilePageHeader;
