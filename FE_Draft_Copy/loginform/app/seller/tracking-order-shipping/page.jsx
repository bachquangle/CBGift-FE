"use client";

import React, { useState } from "react";
import apiClient from "../../../lib/apiClient";

const DOTNET_API_BASE_URL = `${apiClient.defaults.baseURL}/api`;

// Format currency
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN").format(Number(value) || 0);

// Loading Spinner
const LoadingSpinner = () => (
  <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
);

// Icon Components
const IconWrapper = ({
  children,
  colorClass = "bg-blue-100 text-blue-600",
}) => (
  <div
    className={`p-2 rounded-lg ${colorClass} inline-flex items-center justify-center`}
  >
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

// Status Badge
const StatusBadge = ({ status, className = "" }) => {
  const statusConfig = {
    picking: {
      bg: "bg-yellow-100 text-yellow-800 border-yellow-200",
      label: "Picking / Processing",
    },
    shipping: {
      bg: "bg-blue-100 text-blue-800 border-blue-200",
      label: "Shipping",
    },
    delivered: {
      bg: "bg-green-100 text-green-800 border-green-200",
      label: "Delivered",
    },
    shipped: {
      bg: "bg-green-100 text-green-800 border-green-200",
      label: "Delivered",
    },
    ready_to_pick: {
      bg: "bg-cyan-100 text-cyan-800 border-cyan-200",
      label: "Ready to Pick",
    },
    default: { bg: "bg-gray-100 text-gray-800 border-gray-200", label: status },
  };

  const config = statusConfig[status] || statusConfig.default;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-bold border shadow-sm ${config.bg} ${className}`}
    >
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

  const groupLogsByDate = (logs) => {
    if (!logs) return {};
    return logs.reduce((acc, log) => {
      const logDate = new Date(log.updatedDate);
      const dateHeader = logDate.toLocaleString("en-US", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

      if (!acc[dateHeader]) acc[dateHeader] = [];
      acc[dateHeader].push(log);
      return acc;
    }, {});
  };

  // Fetch tracking data
  const fetchTrackingData = async (code) => {
    const res = await fetch(`${DOTNET_API_BASE_URL}/shipping/track/${code}`);
    const json = await res.json();

    if (!res.ok || !json.data) throw new Error("Order not found.");

    const data = json.data;

    const requiredNoteTranslation = {
      CHOXEMHANGKHONGTHU: "View only, no trial",
      CHOTHUNGIAOQUYENHTRU: "Allow trial",
      KHONGDAYCHO: "Do not view",
      DEFAULT: "No note",
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
      requiredNote:
        requiredNoteTranslation[data.required_note] || data.required_note,
      weight: data.weight || data.calculate_weight,
      items: data.items || [],
      log:
        data.log?.map((l) => ({
          status: l.status,
          updatedDate: l.updated_date || l.updatedDate,
        })) || [],
    };

    result.log.sort(
      (a, b) => new Date(b.updatedDate) - new Date(a.updatedDate)
    );

    return result;
  };

  const handleTrackSubmit = async (e) => {
    if (e) e.preventDefault();
    setTrackResult(null);
    setTrackError(null);

    if (!trackCode.trim()) {
      setTrackError("Please enter tracking code.");
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

  const groupedLogs = trackResult ? groupLogsByDate(trackResult.log) : {};

  return (
    <div className="min-h-screen bg-blue-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <TruckIcon />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              GHN Express
            </h1>
            <p className="text-xs text-slate-500">Order Tracking System</p>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-screen-2xl mx-auto px-6 py-8 space-y-8">
        {/* Search Box */}
        <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
          <div className="p-6 md:p-8">
            <h2 className="text-2xl font-bold text-center mb-2">
              Track your order
            </h2>
            <p className="text-slate-500 text-center mb-6">
              Enter the tracking code (e.g., L4ELQF)
            </p>

            <form
              onSubmit={handleTrackSubmit}
              className="relative max-w-lg mx-auto"
            >
              <div className="flex shadow-sm rounded-lg overflow-hidden border border-slate-300">
                <input
                  type="text"
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
                  placeholder="Enter tracking code..."
                  className="flex-1 px-5 py-4 bg-white outline-none text-lg uppercase font-semibold"
                />
                <button
                  type="submit"
                  disabled={isTracking}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 flex items-center gap-2 disabled:bg-slate-400"
                >
                  {isTracking ? <LoadingSpinner /> : <SearchIcon />}
                  <span className="hidden md:inline">Track</span>
                </button>
              </div>
            </form>

            {trackError && (
              <div className="mt-6 max-w-lg mx-auto bg-red-50 text-red-600 px-4 py-3 rounded-lg border border-red-100 flex items-center">
                <span>⚠️</span>
                <span className="font-medium">{trackError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Result */}
        {trackResult && (
          <div className="space-y-6">
            {/* Main Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-slate-900 text-white p-6 md:p-8 text-center relative">
                <p className="text-slate-400 text-sm mb-2">Tracking Code</p>
                <h3 className="text-4xl md:text-5xl font-black tracking-widest mb-4 font-mono">
                  {trackResult.orderCode}
                </h3>
                <div className="flex justify-center">
                  <StatusBadge
                    status={trackResult.status}
                    className="bg-white/10 text-white border-white/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 divide-x divide-slate-100 border-b">
                <div className="p-4 text-center">
                  <p className="text-xs text-slate-500 uppercase">Order Date</p>
                  <p className="font-bold">
                    {new Date(trackResult.orderDate).toLocaleDateString(
                      "en-US"
                    )}
                  </p>
                </div>
                <div className="p-4 text-center">
                  <p className="text-xs text-slate-500 uppercase">
                    Estimated Delivery
                  </p>
                  <p className="font-bold text-blue-600">
                    {trackResult.leadtime
                      ? new Date(trackResult.leadtime).toLocaleDateString(
                          "en-US"
                        )
                      : "Updating"}
                  </p>
                </div>
                <div className="p-4 text-center col-span-2 md:col-span-1">
                  <p className="text-xs text-slate-500 uppercase">Weight</p>
                  <p className="font-bold">{trackResult.weight} gram</p>
                </div>
              </div>
            </div>

            {/* Receiver Info + Package Info */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Receiver */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                  <IconWrapper colorClass="bg-emerald-100 text-emerald-600">
                    <MapPinIcon />
                  </IconWrapper>
                  <h3 className="font-bold text-lg">Receiver Information</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-slate-500 uppercase">
                      Full Name
                    </p>
                    <p className="font-semibold">{trackResult.toName}</p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 uppercase">Phone</p>
                    <p className="font-semibold font-mono">
                      {trackResult.toPhone}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500 uppercase">Address</p>
                    <p className="font-semibold">{trackResult.toAddress}</p>
                  </div>
                </div>
              </div>

              {/* Package */}
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                  <IconWrapper colorClass="bg-purple-100 text-purple-600">
                    <BoxIcon />
                  </IconWrapper>
                  <h3 className="font-bold text-lg">Package Details</h3>
                </div>

                <div className="space-y-4">
                  {trackResult.items.length > 0 && (
                    <div>
                      <p className="text-xs text-slate-500 uppercase mb-2">
                        Items
                      </p>
                      <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                        {trackResult.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-slate-500 bg-white px-2 rounded border">
                              x{item.quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-xs text-slate-500 uppercase">
                      Delivery Note
                    </p>
                    <p className="font-medium">{trackResult.requiredNote}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="flex items-center gap-3 p-6 border-b bg-slate-50">
                <IconWrapper colorClass="bg-orange-100 text-orange-600">
                  <ClockIcon />
                </IconWrapper>
                <h3 className="font-bold text-lg">Order Timeline</h3>
              </div>

              <div className="p-6 md:p-8">
                {trackResult.log.length > 0 ? (
                  <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                    {Object.keys(groupedLogs).map((dateHeader) => (
                      <div key={dateHeader} className="mb-8">
                        <div className="ml-6 mb-4">
                          <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">
                            {dateHeader}
                          </span>
                        </div>

                        <div className="space-y-6 ml-6">
                          {groupedLogs[dateHeader].map((log, idx) => (
                            <div key={idx}>
                              <div className="bg-slate-50 hover:bg-blue-50 p-4 rounded-lg border">
                                <p className="font-bold capitalize">
                                  {log.status.replaceAll("_", " ")}
                                </p>
                                <p className="text-sm text-slate-500 mt-1">
                                  {new Date(log.updatedDate).toLocaleTimeString(
                                    "en-US",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
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
                    No timeline data available.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
