"use client";

import { useState, useEffect } from "react";
import { Loader2, AlertTriangle } from "lucide-react";
import apiClient from "../../../lib/apiClient";
// Import modal thanh toán và modal chi tiết của bạn
import PaymentMethodSelector from "@/components/layout/seller/PaymentMethodSelector"; // (Bạn cần tạo component này)
import SellerInvoiceDetailsModal from "@/components/invoices/seller-invoice-details-modal";

// Component Loader toàn màn hình (ví dụ)
const FullScreenLoader = ({ message }) => (
  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white">
    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
    <p className="mt-4 text-gray-600">{message}</p>
  </div>
);

// Component hiển thị modal thanh toán (tôi sẽ dùng lại PaymentMethodSelector của bạn)
// Lưu ý: Modal này không có nút "Close"
const ForcedPaymentModal = ({ invoiceId }) => {
  const [invoiceDetails, setInvoiceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Bước 1: Lấy chi tiết hóa đơn
  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${apiClient.defaults.baseURL}/api/invoices/${invoiceId}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Could not load invoice details.");
        const data = await response.json();
        setInvoiceDetails(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [invoiceId]);

  if (loading) {
    return <FullScreenLoader message="Loading overdue invoice..." />;
  }

  if (error) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-white p-4">
        <AlertTriangle className="h-12 w-12 text-red-500" />
        <p className="mt-4 text-red-600">Error: {error}</p>
        <p className="mt-2 text-gray-500">Please contact support.</p>
      </div>
    );
  }

  // Bước 2: Hiển thị modal thanh toán (không có nút 'onClose')
  return (
    <PaymentMethodSelector 
      invoice={invoiceDetails} 
      onClose={() => {
        // Không cho phép đóng
        alert("You must pay the overdue invoice to continue.");
      }} 
    />
  );
};

// Component Blocker chính
export default function OverdueInvoiceBlocker({ children }) {
  const [status, setStatus] = useState("loading"); // loading, clear, overdue
  const [overdueInvoiceId, setOverdueInvoiceId] = useState(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `${apiClient.defaults.baseURL}/api/auth/status`,
          {
            credentials: "include",
          }
        );
        
        if (response.status === 401) {
          // Chưa đăng nhập, không làm gì cả (để trang login xử lý)
          setStatus("clear");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to check account status.");
        }

        const data = await response.json();

        if (data.hasOverdueInvoice) {
          setOverdueInvoiceId(data.overdueInvoiceId);
          setStatus("overdue");
        } else {
          setStatus("clear");
        }
      } catch (e) {
        console.error(e);
        // Nếu có lỗi, cứ cho qua (an toàn hơn là khóa tài khoản của họ)
        setStatus("clear");
      }
    };

    checkStatus();
  }, []);

  if (status === "loading") {
    return <FullScreenLoader message="Checking account status..." />;
  }

  if (status === "overdue") {
    // Chặn người dùng và hiển thị modal thanh toán
    return <ForcedPaymentModal invoiceId={overdueInvoiceId} />;
  }

  // Nếu status === 'clear', cho phép người dùng vào
  return <>{children}</>;
}