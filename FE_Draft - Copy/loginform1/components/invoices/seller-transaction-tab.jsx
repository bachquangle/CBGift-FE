"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "../../lib/apiClient";

// [XÓA] mock 'transactionHistory'

const SellerTransactionTab = ({ seller, onActionDone }) => {
  // [THÊM] State cho API
  const [transactions, setTransactions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Có thể thêm Select để đổi

  const totalPages = Math.ceil(total / itemsPerPage);

  // [THÊM] useEffect để tải lịch sử thanh toán
  useEffect(() => {
    if (!seller?.id) return;

    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: currentPage,
        pageSize: itemsPerPage,
      });

      try {
        const response = await fetch(
          `https://localhost:7015/api/invoices/seller-payments/${seller.id}?${params.toString()}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch payment history.");
        const data = await response.json();
        setTransactions(data.items || []);
        setTotal(data.total || 0);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [seller, currentPage, itemsPerPage, onActionDone]); // [SỬA] Tải lại khi onActionDone thay đổi

  // Hàm format tiền tệ
  const formatCurrency = (value) => {
    if (value === 0) return "0";
    if (!value) return "-";
    if (value < 1_000_000) {
      return new Intl.NumberFormat("vi-VN").format(value);
    }
    return (value / 1_000_000).toFixed(1) + "M";
  };
  
  // [SỬA] Cập nhật các thẻ tóm tắt (Summary Cards)
  // GHI CHÚ: Các thẻ này nên được tính toán từ API riêng,
  // vì dữ liệu phân trang không đại diện cho toàn bộ lịch sử.
  // Tạm thời ẩn đi để tránh hiển thị sai.
  
  return (
    <div className="space-y-4 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Payment History
        </h3>
        <p className="text-sm text-gray-600">
          View payment transaction history
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-100">
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Payment ID
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Invoice #
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Date
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Method
              </th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">
                Status
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                Amount Paid
              </th>
              <th className="px-4 py-3 text-right font-semibold text-gray-700">
                Invoice Remaining
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="7" className="p-8 text-center"><Loader2 className="h-6 w-6 mx-auto animate-spin" /></td></tr>
            ) : error ? (
              <tr><td colSpan="7" className="p-8 text-center text-red-500">Error: {error}</td></tr>
            ) : transactions.length === 0 ? (
              <tr><td colSpan="7" className="p-8 text-center text-gray-500">No transactions found.</td></tr>
            ) : (
              transactions.map((t) => (
                <tr
                  key={t.paymentId}
                  className={`border-t border-gray-200 ${
                    t.status === "Completed"
                      ? "bg-green-50 hover:bg-green-100"
                      : "bg-yellow-50 hover:bg-yellow-100"
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-blue-600">
                    {t.paymentId}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{t.invoiceNumber}</td>
                  <td className="px-4 py-3 text-gray-600">{new Date(t.paymentDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-gray-700">{t.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        t.status === "Completed"
                          ? "bg-green-200 text-green-800"
                          // Thêm các trạng thái khác nếu có (Pending, Failed)
                          : "bg-yellow-200 text-yellow-800"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">
                    {formatCurrency(t.amount)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-red-600">
                    {formatCurrency(t.invoiceRemaining)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
       {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4">
          <div className="text-sm text-gray-600">
            Showing page {currentPage} of {totalPages} (Total: {total} payments)
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Summary - Tạm thời ẩn vì cần API tổng hợp */}
      {/*
      <div className="grid grid-cols-3 gap-4 mt-6">
        ...
      </div>
      */}
    </div>
  );
};

export default SellerTransactionTab;