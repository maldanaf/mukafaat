"use client";

import { useEffect } from "react";

import Footer from "@components/Footer";
import Navbar from "@components/Navbar";
import ScrollToTop from "@components/ScrollToTop";
import ScrollToTopButton from "@components/ScrollToTopButton";
import WhatsAppButton from "@components/WhatsAppButton";
import GlobalStyles from "@components/GlobalStyles";
import ShareSheetHost from "@components/ShareSheetHost";

import "primereact/resources/themes/lara-light-cyan/theme.css";
import "@/styles/owl.carousel.css";
import "@/styles/owl.theme.default.css";
import "animate.css";
import "wow.js/css/libs/animate.css";
import "react-toastify/dist/ReactToastify.css";

import { ToastContainer } from "react-toastify";

export default function WithLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // WOW.js: init once, live:false prevents re-scanning DOM on mutations
    if (typeof window !== "undefined" && !(window as unknown as Record<string, boolean>).__wowInit) {
      import("wow.js").then((WOWModule) => {
        const WOW = WOWModule.default;
        new WOW({ live: false }).init();
        (window as unknown as Record<string, boolean>).__wowInit = true;
      });
    }
  }, []);

  return (
    <div className="content relative min-h-screen">
      <GlobalStyles />
      <Navbar />
      <ScrollToTop />
      {children}
      <ShareSheetHost />
      <WhatsAppButton />
      <ScrollToTopButton />
      <Footer />
      <ToastContainer />
    </div>
  );
}
