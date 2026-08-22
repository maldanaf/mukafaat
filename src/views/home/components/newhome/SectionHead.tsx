"use client";

import { Link } from "@/lib/router-compat";

interface Props {
  eyebrow?: string;
  title: string;
  linkLabel?: string;
  linkTo?: string;
  /** على الخلفيات الداكنة */
  dark?: boolean;
  eyebrowColor?: string;
}

/** ترويسة قسم: نص علوي برتقالي + عنوان 26px + رابط «عرض الكل» */
const SectionHead: React.FC<Props> = ({
  eyebrow,
  title,
  linkLabel,
  linkTo,
  dark = false,
  eyebrowColor = "#E2680F",
}) => (
  <div className="mb-[18px] flex items-baseline justify-between gap-4">
    <span className="flex flex-col gap-1.5">
      {eyebrow && (
        <span
          className="text-[12px] font-bold tracking-[0.04em]"
          style={{ color: eyebrowColor }}
        >
          {eyebrow}
        </span>
      )}
      <span
        className={`text-[20px] sm:text-[26px] font-bold ${dark ? "text-white" : "text-[#17122A]"}`}
      >
        {title}
      </span>
    </span>
    {linkLabel && linkTo && (
      <Link
        to={linkTo}
        className={`shrink-0 text-[13px] font-semibold transition-colors ${
          dark ? "text-[#C4B5FD] hover:text-white" : "text-[#4C1D95] hover:text-[#2E1065]"
        }`}
      >
        {linkLabel} ←
      </Link>
    )}
  </div>
);

export default SectionHead;
