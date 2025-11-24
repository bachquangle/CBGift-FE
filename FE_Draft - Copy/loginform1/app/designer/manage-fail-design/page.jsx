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
    Download,
    ImageIcon,
    Search,
    Send,
} from "lucide-react";
import DesignerHeader from "@/components/layout/designer/header";
import DesignerSidebar from "@/components/layout/designer/sidebar";

const DESIGN_STATUSES = {
    "3": { name: "NEED DESIGN", color: "bg-red-500", code: "NEEDDESIGN" },
    "4": { name: "DESIGNING", color: "bg-yellow-500", code: "DESIGNING" },
    "5": { name: "CHECKDESIGN", color: "bg-blue-500", code: "CHECKDESIGN" },
    "6": { name: "DESIGN_REDO", color: "bg-purple-500", code: "DESIGN_REDO" },
};

export default function DesignAssignPage() {
    const [currentPage, setCurrentPage] = useState("design-assign");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [designFile, setDesignFile] = useState(null);
    const [designNotes, setDesignNotes] = useState("");
    
    // State cho tính năng chọn hàng loạt
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(new Set()); 
    const [selectAll, setSelectAll] = useState(false);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmMessage, setConfirmMessage] = useState("");

    const [loading, setLoading] = useState(true);
    const [assignedOrders, setAssignedOrders] = useState([]); 

    // --- HÀM GỌI API CẬP NHẬT TRẠNG THÁI (Đã sửa lỗi JSON input) ---
    const updateDesignStatusApi = async (orderDetailId, newStatusKey) => {
        const url = `${apiClient.defaults.baseURL}/api/designer/tasks/status/${orderDetailId}`; 
        
        try {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    orderStatus: parseInt(newStatusKey),
                }),
                credentials: 'include',
            });

            if (!response.ok) {
                const contentType = response.headers.get("content-type");
                
                if (!contentType || !contentType.includes("application/json")) {
                    // Nếu không phải JSON (ví dụ: 400 Bad Request trả về text)
                    const errorText = await response.text();
                    throw new Error(`Server returned status ${response.status}. Response: ${errorText.substring(0, 50)}...`);
                }
                
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to update status: ${response.status}`);
            }

            // Xử lý thành công (200 OK, 204 No Content)
            return true;

        } catch (error) {
            console.error("API Error during status update:", error);
            alert(`Lỗi khi cập nhật trạng thái: ${error.message}`);
            return false;
        }
    };
    
    // Hàm cập nhật trạng thái trên frontend (chỉ khi API thành công)
    const handleUpdateStatusLocal = (orderId, newStatusKey) => {
        setAssignedOrders(prevOrders => 
            prevOrders.map(order => 
                order.id === orderId ? { ...order, OrderStatus: newStatusKey } : order
            )
        );
        console.log(`Cập nhật trạng thái Order Detail ${orderId} thành ${newStatusKey} (Local)`);
    };

    // Hàm chấp nhận thiết kế (3 -> 4)
    const handleAcceptDesign = async (orderId) => {
        const success = await updateDesignStatusApi(orderId, "4");
        
        if (success) {
            handleUpdateStatusLocal(orderId, "4");
        }
    };

    // Hàm Gửi QA (4/5/6 -> 5/QA)
    const handleSendToQA = (orderId) => {
        setConfirmMessage(`Bạn có chắc muốn gửi Order Detail ${orderId} sang CHECKDESIGN (5)?`);
        setConfirmAction(() => async () => {
            const success = await updateDesignStatusApi(orderId, "5");
            if (success) {
                handleUpdateStatusLocal(orderId, "5");
            }
            setShowConfirmDialog(false);
        });
        setShowConfirmDialog(true);
    };
    
    // Hàm Upload Design (và chuyển trạng thái)
    const handleUploadDesign = async () => {
        if (designFile && selectedOrder) {
            console.log(`Uploading design file for ${selectedOrder.id}`);
            
            // 1. Logic Upload File lên server (BẠN CẦN VIẾT HÀM NÀY)
            // Tạm thời giả định thành công
            const uploadSuccess = true; 
            
            if (uploadSuccess) {
                // 2. Chuyển trạng thái sang 5 (CHECKDESIGN)
                const apiSuccess = await updateDesignStatusApi(selectedOrder.id, "5"); 

                if (apiSuccess) {
                    handleUpdateStatusLocal(selectedOrder.id, "5"); 
                    setDesignFile(null);
                    setDesignNotes("");
                    setSelectedOrder(null); 
                }
            } else {
                alert("Lỗi: Không thể upload file thiết kế.");
            }
        }
    };


    // *** LOGIC GỌI API BAN ĐẦU ***
    useEffect(() => {
        const fetchTasks = async () => {
            try {
                setLoading(true);
                
                const res = await fetch(`${apiClient.defaults.baseURL}/api/designer/tasks`, { 
                    credentials: "include", 
                });
                
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                
                const apiData = await res.json();

                const mappedData = (apiData || []).map((item) => ({
                    ...item,
                    id: item.orderDetailId.toString(), 
                    // LẤY TRỰC TIẾP TỪ orderStatus VÀ CHUYỂN THÀNH CHUỖI
                    OrderStatus: String(item.orderStatus), 
                    customerName: `Customer for ${item.orderCode}`, 
                }));

                setAssignedOrders(mappedData);
            } catch (error) {
                console.error("Failed to fetch assigned tasks:", error);
                setAssignedOrders([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []); 

    // --- LOGIC FILTER ---
    const filteredOrders = assignedOrders.filter((order) => {
        const matchesSearch =
            order.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.productName.toLowerCase().includes(searchTerm.toLowerCase());

        const orderStatusKey = String(order.OrderStatus || "3");

        const matchesStatus =
            statusFilter === "all" ||
            orderStatusKey === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // --- LOGIC COUNT ---
    const getFilterCounts = () => {
        const counts = { all: assignedOrders.length };
        Object.keys(DESIGN_STATUSES).forEach(key => {
            counts[key] = 0;
        });

        assignedOrders.forEach(order => {
            const statusKey = String(order.OrderStatus || "3");
            if (counts.hasOwnProperty(statusKey)) {
                counts[statusKey] += 1;
            }
        });
        return counts;
    };
    const filterCounts = getFilterCounts();

    // --- LOGIC CHECKBOX/BULK ACTIONS ---
    const handleSelectAll = (checked) => {
        setSelectAll(checked);
        if (checked) {
          setSelectedOrderDetails(new Set(filteredOrders.map((order) => order.id)));
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
        setSelectAll(newSelected.size === filteredOrders.length && filteredOrders.length > 0);
    };

    // Hàm hiển thị Badge trạng thái
    const getOrderStatus = (order) => {
        const statusKey = order.OrderStatus ? String(order.OrderStatus) : "3";
        const statusInfo = DESIGN_STATUSES[statusKey] || { name: "UNKNOWN", color: "bg-gray-500" };

        return (
            <Badge variant="default" className={statusInfo.color}>
                {statusInfo.name}
            </Badge>
        );
    };
    
    // Biến theo dõi OrderCode trùng lặp
    let previousOrderCode = null;


    return (
        <div className="flex h-screen bg-gray-50">
            <DesignerSidebar
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />

            <div className="flex-1 flex flex-col overflow-hidden">
                <DesignerHeader />

                <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
                    <h1 className="text-2xl font-semibold text-gray-900">
                        Design Assigned
                    </h1>
                    <p className="text-gray-600 mt-1">
                        Orders assigned to you for design work
                    </p>
                </header>

                <main className="flex-1 overflow-y-auto p-6">
                    {/* Search and Filter Section */}
                    <div className="bg-white p-4 rounded-lg shadow mb-6">
                        <div className="flex gap-4 items-center">
                            <div className="flex-1">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                    <Input
                                        placeholder="Search by Order ID, Product Name..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>
                            </div>
                            <div className="w-48">
                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        {/* Hiển thị count bên cạnh giá trị đang chọn */}
                                        <SelectValue placeholder="Filter by status">
                                            {statusFilter === "all" ? (
                                                `Tất cả Status (${filterCounts.all})`
                                            ) : (
                                                `${DESIGN_STATUSES[statusFilter]?.name} (${filterCounts[statusFilter] || 0})`
                                            )}
                                        </SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            Tất cả Status ({filterCounts.all})
                                        </SelectItem>
                                        
                                        {Object.entries(DESIGN_STATUSES).map(([key, value]) => (
                                            <SelectItem key={key} value={key}>
                                                {value.name} ({filterCounts[key] || 0})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                    {/* Bulk Actions (Chưa có logic cập nhật trạng thái bulk) */}
                    {selectedOrderDetails.size > 0 && (
                        <div className="bg-blue-50 p-4 rounded-lg shadow mb-6 border border-blue-200">
                            <div className="flex items-center justify-between">
                                <span className="text-blue-800 font-medium">
                                    {selectedOrderDetails.size} order detail
                                    {selectedOrderDetails.size > 1 ? "s" : ""} selected
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => { /* Bulk accept logic */ }}
                                        className="bg-green-600 hover:bg-green-700"
                                        size="sm"
                                    >
                                        <Check className="h-4 w-4 mr-1" />
                                        Accept Selected ({selectedOrderDetails.size})
                                    </Button>
                                    <Button
                                        onClick={() => { /* Bulk send to QA logic */ }}
                                        className="bg-blue-600 hover:bg-blue-700"
                                        size="sm"
                                        disabled={true} 
                                    >
                                        <Send className="h-4 w-4 mr-1" />
                                        Send to QA (0)
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Table Section */}
                    <div className="bg-white rounded-lg shadow">
                        {loading && (
                            <div className="p-4 text-center text-gray-500">
                                Đang tải danh sách công việc được giao...
                            </div>
                        )}
                        {!loading && filteredOrders.length === 0 && (
                            <div className="p-4 text-center text-gray-500">
                                Không tìm thấy công việc thiết kế nào được giao.
                            </div>
                        )}
                        {!loading && filteredOrders.length > 0 && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12"><Checkbox checked={selectAll} onCheckedChange={handleSelectAll} /></TableHead>
                                        <TableHead>Detail ID</TableHead> 
                                        <TableHead>Order Code</TableHead>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>Product Description</TableHead> 
                                        <TableHead>Quantity</TableHead>
                                        <TableHead>Size (L x H x W)</TableHead>
                                        <TableHead>Assigned At</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previousOrderCode = null}
                                    {filteredOrders.map((order) => {
                                        // Logic ẩn OrderCode trùng lặp
                                        const isDuplicateOrderCode = order.orderCode === previousOrderCode;
                                        previousOrderCode = order.orderCode;
                                        
                                        const currentStatus = String(order.OrderStatus || "3");

                                        return (
                                            <TableRow key={order.id}> 
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedOrderDetails.has(order.id)}
                                                        onCheckedChange={(checked) => handleSelectOrder(order.id, checked)}
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">{order.orderDetailId}</TableCell>
                                                <TableCell className={isDuplicateOrderCode ? "text-gray-400 font-normal" : "font-medium"}>
                                                    {!isDuplicateOrderCode ? order.orderCode : "—"}
                                                </TableCell>
                                                <TableCell>{order.productName}</TableCell>
                                                <TableCell>{order.productDescribe || 'N/A'}</TableCell>
                                                <TableCell>{order.quantity}</TableCell>
                                                <TableCell>
                                                    {order.productDetails?.lengthCm}x{order.productDetails?.heightCm}x{order.productDetails?.widthCm}cm
                                                </TableCell>
                                                <TableCell>{new Date(order.assignedAt).toLocaleString()}</TableCell>
                                                <TableCell>{getOrderStatus(order)}</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => setSelectedOrder(order)}
                                                                >
                                                                    <Eye className="h-4 w-4 mr-1" /> View
                                                                </Button>
                                                            </DialogTrigger>
                                                            {/* DIALOG CONTENT */}
                                                            {selectedOrder && selectedOrder.id === order.id && ( 
                                                                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                                                                    <DialogHeader>
                                                                        <DialogTitle>Order Detail - {selectedOrder.orderDetailId} ({selectedOrder.orderCode})</DialogTitle>
                                                                    </DialogHeader>
                                                                    <div className="space-y-6">
                                                                        {/* PRODUCT DETAILS (Đã tối giản) */}
                                                                        <div>
                                                                            <h3 className="font-semibold text-lg mb-3">Product Details</h3>
                                                                            <div className="grid grid-cols-2 gap-4">
                                                                                <div><Label className="text-sm text-gray-500">Product</Label><p className="font-medium">{selectedOrder.productName}</p></div>
                                                                                <div><Label className="text-sm text-gray-500">Size</Label><p className="font-medium">{selectedOrder.productDetails?.lengthCm}x{selectedOrder.productDetails?.heightCm}x{selectedOrder.productDetails?.widthCm}cm</p></div>
                                                                                <div><Label className="text-sm text-gray-500">Quantity</Label><p className="font-medium">{selectedOrder.quantity}</p></div>
                                                                                <div><Label className="text-sm text-gray-500">SKU</Label><p className="font-medium">{selectedOrder.productDetails?.sku || 'N/A'}</p></div>
                                                                            </div>
                                                                            <div className="mt-4"><Label className="text-sm text-gray-500">Note</Label><p className="font-medium">{selectedOrder.note || 'No notes.'}</p></div>
                                                                        </div>

                                                                        {/* UPLOAD DESIGN SECTION */}
                                                                        {/* HIỂN THỊ KHI ĐANG DESIGNING (4) HOẶC DESIGN_REDO (6) */}
                                                                        {(currentStatus === "4" || currentStatus === "6") && (
                                                                            <div className="border-t pt-4">
                                                                                <h3 className="font-semibold text-lg mb-3">Upload Design</h3>
                                                                                <div className="space-y-4">
                                                                                    <div><Label htmlFor="design-file">Design File</Label><Input id="design-file" type="file" accept=".jpg,.jpeg,.png,.pdf,.ai,.psd" onChange={(e) => setDesignFile(e.target.files[0])}/></div>
                                                                                    <div><Label htmlFor="design-notes">Design Notes</Label><Textarea id="design-notes" placeholder="Add notes..." value={designNotes} onChange={(e) => setDesignNotes(e.target.value)} /></div>
                                                                                    <div className="flex gap-2">
                                                                                        <Button onClick={handleUploadDesign} className="flex-1" disabled={!designFile}>
                                                                                            <Upload className="h-4 w-4 mr-2" /> Upload & Send to Check (5)
                                                                                        </Button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {/* HIỂN THỊ NÚT SEND TO QA (CHỈ KHI ĐÃ CÓ FILE DESIGN VÀ CHƯA GỬI CHECK) */}
                                                                        {currentStatus === "5" && (
                                                                            <div className="border-t pt-4">
                                                                                <Button onClick={() => handleSendToQA(selectedOrder.id)} className="w-full bg-blue-600 hover:bg-blue-700">
                                                                                    <Send className="h-4 w-4 mr-1" /> Send to QA
                                                                                </Button>
                                                                            </div>
                                                                        )}
                                                                        
                                                                         {/* FILES FROM SELLER (Tạm thời giữ nguyên logic file cũ) */}
                                                                        <div className="border-t pt-4">
                                                                            <h3 className="font-semibold text-lg mb-3">Files from Seller</h3>
                                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                                <div className="border rounded-lg p-4 opacity-50">
                                                                                    <Label className="text-sm text-gray-500">Reference Image</Label>
                                                                                    <div className="mt-2 w-full h-32 bg-gray-100 rounded border flex items-center justify-center">
                                                                                        <ImageIcon className="h-8 w-8 text-gray-400" />
                                                                                    </div>
                                                                                    <p className="text-sm mt-2">N/A</p>
                                                                                </div>
                                                                                {/* Thêm các file khác... */}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </DialogContent>
                                                            )}
                                                            {/* END DIALOG CONTENT */}
                                                        </Dialog>

                                                        {/* ACCEPT BUTTON (Chỉ hiển thị khi NEED DESIGN - 3) */}
                                                        {currentStatus === "3" && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleAcceptDesign(order.id)}
                                                            >
                                                                <Check className="h-4 w-4 mr-1" />
                                                                Accept
                                                            </Button>
                                                        )}

                                                        {/* Nút REDO/START DESIGN (Cho Status 6) */}
                                                        {currentStatus === "6" && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleUpdateStatusLocal(order.id, "4")} // Chuyển về DESIGNING để bắt đầu lại
                                                                className="bg-purple-600 hover:bg-purple-700"
                                                            >
                                                                <Check className="h-4 w-4 mr-1" />
                                                                Start Redo
                                                            </Button>
                                                        )}
                                                        
                                                        {/* NÚT UPLOAD/GỬI QA NHANH (Chỉ khi đang DESIGNING (4) */}
                                                        {currentStatus === "4" && (
                                                             <Button
                                                                size="sm"
                                                                onClick={() => setSelectedOrder(order)} // Mở Dialog để Upload
                                                                className="bg-blue-600 hover:bg-blue-700"
                                                            >
                                                                <Upload className="h-4 w-4 mr-1" />
                                                                Upload Design
                                                            </Button>
                                                        )}
                                                        
                                                        {/* NÚT SEND QA (Chỉ khi CHECKDESIGN (5)) */}
                                                        {currentStatus === "5" && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleSendToQA(order.id)}
                                                                className="bg-blue-600 hover:bg-blue-700"
                                                            >
                                                                <Send className="h-4 w-4 mr-1" />
                                                                Send to QA
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
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