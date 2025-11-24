"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import apiClient from "../../lib/apiClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// [XÓA] mock 'months' và 'generateOrders'

// [MỚI] Component con để hiển thị danh sách order của 1 tháng
// (Truyền thêm onActionDone để làm mới)
const MonthlyOrderList = ({ sellerId, year, month }) => {
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(totalOrders / itemsPerPage);

  // [MỚI] useEffect để tải orders khi trang hoặc số item thay đổi
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      const params = new URLSearchParams({
        year,
        month,
        page: currentPage,
        pageSize: itemsPerPage,
      });
      
      const response = await fetch(
        `https://localhost:7015/api/invoices/seller-monthly-orders/${sellerId}?${params.toString()}`,
        { credentials: "include" }
      );
      const data = await response.json();
      setOrders(data.items || []);
      setTotalOrders(data.total || 0);
      setLoading(false);
    };

    fetchOrders();
  }, [sellerId, year, month, currentPage, itemsPerPage]);

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  
  // Hàm format tiền tệ
  const formatCurrency = (value) => {
    if (value === 0) return "0";
    if (!value) return "-";
    return new Intl.NumberFormat("vi-VN").format(value);
  };

  return (
    <div className="bg-gray-50 p-4 border-t border-gray-200">
      {/* Items Per Page Selector */}
      <div className="mb-4 flex items-center gap-2">
        <span className="text-sm text-gray-600">Items per page:</span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => {
            setItemsPerPage(Number(value));
            setCurrentPage(1); // Reset về trang 1
          }}
        >
          <SelectTrigger className="w-[70px] bg-white border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">5</SelectItem>
            <SelectItem value="10">10</SelectItem>
            <SelectItem value="15">15</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <div className="mb-4 overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-blue-100">
              <th className="px-4 py-2 text-left font-semibold text-gray-700">
                Order Code
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">
                Date
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">
                Customer
              </th>
              <th className="px-4 py-2 text-right font-semibold text-gray-700">
                Amount (VND)
              </th>
              <th className="px-4 py-2 text-left font-semibold text-gray-700">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="5" className="p-4 text-center"><Loader2 className="h-5 w-5 mx-auto animate-spin" /></td></tr>
            ) : orders.length === 0 ? (
               <tr><td colSpan="5" className="p-4 text-center text-gray-500">No SHIPPED orders found for this month.</td></tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.orderId}
                  className="border-t border-gray-200 hover:bg-white"
                >
                  <td className="px-4 py-3 font-semibold text-blue-600">
                    {order.orderCode}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {new Date(order.orderDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-gray-900">
                    {order.customerName}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-900">
                    {formatCurrency(order.totalCost)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-800`}
                    >
                      {order.orderStatus}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-gray-600">
            Showing {orders.length > 0 ? startIdx + 1 : 0} -{" "}
            {Math.min(endIdx, totalOrders)} of {totalOrders}{" "}
            orders
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
            {/* (Bạn có thể thêm logic hiển thị số trang ở đây nếu muốn) */}
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
    </div>
  );
};


// [SỬA] Component chính
const SellerOrdersTab = ({ seller, onActionDone }) => {
  const [expandedMonth, setExpandedMonth] = useState(null);
  
  // [THÊM] State cho API
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creatingInvoice, setCreatingInvoice] = useState(null); // State loading cho nút

  // [THÊM] useEffect chính để tải danh sách các tháng
  useEffect(() => {
    const fetchMonths = async () => {
      if (!seller?.id) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://localhost:7015/api/invoices/seller-monthly-sales/${seller.id}`,
          { credentials: "include" }
        );
        if (!response.ok) throw new Error("Failed to fetch monthly sales.");
        const data = await response.json();
        setMonths(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchMonths();
  }, [seller, onActionDone]); // [SỬA] Tải lại khi onActionDone thay đổi

  const handleExpandMonth = (monthId) => {
    setExpandedMonth(expandedMonth === monthId ? null : monthId);
  };

  // [SỬA] Logic tạo hóa đơn
  const handleCreateReceipt = async (month) => {
    setCreatingInvoice(month.monthName); // Đặt loading cho nút
    try {
      const response = await fetch(
        `https://localhost:7015/api/invoices/create-monthly-invoice`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sellerId: seller.id,
            year: month.year,
            month: month.month,
            notes: `Invoice for ${month.monthName}`
          }),
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to create invoice.");
      }

      alert(`Invoice ${data.invoiceNumber} created successfully!`);
      // Gọi hàm onActionDone (từ modal cha) để làm mới toàn bộ modal
      if(onActionDone) onActionDone();
      
    } catch (e) {
      alert(`Error: ${e.message}`);
    } finally {
      setCreatingInvoice(null); // Tắt loading
    }
  };

  // Hàm format tiền tệ
  const formatCurrency = (value) => {
    if (value === 0) return "0";
    if (!value) return "-";
    if (value < 1_000_000) {
      return new Intl.NumberFormat("vi-VN").format(value);
    }
    return (value / 1_000_000).toFixed(1) + "M";
  };

  if (loading) {
    return <div className="p-6 text-center"><Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" /></div>;
  }
  if (error) {
    return <div className="p-6 text-center text-red-500">Error: {error}</div>;
  }

  return (
    <div className="space-y-4 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Sales History by Month
        </h3>
        <p className="text-sm text-gray-600">
          View order details and create payment receipts for SHIPPED orders.
        </p>
      </div>

      {months.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          No monthly sales data found.
        </div>
      )}

      {months.map((month) => {
        const monthId = `${month.year}-${month.month}`;
        const isExpanded = expandedMonth === monthId;
        
        // Cập nhật logic status
        const statusConfig = {
          Invoiced: { bg: "bg-green-50", hover: "hover:bg-green-100", badgeBg: "bg-green-200", badgeText: "text-green-800", label: "Invoiced" },
          PartiallyInvoiced: { bg: "bg-yellow-50", hover: "hover:bg-yellow-100", badgeBg: "bg-yellow-200", badgeText: "text-yellow-800", label: "Partial" },
          Uninvoiced: { bg: "bg-red-50", hover: "hover:bg-red-100", badgeBg: "bg-red-200", badgeText: "text-red-800", label: "Uninvoiced" },
        };
        const currentStatus = statusConfig[month.status] || statusConfig.Uninvoiced;
        const isCreating = creatingInvoice === month.monthName;

        return (
          <div
            key={monthId}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            {/* Month Header */}
            <div
              className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${currentStatus.bg} ${currentStatus.hover}`}
              onClick={() => handleExpandMonth(monthId)}
            >
              <div className="flex items-center gap-4 flex-1">
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
                <div>
                  <h4 className="font-semibold text-gray-900">{month.monthName}</h4>
                  <p className="text-sm text-gray-600">
                    Total: {formatCurrency(month.totalAmount)}
                  </p>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${currentStatus.badgeBg} ${currentStatus.badgeText}`}
              >
                {currentStatus.label}
              </span>
            </div>

            {/* Month Details (Expanded) */}
            {isExpanded && (
              <>
                <MonthlyOrderList 
                  sellerId={seller.id} 
                  year={month.year} 
                  month={month.month}
                />
                
                {/* Action Button (chỉ hiển thị nếu CÓ GÌ ĐÓ để lập hóa đơn) */}
                {month.status !== "Invoiced" && (
                   <div className="flex justify-end p-4 bg-gray-50 border-t">
                    <Button
                      onClick={() => handleCreateReceipt(month)}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={isCreating}
                    >
                      {isCreating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 mr-2" />
                      )}
                      {isCreating ? "Creating..." : "Create Monthly Receipt"}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default SellerOrdersTab;