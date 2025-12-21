"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Wallet, Printer, CreditCard } from 'lucide-react';

export default function OrderHeader({
  orderId,
  orderCode,
  status,          // Order Status (SHIPPED, CREATED...)
  createdAt,
  orderDate,
  trackingCode,
  onBack,
  onOpenRefund,
  onOpenReprint,
  isEligible,      // Đủ điều kiện trạng thái (Shipped/Completed)
  orderStatus,     // Tên trạng thái hiện tại (dùng cho tooltip)
  paymentStatus,   // ✨ Trạng thái thanh toán (Paid/Unpaid)
}) {

  // --- 1. Helper: Màu cho Order Status ---
  const getStatusBadgeColor = (status) => {
    const safeStatus = status?.toUpperCase() || "";
    const colors = {
      DRAFT: "bg-gray-200 text-gray-800",
      CREATED: "bg-blue-200 text-blue-800",
      NEEDDESIGN: "bg-yellow-200 text-yellow-800",
      DESIGNING: "bg-yellow-300 text-yellow-900",
      CHECKDESIGN: "bg-amber-200 text-amber-800",
      DESIGN_REDO: "bg-orange-300 text-orange-900",
      CONFIRMED: "bg-green-200 text-green-800",
      READY_PROD: "bg-cyan-200 text-cyan-800",
      INPROD: "bg-cyan-300 text-cyan-900",
      PROD_REWORK: "bg-orange-200 text-orange-800",
      FINISHED: "bg-indigo-200 text-indigo-800",
      QC_DONE: "bg-purple-200 text-purple-800",
      QC_FAIL: "bg-red-300 text-red-900",
      SHIPPING: "bg-sky-200 text-sky-800",
      SHIPPED: "bg-green-300 text-green-900",
      HOLD_RF: "bg-gray-300 text-gray-900",
      HOLD_RP: "bg-gray-300 text-gray-900",
      REFUND: "bg-red-200 text-red-800",
      CHANGE_ADDRESS: "bg-teal-200 text-teal-900",
      COMPLETED: "bg-green-600 text-white",
    };
    return colors[safeStatus] || "bg-gray-100 text-gray-800";
  };

  // --- 2. Helper: Màu cho Payment Status ---
  const isPaid = paymentStatus && paymentStatus.toLowerCase() === "paid";

  const getPaymentBadgeColor = () => {
    return isPaid
      ? "bg-emerald-100 text-emerald-800 border border-emerald-200" // Paid: Xanh ngọc
      : "bg-rose-100 text-rose-800 border border-rose-200";         // Unpaid: Đỏ hồng
  };

  // --- 3. Logic: Nút bấm (Disabled nếu Unpaid HOẶC chưa Shipped) ---
  const canAction = isPaid && isEligible;

  const getButtonTitle = (actionName) => {
    if (!isPaid) return `Không thể ${actionName}: Đơn hàng chưa thanh toán (Unpaid)`;
    if (!isEligible) return `Không thể ${actionName}: Trạng thái phải là SHIPPED/COMPLETED (Hiện tại: ${orderStatus})`;
    return `Yêu cầu ${actionName}`;
  };

  return (
    <div className="border-b border-gray-200 pb-4 mb-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        
        {/* --- CỘT THÔNG TIN --- */}
        <div>
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <h1 className="text-xl font-semibold text-gray-900">
              Order: {orderCode}
            </h1>
            
            {/* Badge 1: Order Status */}
            <div className={`inline-block px-3 py-1 rounded-md text-sm font-medium ${getStatusBadgeColor(status)}`}>
              {status}
            </div>

            {/* ✨ Badge 2: Payment Status (Hiển thị ngay cạnh) */}
            {paymentStatus && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-medium ${getPaymentBadgeColor()}`}>
                <CreditCard className="w-3.5 h-3.5" />
                <span>{paymentStatus}</span>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500 space-y-1">
            <p>Created at: {new Date(createdAt).toLocaleString()}</p>
            <p>Order Date: {new Date(orderDate).toLocaleString()}</p>
            <p>
              Tracking Code: <span className="font-medium text-gray-700">{trackingCode || "N/A"}</span>
            </p>
          </div>
        </div>

        {/* --- CỘT NÚT HÀNH ĐỘNG --- */}
        <div className="flex gap-2">
          
          {/* NÚT REFUND */}
          {onOpenRefund && (
            <Button
              variant="destructive"
              size="sm"
              disabled={!canAction} 
              onClick={onOpenRefund}
              className="bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              title={getButtonTitle("Hoàn tiền")}
            >
              <Wallet className="h-4 w-4 mr-2" /> Refund Order
            </Button>
          )}

          {/* NÚT REPRINT */}
          {onOpenReprint && (
            <Button
              variant="outline"
              size="sm"
              disabled={!canAction}
              onClick={onOpenReprint}
              className="border-blue-300 text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title={getButtonTitle("In lại")}
            >
              <Printer className="h-4 w-4 mr-2" /> Reprint Order
            </Button>
          )}

          {onBack && (
            <Button
              onClick={onBack}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}