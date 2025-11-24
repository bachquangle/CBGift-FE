"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, DollarSign, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "../../lib/apiClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SellerInvoiceDetailsModal({
  invoice, // Đây là invoice TÓM TẮT (summary) từ list
  isOpen,
  onClose,
  onPayment,
}) {
  // [THÊM] State để lưu trữ dữ liệu chi tiết từ API
  const [detailedInvoice, setDetailedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);

  // [THÊM] useEffect để gọi API khi modal được mở
  useEffect(() => {
    // Chỉ gọi API khi modal mở và có invoice
    if (isOpen && invoice?.invoiceId) {
      const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        setDetailedInvoice(null); // Xóa dữ liệu cũ
        try {
          const response = await fetch(
            `${apiClient.defaults.baseURL}/api/invoices/${invoice.invoiceId}`,
            {
              credentials: "include", // Cần cho [Authorize]
            }
          );
          if (!response.ok) {
            throw new Error("Failed to fetch invoice details.");
          }
          const data = await response.json();
          setDetailedInvoice(data);
        } catch (e) {
          setError(e.message);
        } finally {
          setLoading(false);
        }
      };

      fetchDetails();
    }
  }, [isOpen, invoice]); // Chạy lại khi 'isOpen' hoặc 'invoice' thay đổi

  // [THÊM] Hàm format tiền tệ thông minh
  const formatCurrency = (value) => {
    if (value === 0) return "0 VND";
    if (!value) return "-";

    const formatter = new Intl.NumberFormat("vi-VN");

    // Nếu số < 1 triệu, hiển thị đầy đủ
    if (value < 1_000_000) {
      return formatter.format(value) + " VND";
    }
    
    // Nếu số >= 1 triệu, hiển thị dạng "M"
    return (value / 1_000_000).toFixed(1) + "M VND";
  };

  if (!isOpen) return null;

  // [SỬA] Lấy 'orders' từ state 'detailedInvoice'
  // Dữ liệu API trả về: detailedInvoice.items[].order
  const orders = detailedInvoice?.items || [];
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = orders.slice(startIdx, startIdx + itemsPerPage);

  // [SỬA] getStatusBadge để khớp với paymentStatus của Order (Unpaid, Paid)
  const getStatusBadge = (status) => {
    // Giả định status truyền vào là order.paymentStatus
    return status === "Paid"
      ? { bg: "bg-green-100", text: "text-green-800", label: "Paid" }
      : { bg: "bg-red-100", text: "text-red-800", label: "Unpaid" };
  };

  // Hàm helper để render nội dung
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex-1 overflow-y-auto p-6 text-center text-red-500">
          Error: {error}
        </div>
      );
    }

    if (!detailedInvoice) {
      return (
        <div className="flex-1 overflow-y-auto p-6 text-center text-gray-500">
          No data available.
        </div>
      );
    }

    // Khi đã có dữ liệu
    return (
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-600 font-semibold uppercase">
              Total Amount
            </p>
            <p className="text-xl font-bold text-blue-900 mt-1">
              {formatCurrency(detailedInvoice.totalAmount)}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <p className="text-xs text-green-600 font-semibold uppercase">
              Paid Amount
            </p>
            <p className="text-xl font-bold text-green-900 mt-1">
              {formatCurrency(detailedInvoice.amountPaid)}
            </p>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <p className="text-xs text-orange-600 font-semibold uppercase">
              Remaining
            </p>
            <p className="text-xl font-bold text-orange-900 mt-1">
              {formatCurrency(
                detailedInvoice.totalAmount - detailedInvoice.amountPaid
              )}
            </p>
          </div>
        </div>

        {/* Orders Table - [SỬA LẠI TOÀN BỘ BẢNG] */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-100 border-b border-gray-200">
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                    Order Code
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                    Order Date
                  </th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 text-sm">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                    Payment Status
                  </th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 text-sm">
                    Order Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.map((item) => {
                  const order = item.order; // Lấy object 'order' từ 'item'
                  const badge = getStatusBadge(order.paymentStatus);
                  return (
                    <tr
                      key={order.orderId}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-semibold text-blue-600">
                        {order.orderCode}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">
                        {formatCurrency(order.totalCost)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {order.statusOrderNavigation?.nameVi || "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="bg-blue-100 px-4 py-3 border-t border-blue-200 flex items-center justify-between flex-wrap gap-4">
            <div className="text-sm text-gray-700">
              Showing {orders.length > 0 ? startIdx + 1 : 0} to{" "}
              {Math.min(startIdx + itemsPerPage, orders.length)} of{" "}
              {orders.length} orders
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1 || orders.length === 0}
                className="border-blue-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

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
                      <span className="mx-1 text-gray-600">...</span>
                    )}
                    <Button
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 p-0 ${
                        currentPage === page
                          ? "bg-indigo-600 hover:bg-indigo-700"
                          : "border-blue-200"
                      }`}
                    >
                      {page}
                    </Button>
                  </div>
                ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages || orders.length === 0}
                className="border-blue-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Items Per Page Selector */}
              <div className="ml-4 flex items-center gap-2">
                <label className="text-xs font-medium text-gray-700">
                  Per Page
                </label>
                <Select
                  value={itemsPerPage.toString()}
                  onValueChange={(value) => {
                    setItemsPerPage(Number(value));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="border-blue-200 w-16">
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
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 bg-gradient-to-r from-blue-500 to-blue-600">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Invoice{" "}
              {detailedInvoice
                ? detailedInvoice.invoiceNumber
                : invoice.invoiceNumber}
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Due Date:{" "}
              {detailedInvoice
                ? new Date(detailedInvoice.dueDate).toLocaleDateString()
                : "..."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-400 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Content (Loading/Error/Data) */}
        {renderContent()}

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {detailedInvoice && detailedInvoice.status !== "Paid" && (
            <Button
              // [SỬA] Truyền 'detailedInvoice' đầy đủ
              onClick={() => onPayment(detailedInvoice)}
              className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
              disabled={loading} // Vô hiệu hóa khi đang tải
            >
              <DollarSign className="h-4 w-4" />
              Pay Remaining{" "}
              {formatCurrency(
                detailedInvoice.totalAmount - detailedInvoice.amountPaid
              )}
* </Button>
          )}
        </div>
      </div>
    </div>
  );
}