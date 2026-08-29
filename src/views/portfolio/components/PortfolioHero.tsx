"use client";

import { AboutPattern } from "@assets";
import { useIsRTL } from "@hooks";
import { Link } from "@/lib/router-compat";

const PortfolioHero = () => {
  const isRTL = useIsRTL();
  const titleFontType = isRTL
    ? " font-semibold mt-8 text-2xl md:text-2xl lg:text-2xl"
    : " font-semibold mt-8 text-2xl md:text-2xl lg:text-2xl";

  return (
    <section className="relative w-full bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] overflow-hidden min-h-[140px] flex items-center justify-center">
      <div className="absolute inset-0 bg-primary opacity-30" />
      <div className="relative pt-20 pb-16 px-6 mx-auto max-w-site text-center lg:pt-20 lg:pb-16 lg:px-12 flex flex-col justify-center z-10">
        <h1
          className={`${titleFontType} mb-4 tracking-tight leading-none text-white`}
        >
          {isRTL ? "المعرض" : "Portfolio"}
        </h1>

        <div className="flex items-center justify-center space-x-2 text-sm md:text-base">
          <Link
            to="/"
            className="text-white hover:text-mk-lilac transition-colors cursor-pointer text-xs"
          >
            {isRTL ? "الرئيسية" : "Home"}
          </Link>
          <span className="text-white text-xs">|</span>
          <span className="text-mk-lilac font-medium text-xs">
            {isRTL ? "المعرض" : "Portfolio"}
          </span>
        </div>
      </div>

      <div className="absolute -bottom-10 transform z-9">
        <img
          src={AboutPattern}
          alt="Pattern"
          className="w-full h-96 animate-float"
        />
      </div>
    </section>
  );
};

export default PortfolioHero;
