"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import apiClient from "../../lib/apiClient";

export default function OperationsFilters({
  dateRange,
  setDateRange,
  selectedStatus,
  setSelectedStatus,
  selectedSeller,
  setSelectedSeller,
  onRefresh,
}) {
  // 1. Giữ nguyên mock data cho Status
  const statuses = ["All", "Production", "Design", "Shipping"];

  // 2. [MỚI] State để lưu danh sách Seller từ API
  const [sellersList, setSellersList] = useState([]);

  // 3. [MỚI] Gọi API lấy Seller khi mount
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await fetch(
          `${apiClient.defaults.baseURL}/api/reports/financial/all-sellers`,
          {
            method: "GET",
            credentials: "include", // Gửi cookie auth
            headers: { "Content-Type": "application/json" },
          }
        );

        if (response.ok) {
          const data = await response.json();
          // data trả về: [{ sellerId: "...", sellerName: "..." }]
          setSellersList(data);
        }
      } catch (error) {
        console.error("OperationsFilters: Failed to fetch sellers", error);
      }
    };

    fetchSellers();
  }, []);

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-gray-900">Operations & Production Report</h1>
      <p className="mt-1 text-gray-600">Order processing, production efficiency, and quality control analytics</p>

      <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end md:gap-4">
        {/* Date Range Picker */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Date Range</label>
          <div className="mt-2 flex gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            />
            <span className="flex items-center text-gray-600">to</span>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="flex h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
            />
          </div>
        </div>

        {/* Status Filter (Giữ nguyên Mock) */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
          >
            {statuses.map((status) => (
              <option key={status} value={status.toLowerCase()}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {/* Seller Filter (Đã cập nhật Dynamic Data) */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Seller</label>
          <select
            value={selectedSeller}
            onChange={(e) => setSelectedSeller(e.target.value)}
            className="mt-2 h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
          >
            <option value="all">All Sellers</option>
            
            {/* Map danh sách Seller từ API */}
            {sellersList.map((seller) => (
              <option key={seller.sellerId} value={seller.sellerId}>
                {seller.sellerName}
              </option>
            ))}
          </select>
        </div>

        <Button onClick={onRefresh} className="bg-teal-600 hover:bg-teal-700">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  )
}