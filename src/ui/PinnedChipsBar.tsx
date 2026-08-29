"use client";

import React from "react";
import { Link } from "@/lib/router-compat";
import { LuLayoutGrid } from "react-icons/lu";
import { FOCUS } from "./tokens";

export interface PinnedChip {
  id: string | number;
  name: string;
  image?: string | null;
  /** لون الشريحة — يُمرَّر من `pick()` في الصفحة المستدعية */
  color?: string;
  /** رابط أو إجراء — أحدهما */
  href?: string;
  onClick?: () => void;
  active?: boolean;
}

interface Props {
  /** ظاهر الآن؟ يأتي عادة من `usePinnedUnderHeader` */
  pinned: boolean;
  items: PinnedChip[];
  /** التسمية يمين الشريط (تظهر على الشاشات العريضة فقط) */
  title?: string;
  className?: string;
}

const CHIP =
  "group flex h-10 shrink-0 items-center gap-2 rounded-full border bg-white ps-1.5 pe-3.5 text-[13px] font-extrabold transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9BCEC] hover:text-mk-primary";

/**
 * شريط شرائح مثبّت تحت الهيدر اللاصق (ديسكتوب فقط).
 *
 * `fixed` لا `sticky`: العنصر اللاصق ينتهي مداه بنهاية القسم الحاوي بينما
 * المطلوب بقاؤه طوال بقية الصفحة، كما أن `fixed` لا يزيح التخطيط عند
 * ظهوره فلا يحدث قفز عند لحظة التثبيت.
 */
const PinnedChipsBar: React.FC<Props> = ({ pinned, items, title, className = "" }) => {
  if (!items.length) return null;

  const renderChip = (chip: PinnedChip) => {
    const inner = (
      <>
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full text-white"
          style={
            chip.color
              ? { backgroundImage: `linear-gradient(135deg, ${chip.color} 0%, ${chip.color}CC 100%)` }
              : { backgroundImage: "linear-gradient(135deg, #400198 0%, #6703EB 100%)" }
          }
        >
          {chip.image ? (
            <img
              src={chip.image}
              alt=""
              loading="lazy"
              className="h-4 w-4 object-contain brightness-0 invert"
            />
          ) : (
            <LuLayoutGrid size={15} aria-hidden />
          )}
        </span>
        <span className="whitespace-nowrap">{chip.name}</span>
      </>
    );

    const tone = chip.active
      ? "border-[#C9BCEC] bg-mk-tint2 text-mk-primary"
      : "border-[#ECE9F5] text-[#4A4A63]";
    const classes = `${CHIP} ${tone} ${FOCUS}`;

    if (chip.href) {
      return (
        <Link key={chip.id} to={chip.href} tabIndex={pinned ? 0 : -1} className={classes}>
          {inner}
        </Link>
      );
    }
    return (
      <button
        key={chip.id}
        type="button"
        tabIndex={pinned ? 0 : -1}
        onClick={chip.onClick}
        className={classes}
      >
        {inner}
      </button>
    );
  };

  return (
    <div
      aria-hidden={!pinned}
      className={`fixed inset-x-0 z-40 hidden border-b border-mk-border bg-white/95 shadow-[0_6px_20px_-14px_rgba(46,16,101,0.6)] backdrop-blur-md transition-all duration-300 ease-out lg:block ${
        pinned
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-3 opacity-0"
      } ${className}`}
      style={{ top: "var(--mk-header-h, 0px)" }}
    >
      <div className="mx-auto flex w-full max-w-site items-center gap-3 px-4 sm:px-6">
        {title && (
          <span className="hidden shrink-0 items-center gap-1.5 py-2.5 text-[12.5px] font-extrabold text-mk-muted xl:flex">
            <LuLayoutGrid size={15} className="text-mk-primary" aria-hidden />
            {title}
          </span>
        )}
        <div className="mk-scroll-x min-w-0 flex-1 gap-2 py-2.5">{items.map(renderChip)}</div>
      </div>
    </div>
  );
};

export default PinnedChipsBar;
