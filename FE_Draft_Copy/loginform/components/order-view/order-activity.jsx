"use client";

import { 
  FileText,       // Icon cho Draft
  CheckCircle2,   // Icon cho Confirmed
  RefreshCcw,     // Icon cho Refund
  Circle,         // Icon mặc định
  Truck           // Icon cho Shipped (nếu cần sau này)
} from "lucide-react";

export default function OrderActivity({ activities }) {

  // Hàm helper để chọn màu và icon dựa trên tiêu đề hoạt động
  const getActivityConfig = (title) => {
    const lowerTitle = title?.toLowerCase() || "";

    if (lowerTitle.includes("draft")) {
      return {
        color: "bg-gray-100 text-gray-600 border-gray-200",
        lineColor: "bg-gray-200",
        icon: FileText,
      };
    }
    
    if (lowerTitle.includes("confirmed")) {
      return {
        color: "bg-green-100 text-green-600 border-green-200",
        lineColor: "bg-green-200",
        icon: CheckCircle2,
      };
    }

    if (lowerTitle.includes("refund")) {
      return {
        color: "bg-red-100 text-red-600 border-red-200",
        lineColor: "bg-red-200",
        icon: RefreshCcw,
      };
    }

    // Mặc định (các status khác)
    return {
      color: "bg-blue-100 text-blue-600 border-blue-200",
      lineColor: "bg-blue-200",
      icon: Circle,
    };
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">
        Order Activity Timeline
      </h3>
      <div className="relative">
        {activities && activities.length > 0 ? (
          activities.map((activity, idx) => {
            const config = getActivityConfig(activity.title);
            const IconComponent = config.icon;

            return (
              <div key={idx} className="flex gap-4 relative">
                {/* Cột bên trái chứa Icon và Đường kẻ */}
                <div className="flex flex-col items-center min-w-[40px]">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 z-10 ${config.color}`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>
                  
                  {/* Vẽ đường kẻ nối (trừ item cuối cùng) */}
                  {idx < activities.length - 1 && (
                    <div className={`w-0.5 flex-1 my-1 ${config.lineColor}`}></div>
                  )}
                </div>

                {/* Cột bên phải chứa nội dung */}
                <div className="pb-8 pt-1">
                  <p className="text-xs text-gray-500 mb-1 font-medium">
                    {activity.date}
                  </p>
                  <p className="text-sm font-bold text-gray-900">
                    {activity.title}
                  </p>
                  {activity.description && (
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {activity.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8 text-gray-500 italic">
            No activity recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}