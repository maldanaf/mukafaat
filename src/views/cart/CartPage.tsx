"use client";

import React, { useState } from "react";
import { Link } from "@/lib/router-compat";
import { useUserStore } from "@stores/userStore";
import {
  IoCartOutline,
  IoTrashOutline,
  IoAddOutline,
  IoRemoveOutline,
  IoHeartOutline,
} from "react-icons/io5";
const CartPage: React.FC = () => {
  const {
    cartItems,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    getCartTotal,
    addToSaved,
  } = useUserStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      updateCartQuantity(itemId, newQuantity);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
  };

  const handleMoveToSaved = (item: any) => {
    addToSaved({
      type: item.type,
      itemId: item.itemId,
      companyId: item.companyId,
      title: item.title,
      image: item.image,
      price: item.price,
      originalPrice: item.originalPrice,
    });
    removeFromCart(item.itemId);
  };

  const handleCheckout = () => {
    setIsProcessing(true);
    // محاكاة عملية الدفع
    setTimeout(() => {
      setIsProcessing(false);
      // يمكن إضافة منطق الدفع هنا
      alert("سيتم توجيهك لصفحة الدفع");
    }, 1000);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "offer":
        return "عرض";
      case "card":
        return "بطاقة";
      case "booking":
        return "حجز";
      default:
        return "عنصر";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "offer":
        return "bg-orange-100 text-orange-800";
      case "card":
        return "bg-blue-100 text-blue-800";
      case "booking":
        return "bg-green-100 text-green-800";
      default:
        return "bg-mk-tint2 text-mk-text";
    }
  };

  const totalAmount = getCartTotal();

  return (
    <div className="min-h-screen bg-mk-tint3 py-8">
      <div className="max-w-site mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-mk-sm shadow-mk-card p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-mk-text">سلة التسوق</h1>
              <p className="text-mk-muted mt-1">
                {cartItems.length} عنصر في السلة
              </p>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <IoCartOutline className="w-8 h-8 text-[#400198]" />
            </div>
          </div>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-mk-sm shadow-mk-card">
                <div className="p-6 border-b border-mk-border">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-mk-text">
                      العناصر
                    </h2>
                    <button
                      onClick={clearCart}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      مسح السلة
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-mk-border">
                  {cartItems.map((item) => (
                    <div key={item.id} className="p-6">
                      <div className="flex items-start space-x-4 space-x-reverse">
                        {/* Image */}
                        <div className="flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.title.ar}
                            className="w-20 h-20 rounded-mk-sm object-cover"
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-medium text-mk-text">
                                {item.title.ar}
                              </h3>
                              <p className="text-sm text-mk-muted mt-1">
                                {item.title.en}
                              </p>
                              <div className="mt-2">
                                <span
                                  className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                                    item.type
                                  )}`}
                                >
                                  {getTypeLabel(item.type)}
                                </span>
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <button
                                onClick={() => handleMoveToSaved(item)}
                                className="text-mk-faint hover:text-red-500 transition-colors"
                                title="نقل للمحفوظات"
                              >
                                <IoHeartOutline className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleRemoveItem(item.itemId)}
                                className="text-mk-faint hover:text-red-500 transition-colors"
                                title="حذف"
                              >
                                <IoTrashOutline className="w-5 h-5" />
                              </button>
                            </div>
                          </div>

                          {/* Price and Quantity */}
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <span className="text-lg font-semibold text-[#400198]">
                                {item.price} ريال
                              </span>
                              {item.originalPrice && (
                                <span className="text-sm text-mk-muted line-through">
                                  {item.originalPrice} ريال
                                </span>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-2 space-x-reverse">
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.itemId,
                                    item.quantity - 1
                                  )
                                }
                                className="p-1 rounded-full border border-mk-border-2 hover:bg-mk-tint3 transition-colors"
                              >
                                <IoRemoveOutline className="w-4 h-4" />
                              </button>
                              <span className="w-8 text-center font-medium">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  handleQuantityChange(
                                    item.itemId,
                                    item.quantity + 1
                                  )
                                }
                                className="p-1 rounded-full border border-mk-border-2 hover:bg-mk-tint3 transition-colors"
                              >
                                <IoAddOutline className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Subtotal */}
                          <div className="mt-2 text-right">
                            <span className="text-sm text-mk-muted">
                              المجموع الفرعي: {item.price * item.quantity} ريال
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-mk-sm shadow-mk-card p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-mk-text mb-4">
                  ملخص الطلب
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-mk-muted">عدد العناصر</span>
                    <span className="font-medium">{cartItems.length}</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-mk-muted">المجموع الفرعي</span>
                    <span className="font-medium">{totalAmount} ريال</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-mk-muted">رسوم الخدمة</span>
                    <span className="font-medium">0 ريال</span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-mk-muted">الضريبة</span>
                    <span className="font-medium">0 ريال</span>
                  </div>

                  <div className="border-t border-mk-border pt-3">
                    <div className="flex justify-between">
                      <span className="text-lg font-semibold text-mk-text">
                        المجموع الكلي
                      </span>
                      <span className="text-lg font-bold text-[#400198]">
                        {totalAmount} ريال
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isProcessing}
                  className="w-full bg-[#400198] text-white py-3 px-4 rounded-md hover:bg-[#400198c9] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {isProcessing ? "جاري المعالجة..." : "الدفع الآن"}
                </button>

                <div className="mt-4 text-center">
                  <Link
                    to="/offers"
                    className="text-[#400198] hover:text-[#400198c9] text-sm font-medium"
                  >
                    ← متابعة التسوق
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-mk-sm shadow-mk-card p-12 text-center">
            <IoCartOutline className="w-16 h-16 text-mk-faint mx-auto mb-4" />
            <h3 className="text-lg font-medium text-mk-text mb-2">
              السلة فارغة
            </h3>
            <p className="text-mk-muted mb-6">
              ابدأ بإضافة العروض والبطاقات إلى سلة التسوق
            </p>
            <Link
              to="/offers"
              className="bg-[#400198] text-white px-6 py-2 rounded-md hover:bg-[#400198c9] transition-colors inline-block"
            >
              تصفح العروض
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;
