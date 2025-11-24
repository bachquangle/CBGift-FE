"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Clock, AlertCircle, Loader2 } from "lucide-react"; // Thêm Loader2
import { Button } from "@/components/ui/button";
import SellerHeader from "@/components/layout/seller/header";
import SellerSidebar from "@/components/layout/seller/sidebar";
import SellerInvoiceList from "@/components/invoices/seller-invoice-list";
import SellerInvoiceDetailsModal from "@/components/invoices/seller-invoice-details-modal";
import apiClient from "../../../lib/apiClient";


// Component PaymentMethodSelector
const PaymentMethodSelector = ({ invoice, onClose }) => {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [loading, setLoading] = useState(false); // State cho API call
  const [error, setError] = useState(null);

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
  const gateways = [
    { key: "PAYOS", label: "PayOS (QR, Thẻ)" },
    { key: "VNPAY", label: "VNPay (QR, Thẻ)" },
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
    if (!selectedMethod || !selectedGateway) {
      setError("Vui lòng chọn số tiền và cổng thanh toán.");
      return;
    }
    setLoading(true);
    setError(null);

    // Lấy URL cho return/cancel
    // Gợi ý: Bạn nên tạo trang /payment-success và /payment-cancel
    const returnUrl = `${window.location.origin}/seller/manage-invoice`;
    const cancelUrl = window.location.href; // Quay lại trang hiện tại
    //const publicBaseUrl = " https://slyvia-nonsubordinating-sulkily.ngrok-free.dev";
    
    // URL này VNPay sẽ chấp nhận VÌ NÓ LÀ PUBLIC
  // const returnUrl = `${publicBaseUrl}/seller/manage-invoice`;
    const payload = {
      invoiceId: invoice.invoiceId,
      amount: amountToPay,
      returnUrl: returnUrl,
      cancelUrl: cancelUrl,
      gatewayName: selectedGateway,
    };

    try {
      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/payment/create-link`,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
        {/* [THÊM MỚI] 2. CHỌN CỔNG THANH TOÁN */}
        <h4 className="text-md font-semibold text-gray-800 mb-3 mt-6">
          Select Gateway
        </h4>
        <div className="flex gap-4 mb-6">
          {gateways.map((gateway) => (
            <button
              key={gateway.key}
              onClick={() => setSelectedGateway(gateway.key)}
              className={`flex-1 p-3 border-2 rounded-lg text-center transition-all ${
                selectedGateway === gateway.key
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white hover:border-blue-300"
              }`}
            >
              {/* Bạn có thể thêm logo ở đây */}
              <span className="font-semibold">{gateway.label}</span>
            </button>
          ))}
        </div>
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
            onClick={onClose}
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
};

// [SỬA] Trang chính
export default function SellerManageInvoice() {
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // [MỚI] State cho dữ liệu thống kê
  const [stats, setStats] = useState({
    totalCount: 0,
    paidCount: 0,
    partialCount: 0,
    pendingCount: 0, // 'Issued'
    totalAmount: 0,
    totalPaid: 0,
    totalRemaining: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // [MỚI] Hàm format tiền tệ
  const formatCurrency = (value) => {
    if (value === 0) return "0 VND";
    if (!value) return "0 VND";
    if (value < 1_000_000) {
      return new Intl.NumberFormat("vi-VN").format(value) + " VND";
    }
    return (value / 1_000_000).toFixed(1) + "M VND";
  };

  // [MỚI] useEffect để fetch dữ liệu cho các thẻ Stats
  useEffect(() => {
    const fetchStatsData = async () => {
      setLoadingStats(true);
      try {
        // Gọi API lấy TẤT CẢ hóa đơn (không phân trang) để tính stats
        // Gợi ý: Nên tạo một API /my-stats riêng để hiệu quả hơn
        const response = await fetch(
          `${apiClient.defaults.baseURL}/api/invoices/myinvoices?page=1&pageSize=5000`, // size 5000 để lọc stats
          {
            credentials: "include",
          }
        );
        if (!response.ok) throw new Error("Could not load stats.");

        const data = await response.json();
        const invoices = data.items || [];

        // Tính toán stats
        let totalAmount = 0;
        let totalPaid = 0;
        let paidCount = 0;
        let partialCount = 0;
        let pendingCount = 0;

        invoices.forEach((inv) => {
          totalAmount += inv.totalAmount;
          totalPaid += inv.amountPaid;

          if (inv.status === "Paid") {
            paidCount++;
          } else if (inv.status === "PartiallyPaid") {
            partialCount++;
          } else if (inv.status === "Issued") {
            pendingCount++;
          }
        });

        setStats({
          totalCount: invoices.length,
          paidCount,
          partialCount,
          pendingCount,
          totalAmount,
          totalPaid,
          totalRemaining: totalAmount - totalPaid,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStatsData();
  }, []); // Chạy 1 lần khi component mount

  // [SỬA] Dùng invoiceId (từ API)
  const handleViewDetails = (invoice) => {
    setSelectedInvoice(invoice);
    setShowDetailsModal(true);
  };

  // [SỬA] Dùng invoiceId (từ API)
  const handlePaymentFromDetails = (invoice) => {
    setShowDetailsModal(false);
    setSelectedInvoice(invoice);
    // API của bạn chỉ cho phép thanh toán hóa đơn "Issued" hoặc "PartiallyPaid"
    if (invoice.status === "Issued" || invoice.status === "PartiallyPaid") {
      setShowPaymentModal(true);
    } else {
      // Không cho thanh toán hóa đơn đã "Paid"
      alert("This invoice has already been paid.");
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border-b-4 border-b-blue-500">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Manage Payment Receipts
              </h1>
              <p className="text-gray-600">
                View and pay payment receipts from staff
              </p>
            </div>

            {/* [SỬA] Thẻ Stats - dùng state */}
            {loadingStats ? (
              <div className="text-center p-10">
                <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Total Receipts
                        </p>
                        <p className="text-2xl font-bold text-gray-900">
                          {stats.totalCount}
                        </p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Paid</p>
                        <p className="text-2xl font-bold text-green-600">
                          {stats.paidCount}
                        </p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Partial</p>
                        <p className="text-2xl font-bold text-yellow-600">
                          {stats.partialCount}
                        </p>
                      </div>
                      <Clock className="h-8 w-8 text-yellow-500" />
                    </div>
                  </div>

                  <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Issued</p>
                        <p className="text-2xl font-bold text-red-600">
                          {stats.pendingCount}
                        </p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-500" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-blue-600 mb-1">Total Debt</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatCurrency(stats.totalAmount)}
                    </p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <p className="text-sm text-green-600 mb-1">Amount Paid</p>
                    <p className="text-2xl font-bold text-green-900">
                      {formatCurrency(stats.totalPaid)}
                    </p>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <p className="text-sm text-orange-600 mb-1">
                      Remaining Due
                    </p>
                    <p className="text-2xl font-bold text-orange-900">
                      {formatCurrency(stats.totalRemaining)}
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* SellerInvoiceList sẽ tự gọi API của nó (như đã làm ở chat trước) */}
            <SellerInvoiceList onPayment={handleViewDetails} />
          </div>
        </main>
      </div>

      {showDetailsModal && selectedInvoice && (
        <SellerInvoiceDetailsModal
          invoice={selectedInvoice}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedInvoice(null);
          }}
          onPayment={handlePaymentFromDetails}
        />
      )}

      {showPaymentModal && selectedInvoice && (
        <PaymentMethodSelector
          invoice={selectedInvoice}
          onConfirm={() => {
            // Logic này sẽ không được gọi vì chúng ta chuyển hướng
            setSelectedInvoice(null);
            setShowPaymentModal(false);
          }}
          onClose={() => {
            // Khi nhấn "Cancel"
            setSelectedInvoice(null);
            setShowPaymentModal(false);
            // Mở lại modal details
            // setShowDetailsModal(true); // Bỏ comment nếu muốn quay lại details
          }}
        />
      )}
    </div>
  );
}