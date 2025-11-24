"use client";

import { useState, useEffect } from "react";
import ManagerSidebar from "@/components/layout/manager/sidebar";
import ManagerHeader from "@/components/layout/manager/header";
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import apiClient from "../../../lib/apiClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Play,
  CheckCircle,
  Send,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Loader,
} from "lucide-react";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import Swal from "sweetalert2";
import Link from 'next/link';

export default function StaffManageOrder() {
  const [currentPage, setCurrentPage] = useState("manage-order");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDetailLoading, setIsDetailLoading] = useState(false);
const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  // const [dateFilter, setDateFilter] = useState(""); // Đã thay bằng fromDate/toDate
  const [page, setPage] = useState(1);
const [itemsPerPage, setItemsPerPage] = useState(10);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  // const [rejectReason, setRejectReason] = useState(""); // Đã bị xóa
  // const [showRejectDialog, setShowRejectDialog] = useState(false); // Đã bị xóa
  // const [rejectingOrderId, setRejectingOrderId] = useState(null); // Đã bị xóa
const [sortColumn, setSortColumn] = useState("orderDate");
const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortDirection, setSortDirection] = useState("desc");
  const [fromDate, setFromDate] = useState("");
const [toDate, setToDate] = useState("");
// --- 1. THÊM STATE CHO BỘ LỌC SELLER ---
  const [sellers, setSellers] = useState([]); // State để lưu danh sách sellers
  const [selectedSeller, setSelectedSeller] = useState(""); // State lưu sellerId đang được chọn

  // --- 2. THÊM useEffect ĐỂ TẢI DANH SÁCH SELLERS (CHỈ CHẠY 1 LẦN) ---
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        // Gọi API bạn đã cung cấp (api/auth/all-sellers)
        const response = await fetch(
          `${apiClient.defaults.baseURL}/api/Auth/all-sellers`,
          {
            credentials: "include", // Cần thiết vì API của bạn có [Authorize]
          }
        );
        
        if (!response.ok) {
          throw new Error("Failed to fetch sellers list");
        }
        
        const data = await response.json();
        // API trả về mảng [ { sellerId, sellerName } ]
        setSellers(data || []); 
      } catch (err) {
        console.error("Error fetching sellers:", err);
        // Không cần báo lỗi lớn, chỉ log ra console
      }
    };

    fetchSellers();
  }, []); // Mảng rỗng [] đảm bảo useEffect này chỉ chạy 1 lần
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Xây dựng query params
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("pageSize", itemsPerPage.toString());
        params.append("sortDirection", sortDirection);
        params.append("sortColumn", sortColumn);

        if (searchTerm) {
          params.append("searchTerm", searchTerm);
        }
        if (filterStatus && filterStatus !== "all") {
          params.append("status", filterStatus);
        }
        if (fromDate) {
          params.append("fromDate", fromDate);
        }
        if (toDate) {
          params.append("toDate", toDate);
        }
        if (selectedSeller) {
          params.append("sellerId", selectedSeller);
        }
        // Tạo URL cuối cùng
        const apiUrl = `${apiClient.defaults.baseURL}/api/Order/GetAllOrders?${params.toString()}`;

console.log("[v1] Fetching:", apiUrl);

       const response = await fetch(apiUrl, {
          credentials: "include", // Cần thiết vì API của bạn có [Authorize]
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch orders: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("[v1] API Response:", data);
        setOrders(data.orders || []);
setTotalOrders(data.total || 0);
      } catch (err) {
        console.error("[v1] Error fetching orders:", err);
        setError(err.message);
} finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
}, [
    page,
    itemsPerPage,
    sortDirection,
    sortColumn,
    searchTerm,
    filterStatus,
    fromDate,
    toDate,
    selectedSeller,
  ]);

  const totalPages = Math.ceil(totalOrders / itemsPerPage);
const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };
const handleFilterChange = (value) => {
    setFilterStatus(value);
    setPage(1);
  };
  const handleSellerChange = (value) => {
    setSelectedSeller(value); // value chính là SellerId
    setPage(1); // Reset về trang 1 khi đổi filter
  };

  // [ĐÃ XÓA] handleDateFilterChange

const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setPage(1);
  };
const getStatusBadge = (order) => {
    const status = order.statusOderName || "";
const statusMap = {
      DRAFT: "bg-gray-100 text-gray-800",
      READY_PROD: "bg-blue-100 text-blue-800",
      CONFIRMED: "bg-amber-100 text-amber-800",
      SHIPPED: "bg-green-100 text-green-800",
      PROD_REWORK: "bg-yellow-100 text-yellow-800",
      CANCELLED: "bg-red-100 text-red-800",
      REFUND: "bg-orange-100 text-orange-800",
      HOLD: "bg-yellow-100 text-yellow-800",
      Refund: "bg-orange-100 text-orange-800",
    };
const className = statusMap[status] || "bg-gray-100 text-gray-800";
    return <Badge className={className}>{status}</Badge>;
  };
const getPriorityBadge = (priority) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">High</Badge>;
case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
case "low":
        return <Badge className="bg-gray-100 text-gray-800">Low</Badge>;
default:
        return <Badge variant="secondary">{priority}</Badge>;
    }
  };
const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
};

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([]);
} else {
      // [SỬA LỖI] Sử dụng 'orders' (từ server) thay vì 'filteredOrders'
      setSelectedOrders(orders.map((order) => order.orderId));
    }
    setSelectAll(!selectAll);
  };

  // --- BỘ 1: XỬ LÝ CANCEL VÀ REFUND BẰNG SWEETALERT2 ---

  // Helper: API call cho việc review Cancellation
  const reviewCancellation = async (
orderId,
    approved,
    rejectionReason = ""
  ) => {
    try {
      // [CHUẨN HÓA]: Đảm bảo path API là /api/Order/...
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Order/${orderId}/review-cancellation`,
        {
method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
body: JSON.stringify({
            approved: approved,
            rejectionReason: approved ? null : rejectionReason,
          }),
        }
      );
const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Lỗi không xác định!");
return { success: true, message: data.message };
    } catch (error) {
      return { success: false, message: error.message };
}
  };

  // Handler 1: Chấp nhận yêu cầu Hủy (Approve Cancel)
  const handleApproveCancel = async (orderId) => {
    const confirm = await Swal.fire({
      title: "Xác nhận!",
      text: `Bạn chắc chắn chấp nhận hủy đơn #${orderId}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
    });
if (!confirm.isConfirmed) return;

    Swal.showLoading();
    const result = await reviewCancellation(orderId, true);
    Swal.close();
if (result.success) {
      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: result.message,
        timer: 2000,
        showConfirmButton: false,
      });
      // Tải lại danh sách order sau khi thành công
if (typeof fetchOrders === "function") fetchOrders();
    } else {
      Swal.fire({
        icon: "error",
        title: "Thất bại!",
        text: result.message,
      });
}
  };

  // Handler 2: Từ chối yêu cầu Hủy (Reject Cancel)
  const handleRejectCancel = async (orderId) => {
    const { value: reason } = await Swal.fire({
      title: `Từ chối yêu cầu hủy #${orderId}`,
      input: "textarea",
      inputPlaceholder: "Nhập lý do từ chối (bắt buộc, tối thiểu 5 ký tự)...",
      showCancelButton: true,
      confirmButtonText: "Từ chối",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      preConfirm: (value) => {
        if (!value || value.trim().length < 5) {
Swal.showValidationMessage("Lý do phải ít nhất 5 ký tự!");
        }
        return value;
      },
    });
if (!reason) return;

    Swal.showLoading();
    const result = await reviewCancellation(orderId, false, reason);
    Swal.close();
if (result.success) {
      Swal.fire({
        icon: "success",
        title: "Đã từ chối!",
        text: result.message,
        timer: 2000,
        showConfirmButton: false,
      });
      // Tải lại danh sách order sau khi thành công
if (typeof fetchOrders === "function") fetchOrders();
    } else {
      Swal.fire({
        icon: "error",
        title: "Thất bại!",
        text: result.message,
      });
}
  };

  // [ĐÃ XÓA] handleApproveRefundCancel
  // [ĐÃ XÓA] handleRejectRefundCancel
  // [ĐÃ XÓA] reviewRefund (helper cũ)

  // Handler 3: Chấp nhận yêu cầu Hoàn tiền (Approve Refund)
const handleApproveRefund = async (refundId, orderCode) => {
    console.log(`🟡 Handling Refund ID: ${refundId} for Order: ${orderCode}`);
if (!refundId) return;
    Swal.fire({
      title: `Approve Refund #${orderCode}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, approve",
    }).then(async (res) => {
      if (res.isConfirmed) {
        try {
          const response = await fetch(
            `${apiClient.defaults.baseURL}/api/Order/refund-requests/${refundId}/review`,
            {
method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({ approved: true }),
            }
          );

          if (!response.ok) throw new Error("Failed to approve refund!");

          Swal.fire(
            "✅ Approved!",
`Refund for order #${orderCode} has been approved.`,
            "success"
          );

          // Tải lại danh sách order sau khi thành công
          if (typeof fetchOrders === "function") fetchOrders();
          else window.location.reload();
        } catch (err) {
          Swal.fire("Error", err.message || "Approve refund failed", "error");
}
      }
    });
  };

  // Handler 4: Từ chối yêu cầu Hoàn tiền (Reject Refund)
const handleRejectRefund = async (refundId, orderCode) => {
    const { value: reason } = await Swal.fire({
      title: `Reject Refund #${orderCode} - Enter reason:`,
      input: "text",
      inputPlaceholder: "Reason is required...",
      inputValidator: (value) => {
        if (!value) return "You must enter a reason!";
      },
      showCancelButton: true,
      confirmButtonText: "Reject",
    });

if (!reason) return;

    try {
      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/Order/refund-requests/${refundId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ approved: false, rejectionReason: reason }),
        }
      );

if (!response.ok) throw new Error("Failed to reject refund!");

      Swal.fire(
        "✅ Rejected!",
`Refund for order #${orderCode} has been rejected.`,
        "success"
      );

      // Tải lại danh sách order sau khi thành công
      if (typeof fetchOrders === "function") fetchOrders();
      else window.location.reload();
} catch (err) {
      Swal.fire("Error", err.message || "Reject refund failed", "error");
    }
  };

  // [ĐÃ XÓA] handleReviewRefund
  // [ĐÃ XÓA] handleConfirmReject

  // --- KẾT THÚC BỘ 1 ---

  const handleStartProduction = () => {
    if (selectedOrders.length === 0) {
      setConfirmAction({
        type: "error",
        title: "No Orders Selected",
        message: "Please select orders to start production",
      });
setShowConfirmDialog(true);
      return;
    }

    setConfirmAction({
      type: "start_production",
      title: "Start Production",
      message: `Start production for ${selectedOrders.length} order${
        selectedOrders.length > 1 ? "s" : ""
      }?`,
      count: selectedOrders.length,
    });
setShowConfirmDialog(true);
  };

  const handleMarkDone = () => {
    if (selectedOrders.length === 0) {
      setConfirmAction({
        type: "error",
        title: "No Orders Selected",
        message: "Please select orders to mark as done",
      });
setShowConfirmDialog(true);
      return;
    }

    setConfirmAction({
      type: "mark_done",
      title: "Mark as Done",
      message: `Mark ${selectedOrders.length} order${
        selectedOrders.length > 1 ? "s" : ""
      } as production complete?`,
      count: selectedOrders.length,
    });
setShowConfirmDialog(true);
  };

  const handleAssignToQC = () => {
    if (selectedOrders.length === 0) {
      setConfirmAction({
        type: "error",
        title: "No Orders Selected",
        message: "Please select orders to assign to QC",
      });
setShowConfirmDialog(true);
      return;
    }

    setConfirmAction({
      type: "assign_qc",
      title: "Assign to QC",
      message: `Assign ${selectedOrders.length} order${
        selectedOrders.length > 1 ? "s" : ""
      } to QC for final inspection?`,
      count: selectedOrders.length,
    });
setShowConfirmDialog(true);
  };

  const handleConfirmAction = () => {
    if (confirmAction?.type === "start_production") {
console.log(`Starting production for ${confirmAction.count} orders`);
    } else if (confirmAction?.type === "mark_done") {
      console.log(
`Marking ${confirmAction.count} orders as production complete`
      );
    } else if (confirmAction?.type === "assign_qc") {
console.log(`Assigning ${confirmAction.count} orders to QC`);
    }
    // [ĐÃ XÓA] Logic approve_refund đã bị xóa khỏi đây

    setSelectedOrders([]);
    setSelectAll(false);
setShowConfirmDialog(false);
    setConfirmAction(null);
  };

  const handleDownload = (fileUrl, fileName) => {
    console.log(`Downloading file: ${fileName} from ${fileUrl}`);
const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const handleViewDetails = async (order) => {
    // 1. Mở modal ngay lập tức với dữ liệu cơ bản (để UI phản hồi nhanh)
    setSelectedOrderDetails(order); 
    setIsDetailLoading(true);

    try {
      // 2. Gọi API mới dành riêng cho Manager để lấy Reason, RejectionReason mới nhất
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Order/manager/${order.orderId}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error("Failed to load detailed info");

      const fullData = await res.json();
      
      // 3. Cập nhật lại state với dữ liệu đầy đủ từ API
      console.log("🔥 Full Manager Details:", fullData);
      setSelectedOrderDetails(fullData);

    } catch (err) {
      console.error("Error fetching manager details:", err);
      // Không đóng modal, vẫn để dữ liệu cũ hiển thị để user xem tạm
    } finally {
      setIsDetailLoading(false);
    }
  };
return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <ManagerHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="space-y-6">
            
            {/* Header MỚI */}
            <div className="bg-white p-4 rounded-lg border-2 border-blue-200 flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-semibold text-gray-900">
                        Manage Order
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Manage production orders and status updates
                    </p>
                </div>
                
                {/* ✨ NÚT XEM YÊU CẦU CẦN XỬ LÝ (MỚI) ✨ */}
                <Link 
                    href="/manager/refund-reprint-review" 
                    passHref
                    target="_blank" // ✨ THÊM: Mở tab mới
                    rel="noopener noreferrer" // ✨ THÊM: Bảo mật
                >
                    <Button
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-700 font-bold px-4 py-2 text-white shadow-md"
                    >
                        View Requests to Process
                    </Button>
                </Link>
            </div>
            

{/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                <p className="font-medium">Error loading orders:</p>
                <p className="text-sm">{error}</p>
              </div>
)}

            {/* Search and Filter */}
            <div className="bg-white p-4 rounded-lg shadow">
              {/* Hàng 1: Search và Status */}
              <div className="flex flex-col md:flex-row gap-4 mb-4">
<div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by Order ID, Customer..."
value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={selectedSeller}
                  onChange={(e) => handleSellerChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md w-full md:w-auto text-sm"
                >
                  <option value="">All Sellers</option>
                  {/* Dùng state 'sellers' đã fetch từ API */}
                  {sellers.map((seller) => (
                    <option key={seller.sellerId} value={seller.sellerId}>
                      {seller.sellerName || `Seller (ID: ${seller.sellerId.substring(0, 6)}..)`}
                    </option>
                  ))}
                </select>
<select
                  value={filterStatus}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md w-full md:w-auto text-sm"
                >
<option value="all">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="READY_PROD">Ready Production</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="SHIPPED">Shipped</option>
<option value="PROD_REWORK">Prod. Rework</option>
<option value="CANCELLED">Cancelled</option>
                  <option value="REFUND">Refund</option>
                  <option value="HOLD">Hold</option>
                </select>
              </div>

{/* Hàng 2: Date Range và Sorting */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* From Date */}
                <div className="flex-1 w-full">
<label className="text-xs font-medium text-gray-600">
                    From Date
                  </label>
                  <Input
                    type="date"
                    value={fromDate}
onChange={(e) => {
                      setFromDate(e.target.value);
setPage(1); // Reset page khi đổi filter
                    }}
                    className="w-full"
                  />
                </div>

{/* To Date */}
                <div className="flex-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    To Date
                  </label>
                  <Input
                    type="date"
value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
setPage(1); // Reset page khi đổi filter
                    }}
                    className="w-full"
                    min={fromDate} // Đảm bảo ToDate không trước FromDate
                  />
</div>

                {/* Sort Column */}
                <div className="flex-1 w-full">
                  <label className="text-xs font-medium text-gray-600">
                    Sort By
                  </label>
<select
                    value={sortColumn}
                    onChange={(e) => {
                      setSortColumn(e.target.value);
setPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md w-full text-sm"
                  >
                    <option value="orderDate">Order Date</option>
                    <option value="customerName">Customer Name</option>
<option value="orderCode">Order Code</option>
                    <option value="totalCost">Total Cost</option>
                  </select>
                </div>

{/* Sort Direction */}
                <div className="flex-1 w-full md:w-auto">
                  <label className="text-xs font-medium text-gray-600">
                    Direction
                  </label>
                  <select
                    value={sortDirection}
onChange={(e) => {
                      setSortDirection(e.target.value);
setPage(1);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-md w-full text-sm"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
</select>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {selectedOrders.length > 0 && (
<div className="bg-white p-4 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                  <span className="text-sm text-gray-600">
                    {selectedOrders.length} orders selected
                  </span>
<Button
                    onClick={handleStartProduction}
                    className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
                  >
                    <Play className="h-4 w-4 mr-1" />
Start Production
                  </Button>
                  <Button
                    onClick={handleMarkDone}
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Mark Done
                  </Button>
                  <Button
onClick={handleAssignToQC}
                    className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                  >
                    <Send className="h-4 w-4 mr-1" />
Assign to QC
                  </Button>
                </div>
              </div>
            )}

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
<div className="overflow-x-auto">
                {isLoading ? (
<div className="flex items-center justify-center py-12">
                    <Loader className="h-6 w-6 text-blue-600 animate-spin mr-2" />
                    <span className="text-gray-600">Loading orders...</span>
                  </div>
) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-blue-100 hover:bg-blue-100">
                        <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
<Checkbox
                            checked={selectAll}
                            onCheckedChange={handleSelectAll}
aria-label="Select all orders"
                          />
                        </TableHead>
                        <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
Order ID
                        </TableHead>
                        <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                          Order Code
</TableHead>
                        <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                          Customer
</TableHead>
                        <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                          Email
                        </TableHead>
<TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                          Total Cost
                        </TableHead>
                        <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
Status
                        </TableHead>
                        <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                          Payment
Status
                        </TableHead>
                        <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                          Actions
</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
  {orders.length === 0 ? (
    <TableRow>
      <TableCell
        colSpan={9}
        className="text-center py-8 text-slate-500"
      >
        No orders found
      </TableCell>
    </TableRow>
  ) : (
    orders.map((order) => (
      // ✅ [SỬA 1] Thay <> bằng React.Fragment và đặt KEY ở đây
      <React.Fragment key={order.orderId}>
        <TableRow
          // ✅ [SỬA 2] Xóa key khỏi đây
          className="hover:bg-blue-50 transition-colors"
        >
          <TableCell>
            <Checkbox
              checked={selectedOrders.includes(
                order.orderId
              )}
              onCheckedChange={() =>
                handleSelectOrder(order.orderId)
              }
              aria-label={`Select order ${order.orderId}`}
            />
          </TableCell>
          <TableCell className="font-medium text-slate-900 whitespace-nowrap">
            {order.orderId}
          </TableCell>
          <TableCell className="font-medium text-slate-900 whitespace-nowrap">
            {order.orderCode}
          </TableCell>
          <TableCell className="min-w-[150px]">
            <div>
              <div className="font-medium text-slate-900">
                {order.customerName}
              </div>
              {order.phone && (
                <div className="text-sm text-slate-500">
                  {order.phone}
                </div>
              )}
            </div>
          </TableCell>
          <TableCell className="text-sm text-gray-500 min-w-[200px]">
            {order.email}
          </TableCell>
          <TableCell className="text-slate-900 font-semibold whitespace-nowrap">
            ${order.totalCost?.toFixed(2) || "0.00"}
          </TableCell>
          <TableCell className="whitespace-nowrap">
            {/* Hiển thị Status Badge */}
            {getStatusBadge(order)}

            {(order.statusOrder === 17 ||
              order.statusOrder === 18 ||
              order.statusOrder === 16) ? (
              order.reason && (
                <div className="text-xs text-gray-600 mt-1">
                  <span className="font-medium text-gray-700">
                    Reason:
                  </span>{" "}
                  {order.reason}
                </div>
              )
            ) : (
              <>
                {/* Các trạng thái khác thì hiển thị cả Reason nếu có */}
                {order.reason && (
                  <div className="text-xs text-gray-600 mt-1">
                    <span className="font-medium text-gray-700">
                      Reason:
                    </span>{" "}
                    {order.reason}
                  </div>
                )}

                {/* Và hiển thị RejectReason nếu có */}
                {order.rejectionReason && (
                  <div className="text-xs text-red-600 mt-1">
                    <span className="font-medium">
                      Rejected:
                    </span>{" "}
                    {order.rejectionReason}
                  </div>
                )}
              </>
            )}
          </TableCell>
          <TableCell className="whitespace-nowrap">
            <Badge
              className={
                order.paymentStatus === "Paid"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }
            >
              {order.paymentStatus}
            </Badge>
          </TableCell>
          <TableCell className="whitespace-nowrap">
            <div className="flex items-center gap-2">
              {/* ✅ Nút Expand luôn hiển thị */}
              <Button
                variant="outline"
                size="sm"
                className={`bg-transparent hover:bg-blue-100 border-blue-200 transition-colors ${
                  expandedOrderId === order.orderId
                    ? "bg-blue-100"
                    : ""
                }`}
                onClick={() =>
                  setExpandedOrderId(
                    expandedOrderId === order.orderId
                      ? null
                      : order.orderId
                  )
                }
                title="Expand Details"
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedOrderId === order.orderId
                      ? "rotate-180"
                      : ""
                  }`}
                />
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent hover:bg-blue-100 border-blue-200"
                    title="More actions"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2">
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        handleViewDetails(order)
                      }
                      className="justify-start"
                    >
                      <Eye className="h-4 w-4 mr-2 text-blue-600" />
                      View Details
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              {/* ✅ Nếu đơn đang yêu cầu Cancel */}
              {/* [SỬA] Đổi tên status 'Cancel' thành 'CANCELLED' cho đồng bộ */}
              {/* {(order.statusOderName === "HOLD" ) &&
                !order.isRefundPending && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent hover:bg-green-50 text-green-600 hover:text-green-700 border-green-200"
                      onClick={() =>
                        handleApproveCancel(order.orderId)
                      }
                    >
                      ✓ Approve Cancel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-transparent hover:bg-red-50 text-red-600 hover:text-red-700 border-red-200"
                      onClick={() =>
                        handleRejectCancel(order.orderId)
                      }
                    >
                      ✕ Reject Cancel
                    </Button>
                  </>
                )} */}

              {/* ✅ Nếu đơn đang yêu cầu Refund */}
              {order.isRefundPending && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent hover:bg-green-50 text-green-600 hover:text-green-700 border-green-200"
                    onClick={() =>
                      handleApproveRefund(
                        order.latestRefundId,
                        order.orderCode
                      )
                    }
                  >
                    ✓ Approve Refund
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-transparent hover:bg-red-50 text-red-600 hover:text-red-700 border-red-200"
                    onClick={() =>
                      handleRejectRefund(
                        order.latestRefundId,
                        order.orderCode
                      )
                    }
                  >
                    ✕ Reject Refund
                  </Button>
                </>
              )}
            </div>
          </TableCell>
        </TableRow>

        {expandedOrderId === order.orderId && (
          <TableRow className="bg-blue-100">
            <TableCell colSpan={9} className="p-4">
              <div className="space-y-3">
                <h4 className="font-semibold text-slate-900 text-sm">
                  Order Information:
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <span className="text-slate-600 font-medium">
                      Order Date:
                    </span>
                    <p className="text-slate-900">
                      {new Date(
                        order.orderDate
                      ).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <span className="text-slate-600 font-medium">
                      Delivery Address:
                    </span>
                    <p className="text-slate-900">
                      {order.address}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <span className="text-slate-600 font-medium">
                      Production Status:
                    </span>
                    <p className="text-slate-900">
                      {order.productionStatus}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded border border-blue-200">
                    <span className="text-slate-600 font-medium">
                      Tracking:
                    </span>
                    <p className="text-slate-900">
                      {order.tracking || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </TableCell>
          </TableRow>
        )}
      {/* ✅ [SỬA 3] Thay </> bằng React.Fragment */}
      </React.Fragment>
    ))
  )}
</TableBody>
                  </Table>
                )}
              </div>

              {!isLoading && (
<div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">Show</span>
<select
                        value={itemsPerPage}
                        onChange={(e) =>
                          handleItemsPerPageChange(e.target.value)
                        }
className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="5">5</option>
<option value="10">10</option>
                        <option value="20">20</option>
                        <option value="50">50</option>
                      </select>
<span className="text-sm text-gray-700">per page</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">
                        Showing {startIndex + 1} to{" "}
{Math.min(endIndex, totalOrders)} of {totalOrders}{" "}
                        results
                      </span>
                    </div>

<div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="disabled:opacity-50"
                      >
<ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline ml-1">Previous</span>
                      </Button>

                      <div className="flex items-center gap-1">
{Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
} else if (page <= 3) {
                              pageNum = i + 1;
} else if (page >= totalPages - 2) {
                              pageNum = totalPages - 4 + i;
} else {
                              pageNum = page - 2 + i;
}

                            return (
                              <Button
                                key={pageNum}
variant={
                                  page === pageNum ? "default" : "outline"
                                }
size="sm"
                                onClick={() => setPage(pageNum)}
                                className="w-8 h-8 p-0"
>
                                {pageNum}
                              </Button>
);
}
                        )}
                      </div>

                      <Button
                        variant="outline"
size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="disabled:opacity-50"
>
                        <span className="hidden sm:inline mr-1">Next</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

{/* Order Details Modal */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 md:p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl md:text-2xl font-semibold">
Order Details - {selectedOrderDetails.orderCode}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
onClick={() => setSelectedOrderDetails(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
{/* Left Column - Order Information */}
                <div className="space-y-6">
                  {/* Customer Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">
Customer Information
                    </h3>
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
<span className="text-gray-600">Name:</span>
                        <span className="font-medium">
                          {selectedOrderDetails.customerName}
                        </span>
</div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium break-all">
{selectedOrderDetails.email}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
<span className="text-gray-600">Phone:</span>
                        <span className="font-medium">
                          {selectedOrderDetails.phone}
                        </span>
</div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-medium text-right">
{selectedOrderDetails.address}
                        </span>
                      </div>
                    </div>
                  </div>

{/* Order Details */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">
                      Order Details
</h3>
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600">Order ID:</span>
<span className="font-medium">
                          {selectedOrderDetails.orderId}
                        </span>
                      </div>
                      <div className="flex 
flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600">Order Code:</span>
                        <span className="font-medium">
                          {selectedOrderDetails.orderCode}
</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600">Order Date:</span>
<span className="font-medium">
                          {new Date(
                            selectedOrderDetails.orderDate
                          ).toLocaleDateString("vi-VN")}
</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600">Status:</span>
<span>{getStatusBadge(selectedOrderDetails)}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600">Total Cost:</span>
<span className="font-semibold">
                          $
                          {selectedOrderDetails.totalCost?.toFixed(2) ||
"0.00"}
                        </span>
                      </div>
                    </div>
                  </div>
</div>
               {/* 👇 THÊM PHẦN NÀY: HIỂN THỊ LÝ DO HOÀN TIỀN / HỦY 👇 */}
{(selectedOrderDetails.reason || selectedOrderDetails.rejectionReason || selectedOrderDetails.refundAmount > 0) && (
  <div className={`p-4 rounded-lg mt-4 border ${
      selectedOrderDetails.rejectionReason ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
    }`}>
    <h3 className={`font-semibold text-lg mb-2 ${
        selectedOrderDetails.rejectionReason ? "text-red-800" : "text-amber-800"
      }`}>
      Request & Issue Details
    </h3>
    
    <div className="space-y-2 text-sm">
      {/* Hiển thị số tiền yêu cầu hoàn (nếu có) */}
      {selectedOrderDetails.refundAmount > 0 && (
        <div className="flex justify-between">
          <span className="font-medium text-gray-700">Requested Refund:</span>
          <span className="font-bold text-green-600">${selectedOrderDetails.refundAmount?.toFixed(2)}</span>
        </div>
      )}

      {/* Hiển thị Lý do yêu cầu (Refund/Cancel) */}
      {selectedOrderDetails.reason && (
        <div>
          <span className="block font-medium text-gray-700 mb-1">Request Reason:</span>
          <div className="bg-white p-2 rounded border border-gray-200 text-gray-800 italic">
            "{selectedOrderDetails.reason}"
          </div>
        </div>
      )}
      {selectedOrderDetails.proofUrl && (
        <div className="mt-2">
          <span className="block font-medium text-blue-700 mb-1">Evidence / Proof:</span>
          <a 
            href={selectedOrderDetails.proofUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 underline bg-blue-50 px-2 py-1 rounded border border-blue-200"
          >
            📷 View Proof Image/File
            <span className="text-xs text-gray-500 no-underline ml-1">
              (Opens in new tab)
            </span>
          </a>
        </div>
      )}

      {/* Hiển thị Lý do từ chối (nếu có) */}
      {selectedOrderDetails.rejectionReason && (
        <div className="mt-2">
          <span className="block font-medium text-red-700 mb-1">Rejection Reason (Staff):</span>
          <div className="bg-white p-2 rounded border border-red-200 text-red-600 font-medium">
            "{selectedOrderDetails.rejectionReason}"
          </div>
        </div>
      )}
      
      {/* Hiển thị trạng thái Pending Refund nếu có */}
      {selectedOrderDetails.isRefundPending && (
         <div className="mt-2 flex items-center gap-2 text-amber-600 font-bold animate-pulse">
            ⚠️ Waiting for approval
         </div>
      )}
    </div>
  </div>
)}
{/* 👆 KẾT THÚC PHẦN THÊM 👆 */}         
                {/* Right Column - Production Information */}
                <div className="space-y-6">
                  {/* Production Status */}
                  <div className="bg-green-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3">
                      Production Status
                    </h3>
                    <div className="space-y-2">
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600">
                          Production Status:
                        </span>
                        <span className="font-medium">
                        {selectedOrderDetails.productionStatus}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600">Payment Status:</span>
                        <span className="font-medium">
                          {selectedOrderDetails.paymentStatus}
                        </span>
                  </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600">Tracking:</span>
                        <span className="font-medium">
{selectedOrderDetails.tracking || "N/A"}
</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                        <span className="text-gray-600">Active TTS:</span>
<span className="font-medium">
                          {selectedOrderDetails.activeTTS ? "Yes" : "No"}
</span>
                      </div>
                    </div>
                  </div>
</div>
              </div>

              <div className="flex justify-end mt-6">
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrderDetails(null)}
>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* [ĐÃ XÓA] Reject Reason Dialog */}

      {/* Confirmation Dialog (Chỉ dành cho Start Prod, Mark Done, Assign QC) */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
<DialogTitle>{confirmAction?.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-gray-600">{confirmAction?.message}</p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            {confirmAction?.type !== "error" && (
              <Button
                onClick={handleConfirmAction}
className={
                  confirmAction?.type === "start_production"
? "bg-blue-600 hover:bg-blue-700"
                    : confirmAction?.type === "mark_done"
? "bg-green-600 hover:bg-green-700"
                    : confirmAction?.type === "assign_qc"
? "bg-purple-600 hover:bg-purple-700"
                    // [ĐÃ XÓA] Logic approve_refund
                    : "bg-gray-600 hover:bg-gray-700"
                }
              >
                {confirmAction?.type === "start_production"
? "Start Production"
                  : confirmAction?.type === "mark_done"
? "Mark as Done"
                  : confirmAction?.type === "assign_qc"
? "Assign to QC"
                  // [ĐÃ XÓA] Logic approve_refund
                  : "Confirm"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}