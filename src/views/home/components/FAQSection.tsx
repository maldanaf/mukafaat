"use client";

import { t } from "i18next";
import React, { useState } from "react";
import { IoAdd } from "react-icons/io5";
import { useIsRTL } from "@hooks";
import { FAQImage } from "@assets";

interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

const FAQSection: React.FC = () => {
  const [expandedItems, setExpandedItems] = useState<number[]>([]);
  const isRTL = useIsRTL();

  const faqData: FAQItem[] = [
    {
      id: 1,
      question: t("faq.t_2ab126", "ما هي منصة مكافآت؟"),
      answer: t("faq.t_87db1b", "مكافآت هي المنصة الرائدة في المملكة العربية السعودية لتوفير المال والاستفادة من أفضل العروض والخصومات على البطاقات الائتمانية والكوبونز والحجوزات السياحية."),
    },
    {
      id: 2,
      question: t("faq.t_ef8ed5", "كيف يمكنني الاستفادة من عروض مكافآت؟"),
      answer: t("faq.t_300b09", "يمكنك الاستفادة من عروض مكافآت من خلال تصفح العروض المتاحة، اختيار البطاقة الائتمانية المناسبة، استخدام الكوبونز المتاحة، أو حجز رحلاتك بأسعار مميزة."),
    },
    {
      id: 3,
      question: t("faq.t_2b1b2a", "هل خدمات مكافآت مجانية؟"),
      answer: t("faq.t_f9b1dc", "نعم، جميع خدمات مكافآت مجانية تماماً. نحن نربطك بأفضل العروض والخصومات المتاحة دون أي رسوم إضافية أو تكاليف خفية."),
    },
    {
      id: 4,
      question: t("faq.t_037ef3", "هل يمكنني استخدام مكافآت في جميع أنحاء المملكة؟"),
      answer: t("faq.t_d4f92b", "نعم، خدمات مكافآت متاحة في جميع أنحاء المملكة العربية السعودية. نعمل مع شركاء محليين في جميع المدن الرئيسية لضمان أفضل الخدمات."),
    },
    {
      id: 5,
      question: t("faq.t_effe06", "كيف يمكنني التواصل مع فريق مكافآت؟"),
      answer: t("faq.t_a667a7", "يمكنك التواصل معنا عبر الموقع الإلكتروني، تطبيق الهاتف المحمول، أو من خلال خدمة العملاء المتاحة على مدار الساعة. نحن هنا لمساعدتك في أي وقت."),
    },
  ];

  const toggleItem = (id: number) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  return (
    <section className="py-20">
      <div className="container mx-auto pt-4 pb-8 px-4 lg:px-0">
        {/* Main Title */}
        <div className="text-center lg:mb-16 mb-8">
          <h2
            className="text-[#400198] text-3xl font-bold"
            style={{
              fontFamily: isRTL ? "Readex Pro, sans-serif" : "Jost, sans-serif",
            }}
          >
            {t("faq.t_90b224", "الأسئلة الشائعة")}
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left Section - FAQ List */}
          <div className="space-y-4 w-full lg:w-1/2">
            {faqData.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#F2F2F2] shadow-lg p-6 cursor-pointer transition-all duration-300 hover:shadow-xl"
                onClick={() => toggleItem(item.id)}
              >
                <div className="flex items-center justify-between">
                  <span className="text-gray-800 font-medium flex-1 px-4">
                    {item.question}
                  </span>
                  <IoAdd
                    className={`text-[#fff] bg-[#400198] rounded-full text-2xl transition-transform duration-300 ${
                      expandedItems.includes(item.id) ? "rotate-45" : ""
                    }`}
                  />
                </div>

                {expandedItems.includes(item.id) && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-gray-600 leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Section - FAQ Image & Text */}
          <div className="hidden lg:block text-center w-1/2">
            {/* FAQ Image */}
            <div className="relative mb-6">
              <img
                src={FAQImage}
                alt="FAQ Question Mark"
                className="w-[209px] h-auto mx-auto object-contain"
              />
            </div>

            {/* Text Content */}
            <div className="space-y-3">
              <h3
                className="text-3xl font-bold text-[#400198]"
                style={{
                  fontFamily: isRTL
                    ? "Readex Pro, sans-serif"
                    : "Jost, sans-serif",
                }}
              >
                {t("faq.t_c502bd", "أي سؤال؟")}
              </h3>
              <p className="text-gray-600 text-lg leading-relaxed max-w-md mx-auto">
                {t("faq.t_964ee2", "لديك أسئلة حول خدمات مكافآت؟ نحن هنا للإجابة عليها")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
