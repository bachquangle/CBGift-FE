"use client";

import { useState, useEffect } from "react"; // [SỬA] Thêm useEffect
import { Filter, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "../../lib/apiClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

// [XÓA] Toàn bộ mockInvoices
// const mockInvoices = [ ... ];

export default function SellerInvoiceList({ onPayment }) {
  // [THÊM] State cho API
  const [invoices, setInvoices] = useState([]);
  const [totalInvoices, setTotalInvoices] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho filter và pagination (giữ nguyên)
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // [XÓA] State 'paymentTypeFilter'
  // const [paymentTypeFilter, setPaymentTypeFilter] = useState("all");

  // [THÊM] useEffect để gọi API
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.append("page", currentPage);
        params.append("pageSize", itemsPerPage);

        if (searchTerm) {
          params.append("searchTerm", searchTerm);
        }
        if (statusFilter !== "all") {
          params.append("status", statusFilter);
        }

        // Gọi API
        const response = await fetch(
          `${apiClient.defaults.baseURL}/api/invoices/myinvoices?${params.toString()}`,
          {
            credentials: "include", // Cần thiết vì có [Authorize]
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch invoices");
        }

        const data = await response.json();
        console.log(data);
        setInvoices(data.items || []);
        setTotalInvoices(data.total || 0); // Giả định API trả về { items: [], total: 0 }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [currentPage, itemsPerPage, searchTerm, statusFilter]); // Dependency

  // [XÓA] 'filteredInvoices = useMemo()'
  // Toàn bộ logic filter/pagination giờ do backend xử lý

  // [SỬA] Tính toán dựa trên state từ API
  const totalPages = Math.ceil(totalInvoices / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;

  // [SỬA] Cập nhật 'getStatusBadge' để khớp với API (Issued, Paid, PartiallyPaid)
  const getStatusBadge = (status) => {
    switch (status) {
      case "Paid":
        return { bg: "bg-green-100", text: "text-green-800", label: "Paid" };
      case "PartiallyPaid":
        return {
          bg: "bg-yellow-100",
          text: "text-yellow-800",
          label: "Partial",
        };
      case "Issued":
      default:
        return { bg: "bg-red-100", text: "text-red-800", label: "Issued" };
    }
  };

  const handlePageChange = (page) => {
    // totalPages giờ đã được tính đúng
    setCurrentPage(Math.max(1, Math.min(page, totalPages || 1)));
  };

  // Hàm format tiền tệ
  const formatCurrency = (value) => {
    if (value === 0) return "0";
    if (!value) return "-";

    // Sử dụng Intl.NumberFormat để thêm dấu phẩy (vd: 10.000)
    const formatter = new Intl.NumberFormat('vi-VN');

    // Nếu số < 1 triệu, hiển thị đầy đủ, có dấu phẩy
    if (value < 1_000_000) {
      return formatter.format(value);
    }
    
    // Nếu số >= 1 triệu, mới hiển thị dạng "M"
    return (value / 1_000_000).toFixed(1) + "M";
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 space-y-4">
        {/* ... (Tiêu đề Filter) ... */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>

        {/* [SỬA] Chỉ còn 2 cột filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Search
            </label>
            <Input
              placeholder="Search invoice number..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="border-blue-200 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Status
            </label>
            {/* [SỬA] Cập nhật các giá trị (value) của SelectItem */}
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="border-blue-200">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="PartiallyPaid">Partially Paid</SelectItem>
                <SelectItem value="Issued">Issued</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* [XÓA] Toàn bộ <div> của "Payment Type" */}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-100 border-b border-gray-200">
                <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Invoice #
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Created Date
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Amount
                </th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Paid
                </th>
                {/* [THÊM] Cột Remaining */}
                <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Remaining
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Status
                </th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700 text-sm uppercase tracking-wide">
                  Action
                </th>
                {/* [XÓA] Th "Payment Type" */}
              </tr>
            </thead>
            <tbody>
              {/* [SỬA] Thêm Loading/Error/No Data states */}
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-500">
                    Loading invoices...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-red-500">
                    Error: {error}
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center p-8 text-gray-500">
                    No invoices found.
                  </td>
                </tr>
              ) : (
                // [SỬA] Dùng `invoices` thay vì `paginatedInvoices`
                invoices.map((invoice) => {
                  const badge = getStatusBadge(invoice.status);
                  return (
                    <tr
                      key={invoice.invoiceId} // [SỬA] Dùng invoiceId
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-semibold text-blue-600">
                        {invoice.invoiceNumber} {/* [SỬA] */}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {/* [SỬA] Dùng createdAt và format */}
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">
                        {formatCurrency(invoice.totalAmount)} {/* [SỬA] */}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-green-600">
                        {formatCurrency(invoice.amountPaid)} {/* [SỬA] */}
                      </td>
                      {/* [THÊM] Cột Remaining */}
                      <td className="px-4 py-3 text-right font-semibold text-red-600">
                        {formatCurrency(invoice.remainingBalance)}
                      </td>
                      <td className="px-4 py-3">
                        {/* Dòng 1: Badge (luôn hiển thị) */}
                          <div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
                            >
                              {badge.label}
                            </span>
                          </div>

                          {/* Dòng 2: Due Date (hiển thị có điều kiện) */}
                          {(invoice.status === "Issued" ||
                            invoice.status === "PartiallyPaid") && (
                            <div className="text-xs text-red-600 mt-1">
                              Due: {new Date(invoice.dueDate).toLocaleDateString()}
                            </div>
                          )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => onPayment(invoice)}
                          className="p-2 hover:bg-blue-100 rounded-lg transition-colors text-blue-600 hover:text-blue-700"
                          title="View Details"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                      {/* [XÓA] Td "Payment Type" */}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {/* [SỬA] Cập nhật logic phân trang để dùng `totalInvoices` */}
      <div className="bg-blue-100 px-4 py-3 border-t border-blue-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700 font-medium">
            Showing {invoices.length > 0 ? startIdx + 1 : 0} to{" "}
            {Math.min(startIdx + itemsPerPage, totalInvoices)} of{" "}
            {totalInvoices} invoices
          </div>

          {/* ... (Pagination Controls, giữ nguyên logic) ... */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="border-blue-200 hover:bg-blue-50 text-sm"
            >
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (page) =>
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                )
                .map((page, idx, arr) => (
                  <div key={page}>
                    {idx > 0 && page > arr[idx - 1] + 1 && (
                      <span className="mx-1 text-gray-600 text-xs">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={`min-w-8 h-8 p-0 text-sm ${
                        currentPage === page
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
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
              className="border-blue-200 hover:bg-blue-50 text-sm"
            >
              Next
            </Button>
          </div>

          {/* ... (Items Per Page, giữ nguyên logic) ... */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700 font-medium">
              Items Per Page
            </span>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}
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
    </div>
  );
}