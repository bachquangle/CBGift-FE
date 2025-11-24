// components/layout/seller/PaymentMethodSelector.jsx

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react"; // Dùng cho nút loading
import apiClient from "../../../lib/apiClient";

// Component này sẽ là một modal
export default function PaymentMethodSelector({ invoice, onClose }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false); // State cho API call
  const [error, setError] = useState(null);

  // Kiểm tra xem đây là trả nợ (PartiallyPaid) hay thanh toán mới (Issued)
  const isPartial = invoice.status === "PartiallyPaid";
  const remainingAmount = invoice.totalAmount - invoice.amountPaid;

  useEffect(() => {
    // Nếu là trả nợ (partial), tự động chọn "Full" (tức là trả hết nợ)
    if (isPartial) {
      setSelectedMethod("full");
    }
  }, [isPartial]);

  // Các lựa chọn thanh toán khi hóa đơn MỚI (Issued)
  const paymentMethods = [
    { key: "full", label: "Full Payment", percentage: 100 },
    { key: "20", label: "20%", percentage: 20 },
    { key: "30", label: "30%", percentage: 30 },
    { key: "50", label: "50%", percentage: 50 },
  ];

  // Tính toán số tiền dựa trên lựa chọn
  const calculateAmount = () => {
    if (isPartial) {
      return remainingAmount;
    }
    if (!selectedMethod) return 0;
    const method = paymentMethods.find((m) => m.key === selectedMethod);
    return (invoice.totalAmount * method.percentage) / 100;
  };

  const amountToPay = calculateAmount();

  // Hàm format tiền tệ
  const formatCurrency = (value) => {
    if (value === 0) return "0 VND";
    if (!value) return "-";
    return new Intl.NumberFormat("vi-VN").format(value) + " VND";
  };

  // [MỚI] Hàm gọi API create-payment-link
  const handleCreatePaymentLink = async () => {
    setLoading(true);
    setError(null);

    // Lấy URL cho return/cancel
    const returnUrl = `${window.location.origin}/seller/manage-invoice?payment=success`;
    const cancelUrl = window.location.href; // Quay lại trang hiện tại

    const payload = {
      invoiceId: invoice.invoiceId,
      amount: amountToPay,
      returnUrl: returnUrl,
      cancelUrl: cancelUrl,
    };

    try {
      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/invoices/create-payment-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Cần cho [Authorize]
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Tạo link thanh toán thất bại.");
      }

      const data = await response.json();
      
      // [QUAN TRỌNG] Chuyển hướng người dùng đến cổng thanh toán
      window.location.href = data.paymentUrl;

    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {isPartial ? "Pay Remaining Amount" : "Select Payment Method"}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Invoice: {invoice.invoiceNumber}
        </p>

        {/* Chỉ hiển thị lựa chọn nếu là hóa đơn mới (Issued) */}
        {!isPartial && (
          <div className="space-y-2 mb-6">
            {paymentMethods.map((method) => (
              <button
                key={method.key}
                onClick={() => setSelectedMethod(method.key)}
                className={`w-full p-3 border-2 rounded-lg text-left transition-all ${
                  selectedMethod === method.key
                    ? "border-green-500 bg-green-50"
                    : "border-gray-200 bg-white hover:border-green-300"
                }`}
              >
                <div className="font-semibold text-gray-900">
                  {method.label}
                </div>
                <div className="text-sm text-gray-600">
                  {formatCurrency(
                    (invoice.totalAmount * method.percentage) / 100
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="border-t pt-4 mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-semibold">
              {formatCurrency(invoice.totalAmount)}
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">Amount Paid:</span>
            <span className="font-semibold">
              {formatCurrency(invoice.amountPaid)}
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-gray-600">
              {isPartial ? "Remaining to Pay:" : "Payment Amount:"}
            </span>
            <span className="font-bold text-green-600 text-lg">
              {formatCurrency(amountToPay)}
            </span>
          </div>
        </div>

        {/* Hiển thị lỗi nếu có */}
        {error && (
            <p className="text-sm text-red-600 mb-2 text-center">{error}</p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose} // Nút này sẽ bị vô hiệu hóa bởi logic của Blocker
            className="flex-1 bg-transparent"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreatePaymentLink}
            disabled={!selectedMethod || loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Continue to Payment"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}