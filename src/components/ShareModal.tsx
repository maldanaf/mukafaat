"use client";

import React, { useState, useCallback } from "react";
import { IoMdClose } from "react-icons/io";
import {
  FaWhatsapp,
  FaTelegram,
  FaXTwitter,
  FaFacebookF,
  FaLinkedinIn,
} from "react-icons/fa6";
import { HiOutlineMail } from "react-icons/hi";
import { FiCopy, FiCheck } from "react-icons/fi";
import { useTranslation } from "react-i18next";
import { useIsRTL } from "@hooks";

interface ShareModalProps {
  url: string;
  title: string;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ url, title, onClose }) => {
  const { t } = useTranslation();
  const isRTL = useIsRTL();
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const channels = [
    {
      name: "WhatsApp",
      icon: FaWhatsapp,
      color: "bg-[#25D366]",
      href: `https://wa.me/?text=${encodedTitle}%0A${encodedUrl}`,
    },
    {
      name: "Telegram",
      icon: FaTelegram,
      color: "bg-[#0088cc]",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: "X",
      icon: FaXTwitter,
      color: "bg-black",
      href: `https://x.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    },
    {
      name: "Facebook",
      icon: FaFacebookF,
      color: "bg-[#1877F2]",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
    },
    {
      name: "LinkedIn",
      icon: FaLinkedinIn,
      color: "bg-[#0A66C2]",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: t("ui.t_3edea9", "بريد إلكتروني"),
      icon: HiOutlineMail,
      color: "bg-gray-600",
      href: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
    },
  ];

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 z-[10000]"
        onClick={onClose}
      />
      <div
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-2xl bg-white shadow-2xl z-[10001] overflow-hidden"
        style={{ direction: isRTL ? "rtl" : "ltr" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">
            {t("ui.t_019688", "مشاركة")}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
          >
            <IoMdClose className="text-xl" />
          </button>
        </div>

        {/* Share channels */}
        <div className="px-5 py-5">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {channels.map((ch) => {
              const Icon = ch.icon;
              return (
                <a
                  key={ch.name}
                  href={ch.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={onClose}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div
                    className={`w-12 h-12 ${ch.color} rounded-full flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs text-gray-600 font-medium">
                    {ch.name}
                  </span>
                </a>
              );
            })}
          </div>

          {/* Copy link */}
          <div
            onClick={copyLink}
            className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:border-[#400198] hover:bg-mk-tint3/50 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 mb-0.5">
                {t("ui.t_cb1b89", "نسخ الرابط")}
              </p>
              <p className="text-sm text-gray-700 truncate font-mono">
                {url}
              </p>
            </div>
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                copied
                  ? "bg-green-100 text-green-600"
                  : "bg-[#400198]/10 text-[#400198]"
              }`}
            >
              {copied ? (
                <FiCheck className="w-5 h-5" />
              ) : (
                <FiCopy className="w-4 h-4" />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ShareModal;
