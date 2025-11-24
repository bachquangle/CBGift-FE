"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import apiClient from "../../lib/apiClient";

export default function FilterHeader({
  dateRange,
  setDateRange,
  selectedSeller,
  setSelectedSeller,
  onRefresh,
}) {
  // State nội bộ để lưu danh sách seller
  const [sellersList, setSellersList] = useState([]);

  // Gọi API lấy danh sách Seller ngay khi component được mount
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await fetch(
          `${apiClient.defaults.baseURL}/api/reports/financial/all-sellers`,
          {
            method: "GET",
            credentials: "include", // Quan trọng để gửi cookie xác thực
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // Data trả về: [{ sellerId: "...", sellerName: "..." }, ...]
          setSellersList(data);
        }
      } catch (error) {
        console.error("FilterHeader: Failed to fetch sellers", error);
      }
    };

    fetchSellers();
  }, []); // Chỉ chạy 1 lần

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Business Intelligence & Analytics
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            CBGIFT Fulfillment Dashboard
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:gap-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        {/* --- Date Range Picker --- */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Range
          </label>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            />
            <span className="text-gray-500 font-medium">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {/* --- Seller Dropdown (Load động từ API) --- */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Filter by Seller
          </label>
          <select
            value={selectedSeller}
            onChange={(e) => setSelectedSeller(e.target.value)}
            className="flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="all">All Sellers</option>
            {sellersList.map((seller) => (
              <option key={seller.sellerId} value={seller.sellerId}>
                    {seller.sellerName}
                </option>
            ))}
          </select>
        </div>

        {/* --- Refresh Button --- */}
        <Button
          onClick={onRefresh}
          className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 py-2"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
}