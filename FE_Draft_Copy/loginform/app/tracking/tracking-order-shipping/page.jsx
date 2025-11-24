"use client";

import React, { useState } from "react";
import Link from 'next/link';

const DOTNET_API_BASE_URL = "https://localhost:7015/api";

// Loading Spinner Component
const LoadingSpinner = () => (
  // Sửa: Dùng border-white cho spinner trên nền tối/màu
  <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
);

// Icon Components
const PackageIcon = () => <span className="text-lg">📦</span>;
const SearchIcon = () => <span className="text-lg">🔍</span>;
const CheckCircleIcon = () => <span className="text-2xl">✓</span>;
const TruckIcon = () => <span className="text-lg">🚚</span>;
const MapPinIcon = () => <span className="text-lg">📍</span>;
const PhoneIcon = () => <span className="text-lg">📞</span>;
const WeightIcon = () => <span className="text-lg">⚖️</span>;
const ClockIcon = () => <span className="text-lg">🕐</span>;

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    picking: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-800 dark:text-yellow-200", label: "Đang lấy hàng" },
    picked: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-800 dark:text-blue-200", label: "Đã lấy hàng" },
    storing: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-800 dark:text-purple-200", label: "Đang lưu kho" },
    return: { bg: "bg-red-100 dark:bg-red-900/30", text: "text-red-800 dark:text-red-200", label: "Trả hàng" },
    ready_to_pick: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-800 dark:text-green-200", label: "Sẵn sàng lấy" },
    default: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-800 dark:text-gray-200", label: status }
  };

  const config = statusConfig[status] || statusConfig.default;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text}`}>
      <CheckCircleIcon />
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

  const groupLogsByDate = (logs) => {
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

  const handleTrackSubmit = async (e) => {
    e.preventDefault();
    setTrackResult(null);
    setTrackError(null);

    if (!trackCode) {
      setTrackError("Vui lòng nhập mã vận đơn.");
      return;
    }

    setIsTracking(true);
    try {
      const res = await fetch(`${DOTNET_API_BASE_URL}/shipping/track/${trackCode}`);
      const json = await res.json();

      if (!res.ok) throw new Error(json.message || "Không tìm thấy đơn.");
      if (!json.data) throw new Error("Không tìm thấy đơn.");

      const data = json.data;
      
      const requiredNoteTranslation = {
        "CHOXEMHANGKHONGTHU": "Cho xem hàng không cho thử",
        "CHOTHUNGIAOQUYENHTRU": "Cho thử hàng, có quyền từ chối",
        "KHONGDAYCHO": "Không đặt tại chỗ",
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
        weight: data.calculate_weight, 

        log: Array.isArray(data.log)
          ? data.log.map((l) => ({
              status: l.status,
              updatedDate: l.updated_date,
            }))
          : [],
        
        items: Array.isArray(data.items)
          ? data.items.map(item => ({
              name: item.name,
              quantity: item.quantity
            }))
          : [],
      };
      setTrackResult(result);
    } catch (err) {
      setTrackError(err.message);
    } finally {
      setIsTracking(false);
    }
  };

  const groupedLogs = trackResult ? groupLogsByDate(trackResult.log) : {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-secondary to-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="w-full px-4 py-6 md:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-primary">GHN Express</h1>
              <p className="text-muted-foreground mt-1">Giải pháp vận chuyển nhanh chóng & đáng tin cậy</p>
            </div>
            <div className="text-5xl">🚚</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-4 py-8 md:px-8 md:py-12">
        <div className="space-y-8">
          {/* Search Section */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="bg-accent/10 border-b border-border px-6 py-4">
              <h2 className="text-2xl font-bold text-foreground">Tra cứu vận đơn</h2>
              <p className="text-sm text-muted-foreground mt-1">Nhập mã vận đơn để xem trạng thái giao hàng của bạn</p>
            </div>
            <div className="p-6">
              <form onSubmit={handleTrackSubmit} className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value)}
                  placeholder="VD: L4ELQF"
                  className="flex-1 px-4 py-3 rounded-lg border border-border bg-input text-foreground placeholder:text-muted-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={isTracking}
                  className="inline-flex items-center justify-center rounded-lg font-semibold h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-all"
                >
                  {isTracking ? (
                    <>
                      <LoadingSpinner />
                      <span className="ml-2">Đang tìm...</span>
                    </>
                  ) : (
                    <>
                      <SearchIcon />
                      <span className="ml-2">Tra cứu</span>
                    </>
                  )}
                </button>
              </form>
              {trackError && (
                <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/30 p-4">
                  <p className="text-destructive text-sm font-semibold">❌ {trackError}</p>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          {trackResult && (
            <div className="space-y-6">
              {/* Order Summary Card */}
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-8 text-primary-foreground">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <p className="text-sm font-semibold opacity-90">Mã vận đơn</p>
                      <h3 className="text-3xl font-bold mt-2">{trackResult.orderCode}</h3>
                    </div>
                    <div className="text-5xl opacity-80"><TruckIcon /></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-t border-border">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Ngày lấy dự kiến</p>
                    <p className="text-lg font-bold text-foreground">
                      {trackResult.pickupTime ? new Date(trackResult.pickupTime).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Ngày giao dự kiến</p>
                    <p className="text-lg font-bold text-foreground">
                      {trackResult.leadtime ? new Date(trackResult.leadtime).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "-"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Cân nặng</p>
                    <p className="text-lg font-bold text-foreground">{trackResult.weight} g</p>
                  </div>
                </div>
              </div>

              {/* Recipient & Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* CỘT 1: Recipient Info */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 bg-green-50 dark:bg-green-950/30 border-b border-border px-6 py-4">
                    <MapPinIcon />
                    <h3 className="text-lg font-bold text-foreground">Người nhận</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Họ và tên</p>
                      <p className="text-base font-semibold text-foreground mt-1">{trackResult.toName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                        <PhoneIcon /> Điện thoại
                      </p>
                      <p className="text-base font-semibold text-foreground mt-1">{trackResult.toPhone}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Địa chỉ</p>
                      <p className="text-base font-semibold text-foreground mt-1">{trackResult.toAddress}</p>
                    </div>
                  </div>
                </div>
                
                {/* CỘT 2: Delivery Details */}
                <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                  <div className="flex items-center gap-3 bg-purple-50 dark:bg-purple-950/30 border-b border-border px-6 py-4">
                    <WeightIcon />
                    <h3 className="text-lg font-bold text-foreground">Thông tin chi tiết</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    
                    {/* Hiển thị danh sách items */}
                    {trackResult.items.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground uppercase">Sản phẩm</p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                          {trackResult.items.map((item, index) => (
                            <li key={index} className="text-sm font-semibold text-foreground">
                              {item.name} (SL: {item.quantity})
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Cân nặng</p>
                      <p className="text-base font-semibold text-foreground mt-1">{trackResult.weight} gram</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase">Lưu ý giao hàng</p>
                      <p className="text-base font-semibold text-foreground mt-1">{trackResult.requiredNote}</p>
                    </div>
                  </div>
                </div>
                
              </div> 

              {/* Timeline History */}
              <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 bg-accent/10 border-b border-border px-6 py-4">
                  <ClockIcon />
                  <h3 className="text-lg font-bold text-foreground">Lịch sử cập nhật</h3>
                </div>
                <div className="p-6">
                  {trackResult.log.length > 0 ? (
                    <div className="space-y-6">
                      {Object.keys(groupedLogs).map((dateHeader, dateIndex) => (
                        <div key={dateHeader}>
                          <div className="mb-4">
                            <h4 className="font-bold text-foreground text-sm uppercase tracking-wide opacity-70">{dateHeader}</h4>
                          </div>
                          <div className="space-y-3">
                            {groupedLogs[dateHeader].map((log, logIndex) => (
                              <div key={logIndex} className="flex gap-4">
                                <div className="flex flex-col items-center">
                                  <div className="w-3 h-3 rounded-full bg-primary mt-2"></div>
                                  {logIndex < groupedLogs[dateHeader].length - 1 && (
                                    <div className="w-1 bg-border flex-1 my-1" style={{ height: '40px' }}></div>
                                  )}
                                </div>
                                <div className="flex-1 pb-2">
                                  <p className="text-sm font-semibold text-foreground capitalize">{log.status.replaceAll("_", " ")}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {new Date(log.updatedDate).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Chưa có cập nhật nào.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!trackResult && !trackError && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4 opacity-50"><SearchIcon /></div>
              <p className="text-muted-foreground text-lg">Nhập mã vận đơn ở trên để bắt đầu theo dõi</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}