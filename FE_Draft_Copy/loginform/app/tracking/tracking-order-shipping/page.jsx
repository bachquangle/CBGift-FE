"use client";

import React, { useState } from "react";
import apiClient from "../../../lib/apiClient"; 

const DOTNET_API_BASE_URL = `${apiClient.defaults.baseURL}/api`;

// Loading Spinner
const LoadingSpinner = () => (
  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
);

// Icon Components (Styled)
const IconWrapper = ({ children, colorClass = "bg-blue-100 text-blue-600" }) => (
  <div className={`p-2 rounded-lg ${colorClass} inline-flex items-center justify-center`}>
    {children}
  </div>
);

const TruckIcon = () => <span className="text-xl">🚚</span>;
const SearchIcon = () => <span className="text-xl">🔍</span>;
const MapPinIcon = () => <span className="text-xl">📍</span>;
const PhoneIcon = () => <span className="text-xl">📞</span>;
const ClockIcon = () => <span className="text-xl">🕒</span>;
const BoxIcon = () => <span className="text-xl">📦</span>;
const NoteIcon = () => <span className="text-xl">📝</span>;
const ToolIcon = () => <span className="text-xl">🛠️</span>;

// Status Badge Component
const StatusBadge = ({ status, className = "" }) => {
  const statusConfig = {
    picking: { 
      bg: "bg-yellow-100 text-yellow-800 border-yellow-200", 
      label: "Đang lấy hàng / Đang xử lý" 
    },
    shipping: { 
      bg: "bg-blue-100 text-blue-800 border-blue-200", 
      label: "Đang vận chuyển" 
    },
    delivered: { 
      bg: "bg-green-100 text-green-800 border-green-200", 
      label: "Giao hàng thành công" 
    },
    shipped: { 
      bg: "bg-green-100 text-green-800 border-green-200", 
      label: "Giao hàng thành công"
    },
    ready_to_pick: { 
      bg: "bg-cyan-100 text-cyan-800 border-cyan-200", 
      label: "Mới tạo / Sẵn sàng lấy hàng" 
    },
    default: { 
      bg: "bg-gray-100 text-gray-800 border-gray-200", 
      label: status 
    }
  };

  const config = statusConfig[status] || statusConfig.default;

  return (
    <span className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold border shadow-sm ${config.bg} ${className}`}>
      <span className="w-2 h-2 rounded-full bg-current opacity-70"></span>
      {config.label}
    </span>
  );
};

// Main Component
export default function TrackingOrderShippingPage() {
  const [trackCode, setTrackCode] = useState("");
  const [trackResult, setTrackResult] = useState(null);
  const [trackError, setTrackError] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  
  // State cho việc update manual
  const [isUpdating, setIsUpdating] = useState(false);

  const groupLogsByDate = (logs) => {
    if (!logs) return {};
    return logs.reduce((acc, log) => {
      const logDate = new Date(log.updatedDate);
      const dateHeader = logDate.toLocaleString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "numeric",
        year: "numeric",
      });

      if (!acc[dateHeader]) {
        acc[dateHeader] = [];
      }
      acc[dateHeader].push(log);
      return acc;
    }, {});
  };

  // Hàm fetch data (được tách ra để tái sử dụng sau khi update status)
  const fetchTrackingData = async (code) => {
    const res = await fetch(`${DOTNET_API_BASE_URL}/shipping/track/${code}`);
    const json = await res.json();

    if (!res.ok) throw new Error(json.message || "Không tìm thấy đơn.");
    if (!json.data) throw new Error("Không tìm thấy đơn.");

    const data = json.data;
    
    const requiredNoteTranslation = {
      "CHOXEMHANGKHONGTHU": "Cho xem hàng, không thử",
      "CHOTHUNGIAOQUYENHTRU": "Cho thử hàng",
      "KHONGDAYCHO": "Không cho xem hàng",
      "DEFAULT": "Không có ghi chú"
    };
    
    const result = {
      orderCode: data.order_code,
      status: data.status,
      orderDate: data.order_date,
      pickupTime: data.pickup_time,
      leadtime: data.leadtime,
      toName: data.to_name,
      toPhone: data.to_phone,
      toAddress: data.to_address,
      requiredNote: requiredNoteTranslation[data.required_note] || data.required_note,
      weight: data.weight || data.calculate_weight, 
      items: data.items || [],
      log: data.log ? data.log.map(l => ({
         status: l.status,
         updatedDate: l.updated_date || l.updatedDate 
      })) : []
    };

    result.log.sort((a, b) => new Date(b.updatedDate) - new Date(a.updatedDate));
    return result;
  };

  const handleTrackSubmit = async (e) => {
    if(e) e.preventDefault();
    setTrackResult(null);
    setTrackError(null);

    if (!trackCode.trim()) {
      setTrackError("Vui lòng nhập mã vận đơn.");
      return;
    }

    setIsTracking(true);
    try {
      const result = await fetchTrackingData(trackCode.trim());
      setTrackResult(result);
    } catch (err) {
      setTrackError(err.message);
    } finally {
      setIsTracking(false);
    }
  };

  // --- HÀM XỬ LÝ UPDATE STATUS THỦ CÔNG ---
  const handleUpdateStatus = async (newStatus) => {
    if (!trackResult) return;
    setIsUpdating(true);

    try {
        // 1. Gọi API Update
        await apiClient.post("/api/shipping/update-status-manual", {
            orderCode: trackResult.orderCode,
            newStatus: newStatus
        });

        // 2. Gọi lại API Tracking để lấy dữ liệu mới nhất (Refresh UI)
        const updatedResult = await fetchTrackingData(trackResult.orderCode);
        setTrackResult(updatedResult);

    } catch (error) {
        alert("Lỗi cập nhật: " + (error.response?.data?.message || error.message));
    } finally {
        setIsUpdating(false);
    }
  };

  const groupedLogs = trackResult ? groupLogsByDate(trackResult.log) : {};

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">
      
      {/* Header Branding */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center gap-3">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
                <TruckIcon />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">GHN Express</h1>
                <p className="text-xs text-slate-500">Hệ thống tra cứu vận đơn</p>
            </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
        
        {/* Search Box */}
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-center mb-2">Tra cứu hành trình đơn hàng</h2>
            <p className="text-slate-500 text-center mb-6">Nhập mã vận đơn (VD: L4ELQF) để theo dõi chi tiết</p>
            
            <form onSubmit={handleTrackSubmit} className="relative max-w-lg mx-auto">
              <div className="flex shadow-sm rounded-lg overflow-hidden border border-slate-300 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all">
                <input
                  type="text"
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
                  placeholder="Nhập mã vận đơn..."
                  className="flex-1 px-5 py-4 bg-white outline-none text-lg uppercase font-semibold placeholder:normal-case placeholder:font-normal"
                />
                <button
                  type="submit"
                  disabled={isTracking}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 transition-colors flex items-center gap-2 disabled:bg-slate-400"
                >
                  {isTracking ? <LoadingSpinner /> : <SearchIcon />}
                  <span className="hidden md:inline">Tra cứu</span>
                </button>
              </div>
            </form>

            {trackError && (
              <div className="mt-6 max-w-lg mx-auto bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <span>⚠️</span>
                <span className="font-medium">{trackError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Results Area */}
        {trackResult && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* 1. Main Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 text-white p-6 md:p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400"></div>
                <div className="relative z-10">
                    <p className="text-slate-400 text-sm font-medium uppercase tracking-wider mb-2">Mã vận đơn</p>
                    <h3 className="text-4xl md:text-5xl font-black tracking-widest mb-4 font-mono">
                        {trackResult.orderCode}
                    </h3>
                    <div className="flex justify-center">
                        <StatusBadge status={trackResult.status} className="bg-white/10 text-white border-white/20 backdrop-blur-sm" />
                    </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
                <div className="p-4 text-center">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Ngày tạo</p>
                    <p className="font-bold text-slate-800 mt-1">
                        {trackResult.orderDate ? new Date(trackResult.orderDate).toLocaleDateString('vi-VN') : "--"}
                    </p>
                </div>
                <div className="p-4 text-center">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Dự kiến giao</p>
                    <p className="font-bold text-blue-600 mt-1">
                        {trackResult.leadtime ? new Date(trackResult.leadtime).toLocaleDateString('vi-VN') : "Đang cập nhật"}
                    </p>
                </div>
                <div className="p-4 text-center col-span-2 md:col-span-1 border-t md:border-t-0">
                    <p className="text-xs text-slate-500 uppercase font-semibold">Trọng lượng</p>
                    <p className="font-bold text-slate-800 mt-1">{trackResult.weight} gram</p>
                </div>
              </div>
            </div>

            {/* 2. Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                        <IconWrapper colorClass="bg-emerald-100 text-emerald-600"><MapPinIcon /></IconWrapper>
                        <h3 className="font-bold text-lg text-slate-800">Thông tin người nhận</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex gap-3">
                            <span className="text-slate-400 mt-1">👤</span>
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Họ tên</p>
                                <p className="font-semibold">{trackResult.toName}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-slate-400 mt-1"><PhoneIcon /></span>
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Số điện thoại</p>
                                <p className="font-semibold font-mono">{trackResult.toPhone}</p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <span className="text-slate-400 mt-1">🏠</span>
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Địa chỉ</p>
                                <p className="font-medium text-slate-700">{trackResult.toAddress}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                        <IconWrapper colorClass="bg-purple-100 text-purple-600"><BoxIcon /></IconWrapper>
                        <h3 className="font-bold text-lg text-slate-800">Chi tiết kiện hàng</h3>
                    </div>
                    <div className="space-y-4">
                         {trackResult.items.length > 0 && (
                            <div>
                                <p className="text-xs text-slate-500 uppercase mb-2">Sản phẩm bên trong</p>
                                <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                                    {trackResult.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between text-sm">
                                            <span className="font-medium text-slate-700">{item.name}</span>
                                            <span className="text-slate-500 bg-white px-2 rounded border">x{item.quantity}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex gap-3 pt-2">
                            <span className="text-slate-400 mt-1"><NoteIcon /></span>
                            <div>
                                <p className="text-xs text-slate-500 uppercase">Lưu ý giao hàng</p>
                                <p className="font-medium text-slate-800">{trackResult.requiredNote}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex items-center gap-3 p-6 border-b border-slate-100 bg-slate-50/50">
                    <IconWrapper colorClass="bg-orange-100 text-orange-600"><ClockIcon /></IconWrapper>
                    <h3 className="font-bold text-lg text-slate-800">Hành trình đơn hàng</h3>
                </div>
                
                <div className="p-6 md:p-8">
                    {trackResult.log.length > 0 ? (
                         <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                            {Object.keys(groupedLogs).map((dateHeader) => (
                                <div key={dateHeader} className="mb-8">
                                    <div className="absolute -left-[9px] mt-1.5">
                                         <div className="w-4 h-4 rounded-full bg-slate-200 border-2 border-white"></div>
                                    </div>
                                    <div className="ml-6 mb-4">
                                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                                            {dateHeader}
                                        </span>
                                    </div>

                                    <div className="space-y-6 ml-6">
                                        {groupedLogs[dateHeader].map((log, idx) => (
                                            <div key={idx} className="relative group">
                                                <div className="absolute -left-[31px] top-1.5 w-3 h-3 rounded-full bg-blue-500 ring-4 ring-white group-first:bg-green-500"></div>
                                                
                                                <div className="bg-slate-50 hover:bg-blue-50 transition-colors p-4 rounded-lg border border-slate-100">
                                                    <p className="font-bold text-slate-800 text-base capitalize">
                                                        {log.status === "ready_to_pick" ? "Sẵn sàng lấy" : 
                                                         log.status === "picking" ? "Đang giao hàng" :
                                                         log.status === "shipping" ? "Đang giao hàng" :
                                                         log.status === "delivered" ? "Giao hàng thành công" :
                                                         log.status === "shipped" ? "Giao hàng thành công" :
                                                         log.status.replaceAll("_", " ")}
                                                    </p>
                                                    <p className="text-sm text-slate-500 mt-1 font-medium">
                                                        {new Date(log.updatedDate).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                         </div>
                    ) : (
                        <div className="text-center py-10 text-slate-400">
                            <p>Chưa có dữ liệu hành trình.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* 4. ADMIN TOOLS - MANUAL UPDATE */}
            <div className="bg-slate-800 text-slate-100 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
                <div className="flex items-center gap-3 p-6 border-b border-slate-700 bg-slate-800">
                    <IconWrapper colorClass="bg-slate-700 text-white"><ToolIcon /></IconWrapper>
                    <h3 className="font-bold text-lg">Admin Tools (Developer Only)</h3>
                </div>
                <div className="p-6">
                    <p className="text-slate-400 mb-4 text-sm">
                        Sử dụng các nút dưới đây để cập nhật trạng thái đơn hàng thủ công (ghi log vào DB local).
                        Hành động này sẽ cập nhật trạng thái đơn và đồng bộ thời gian.
                    </p>
                    
                    <div className="flex flex-wrap gap-4">
                        <button 
                            onClick={() => handleUpdateStatus("ready_to_pick")}
                            disabled={isUpdating}
                            className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                        >
                            📦 Sẵn sàng lấy
                        </button>

                        <button 
                            onClick={() => handleUpdateStatus("shipping")}
                            disabled={isUpdating}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                        >
                            🚚 Đang giao hàng
                        </button>

                        <button 
                            onClick={() => handleUpdateStatus("delivered")}
                            disabled={isUpdating}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
                        >
                            ✅ Giao thành công
                        </button>

                         {isUpdating && <div className="flex items-center text-slate-300 ml-2"><LoadingSpinner /> <span className="ml-2">Đang xử lý...</span></div>}
                    </div>
                </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}