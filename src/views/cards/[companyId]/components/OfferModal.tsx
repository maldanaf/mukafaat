"use client";

import { useState } from "react";
import { useIsRTL } from "@hooks";
import {
  // FiX,
  FiMinus,
  FiPlus,
  FiStar,
  // FiEye,
  // FiDownload,
  // FiBookmark,
} from "react-icons/fi";
import { type CardOffer, type CardCompany } from "@data/cards";
import {
  Cards1,
  Cards2,
  Cards3,
  Cards4,
  Cards5,
  Cards6,
  Cards7,
  Cards8,
  Cards12,
  Cards13,
  Cards14,
} from "@assets";
import CurrencyIcon from "@components/CurrencyIcon";
import { stripHtml } from "@utils/stripHtml";

interface OfferModalProps {
  offer: CardOffer;
  company: CardCompany;
  isOpen: boolean;
  onClose: () => void;
}

const OfferModal = ({ offer, company, isOpen, onClose }: OfferModalProps) => {
  const isRTL = useIsRTL();
  const [quantity, setQuantity] = useState(1);

  if (!isOpen) return null;

  const totalPrice = offer.price * quantity;
  // const totalOriginalPrice = offer.originalPrice
  //   ? offer.originalPrice * quantity
  //   : null;

  // Function to get card image
  const getCardImage = (logoName: string) => {
    switch (logoName) {
      case "Cards1":
        return Cards1;
      case "Cards2":
        return Cards2;
      case "Cards3":
        return Cards3;
      case "Cards4":
        return Cards4;
      case "Cards5":
        return Cards5;
      case "Cards6":
        return Cards6;
      case "Cards7":
        return Cards7;
      case "Cards8":
        return Cards8;
      case "Cards12":
        return Cards12;
      case "Cards13":
        return Cards13;
      case "Cards14":
        return Cards14;
      default:
        return Cards1;
    }
  };

  const handlePurchase = () => {
    // Navigate to payment page
    window.location.href = `/cards/${company.id}/payment?offer=${offer.id}&quantity=${quantity}`;
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white rounded-mk-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-mk-md overflow-hidden">
              <img
                src={getCardImage(company.logo)}
                alt={company.name[isRTL ? "ar" : "en"]}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-mk-text">
                {offer.title[isRTL ? "ar" : "en"]}
              </h2>
              <div className="flex items-center gap-2 text-sm text-mk-muted">
                <div className="flex items-center gap-1">
                  <FiStar className="text-yellow-400" />
                  <span>{offer.rating}</span>
                </div>
                <span>•</span>
                <span>
                  {isRTL
                    ? `${offer.purchases} عدد مرات الشراء`
                    : `${offer.purchases} purchases`}
                </span>
              </div>
            </div>
          </div>
          <div className="text-4xl font-bold text-mk-text mb-2 flex items-center justify-center gap-1">
            {totalPrice}
            <CurrencyIcon className="text-mk-text" size={32} />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Offer Details */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-mk-text mb-4">
              {isRTL ? "تفاصيل العرض" : "Offer Details"}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-mk-tint2 p-3 rounded-mk-sm flex items-center justify-between">
                <div className="text-sm text-mk-muted mb-0">
                  {isRTL ? "صلاحية الحزمة" : "Package Validity"}
                </div>
                <div className="font-medium text-mk-text">
                  {offer.validity[isRTL ? "ar" : "en"]}
                </div>
              </div>
              <div className="bg-mk-tint2 p-3 rounded-mk-sm flex items-center justify-between">
                <div className="text-sm text-mk-muted mb-0">
                  {isRTL ? "مميزات الخدمة" : "Service Features"}
                </div>
                <div className="font-medium text-mk-text">
                  {isRTL ? "متجددة" : "Renewable"}
                </div>
              </div>
            </div>

            <div className="bg-mk-tint2 p-4 rounded-mk-sm flex items-center justify-between">
              <h4 className="font-medium text-mk-text mb-0">
                {isRTL ? "تعرف أكثر عن الخدمة" : "Learn more about the service"}
              </h4>
              <p className="text-mk-muted text-sm">
                {stripHtml(offer.description[isRTL ? "ar" : "en"])}
              </p>
            </div>
          </div>

          {/* Features List */}
          <div className="mb-6">
            <h4 className="font-medium text-mk-text mb-3">
              {isRTL ? "المميزات" : "Features"}
            </h4>
            <div className="flex flex-wrap gap-2">
              {offer.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-1 text-xs text-mk-muted bg-mk-tint2 px-2 py-1 rounded-full"
                >
                  <div className="w-1.5 h-1.5 bg-mk-primary-light rounded-full"></div>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mb-10 mt-10 mx-auto flex">
            {/* <h4 className="font-medium text-mk-text mb-3">
              {isRTL ? "الكمية" : "Quantity"}
            </h4> */}
            <div className="flex items-center gap-4 mx-auto">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-[#A0A5BA] flex items-center justify-center hover:bg-mk-border-strong/60 transition-colors"
              >
                <FiMinus className="text-white" />
              </button>
              <div className="w-12 h-12   bg-mk-tint2   rounded-full flex items-center justify-center font-medium">
                {quantity}
              </div>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-orange-500 text-white flex items-center justify-center hover:bg-orange-600 transition-colors"
              >
                <FiPlus />
              </button>
            </div>
          </div>

          {/* Stats */}
          {/* <div className="flex items-center justify-between text-sm text-mk-muted mb-6">
            <div className="flex items-center gap-1">
              <FiEye />
              <span>{offer.views}</span>
            </div>
            <div className="flex items-center gap-1">
              <FiDownload />
              <span>{offer.downloads}</span>
            </div>
            <div className="flex items-center gap-1">
              <FiBookmark />
              <span>{offer.bookmarks}</span>
            </div>
          </div> */}

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            <button
              onClick={handlePurchase}
              className="py-3 px-10 bg-orange-500 text-white rounded-full hover:bg-orange-600 transition-colors font-medium"
            >
              {isRTL ? "شراء سريع" : "Quick Buy"}
            </button>
            <button
              onClick={handlePurchase}
              className="py-3 px-10 border border-mk-border-2 text-mk-text-strong rounded-full hover:bg-mk-tint3 transition-colors"
            >
              Apple Pay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfferModal;
