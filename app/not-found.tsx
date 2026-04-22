"use client";

import { Suspense } from "react";
import { NotFoundPage } from "@views/Website";
import Navbar from "@components/Navbar";
import Footer from "@components/Footer";
import ScrollToTop from "@components/ScrollToTop";
import ScrollToTopButton from "@components/ScrollToTopButton";
import WhatsAppButton from "@components/WhatsAppButton";
import GlobalStyles from "@components/GlobalStyles";

import "primereact/resources/themes/lara-light-cyan/theme.css";
import "@/styles/owl.carousel.css";
import "@/styles/owl.theme.default.css";
import "animate.css";
import "react-toastify/dist/ReactToastify.css";

export default function NotFound() {
  return (
    <div className="content relative min-h-screen">
      <GlobalStyles />
      <Suspense>
        <Navbar />
        <ScrollToTop />
        <NotFoundPage />
        <WhatsAppButton />
        <ScrollToTopButton />
        <Footer />
      </Suspense>
    </div>
  );
}
