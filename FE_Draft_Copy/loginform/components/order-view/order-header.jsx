"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowLeft, Wallet, Printer } from 'lucide-react';

 export default function OrderHeader({
  orderId,
  orderCode,
  status, // Đây là statusOderName (string) từ API
  createdAt,
  orderDate,
  onCancel,
  trackingCode,
  onBack,
  onOpenRefund,
  onOpenReprint,
  isEligible,
  orderStatus,
}) {
 const getStatusBadgeColor = (status) => {
  const colors = {
    // --- Trạng thái khởi tạo ---
    DRAFT: "bg-gray-200 text-gray-800",
    CREATED: "bg-blue-200 text-blue-800",

    // --- Thiết kế ---
    NEEDDESIGN: "bg-yellow-200 text-yellow-800",
    DESIGNING: "bg-yellow-300 text-yellow-900",
    CHECKDESIGN: "bg-amber-200 text-amber-800",
    DESIGN_REDO: "bg-orange-300 text-orange-900",

    // --- Xác nhận & sản xuất ---
    CONFIRMED: "bg-green-200 text-green-800",
    READY_PROD: "bg-cyan-200 text-cyan-800",
    INPROD: "bg-cyan-300 text-cyan-900",
    PROD_REWORK: "bg-orange-200 text-orange-800",

    // --- Giai đoạn QC ---
    FINISHED: "bg-indigo-200 text-indigo-800",
    QC_DONE: "bg-purple-200 text-purple-800",
    QC_FAIL: "bg-red-300 text-red-900",

    // --- Vận chuyển ---
    SHIPPING: "bg-sky-200 text-sky-800",
    SHIPPED: "bg-green-300 text-green-900",

    // --- Hold trạng thái ---
    HOLD_RF: "bg-gray-300 text-gray-900",
    HOLD_RP: "bg-gray-300 text-gray-900",

    // --- Refund & thay đổi ---
    REFUND: "bg-red-200 text-red-800",
    CHANGE_ADDRESS: "bg-teal-200 text-teal-900",
  };

  return colors[status] || "bg-gray-100 text-gray-800";
  };

  const getStatusLabel = (status) => status;
  const handleDisabledClick = (action) => {
        alert(`Không thể ${action}. Trạng thái đơn hàng phải là SHIPPED hoặc COMPLETED. Trạng thái hiện tại: ${orderStatus}.`);
  };

  return (
    <div className="border-b border-gray-200 pb-4 mb-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Order: {orderCode}
            </h1>
            <div
              className={`
                inline-block px-3 py-1 rounded-md text-sm font-medium 
                ${getStatusBadgeColor(status)}`}>
              {getStatusLabel(status)}
            </div>
          </div>
          <p className="text-sm text-gray-500">
            Created at: {new Date(createdAt).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">
            Order Date: {new Date(orderDate).toLocaleString()}
          </p>
          <p className="text-sm text-gray-500">
            Tracking Code: <span className="font-medium text-gray-700 whitespace-nowrap">{trackingCode}</span>
        </p>  
        </div>
        <div className="flex gap-2">
          {/* {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )} */}
          {/* Phần Nút Hành động */}
           {/* NÚT YÊU CẦU HOÀN TIỀN (CẤP ORDER) */}
                    {onOpenRefund && (
                        <Button
                            variant="destructive"
                            size="sm"// ✨ DISABLE NẾU KHÔNG ĐỦ ĐIỀU KIỆN ✨
                            disabled={!isEligible} 
                            onClick={isEligible ? onOpenRefund : () => handleDisabledClick('Hoàn tiền')}
                            className="bg-red-500 hover:bg-red-600 text-white"
                            // ✨ THÔNG BÁO VỚI TITLE ✨
                            title={!isEligible ? `Trạng thái phải là SHIPPED/COMPLETED (Hiện tại: ${orderStatus})` : "Yêu cầu Hoàn tiền cho toàn bộ đơn hàng"}
                        >
                            <Wallet className="h-4 w-4 mr-2" /> Refund Order
                        </Button>
                    )}
                    
                    {/* NÚT YÊU CẦU IN LẠI (CẤP ORDER) */}
                    {onOpenReprint && (
                        <Button
                            variant="outline"
                            size="sm"
                            // ✨ DISABLE NẾU KHÔNG ĐỦ ĐIỀU KIỆN ✨
                            disabled={!isEligible} 
                            onClick={isEligible ? onOpenReprint : () => handleDisabledClick('In lại')}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            // ✨ THÔNG BÁO VỚI TITLE ✨
                            title={!isEligible ? `Trạng thái phải là SHIPPED/COMPLETED (Hiện tại: ${orderStatus})` : "Yêu cầu In lại cho toàn bộ đơn hàng"}
                        >
                            <Printer className="h-4 w-4 mr-2" /> Reprint Order
                        </Button>
                    )}       
          {onBack && (
            <Button
              onClick={onBack}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
