"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Printer } from "lucide-react";
import apiClient from "../../../../lib/apiClient";

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

  if (loading) return <FullScreenMessage message="Loading order details..." />;
  if (error) return <FullScreenMessage message={`Error: ${error}`} />;
  if (!orderDetail) return <FullScreenMessage message="Order detail not found" />;

  const product = orderDetail.productVariant?.product;
  const productImageUrl = orderDetail.linkImg
    ? orderDetail.linkImg.startsWith("http")
      ? orderDetail.linkImg
      : `${apiClient.defaults.baseURL}/${orderDetail.linkImg}`
    : null;

  const statusString = STATUS_MAP[orderDetail.productionStatus] || "UNKNOWN";
  const statusVariant = getBadgeVariant(statusString);
  const trackingCode = orderDetail?.order?.tracking || orderDetail?.trackingCode;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
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
            { label: "Base Cost", value: `$${orderDetail.productVariant?.baseCost.toFixed(2)}` },
            { label: "Ship Cost", value: `$${orderDetail.productVariant?.shipCost.toFixed(2)}` },
            { label: "Extra Shipping", value: `$${orderDetail.productVariant?.extraShipping.toFixed(2)}` },
            { label: "Total Cost", value: `$${orderDetail.productVariant?.totalCost.toFixed(2)}`, className: "font-semibold text-lg" },
          ]} />
        </InfoCard>

        {orderDetail.note && (
          <InfoCard title="Notes">
            <p className="text-gray-700">{orderDetail.note}</p>
          </InfoCard>
        )}

        {/* Accept / Reject Buttons */}
        <div className="flex justify-end gap-4">
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
    </div>
  );
}

/* --- COMPONENTS --- */
const FullScreenMessage = ({ message }) => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-lg text-gray-600">{message}</div>
  </div>
);

const HeaderSection = ({ orderDetail, product, statusString, statusVariant, trackingCode, isPrinting, onPrint, router }) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
    <div className="flex-grow">
      <h1 className="text-3xl font-bold text-gray-900">Order Detail #{orderDetail.orderDetailId}</h1>
      <p className="text-gray-600 mt-1 text-sm sm:text-base">Order ID: {orderDetail.orderId} | Product: {product?.productName || "N/A"}</p>
      <div className="mt-2 flex items-center gap-2">
        <Badge variant={statusVariant} className="text-sm px-3 py-1">Status: {statusString}</Badge>
        {trackingCode && <span className="text-sm text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{trackingCode}</span>}
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
          In Label
        </Button>
      )}
      <Button onClick={() => router.back()} variant="outline" className="gap-2 flex-shrink-0">← Back</Button>
    </div>
  </div>
);

const ImagesSection = ({ productImageUrl, designFile }) => (
  <Card className="p-6 mb-6">
    <h2 className="text-xl font-semibold mb-4">Images</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {productImageUrl && (
        <div>
          <p className="font-medium mb-2 text-gray-700">Product Image</p>
          <a href={productImageUrl} target="_blank" rel="noopener noreferrer">
            <img src={productImageUrl} alt="Product" className="w-full h-80 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer" />
          </a>
          <p className="text-sm text-gray-500 mt-2">Click to view full size</p>
        </div>
      )}
      {designFile && (
        <div>
          <p className="font-medium mb-2 text-gray-700">Design File</p>
          <a href={designFile} target="_blank" rel="noopener noreferrer">
            <img src={designFile} alt="Design file" className="w-full h-80 object-cover rounded-lg border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer" />
          </a>
          <p className="text-sm text-gray-500 mt-2">Click to view full size</p>
        </div>
      )}
    </div>
  </Card>
);

const InfoCard = ({ title, children }) => (
  <Card className="p-6 mb-6">
    <h2 className="text-xl font-semibold mb-4">{title}</h2>
    {children}
  </Card>
);

const InfoGrid = ({ items }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    {items.map((item, idx) => (
      <InfoItem key={idx} label={item.label} value={item.value} className={item.className} />
    ))}
  </div>
);

const InfoItem = ({ label, value, className = "" }) => (
  <div className={className}>
    <p className="text-sm text-gray-500 mb-1">{label}</p>
    <p className="font-medium text-gray-900">{value ?? "N/A"}</p>
  </div>
);

const ActionButton = ({ label, onClick, isLoading, destructive, success }) => (
  <Button
    onClick={onClick}
    size="lg"
    className={`px-8 ${destructive ? "bg-red-600 hover:bg-red-700 text-white" : ""} ${success ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
    disabled={isLoading}
  >
    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : label}
  </Button>
);

const StatusMessage = ({ label, success, destructive }) => (
  <div className={`px-8 py-3 rounded-md font-medium ${success ? "bg-green-100 text-green-700" : ""} ${destructive ? "bg-red-100 text-red-700" : ""}`}>
    {label}
  </div>
);
