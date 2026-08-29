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
import { t } from "i18next";
import { CONTAINER } from "./tokens";
import Reveal from "./Reveal";

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

/**
 * شريط الثقة — الأرقام والتسميات من لوحة التحكم (`data.stats`).
 * الاتجاه «الحيوي التجاري»: سطح بنفسجي داكن متدرّج، أرقام كبيرة وثقيلة،
 * وأيقونات في دوائر زجاجية — يعطي إحساس منصّة كبيرة موثوقة.
 */
const StatsBand: React.FC<{ stats: Stat[] }> = ({ stats }) => {
  if (!stats?.length) return null;

  return (
    <section className={`${CONTAINER} pb-2 pt-12 sm:pt-14`}>
      <Reveal>
        <div className="relative overflow-hidden rounded-mk-3xl bg-grad-night p-1.5 shadow-[0_26px_60px_-28px_rgba(27,17,80,0.9)]">
          {/* هالات هوية تكسر السطح الداكن */}
          <span
            aria-hidden
            className="pointer-events-none absolute -top-20 start-[12%] h-[220px] w-[220px] rounded-full bg-[#6703EB]/45 blur-[90px]"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute -bottom-24 end-[8%] h-[220px] w-[220px] rounded-full bg-[#FD671A]/25 blur-[90px]"
          />

          <div className="relative grid grid-cols-2 gap-px sm:grid-cols-3 lg:grid-cols-5">
            {stats.map((stat, i) => {
              const Icon = ICONS[stat.icon ?? "store"] ?? LuStore;
              return (
                <div
                  key={`${stat.label}-${i}`}
                  className="group flex items-center gap-3 rounded-mk-xl px-4 py-6 transition-colors duration-200 hover:bg-white/[0.06]"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-mk-md border border-white/20 bg-white/10 text-mk-accent-light transition-transform duration-200 group-hover:scale-110">
                    <Icon size={22} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span
                      dir="ltr"
                      className="text-[22px] font-extrabold leading-tight tracking-[-0.02em] text-white [unicode-bidi:isolate] sm:text-[26px]"
                    >
                      {stat.value}
                    </span>
                    <span className="text-[12.5px] font-medium text-[#C9BCEC]">{stat.label}</span>
                  </span>
                </div>
              );
            })}
          </div>

          <p className="relative m-0 border-t border-white/10 px-5 py-3.5 text-center text-[12px] font-semibold text-white/60">
            {t("home.stats_new.trust", "منصّة سعودية موثوقة — عروض محدّثة يومياً ودعم على مدار الأسبوع")}
          </p>
        </div>
      </Reveal>
    </section>
  );
};

export default StatsBand;
