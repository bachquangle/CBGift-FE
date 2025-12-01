"use client";

import OrderHeader from "./order-header";
import ProductItem from "./product-item";
import CustomerDetails from "./customer-details";
import ShippingAddress from "./shipping-address";
import BillingSummary from "./billing-summary";
import OrderActivity from "./order-activity";
import { useState } from "react";
import Swal from "sweetalert2";
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
  // const uploadImage = async (file) => {
  //   // Sử dụng FormData để gửi file
  //   const formData = new FormData();
  //   formData.append("File", file);
    
  //   try {
  //       const res = await fetch(
  //           `${apiClient.defaults.baseURL}/api/images/upload-media`,
  //           {
  //               method: "POST",
  //               credentials: "include",
  //               body: formData,
  //           }
  //       );

  //       if (!res.ok) {
  //           const errorText = await res.text();
  //           throw new Error(`Upload failed: ${res.status} - ${errorText}`);
  //       }

  //       const data = await res.json();
  //       // Giả định API trả về URL trong trường 'secureUrl', 'url', hoặc 'path'
  //       return data.secureUrl || data.url || data.path || null;
  //   } catch (err) {
  //       console.error("Upload error:", err);
  //       // Ném lỗi lên cấp độ submit để hiển thị alert
  //       throw new Error(`Lỗi mạng hoặc server khi tải file lên: ${err.message}`);
  //   }
  // };
    // Hàm xử lý Submit Refund CẤP ORDER
  const handleOrderRefundSubmit = async (data) => {
    // data: { orderId, reason, selectedItems, proofUrl }
    const { orderId, reason, selectedItems, proofUrl } = data;
    
    // let proofUrlResult = null;
    // const proofFile = data.proofFiles?.[0];

    // // 1. UPLOAD FILE NẾU CÓ
    // if (proofFile) {
    //     try {
    //         Swal.fire({
    //             title: "Uploading Proof...",
    //             text: "Please wait while your evidence is uploaded.",
    //             icon: "info",
    //             allowOutsideClick: false,
    //             showConfirmButton: false,
    //             didOpen: () => Swal.showLoading()
    //         });
    //         proofUrlResult = await uploadImage(proofFile); 
    //         if (!proofUrlResult) {
    //              throw new Error("Failed to get URL after upload.");
    //         }
    //     } catch (error) {
    //         Swal.fire("Upload Failed", `Network or server error during file upload.`, "error");
    //         return;
    //     }
    // }

    // 2. CẤU TRÚC PAYLOAD
    const payload = {
        orderId: Number(orderId), 
        reason: reason,
        proofUrl: proofUrl, 
        items: selectedItems.map(item => ({
            orderDetailId: item.orderDetailId,
            requestedAmount: item.refundAmount
        }))
    };

    // 3. GỌI API REFUND
    Swal.fire({ 
        title: "Submitting Request...", 
        allowOutsideClick: false, 
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
    });
    
    try {
        const response = await fetch(`${apiClient.defaults.baseURL}/api/Refund/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include',
        });

        if (!response.ok) {
            let errorDetail = "Failed to submit request.";
            try {
                const errorData = await response.json();
                errorDetail = errorData.message || errorData.title || JSON.stringify(errorData.errors);
            } catch (e) {
                // If response is not JSON, use the status text
            }
            throw new Error(errorDetail);
        }
        
        // Thành công
        Swal.fire("Success! 🎉", "Your refund request has been submitted and is pending staff review.", "success");
        setIsOrderRefundModalOpen(false); 
        // window.location.reload(); // Hoặc router.refresh()
        
    } catch (error) {
        console.error("❌ Refund Submission Failed:", error);
        Swal.fire("Submission Failed", `Error: ${error.message}`, "error");
    }
  };
    // Hàm xử lý Submit Reprint CẤP ORDER
  const handleOrderReprintSubmit = async (data) => {
    // data: { orderId, reason, selectedItems, proofFiles }
    const { orderId, reason, selectedItems, proofFiles } = data;
    
    let proofUrlResult = null;
    const proofFile = proofFiles?.[0]; 

    // 1. UPLOAD FILE NẾU CÓ
    if (proofFile) {
        try {
            Swal.fire({
                title: "Uploading Design/Proof...",
                icon: "info",
                allowOutsideClick: false,
                showConfirmButton: false,
                didOpen: () => Swal.showLoading()
            });
            proofUrlResult = await uploadImage(proofFile); 
            if (!proofUrlResult) {
                 throw new Error("Failed to get URL after upload.");
            }
        } catch (error) {
            Swal.fire("Upload Failed", `Network or server error during file upload.`, "error");
            return;
        }
    }

    // 2. CẤU TRÚC PAYLOAD (SellerReprintRequestDto)
    const payload = {
        orderId: Number(orderId), 
        reason: reason,
        proofUrl: proofUrlResult, 
        
        selectedItems: selectedItems.map(item => ({
            originalOrderDetailId: item.originalOrderDetailId
        }))
    };

    // 3. GỌI API REPRINT REQUEST
    Swal.fire({ 
        title: "Submitting Reprint Request...", 
        allowOutsideClick: false, 
        showConfirmButton: false,
        didOpen: () => Swal.showLoading()
    });
    
    try {
        const response = await fetch(`${apiClient.defaults.baseURL}/api/Reprint/request`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'include',
        });

        if (!response.ok) {
            let errorDetail = "Failed to submit request.";
            try {
                const errorData = await response.json();
                errorDetail = errorData.message || errorData.title || JSON.stringify(errorData.errors);
            } catch (e) {
                // If response is not JSON, use the status text
            }
            throw new Error(errorDetail);
        }
        
        // Thành công
        Swal.fire("Success! 🎉", "Your reprint request has been submitted and is pending staff review.", "success");
        setIsOrderReprintModalOpen(false); 

    } catch (error) {
        console.error("❌ Reprint Submission Failed:", error);
        Swal.fire("Submission Failed", `Error: ${error.message}`, "error");
    }
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
          trackingCode = {order.trackingCode}
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
