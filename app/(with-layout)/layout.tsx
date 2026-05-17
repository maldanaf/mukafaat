"use client";

import { Suspense } from "react";

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

export const dynamic = "force-dynamic";

export default function WithLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <div className="content relative min-h-screen">
      <GlobalStyles />
      <Suspense>
        <Navbar />
        <ScrollToTop />
        {children}
        <ShareSheetHost />
        <WhatsAppButton />
        <ScrollToTopButton />
        <Footer />
        <ToastContainer />
      </Suspense>
    </div>
  );
}
