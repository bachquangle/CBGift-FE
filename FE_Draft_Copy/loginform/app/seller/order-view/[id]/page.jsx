// File: app/seller/order-view/[id]/page.jsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // Dùng hook của Next.js
import OrderView from "@/components/order-view/order-view";

// 1. Ánh xạ ProductionStatus Enum/Code sang Tên Hiển thị
const PRODUCTION_STATUS_MAP = {
  0: "DRAFT",
  1: "CREATED",
  2: "NEED_DESIGN",
  3: "DESIGNING",
  4: "CHECK_DESIGN",
  5: "DESIGN_REDO",
  6: "READY_PROD",
  7: "IN_PROD",
  8: "FINISHED",
  9: "QC_DONE",
  10: "QC_FAIL",
  11: "PROD_REWORK",
  12: "PACKING",
  13: "HOLD",
  14: "CANCELLED",
};

// Hàm map dữ liệu từ API sang cấu trúc UI cần
const mapApiToUiData = (apiData) => {
  if (!apiData) return null;

  // Xử lý Customer Name
  const fullName = apiData.customerName || "Unknown";
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || "";

  // Xử lý Billing
  const productionCosts = apiData.details.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = apiData.totalCost - productionCosts; 

  // 2. Định nghĩa các cột mốc chính cho Timeline
  const MAIN_PRODUCTION_STEPS = [1, 6, 7, 12, 9]; // CREATED, READY_PROD, IN_PROD, PACKING, QC_DONE

  // [FIX] Logic Activity Timeline mới: Tách Draft và Confirmed
  // 1. Luôn có sự kiện tạo bản nháp (dựa vào creationDate)
  const activitiesLog = [
    {
      date: new Date(apiData.creationDate).toLocaleString(),
      title: "Order Draft Created",
      description: "Draft created successfully, waiting for confirmation.",
    },
  ];

  // 2. Kiểm tra xem OrderDate có hợp lệ không (tức là đã Confirm)
  // Check khác null và khác "Invalid Date"
  const isConfirmed = apiData.orderDate && !isNaN(new Date(apiData.orderDate).getTime());

  if (isConfirmed) {
    // Nếu đã Confirm, thêm sự kiện này vào timeline
    activitiesLog.push({
      date: new Date(apiData.orderDate).toLocaleString(),
      title: "Order Confirmed", 
      description: "Order confirmed & sent to production.",
    });
  }

  // 3. Kiểm tra Refund (Logic cũ của bạn)
  if (apiData.latestRefundId) {
    activitiesLog.push({
      date: "Recent",
      title: "Refund Requested",
      description: `Amount: ${apiData.refundAmount} - Reason: ${apiData.reason}`,
    });
  }
  // [END FIX]

  return {
    id: apiData.orderCode || apiData.orderId.toString(),
    status: apiData.statusOderName || "PENDING",
    createdAt: apiData.creationDate,
    // [FIX] Thay "Null" bằng null để tránh lỗi Invalid Date ở UI
    orderDate: apiData.orderDate || null, 
    
    // Map danh sách sản phẩm
    products: apiData.details.map((item) => {
      const currentStatusCode = item.productionStatus ?? 0;
        
      return {
        id: item.orderDetailID,
        name: item.productName,
        currentStatusCode: currentStatusCode, 
        trackingCode: apiData.tracking?.trim() ? apiData.tracking.trim() : "N/A",
        sku: item.sku, 
        color: item.layer, 
        size: item.size,
        supplier: "CBGift Factory", 
        image: item.linkImg || "/placeholder.svg", 
        printSide: item.needDesign ? "Custom" : "Standard", 
        productionCost: `${item.price?.toLocaleString()} đ`,
        priceRaw: item.price ?? 0,
        trackingDetail: PRODUCTION_STATUS_MAP[currentStatusCode] || "UNKNOWN", 
        linkThanksCard: item.linkThanksCard, 
        linkFileDesign: item.linkFileDesign, 
        
        timeline: MAIN_PRODUCTION_STEPS.map((stepCode) => {
          const statusName = PRODUCTION_STATUS_MAP[stepCode];
          return {
            status: statusName,
            date: currentStatusCode >= stepCode ? apiData.creationDate : null, 
            completed: currentStatusCode >= stepCode,
          };
        }).filter(t => t.status),
      };
    }),

    customer: {
      firstName: firstName,
      lastName: lastName,
      email: apiData.email,
      mobile: apiData.phone,
    },

    shippingAddress: {
      street: apiData.address,
      city: apiData.shipCity,
      state: apiData.shipState,
      country: apiData.shipCountry,
      zipCode: apiData.zipcode,
    },

    billing: {
      productionCosts: `${productionCosts.toLocaleString()} đ`,
      shippingStandard: "Standard",
      shippingCost: `${shippingCost > 0 ? shippingCost.toLocaleString() : 0} đ`,
      surchargeFee: "0 đ", 
      taxCost: "0 đ", 
      totalCosts: `${apiData.totalCost?.toLocaleString()} đ`,
    },

    // [FIX] Đảo ngược mảng để sự kiện mới nhất (Confirm/Refund) nằm trên cùng
    activities: activitiesLog.reverse(), 
  };
};

export default function OrderViewPage() {
  const params = useParams();
  const router = useRouter();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!params.id) return;
      
      try {
        setLoading(true);
        // Thay đổi URL localhost này bằng env variable hoặc đường dẫn thật của bạn
        const response = await fetch(`https://localhost:7015/api/Order/${params.id}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
          throw new Error("Failed to fetch order");
        }

        const data = await response.json();
        const mappedData = mapApiToUiData(data);
        setOrderData(mappedData);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  const handleCancel = () => {
    // Gọi API cancel order ở đây
    console.log("Cancel order logic");
  };

  const handleBack = () => {
    router.push('/seller/manage-order');
  };

  if (loading) return <div className="p-10 text-center">Loading order details...</div>;
  if (error) return <div className="p-10 text-center text-red-500">Error: {error}</div>;

  return (
    <OrderView
      order={orderData}
      onCancel={handleCancel}
      onBack={handleBack}
    />
  );
}