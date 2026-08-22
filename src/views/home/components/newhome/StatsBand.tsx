"use client";

import {
  LuStore,
  LuUsers,
  LuTag,
  LuHeadphones,
  LuShieldCheck,
  LuGift,
  LuCreditCard,
  LuTicket,
} from "react-icons/lu";
import { CONTAINER, pick } from "./tokens";

interface Stat {
  value: string;
  label: string;
  icon?: string;
}

const ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  store: LuStore,
  users: LuUsers,
  tag: LuTag,
  headphones: LuHeadphones,
  shield: LuShieldCheck,
  gift: LuGift,
  card: LuCreditCard,
  ticket: LuTicket,
};

/** شريط الإحصائيات — القيم والتسميات من لوحة التحكم */
const StatsBand: React.FC<{ stats: Stat[] }> = ({ stats }) => {
  if (!stats?.length) return null;

  return (
    <section className={`${CONTAINER} pb-2 pt-10`}>
      <div className="grid grid-cols-2 rounded-[22px] border border-[#EDE9F7] bg-[#F6F3FC] p-2 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat, i) => {
          const color = pick(i);
          const Icon = ICONS[stat.icon ?? "store"] ?? LuStore;
          return (
            <div key={`${stat.label}-${i}`} className="flex items-center gap-3 px-4 py-5">
              <span
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px]"
                style={{ background: color.bg, color: color.c }}
              >
                <Icon size={21} />
              </span>
              <span className="flex min-w-0 flex-col gap-0.5">
                <span
                  dir="ltr"
                  className="text-[18px] sm:text-[20px] font-bold leading-tight text-[#2E1065] [unicode-bidi:isolate]"
                >
                  {stat.value}
                </span>
                <span className="text-[12.5px] text-[#6B6480]">{stat.label}</span>
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default StatsBand;
