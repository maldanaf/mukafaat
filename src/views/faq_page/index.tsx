"use client";

import { t } from "i18next";
import React, { useMemo, useState } from "react";
import { Link } from "@/lib/router-compat";
import { Helmet } from "@/lib/helmet-compat";
import { useIsRTL } from "@hooks";
import { useQuery } from "@tanstack/react-query";
import { api } from "@network/apiClient";
import { API_ENDPOINTS } from "@network/apiEndpoints";
import { LoadingSpinner } from "@components/LoadingSpinner";
import { AboutPattern } from "@assets";
import { FiChevronDown, FiSearch } from "react-icons/fi";

interface Faq {
  id: number;
  question: string;
  answer: string;
}

export default function FaqPage() {
  const isRTL = useIsRTL();
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<number | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["mokafaat", "faqs"],
    queryFn: () => api.get(API_ENDPOINTS.faqs).then((r) => r.data),
  });

  const faqs = useMemo(() => {
    const root = (data as Record<string, unknown>)?.data ?? data;
    const list = (root as Record<string, unknown>)?.faqs ?? (root as Record<string, unknown>)?.data ?? root;
    return Array.isArray(list) ? (list as Faq[]) : [];
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return faqs;
    return faqs.filter(f =>
      (f.question || "").toLowerCase().includes(q) ||
      (f.answer || "").toLowerCase().includes(q)
    );
  }, [faqs, search]);

  return (
    <>
      <Helmet>
        {/* العنوان من الخادم — يحمل لاحقة «| مكافآت» تلقائياً */}
      </Helmet>

      {/* Hero */}
      <section className="relative w-full bg-[linear-gradient(150deg,#1B1150_0%,#400198_55%,#6703EB_100%)] overflow-hidden min-h-[220px] flex items-center justify-center">
        <div className="absolute inset-0 bg-primary opacity-30" />
        <div className="relative pt-20 pb-12 px-6 mx-auto max-w-site w-full text-center z-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {t("faq.t_90b224", "الأسئلة الشائعة")}
          </h1>
          <p className="text-white/80 text-sm mb-6">
            {t("faq.t_e1635c", "إجابات لكل ما تريد معرفته عن مكافآت")}
          </p>
          <nav className="flex items-center justify-center gap-1 text-xs text-white/70">
            <Link to="/" className="hover:text-white">{t("ui.t_b986d8", "الرئيسية")}</Link>
            <span>|</span>
            <span className="text-[#fd671a]">{t("faq.t_90b224", "الأسئلة الشائعة")}</span>
          </nav>
        </div>
        <div className="absolute -bottom-10 z-0">
          <img src={AboutPattern} alt="" className="w-full h-96 animate-float" />
        </div>
      </section>

      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* Search */}
        <div className="relative mb-8">
          <FiSearch className={`absolute top-1/2 -translate-y-1/2 ${isRTL ? "right-4" : "left-4"} text-gray-400 text-xl`} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("faq.t_107672", "ابحث في الأسئلة...")}
            className={`w-full py-3 ${isRTL ? "pr-12 pl-4" : "pl-12 pr-4"} border-2 border-gray-200 rounded-2xl focus:border-[#400198] focus:outline-none text-base shadow-sm`}
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12"><LoadingSpinner /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <div className="text-5xl mb-3">🤔</div>
            <p className="text-gray-600 mb-4">
              {search
                ? (t("faq.t_8d88b0", "لا توجد نتائج مطابقة"))
                : (t("faq.t_bb5df7", "لا توجد أسئلة حالياً"))}
            </p>
            <Link to="/contact" className="inline-block bg-[#400198] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#33007a]">
              {t("faq.t_988638", "تواصل معنا")}
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((faq, i) => (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-5 text-start gap-4"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className="flex-shrink-0 w-9 h-9 rounded-full bg-[#400198] text-white flex items-center justify-center font-bold text-sm">
                      {i + 1}
                    </span>
                    <h3 className="font-bold text-gray-900 text-base flex-1 text-start">{faq.question}</h3>
                  </div>
                  <FiChevronDown
                    className={`text-[#400198] text-xl flex-shrink-0 transition-transform ${openId === faq.id ? "rotate-180" : ""}`}
                  />
                </button>
                {openId === faq.id && (
                  <div className="px-5 pb-5 pt-0 border-t border-gray-100">
                    <div className="ms-12 mt-3 text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {faq.answer}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-10 p-8 bg-gradient-to-br from-[#400198] to-[#6b2bb8] rounded-2xl text-center text-white">
          <h2 className="text-xl font-bold mb-2">
            {t("faq.t_3636ce", "لم تجد إجابة لسؤالك؟")}
          </h2>
          <p className="opacity-90 mb-5 text-sm">
            {t("faq.t_5687a0", "فريق الدعم لدينا جاهز لمساعدتك على مدار الساعة")}
          </p>
          <Link to="/contact" className="inline-block bg-white text-[#400198] px-8 py-3 rounded-xl font-bold hover:bg-gray-100">
            {t("faq.t_988638", "تواصل معنا")}
          </Link>
        </div>
      </div>
    </>
  );
}
