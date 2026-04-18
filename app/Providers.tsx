"use client";

import React, { useState } from "react";
import { I18nextProvider } from "react-i18next";
import i18next from "../src/i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WebsiteProvider } from "@hooks/useWebsiteProvider";
import { LanguageProvider } from "@context/language.context";
import { InquiryModalProvider } from "@context/InquiryModalContext";
import InquiryModal from "@components/InquiryModal";
import AuthApiBootstrap from "@components/AuthApiBootstrap";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <I18nextProvider i18n={i18next}>
      <QueryClientProvider client={queryClient}>
        <WebsiteProvider>
          <LanguageProvider>
            <InquiryModalProvider>
              <AuthApiBootstrap />
              {children}
              <InquiryModal />
            </InquiryModalProvider>
          </LanguageProvider>
        </WebsiteProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}
