"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // Dùng hook của Next.js
import OrderView from "@/components/order-view/order-view";

// Hàm map dữ liệu từ API sang cấu trúc UI cần
const mapApiToUiData = (apiData) => {
  if (!apiData) return null;

  // Xử lý Customer Name
  const fullName = apiData.customerName || "Unknown";
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || "";

  // Xử lý Billing (API hiện tại chỉ có TotalCost, tạm tính các phí khác bằng 0 hoặc logic tự quy định)
  // Bạn cần update BE để có các trường shippingCost, taxCost thực tế
  const productionCosts = apiData.details.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingCost = apiData.totalCost - productionCosts; // Giả định

  return {
    id: apiData.orderCode || apiData.orderId.toString(),
    status: apiData.statusOderName || "PENDING",
    createdAt: apiData.creationDate,
    
    // Map danh sách sản phẩm
    products: apiData.details.map((item) => ({
      id: item.orderDetailID,
      name: item.productName,
      // Dữ liệu còn thiếu từ API, dùng placeholder hoặc dữ liệu tạm
      sku: `VAR-${item.productVariantID}`, // API thiếu SKU
      color: "Default", // API thiếu Color
      size: item.size,
      supplier: "CBGift Factory", // API thiếu Supplier
      image: item.linkImg || "https://via.placeholder.com/100",
      printSide: item.needDesign ? "Custom" : "Standard", // API thiếu PrintSide
      productionCost: `${item.price?.toLocaleString()} đ`,
      trackingDetail: item.productionStatus?.toString(),
      
      // Tạo timeline giả lập dựa trên trạng thái hiện tại (Do API thiếu lịch sử chi tiết)
      timeline: [
        {
          status: "Ordered",
          date: apiData.creationDate,
          completed: true,
        },
        {
          status: "Processing",
          date: null,
          completed: item.productionStatus >= 1, // Logic ví dụ
        },
        {
            status: "Shipped",
            date: null,
            completed: item.productionStatus === 9, // Ví dụ 9 là shipped
        }
      ],
    })),

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
      surchargeFee: "0 đ", // API thiếu
      taxCost: "0 đ", // API thiếu
      totalCosts: `${apiData.totalCost?.toLocaleString()} đ`,
    },

    // API chưa có Activity Log, tạo mảng rỗng hoặc lấy CreationDate làm mốc đầu
    activities: [
      {
        date: new Date(apiData.creationDate).toLocaleString(),
        title: "Order Created",
        description: "Order has been placed successfully",
      },
      // Nếu có refund, hiển thị thêm
      ...(apiData.latestRefundId ? [{
        date: "Recent",
        title: "Refund Requested",
        description: `Amount: ${apiData.refundAmount} - Reason: ${apiData.reason}`,
      }] : [])
    ],
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
                // Thêm Authorization header nếu cần thiết
                // 'Authorization': `Bearer ${token}` 
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
    router.back();
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