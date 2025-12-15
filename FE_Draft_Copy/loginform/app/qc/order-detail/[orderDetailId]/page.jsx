"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer, Tag } from "lucide-react"; // ĐÃ SỬA: Thêm import Tag
import apiClient from "../../../../lib/apiClient";
import QcSidebar from "@/components/layout/qc/sidebar";
import QcHeader from "@/components/layout/qc/header";

// --- MAPPING STATUS ---
const STATUS_MAP = {
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
  12: "SHIPPING",
  13: "HOLD",
  14: "REFUND",
};

const STATUS_BADGE = {
  destructive: ["QC_FAIL", "DESIGN_REDO", "PROD_REWORK", "REFUND", "HOLD"],
  success: ["QC_DONE", "FINISHED", "SHIPPING"],
  secondary: ["CHECK_DESIGN", "IN_PROD", "DESIGNING"],
  default: ["READY_PROD"],
};

const getBadgeVariant = (status) => {
  for (const key in STATUS_BADGE) {
    if (STATUS_BADGE[key].includes(status)) return key;
  }
  return "outline";
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderDetailId = params.orderDetailId;

  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  // --- FETCH ORDER DETAIL ---
  const fetchOrderDetail = async () => {
    try {
      const res = await fetch(`${apiClient.defaults.baseURL}/api/OrderDetail/${orderDetailId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setOrderDetail(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch order detail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderDetailId) fetchOrderDetail();
  }, [orderDetailId]);

  const fetchLatestData = async () => {
    try {
      const res = await fetch(`${apiClient.defaults.baseURL}/api/OrderDetail/${orderDetailId}`);
      if (res.ok) {
        const data = await res.json();
        setOrderDetail(data);
      }
    } catch (err) {
      console.error("Error refetching order detail:", err);
    }
  };

  // --- PRINT LABEL (SILENT PRINT VIA HTML) ---
  const handlePrintA5 = async () => {
    const trackingCode = orderDetail?.order?.tracking || orderDetail?.trackingCode;
    if (!trackingCode) return alert("Đơn hàng này chưa có mã vận đơn (Tracking Code).");

    setIsPrinting(true);

    try {
      const res = await fetch(`${apiClient.defaults.baseURL}/api/ShippingPrint/get-print-html`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ OrderCodes: [trackingCode], Size: "A5" }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Không thể lấy nội dung in");
      
      let htmlContent = data.htmlContent;
      if (!htmlContent) throw new Error("Backend không trả về dữ liệu HTML.");

      htmlContent = htmlContent.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "");

      const oldIframe = document.getElementById("hidden-print-frame");
      if (oldIframe) document.body.removeChild(oldIframe);

      const iframe = document.createElement("iframe");
      iframe.id = "hidden-print-frame";
      iframe.style.position = "fixed";
      iframe.style.opacity = "0"; 
      iframe.style.pointerEvents = "none";
      iframe.style.zIndex = "-1";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;

      iframe.onload = () => {
        iframe.onload = null;

        try {
          const iframeDoc = iframe.contentWindow.document;
          
          const style = iframeDoc.createElement('style');
          style.innerHTML = `
            .loading, #loading, .loader, .progress, .ng-progress-bar, .ng-progress { display: none !important; }
          `;
          iframeDoc.head.appendChild(style);

          const allElements = iframeDoc.body.getElementsByTagName("*");
          for (let i = 0; i < allElements.length; i++) {
             const el = allElements[i];
             if (el.textContent && (el.textContent.includes("Đang tải") || el.textContent.includes("Loading"))) {
                 el.style.display = "none";
                 el.style.visibility = "hidden";
                 if (el.parentElement) {
                    const parentStyle = window.getComputedStyle(el.parentElement);
                    if (parentStyle.position === 'fixed' || parentStyle.position === 'absolute') {
                        el.parentElement.style.display = 'none';
                    }
                 }
             }
          }
        } catch (e) {
          console.warn(e);
        }

        setTimeout(() => {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } catch (e) {
            console.error(e);
          }
        }, 500);
      };

      doc.open();
      doc.write(htmlContent);
      doc.close();

    } catch (err) {
      console.error(err);
      alert(`Lỗi khi in: ${err.message}`);
    } finally {
      setIsPrinting(false);
    }
  };

  // --- ACCEPT / REJECT ---
  const handleAccept = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiClient.defaults.baseURL}/api/OrderDetail/${orderDetailId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      alert(`Order Detail #${orderDetailId} đã được chấp nhận.`);
      fetchLatestData();
    } catch (err) {
      console.error(err);
      alert(`Failed to accept order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt("Vui lòng nhập lý do từ chối (ít nhất 10 ký tự):");
    if (!reason || reason.trim().length < 10) return alert("Lý do phải ≥ 10 ký tự.");

    setIsSubmitting(true);
    try {
      const res = await fetch(`${apiClient.defaults.baseURL}/api/OrderDetail/${orderDetailId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || `HTTP ${res.status}`);
      }
      alert(`Order Detail #${orderDetailId} đã bị từ chối.`);
      fetchLatestData();
    } catch (err) {
      console.error(err);
      alert(`Failed to reject order: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare data for rendering
  const product = orderDetail?.productVariant?.product;
  const productImageUrl = orderDetail?.linkImg
    ? orderDetail.linkImg.startsWith("http")
      ? orderDetail.linkImg
      : `${apiClient.defaults.baseURL}/${orderDetail.linkImg}`
    : null;

  const statusString = orderDetail ? (STATUS_MAP[orderDetail.productionStatus] || "UNKNOWN") : "";
  const statusVariant = getBadgeVariant(statusString);
  const trackingCode = orderDetail?.order?.tracking || orderDetail?.trackingCode;

  // --- LOGIC HIỂN THỊ MÃ ĐƠN HÀNG MỚI (ĐÃ SỬA) ---
  const displayOrderCode = orderDetail?.order?.orderCode
    ? (orderDetail.totalItems && orderDetail.itemIndex
        ? `${orderDetail.order.orderCode}_${orderDetail.totalItems}IT_${orderDetail.itemIndex}`
        : orderDetail.order.orderCode)
    : "";

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <QcSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <QcHeader />
        
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 p-6">
          {loading ? (
            <FullScreenMessage message="Loading order details..." />
          ) : error ? (
            <FullScreenMessage message={`Error: ${error}`} />
          ) : !orderDetail ? (
            <FullScreenMessage message="Order detail not found" />
          ) : (
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <HeaderSection
                orderDetail={orderDetail}
                product={product}
                statusString={statusString}
                statusVariant={statusVariant}
                trackingCode={trackingCode}
                isPrinting={isPrinting}
                onPrint={handlePrintA5}
                router={router}
                displayOrderCode={displayOrderCode} // Truyền vào Header
              />

              {/* Images */}
              {(productImageUrl || orderDetail.linkFileDesign) && (
                <ImagesSection productImageUrl={productImageUrl} designFile={orderDetail.linkFileDesign} />
              )}

              {/* Info Cards */}
              <InfoCard title="Order Information">
                <InfoGrid items={[
                  { label: "Order Detail ID", value: orderDetail.orderDetailId },
                  { label: "Order ID", value: orderDetail.orderId },
                  { label: "Quantity", value: orderDetail.quantity },
                  { label: "Price", value: `$${orderDetail.price.toFixed(2)}` },
                  { label: "Created Date", value: new Date(orderDetail.createdDate).toLocaleString() },
                  { label: "Production Status", value: orderDetail.productionStatus },
                  { label: "Need Design", value: orderDetail.needDesign ? "Yes" : "No" },
                  { label: "Assigned At", value: orderDetail.assignedAt ? new Date(orderDetail.assignedAt).toLocaleString() : "Not assigned" },
                  { label: "Designer ID", value: orderDetail.assignedDesignerUserId || "Not assigned" },
                ]} />
              </InfoCard>

              <InfoCard title="Product Information">
                <InfoGrid items={[
                  { label: "Product Name", value: product?.productName },
                  { label: "Product Code", value: product?.productCode },
                  { label: "Category ID", value: product?.categoryId },
                  { label: "Status", value: product?.status },
                  { label: "SKU", value: orderDetail.productVariant?.sku },
                  { label: "Accessory", value: orderDetail.accessory },
                ]} />
                {product?.describe && (
                  <p className="text-gray-600 mt-2">{product.describe}</p>
                )}
              </InfoCard>

              <InfoCard title="Product Variant Details">
                <InfoGrid items={[
                  { label: "Size (inch)", value: orderDetail.productVariant?.sizeInch },
                  { label: "Thickness (mm)", value: orderDetail.productVariant?.thicknessMm },
                  { label: "Layer", value: orderDetail.productVariant?.layer },
                  { label: "Custom Shape", value: orderDetail.productVariant?.customShape },
                  { label: "Length (cm)", value: orderDetail.productVariant?.lengthCm },
                  { label: "Height (cm)", value: orderDetail.productVariant?.heightCm },
                  { label: "Width (cm)", value: orderDetail.productVariant?.widthCm },
                  { label: "Weight (gram)", value: orderDetail.productVariant?.weightGram },
                ]} />
              </InfoCard>

              <InfoCard title="Cost Breakdown">
                <InfoGrid items={[
                  { label: "Base Cost", value: `$${orderDetail.productVariant?.baseCost.toLocaleString("vi-VN")}` },
                  { label: "Ship Cost", value: `$${orderDetail.productVariant?.shipCost.toLocaleString("vi-VN")}` },
                  { label: "Extra Shipping", value: `$${orderDetail.productVariant?.extraShipping.toLocaleString("vi-VN")}` },
                  { label: "Total Cost", value: `$${orderDetail.productVariant?.totalCost.toLocaleString("vi-VN")}`, className: "font-semibold text-lg" },
                ]} />
              </InfoCard>

              {orderDetail.note && (
                <InfoCard title="Notes">
                  <p className="text-gray-700">{orderDetail.note}</p>
                </InfoCard>
              )}

              {/* Accept / Reject Buttons */}
              <div className="flex justify-end gap-4 mt-6 mb-10">
                {orderDetail.productionStatus === 8 ? (
                  <>
                    <ActionButton label="Reject Order" onClick={handleReject} isLoading={isSubmitting} destructive />
                    <ActionButton label="Accept Order" onClick={handleAccept} isLoading={isSubmitting} success />
                  </>
                ) : orderDetail.productionStatus === 9 ? (
                  <StatusMessage label="Already Accepted" success />
                ) : orderDetail.productionStatus === 10 ? (
                  <StatusMessage label="Already Rejected" destructive />
                ) : null}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

/* --- COMPONENTS --- */
const FullScreenMessage = ({ message }) => (
  <div className="flex items-center justify-center h-full">
    <div className="text-lg text-gray-500 font-medium">{message}</div>
  </div>
);

// ĐÃ SỬA: Nhận displayOrderCode làm prop
const HeaderSection = ({ orderDetail, product, statusString, statusVariant, trackingCode, isPrinting, onPrint, router, displayOrderCode }) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex-grow">
      {/* Hiển thị Mã Đơn Hàng Mới */}
      <h1 className="text-2xl font-bold text-slate-800">
        Order Code: {displayOrderCode || orderDetail.order.orderCode}
      </h1>
      <p className="text-slate-500 mt-1 text-sm sm:text-base">
        Order Detail # <span className="font-medium text-slate-700">{orderDetail.orderDetailId}</span> | Product: <span className="font-medium text-slate-700">{product?.productName || "N/A"}</span>
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant={statusVariant} className="text-sm px-3 py-1">{statusString}</Badge>
        {trackingCode && (
          <span className="text-sm text-slate-600 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1">
            <Tag className="w-3 h-3"/> {trackingCode}
          </span>
        )}
      </div>
    </div>
    <div className="flex gap-3">
      {trackingCode && (
        <Button
          variant="default"
          onClick={onPrint}
          disabled={isPrinting}
          className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          {isPrinting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Printer className="h-4 w-4" />}
          Print Label
        </Button>
      )}
      <Button onClick={() => router.back()} variant="outline" className="gap-2 flex-shrink-0 bg-white hover:bg-slate-50">
        Back
      </Button>
    </div>
  </div>
);

const ImagesSection = ({ productImageUrl, designFile }) => (
  <Card className="p-6 mb-6 border-slate-200 shadow-sm">
    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
        Images & Files
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {productImageUrl && (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <p className="font-medium mb-3 text-slate-700">Product Image</p>
          <a href={productImageUrl} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-lg border border-slate-200">
            <img src={productImageUrl} alt="Product" className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-800 text-xs px-3 py-1 rounded-full font-medium shadow-sm transition-opacity">View Full Size</span>
            </div>
          </a>
        </div>
      )}
      {designFile && (
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
          <p className="font-medium mb-3 text-slate-700">Design File</p>
          <a href={designFile} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-lg border border-slate-200">
            <img src={designFile} alt="Design file" className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300" />
             <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 bg-white/90 text-slate-800 text-xs px-3 py-1 rounded-full font-medium shadow-sm transition-opacity">View Full Size</span>
            </div>
          </a>
        </div>
      )}
    </div>
  </Card>
);

const InfoCard = ({ title, children }) => (
  <Card className="p-6 mb-6 border-slate-200 shadow-sm">
    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
        {title}
    </h2>
    {children}
  </Card>
);

const InfoGrid = ({ items }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
    {items.map((item, idx) => (
      <InfoItem key={idx} label={item.label} value={item.value} className={item.className} />
    ))}
  </div>
);

const InfoItem = ({ label, value, className = "" }) => (
  <div className={`flex flex-col ${className}`}>
    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</span>
    <span className="text-sm font-semibold text-slate-900 break-words">{value ?? "N/A"}</span>
  </div>
);

const ActionButton = ({ label, onClick, isLoading, destructive, success }) => (
  <Button
    onClick={onClick}
    size="lg"
    className={`px-6 font-medium shadow-sm transition-all ${
        destructive 
        ? "bg-white text-red-600 border border-red-200 hover:bg-red-50 hover:border-red-300" 
        : success 
            ? "bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md" 
            : ""
    }`}
    disabled={isLoading}
  >
    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : label}
  </Button>
);

const StatusMessage = ({ label, success, destructive }) => (
  <div className={`px-6 py-3 rounded-lg font-semibold text-sm flex items-center gap-2 border ${
      success 
      ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
      : destructive 
        ? "bg-red-50 text-red-700 border-red-200" 
        : ""
  }`}>
    {success && <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
    {destructive && <div className="w-2 h-2 rounded-full bg-red-500"></div>}
    {label}
  </div>
);