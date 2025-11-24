"use client";

import { useState, useEffect } from "react";
import apiClient from "../../../lib/apiClient"; 
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  Eye,
  Check,
  X,
  Download,
  Loader, 
  ChevronLeft, 
  ChevronRight,
} from "lucide-react";
// --- Layout Components ---
import QcSidebar from "@/components/layout/qc/sidebar";
import QcHeader from "@/components/layout/qc/header";
// --- Navigation ---
import { useRouter } from "next/navigation";
import Swal from "sweetalert2"; // Thêm Swal
// ✅ HÀM HELPER NÀY SẼ ĐƯỢC DÙNG TRONG JSX
const mapProductionStatusToString = (statusId) => {
  switch (statusId) {
    case 8:
      return "FINISHED";
    case 9:
      return "QC_DONE";
    case 10:
      return "QC_FAIL";
    case 11:
      return "PROD_REWORK";
    case 12:
      return "SHIPPING";
    case 13:
      return "HOLD";
    case 14:
      return "REFUND";
    default:
      return "UNKNOWN";
  }
};
// --- Helper function for badge colors (Dùng CODE từ API) ---
const getStatusBadgeVariant = (statusString) => {
  switch (statusString) {
    case "QC_FAIL":
    case "REFUND":
    case "HOLD":
      return "destructive";
    case "QC_DONE":
    case "SHIPPED": // Thêm
    case "FINISHED":
    case "SHIPPING":
      return "success";
    case "READY_PROD":
    case "CONFIRMED": // Thêm
      return "default";
    default:
      return "outline";
  }
};
// -------------------------------------------------------------

export default function CheckProduct() {
  const [currentPage, setCurrentPage] = useState("check-product");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null); // For main inspection modal
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmAction, setConfirmAction] = useState(null); // Stores the function to run on confirm
  const [confirmMessage, setConfirmMessage] = useState("");
  const router = useRouter();

  // --- Data States ---
  // [SỬA] Đổi tên state chính thành 'orders'
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- THÊM STATE CHO PHÂN TRANG, SẮP XẾP, LỌC ---
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalOrders, setTotalOrders] = useState(0);
  const [sortColumn, setSortColumn] = useState("orderDate");
  const [sortDirection, setSortDirection] = useState("desc");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [sellers, setSellers] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState("");

  // --- THÊM useEffect ĐỂ TẢI DANH SÁCH SELLERS ---
  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const response = await fetch(
          `${apiClient.defaults.baseURL}/api/auth/all-sellers`,
          {
            credentials: "include", // Cần thiết vì API có [Authorize]
          }
        );
        if (!response.ok) throw new Error("Failed to fetch sellers list");
        const data = await response.json();
        setSellers(data || []); // API trả về [ { sellerId, sellerName } ]
      } catch (err) {
        console.error("Error fetching sellers:", err);
      }
    };
    fetchSellers();
  }, []); // [] đảm bảo chỉ chạy 1 lần

  // --- [THAY THẾ] HÀM loadOrders BẰNG useEffect CHÍNH ---
  // (Hàm này sẽ gọi API GetAllOrders mới của bạn)
  const fetchOrders = async () => {
    try {
      setLoading(true);
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
        params.append("seller", selectedSeller);
      }

      // Tạo URL cuối cùng
      const apiUrl = `${apiClient.defaults.baseURL}/api/Order/GetAllOrdersForInvoice?${params.toString()}`;

      console.log("[QC v1] Fetching:", apiUrl);

      const response = await fetch(apiUrl, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(
          `HTTP Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      // ✅ API trả về { total, orders: [...] }
      // Dữ liệu 'orders' đã là DTO, không cần 'transformedData'
      setOrders(data.orders || []);
      setTotalOrders(data.total || 0);
    } catch (err) {
      setError(
        "Could not load orders. Please check the API connection and try again."
      );
      console.error("Error fetching orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
  // --- KẾT THÚC HÀM FETCH MỚI ---

  // [ĐÃ XÓA] - Logic Filtering Logic (const filteredOrders)

  // --- Handlers ---
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };
  const handleFilterChange = (value) => {
    setFilterStatus(value);
    setPage(1);
  };
  const handleSellerChange = (value) => {
    setSelectedSeller(value);
    setPage(1);
  };
  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setPage(1);
  };
  const totalPages = Math.ceil(totalOrders / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // [ĐÃ XÓA] handleManualOrderSearch (gộp vào searchTerm)

  // --- UPDATED: handleApprove with API call ---
  const handleApprove = (orderId) => {
    setConfirmMessage(
      `Are you sure you want to approve order ${
        selectedOrder?.orderCode || orderId
      } for shipping?`
    );
    setConfirmAction(() => async () => {
      console.log(`Attempting to approve order ${orderId}...`);
      try {
        setLoading(true);
        const response = await fetch(
          `${apiClient.defaults.baseURL}/api/Order/${orderId}/approve-shipping`,
          {
            method: "PUT",
            credentials: "include", // Thêm credentials
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          let errorMsg = `API Error: ${response.status} ${response.statusText}`;
          try {
            const errorData = await response.json();
            errorMsg = errorData.message || errorData.title || errorMsg;
          } catch (e) {
            /* Ignore if body is not JSON */
          }
          throw new Error(errorMsg);
        }

        console.log(`Order ${orderId} approved successfully.`);
        setShowConfirmDialog(false);
        setSelectedOrder(null);

        Swal.fire(
          "Approved!",
          `Order ${selectedOrder?.orderCode || orderId} approved for shipping!`,
          "success"
        );

        fetchOrders(); // Tải lại danh sách
      } catch (error) {
        console.error("Failed to approve order:", error);
        Swal.fire("Error", `Failed to approve order: ${error.message}`, "error");
        setShowConfirmDialog(false);
      } finally {
        setLoading(false);
      }
    });

    setShowConfirmDialog(true);
  };

  const handleReject = (orderId) => {
    const orderToReject = selectedOrder;
    if (orderToReject) {
      setShowRejectDialog(true);
    } else {
      console.error("Cannot reject: No order selected.");
    }
  };

  const handleRejectConfirm = async () => {
    if (rejectReason.trim() && selectedOrder) {
      const orderId = selectedOrder.orderId; // [SỬA] Dùng orderId
      console.log(
        `Attempting to reject order ${orderId}. Reason: ${rejectReason}...`
      );
      try {
        setLoading(true);
        // TODO: Implement API call for rejection
        /*
         const response = await fetch(`${apiClient.defaults.baseURL}/api/Order/${orderId}/reject`, {
           method: 'PUT',
           credentials: 'include',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ reason: rejectReason })
         });
         if (!response.ok) {
           throw new Error('Failed to reject order via API');
         }
         */
        console.log(`Order ${orderId} rejected successfully (simulation).`);
        setShowRejectDialog(false);
        setRejectReason("");
        setSelectedOrder(null);

        Swal.fire(
          "Rejected!",
          `Order ${selectedOrder?.orderCode || orderId} rejected.`,
          "success"
        );

        fetchOrders(); // Tải lại
      } catch (error) {
        console.error("Failed to reject order:", error);
        Swal.fire("Error", `Failed to reject order: ${error.message}`, "error");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownload = (fileUrl, fileName) => {
    if (!fileUrl || fileUrl === "#") {
      Swal.fire(
        "Error",
        `Cannot download file "${fileName}" - Invalid URL provided.`,
        "error"
      );
      return;
    }
    console.log(`Attempting to download: ${fileName} from ${fileUrl}`);
    const link = document.createElement("a");
    link.href = fileUrl;
    link.target = "_blank";
    link.download = fileName || "download";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- JSX ---
  return (
    <div className="flex h-screen bg-gray-100">
      <QcSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <QcHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h1 className="text-xl font-semibold text-gray-800">
                Check Product
              </h1>
              <p className="text-gray-600 mt-1 text-sm">
                Perform quality checks on manufactured products.
              </p>
            </div>

            {/* --- [SỬA] Search and Filter (Full) --- */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-4">
              {/* Hàng 1: Search, Seller, Status */}
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search Order Code, Customer..."
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>

                {/* Dropdown Seller */}
                <select
                  value={selectedSeller}
                  onChange={(e) => handleSellerChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full md:w-auto"
                >
                  <option value="">All Sellers</option>
                  {sellers.map((seller) => (
                    <option key={seller.sellerId} value={seller.sellerId}>
                      {seller.sellerName || `Seller (ID: ${seller.sellerId.substring(0, 6)}..)`}
                    </option>
                  ))}
                </select>

                {/* Filter Dropdown (dùng CODE) */}
                <select
                  value={filterStatus}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm w-full md:w-auto"
                >
                  <option value="all">All Status</option>
                  <option value="FINISHED">Finished (Prod. Done)</option>
                  <option value="QC_DONE">QC Done</option>
                  <option value="QC_FAIL">QC Fail</option>
                  <option value="SHIPPING">Shipping</option>
                  <option value="SHIPPED">Shipped</option>
                  <option value="REFUND">Refund</option>
                </select>
              </div>

              {/* Hàng 2: Date Range và Sorting */}
              <div className="flex flex-col md:flex-row gap-4 items-center">
                {/* From Date */}
                <div className="flex-1 w-full">
                  <Label className="text-xs font-medium text-gray-600">
                    From Date
                  </Label>
                  <Input
                    type="date"
                    value={fromDate}
                    onChange={(e) => {
                      setFromDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full"
                  />
                </div>
                {/* To Date */}
                <div className="flex-1 w-full">
                  <Label className="text-xs font-medium text-gray-600">
                    To Date
                  </Label>
                  <Input
                    type="date"
                    value={toDate}
                    onChange={(e) => {
                      setToDate(e.target.value);
                      setPage(1);
                    }}
                    className="w-full"
                    min={fromDate}
                  />
                </div>
                {/* Sort Column */}
                <div className="flex-1 w-full">
                  <Label className="text-xs font-medium text-gray-600">
                    Sort By
                  </Label>
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
                    <option value="sellerName">Seller Name</option>
                    <option value="totalCost">Total Cost</option>
                  </select>
                </div>
                {/* Sort Direction */}
                <div className="flex-1 w-full md:w-auto">
                  <Label className="text-xs font-medium text-gray-600">
                    Direction
                  </Label>
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
            {/* --- KẾT THÚC FILTER MỚI --- */}

            {/* Orders Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Code
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Products (Qty)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Seller
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading && (
                    <tr>
                      <td
                        colSpan="7" // [SỬA] Colspan
                        className="text-center px-6 py-4 text-gray-500"
                      >
                        <div className="flex justify-center items-center">
                          <Loader className="h-4 w-4 animate-spin mr-2" />
                          Loading orders...
                        </div>
                      </td>
                    </tr>
                  )}
                  {error && (
                    <tr>
                      <td
                        colSpan="7" // [SỬA] Colspan
                        className="text-center px-6 py-4 text-red-600"
                      >
                        {error}
                      </td>
                    </tr>
                  )}
                  {!loading && !error && orders.length === 0 && (
                    <tr>
                      <td
                        colSpan="7" // [SỬA] Colspan
                        className="text-center px-6 py-4 text-gray-500"
                      >
                        No orders found matching your criteria.
                      </td>
                    </tr>
                  )}
                  {!loading &&
                    !error &&
                    // [SỬA] Dùng 'orders' thay vì 'filteredOrders'
                    orders.map((order) => (
                      <tr
                        key={order.orderId} // [SỬA] Dùng key là orderId
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.orderCode}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {order.customerName}
                        </td>
                        <td
                          className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate"
                          title={order.details
                            ?.map((p) => `${p.productName} (x${p.quantity})`)
                            .join(", ")}
                        >
                          {/* [SỬA] Hiển thị DTO 'details' */}
                          {order.details
                            ?.map((p) => `${p.productName} (x${p.quantity})`)
                            .join(", ") || "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {order.sellerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(order.orderDate).toLocaleDateString(
                            "vi-VN"
                          )}
                        </td>
                        {/* [SỬA] Thêm cột Status */}
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Badge
                            variant={getStatusBadgeVariant(order.statusOderName)}
                          >
                            {order.statusOderName}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)} // Dùng DTO
                          >
                            <Eye className="h-4 w-4 mr-1" /> Inspect
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* --- THÊM: Pagination Controls --- */}
            {!loading && totalOrders > 0 && (
              <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-lg shadow-sm">
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
                      {Math.min(endIndex, totalOrders)} of {totalOrders} results
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
                    </Button>
                    <span className="text-sm text-gray-700">
                      Page {page} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="disabled:opacity-50"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {/* --- KẾT THÚC PAGINATION --- */}
          </div>
        </main>
      </div>

      {/* Product Inspection Modal (Đã cập nhật) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 transition-opacity duration-300">
          {/* [SỬA LỖI] Xóa class 'opacity-0' và 'animate-fade-in-scale' để modal hiển thị */}
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] transform transition-all duration-300 flex flex-col">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center z-10 flex-shrink-0">
              <h2 className="text-lg font-semibold text-gray-800">
                Product Inspection - Order {selectedOrder.orderCode}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedOrder(null)}
                className="rounded-full text-gray-500 hover:bg-gray-100 -mr-2"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="p-6 space-y-6 overflow-y-auto">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-base mb-3 text-gray-700">
                  Customer Information
                </h3>
                {/* [SỬA] Dùng DTO trực tiếp */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <Label className="text-xs text-gray-500">Name</Label>
                    <p className="font-medium text-gray-800">
                      {selectedOrder.customerName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Phone</Label>
                    <p className="font-medium text-gray-800">
                      {selectedOrder.phone || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500">Email</Label>
                    <p className="font-medium text-gray-800 truncate">
                      {selectedOrder.email || "N/A"}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-xs text-gray-500">Address</Label>
                    <p className="font-medium text-gray-800">
                      {`${selectedOrder.address || ""}${
                        selectedOrder.shipCity
                          ? `, ${selectedOrder.shipCity}`
                          : ""
                      }${
                        selectedOrder.shipState
                          ? `, ${selectedOrder.shipState}`
                          : ""
                      }${
                        selectedOrder.zipcode
                          ? ` ${selectedOrder.zipcode}`
                          : ""
                      }${
                        selectedOrder.shipCountry
                          ? `, ${selectedOrder.shipCountry}`
                          : ""
                      }` || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-base mb-3 text-blue-800">
                  Order & Product Details
                </h3>
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2">
                  {/* [SỬA] Dùng DTO 'details' */}
                  {selectedOrder.details?.map((product) => (
                    <div
                      key={product.orderDetailID} // Dùng ID thật
                      className="bg-white p-3 rounded border border-gray-200 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <p
                          className="font-medium text-sm text-gray-800 flex-1 mr-2 truncate"
                          title={product.productName}
                        >
                          {product.productName || "Unnamed Product"}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-7 px-2 flex-shrink-0"
                          onClick={() => {
                            if (product.orderDetailID) {
                              router.push(
                                `/qc/order-detail/${product.orderDetailID}`
                              );
                            } else {
                              console.error("Order Detail ID missing");
                              alert("Cannot navigate: ID missing.");
                            }
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" /> Detail
                        </Button>
                      </div>
                      <div className="grid grid-cols-4 gap-x-2 text-xs">
                        <div>
                          <Label className="text-gray-500">Qty:</Label>
                          <p className="font-medium text-gray-700">
                            {product.quantity ?? "?"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Size:</Label>
                          <p className="font-medium text-gray-700">
                            {product.size || "-"}
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-500">Accessory:</Label>
                          <p className="font-medium text-gray-700">
                            {product.accessory || "-"}
                          </p>
                        </div>
                       <div>
                          {/* --- ✅ [SỬA LỖI] GỌI HELPER TẠI ĐÂY --- */}
                          <Label className="text-gray-500">Status:</Label>
                          <Badge
                            variant={getStatusBadgeVariant(
                              mapProductionStatusToString(product.status) // Chuyển đổi số (6) sang chuỗi ("READY_PROD")
                            )}
                            className="text-xs px-1.5 py-0.5"
                          >
                            {mapProductionStatusToString(product.status)}
                          </Badge>
                          {/* -------------------------------------- */}
                        </div>
                      </div>
                      {/* Hiển thị Note của từng sản phẩm */}
                      {product.note && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                           <Label className="text-xs text-gray-500">Note:</Label>
                           <p className="text-sm text-gray-700">{product.note}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-3 border-t border-blue-100">
                  <div>
                    <Label className="text-xs text-gray-500">
                      Seller Assigned
                    </Label>
                    <p className="font-medium text-gray-800">
                      {selectedOrder.sellerName || "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">Order Date</Label>
                    <p className="font-medium text-gray-800">
                      {new Date(selectedOrder.orderDate).toLocaleDateString(
                        "vi-VN"
                      ) || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* End Modal Body */}

            {/* Footer / Actions Row */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg flex-shrink-0">
              {(() => {
                const isAlreadyApprovedOrBeyond =
                  selectedOrder.statusOrder >= 13; // 13 = Shipping

                if (isAlreadyApprovedOrBeyond) {
                  return (
                    <Button
                      className="bg-gray-400 text-white px-5 cursor-not-allowed"
                      disabled={true}
                      title="This order has already been approved or shipped."
                    >
                      <Check className="h-4 w-4 mr-1" /> Already Approved
                    </Button>
                  );
                } else {
                  // Check if all products are QC_DONE
                  const canApprove =
                    selectedOrder.details?.length > 0 &&
                    selectedOrder.details.every(
                      (p) => mapProductionStatusToString(p.status) === "QC_DONE"
                    );
                  return (
                    <>
                      {/* <Button variant="outline" ...> Reject Product </Button> */}
                      <Button
                        onClick={() => handleApprove(selectedOrder.orderId)}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!canApprove || loading} // Also disable while loading
                        title={
                          !canApprove
                            ? "All products must have status QC_DONE to approve"
                            : "Approve order for shipping"
                        }
                      >
                        <Check className="h-4 w-4 mr-1" /> Approve for Shipping
                      </Button>
                    </>
                  );
                }
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Dialog (Giữ nguyên) */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60] transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Reject Product
            </h3>
            <div className="space-y-4">
              <div>
                <Label
                  htmlFor="reject-reason"
                  className="text-sm font-medium text-gray-700"
                >
                  Reason for rejection <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Please provide a detailed reason..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                  className="mt-1 w-full"
                />
                {!rejectReason.trim() && (
                  <p className="text-xs text-red-500 mt-1">
                    Reason cannot be empty.
                  </p>
                )}
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectReason("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectConfirm}
                className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                disabled={!rejectReason.trim() || loading}
              >
                Confirm Rejection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* General Confirmation Dialog (Giữ nguyên) */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[60] transition-opacity duration-300">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Confirm Action
            </h3>
            <p className="text-gray-600 mb-6 text-sm">{confirmMessage}</p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (confirmAction) confirmAction();
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={loading}
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* [ĐÃ XÓA] - Product Detail Modal (viewingProduct) */}
    </div>
  );
}