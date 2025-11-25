"use client";

import OrderHeader from "./order-header";
import ProductItem from "./product-item";
import CustomerDetails from "./customer-details";
import ShippingAddress from "./shipping-address";
import BillingSummary from "./billing-summary";
import OrderActivity from "./order-activity";
import { useState } from "react";
import RequestRefundModal from "@/components/modals/RequestRefundModal"; 
import RequestReprintModal from "@/components/modals/RequestReprintModal";
import apiClient from "../../lib/apiClient";


const isOrderEligibleForPostShippingActions = (status) => {
      // Chỉ cho phép nếu trạng thái là COMPLETED (hoặc SHIPPED/DELIVERED)
      const eligibleStatuses = ["COMPLETED", "SHIPPED", "DELIVERED"]; 
      return eligibleStatuses.includes(status.toUpperCase());
  };
export default function OrderView({
  order,
  onCancel,
  onBack,
}) {
  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }
  // Hàm helper để kiểm tra trạng thái Order
  
  const [isOrderRefundModalOpen, setIsOrderRefundModalOpen] = useState(false);
  const [isOrderReprintModalOpen, setIsOrderReprintModalOpen] = useState(false);
  const isEligible = isOrderEligibleForPostShippingActions(order.status);
  const uploadImage = async (file) => {
    // Sử dụng FormData để gửi file
    const formData = new FormData();
    formData.append("File", file);
    
    try {
        const res = await fetch(
            `${apiClient.defaults.baseURL}/api/images/upload-media`,
            {
                method: "POST",
                credentials: "include",
                body: formData,
            }
        );

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Upload failed: ${res.status} - ${errorText}`);
        }

        const data = await res.json();
        // Giả định API trả về URL trong trường 'secureUrl', 'url', hoặc 'path'
        return data.secureUrl || data.url || data.path || null;
    } catch (err) {
        console.error("Upload error:", err);
        // Ném lỗi lên cấp độ submit để hiển thị alert
        throw new Error(`Lỗi mạng hoặc server khi tải file lên: ${err.message}`);
    }
  };
    // Hàm xử lý Submit Refund CẤP ORDER
  const handleOrderRefundSubmit = async (data) => {
    // data: { orderId, reason, selectedItems, proofFiles }
    const { orderId, reason, selectedItems, proofFiles } = data;
    
    let proofUrl = null;
    const proofFile = proofFiles?.[0]; // Lấy đối tượng File duy nhất (do bạn đã sửa Modal chỉ nhận 1 file)

    // 1. TẢI FILE LÊN NẾU CÓ
    if (proofFile) {
        try {
            console.log(`Đang tải lên bằng chứng: ${proofFile.name}`);
            proofUrl = await uploadImage(proofFile); 
            if (!proofUrl) {
                 throw new Error("Tải lên bằng chứng thất bại, URL trả về trống.");
            }
        } catch (error) {
            // Xử lý lỗi tải file và dừng submission
            alert(error.message);
            return;
        }
    }
    // 2. CẤU TRÚC PAYLOAD (RefundRequestDto)
    const payload = {
        orderId: Number(orderId),
        reason: reason,
        proofUrl: proofUrl, // Gửi URL duy nhất (hoặc null)
        
        // Map selectedItems để khớp với cấu trúc DTO C#
        items: selectedItems.map(item => ({
            orderDetailId: item.orderDetailId,
            requestedAmount: item.refundAmount
        }))
    };
    // ✨ HIỂN THỊ DỮ LIỆU CUỐI CÙNG TRƯỚC KHI GỬI ✨
    console.log("------------------- FINAL REFUND PAYLOAD -------------------");
    console.log(payload);
    console.log("------------------------------------------------------------");

    // 3. GỌI API REFUND
    try {
        const response = await fetch(`${apiClient.defaults.baseURL}/api/Refund/request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'include',
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Lỗi API: ${response.status}`);
        }
        
        // Thành công: Đóng modal và thông báo
        alert("✅ Yêu cầu hoàn tiền đã được gửi thành công!");
        setIsOrderRefundModalOpen(false); 
        // window.location.reload(); 

    } catch (error) {
        console.error("❌ Refund Submission Failed:", error);
        alert(`❌ Gửi yêu cầu thất bại: ${error.message}`);
    }
  };

    // Hàm xử lý Submit Reprint CẤP ORDER
    const handleOrderReprintSubmit = (data) => {
        console.log(`Submitting Reprint for ALL products in Order ${order.id}:`, data);
        setIsOrderReprintModalOpen(false);
        // Logic gọi API Reprint cho toàn bộ Order
    };

  return (
    <>
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <OrderHeader
          orderId={order.id}
          orderCode={order.orderCode}
          status={order.status}
          createdAt={order.createdAt}
          orderDate={order.orderDate}
          onCancel={onCancel}
          onBack={onBack}
          isEligible={isEligible} 
          orderStatus={order.status}
          onOpenRefund={() => setIsOrderRefundModalOpen(true)}
          onOpenReprint={() => setIsOrderReprintModalOpen(true)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Products */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Products
              </h2>
              {order.products && order.products.length > 0 ? (
                                    order.products.map((product, idx) => (
                                        // ✨ TRUYỀN ĐIỀU KIỆN XUỐNG PRODUCT ITEM ✨
                                        <ProductItem 
                                            key={idx} 
                                            product={product} 
                                            isOrderEligible={isEligible}
                                            orderStatus={order.status}
                                        /> 
                                    ))
                                ) : (
                <p className="text-gray-500 py-4">No products in order</p>
              )}
            </div>

            {/* Activity Timeline */}
            {order.activities && (
              <OrderActivity activities={order.activities} />
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-4">
              {/* Customer Details */}
              {order.customer && (
                <CustomerDetails customer={order.customer} />
              )}

              {/* Shipping Address */}
              {order.shippingAddress && (
                <ShippingAddress address={order.shippingAddress} />
              )}

              {/* Billing Summary */}
              {order.billing && (
                <BillingSummary billing={order.billing} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* 🚀 Render Modals CẤP ORDER 🚀 */}
            <RequestRefundModal 
                isOpen={isOrderRefundModalOpen}
                onClose={() => setIsOrderRefundModalOpen(false)}
                // Truyền toàn bộ Order object hoặc chi tiết bạn cần
                productDetail={order} 
                onSubmit={handleOrderRefundSubmit}
            />

            <RequestReprintModal 
                isOpen={isOrderReprintModalOpen}
                onClose={() => setIsOrderReprintModalOpen(false)}
                productDetail={order} 
                onSubmit={handleOrderReprintSubmit}
            />
    </>
  );
}
