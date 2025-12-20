"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function ProductTimeline({ productDetails }) {
  const getStatusIcon = (status) => {
    switch (status) {
      // --- NHÓM HOÀN THÀNH TỐT ---
      case "CREATED":
      case "READY_PROD":
      case "FINISHED":
      case "QC_DONE":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      
      case "SHIPPED":
        return <CheckCircle2 className="h-5 w-5 text-green-700" />;

      // --- NHÓM THIẾT KẾ ---
      case "NEED_DESIGN":
      case "DESIGNING":
      case "CHECK_DESIGN":
        return <Brush className="h-5 w-5 text-purple-600" />;

      // --- NHÓM SẢN XUẤT ---
      case "IN_PROD":
        return <Clock className="h-5 w-5 text-blue-600" />;
      
      case "PROD_REWORK": // Reprint
        return <RefreshCw className="h-5 w-5 text-orange-600" />;

      // --- NHÓM GIAO HÀNG ---
      case "SHIPPING":
        return <Truck className="h-5 w-5 text-indigo-600" />;
      
      // --- NHÓM LỖI / VẤN ĐỀ ---
      case "QC_FAIL":
      case "DESIGN_REDO":
        return <XCircle className="h-5 w-5 text-red-600" />;
      
      case "HOLD_RF": // Chờ Refund
      case "HOLD_RP": // Chờ Reprint
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      
      case "REFUND":
        return <XCircle className="h-5 w-5 text-gray-500" />;
      case "CANCEL_SHIP":
        return <XCircle className="h-5 w-5 text-gray-500" />;
        
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      // Xanh lá: OK
      case "CREATED":
      case "READY_PROD":
      case "FINISHED":
      case "QC_DONE":
      case "SHIPPED":
        return "bg-green-100 text-green-800 border border-green-200";
        
      // Tím: Thiết kế
      case "NEED_DESIGN":
      case "DESIGNING":
      case "CHECK_DESIGN":
        return "bg-purple-100 text-purple-800 border border-purple-200";
      
      // Xanh dương: Sản xuất
      case "IN_PROD":
        return "bg-blue-100 text-blue-800 border border-blue-200";

      // Indigo: Shipping
      case "SHIPPING":
        return "bg-indigo-100 text-indigo-800 border border-indigo-200";
        
      // Đỏ: Lỗi
      case "QC_FAIL":
      case "DESIGN_REDO":
        return "bg-red-100 text-red-800 border border-red-200";

      // Cam/Vàng: Chờ xử lý lại hoặc giữ đơn
      case "PROD_REWORK":
      case "HOLD_RF":
      case "HOLD_RP":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";

      // Xám: Đã hoàn tiền/Hủy
      case "REFUND":
        return "bg-gray-100 text-gray-600 border border-gray-200";
        
      default:
        return "bg-gray-50 text-gray-600 border border-gray-200";
    }
  };

  return (
    <div className="flex gap-8 items-start mb-6">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-4">
          {/* SỬA 1: Đổi 'statuses' thành 'timeline' */}
          {productDetails.timeline && productDetails.timeline.map((status, idx) => (
            <div key={idx} className="flex items-center gap-1">
              <div
                className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(
                  status.status // SỬA 2: Đổi 'status.name' thành 'status.status'
                )}`}
              >
                {status.status} {/* SỬA 3: Đổi 'status.name' thành 'status.status' */}
              </div>
              {/* SỬA 4: Đổi 'statuses' thành 'timeline' */}
              {idx < productDetails.timeline.length - 1 && (
                <div className="text-gray-300 mx-1">→</div>
              )}
            </div>
          ))}
        </div>
       
      </div>
    </div>
  );
}
