"use client";

import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function ProductTimeline({ productDetails }) {
  const getStatusIcon = (status) => {
    switch (status) {
      // TRẠNG THÁI HOÀN THÀNH/CHÍNH XÁC
      case "CREATED":
      case "READY_PROD":
      case "FINISHED":
      case "QC_DONE":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      
      // TRẠNG THÁI ĐANG XỬ LÝ
      case "NEED_DESIGN":
      case "DESIGNING":
      case "CHECK_DESIGN":
        return <Brush className="h-5 w-5 text-blue-600" />;
      case "IN_PROD":
      case "PROD_REWORK":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "PACKING":
        return <Package className="h-5 w-5 text-indigo-600" />;
      
      // TRẠNG THÁI VẤN ĐỀ/TẠM DỪNG
      case "QC_FAIL":
      case "DESIGN_REDO":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "HOLD":
      case "CANCELLED":
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
        
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      // MÀU XANH LÁ (THÀNH CÔNG/HOÀN THÀNH)
      case "CREATED":
      case "READY_PROD":
      case "FINISHED":
      case "QC_DONE":
        return "bg-green-100 text-green-800";
        
      // MÀU XANH DƯƠNG/INDIGO (ĐANG TIẾN HÀNH/XỬ LÝ)
      case "NEED_DESIGN":
      case "DESIGNING":
      case "CHECK_DESIGN":
      case "IN_PROD":
        return "bg-blue-100 text-blue-800";
      case "PACKING":
        return "bg-indigo-100 text-indigo-800";
        
      // MÀU ĐỎ/VÀNG (LỖI/TẠM DỪNG/HỦY)
      case "QC_FAIL":
      case "DESIGN_REDO":
      case "PROD_REWORK":
        return "bg-red-100 text-red-800";
      case "HOLD":
        return "bg-yellow-100 text-yellow-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
        
      default:
        return "bg-gray-100 text-gray-800";
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
