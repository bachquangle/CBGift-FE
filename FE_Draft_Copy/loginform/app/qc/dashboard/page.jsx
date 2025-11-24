"use client";

import { useState } from "react";
// import RoleSidebar from "@/components/layout/shared/role-sidebar"; // Không dùng
// import SellerHeader from "@/components/layout/seller/header"; // Không dùng
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
  QrCode,
  Download,
  ImageIcon,
} from "lucide-react";
import QcSidebar from "@/components/layout/qc/sidebar";
import QcHeader from "@/components/layout/qc/header";

// -----------------------------------------------------------------
// COMPONENT TRANG QC CHÍNH (ĐÃ GỘP)
// -----------------------------------------------------------------
export default function QCPage() {
  // State chung cho điều hướng
  const [currentPage, setCurrentPage] = useState("dashboard"); // Mặc định là dashboard

  // --- State và Data (Dùng chung cho cả 2 trang) ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null); // Dùng cho modal inspect chi tiết
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [manualOrderId, setManualOrderId] = useState("");

  // Dữ liệu mock này sẽ dùng cho cả Dashboard và Check Product
  // (Lấy từ code Check Product bạn cung cấp)
  const productOrders = [
    {
      id: "ORD-003",
      customer: "Mike Brown",
      products: [
        {
          name: "Acrylic Charm",
          quantity: 100,
          size: "3x3cm",
          accessory: "Phone Strap",
        },
        {
          name: "Acrylic Keychain",
          quantity: 50,
          size: "5x5cm",
          accessory: "Key Ring",
        },
      ],
      staff: "Charlie Davis",
      dateManufactured: "2024-01-13",
      status: "pending_check",
      qrCode: "QR-ORD-003-2024",
      customerInfo: {
        name: "Mike Brown",
        phone: "+1234567892",
        email: "mike@example.com",
        address: "789 Pine St",
        city: "Chicago",
        state: "IL",
        zipcode: "60601",
        country: "USA",
      },
      productDetails: {
        activeTTS: true,
        note: "Cute anime style design",
        specialInstructions: "Pack individually, handle with care",
      },
      customerFiles: [
        { name: "reference.jpg", type: "image", url: "/acrylic-charm.jpg" },
        { name: "thanks-card.pdf", type: "pdf", url: "#" },
      ],
      designFiles: [ // Giữ lại designFiles theo code Check Product
        {
          name: "charm-final-design.png",
          url: "/acrylic-charm.jpg",
          type: "image",
        },
        {
          name: "keychain-final-design.png",
          url: "/acrylic-keychain.jpg",
          type: "image",
        },
      ],
      productImages: [
        { name: "manufactured-charm.jpg", url: "/acrylic-charm.jpg" },
        { name: "manufactured-keychain.jpg", url: "/acrylic-keychain.jpg" },
      ],
    },
    {
      id: "ORD-004",
      customer: "Sarah Wilson",
      products: [
        {
          name: "Acrylic Keychain",
          quantity: 75,
          size: "4x6cm",
          accessory: "Key Ring",
        },
        {
          name: "Acrylic Stand",
          quantity: 30,
          size: "10x15cm",
          accessory: "None",
        },
        {
          name: "Acrylic Charm",
          quantity: 200,
          size: "3x3cm",
          accessory: "Phone Strap",
        },
      ],
      staff: "David Lee",
      dateManufactured: "2024-01-12",
      status: "pending_check",
      qrCode: "QR-ORD-004-2024",
      customerInfo: {
        name: "Sarah Wilson",
        phone: "+1234567893",
        email: "sarah@example.com",
        address: "321 Elm St",
        city: "Miami",
        state: "FL",
        zipcode: "33101",
        country: "USA",
      },
      productDetails: {
        activeTTS: false,
        note: "Professional look with company branding",
        specialInstructions:
          "Ensure stable base for stand, vibrant colors for charm",
      },
      customerFiles: [
        {
          name: "logo-reference.jpg",
          type: "image",
          url: "/acrylic-keychain.jpg",
        },
        { name: "brand-guidelines.pdf", type: "pdf", url: "#" },
      ],
      designFiles: [ // Giữ lại designFiles theo code Check Product
        {
          name: "keychain-final-design.png",
          url: "/acrylic-keychain.jpg",
          type: "image",
        },
        {
          name: "stand-final-design.png",
          url: "/acrylic-stand.jpg",
          type: "image",
        },
        {
          name: "charm-final-design.png",
          url: "/acrylic-charm.jpg",
          type: "image",
        },
      ],
      productImages: [
        { name: "manufactured-keychain.jpg", url: "/acrylic-keychain.jpg" },
        { name: "manufactured-stand.jpg", url: "/acrylic-stand.jpg" },
        { name: "manufactured-charm.jpg", url: "/acrylic-charm.jpg" },
      ],
    },
  ];

  // --- Logic/Hàm (Lấy từ code Check Product) ---
  const filteredOrders = productOrders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.products.some((product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesFilter =
      filterStatus === "all" || order.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleQRScan = () => {
    const mockQRResult = "QR-ORD-003-2024";
    const foundOrder = productOrders.find(
      (order) => order.qrCode === mockQRResult
    );
    if (foundOrder) {
      setSelectedOrder(foundOrder);
      setShowQRScanner(false);
    } else {
      alert("Order not found for this QR code");
    }
  };

  const handleManualOrderSearch = () => {
    if (manualOrderId.trim()) {
      const foundOrder = productOrders.find(
        (order) => order.id.toLowerCase() === manualOrderId.toLowerCase()
      );
      if (foundOrder) {
        setSelectedOrder(foundOrder);
        setManualOrderId("");
      } else {
        alert("Order not found");
      }
    }
  };

  const handleApprove = (orderId) => {
    setConfirmMessage(
      `Are you sure you want to approve product for order ${orderId}?`
    );
    setConfirmAction(() => () => {
      console.log(
        `Product approved for order ${orderId}. Sending for packaging and shipping.`
      );
      setSelectedOrder(null);
      setShowConfirmDialog(false);
    });
    setShowConfirmDialog(true);
  };

  const handleReject = (orderId) => {
    setSelectedOrder({ ...selectedOrder, rejectOrderId: orderId });
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = () => {
    if (rejectReason.trim()) {
      const orderId = selectedOrder?.rejectOrderId || selectedOrder?.id;
      console.log(
        `Product rejected for order ${orderId}. Sending back to staff for reproduction. Reason: ${rejectReason}`
      );
      setSelectedOrder(null);
      setRejectReason("");
      setShowRejectDialog(false);
    }
  };

  const handleDownload = (fileUrl, fileName) => {
    console.log(`Downloading file: ${fileName} from ${fileUrl}`);
  };

  // Hàm để chuyển từ Dashboard sang CheckProduct và mở modal
  const handleInspectFromDashboard = (order) => {
    setCurrentPage("check-product"); // Chuyển trang
    setSelectedOrder(order); // Mở modal
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar dùng state chung */}
      <QcSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <QcHeader />
        <main className="flex-1 overflow-y-auto p-6">
          
          {/* NỘI DUNG DASHBOARD (TỪ CODE 1) */}
          {currentPage === "dashboard" && (
            <div className="space-y-6">
              {/* Header (style của Dashboard) */}
              <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
                <h1 className="text-xl font-semibold text-gray-900">
                  QC Dashboard
                </h1>
                <p className="text-gray-600 mt-1">
                  Quality Control workspace overview
                </p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">
                    Product Checks
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">
                    {productOrders.length}
                  </p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">
                    Approved Today
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">5</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-sm font-medium text-gray-500">
                    Quality Score
                  </h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">98%</p>
                </div>
              </div>

              {/* Bảng Product Checks (của Dashboard) */}
              <div className="bg-white rounded-lg shadow">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    Pending Product Checks
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Customer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Products
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Staff
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {productOrders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.customer}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.products
                              .map((p) => p.name)
                              .join(", ")
                              .substring(0, 30)}
                            ...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.staff}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInspectFromDashboard(order)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Inspect
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* NỘI DUNG CHECK PRODUCT (TỪ CODE 2) */}
          {currentPage === "check-product" && (
            <div className="space-y-6">
              {/* Header (style của Check Product) */}
              <div className="bg-white p-4 rounded-lg border-2 border-green-200">
                <h1 className="text-xl font-semibold text-gray-900">
                  Check Product
                </h1>
                <p className="text-gray-600 mt-1">
                  Quality check for manufactured products
                </p>
              </div>

              {/* Search, Filter and QR Scanner */}
              <div className="bg-white p-4 rounded-lg shadow">
                <div className="flex gap-4 items-center mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by Order ID, Customer, or Product..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="all">All Status</option>
                    <option value="pending_check">Pending Check</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <Button
                    onClick={() => setShowQRScanner(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <QrCode className="h-4 w-4 mr-2" />
                    Scan QR
                  </Button>
                </div>

                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Enter Order ID manually..."
                    value={manualOrderId}
                    onChange={(e) => setManualOrderId(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleManualOrderSearch} variant="outline">
                    <Search className="h-4 w-4 mr-1" />
                    Search Order
                  </Button>
                </div>
              </div>

              {/* Bảng Orders (của Check Product) */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Staff
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date Manufactured
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {/* Sửa lại cột Actions cho đúng */}
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {order.id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.customer}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.products
                            .map((product) => product.name)
                            .join(", ")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.staff}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.dateManufactured}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="secondary">Pending Check</Badge>
                        </td>
                        {/* Sửa lại nút actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Inspect
                          </Button>
                          {/* Nút Scan QR ở bảng này có vẻ thừa vì đã có ở trên,
                              nhưng mình giữ lại theo code 2 bạn gửi */}
                          <Button
                            onClick={() => setShowQRScanner(true)}
                            className="bg-blue-600 hover:bg-blue-700 ml-2"
                            size="sm"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* --- TẤT CẢ MODAL ĐẶT Ở ĐÂY (Lấy từ code 2) --- */}

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center">
              <QrCode className="mx-auto h-16 w-16 text-blue-600 mb-4" />
              <h2 className="text-xl font-semibold mb-2">QR Code Scanner</h2>
              <p className="text-gray-600 mb-6">
                Scan the QR code on the product to view order details
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 mb-4">
                <p className="text-gray-500">Camera view would appear here</p>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowQRScanner(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleQRScan}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  Simulate Scan
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Inspection Modal (Modal chi tiết từ code 2) */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  Product Inspection - {selectedOrder.id}
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">
                      Customer Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm text-gray-500">Name</Label>
                        <p className="font-medium">
                          {selectedOrder.customerInfo.name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Phone</Label>
                        <p className="font-medium">
                          {selectedOrder.customerInfo.phone}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Email</Label>
                        <p className="font-medium">
                          {selectedOrder.customerInfo.email}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">Address</Label>
                        <p className="font-medium">
                          {selectedOrder.customerInfo.address}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">City</Label>
                        <p className="font-medium">
                          {selectedOrder.customerInfo.city}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">State</Label>
                        <p className="font-medium">
                          {selectedOrder.customerInfo.state}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3">
                      Product Details
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.products.map((product, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded border"
                        >
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <Label className="text-xs text-gray-500">
                                Product
                              </Label>
                              <p className="font-medium">{product.name}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">
                                Quantity
                              </Label>
                              <p className="font-medium">{product.quantity}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">
                                Size
                              </Label>
                              <p className="font-medium">{product.size}</p>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">
                                Accessory
                              </Label>
                              <p className="font-medium">
                                {product.accessory}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="mt-4">
                        <Label className="text-sm text-gray-500">Staff</Label>
                        <p className="font-medium">{selectedOrder.staff}</p>
                      </div>
                      <div>
                        <Label className="text-sm text-gray-500">
                          QR Code
                        </Label>
                        <p className="font-medium">{selectedOrder.qrCode}</p>
                      </div>
                      {selectedOrder.productDetails.specialInstructions && (
                        <div>
                          <Label className="text-sm text-gray-500">
                            Special Instructions
                          </Label>
                          <p className="font-medium">
                            {
                              selectedOrder.productDetails
                                .specialInstructions
                            }
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Files Comparison */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Customer Files */}
                  <div>
                    <h3 className="font-medium mb-3">
                      Customer Requirements
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.customerFiles.map((file, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          {file.type === "image" ? (
                            <img
                              src={file.url || "/placeholder.svg"}
                              alt={file.name}
                              className="w-full h-32 object-cover rounded mb-2"
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 rounded mb-2 flex items-center justify-center">
                              <ImageIcon className="h-8 w-8 text-gray-400" />
                            </div>
                          )}
                          <p className="text-sm text-gray-600">{file.name}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full bg-transparent"
                            onClick={() => handleDownload(file.url, file.name)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Design Files (Từ code 2) */}
                  <div>
                    <h3 className="font-medium mb-3">Designer's Design</h3>
                    <div className="space-y-3">
                      {selectedOrder.designFiles.map((file, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <img
                            src={file.url || "/placeholder.svg"}
                            alt="Design"
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                          <p className="text-sm text-gray-600">{file.name}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full bg-transparent"
                            onClick={() => handleDownload(file.url, file.name)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Manufactured Products */}
                  <div>
                    <h3 className="font-medium mb-3">
                      Manufactured Products
                    </h3>
                    <div className="space-y-3">
                      {selectedOrder.productImages.map((file, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <img
                            src={file.url || "/placeholder.svg"}
                            alt="Manufactured Product"
                            className="w-full h-32 object-cover rounded mb-2"
                          />
                          <p className="text-sm text-gray-600">{file.name}</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 w-full bg-transparent"
                            onClick={() => handleDownload(file.url, file.name)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleReject(selectedOrder.id)}
                    className="text-red-600 border-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Reject Product
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedOrder.id)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Approve for Shipping
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Reject Product</h3>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reject-reason">Reason for rejection</Label>
                <Textarea
                  id="reject-reason"
                  placeholder="Please provide a detailed reason for rejecting this product..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={4}
                />
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
                className="bg-red-600 hover:bg-red-700"
                disabled={!rejectReason.trim()}
              >
                Reject Product
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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