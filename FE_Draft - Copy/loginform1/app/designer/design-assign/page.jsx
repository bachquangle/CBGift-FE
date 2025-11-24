"use client";

import { useState, useEffect } from "react";
import apiClient from "../../../lib/apiClient";
// Import các components UI
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Eye,
  Upload,
  Check,
  Search,
  Send,
  ImageIcon,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import DesignerHeader from "@/components/layout/designer/header";
import DesignerSidebar from "@/components/layout/designer/sidebar";
import { useSignalR } from "@/contexts/SignalRContext";
import { toast } from "@/components/ui/use-toast";

// CẬP NHẬT CONSTANTS DỰ TRÊN ENUM ProductionStatus MỚI
const DESIGN_STATUSES = {
  NEED_DESIGN: { name: "NEED DESIGN", color: "bg-red-500", code: 2 },
  DESIGNING: { name: "DESIGNING", color: "bg-yellow-500", code: 3 },
  CHECK_DESIGN: { name: "CHECK DESIGN", color: "bg-blue-500", code: 4 },
  DESIGN_REDO: { name: "DESIGN REDO", color: "bg-purple-500", code: 5 },
};

export default function DesignAssignPage() {
  const [currentPage, setCurrentPage] = useState("design-assign");
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // UPLOAD/IMAGE STATES
  const [designFile, setDesignFile] = useState(null);
  const [designNotes, setDesignNotes] = useState("");
  const [uploadedImages, setUploadedImages] = useState([]); // Kho ảnh đã upload
  const [selectedImageUrl, setSelectedImageUrl] = useState(""); // URL ảnh được chọn từ kho ảnh
  const [showImageModal, setShowImageModal] = useState(false); // Modal kho ảnh

  // General States
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState("all-months");
  const [selectedYear, setSelectedYear] = useState("all-years");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [assignedOrders, setAssignedOrders] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [taskLogs, setTaskLogs] = useState([]);
  // --- SIGNALR: nhận assignment mới từ server ---
  const connection = useSignalR();

  useEffect(() => {
    const handleNewTask = (event) => {
      const { orderId, message } = event.detail || {};
      if (!orderId) return;

      console.log("📥 New task assigned:", event.detail);

      toast({
        title: "🎨 New Design Task",
        description: message,
        className: "bg-green-50 text-green-700 border border-green-200",
      });

      fetchTasks(); // 🔁 Reload danh sách
    };

    window.addEventListener("taskAssigned", handleNewTask);
    return () => window.removeEventListener("taskAssigned", handleNewTask);
  }, []);

  useEffect(() => {
    if (!connection) return;
    const designerId = localStorage.getItem("userId");
    if (!designerId) return;

    const joinGroup = async () => {
      if (connection.state !== "Connected") {
        console.warn("⏳ Waiting for connection...");
        try {
          await connection.start();
        } catch (err) {
          console.error("⚠️ Failed to start connection:", err);
          return;
        }
      }

      try {
        await connection.invoke("JoinGroup", `user_${designerId}`);
        console.log("👥 Joined group:", `user_${designerId}`);
      } catch (err) {
        console.error("❌ JoinGroup failed:", err);
      }
    };

    joinGroup();
  }, [connection]);

  // Hàm lấy giá trị Code (Int) từ tên Status (String)
  const getStatusCode = (statusKey) => DESIGN_STATUSES[statusKey]?.code;
  // --- HÀM GỌI API LẤY KHO ẢNH (ĐÃ CẬP NHẬT URL API VÀ XỬ LÝ LỖI) ---
  const fetchMyImages = async () => {
    try {
      // SỬA URL API THÀNH '/api/images/my-images'
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/images/my-images`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        // Xử lý lỗi xác thực (401/403)
        if (res.status === 401 || res.status === 403) {
          console.error(
            "Authentication failed. User not logged in or unauthorized."
          );
          alert("Lỗi: Vui lòng đăng nhập lại để truy cập kho ảnh.");
          return;
        }
        const errorText = res.statusText || `Status ${res.status}`;
        console.error("Failed to fetch my images:", errorText);
        return;
      }

      const data = await res.json();
      setUploadedImages(data);
    } catch (error) {
      console.error("Error fetching images:", error);
      // Trong trường hợp lỗi mạng hoặc lỗi khác, chúng ta chỉ cần log
    }
  };

  // --- HÀM GỌI API CẬP NHẬT TRẠNG THÁI ---
  const updateDesignStatusApi = async (orderDetailId, newStatusKey) => {
    const newStatusCode = getStatusCode(newStatusKey);
    if (!newStatusCode && newStatusCode !== 0) {
      console.error("Invalid status key:", newStatusKey);
      alert(`Lỗi: Trạng thái ${newStatusKey} không hợp lệ.`);
      return false;
    }

    const url = `${apiClient.defaults.baseURL}/api/designer/tasks/status/${orderDetailId}`;

    try {
      const response = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productionStatus: newStatusCode }),
        credentials: "include",
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");

        if (!contentType || !contentType.includes("application/json")) {
          const errorText = await response.text();
          throw new Error(
            `Server returned status ${
              response.status
            }. Response: ${errorText.substring(0, 50)}...`
          );
        }

        const errorData = await response.json();
        throw new Error(
          errorData.message || `Failed to update status: ${response.status}`
        );
      }
      return true;
    } catch (error) {
      console.error("API Error during status update:", error);
      alert(`Lỗi khi cập nhật trạng thái: ${error.message}`);
      return false;
    }
  };

  // Hàm cập nhật trạng thái trên frontend (chỉ khi API thành công)
  const handleUpdateStatusLocal = (orderId, newStatusKey) => {
    setAssignedOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId
          ? { ...order, ProductionStatus: newStatusKey }
          : order
      )
    );
  };

  const handleUpdateOrderStatusLocal = (orderId, newStatusKey) => {
    setAssignedOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.id === orderId ? { ...order, orderStatus: newStatusKey } : order
      )
    );
  };

  // Hàm chấp nhận thiết kế (NEED_DESIGN -> DESIGNING)
  const handleAcceptDesign = async (orderId) => {
    const success = await updateDesignStatusApi(orderId, "DESIGNING");
    if (success) {
      handleUpdateStatusLocal(orderId, "DESIGNING");
    }
  };

  // --- HÀM UPLOAD FILE HOẶC URL ĐÃ CHỌN ---
  // --- HÀM UPLOAD FILE HOẶC URL ĐÃ CHỌN (ĐÃ ĐƯỢC DỌN DẸP) ---
  const handleUploadDesign = async () => {
    // 1. Kiểm tra điều kiện đầu vào: Phải chọn file mới HOẶC file cũ
    if (!designFile && !selectedImageUrl) {
      alert("Vui lòng chọn file mới hoặc file từ kho ảnh.");
      return;
    }

    // LƯU Ý: ĐÃ XÓA LOGIC KIỂM TRA KÍCH THƯỚC/ĐỊNH DẠNG Ở ĐÂY
    // VÌ NÓ ĐÃ ĐƯỢC THỰC HIỆN TRONG HÀM handleDesignFileChange

    const orderDetailId = selectedOrder.id;
    const url = `${apiClient.defaults.baseURL}/api/designer/tasks/${orderDetailId}/upload`;

    setLoading(true); // Bật loading

    try {
      const formData = new FormData();
      // Đảm bảo Note luôn là chuỗi (chuỗi rỗng nếu không nhập) để tránh lỗi Model Binding 400
      const noteToSend = designNotes || "";

      // 1. CHỌN NGUỒN FILE: Chỉ gửi một trong hai trường (DesignFile HOẶC FileUrl)
      if (designFile) {
        // Trường hợp 1: File mới (Đã được kiểm tra hợp lệ)
        formData.append("DesignFile", designFile);
      } else if (selectedImageUrl) {
        // Trường hợp 2: File cũ
        formData.append("FileUrl", selectedImageUrl);
      }

      // 2. GỬI NOTE
      formData.append("Note", noteToSend);

      // --- 3. THỰC HIỆN UPLOAD/SUBMIT ---
      const response = await fetch(url, {
        method: "POST",
        body: formData, // Tự động set Content-Type: multipart/form-data
        credentials: "include",
      });

      // Khởi tạo biến để đọc response body
      let errorDetails = response.statusText || `Status ${response.status}`;
      let errorData = null;
      const contentType = response.headers.get("content-type");

      // Cố gắng đọc JSON (Problem Details) trước khi kiểm tra lỗi
      if (contentType && contentType.includes("application/json")) {
        errorData = await response.json();
      }

      if (!response.ok) {
        // XỬ LÝ VÀ PHÂN TÍCH LỖI SERVER
        if (errorData && errorData.errors) {
          // Lỗi Model Binding (400 Bad Request)
          const modelErrors = Object.values(errorData.errors).flat().join("; ");
          errorDetails = errorData.title || "Model Binding Error";
          errorDetails += ` [Chi tiết: ${modelErrors}]`;
        } else if (errorData) {
          // Lỗi Server/Nghiệp vụ (403/500) có trả về message
          errorDetails = errorData.message || errorDetails;
        } else {
          // Lỗi không phải JSON (rất hiếm, ví dụ: Timeout)
          errorDetails = await response.text();
        }

        // Ném lỗi để hiển thị Alert
        throw new Error(errorDetails);
      }

      // --- 4. THÀNH CÔNG: Cập nhật trạng thái thành CHECK_DESIGN ---
      handleUpdateStatusLocal(orderDetailId, "CHECK_DESIGN");

      // Reset state và đóng dialog
      setDesignFile(null);
      setDesignNotes("");
      setSelectedImageUrl("");
      setSelectedOrder(null);
      alert("Upload file thiết kế thành công và đã gửi đi kiểm duyệt!");

      return true;
    } catch (error) {
      console.error("Lỗi khi upload file thiết kế:", error);
      alert(`Lỗi khi upload file thiết kế: ${error.message}`);
      return false;
    } finally {
      setLoading(false); // Tắt loading
    }
  };
  // định dạng size.
  const handleDesignFileChange = (event) => {
    const file = event.target.files[0];

    // Đảm bảo xóa file cũ (nếu có) nếu người dùng không chọn gì hoặc chọn file lỗi
    setDesignFile(null);

    if (!file) {
      // Nếu không chọn file, vẫn đảm bảo selectedImageUrl bị xóa
      setSelectedImageUrl("");
      return;
    }

    // 1. ✅ KIỂM TRA ĐỊNH DẠNG (JPG, JPEG, PNG)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      alert("❌ Định dạng file không hợp lệ. Chỉ chấp nhận JPG, JPEG, và PNG.");
      // Rất quan trọng: Xóa giá trị input để người dùng có thể chọn lại
      event.target.value = "";
      setSelectedImageUrl(""); // Reset file cũ
      return;
    }

    // 2. ✅ KIỂM TRA DUNG LƯỢNG (Tối đa 5MB)
    const maxSizeMB = 5;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert(`⚠️ File quá lớn. Dung lượng tối đa cho phép là ${maxSizeMB} MB.`);
      // Rất quan trọng: Xóa giá trị input để người dùng có thể chọn lại
      event.target.value = "";
      setSelectedImageUrl(""); // Reset file cũ
      return;
    }

    // Nếu hợp lệ: Cập nhật state designFile và xóa selectedImageUrl
    setDesignFile(file);
    setSelectedImageUrl("");
  };

  // Hàm Bắt đầu Redo (DESIGN_REDO -> DESIGNING)
  const handleStartRedo = async (orderId) => {
    const success = await updateDesignStatusApi(orderId, "DESIGNING");
    if (success) {
      handleUpdateStatusLocal(orderId, "DESIGNING");
    }
  };

  const handleSendToSellerCheck = async (orderId) => {
    const success = await updateDesignStatusApi(orderId, "CHECK_DESIGN");
    if (success) {
      handleUpdateOrderStatusLocal(orderId, "CHECK_DESIGN");
      alert(
        "Đã gửi thiết kế đi kiểm duyệt. Đơn hàng sẽ được cập nhật trạng thái."
      );
      fetchTasks();
    }
    //window.location.reload();
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setPage(1);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/designer/tasks`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error(`HTTP error! ${res.status}`);

      const apiData = await res.json();
      const mapped = (apiData || []).map((item) => ({
        ...item,
        id: item.orderDetailId.toString(),
        orderStatus: item.orderStatus,
        ProductionStatus: item.productionStatus || "NEED_DESIGN",
        customerName: `Customer for ${item.orderCode}`,
      }));
      setAssignedOrders(mapped);
    } catch (err) {
      console.error("❌ Failed to fetch tasks:", err);
      setAssignedOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const getAvailableMonthsYears = () => {
    const monthYearSet = new Set();
    assignedOrders.forEach((order) => {
      const date = new Date(order.assignedAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      monthYearSet.add(`${year}-${month}`);
    });
    return Array.from(monthYearSet).sort().reverse();
  };
  // --- HÀM ĐỂ LẤY CHI TIẾT TASK VÀ LOGS ---
  const fetchTaskDetail = async (orderDetailId) => {
    if (!orderDetailId) return;
    setDetailLoading(true);
    setTaskLogs([]); // Xóa log cũ
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/designer/tasks/${orderDetailId}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error(`Failed to fetch details: ${res.status}`);
      }

      const data = await res.json();
      const updatedTaskInfo = {
        ...data.taskInfo,
        id: data.taskInfo.orderDetailId.toString(),
        ProductionStatus: data.taskInfo.productionStatus || "NEED_DESIGN",
      };
      // CẬP NHẬT 2 STATE:
      // 1. Cập nhật selectedOrder với dữ liệu MỚI NHẤT từ API
      setSelectedOrder(updatedTaskInfo);
      // 2. Lưu trữ danh sách logs
      setTaskLogs(data.logs || []);
    } catch (error) {
      console.error("Error fetching task detail:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải chi tiết công việc hoặc lịch sử.",
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };
  const availableMonthsYears = getAvailableMonthsYears();

  // --- LOGIC FILTER/COUNT/DISPLAY ---
  const filteredOrders = assignedOrders.filter((order) => {
    const matchesSearch =
      order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productName.toLowerCase().includes(searchTerm.toLowerCase());

    const orderStatusKey = order.ProductionStatus || "NEED_DESIGN";
    const matchesStatus =
      statusFilter === "all" || orderStatusKey === statusFilter;

    let matchesDate = true;
    if (selectedMonth !== "all-months" && selectedYear !== "all-years") {
      const date = new Date(order.assignedAt);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      matchesDate = `${year}-${month}` === `${selectedYear}-${selectedMonth}`;
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex);

  const getFilterCounts = () => {
    const counts = { all: 0 };
    Object.keys(DESIGN_STATUSES).forEach((key) => {
      counts[key] = 0;
    });

    // Count only orders that match current date filters
    const dateFilteredOrders = assignedOrders.filter((order) => {
      if (selectedMonth !== "all-months" && selectedYear !== "all-years") {
        const date = new Date(order.assignedAt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        return `${year}-${month}` === `${selectedYear}-${selectedMonth}`;
      }
      return true;
    });

    counts.all = dateFilteredOrders.length;
    dateFilteredOrders.forEach((order) => {
      const statusKey = order.ProductionStatus || "NEED_DESIGN";
      if (counts.hasOwnProperty(statusKey)) {
        counts[statusKey] += 1;
      }
    });
    return counts;
  };
  const filterCounts = getFilterCounts();

  const handleSelectAll = (checked) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedOrderDetails(
        new Set(paginatedOrders.map((order) => order.id))
      );
    } else {
      setSelectedOrderDetails(new Set());
    }
  };

  const handleSelectOrder = (orderId, checked) => {
    const newSelected = new Set(selectedOrderDetails);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    setSelectedOrderDetails(newSelected);
    setSelectAll(
      newSelected.size === paginatedOrders.length && paginatedOrders.length > 0
    );
  };

  const getOrderStatus = (order) => {
    const statusKey = order.ProductionStatus || "NEED_DESIGN";
    const statusInfo = DESIGN_STATUSES[statusKey] || {
      name: "DONE",
      color: "bg-green-500",
    };
    return (
      <Badge variant="default" className={statusInfo.color}>
        {statusInfo.name}
      </Badge>
    );
  };

  let previousOrderCode = null;

  return (
    <div className="flex h-screen bg-blue-50">
      <DesignerSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DesignerHeader />

        <header className="bg-white shadow-sm border-b border-blue-200 px-6 py-4">
          <h1 className="text-2xl font-semibold text-slate-900">
            Design Assigned
          </h1>
          <p className="text-slate-600 mt-1">
            Orders assigned to you for design work
          </p>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center text-slate-500 mb-6">
              Loading stats...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {/* Need Design */}
              <div
                className={`bg-white p-6 rounded-lg shadow cursor-pointer hover:ring-2 hover:ring-red-300 transition-all ${
                  statusFilter === "NEED_DESIGN"
                    ? "ring-2 ring-offset-2 ring-red-500"
                    : ""
                }`}
                onClick={() => setStatusFilter("NEED_DESIGN")}
              >
                <h3 className="text-sm font-medium text-slate-500">
                  Need Design
                </h3>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {filterCounts["NEED_DESIGN"] || 0}
                </p>
              </div>

              {/* Designing */}
              <div
                className={`bg-white p-6 rounded-lg shadow cursor-pointer hover:ring-2 hover:ring-yellow-300 transition-all ${
                  statusFilter === "DESIGNING"
                    ? "ring-2 ring-offset-2 ring-yellow-500"
                    : ""
                }`}
                onClick={() => setStatusFilter("DESIGNING")}
              >
                <h3 className="text-sm font-medium text-slate-500">
                  Designing
                </h3>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {filterCounts["DESIGNING"] || 0}
                </p>
              </div>

              {/* Need Check Design */}
              <div
                className={`bg-white p-6 rounded-lg shadow cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all ${
                  statusFilter === "CHECK_DESIGN"
                    ? "ring-2 ring-offset-2 ring-blue-500"
                    : ""
                }`}
                onClick={() => setStatusFilter("CHECK_DESIGN")}
              >
                <h3 className="text-sm font-medium text-slate-500">
                  Need Check Design
                </h3>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {filterCounts["CHECK_DESIGN"] || 0}
                </p>
              </div>

              {/* Design Error */}
              <div
                className={`bg-white p-6 rounded-lg shadow cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all ${
                  statusFilter === "DESIGN_REDO"
                    ? "ring-2 ring-offset-2 ring-purple-500"
                    : ""
                }`}
                onClick={() => setStatusFilter("DESIGN_REDO")}
              >
                <h3 className="text-sm font-medium text-slate-500">
                  Design Error
                </h3>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {filterCounts["DESIGN_REDO"] || 0}
                </p>
              </div>

              {/* Total */}
              <div
                className={`bg-white p-6 rounded-lg shadow cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all ${
                  statusFilter === "all"
                    ? "ring-2 ring-offset-2 ring-blue-500"
                    : ""
                }`}
                onClick={() => setStatusFilter("all")}
              >
                <h3 className="text-sm font-medium text-slate-500">
                  Total Orders
                </h3>
                <p className="text-2xl font-bold text-slate-900 mt-2">
                  {filterCounts.all || 0}
                </p>
              </div>
            </div>
          )}

          {/* Search and Filter Section */}
          <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-100 shadow-sm mb-6">
            <div className="flex flex-col gap-4">
              {/* Search bar */}
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      placeholder="Search by Order ID, Product Name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white border-blue-100 focus:border-blue-300"
                    />
                  </div>
                </div>
              </div>

              {/* Month/year filter selects */}
              <div className="flex gap-4 items-center">
                <div className="flex-1">
                  <Label className="text-sm font-medium text-slate-700 mb-2 block">
                    Filter by Month/Year
                  </Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedMonth}
                      onValueChange={setSelectedMonth}
                    >
                      <SelectTrigger className="w-32 bg-white border-blue-100 focus:border-blue-300">
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-months">All Months</SelectItem>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = String(i + 1).padStart(2, "0");
                          const monthName = new Date(2024, i).toLocaleString(
                            "en-US",
                            { month: "long" }
                          );
                          return (
                            <SelectItem key={month} value={month}>
                              {monthName}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    <Select
                      value={selectedYear}
                      onValueChange={setSelectedYear}
                    >
                      <SelectTrigger className="w-32 bg-white border-blue-100 focus:border-blue-300">
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-years">All Years</SelectItem>
                        {availableMonthsYears.map((monthYear, idx) => {
                          const year = monthYear.split("-")[0];
                          return (
                            <SelectItem key={`${year}-${idx}`} value={year}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>

                    {(selectedMonth !== "all-months" ||
                      selectedYear !== "all-years") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMonth("all-months");
                          setSelectedYear("all-years");
                        }}
                        className="border-blue-100 hover:bg-blue-50 bg-transparent"
                      >
                        Clear Filter
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {selectedOrderDetails.size > 0 && (
            <div className="bg-blue-50 p-4 rounded-lg shadow mb-6 border border-blue-200">
              <div className="flex items-center justify-between">
                <span className="text-blue-800 font-medium">
                  {selectedOrderDetails.size} order detail
                  {selectedOrderDetails.size > 1 ? "s" : ""} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      /* Bulk accept logic */
                    }}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                    disabled={true}
                  >
                    <Check className="h-4 w-4 mr-1" /> Accept Selected (
                    {selectedOrderDetails.size})
                  </Button>
                  <Button
                    onClick={() => {
                      /* Bulk send to QA logic */
                    }}
                    className="bg-blue-600 hover:bg-blue-700"
                    size="sm"
                    disabled={true}
                  >
                    <Send className="h-4 w-4 mr-1" /> Send to QA (0)
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-100">
            {loading && (
              <div className="p-4 text-center text-slate-500 bg-white rounded-lg">
                Loading.......
              </div>
            )}
            {!loading && filteredOrders.length === 0 && (
              <div className="p-4 text-center text-slate-500 bg-white rounded-lg">
                Không tìm thấy công việc thiết kế nào được giao.
              </div>
            )}
            {!loading && filteredOrders.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow className="bg-blue-100 hover:bg-blue-100">
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectAll}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                      Detail ID
                    </TableHead>
                    <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                      Order Code
                    </TableHead>
                    <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                      Product Name
                    </TableHead>
                    <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                      Product Description
                    </TableHead>
                    <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                      Quantity
                    </TableHead>
                    <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                      Size (L x H x W)
                    </TableHead>
                    <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                      Assigned At
                    </TableHead>
                    <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                      Status
                    </TableHead>
                    <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(previousOrderCode = null)}
                  {paginatedOrders.map((order) => {
                    const isDuplicateOrderCode =
                      order.orderCode === previousOrderCode;
                    previousOrderCode = order.orderCode;
                    const currentStatus =
                      order.ProductionStatus || "NEED_DESIGN";

                    return (
                      <TableRow
                        key={order.id}
                        className="hover:bg-blue-50 transition-colors"
                      >
                        <TableCell>
                          <Checkbox
                            checked={selectedOrderDetails.has(order.id)}
                            onCheckedChange={(checked) =>
                              handleSelectOrder(order.id, checked)
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium text-slate-900 whitespace-nowrap">
                          {order.orderDetailId}
                        </TableCell>

                        {/* ORDER CODE CELL (Đã sửa để ẩn khi trùng) */}
                        <TableCell className="font-medium text-slate-900 whitespace-nowrap">
                          {order.orderCode}
                        </TableCell>

                        <TableCell className="text-slate-900">
                          {order.productName}
                        </TableCell>
                        <TableCell className="text-slate-900">
                          {order.productDescribe || "N/A"}
                        </TableCell>
                        <TableCell className="text-slate-900">
                          {order.quantity}
                        </TableCell>
                        <TableCell className="text-slate-900">
                          {order.productDetails?.lengthCm}x
                          {order.productDetails?.heightCm}x
                          {order.productDetails?.widthCm}cm
                        </TableCell>
                        <TableCell className="text-slate-900">
                          {new Date(order.assignedAt).toLocaleString()}
                        </TableCell>
                        <TableCell>{getOrderStatus(order)}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog
                              onOpenChange={(open) => {
                                // Logic reset state khi mở/đóng Dialog [cite: 179]
                                if (open) {
                                  // 1. Set state stale (từ bảng) để dialog mở ngay lập tức
                                  setSelectedOrder(order);
                                  setDesignFile(null);
                                  setDesignNotes("");
                                  setSelectedImageUrl("");

                                  // --- GỌI API MỚI ---
                                  fetchTaskDetail(order.id); // order.id chính là orderDetailId [cite: 88]
                                } else {
                                  setSelectedOrder(null);
                                  setTaskLogs([]); // Xóa logs khi đóng
                                }
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4 mr-1" />
                                </Button>
                              </DialogTrigger>

                              {/* DIALOG CONTENT */}
                              {selectedOrder &&
                                selectedOrder.id === order.id && (
                                  <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Order Details -{" "}
                                        {selectedOrder.orderDetailId} (
                                        {selectedOrder.orderCode})
                                      </DialogTitle>
                                    </DialogHeader>
                                    {selectedOrder && (
                                      <div className="space-y-6">
                                        {/* Order Information Section */}
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                          <h3 className="font-semibold text-lg mb-3 text-gray-900">
                                            Order Information
                                          </h3>
                                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div>
                                              <Label className="text-sm text-gray-500 font-medium">
                                                Order Code
                                              </Label>
                                              <p className="font-medium text-gray-900 mt-1">
                                                {selectedOrder.orderCode}
                                              </p>
                                            </div>
                                            <div>
                                              <Label className="text-sm text-gray-500 font-medium">
                                                Order Detail ID
                                              </Label>
                                              <p className="font-medium text-gray-900 mt-1">
                                                {selectedOrder.orderDetailId}
                                              </p>
                                            </div>
                                            <div>
                                              <Label className="text-sm text-gray-500 font-medium">
                                                Assigned At
                                              </Label>
                                              <p className="font-medium text-gray-900 mt-1">
                                                {new Date(
                                                  selectedOrder.assignedAt
                                                ).toLocaleString()}
                                              </p>
                                            </div>
                                            <div>
                                              <Label className="text-sm text-gray-500 font-medium">
                                                Current Status
                                              </Label>
                                              <div className="mt-1">
                                                {getOrderStatus(selectedOrder)}
                                              </div>
                                            </div>
                                            <div className="lg:col-span-2">
                                              <Label className="text-sm text-gray-500 font-medium">
                                                Notes
                                              </Label>
                                              <p className="font-medium text-gray-900 mt-1">
                                                {selectedOrder.note ||
                                                  "No notes"}
                                              </p>
                                            </div>
                                          </div>
                                        </div>
                                        {/* --- PHẦN MỚI THÊM: LOADING VÀ LỊCH SỬ REJECT --- */}

                                        {/* 1. HIỂN THỊ LOADING */}
                                        {detailLoading && (
                                          <div className="text-center p-6 bg-gray-50 rounded-lg">
                                            <p className="text-gray-600">
                                              Loading details and history...
                                            </p>
                                          </div>
                                        )}

                                        {/* 2. HIỂN THỊ LỊCH SỬ LOGS (ĐÃ CẬP NHẬT) */}
                                        {!detailLoading &&
                                          taskLogs.length > 0 && (
                                            <div className="space-y-4">
                                              <h3 className="font-semibold text-lg text-gray-900">
                                                Design Review History
                                              </h3>
                                              <ul className="space-y-3">
                                                {taskLogs.map((log) => {
                                                  const isRejection =
                                                    log.eventType ===
                                                      "DESIGN_REJECTED" ||
                                                    log.eventType === "QC_FAIL";
                                                  const isApproval =
                                                    log.eventType ===
                                                    "DESIGN_APPROVED";

                                                  // Xác định style dựa trên loại log
                                                  let containerClass =
                                                    "bg-gray-50 border-gray-200 p-4 rounded-lg border";
                                                  let titleClass =
                                                    "font-medium text-gray-700";
                                                  let title = log.eventType; // Tiêu đề mặc định

                                                  if (isRejection) {
                                                    containerClass =
                                                      "bg-red-50 border-red-200 p-4 rounded-lg border";
                                                    titleClass =
                                                      "font-medium text-red-700";
                                                    title =
                                                      log.eventType ===
                                                      "DESIGN_REJECTED"
                                                        ? "Design Rejected"
                                                        : "QC Báo lỗi";
                                                  } else if (isApproval) {
                                                    containerClass =
                                                      "bg-green-50 border-green-200 p-4 rounded-lg border";
                                                    titleClass =
                                                      "font-medium text-green-700";
                                                    title = "Approved Design";
                                                  }

                                                  return (
                                                    <li
                                                      key={log.orderDetailLogId}
                                                      className={containerClass}
                                                    >
                                                      <div className="flex justify-between items-center mb-1">
                                                        <span
                                                          className={titleClass}
                                                        >
                                                          {title}
                                                        </span>
                                                        <span className="text-xs text-gray-600">
                                                          {new Date(
                                                            log.createdAt
                                                          ).toLocaleString()}
                                                        </span>
                                                      </div>
                                                      <p className="text-sm text-gray-800">
                                                        <strong>
                                                          Made by:
                                                        </strong>{" "}
                                                        {log.userName ||
                                                          "System"}
                                                      </p>

                                                      {/* Chỉ hiển thị Lý do/Ghi chú nếu có */}
                                                      {log.reason && (
                                                        <p className="text-sm text-gray-800 mt-1">
                                                          <strong>
                                                            Reason Reject:
                                                          </strong>{" "}
                                                          {log.reason}
                                                        </p>
                                                      )}
                                                    </li>
                                                  );
                                                })}
                                              </ul>
                                            </div>
                                          )}
                                        {/* --- KẾT THÚC PHẦN MỚI THÊM --- */}

                                        {/* Product Details Section */}
                                        <div>
                                          <h3 className="font-semibold text-lg mb-3 text-gray-900">
                                            Product Details
                                          </h3>
                                          <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                              <div>
                                                <Label className="text-sm text-gray-500 font-medium">
                                                  Product Name
                                                </Label>
                                                <p className="font-medium text-gray-900 mt-1">
                                                  {selectedOrder.productName}
                                                </p>
                                              </div>
                                              <div>
                                                <Label className="text-sm text-gray-500 font-medium">
                                                  Product Description
                                                </Label>
                                                <p className="font-medium text-gray-900 mt-1">
                                                  {selectedOrder.productDescribe ||
                                                    "N/A"}
                                                </p>
                                              </div>
                                              <div>
                                                <Label className="text-sm text-gray-500 font-medium">
                                                  SKU
                                                </Label>
                                                <p className="font-medium text-gray-900 mt-1">
                                                  {selectedOrder.productDetails
                                                    ?.sku || "N/A"}
                                                </p>
                                              </div>
                                              <div>
                                                <Label className="text-sm text-gray-500 font-medium">
                                                  Quantity
                                                </Label>
                                                <p className="font-medium text-gray-900 mt-1">
                                                  {selectedOrder.quantity}
                                                </p>
                                              </div>
                                              <div>
                                                <Label className="text-sm text-gray-500 font-medium">
                                                  Size (L x H x W)
                                                </Label>
                                                <p className="font-medium text-gray-900 mt-1">
                                                  {
                                                    selectedOrder.productDetails
                                                      ?.lengthCm
                                                  }
                                                  x
                                                  {
                                                    selectedOrder.productDetails
                                                      ?.heightCm
                                                  }
                                                  x
                                                  {
                                                    selectedOrder.productDetails
                                                      ?.widthCm
                                                  }
                                                  cm
                                                </p>
                                              </div>
                                              <div>
                                                <Label className="text-sm text-gray-500 font-medium">
                                                  Thickness
                                                </Label>
                                                <p className="font-medium text-gray-900 mt-1">
                                                  {selectedOrder.productDetails
                                                    ?.thicknessMm || "N/A"}
                                                  mm
                                                </p>
                                              </div>
                                              <div>
                                                <Label className="text-sm text-gray-500 font-medium">
                                                  Layer
                                                </Label>
                                                <p className="font-medium text-gray-900 mt-1">
                                                  {selectedOrder.productDetails
                                                    ?.layer || "N/A"}
                                                </p>
                                              </div>
                                              <div>
                                                <Label className="text-sm text-gray-500 font-medium">
                                                  Custom Shape
                                                </Label>
                                                <p className="font-medium text-gray-900 mt-1">
                                                  {selectedOrder.productDetails
                                                    ?.customShape || "N/A"}
                                                </p>
                                              </div>
                                              <div>
                                                <Label className="text-sm text-gray-500 font-medium">
                                                  Size (Inch)
                                                </Label>
                                                <p className="font-medium text-gray-900 mt-1">
                                                  {selectedOrder.productDetails
                                                    ?.sizeInch || "N/A"}
                                                </p>
                                              </div>
                                            </div>

                                            {selectedOrder.linkImg && (
                                              <div className="border-t pt-4">
                                                <Label className="text-sm text-gray-500 font-medium">
                                                  Product Image
                                                </Label>
                                                <div className="mt-2 w-full max-w-md">
                                                  <img
                                                    src={
                                                      selectedOrder.linkImg ||
                                                      "/placeholder.svg" ||
                                                      "/placeholder.svg"
                                                    }
                                                    alt={
                                                      selectedOrder.productName
                                                    }
                                                    className="w-full h-auto rounded-lg border border-gray-200 object-cover"
                                                  />
                                                </div>
                                              </div>
                                            )}

                                            <div className="border-t pt-4 space-y-4">
                                              {selectedOrder.linkThankCard && (
                                                <div>
                                                  <Label className="text-sm text-gray-500 font-medium">
                                                    Thank Card
                                                  </Label>
                                                  <div className="mt-2 w-full max-w-md">
                                                    <img
                                                      src={
                                                        selectedOrder.linkThankCard ||
                                                        "/placeholder.svg" ||
                                                        "/placeholder.svg"
                                                      }
                                                      alt="Thank Card"
                                                      className="w-full h-auto rounded-lg border border-gray-200 object-cover"
                                                    />
                                                  </div>
                                                </div>
                                              )}

                                              {selectedOrder.linkFileDesign && (
                                                <div>
                                                  <Label className="text-sm text-gray-500 font-medium">
                                                    Design File
                                                  </Label>
                                                  <div className="mt-2 w-full max-w-md">
                                                    <img
                                                      src={
                                                        selectedOrder.linkFileDesign ||
                                                        "/placeholder.svg" ||
                                                        "/placeholder.svg"
                                                      }
                                                      alt="Design File"
                                                      className="w-full h-auto rounded-lg border border-gray-200 object-cover"
                                                    />
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>

                                        {(currentStatus === "DESIGNING" ||
                                          currentStatus === "DESIGN_REDO" ||
                                          (currentStatus === "CHECK_DESIGN" &&
                                            selectedOrder.orderStatus === 4) ||
                                          selectedOrder.orderStatus === 6) && (
                                          <div className="border-t pt-4">
                                            <h3 className="font-semibold text-lg mb-3">
                                              {/* Sửa tiêu đề */}
                                              {currentStatus === "CHECK_DESIGN"
                                                ? "Edit & Resubmit Design"
                                                : "Upload Design"}
                                            </h3>
                                            <div className="space-y-4">
                                              {/* 1. INPUT FILE MỚI & NÚT CHỌN KHO ẢNH */}
                                              <div className="flex items-start gap-3">
                                                <div className="flex-1">
                                                  <Label htmlFor="design-file">
                                                    1. Upload File Design
                                                  </Label>
                                                  <Input
                                                    id="design-file"
                                                    type="file"
                                                    accept=".jpg,.jpeg,.png"
                                                    onChange={
                                                      handleDesignFileChange
                                                    }
                                                    className="mt-1"
                                                  />
                                                </div>

                                                {/* Nút Mở Kho Ảnh */}
                                                <Dialog
                                                  open={showImageModal}
                                                  onOpenChange={
                                                    setShowImageModal
                                                  }
                                                >
                                                  <DialogTrigger asChild>
                                                    <Button
                                                      variant="outline"
                                                      type="button"
                                                      className="mt-6 whitespace-nowrap bg-transparent"
                                                      onClick={fetchMyImages}
                                                    >
                                                      Chọn từ Kho Ảnh
                                                    </Button>
                                                  </DialogTrigger>

                                                  {/* Modal Kho Ảnh */}
                                                  <DialogContent className="max-w-3xl">
                                                    <DialogHeader>
                                                      <DialogTitle>
                                                        Kho Ảnh Thiết Kế Của Bạn
                                                      </DialogTitle>
                                                    </DialogHeader>
                                                    <div className="grid grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto">
                                                      {uploadedImages.length ===
                                                      0 ? (
                                                        <p className="col-span-4 text-center text-gray-500">
                                                          Bạn chưa upload ảnh
                                                          nào hoặc không thể tải
                                                          ảnh.
                                                        </p>
                                                      ) : (
                                                        uploadedImages.map(
                                                          (img, index) => (
                                                            <div
                                                              key={index}
                                                              className={`border-4 rounded-lg cursor-pointer ${
                                                                selectedImageUrl ===
                                                                img.secureUrl
                                                                  ? "border-blue-500 ring-2 ring-blue-500"
                                                                  : "border-gray-200"
                                                              }`}
                                                              onClick={() => {
                                                                setSelectedImageUrl(
                                                                  img.secureUrl
                                                                );
                                                                setDesignFile(
                                                                  null
                                                                );
                                                              }}
                                                            >
                                                              <img
                                                                src={
                                                                  img.secureUrl ||
                                                                  "/placeholder.svg" ||
                                                                  "/placeholder.svg"
                                                                }
                                                                alt={
                                                                  img.originalFileName ||
                                                                  `Uploaded ${index}`
                                                                }
                                                                className="w-full h-24 object-cover"
                                                              />
                                                            </div>
                                                          )
                                                        )
                                                      )}
                                                    </div>
                                                    {selectedImageUrl && (
                                                      <p className="text-sm text-blue-600 mt-2">
                                                        Đã chọn file: **
                                                        {selectedImageUrl.substring(
                                                          0,
                                                          50
                                                        )}
                                                        ...**
                                                      </p>
                                                    )}
                                                    <div className="flex justify-end pt-4">
                                                      <Button
                                                        onClick={() =>
                                                          setShowImageModal(
                                                            false
                                                          )
                                                        }
                                                        disabled={
                                                          !selectedImageUrl
                                                        }
                                                      >
                                                        Xác nhận chọn file
                                                      </Button>
                                                    </div>
                                                  </DialogContent>
                                                </Dialog>
                                              </div>

                                              {/* 2. HIỂN THỊ TRẠNG THÁI FILE ĐÃ CHỌN */}
                                              <div className="mt-2 text-sm">
                                                {designFile && (
                                                  <Badge
                                                    variant="secondary"
                                                    className="bg-green-100 text-green-800"
                                                  >
                                                    File Mới: {designFile.name}
                                                  </Badge>
                                                )}
                                                {selectedImageUrl &&
                                                  !designFile && (
                                                    <Badge
                                                      variant="secondary"
                                                      className="bg-blue-100 text-blue-800"
                                                    >
                                                      File Cũ:{" "}
                                                      {selectedImageUrl.substring(
                                                        0,
                                                        30
                                                      )}
                                                      ...
                                                    </Badge>
                                                  )}
                                                {!designFile &&
                                                  !selectedImageUrl && (
                                                    <p className="text-gray-500">
                                                      Chưa chọn file thiết kế
                                                      nào.
                                                    </p>
                                                  )}
                                              </div>

                                              {/* 3. Input Ghi chú */}
                                              <div>
                                                <Label htmlFor="design-notes">
                                                  Design Notes
                                                </Label>
                                                <Textarea
                                                  id="design-notes"
                                                  placeholder="Add notes..."
                                                  value={designNotes}
                                                  onChange={(e) =>
                                                    setDesignNotes(
                                                      e.target.value
                                                    )
                                                  }
                                                />
                                              </div>

                                              {/* 4. Nút Upload/Send */}
                                              <div className="flex gap-2">
                                                <Button
                                                  onClick={handleUploadDesign}
                                                  className="flex-1"
                                                  disabled={
                                                    (!designFile &&
                                                      !selectedImageUrl) ||
                                                    loading
                                                  }
                                                >
                                                  <Upload className="h-4 w-4 mr-2" />{" "}
                                                  Upload
                                                </Button>
                                              </div>
                                            </div>
                                          </div>
                                        )}

                                        {/* <div className="border-t pt-4">
                                          <h3 className="font-semibold text-lg mb-3">
                                            Files from Seller
                                          </h3>
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div className="border rounded-lg p-4 opacity-50">
                                              <Label className="text-sm text-gray-500">
                                                Reference Image
                                              </Label>
                                              <div className="mt-2 w-full h-32 bg-gray-100 rounded border flex items-center justify-center">
                                                <ImageIcon className="h-8 w-8 text-gray-400" />
                                              </div>
                                              <p className="text-sm mt-2">
                                                N/A
                                              </p>
                                            </div>
                                          </div>
                                        </div> */}
                                      </div>
                                    )}
                                  </DialogContent>
                                )}
                              {/* END DIALOG CONTENT */}
                            </Dialog>

                            {currentStatus === "NEED_DESIGN" && (
                              <Button
                                size="sm"
                                onClick={() => handleAcceptDesign(order.id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4 mr-1" />
                              </Button>
                            )}
                            {/* {currentStatus === "DESIGNING" && (
                              <Button size="sm" disabled className="opacity-50">
                                <Upload className="h-4 w-4 mr-1" /> Upload
                                Design
                              </Button>
                            )} */}
                            {/* {currentStatus === "CHECK_DESIGN" && (
                              <Button size="sm" disabled className="opacity-50">
                                <Check className="h-4 w-4 mr-1" /> Checking
                              </Button>
                            )} */}

                            {currentStatus === "CHECK_DESIGN" &&
                              order.orderStatus !== "CHECK_DESIGN" &&
                              (order.orderStatus == 4 ||
                                order.orderStatus == 6) &&
                              !isDuplicateOrderCode && (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    handleSendToSellerCheck(order.id)
                                  }
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  <Send className="h-4 w-4 mr-1" />
                                </Button>
                              )}
                            {!(
                              (currentStatus === "CHECK_DESIGN" &&
                                currentStatus === "DESIGNING") ||
                              currentStatus === "NEED_DESIGN" ||
                              currentStatus === "DESIGN_REDO" ||
                              order.orderStatus == 4 ||
                              order.orderStatus == 6 ||
                              order.orderStatus == 3
                            ) && (
                              <span className="text-xs text-red-500 font-bold block mt-1">
                                Already sent
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}

            {!loading && filteredOrders.length > 0 && (
              <div className="border-t px-6 py-4 flex items-center justify-between bg-blue-50">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-700">Show</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                    className="px-2 py-1 border border-blue-100 rounded-md text-sm bg-white focus:border-blue-300"
                  >
                    <option value="5">5</option>
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                  <span className="text-sm text-slate-700">per page</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-700">
                    Page {page} of {totalPages} ({filteredOrders.length} total)
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="disabled:opacity-50 border-blue-100 hover:bg-blue-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">Previous</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
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
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="w-8 h-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="disabled:opacity-50 border-blue-100 hover:bg-blue-50"
                  >
                    <span className="hidden sm:inline mr-1">Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Confirmation Dialog (giữ nguyên) */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Confirm Action</h3>
            <p className="text-gray-600 mb-6">{confirmMessage}</p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmAction}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
