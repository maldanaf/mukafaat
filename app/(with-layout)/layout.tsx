"use client";

import { Suspense } from "react";

import Footer from "@components/Footer";
import Navbar from "@components/Navbar";
import ScrollToTop from "@components/ScrollToTop";
import StickyHeaderSlot from "@components/StickyHeaderSlot";
import ScrollToTopButton from "@components/ScrollToTopButton";
import WhatsAppButton from "@components/WhatsAppButton";
import GlobalStyles from "@components/GlobalStyles";
import CitySync from "@components/CitySync";
import MobileTopBar from "@components/mobile/MobileTopBar";
import MobileTabBar from "@components/mobile/MobileTabBar";
import ShareSheetHost from "@components/ShareSheetHost";

import "primereact/resources/themes/lara-light-cyan/theme.css";
import "@/styles/owl.carousel.css";
import "@/styles/owl.theme.default.css";
import "animate.css";
import "wow.js/css/libs/animate.css";
import "react-toastify/dist/ReactToastify.css";

import { ToastContainer } from "react-toastify";

export const dynamic = "force-dynamic";

export default function WithLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="content relative min-h-screen">
      <GlobalStyles />
      <CitySync />
      <Suspense>
        {/* قشرة الموبايل: شريط علوي + تبويبات سفلية بأسلوب التطبيق */}
        <MobileTopBar />

        {/* هيدر الديسكتوب اللاصق (الغلاف يشرح سبب وضع الالتصاق عليه) */}
        <StickyHeaderSlot>
          <Navbar />
        </StickyHeaderSlot>

        <ScrollToTop />

        <main className="pb-[76px] lg:pb-0">{children}</main>

        <ShareSheetHost />

        <div className="hidden lg:block">
          <WhatsAppButton />
          <ScrollToTopButton />
        </div>

        <div className="hidden lg:block">
          <Footer />
        </div>

        <MobileTabBar />
        <ToastContainer />
      </Suspense>
    </div>
  );
}
