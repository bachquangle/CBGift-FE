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
    // Hàm xử lý Submit Refund CẤP ORDER
    const handleOrderRefundSubmit = (data) => {
        console.log(`Submitting Refund for ALL products in Order ${order.id}:`, data);
        setIsOrderRefundModalOpen(false);
        // Logic gọi API Refund cho toàn bộ Order
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
