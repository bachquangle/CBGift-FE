"use client";

import { useState, useEffect } from "react";
import apiClient from "../../../lib/apiClient";
// Import các components UI
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import DesignerHeader from "@/components/layout/designer/header";
import DesignerSidebar from "@/components/layout/designer/sidebar";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Search, Download } from "lucide-react";

// CẬP NHẬT CONSTANTS SANG TÊN ENUM STRING (ProductionStatus)
// Lưu ý: Key là tên enum (string)
const DESIGN_STATUSES = {
    "NEED_DESIGN": { name: "Cần Design", color: "bg-red-500", code: 2 },
    "DESIGNING": { name: "Đang làm Design", color: "bg-yellow-500", code: 3 },
    "CHECK_DESIGN": { name: "Cần Check Design", color: "bg-blue-500", code: 4 },
    "DESIGN_REDO": { name: "Thiết kế Lại (Lỗi)", color: "bg-purple-500", code: 5 },
};

export default function DesignerDashboard() {
    const [currentPage, setCurrentPage] = useState("dashboard");
    const [assignedOrders, setAssignedOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState({});
    
    // State cho tính năng Filter và View Detail
    const [searchTerm, setSearchTerm] = useState("");
    // Cập nhật giá trị filter mặc định là "all" (sẽ filter theo string keys)
    const [statusFilter, setStatusFilter] = useState("all"); 
    const [selectedAssignment, setSelectedAssignment] = useState(null); 

    // Hàm gọi API và xử lý dữ liệu
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
                    // <<< THAY THẾ OrderStatus bằng ProductionStatus (dạng chuỗi) >>>
                    ProductionStatus: item.productionStatus || "NEED_DESIGN", 
                    customerName: `Customer for ${item.orderCode}`, 
                }));

                setAssignedOrders(mappedData);
                calculateCounts(mappedData);
            } catch (error) {
                console.error("Failed to fetch assigned tasks:", error);
                setAssignedOrders([]);
                calculateCounts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, []);

    // Hàm tính toán số lượng cho Stats Cards và Filter Count
    const calculateCounts = (orders) => {
        // Khởi tạo counts với các key là tên Enum
        const initialCounts = { 
            "NEED_DESIGN": 0, 
            "DESIGNING": 0, 
            "CHECK_DESIGN": 0, 
            "DESIGN_REDO": 0, 
            total: orders.length 
        };
        
        const newCounts = orders.reduce((acc, order) => {
            // <<< Dùng order.ProductionStatus >>>
            const statusKey = order.ProductionStatus || "NEED_DESIGN";
            
            if (acc.hasOwnProperty(statusKey)) {
                acc[statusKey] += 1;
            }
            return acc;
        }, initialCounts);

        setCounts(newCounts);
    };
    
    // Hàm tính toán số lượng hiển thị trong Filter Select
    const getFilterCounts = () => {
        const totalCounts = { all: assignedOrders.length };
        Object.keys(DESIGN_STATUSES).forEach(key => {
            totalCounts[key] = counts[key] || 0;
        });
        return totalCounts;
    };
    const filterCounts = getFilterCounts();


    // Hàm xử lý Click vào Badge/Stats Card để Filter
    const handleStatusBadgeClick = (statusKey) => {
        if (statusFilter === statusKey) {
            setStatusFilter("all");
        } else {
            setStatusFilter(statusKey);
        }
        setSearchTerm(""); 
    };

    // Hàm hiển thị Badge trạng thái (có thể click)
    const getStatusBadge = (statusKey) => {
        // Dùng statusKey (chuỗi enum)
        const statusInfo = DESIGN_STATUSES[String(statusKey)] || { name: "Không xác định", color: "bg-gray-500" };
        
        return (
            <span 
                onClick={() => handleStatusBadgeClick(statusKey)}
                className="cursor-pointer hover:opacity-80 transition-opacity" 
            >
                <Badge 
                    variant="default" 
                    className={
                        `${statusInfo.color} ${statusFilter === statusKey ? "ring-2 ring-offset-2 ring-black" : ""}`
                    }
                >
                    {statusInfo.name}
                </Badge>
            </span>
        );
    };

    // Hàm Filter cho Bảng
    const filteredAssignments = assignedOrders.filter((assignment) => {
        const matchesSearch =
            assignment.orderCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            assignment.productName.toLowerCase().includes(searchTerm.toLowerCase());

        // <<< Dùng assignment.ProductionStatus >>>
        const orderStatusKey = assignment.ProductionStatus || "NEED_DESIGN";

        const matchesStatus =
            statusFilter === "all" ||
            orderStatusKey === statusFilter;

        return matchesSearch && matchesStatus;
    });


    //let previousOrderCode = null;


    return (
        <div className="flex h-screen bg-gray-50">
            <DesignerSidebar
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
                <DesignerHeader />
                <main className="flex-1 overflow-y-auto p-6">
                    <div className="space-y-6">
                        {/* Header */}
                        <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                            <h1 className="text-xl font-semibold text-gray-900">
                                Designer Dashboard
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Chào mừng đến với không gian làm việc của Designer
                            </p>
                        </div>

                        {/* Stats Cards - 5 CỘT (CÓ THỂ CLICK) */}
                        {loading ? (
                            <div className="text-center text-gray-500">Loading stats...</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                
                                {/* 1. Cần Design (Status NEED_DESIGN) */}
                                <div 
                                    className={`bg-white p-6 rounded-lg shadow cursor-pointer hover:ring-2 hover:ring-red-300 transition-all ${statusFilter === 'NEED_DESIGN' ? 'ring-2 ring-offset-2 ring-red-500' : ''}`}
                                    onClick={() => handleStatusBadgeClick("NEED_DESIGN")}
                                >
                                    <h3 className="text-sm font-medium text-gray-500">
                                        {DESIGN_STATUSES["NEED_DESIGN"].name}
                                    </h3>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{counts["NEED_DESIGN"] || 0}</p>
                                </div>
                                
                                {/* 2. Đang làm Design (Status DESIGNING) */}
                                <div 
                                    className={`bg-white p-6 rounded-lg shadow cursor-pointer hover:ring-2 hover:ring-yellow-300 transition-all ${statusFilter === 'DESIGNING' ? 'ring-2 ring-offset-2 ring-yellow-500' : ''}`}
                                    onClick={() => handleStatusBadgeClick("DESIGNING")}
                                >
                                    <h3 className="text-sm font-medium text-gray-500">
                                        {DESIGN_STATUSES["DESIGNING"].name}
                                    </h3>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{counts["DESIGNING"] || 0}</p>
                                </div>
                                
                                {/* 3. Cần Check Design (Status CHECK_DESIGN) */}
                                <div 
                                    className={`bg-white p-6 rounded-lg shadow cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all ${statusFilter === 'CHECK_DESIGN' ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                                    onClick={() => handleStatusBadgeClick("CHECK_DESIGN")}
                                >
                                    <h3 className="text-sm font-medium text-gray-500">
                                        {DESIGN_STATUSES["CHECK_DESIGN"].name}
                                    </h3>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{counts["CHECK_DESIGN"] || 0}</p>
                                </div>

                                {/* 4. Thiết kế Lại (Design Lỗi) (Status DESIGN_REDO) */}
                                <div 
                                    className={`bg-white p-6 rounded-lg shadow cursor-pointer hover:ring-2 hover:ring-purple-300 transition-all ${statusFilter === 'DESIGN_REDO' ? 'ring-2 ring-offset-2 ring-purple-500' : ''}`}
                                    onClick={() => handleStatusBadgeClick("DESIGN_REDO")}
                                >
                                    <h3 className="text-sm font-medium text-gray-500">
                                        {DESIGN_STATUSES["DESIGN_REDO"].name}
                                    </h3>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{counts["DESIGN_REDO"] || 0}</p>
                                </div>
                                
                                {/* 5. Tổng số Order Details (Tất cả) */}
                                <div 
                                    className={`bg-white p-6 rounded-lg shadow cursor-pointer hover:ring-2 hover:ring-gray-300 transition-all ${statusFilter === 'all' ? 'ring-2 ring-offset-2 ring-gray-500' : ''}`}
                                    onClick={() => handleStatusBadgeClick("all")}
                                >
                                    <h3 className="text-sm font-medium text-gray-500">
                                        Tổng số Order Details
                                    </h3>
                                    <p className="text-2xl font-bold text-gray-900 mt-2">{counts.total || 0}</p>
                                </div>
                            </div>
                        )}
                    
                        {/* Search and Filter Section (Sử dụng Filter Select cho tính nhất quán) */}
                        <div className="bg-white p-4 rounded-lg shadow">
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
                                <div className="w-64">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger>
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
                        
                        {/* Recent Assignments Table */}
                        <div className="bg-white rounded-lg shadow">
                            <div className="p-6 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-900">
                                    Recent Assignments ({filteredAssignments.length} found)
                                </h2>
                                <p className="text-gray-600 mt-1">
                                    Danh sách chi tiết đơn hàng được giao gần nhất
                                </p>
                            </div>
                            
                            {loading ? (
                                <div className="p-6 text-center text-gray-500">Loading assignments...</div>
                            ) : filteredAssignments.length === 0 ? (
                                <div className="p-6 text-center text-gray-500">No matching assignments found.</div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Detail ID</TableHead>
                                            <TableHead>Order Code</TableHead>
                                            <TableHead>Product</TableHead>
                                            <TableHead>Quantity</TableHead>
                                            <TableHead>Assigned Date</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        
                                        {filteredAssignments.map((assignment) => {
                                            
                                            // 1. Logic kiểm tra trùng lặp
                                            //const isDuplicateOrderCode = assignment.orderCode === previousOrderCode;
                                            //previousOrderCode = assignment.orderCode;
                                            
                                            return (
                                                <TableRow key={assignment.id}>
                                                    <TableCell className="font-medium">
                                                        {assignment.orderDetailId}
                                                    </TableCell>
                                                    
                                                    <TableCell 
                                                        className= "font-medium"
                                                    >
                                                        {assignment.orderCode }
                                                    </TableCell>
                                                    
                                                    <TableCell>{assignment.productName}</TableCell>
                                                    <TableCell>{assignment.quantity}</TableCell>
                                                    <TableCell>{new Date(assignment.assignedAt).toLocaleDateString()}</TableCell>
                                                    
                                                    {/* Ô Status */}
                                                    <TableCell>{getStatusBadge(assignment.ProductionStatus)}</TableCell>
                                                    
                                                    <TableCell>
                                                        {/* Nút View chi tiết */}
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button 
                                                                    variant="outline" 
                                                                    size="sm"
                                                                    onClick={() => setSelectedAssignment(assignment)}
                                                                >
                                                                    <Eye className="h-4 w-4 mr-1" />
                                                                    View
                                                                </Button>
                                                            </DialogTrigger>

                                                            {/* Dialog Content */}
                                                            {selectedAssignment && selectedAssignment.id === assignment.id && (
                                                                <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
                                                                    <DialogHeader>
                                                                        <DialogTitle>
                                                                            Assignment Detail - {selectedAssignment.orderDetailId}
                                                                        </DialogTitle>
                                                                    </DialogHeader>
                                                                    <div className="space-y-4">
                                                                        <div>
                                                                            <Label className="text-sm text-gray-500">Order Code</Label>
                                                                            <p className="font-medium">{selectedAssignment.orderCode}</p>
                                                                        </div>
                                                                        <div>
                                                                            <Label className="text-sm text-gray-500">Product Name</Label>
                                                                            <p className="font-medium">{selectedAssignment.productName}</p>
                                                                        </div>
                                                                        {/* MỚI: Hiển thị Production Status */}
                                                                        <div>
                                                                            <Label className="text-sm text-gray-500">Status</Label>
                                                                            <div className="font-medium">
                                                                                {getStatusBadge(selectedAssignment.ProductionStatus)}
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <Label className="text-sm text-gray-500">Assigned Date</Label>
                                                                            <p className="font-medium">{new Date(selectedAssignment.assignedAt).toLocaleDateString()}</p>
                                                                        </div>
                                                                        <div>
                                                                            <Label className="text-sm text-gray-500">Customer Note</Label>
                                                                            <p className="font-medium">{selectedAssignment.note || 'Không có ghi chú.'}</p>
                                                                        </div>
                                                                        {/* Link Download */}
                                                                        {selectedAssignment.linkImg && (
                                                                            <div>
                                                                                <Label className="text-sm text-gray-500">Reference Image</Label>
                                                                                <a href={selectedAssignment.linkImg} target="_blank" rel="noopener noreferrer" className="flex items-center text-blue-500 hover:underline mt-1">
                                                                                    <Download className="h-4 w-4 mr-1" />
                                                                                    Download File
                                                                                </a>
                                                                            </div>
                                                                        )}
                                                                        {/* Chi tiết Size */}
                                                                        {selectedAssignment.productDetails && (
                                                                            <div>
                                                                                <Label className="text-sm text-gray-500">Product Size</Label>
                                                                                <p className="font-medium">
                                                                                    {selectedAssignment.productDetails.lengthCm}x
                                                                                    {selectedAssignment.productDetails.heightCm}x
                                                                                    {selectedAssignment.productDetails.widthCm}cm
                                                                                </p>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </DialogContent>
                                                            )}
                                                        </Dialog>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}