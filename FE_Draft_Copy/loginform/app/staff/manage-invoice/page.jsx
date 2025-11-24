"use client";

import { useState, useEffect } from "react"; // [SỬA] Thêm useEffect
import { Eye, Plus, Search, Loader2 } from "lucide-react"; // [SỬA] Thêm icon
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // [SỬA] Thêm Input
import StaffSidebar from "@/components/layout/staff/sidebar";
import StaffHeader from "@/components/layout/staff/header";
import apiClient from "../../../lib/apiClient";
import SellerDetailModal from "@/components/invoices/seller-detail-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// [XÓA] Toàn bộ 'mockSellers'

export default function ManageInvoicePage() {
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [itemsPerPageInModal, setItemsPerPageInModal] = useState(10);
  const [currentPageInModal, setCurrentPageInModal] = useState(1);
  const [sellersItemsPerPage, setSellersItemsPerPage] = useState(10);
  const [sellersCurrentPage, setSellersCurrentPage] = useState(1);

  // [THÊM] State mới để quản lý dữ liệu API
  const [sellers, setSellers] = useState([]); // Dữ liệu từ API
  const [totalSellers, setTotalSellers] = useState(0); // Tổng số sellers
  const [stats, setStats] = useState({ totalSales: 0, totalDebt: 0 }); // Stats tổng
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // [THÊM] useEffect để tải dữ liệu Receivables
  useEffect(() => {
    const fetchReceivables = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append("page", sellersCurrentPage);
        params.append("pageSize", sellersItemsPerPage);
        if (searchTerm) {
          params.append("searchTerm", searchTerm);
        }
        
        // Gọi API mới bạn đã tạo ở Phần 1
        const response = await fetch(
          `${apiClient.defaults.baseURL}/api/invoices/seller-receivables1?${params.toString()}`,
          {
            credentials: "include", 
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch seller receivables");
        }

        const data = await response.json();
        setSellers(data.items || []);
        setTotalSellers(data.total || 0);

      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchReceivables();
  }, [sellersCurrentPage, sellersItemsPerPage, searchTerm]); // Phụ thuộc

  // [THÊM] useEffect để tải Stats tổng (Thẻ tóm tắt)
  // GHI CHÚ: API này nên được tạo riêng để trả về 3 con số tổng
  useEffect(() => {
    const fetchStats = async () => {
      // TODO: Bạn cần tạo API (ví dụ: /api/invoices/receivables-stats)
      // trả về { totalSellers, totalSales, totalDebt } của TOÀN HỆ THỐNG.
      
      // Tạm thời, chúng ta sẽ gọi lại API và tính toán
      // (Cách này không tối ưu nếu có hàng nghìn seller, nhưng sẽ chạy)
      try {
        const response = await fetch(
          `${apiClient.defaults.baseURL}/api/invoices/seller-receivables1?page=1&pageSize=10000`, // Lấy tất cả
          { credentials: "include" }
        );
        const data = await response.json();
        const allSellers = data.items || [];
        
        const totalSales = allSellers.reduce((sum, s) => sum + s.totalSales, 0);
        const totalDebt = allSellers.reduce((sum, s) => sum + s.totalDebt, 0);
        
        setStats({ totalSales, totalDebt });
          console.log("Dữ liệu: ",data);

      } catch (e) {
        console.error("Failed to fetch stats:", e);
      }
    };
    fetchStats();
  }, []); // Chạy 1 lần

  const handleViewDetail = (seller) => {
    setSelectedSeller(seller);
    setShowModal(true);
  };
  
  // [SỬA] Cập nhật logic tính toán
  const totalSellersPages = Math.ceil(totalSellers / sellersItemsPerPage); //
  
  const handleSellersPageChange = (page) => { //
    setSellersCurrentPage(Math.max(1, Math.min(page, totalSellersPages)));
  };

  const handleSellersItemsPerPageChange = (value) => { //
    setSellersItemsPerPage(Number(value));
    setSellersCurrentPage(1);
  };
  
  // [XÓA] totalDebt, totalSales (cũ)
  // [XÓA] startIdx, paginatedSellers (cũ)

  // Hàm format tiền tệ
  const formatCurrency = (value) => {
    if (value === 0) return "0";
    if (!value) return "-";
    if (value < 1_000_000) {
      return new Intl.NumberFormat("vi-VN").format(value);
    }
    return (value / 1_000_000).toFixed(1) + "M";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <StaffSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <StaffHeader />
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-b-4 border-b-blue-500">
              <h1 className="text-3xl font-bold text-gray-900">
                Manage Seller Receivables
              </h1>
              <p className="mt-2 text-gray-600">
                Track and manage payment receivables and payment history from
                sellers
              </p>
            </div>

            {/* [SỬA] Summary Cards (dùng state) */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-l-blue-500">
                <p className="text-sm text-gray-600">Total Sellers</p>
                <p className="mt-2 text-3xl font-bold text-blue-600">
                  {totalSellers} {/* [SỬA] */}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-l-green-500">
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="mt-2 text-3xl font-bold text-green-600">
                  {formatCurrency(stats.totalSales)} {/* [SỬA] */}
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-l-red-500">
                <p className="text-sm text-gray-600">Total Receivables</p>
                <p className="mt-2 text-3xl font-bold text-red-600">
                  {formatCurrency(stats.totalDebt)} {/* [SỬA] */}
                </p>
              </div>
            </div>

            {/* Sellers List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="bg-blue-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Seller List
                </h2>
                
                {/* [THÊM] Search Input */}
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search Name, Email, Phone ..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setSellersCurrentPage(1); // Reset về trang 1 khi search
                    }}
                    className="pl-10 bg-white"
                  />
                </div>
              </div>

              {/* Table Header */}
              <div className="grid grid-cols-12 gap-4 bg-blue-100 px-6 py-3 text-sm font-semibold text-gray-700">
                <div className="col-span-2">Seller Name</div>
                <div className="col-span-3">Email</div>
                <div className="col-span-2">Phone</div>
                <div className="col-span-2">Total Sales</div>
                <div className="col-span-2">Receivables</div>
                <div className="col-span-1 text-center">Action</div>
              </div>

              {/* [SỬA] Sellers Rows (dùng state, thêm loading/error) */}
              <div className="divide-y">
                {loading ? (
                  <div className="p-12 text-center text-gray-500">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
                  </div>
                ) : error ? (
                  <div className="p-12 text-center text-red-500">{error}</div>
                ) : sellers.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">No sellers found.</div>
                ) : (
                  sellers.map((seller) => ( 
                    <div
                      key={seller.id}
                      className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 items-center"
                    >
                      <div className="col-span-2 font-semibold text-blue-600">
                        {seller.name} 
                      </div>
                      <div className="col-span-3 text-gray-900 font-medium">
                        {seller.email}
                      </div>
                      <div className="col-span-2 text-gray-600">
                        {seller.phone || "N/A"} 
                      </div>
                      <div className="col-span-2 text-left font-semibold text-green-600">
                        {formatCurrency(seller.totalSales)} 
                      </div>
                      <div className="col-span-2 text-lefft font-semibold text-red-600">
                        {formatCurrency(seller.totalDebt)} 
                      </div>
                      <div className="col-span-1 text-center">
                        <button
                          onClick={() => handleViewDetail(seller)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600 hover:text-blue-700 inline-flex"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* [SỬA] Pagination Footer (dùng state) */}
              {totalSellers > 0 && (
                <div className="bg-blue-100 px-4 py-3 border-t border-blue-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-gray-700 font-medium">
                      Showing {sellers.length > 0 ? (sellersCurrentPage - 1) * sellersItemsPerPage + 1 : 0} to{" "}
                      {Math.min(
                        sellersCurrentPage * sellersItemsPerPage,
                        totalSellers // [SỬA]
                      )}{" "}
                      of {totalSellers} sellers {/* [SỬA] */}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleSellersPageChange(sellersCurrentPage - 1)
                        }
                        disabled={sellersCurrentPage === 1}
                        className="border-blue-200 hover:bg-blue-50 text-sm"
                      >
                        Previous
                      </Button>

                      <div className="flex items-center gap-1">
                        {Array.from(
                          { length: totalSellersPages },
                          (_, i) => i + 1
                        )
                          .filter(
                            (page) =>
                              page === 1 ||
                              page === totalSellersPages ||
                              (page >= sellersCurrentPage - 1 &&
                                page <= sellersCurrentPage + 1)
                          )
                          .map((page, idx, arr) => (
                            <div key={page}>
                              {idx > 0 && page > arr[idx - 1] + 1 && (
                                <span className="mx-1 text-gray-600 text-xs">
                                  ...
                                </span>
                              )}
                              <Button
                                variant={
                                  sellersCurrentPage === page
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => handleSellersPageChange(page)}
                                className={`min-w-8 h-8 p-0 text-sm ${
                                  sellersCurrentPage === page
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                                    : "border-blue-200 hover:bg-blue-50"
                                }`}
                              >
                                {page}
                              </Button>
                            </div>
                          ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleSellersPageChange(sellersCurrentPage + 1)
                        }
                        disabled={sellersCurrentPage === totalSellersPages}
                        className="border-blue-200 hover:bg-blue-50 text-sm"
                      >
                        Next
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700 font-medium">
                        Items Per Page
                      </span>
                      <Select
                        value={sellersItemsPerPage.toString()}
                        onValueChange={handleSellersItemsPerPageChange}
                      >
                        <SelectTrigger className="w-20 border-blue-200 hover:bg-blue-50 text-sm h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="15">15</SelectItem>
                          <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Detail Modal (Giữ nguyên) */}
      {showModal && selectedSeller && (
        <SellerDetailModal
          seller={selectedSeller}
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedSeller(null);
          }}
          itemsPerPage={itemsPerPageInModal}
          currentPage={currentPageInModal}

          setItemsPerPage={setItemsPerPageInModal}
          setCurrentPage={setCurrentPageInModal}
        />
      )}
    </div>
  );
}