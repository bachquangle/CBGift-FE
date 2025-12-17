"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react"; 
import apiClient from "../../../lib/apiClient";

export default function PaymentMethodSelector({ invoice, onClose }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState(null); // [MỚI] State chọn cổng
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isPartial = invoice.status === "PartiallyPaid";
  const remainingAmount = invoice.totalAmount - invoice.amountPaid;

  useEffect(() => {
    if (isPartial) {
      setSelectedMethod("full");
    }
  }, [isPartial]);

  const paymentMethods = [
    { key: "full", label: "Full Payment", percentage: 100 },
    { key: "20", label: "20%", percentage: 20 },
    { key: "30", label: "30%", percentage: 30 },
    { key: "50", label: "50%", percentage: 50 },
  ];

  // [MỚI] Danh sách cổng thanh toán
  const gateways = [
    { key: "PAYOS", label: "PayOS (QR, Thẻ)" },
    { key: "VNPAY", label: "VNPay (QR, Thẻ)" },
  ];

  const calculateAmount = () => {
    if (isPartial) return remainingAmount;
    if (!selectedMethod) return 0;
    const method = paymentMethods.find((m) => m.key === selectedMethod);
    return (invoice.totalAmount * method.percentage) / 100;
  };

  const amountToPay = calculateAmount();

  const formatCurrency = (value) => {
    if (value === 0) return "0 VND";
    if (!value) return "-";
    return new Intl.NumberFormat("vi-VN").format(value) + " VND";
  };

  const handleCreatePaymentLink = async () => {
    // [MỚI] Kiểm tra đã chọn cổng chưa
    if (!selectedGateway) {
      setError("Vui lòng chọn cổng thanh toán.");
      return;
    }

    setLoading(true);
    setError(null);

    const returnUrl = `${window.location.origin}/seller/manage-invoice`;
    const cancelUrl = `${window.location.origin}/api/payment/cancel`;

    const payload = {
      invoiceId: invoice.invoiceId,
      amount: amountToPay,
      returnUrl: returnUrl,
      cancelUrl: cancelUrl,
      gatewayName: selectedGateway, // [MỚI] Thêm gateway vào payload
    };

    try {
      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/payment/create-link`, // Đảm bảo đúng endpoint của bạn
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || "Payment link creation failed.");
      }

      const data = await response.json();
      window.location.href = data.paymentUrl;

    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6 overflow-y-auto max-h-[90vh]">
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          {isPartial ? "Pay Remaining Amount" : "Select Payment Method"}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Invoice: {invoice.invoiceNumber}
        </p>

        {/* Lựa chọn số tiền (Chỉ hiện nếu là hóa đơn mới) */}
        {!isPartial && (
          <div className="space-y-2 mb-6">
            <p className="text-sm font-semibold text-gray-700">1. Select Amount:</p>
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
                <div className="font-semibold text-gray-900">{method.label}</div>
                <div className="text-sm text-gray-600">
                  {formatCurrency((invoice.totalAmount * method.percentage) / 100)}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* [MỚI] Lựa chọn Cổng thanh toán */}
        <div className="space-y-2 mb-6 border-t pt-4">
          <p className="text-sm font-semibold text-gray-700">2. Select Gateway:</p>
          <div className="flex gap-2">
            {gateways.map((gateway) => (
              <button
                key={gateway.key}
                onClick={() => setSelectedGateway(gateway.key)}
                className={`flex-1 p-3 border-2 rounded-lg text-center transition-all ${
                  selectedGateway === gateway.key
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white hover:border-blue-300 text-gray-600"
                }`}
              >
                <span className="text-sm font-bold">{gateway.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="border-t pt-4 mb-4">
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-semibold">{formatCurrency(invoice.totalAmount)}</span>
          </div>
          <div className="flex justify-between mb-2 text-sm">
            <span className="text-gray-600">Amount Paid:</span>
            <span className="font-semibold">{formatCurrency(invoice.amountPaid)}</span>
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

        {error && <p className="text-sm text-red-600 mb-2 text-center">{error}</p>}

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-transparent"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreatePaymentLink}
            disabled={!selectedMethod || !selectedGateway || loading}
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