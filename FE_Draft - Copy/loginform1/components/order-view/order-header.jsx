"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, ArrowLeft, Wallet, Printer } from 'lucide-react';

 export default function OrderHeader({
  orderId,
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
    switch (status) {
      // TRẠNG THÁI THÀNH CÔNG/HOÀN THÀNH
      case "CONFIRMED":
      case "SHIPPED":
        return "bg-green-100 text-green-800";
      
      // TRẠNG THÁI ĐANG XỬ LÝ/PENDING
      case "CREATED":
      case "NEEDDESIGN":
      case "DESIGNING":
      case "READY_PROD":
      case "INPROD":
      case "PACKING":
      case "CHECKDESIGNC":
        return "bg-blue-100 text-blue-800";

      // TRẠNG THÁI NHÁP/TẠM DỪNG
      case "DRAFT":
      case "HOLD":
        return "bg-yellow-100 text-yellow-800";

      // TRẠNG THÁI LỖI/HỦY/HOÀN TIỀN
      case "DESIGN_REDO":
      case "QC_FAIL":
      case "CANCELLEDC":
      case "REFUND":
        return "bg-red-100 text-red-800";
        
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "PENDING":
        return "PENDING";
      case "CANCELLED":
        return "CANCELLED";
      case "COMPLETED":
        return "COMPLETED";
      case "PROCESSING":
        return "PROCESSING";
      default:
        return status;
    }
  };
  const handleDisabledClick = (action) => {
        alert(`Không thể ${action}. Trạng thái đơn hàng phải là SHIPPED hoặc COMPLETED. Trạng thái hiện tại: ${orderStatus}.`);
  };

  return (
    <div className="border-b border-gray-200 pb-4 mb-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-xl font-semibold text-gray-900">
              Order: #{orderId}
            </h1>
            <Badge className={`${getStatusBadgeColor(status)} font-medium`}>
              {getStatusLabel(status)}
            </Badge>
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
