// File: app/seller/order-view/[id]/page.jsx

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation"; // Dùng hook của Next.js
import OrderView from "@/components/order-view/order-view";
import apiClient from "../../../../lib/apiClient";

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
  12: "SHIPPING", // Cập nhật từ PACKING -> SHIPPING
  13: "SHIPPED", // Thêm mới
  14: "HOLD_RF", // Thêm mới
  15: "HOLD_RP", // Thêm mới
  16: "REFUND", // Thêm mới
};

// Hàm map dữ liệu từ API sang cấu trúc UI cần
const mapApiToUiData = (apiData) => {
  if (!apiData) return null;

  // Xử lý Customer Name, Billing... (giữ nguyên)
  const fullName = apiData.customerName || "Unknown";
  const nameParts = fullName.split(" ");
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || "";

  const productionCosts = apiData.details.reduce(
  (sum, item) => sum + (item.price ?? 0),
  0
  );

  const shippingCost = apiData.totalCost - productionCosts;

  // 2. Định nghĩa các cột mốc chính cho Timeline
  const MAIN_PRODUCTION_STEPS = [1, 3, 7, 12, 13];

  // --- 1. Bắt đầu Activity Log ---
  let activitiesLog = [];

  // Thêm sự kiện Draft (sử dụng CreationDate từ mergedData)
  activitiesLog.push({
    date: new Date(apiData.creationDate).toLocaleString(),
    title: "Order Draft Created",
    description: "Draft created successfully, waiting for confirmation.",
  });

  // Thêm sự kiện Confirmed (sử dụng OrderDate từ mergedData)
  const isConfirmed =
    apiData.orderDate && !isNaN(new Date(apiData.orderDate).getTime());

  if (isConfirmed) {
    activitiesLog.push({
      date: new Date(apiData.orderDate).toLocaleString(),
      title: "Order Confirmed",
      description: "Order confirmed & sent to production.",
    });
  }
  if (apiData.shippedDate) {
    activitiesLog.push({
      date: new Date(apiData.shippedDate).toLocaleString(),
      title: "Order Delivered",
      description: "Order has been successfully delivered to the customer.",
    });
  }

  // --- 2. ✨ XỬ LÝ REFUND CHI TIẾT (TỔNG HỢP TỪ allRefunds) ✨ ---
  if (apiData.allRefunds && apiData.allRefunds.length > 0) {
    apiData.allRefunds.forEach((refund) => {
      // Chi tiết các sản phẩm bị Refund
      const itemSummaries = refund.items
        .map((i) => {
          // Dùng null-coalescing cho ProductName/SKU vì API trả về có thể null
          const name = i.productName || `Item #${i.orderDetailId}`;
          return `${name} (Qty: ${
            i.quantity
          }, Amt: ${i.refundAmount.toLocaleString()}đ)`;
        })
        .join("; ");

      // Sự kiện 1: Yêu cầu Refund
      const requestDate = new Date(refund.createdAt).toLocaleString();

      activitiesLog.push({
        date: requestDate,
        title: "Refund Requested",
        description: `Total: ${refund.totalRequestedAmount.toLocaleString()} đ - Reason: ${
          refund.reason || "N/A"
        }. Items: ${itemSummaries}`,
      });

      // Sự kiện 2: Phản hồi/Xử lý Refund
      if (refund.status && refund.status !== "Pending") {
        const reviewDate = refund.reviewedAt
          ? new Date(refund.reviewedAt).toLocaleString()
          : "Recent";

        let responseDesc =
          refund.status === "Rejected"
            ? `Reason for rejection: ${refund.staffRejectionReason || "N/A"}`
            : `Refund approved and transferred. Items: ${itemSummaries}`;

        activitiesLog.push({
          date: reviewDate,
          title: `Refund ${refund.status}`,
          description: responseDesc,
        });
      }
    });
  }

  // --- 3. ✨ XỬ LÝ REPRINT CHI TIẾT (TỔNG HỢP TỪ allReprints) ✨ ---
  if (apiData.allReprints && apiData.allReprints.length > 0) {
    apiData.allReprints.forEach((reprint) => {
      // Lấy thông tin sản phẩm từ RequestedItems đầu tiên
      const item = reprint.requestedItems?.[0];

      const productInfo = item
        ? `${item.productName || `ID: ${item.orderDetailId}`} (${
            item.SKU || "N/A"
          })`
        : "Unknown Product";
      const requestedQty = item?.quantity || "N/A";

      const requestDate = new Date(reprint.requestDate).toLocaleString();

      // Sự kiện 1: Yêu cầu Reprint
      activitiesLog.push({
        date: requestDate,
        title: "Reprint Requested",
        description: `Product: ${productInfo} (Qty: ${requestedQty}). Reason: ${reprint.reason}.`,
      });

      // Sự kiện 2: Phản hồi Reprint
      if (reprint.status && reprint.status !== "Pending") {
        activitiesLog.push({
          date: "N/A", // Sử dụng ReprintReviewDate nếu có
          title: `Reprint ${reprint.status}`,
          description:
            reprint.status === "Rejected"
              ? `Rejection reason: ${reprint.rejectionReason}. Product: ${productInfo}`
              : `New production task approved for: ${productInfo}`,
        });
      }
    });
  }
  // --- END ACTIVITY LOG ---

  // Map danh sách sản phẩm (giữ nguyên logic cũ)
  return {
    id: apiData.orderId || apiData.orderId.toString(),
    orderCode: apiData.orderCode,
    status: apiData.statusOderName || "PENDING",
    createdAt: apiData.creationDate,
    orderDate: apiData.orderDate || null,
    trackingCode: apiData.tracking?.trim() ? apiData.tracking.trim() : "N/A",
    products: apiData.details.map((item) => {
      const currentStatusCode = item.productionStatus ?? 0;

      return {
        id: item.orderDetailID,
        name: item.productName,
        currentStatusCode: currentStatusCode,
        sku: item.sku,
        color: item.layer,
        size: item.size,
        supplier: "CBGift Fulfillment",
        image: item.linkImg || "/placeholder.svg",
        quantity: item.quantity,
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
        }).filter((t) => t.status),
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

    // Đảo ngược mảng để sự kiện mới nhất nằm trên cùng
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
        
        // --- 1. LẤY CHI TIẾT ORDER CHÍNH ---
        // Sử dụng Promise.all để fetch đồng thời
        const orderPromise = fetch(`${apiClient.defaults.baseURL}/api/Order/${params.id}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        }).then(res => {
            if (!res.ok) throw new Error("Failed to fetch order details.");
            return res.json();
        });

        // --- 2. LẤY DỮ LIỆU HOẠT ĐỘNG (API MỚI) ---
        const activityPromise = fetch(`${apiClient.defaults.baseURL}/api/Order/${params.id}/activity`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        }).then(res => {
            if (!res.ok) throw new Error("Failed to fetch order activity.");
            return res.json();
        });

        // Thực thi đồng thời cả hai
        const [orderDataApi, activityDataApi] = await Promise.all([orderPromise, activityPromise]);

        // --- 3. GỘP DỮ LIỆU ---
        const mergedData = { 
            ...orderDataApi, 
            // Ghi đè/Bổ sung các trường hoạt động từ API mới
            allRefunds: activityDataApi.allRefunds || [], 
            allReprints: activityDataApi.allReprints || [],
            shippedDate: activityDataApi.shippedDate || orderDataApi.shippedDate,
            creationDate: activityDataApi.creationDate || orderDataApi.creationDate,
            orderDate: activityDataApi.orderDate || orderDataApi.orderDate,
        };

        const mappedData = mapApiToUiData(mergedData);
        setOrderData(mappedData);
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to fetch data.");
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
