"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Trash2,
  Pencil,
} from "lucide-react";
import apiClient from "@/lib/apiClient";
import Swal from "sweetalert2";
import { Checkbox } from "@/components/ui/checkbox";

// Circular Progress Component
const CircularProgress = ({ progress }) => (
  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
    <div className="relative w-12 h-12">
      <svg className="w-full h-full" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="4"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="#2563eb"
          strokeWidth="4"
          strokeDasharray={`${2 * Math.PI * 45}`}
          strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.3s" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-gray-700">
        {Math.round(progress)}%
      </div>
    </div>
  </div>
);

export default function EditOrderPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId;

  // Step Management
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // Customer Info State
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    address1: "",
    provinceId: "",
    provinceName: "",
    districtId: "",
    districtName: "",
    wardId: "",
    wardName: "",
  });

  // Location/Address State
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  // Custom dropdown search states
  const [searchProvince, setSearchProvince] = useState("");
  const [searchDistrict, setSearchDistrict] = useState("");
  const [searchWard, setSearchWard] = useState("");
  const [openProvinceDropdown, setOpenProvinceDropdown] = useState(false);
  const [openDistrictDropdown, setOpenDistrictDropdown] = useState(false);
  const [openWardDropdown, setOpenWardDropdown] = useState(false);
  const [hoverProvince, setHoverProvince] = useState(null);
  const [hoverDistrict, setHoverDistrict] = useState(null);
  const [hoverWard, setHoverWard] = useState(null);

  // ADDED: State to hold selected values for provinces, districts, wards
  const [selectedProvince, setSelectedProvince] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState("");

  const filteredProvinces = provinces.filter((p) =>
    p.name.toLowerCase().includes(searchProvince.toLowerCase())
  );

  const filteredDistricts = districts.filter((d) =>
    d.name.toLowerCase().includes(searchDistrict.toLowerCase())
  );

  const filteredWards = wards.filter((w) =>
    w.name.toLowerCase().includes(searchWard.toLowerCase())
  );

  // Products State (for manual product selection in Step 3 previously)
  const [products, setProducts] = useState([]); // Renamed from original 'products' to avoid confusion with catalogProducts
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState(""); // This seems to be for the old product list, might be redundant with catalog search
  // const [productItemsPerPage, setProductItemsPerPage] = useState(5) // Not used in current logic, potentially legacy

  // Step 3: Catalog Search & Filtering States
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [catalogPage, setCatalogPage] = useState(1); // Use catalogPage for catalog pagination
  const [catalogItemsPerPage, setCatalogItemsPerPage] = useState(3);
  const [catalogProducts, setCatalogProducts] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [totalCatalogProducts, setTotalCatalogProducts] = useState(0);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1); // Removzzed this as catalogPage is used for pagination

  // Current Product Configuration (for manual selection if needed, but mainly for catalog product processing)
  const [currentProduct, setCurrentProduct] = useState(null);
  const [currentProductConfig, setCurrentProductConfig] = useState({
    variantId: null,
    size: "",
    quantity: 1,
    price: 0, // This will store the price per unit, not total.
    productPrice: 0, // Store the calculated total price for the current configuration.
    linkImg: null,
    linkThanksCard: null,
    linkFileDesign: null,
    note: "",
  });

  // File Refs
  const linkImgRef = useRef(null);
  const linkThanksCardRef = useRef(null);
  const linkFileDesignRef = useRef(null);

  // Upload Progress
  const [uploadProgress, setUploadProgress] = useState({
    linkImg: { isUploading: false, progress: 0 },
    linkThanksCard: { isUploading: false, progress: 0 },
    linkFileDesign: { isUploading: false, progress: 0 },
  });

  // ADDED: Refs for editing product file uploads
  const editLinkImgRef = useRef(null);
  const editLinkThanksCardRef = useRef(null);
  const editLinkFileDesignRef = useRef(null);

  // ADDED: Upload progress tracking for editing modal
  const [editUploadProgress, setEditUploadProgress] = useState({
    linkImg: { isUploading: false, progress: 0 },
    linkThanksCard: { isUploading: false, progress: 0 },
    linkFileDesign: { isUploading: false, progress: 0 },
  });

  // Cart Products & Current Order
  const [cartProducts, setCartProducts] = useState([]); // Products added via manual selection (Step 4)
  const [currentOrderProducts, setCurrentOrderProducts] = useState([]); // Products already existing in the order
  const [removedProductIds, setRemovedProductIds] = useState([]);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [activeTTS, setActiveTTS] = useState(false);
  const [isOrderIdSet, setIsOrderIdSet] = useState(true);
  const [orderCodeGoc, setOrderCodeGoc] = useState("");

  // New state for editing product
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingProductConfig, setEditingProductConfig] = useState({});

  const [editingProductDetail, setEditingProductDetail] = useState(null);

  // ADDED: uploadImage function for Step 4 file uploads
  const uploadImage = async (file, onProgress) => {
    const formData = new FormData();
    formData.append("File", file);

    try {
      // Simulate progress updates
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        if (currentProgress < 90) {
          currentProgress += Math.random() * 30;
          onProgress?.(Math.min(currentProgress, 90));
        }
      }, 200);

      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/images/upload`,
        {
          method: "POST",
          credentials: "include",
          body: formData,
        }
      );

      clearInterval(progressInterval);

      // ❌ Upload failed → lấy message THẬT từ BE
      if (!res.ok) {
        let errorMessage = "Upload failed";

        try {
          const errorData = await res.json();
          errorMessage =
            errorData.message ||
            errorData.detail ||
            errorData.error ||
            errorMessage;
        } catch {
          const text = await res.text();
          errorMessage = text || errorMessage;
        }

        throw new Error(errorMessage);
      }

      // ✅ Success
      const data = await res.json();
      onProgress?.(100);

      console.log("[Upload success]", data);
      return data.url || data.secureUrl || data.path || null;
    } catch (err) {
      console.error("Upload error:", err);

      // 🔥 HIỂN THỊ ĐÚNG MESSAGE BE
      setErrorMessage(err.message);
      setShowErrorDialog(true);

      return null;
    }
  };

  const getErrorMessageFromXHR = (xhr) => {
  try {
    const data = JSON.parse(xhr.responseText);
    return data.message || data.detail || data.error || "Upload failed";
  } catch {
    return xhr.responseText || "Upload failed";
  }
};


  // Dòng ~39: Hàm handleEditProduct đã được sửa
  const handleEditProduct = async (product) => {
    // 1. Dùng variantId của sản phẩm để gọi API mới
    const variantIdToFetch = product.variantId;

    // Nếu variantId bị thiếu (không nên xảy ra), dừng lại.
    if (!variantIdToFetch) {
      Swal.fire("Error", "Product variant ID is missing.", "error");
      return;
    }

    setEditingProductId(product.id);

    // Tính toán lại giá đơn vị ban đầu (unit price)
    const unitPrice = product.price / product.quantity;

    // 2. Thiết lập trạng thái ban đầu của modal
    setEditingProductConfig({
      variantId: product.variantId,
      size: product.size,
      price: unitPrice, // Sử dụng giá đơn vị đã tính
      linkImg: product.linkImg || "",
      linkThanksCard: product.linkThanksCard || "",
      linkFileDesign: product.linkFileDesign || "",
      quantity: product.quantity,
      note: product.note || "",
      ...product,
      linkImgPreview: product.linkImg,
      linkThanksCardPreview: product.linkThanksCard,
      linkFileDesignPreview: product.linkFileDesign,
    });

    setEditingProductDetail(null); // Reset detail trước khi fetch

    // 3. Gọi API LẤY CHI TIẾT SẢN PHẨM/VARIANTS BẰNG VARIANT ID
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Product/by-variant/${variantIdToFetch}`,
        {
          credentials: "include",
        }
      );
      if (!res.ok)
        throw new Error("Failed to fetch product details for editing");
      const data = await res.json();

      // data chính là đối tượng ProductDto đầy đủ, chứa ProductId và Variants
      setEditingProductDetail(data.data || data);
    } catch (error) {
      console.error("Error fetching product details for editing:", error);
      Swal.fire(
        "Error",
        "Failed to load product configuration details",
        "error"
      );
      setEditingProductId(null); // Đóng modal nếu lỗi
    }
  };

  const handleSaveEditedProduct = async () => {
    if (!editingProductId) return;

    try {
      const updatedProducts = currentOrderProducts.map((item) => {
        if (item.id === editingProductId) {
          // Lấy variant từ editingProductDetail (đã được fetch khi mở modal)
          const variant = editingProductDetail?.variants?.find(
            (v) =>
              v.productVariantId.toString() ===
              editingProductConfig.variantId?.toString()
          );

          // Sử dụng giá đơn vị (unitPrice) từ variant mới, hoặc giá cũ nếu không tìm thấy
          // 1. SỬA: unitPrice (giá đơn vị) phải là BASE COST
          const unitPrice = variant?.baseCost || editingProductConfig.price;
          // 2. TÍNH TỔNG GIÁ: Base Cost * Quantity
          const totalPrice = unitPrice * editingProductConfig.quantity;

          return {
            ...item,
            ...editingProductConfig,

            // Quantity + price updated
            quantity: editingProductConfig.quantity,
            price: totalPrice,
            variantId: editingProductConfig.variantId,

            // Ảnh UPDATED
            linkImg: editingProductConfig.linkImg ?? item.linkImg,
            linkThanksCard:
              editingProductConfig.linkThanksCard ?? item.linkThanksCard,
            linkFileDesign:
              editingProductConfig.linkFileDesign ?? item.linkFileDesign,

            // Costs
            shipCost: variant?.shipCost || item.shipCost,
            extraShipping: variant?.extraShipping || item.extraShipping,
            baseCost: variant?.baseCost || item.baseCost,
          };
        }
        return item;
      });

      setCurrentOrderProducts(updatedProducts);
      setEditingProductId(null);
      setEditingProductConfig({});
      setEditingProductDetail(null); // Xóa chi tiết sản phẩm sau khi lưu (Quan trọng)

      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Product updated successfully",
        timer: 1500,
      });
    } catch (error) {
      console.error("Error updating product:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update product",
      });
    }
  };

  // Fetch order details on mount
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);

        // ── 1. Fetch Order ──────────────────────────────
        const res = await fetch(
          `${apiClient.defaults.baseURL}/api/Seller/${orderId}`,
          { credentials: "include" }
        );

        if (!res.ok) throw new Error("Failed to load order");

        const data = await res.json();

        // Lưu lại OrderCode gốc (không cho đổi)
        setOrderCodeGoc(data.orderCode || data.OrderCode || "");
        const parts = data.address?.split(",")?.map((x) => x.trim()) || [];

        const street = parts[0] || "";
        const ward = parts.length >= 2 ? parts[parts.length - 3] || "" : "";
        const district = parts.length >= 2 ? parts[parts.length - 2] || "" : "";
        const province = parts.length >= 1 ? parts[parts.length - 1] || "" : "";

        // ── 3. Set Customer Info ────────────────────────────
        setCustomerInfo({
          name: data.customerName || "",
          phone: data.phone || "",
          email: data.email || "",
          address: street,
          address1: data.address1 || "",
          provinceName: data.shipState || province,
          districtName: data.shipCity || district,
          wardName: ward,
          provinceId: "",
          districtId: "",
          wardId: "",
        });

        // ── 4. Load provinces trước ─────────────────────────
        await fetchProvinces();

        // Districts & Wards sẽ được fetch khi provinceId/districtId match name phía dưới
      } catch (err) {
        console.error("Error loading order:", err);
        Swal.fire("Error", "Failed to load order details", "error");
        router.push("/seller/manage-order");
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId, router]);

  useEffect(() => {
    if (!customerInfo.provinceName || provinces.length === 0) return;

    const found = provinces.find(
      (p) =>
        p.name.trim().toLowerCase() ===
        customerInfo.provinceName.trim().toLowerCase()
    );

    if (!found) return;

    // Gán provinceId đúng
    if (customerInfo.provinceId !== found.id) {
      setCustomerInfo((prev) => ({ ...prev, provinceId: found.id }));
      fetchDistricts(found.id); // Load districts sau khi có ID
    }
  }, [provinces, customerInfo.provinceName]);

  useEffect(() => {
    if (!customerInfo.districtName || districts.length === 0) return;

    const found = districts.find(
      (d) =>
        d.name.trim().toLowerCase() ===
        customerInfo.districtName.trim().toLowerCase()
    );

    if (!found) return;

    if (customerInfo.districtId !== found.id) {
      setCustomerInfo((prev) => ({ ...prev, districtId: found.id }));
      fetchWards(found.id); // Load wards
    }
  }, [districts, customerInfo.districtName]);

  //
  // ───────────────────────────────────────────────
  // MATCH WARD ID THEO TÊN SAU KHI WARDS LOAD XONG
  // ───────────────────────────────────────────────
  //
  useEffect(() => {
    if (!customerInfo.wardName || wards.length === 0) return;

    const found = wards.find(
      (w) =>
        w.name.trim().toLowerCase() ===
        customerInfo.wardName.trim().toLowerCase()
    );

    if (!found) return;

    if (customerInfo.wardId !== found.id) {
      setCustomerInfo((prev) => ({ ...prev, wardId: found.id }));
    }
  }, [wards, customerInfo.wardName]);

  // Khớp Province ID
  useEffect(() => {
    if (!customerInfo.provinceName || provinces.length === 0) return;

    const found = provinces.find(
      (p) =>
        p.name.trim().toLowerCase() ===
        customerInfo.provinceName.trim().toLowerCase()
    );

    if (found && customerInfo.provinceId !== found.id) {
      setCustomerInfo((prev) => ({ ...prev, provinceId: found.id }));
      fetchDistricts(found.id);
    }
  }, [provinces, customerInfo.provinceName]);

  // Khớp District ID
  useEffect(() => {
    if (!customerInfo.districtName || districts.length === 0) return;

    const found = districts.find(
      (d) =>
        d.name.trim().toLowerCase() ===
        customerInfo.districtName.trim().toLowerCase()
    );

    if (found && customerInfo.districtId !== found.id) {
      setCustomerInfo((prev) => ({ ...prev, districtId: found.id }));
      fetchWards(found.id);
    }
  }, [districts, customerInfo.districtName]);

  useEffect(() => {
    if (customerInfo.wardId && wards.length > 0) {
      setSelectedWard(customerInfo.wardId);
    }
  }, [customerInfo.wardId, wards]);

  // Fetch existing order products
  // Fetch existing order products
  useEffect(() => {
    const loadOrderProducts = async () => {
      try {
        if (!params.orderId) return;
        const response = await fetch(
          `${apiClient.defaults.baseURL}/api/Order/${params.orderId}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Failed to fetch order: ${response.status} ${response.statusText} ${errorText}`
          );
        }

        const data = await response.json();

        // 1. Map và làm giàu dữ liệu (Data Enrichment)
        const productsWithDetailsPromises = data.details.map(async (item) => {
          const variantId = item.productVariantID;

          // 2. Gọi API để lấy chi phí chính xác và productId
          const { productId, variantDetails } = await fetchVariantDetails(
            variantId
          );

          return {
            id: item.orderDetailID,
            // Lấy productId từ API chi tiết
            productId: productId || item.productId,
            variantId: item.productVariantID,
            productName: item.productName,
            quantity: item.quantity,
            size: item.size || "N/A",
            price: item.price,
            linkImg: item.linkImg,
            linkThanksCard: item.linkThanksCard,
            linkFileDesign: item.linkFileDesign,
            note: item.note || "",

            // 3. GÁN CHI PHÍ CHÍNH XÁC TỪ FETCH API
            shipCost: variantDetails.shipCost,
            extraShipping: variantDetails.extraShipping,
            baseCost: variantDetails.baseCost,

            // 4. Mảng variants đầy đủ (được dùng khi chỉnh sửa)
            variants: variantDetails.variants || [],
          };
        });

        // Chờ tất cả các cuộc gọi API hoàn thành
        const products = await Promise.all(productsWithDetailsPromises);
        setCurrentOrderProducts(products);
      } catch (error) {
        console.error("Error loading order products:", error);
        Swal.fire("Error", "Failed to load order products", "error");
      }
    };

    loadOrderProducts();
  }, [params.orderId]);

  // Fetch provinces
  const fetchProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Location/provinces`,
        {
          credentials: "include",
        }
      );
      if (res.ok) {
        const data = await res.json();
        const normalized = data.map((p) => ({
          id: p.ProvinceID,
          name: p.ProvinceName,
        }));
        setProvinces(normalized);
      }
    } catch (err) {
      console.error("Error fetching provinces:", err);
    } finally {
      setLoadingProvinces(false);
    }
  };

  // Fetch districts
  const fetchDistricts = async (provinceId) => {
    if (!provinceId) return;
    try {
      setLoadingDistricts(true);
      setDistricts([]);
      setWards([]);
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Location/districts/${provinceId}`,
        {
          credentials: "include",
        }
      );
      if (res.ok) {
        const data = await res.json();
        const normalized = data.map((d) => ({
          id: d.DistrictID,
          name: d.DistrictName,
        }));
        setDistricts(normalized);
      }
    } catch (err) {
      console.error("Error fetching districts:", err);
    } finally {
      setLoadingDistricts(false);
    }
  };

  // Fetch wards
  const fetchWards = async (districtId) => {
    if (!districtId) return;
    try {
      setLoadingWards(true);
      setWards([]);
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Location/wards/${districtId}`,
        {
          credentials: "include",
        }
      );
      if (res.ok) {
        const data = await res.json();
        const normalized = data.map((w) => ({
          id: w.WardCode,
          name: w.WardName,
        }));
        setWards(normalized);
      }
    } catch (err) {
      console.error("Error fetching wards:", err);
    } finally {
      setLoadingWards(false);
    }
  };

  // Fetch products (old method, likely not used if catalog is primary)
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      setProductsError("");
      const res = await fetch(`${apiClient.defaults.baseURL}/api/Product`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setProductsError(err.message);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fetch categories for step 3 catalog
  async function fetchCatalogCategories() {
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Categories/public`
      );
      if (!res.ok) throw new Error("Failed to load categories");
      const data = await res.json();
      const names = data.map((c) => c.categoryName);
      setCatalogCategories(names);
    } catch (err) {
      console.error(err);
    }
  }

  // ADDED: Hàm phụ trợ để lấy thông tin chi tiết variant
  const fetchVariantDetails = async (variantId) => {
    if (!variantId) return { productId: null, variantDetails: {} };
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Product/by-variant/${variantId}`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) {
        console.warn(`Failed to fetch details for variant ${variantId}`);
        return { productId: null, variantDetails: {} };
      }
      const data = await res.json();

      // Tìm variant cụ thể (vì API trả về TẤT CẢ variants)
      const selectedVariant = (data.variants || []).find(
        (v) => v.productVariantId === variantId
      );

      return {
        productId: data.productId || null,
        // Trả về Product Details (BaseCost, ShipCost, etc.) của variant đó
        variantDetails: {
          shipCost: selectedVariant?.shipCost || 0,
          extraShipping: selectedVariant?.extraShipping || 0,
          baseCost: selectedVariant?.baseCost || 0,
          variants: data.variants || [], // To keep the full list if needed later
        },
      };
    } catch (err) {
      console.error(`Error fetching details for variant ${variantId}:`, err);
      return { productId: null, variantDetails: {} };
    }
  };

  // Fetch catalog products when filters change
  useEffect(() => {
    if (currentStep === 3) {
      fetchCatalogProducts();
    }
  }, [
    catalogPage,
    catalogItemsPerPage,
    searchTerm,
    categoryFilter,
    currentStep,
  ]);

  // Fetch catalog products
  async function fetchCatalogProducts() {
    try {
      setCatalogLoading(true);
      const category = categoryFilter === "all" ? "" : categoryFilter;
      const url = `${apiClient.defaults.baseURL}/api/Product/filter?searchTerm=${searchTerm}&category=${category}&status=&page=${catalogPage}&pageSize=${catalogItemsPerPage}`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      setTotalCatalogProducts(data.total);
      setCatalogProducts(data.products || []);
    } catch (err) {
      console.error("Failed to fetch catalog products:", err);
    } finally {
      setCatalogLoading(false);
    }
  }

  // Handle file uploads to blob
  const handleFileUpload = async (fileType, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadProgress((prev) => ({
        ...prev,
        [fileType]: { isUploading: true, progress: 0 },
      }));

      const uploadedUrl = await uploadImage(file, (progress) => {
        console.log("[v0] Upload progress update:", { fileType, progress });
        setUploadProgress((prev) => ({
          ...prev,
          [fileType]: { isUploading: true, progress },
        }));
      });

      if (uploadedUrl) {
        console.log("[v0] Setting config with uploaded URL:", {
          fileType,
          uploadedUrl,
        });
        setCurrentProductConfig((prev) => ({
          ...prev,
          [fileType]: uploadedUrl,
        }));

        // Set preview URL
        const previewUrl = URL.createObjectURL(file);
        setCurrentProductConfig((prev) => ({
          ...prev,
          [`${fileType}Preview`]: previewUrl,
        }));

        setUploadProgress((prev) => ({
          ...prev,
          [fileType]: { isUploading: false, progress: 100 },
        }));

        // Clear progress after a brief delay
        setTimeout(() => {
          setUploadProgress((prev) => ({
            ...prev,
            [fileType]: { isUploading: false, progress: 0 },
          }));
        }, 500);
      } else {
        console.log("[v0] Upload returned null URL");
        setUploadProgress((prev) => ({
          ...prev,
          [fileType]: { isUploading: false, progress: 0 },
        }));
      }
    } catch (error) {
      console.error("[v0] File upload error:", error);
      Swal.fire("Error", "Upload failed. Please try again.", "error");
      setUploadProgress((prev) => ({
        ...prev,
        [fileType]: { isUploading: false, progress: 0 },
      }));
    }
  };

  const handleRemoveUploadedFile = (fileType) => {
    console.log("[v0] Removing file:", fileType);
    setCurrentProductConfig((prev) => ({
      ...prev,
      [fileType]: null,
    }));
    // Reset the file input
    if (fileType === "linkImg" && linkImgRef.current) {
      linkImgRef.current.value = "";
    } else if (fileType === "linkThanksCard" && linkThanksCardRef.current) {
      linkThanksCardRef.current.value = "";
    } else if (fileType === "linkFileDesign" && linkFileDesignRef.current) {
      linkFileDesignRef.current.value = "";
    }
  };

  // ADDED: File upload handler for edit modal

  // Dòng ~588: Thay thế toàn bộ hàm handleEditFileUpload

  const handleEditFileUpload = async (fieldName, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ✅ Validate type
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire("Error", "Accept only file PNG, JPG, JPEG", "error");
      e.target.value = ""; // 🔥 cho chọn lại
      return;
    }

    // 🔥 Tạo preview ngay
    const previewUrl = URL.createObjectURL(file);

    // Cập nhật UI trước upload
    setEditingProductConfig((prev) => ({
      ...prev,
      [`${fieldName}Preview`]: previewUrl,
      [fieldName]: null,
    }));

    setEditUploadProgress((prev) => ({
      ...prev,
      [fieldName]: { isUploading: true, progress: 0 },
    }));

    const formData = new FormData();
    formData.append("File", file);

    const xhr = new XMLHttpRequest();

    // 🔁 Progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setEditUploadProgress((prev) => ({
          ...prev,
          [fieldName]: { isUploading: true, progress: percent },
        }));
      }
    };

    // ✅ Success / Error
    xhr.onload = () => {
      if (xhr.status === 200) {
        if (previewUrl) URL.revokeObjectURL(previewUrl);

        const response = JSON.parse(xhr.responseText);
        const uploadedUrl =
          response.url || response.secureUrl || response.path;

        setEditingProductConfig((prev) => ({
          ...prev,
          [fieldName]: uploadedUrl,
          [`${fieldName}Preview`]: null,
        }));

        setEditUploadProgress((prev) => ({
          ...prev,
          [fieldName]: { isUploading: false, progress: 0 },
        }));
      } else {
        const errorMessage = getErrorMessageFromXHR(xhr);

        if (previewUrl) URL.revokeObjectURL(previewUrl);

        Swal.fire("Upload failed", errorMessage, "error");

        setEditUploadProgress((prev) => ({
          ...prev,
          [fieldName]: { isUploading: false, progress: 0 },
        }));

        setEditingProductConfig((prev) => ({
          ...prev,
          [fieldName]: null,
          [`${fieldName}Preview`]: null,
        }));

        e.target.value = ""; // 🔥 cho phép upload lại
      }
    };

    // ❌ Network error
    xhr.onerror = () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);

      Swal.fire(
        "Network error",
        "Unable to upload file. Please check your connection.",
        "error"
      );

      setEditUploadProgress((prev) => ({
        ...prev,
        [fieldName]: { isUploading: false, progress: 0 },
      }));

      setEditingProductConfig((prev) => ({
        ...prev,
        [fieldName]: null,
        [`${fieldName}Preview`]: null,
      }));

      e.target.value = "";
    };

    xhr.open("POST", `${apiClient.defaults.baseURL}/api/images/upload`);
    xhr.withCredentials = true;
    xhr.send(formData);
  };


  // ADDED: Handler to remove uploaded files in edit modal
  const handleEditRemoveFile = (fieldName) => {
    setEditingProductConfig((prev) => ({
      ...prev,
      [fieldName]: null,
    }));
    // Reset the file input
    if (fieldName === "linkImg" && editLinkImgRef.current) {
      editLinkImgRef.current.value = "";
    } else if (
      fieldName === "linkThanksCard" &&
      editLinkThanksCardRef.current
    ) {
      editLinkThanksCardRef.current.value = "";
    } else if (
      fieldName === "linkFileDesign" &&
      editLinkFileDesignRef.current
    ) {
      editLinkFileDesignRef.current.value = "";
    }
  };

  // Handle product selection (for manual product selection if needed)
  const handleProductSelect = (product) => {
    setCurrentProduct(product);
    // Reset current product config and set default values
    const defaultVariant =
      product.variants?.find((v) => v.isDefault) || product.variants?.[0];
    const unitPrice = defaultVariant?.totalCost || 0; // Default to 0 if no variant/cost
    setCurrentProductConfig({
      variantId: defaultVariant?.productVariantId || null,
      size: defaultVariant?.sizeInch || "",
      quantity: 1,
      price: unitPrice, // Set the price per unit
      productPrice: unitPrice, // Initial total price is same as unit price for quantity 1
      linkImg: null,
      linkThanksCard: null,
      linkFileDesign: null,
      note: "",
    });
    setCurrentStep(4); // Move to configure product
  };

  // Calculate product price (for manual product selection)
  const calculateProductPrice = () => {
    if (!currentProductConfig.variantId || !currentProduct) return 0;
    const variant = currentProduct.variants?.find(
      (v) => v.productVariantId === currentProductConfig.variantId
    );
    if (!variant) return 0;
    return (variant.totalCost || 0) * currentProductConfig.quantity;
  };

  // Get cost details (for manual product selection)
  const getCostDetails = () => {
    if (!currentProductConfig.variantId || !currentProduct) {
      return { baseCost: 0, shipCost: 0, extraShipping: 0 };
    }
    const variant = currentProduct.variants?.find(
      (v) => v.productVariantId === currentProductConfig.variantId
    );
    return {
      baseCost: variant?.baseCost || 0,
      shipCost: variant?.shipCost || 0,
      extraShipping: variant?.extraShipping || 0,
    };
  };

  // Add to cart (for manual product selection, items added to cartProducts)
  const handleAddToCart = () => {
    if (!currentProduct) {
      setErrorMessage("Please select a product from the catalog first.");
      setShowErrorDialog(true);
      return;
    }

    if (!currentProductConfig.variantId) {
      setErrorMessage("Please select a size/variant for the product.");
      setShowErrorDialog(true);
      return;
    }

    if (isOrderIdSet) {
      setIsOrderIdSet(true);
    }

    const productTotalPrice = calculateProductPrice();
    const productToAdd = {
      id: Date.now(), // Generate a unique ID for new items in cart
      product: currentProduct, // Store the full product object for reference
      config: { ...currentProductConfig, totalPrice: productTotalPrice }, // Store config including the calculated total price
      unitPrice: currentProductConfig.price, // Store the price per unit
      totalPrice: productTotalPrice, // Store the total price for this item configuration
    };

    setCartProducts((prev) => [...prev, productToAdd]);

    // Reset current product config for adding next product
    // setCurrentProduct(null);
    // setCurrentProductConfig({
    //   variantId: null,
    //   size: "",
    //   quantity: 1,
    //   price: 0,
    //   productPrice: 0,
    //   linkImg: null,
    //   linkThanksCard: null,
    //   linkFileDesign: null,
    //   note: "",
    // });
    // Don't set step here - stay on step 4
  };

  // Remove from cart (temporary products added in this session via manual selection)
  const handleRemoveFromCart = (id) => {
    setCartProducts(cartProducts.filter((item) => item.id !== id));
  };

  // Remove existing product from the order
  const handleRemoveCurrentProduct = (productId) => {
    setCurrentOrderProducts(
      currentOrderProducts.filter((p) => p.id !== productId)
    );
    setRemovedProductIds([...removedProductIds, productId]);
  };

  // Toggle product details expansion (for cart items)
  const toggleProductDetails = (id) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Add product from catalog to the current order list
  const handleAddProductFromCatalog = (product) => {
    // When adding from catalog, directly set it as currentProduct to configure in Step 4
    setCurrentProduct(product);
    // Set default config based on product's base price or a common variant
    const defaultVariant =
      product.variants?.find((v) => v.isDefault) || product.variants?.[0];
    const unitPrice = defaultVariant?.totalCost || product.basePrice || 0; // Use variant's totalCost or product's basePrice

    setCurrentProductConfig({
      variantId: defaultVariant?.productVariantId || null,
      size: defaultVariant?.sizeInch || "",
      quantity: 1,
      price: unitPrice, // Set the price per unit
      productPrice: unitPrice, // Initial total price for quantity 1
      linkImg: product.itemLink || null,
      linkThanksCard: null,
      linkFileDesign: null,
      note: "",
    });
    setCurrentStep(4); // Move to Step 4 to configure

    setCatalogPage(1); // Reset catalog page after adding
    setSearchTerm(""); // Clear search term
    setCategoryFilter("all"); // Reset category filter
  };

  // Get cost details (for calculating new item costs)
  const getNewItemCostDetails = (item) => {
    const variant = item.product.variants?.find(
      (v) => v.productVariantId === item.config.variantId
    );
    const baseCost = variant?.baseCost || 0;
    const shipCost = variant?.shipCost || 0;
    const extraShipping = variant?.extraShipping || 0;
    const quantity = item.config.quantity;
    const itemTotalPrice = item.totalPrice;

    return {
      id: item.id, // Include ID for existing items
      name: item.product.productName,
      baseCost,
      shipCost,
      extraShipping,
      quantity,
      totalBaseCost: baseCost * quantity,
      totalPrice: item.totalPrice,
    };
  };

  // Get order cost breakdown (combines existing and cart products)
  const getOrderCostBreakdown = () => {
    const existingItemsCosts = currentOrderProducts.map((item) => ({
      id: item.id,
      name: item.productName,
      baseCost: item.baseCost || 0,
      shipCost: item.shipCost || 0,
      extraShipping: item.extraShipping || 0,
      quantity: item.quantity,
      totalBaseCost: (item.baseCost || 0) * item.quantity,
      totalPrice: item.price, // This is the total price for the item in the order
    }));

    const newItemsCosts = cartProducts.map((item) =>
      getNewItemCostDetails(item)
    );

    const allItems = [...existingItemsCosts, ...newItemsCosts];

    const totalBaseCostAll = allItems.reduce(
      (sum, item) => sum + item.totalBaseCost,
      0
    );

    const maxShipCost = Math.max(...allItems.map((item) => item.shipCost), 0);

    const maxExtraShipping = Math.max(
      ...allItems.map((item) => item.extraShipping),
      0
    );

    const maxExtraProductName =
      allItems.find((item) => item.extraShipping === maxExtraShipping)?.name ||
      "N/A";

    const totalQtyNewItems = newItemsCosts.reduce(
      (sum, item) => sum + item.quantity,
      0
    );
    const extraShippingTotal =
      maxExtraShipping > 0 && totalQtyNewItems > 1
        ? maxExtraShipping * (totalQtyNewItems - 1)
        : 0;

    return {
      existingItems: existingItemsCosts,
      newItems: newItemsCosts,
      allItems: allItems,
      totalBaseCost: totalBaseCostAll,
      maxShipCost: maxShipCost, // Base shipping cost
      maxExtraShipping: maxExtraShipping, // Extra shipping per unit after the first
      maxExtraProductName: maxExtraProductName,
      extraShippingTotal: extraShippingTotal,
      orderTotal: totalBaseCostAll + maxShipCost + extraShippingTotal, // This represents the subtotal before TTS
    };
  };

  const getDetailedCostBreakdown = () => {
    // Get costs from existing order products
    const existingItemsCosts = currentOrderProducts.map((item) => {
      return {
        id: item.id,
        name: item.productName,
        qty: item.quantity,
        price: item.price, // This is the total price for the item in the order
        shipCost: item.shipCost || 0, // Use the stored shipCost
        extraShipping: item.extraShipping || 0, // Use the stored extraShipping
        baseCost: item.baseCost || item.price - (item.shipCost || 0), // Calculate base cost if not explicitly stored
        totalBaseCost:
          (item.baseCost || item.price - (item.shipCost || 0)) * item.quantity,
        totalPrice: item.price, // Total price of this existing item
      };
    });

    // Get costs from new items in cart
    const newItemsCosts = cartProducts.map((item) => {
      const variant = item.product.variants?.find(
        (v) => v.productVariantId === item.config.variantId
      );
      const baseCost = variant?.baseCost || 0;
      const shipCost = variant?.shipCost || 0;
      const extraShipping = variant?.extraShipping || 0;
      const qty = item.config.quantity;

      return {
        id: item.id, // Use the temporary id from cartProducts
        name: item.product.productName,
        baseCost,
        shipCost,
        extraShipping,
        qty,
        totalBaseCost: baseCost * qty,
        totalPrice: item.totalPrice,
      };
    });

    // Combine all items for comparison
    const allItems = [...existingItemsCosts, ...newItemsCosts];

    // Calculate total base cost from all items
    const totalBaseCostAll = allItems.reduce(
      (sum, item) => sum + item.totalBaseCost,
      0
    );

    // Get max ship cost from ALL items (existing + new)
    const maxShipCost = Math.max(...allItems.map((item) => item.shipCost), 0);

    // Get max extra shipping from ALL items (existing + new)
    const maxExtraShipping = Math.max(
      ...allItems.map((item) => item.extraShipping),
      0
    );

    // Find which product has the max extra shipping
    const maxExtraProductName =
      allItems.find((item) => item.extraShipping === maxExtraShipping)?.name ||
      "N/A";

    // Calculate Total Quantity of ALL items (không dùng trong logic mới này)
    const totalQtyAllItems = allItems.reduce((sum, item) => sum + item.qty, 0);

    // SỬA ĐỔI QUAN TRỌNG: Logic tính Extra Shipping Total và Order Total
    let calculatedOrderTotal;
    let extraShippingTotal = 0; // Khởi tạo Extra Shipping Total

    // ÁP DỤNG Extra Shipping Max nếu Total Quantity > 1
    if (totalQtyAllItems > 1) {
      extraShippingTotal = maxExtraShipping;
    }

    if (allItems.length === 1) {
      const singleItem = allItems[0];

      calculatedOrderTotal =
        singleItem.totalBaseCost + singleItem.shipCost + extraShippingTotal; // <--- CỘNG extraShippingTotal
    } else {
      calculatedOrderTotal =
        totalBaseCostAll + maxShipCost + extraShippingTotal;
    }

    return {
      existingItems: existingItemsCosts,
      newItems: newItemsCosts,
      allItems: allItems,
      totalBaseCost: totalBaseCostAll,
      maxShipCost: maxShipCost, // Base shipping cost
      maxExtraShipping: maxExtraShipping, // Extra shipping per unit after the first
      maxExtraProductName: maxExtraProductName,
      extraShippingTotal: extraShippingTotal, // Tổng Extra Shipping (Max value hoặc 0)
      orderTotal: calculatedOrderTotal, // Đã áp dụng logic 2 trường hợp
    };
  };

  // Calculate order total (for Step 5)
  const calculateOrderTotal = () => {
    const breakdown = getDetailedCostBreakdown();

    // Total = Order Total đã tính đúng (từ getDetailedCostBreakdown) + TTS
    const totalTTS = activeTTS ? 1.0 : 0;

    // Sử dụng breakdown.orderTotal đã tính đúng logic 1 hoặc >1 sản phẩm
    return breakdown.orderTotal + totalTTS;
  };

  // Handle next step
  const handleNext = () => {
    if (currentStep === 1) {
      // For editing, only require basic validation if any field is being edited
      // Allow proceeding to Step 2 without strict validation
      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      // Step 2: Show existing order products
      if (currentOrderProducts.length === 0 && cartProducts.length === 0) {
        setErrorMessage("Please add or keep at least one product to the order");
        setShowErrorDialog(true);
        return;
      }
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      // Step 3: Product selection and catalog search
      // If no products are in the order (currentOrderProducts and cartProducts are empty)
      // and user tries to proceed from Step 3, force them to add a product.
      if (currentOrderProducts.length === 0 && cartProducts.length === 0) {
        setErrorMessage("Please add at least one product to the order");
        setShowErrorDialog(true);
        return; // Stay in Step 3 to add a product
      }
      setCurrentStep(4);
      return;
    }

    if (currentStep === 4) {
      // Step 4: Product configuration (size, files, quantity)
      if (!currentProductConfig.variantId) {
        setErrorMessage("Please select a size for the product");
        setShowErrorDialog(true);
        return;
      }
      // Before proceeding to review, ensure that all configured items are added to cartProducts
      // This is handled by the 'Add to Order Cart' button. If user proceeds without adding,
      // the `cartProducts` might be empty even if they configured something.
      // The check in Step 5 for total products covers this.
      setCurrentStep(5);
      return;
    }

    if (currentStep === 5) {
      // Step 5: Review and save
      handleSaveOrder();
      return;
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle save order
  // Dòng ~226: Hàm handleSaveOrder
  const handleSaveOrder = async () => {
    try {
      // Validation (giữ nguyên)
      if (
        !customerInfo.name ||
        !customerInfo.phone ||
        !customerInfo.email ||
        !customerInfo.address ||
        (!customerInfo.provinceId && !customerInfo.provinceName) ||
        (!customerInfo.districtId && !customerInfo.districtName) ||
        (!customerInfo.wardId && !customerInfo.wardName)
      ) {
        Swal.fire(
          "Error",
          "Please fill all customer information including address details",
          "error"
        );
        return;
      }

      const totalItemsCount = currentOrderProducts.length + cartProducts.length;
      if (totalItemsCount === 0) {
        Swal.fire("Error", "Order must contain at least one product", "error");
        return;
      }

      setIsSaving(true);

      // Lấy Order Total đã tính đúng
      const finalOrderTotal = getDetailedCostBreakdown().orderTotal;

      // 1. Chuẩn bị Order Details Update (TẤT CẢ items hiện tại)
      // Bao gồm cả items CŨ (đã cập nhật) và items MỚI (từ cartProducts)
      const orderDetailsUpdate = [
        // A. EXISTING ITEMS (Order Detail ID > 0)
        ...currentOrderProducts.map((item) => ({
          // OrderDetailID phải là id của OrderDetail
          orderDetailID: item.id,
          productVariantID: item.variantId,
          quantity: item.quantity,
          price: item.price, // Dùng tổng giá (Base Cost * Qty)
          linkImg: item.linkImg,
          linkThanksCard: item.linkThanksCard,
          linkDesign: item.linkFileDesign,
          note: item.note,
          // Backend sẽ tự tính lại TotalCost, BaseCost, ShipCost nếu cần
          // Nếu bạn muốn gửi các trường này để lưu (tùy vào logic backend):
          shipCost: item.shipCost,
          extraShipping: item.extraShipping,
          baseCost: item.baseCost,
          productionStatus: 0, // Giá trị mặc định nếu không được edit
        })),
        // B. NEW ITEMS (Order Detail ID = 0)
        ...cartProducts.map((item) => ({
          orderDetailID: 0, // Báo hiệu item mới
          productVariantID: item.config.variantId,
          quantity: item.config.quantity,
          price: item.totalPrice, // Dùng tổng giá (Base Cost * Qty)
          linkImg: item.config.linkImg,
          linkThanksCard: item.config.linkThanksCard,
          linkDesign: item.config.linkFileDesign,
          note: item.config.note,
          // Lấy chi phí từ variant của sản phẩm mới (dù có thể bị ghi đè bởi backend)
          shipCost: item.config.shipCost || 0,
          extraShipping: item.config.extraShipping || 0,
          baseCost: item.config.baseCost || 0,
          productionStatus: 0,
        })),
      ];

      const finalOrderTotalWithTTS = calculateOrderTotal();

      // 2. Tạo Payload cho API UpdateOrder
      const payload = {
        customerInfo: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email,
          address: `${customerInfo.address}${
            customerInfo.wardName ? `, ${customerInfo.wardName}` : ""
          }${
            customerInfo.districtName ? `, ${customerInfo.districtName}` : ""
          }${
            customerInfo.provinceName ? `, ${customerInfo.provinceName}` : ""
          }`,
          address1: customerInfo.address1,
          // Cần có các trường ZipCode, ShipState, ShipCountry nếu DTO yêu cầu
          zipCode: "",
          shipState: customerInfo.provinceName, // Tạm gán State bằng Province Name
          shipCity: customerInfo.districtName, // Tạm gán City bằng District Name
          shipCountry: "Vietnam",
        },
        orderUpdate: {
          // Cập nhật thông tin Order chính
          orderCode: orderCodeGoc, // Sử dụng orderId (params)
          activeTTS: activeTTS,
          // Bạn có thể giữ lại các trường khác nếu cần cập nhật
          tracking: "",
          productionStatus: "Pending",
          paymentStatus: "Unpaid",
          toProvinceId: Number(customerInfo.provinceId),
          toDistrictId: Number(customerInfo.districtId),
          toWardCode: customerInfo.wardId,
          totalCost: finalOrderTotalWithTTS,
        },
        // Gửi danh sách đã đồng bộ hóa
        orderDetailsUpdate: orderDetailsUpdate,
        // Tổng tiền (Order.TotalAmount) sẽ được backend tính lại,
        // nhưng ta gửi giá trị TỪ FE để kiểm tra/đồng bộ nếu cần:
        // totalAmount: calculateOrderTotal(),
      };

      console.log("Final TotalCost being sent:", payload.orderUpdate.totalCost);

      // 3. Gọi API Update Order mới
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Order/update-order/${orderId}`, // <-- SỬ DỤNG API MỚI
        {
          method: "PUT", // <-- Dùng PUT
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
          // <-- Đảm bảo gọi JSON.stringify đúng
        }
      );

      // 4. Xử lý phản hồi
      if (res.ok) {
        Swal.fire("Success", "Order updated successfully", "success");
        router.push("/seller/manage-order");
      } else {
        const errorText = await res.text();
        let errorMessage = errorText;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorText;
        } catch {}
        throw new Error(errorMessage || "Failed to save order");
      }
    } catch (err) {
      console.error("Error saving order:", err);
      Swal.fire("Error", err.message || "Failed to save order", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // Render Step 1: Customer Information
  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Step 1: Edit Customer Information (Optional)
      </h3>
      <p className="text-sm text-gray-600">
        You can skip fields you don't want to edit
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Customer Name</Label>
          <Input
            id="name"
            value={customerInfo.name}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow letters (including Vietnamese), numbers, and spaces
              const filtered = value.replace(
                /[^a-zA-Z0-9\s\u0100-\u017Fa-ỿ]/g,
                ""
              );
              if (filtered.length <= 50) {
                setCustomerInfo((prev) => ({
                  ...prev,
                  name: filtered,
                }));
              }
            }}
            placeholder="Enter customer name (3-50 characters)"
            className="mt-1"
            maxLength={50}
          />
          <p className="text-xs text-gray-500 mt-1">
            {customerInfo.name.length}/50 characters (no special characters)
          </p>
        </div>

        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={customerInfo.phone}
            onChange={(e) => {
              const value = e.target.value;
              // Only allow numbers
              const filtered = value.replace(/[^0-9]/g, "").slice(0, 10);
              setCustomerInfo((prev) => ({
                ...prev,
                phone: filtered,
              }));
            }}
            placeholder="Enter phone number (Vietnamese format)"
            className="mt-1"
            maxLength={10}
          />
          <p className="text-xs text-gray-500 mt-1">
            {customerInfo.phone.length}/10 digits
            {customerInfo.phone.length > 0 &&
            !customerInfo.phone.startsWith("0")
              ? " (must start with 0)"
              : ""}
          </p>
        </div>

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={customerInfo.email}
            onChange={(e) =>
              setCustomerInfo((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            placeholder="Enter email"
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            value={customerInfo.address}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 50) {
                setCustomerInfo((prev) => ({
                  ...prev,
                  address: value,
                }));
              }
            }}
            placeholder="Enter address"
            className="mt-1"
            maxLength={50}
          />
          <p className="text-xs text-gray-500 mt-1">
            {customerInfo.address.length}/50 characters
          </p>
        </div>

        <div>
          <Label htmlFor="address1">Address 1</Label>
          <Input
            id="address1"
            value={customerInfo.address1}
            onChange={(e) =>
              setCustomerInfo((prev) => ({
                ...prev,
                address1: e.target.value,
              }))
            }
            placeholder="Enter address 1 (optional)"
            className="mt-1"
          />
        </div>

        {/* Province Dropdown */}
        <div>
          <Label htmlFor="province">Province</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenProvinceDropdown(!openProvinceDropdown)}
              disabled={loadingProvinces}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left text-sm flex justify-between items-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
            >
              <span>
                {customerInfo.provinceName ||
                  (loadingProvinces ? "Loading..." : "Select Province")}
              </span>
              <ChevronDown
                size={20}
                className={openProvinceDropdown ? "rotate-180" : ""}
              />
            </button>

            {openProvinceDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
                <Input
                  type="text"
                  placeholder="Search province..."
                  value={searchProvince}
                  onChange={(e) => setSearchProvince(e.target.value)}
                  className="m-2 border-gray-300"
                />
                <div className="max-h-60 overflow-y-auto">
                  {filteredProvinces.length > 0 ? (
                    filteredProvinces.map((p) => {
                      // 1. Logic kiểm tra item này có đang được chọn hay không
                      // Dùng toString() để tránh lỗi so sánh giữa Number (10) và String ("10")
                      const isSelected =
                        customerInfo.provinceId?.toString() ===
                        p.id?.toString();

                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            const province = provinces.find(
                              (pr) => pr.id?.toString() === p.id?.toString()
                            );
                            setCustomerInfo((prev) => ({
                              ...prev,
                              provinceId: province?.id || "",
                              provinceName: province?.name || "",
                              districtId: "",
                              districtName: "",
                              wardId: "",
                              wardName: "",
                            }));
                            setDistricts([]);
                            setWards([]);
                            setOpenProvinceDropdown(false);
                            setSearchProvince("");
                            fetchDistricts(p.id);
                            setSelectedProvince(p.id);
                          }}
                          onMouseEnter={() => setHoverProvince(p.id)}
                          onMouseLeave={() => setHoverProvince(null)}
                          // 2. Logic CSS động: Bôi đậm màu xanh nếu isSelected = true
                          className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                            isSelected
                              ? "bg-blue-600 text-white font-bold" // Màu khi đã chọn
                              : hoverProvince === p.id
                              ? "bg-blue-100 text-blue-900"
                              : "hover:bg-gray-50 text-gray-700"
                          }`}
                        >
                          <span>{p.name}</span>

                          {/* 3. Hiển thị dấu tích (✓) nếu item này đã chọn */}
                          {isSelected && <span className="font-bold">✓</span>}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-gray-500 text-center">
                      No province found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* District Dropdown */}
        <div>
          <Label htmlFor="district">District</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                customerInfo.provinceId &&
                setOpenDistrictDropdown(!openDistrictDropdown)
              }
              disabled={loadingDistricts || !customerInfo.provinceId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left text-sm flex justify-between items-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
            >
              <span>
                {customerInfo.districtName ||
                  (loadingDistricts
                    ? "Loading..."
                    : customerInfo.provinceId
                    ? "Select District"
                    : "Select Province first")}
              </span>
              <ChevronDown
                size={20}
                className={openDistrictDropdown ? "rotate-180" : ""}
              />
            </button>

            {openDistrictDropdown && customerInfo.provinceId && (
              <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
                <Input
                  type="text"
                  placeholder="Search district..."
                  value={searchDistrict}
                  onChange={(e) => setSearchDistrict(e.target.value)}
                  className="m-2 border-gray-300"
                />
                <div className="max-h-60 overflow-y-auto">
                  {filteredDistricts.length > 0 ? (
                    filteredDistricts.map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          const district = districts.find(
                            (di) => di.id?.toString() === d.id?.toString()
                          );
                          setCustomerInfo((prev) => ({
                            ...prev,
                            districtId: district?.id || "",
                            districtName: district?.name || "",
                            wardId: "",
                            wardName: "",
                          }));
                          setWards([]);
                          setOpenDistrictDropdown(false);
                          setSearchDistrict("");
                          fetchWards(d.id);
                          // ADDED: Update selectedDistrict
                          setSelectedDistrict(d.id);
                        }}
                        onMouseEnter={() => setHoverDistrict(d.id)}
                        onMouseLeave={() => setHoverDistrict(null)}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          hoverDistrict === d.id
                            ? "bg-blue-100 text-blue-900"
                            : customerInfo.districtId?.toString() ===
                              d.id?.toString()
                            ? "bg-blue-50 text-blue-700"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {d.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">
                      No district found
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Ward Dropdown */}
        <div>
          <Label htmlFor="ward">Ward</Label>
          <div className="relative">
            <button
              type="button"
              onClick={() =>
                customerInfo.districtId &&
                setOpenWardDropdown(!openWardDropdown)
              }
              disabled={loadingWards || !customerInfo.districtId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left text-sm flex justify-between items-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
            >
              <span>
                {customerInfo.wardName ||
                  (loadingWards
                    ? "Loading..."
                    : customerInfo.districtId
                    ? "Select Ward"
                    : "Select District first")}
              </span>
              <ChevronDown
                size={20}
                className={openWardDropdown ? "rotate-180" : ""}
              />
            </button>

            {openWardDropdown && customerInfo.districtId && (
              <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 rounded-md bg-white shadow-lg z-50">
                <Input
                  type="text"
                  placeholder="Search ward..."
                  value={searchWard}
                  onChange={(e) => setSearchWard(e.target.value)}
                  className="m-2 border-gray-300"
                />
                <div className="max-h-60 overflow-y-auto">
                  {filteredWards.length > 0 ? (
                    filteredWards.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          const ward = wards.find(
                            (wa) => wa.id?.toString() === w.id?.toString()
                          );
                          setCustomerInfo((prev) => ({
                            ...prev,
                            wardId: ward?.id || "",
                            wardName: ward?.name || "",
                          }));
                          setOpenWardDropdown(false);
                          setSearchWard("");
                          // ADDED: Update selectedWard
                          setSelectedWard(w.id);
                        }}
                        onMouseEnter={() => setHoverWard(w.id)}
                        onMouseLeave={() => setHoverWard(null)}
                        className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                          hoverWard === w.id
                            ? "bg-blue-100 text-blue-900"
                            : customerInfo.wardId?.toString() ===
                              w.id?.toString()
                            ? "bg-blue-50 text-blue-700"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        {w.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-500">No ward found</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={handleNext}>Next Step</Button>
        <Button
          variant="outline"
          onClick={() => router.push("/seller/manage-order")}
        >
          Cancel
        </Button>
      </div>
    </div>
  );

  // Render Step 2: Current Products in Order
  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Step 2: Current Products in Order
      </h3>

      {currentOrderProducts.length === 0 ? (
        <div className="text-gray-600 p-4 bg-blue-50 rounded border border-blue-200">
          No products in this order yet.
        </div>
      ) : (
        <div className="space-y-3">
          {currentOrderProducts.map((item) => (
            <div
              key={item.id}
              className="border rounded-lg p-4 bg-white border-slate-200 hover:shadow-md transition-shadow flex gap-4"
            >
              <img
                src={item.linkImg || "/placeholder.svg"}
                alt={item.productName}
                className="w-20 h-20 rounded object-cover flex-shrink-0"
              />

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">
                  {item.productName}
                </h4>

                <div className="flex gap-4 mt-2 text-sm text-gray-600">
                  <span>
                    Quantity:{" "}
                    <span className="font-medium">{item.quantity}</span>
                  </span>
                  <span>
                    Size: <span className="font-medium">{item.size}</span>
                  </span>
                  <span>
                    BaseCost:{" "}
                    <span className="font-medium">
                      {Number(item.baseCost).toLocaleString("vi-VN")} ₫
                    </span>
                  </span>
                </div>

                {item.note && (
                  <p className="text-sm text-gray-500 mt-2">
                    Note: {item.note}
                  </p>
                )}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditProduct(item)}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Pencil className="w-4 h-4" />
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCurrentProduct(item.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL EDIT --- */}
      {editingProductId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Edit Product</h3>
              <button
                onClick={() => {
                  setEditingProductId(null);
                  setEditingProductConfig({});
                  setEditingProductDetail(null); // Clear detail state on close
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              {(() => {
                const editingProduct = currentOrderProducts.find(
                  (p) => p.id === editingProductId
                );
                if (!editingProduct) return null;

                return (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={editingProduct.linkImg || "/placeholder.svg"}
                        className="w-16 h-16 object-cover rounded"
                        alt="Product"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {editingProduct.productName}
                        </h4>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* --- FORM INPUTS GRID --- */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SIZE */}
                <div>
                  <Label htmlFor="edit-size">Size *</Label>

                  <Select
                    value={editingProductConfig.variantId?.toString() || ""}
                    onValueChange={(value) => {
                      // SỬA: Dùng editingProductDetail để tìm variant mới
                      const selected = editingProductDetail?.variants?.find(
                        (v) => v.productVariantId.toString() === value
                      );

                      setEditingProductConfig((prev) => ({
                        ...prev,
                        size: selected?.sizeInch || "",
                        variantId: selected?.productVariantId,
                        // SỬA: Lấy Base Cost cho price (Unit Price)
                        price: selected?.baseCost || 0,
                      }));
                    }}
                  >
                    <SelectTrigger id="edit-size">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>

                    <SelectContent>
                      {/* SỬA: Hiển thị Base Cost trong dropdown */}
                      {(editingProductDetail?.variants ?? []).map((v) => (
                        <SelectItem
                          key={v.productVariantId}
                          value={v.productVariantId.toString()}
                        >
                          {v.sizeInch} -{" "}
                          {Number(v.baseCost).toLocaleString("vi-VN")} ₫
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* QUANTITY */}
                <div>
                  <Label htmlFor="edit-quantity">Quantity *</Label>
                  <Input
                    id="edit-quantity"
                    type="number"
                    min="1"
                    max="20"
                    value={editingProductConfig.quantity || ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^\d*$/.test(val)) {
                        const num = Number.parseInt(val, 10);
                        if (!isNaN(num) && num >= 1 && num <= 20) {
                          setEditingProductConfig((prev) => ({
                            ...prev,
                            quantity: num,
                          }));
                        } else if (num > 20) {
                          setErrorMessage("Quantity must be between 1 and 20");
                          setShowErrorDialog(true);
                        }
                      }
                    }}
                    placeholder="1-20"
                    className="mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter quantity between 1 and 20
                  </p>
                </div>

                {/* LINK IMAGE */}
                <div>
                  <Label>Link Image</Label>
                  <div className="relative">
                    <Input
                      type="file"
                      ref={editLinkImgRef}
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const validTypes = ["image/jpeg", "image/png"];
                          const validNames = [".jpg", ".jpeg", ".png"];
                          const hasValidExtension = validNames.some((ext) =>
                            file.name.toLowerCase().endsWith(ext)
                          );

                          if (
                            !validTypes.includes(file.type) ||
                            !hasValidExtension
                          ) {
                            Swal.fire(
                              "Invalid File",
                              "Please upload only JPG, JPEG, or PNG files",
                              "error"
                            );
                            e.target.value = "";
                            return;
                          }
                          handleEditFileUpload("linkImg", e);
                        }
                      }}
                      disabled={editUploadProgress.linkImg.isUploading}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: JPG, JPEG, PNG
                    </p>
                    {editUploadProgress.linkImg.isUploading && (
                      <CircularProgress
                        progress={editUploadProgress.linkImg.progress}
                      />
                    )}
                  </div>

                  {editingProductConfig.linkImg &&
                    !editUploadProgress.linkImg.isUploading && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          Uploaded:{" "}
                          <a
                            href={editingProductConfig.linkImg}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-blue-600 truncate max-w-[200px]"
                          >
                            {editingProductConfig.linkImg.split("/").pop()}
                          </a>
                        </p>

                        {(editingProductConfig.linkImg
                          .toLowerCase()
                          .endsWith(".jpg") ||
                          editingProductConfig.linkImg
                            .toLowerCase()
                            .endsWith(".png") ||
                          editingProductConfig.linkImg
                            .toLowerCase()
                            .endsWith(".jpeg")) && (
                          <div className="relative inline-block">
                            <img
                              src={
                                editingProductConfig.linkImg ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg"
                              }
                              className="w-20 h-20 object-cover rounded border border-gray-300 shadow-sm"
                              alt="Uploaded Image"
                            />
                            <button
                              onClick={() => handleEditRemoveFile("linkImg")}
                              className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold translate-x-1 -translate-y-1"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                </div>

                {/* --- LINK THANKS CARD --- */}
                <div>
                  <Label>Link Thanks Card</Label>
                  <div className="relative">
                    <Input
                      type="file"
                      ref={editLinkThanksCardRef}
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const validTypes = ["image/jpeg", "image/png"];
                          const validNames = [".jpg", ".jpeg", ".png"];
                          const hasValidExtension = validNames.some((ext) =>
                            file.name.toLowerCase().endsWith(ext)
                          );

                          if (
                            !validTypes.includes(file.type) ||
                            !hasValidExtension
                          ) {
                            Swal.fire(
                              "Invalid File",
                              "Please upload only JPG, JPEG, or PNG files",
                              "error"
                            );
                            e.target.value = "";
                            return;
                          }
                          handleEditFileUpload("linkThanksCard", e);
                        }
                      }}
                      disabled={editUploadProgress.linkThanksCard.isUploading}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: JPG, JPEG, PNG
                    </p>
                    {editUploadProgress.linkThanksCard.isUploading && (
                      <CircularProgress
                        progress={editUploadProgress.linkThanksCard.progress}
                      />
                    )}
                  </div>

                  {editingProductConfig.linkThanksCard &&
                    !editUploadProgress.linkThanksCard.isUploading && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          Uploaded:{" "}
                          <a
                            href={editingProductConfig.linkThanksCard}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-blue-600 truncate max-w-[200px]"
                          >
                            {editingProductConfig.linkThanksCard
                              .split("/")
                              .pop()}
                          </a>
                        </p>
                        <div className="relative inline-block">
                          <img
                            src={
                              editingProductConfig.linkThanksCard ||
                              "/placeholder.svg" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg"
                            }
                            className="w-20 h-20 object-cover rounded border border-gray-300 shadow-sm"
                            alt="Uploaded Thanks Card"
                          />
                          <button
                            onClick={() =>
                              handleEditRemoveFile("linkThanksCard")
                            }
                            className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold translate-x-1 -translate-y-1"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    )}
                </div>

                {/* --- LINK FILE DESIGN --- */}
                <div>
                  <Label>Link File Design</Label>
                  <div className="relative">
                    <Input
                      type="file"
                      ref={editLinkFileDesignRef}
                      accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const validTypes = ["image/jpeg", "image/png"];
                          const validNames = [".jpg", ".jpeg", ".png"];
                          const hasValidExtension = validNames.some((ext) =>
                            file.name.toLowerCase().endsWith(ext)
                          );

                          if (
                            !validTypes.includes(file.type) ||
                            !hasValidExtension
                          ) {
                            Swal.fire(
                              "Invalid File",
                              "Please upload only JPG, JPEG, or PNG files",
                              "error"
                            );
                            e.target.value = "";
                            return;
                          }
                          handleEditFileUpload("linkFileDesign", e);
                        }
                      }}
                      disabled={editUploadProgress.linkFileDesign.isUploading}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported: JPG, JPEG, PNG
                    </p>
                    {editUploadProgress.linkFileDesign.isUploading && (
                      <CircularProgress
                        progress={editUploadProgress.linkFileDesign.progress}
                      />
                    )}
                  </div>

                  {editingProductConfig.linkFileDesign &&
                    !editUploadProgress.linkFileDesign.isUploading && (
                      <div className="mt-2 space-y-2">
                        <p className="text-sm text-green-600 flex items-center gap-1">
                          Uploaded:{" "}
                          <a
                            href={editingProductConfig.linkFileDesign}
                            target="_blank"
                            rel="noreferrer"
                            className="underline text-blue-600 truncate max-w-[200px]"
                          >
                            {editingProductConfig.linkFileDesign
                              .split("/")
                              .pop()}
                          </a>
                        </p>

                        {(editingProductConfig.linkFileDesign
                          .toLowerCase()
                          .endsWith(".jpg") ||
                          editingProductConfig.linkFileDesign
                            .toLowerCase()
                            .endsWith(".png") ||
                          editingProductConfig.linkFileDesign
                            .toLowerCase()
                            .endsWith(".jpeg")) && (
                          <div className="relative inline-block">
                            <img
                              src={
                                editingProductConfig.linkFileDesign ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg" ||
                                "/placeholder.svg"
                              }
                              className="w-20 h-20 object-cover rounded border border-gray-300 shadow-sm"
                              alt="Uploaded Design File"
                            />
                            <button
                              onClick={() =>
                                handleEditRemoveFile("linkFileDesign")
                              }
                              className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold translate-x-1 -translate-y-1"
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              </div>

              {/* --- NOTE --- */}
              <div>
                <Label>Note</Label>
                <Textarea
                  rows={3}
                  value={editingProductConfig.note || ""}
                  onChange={(e) =>
                    setEditingProductConfig((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  placeholder="Enter any additional notes"
                  className="mt-1"
                />
              </div>

              {/* --- ACTION BUTTONS --- */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <button
                  onClick={() => {
                    setEditingProductId(null);
                    setEditingProductConfig({});
                    setEditingProductDetail(null); // Clear detail state on close
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSaveEditedProduct}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button onClick={handleNext}>Next Step</Button>
        <Button variant="outline" onClick={() => setCurrentStep(1)}>
          Back
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const productsPerPage = catalogItemsPerPage;
    const totalPages = Math.ceil(totalCatalogProducts / productsPerPage);
    const startIdx = (catalogPage - 1) * productsPerPage;
    const endIdx = startIdx + productsPerPage;
    const currentProducts = catalogProducts.slice(startIdx, endIdx);

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Step 3: Add More Products to Order
        </h3>

        {/* Search & Filter */}
        <div className="flex flex-col md:flex-row gap-4">
          {" "}
          {/* Changed to flex column for mobile */}
          <Input
            type="text"
            placeholder="Search products by name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCatalogPage(1); // Use setCatalogPage instead of setCurrentPage
            }}
            className="w-full md:flex-1" // Allow input to take available space
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            {" "}
            {/* Ensure select doesn't shrink */}
            <Label className="whitespace-nowrap">Items per page:</Label>
            <Select
              value={catalogItemsPerPage.toString()}
              onValueChange={(val) => {
                setCatalogItemsPerPage(Number(val));
                setCatalogPage(1); // Use setCatalogPage
              }}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        {catalogLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : catalogProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogProducts.map((product) => (
              <div
                key={product.productId} // Use productId for key
                className="border rounded-lg overflow-hidden hover:shadow-lg transition cursor-pointer"
                onClick={() => {
                  handleProductSelect(product);
                }}
              >
                <img
                  src={product.itemLink || "/placeholder.svg"}
                  alt={product.productName}
                  className="w-full h-40 object-cover"
                />
                <div className="p-3">
                  <h4 className="font-semibold text-sm truncate">
                    {product.productName}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {product.describe}
                  </p>
                  {product.variants && product.variants.length > 0 && (
                    <p className="text-sm font-bold text-blue-600 mt-1">
                      {Math.min(
                        ...product.variants.map((v) => v.totalCost)
                      ).toFixed(2)}{" "}
                      VND
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No products found
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setCatalogPage(Math.max(1, catalogPage - 1))} // Use setCatalogPage
              disabled={catalogPage === 1}
            >
              Previous
            </Button>

            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <Button
                    key={page}
                    variant={catalogPage === page ? "default" : "outline"} // Use catalogPage
                    onClick={() => setCatalogPage(page)} // Use setCatalogPage
                    className="w-10 h-10 p-0"
                  >
                    {page}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="outline"
              onClick={() =>
                setCatalogPage(Math.min(totalPages, catalogPage + 1))
              } // Use setCatalogPage
              disabled={catalogPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}

        <p className="text-sm text-gray-600 text-center">
          Page {catalogPage} of {totalPages} ({totalCatalogProducts} items)
        </p>

        {/* Navigation Buttons */}
        <div className="flex gap-2 justify-between pt-4">
          <Button variant="outline" onClick={() => setCurrentStep(2)}>
            Back
          </Button>
          {currentOrderProducts.length > 0 || cartProducts.length > 0 ? (
            <Button onClick={() => setCurrentStep(5)}>Review Order</Button>
          ) : (
            <Button disabled>Next (Add Products First)</Button>
          )}
        </div>
      </div>
    );
  };

  const renderStep4 = () => (
    <div className="space-y-4">
      <Input value={orderCodeGoc} disabled />
      <h3 className="text-lg font-semibold">
        Step 4: Configure Product & Review Costs
      </h3>

      {currentProduct && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4 border border-blue-100">
          <div className="flex items-center gap-4">
            <img
              src={currentProduct.itemLink || "/placeholder.svg"}
              alt={currentProduct.productName}
              className="w-16 h-16 object-cover rounded"
            />
            <div>
              <h4 className="font-semibold text-gray-900">
                {currentProduct.productName}
              </h4>
              <p className="text-sm text-gray-600">{currentProduct.describe}</p>
            </div>
          </div>
        </div>
      )}

      {editingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Product</h3>
              <button
                onClick={() => {
                  setEditingProductId(null);
                  setEditingProductConfig({});
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Size selection for editing */}
              <div>
                <Label htmlFor="editSize">Size *</Label>
                <Select
                  value={editingProductConfig.variantId?.toString() || ""}
                  onValueChange={(value) => {
                    const selected =
                      currentProduct?.variants?.find(
                        (v) => v.productVariantId.toString() === value
                      ) ||
                      currentOrderProducts
                        .find((p) => p.id === editingProductId)
                        ?.variants?.find(
                          (v) => v.productVariantId.toString() === value
                        );
                    setEditingProductConfig((prev) => ({
                      ...prev,
                      size: selected?.sizeInch || "",
                      variantId: selected?.productVariantId,
                      price: selected?.baseCost || 0,
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      currentProduct?.variants ||
                      currentOrderProducts.find(
                        (p) => p.id === editingProductId
                      )?.variants ||
                      []
                    ).map((v) => (
                      <SelectItem
                        key={v.productVariantId}
                        value={v.productVariantId.toString()}
                      >
                        {v.sizeInch} -{" "}
                        {Number(v.baseCost).toLocaleString("vi-VN")} ₫
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Link Image - Choose File */}
              <div>
                <Label htmlFor="editLinkImg">Link Image</Label>
                <div className="relative">
                  <Input
                    id="editLinkImg"
                    type="file"
                    accept="image/*"
                    ref={editLinkImgRef}
                    onChange={(e) => handleEditFileUpload("linkImg", e)}
                    disabled={editUploadProgress.linkImg.isUploading}
                    className="mt-1"
                  />
                  {editUploadProgress.linkImg.isUploading && (
                    <CircularProgress
                      progress={editUploadProgress.linkImg.progress}
                    />
                  )}
                </div>
                {editingProductConfig.linkImg &&
                  !editUploadProgress.linkImg.isUploading && (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        Uploaded:{" "}
                        <a
                          href={editingProductConfig.linkImg}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-blue-600 truncate max-w-[200px]"
                        >
                          {editingProductConfig.linkImg.split("/").pop()}
                        </a>
                      </p>
                      {(editingProductConfig.linkImg
                        .toLowerCase()
                        .endsWith(".jpg") ||
                        editingProductConfig.linkImg
                          .toLowerCase()
                          .endsWith(".png") ||
                        editingProductConfig.linkImg
                          .toLowerCase()
                          .endsWith(".jpeg")) && (
                        <div className="relative inline-block">
                          <img
                            src={
                              editingProductConfig.linkImg || "/placeholder.svg"
                            }
                            className="w-20 h-20 object-cover rounded border border-gray-300 shadow-sm"
                            alt="Uploaded Image"
                          />
                          <button
                            type="button"
                            onClick={() => handleEditRemoveFile("linkImg")}
                            className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold translate-x-1 -translate-y-1"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Link Thanks Card - Choose File */}
              <div>
                <Label htmlFor="editLinkThanksCard">Link Thanks Card</Label>
                <div className="relative">
                  <Input
                    id="editLinkThanksCard"
                    type="file"
                    accept="image/*"
                    ref={editLinkThanksCardRef}
                    onChange={(e) => handleEditFileUpload("linkThanksCard", e)}
                    disabled={editUploadProgress.linkThanksCard.isUploading}
                    className="mt-1"
                  />
                  {editUploadProgress.linkThanksCard.isUploading && (
                    <CircularProgress
                      progress={editUploadProgress.linkThanksCard.progress}
                    />
                  )}
                </div>
                {editingProductConfig.linkThanksCard &&
                  !editUploadProgress.linkThanksCard.isUploading && (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        Uploaded:{" "}
                        <a
                          href={editingProductConfig.linkThanksCard}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-blue-600 truncate max-w-[200px]"
                        >
                          {editingProductConfig.linkThanksCard.split("/").pop()}
                        </a>
                      </p>
                      <div className="relative inline-block">
                        <img
                          src={
                            editingProductConfig.linkThanksCard ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg" ||
                            "/placeholder.svg"
                          }
                          className="w-20 h-20 object-cover rounded border border-gray-300 shadow-sm"
                          alt="Uploaded Thanks Card"
                        />
                        <button
                          type="button"
                          onClick={() => handleEditRemoveFile("linkThanksCard")}
                          className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold translate-x-1 -translate-y-1"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}
              </div>

              {/* Link File Design - Choose File */}
              <div>
                <Label htmlFor="editLinkFileDesign">Link File Design</Label>
                <div className="relative">
                  <Input
                    id="editLinkFileDesign"
                    type="file"
                    ref={editLinkFileDesignRef}
                    onChange={(e) => handleEditFileUpload("linkFileDesign", e)}
                    disabled={editUploadProgress.linkFileDesign.isUploading}
                    className="mt-1"
                  />
                  {editUploadProgress.linkFileDesign.isUploading && (
                    <CircularProgress
                      progress={editUploadProgress.linkFileDesign.progress}
                    />
                  )}
                </div>
                {editingProductConfig.linkFileDesign &&
                  !editUploadProgress.linkFileDesign.isUploading && (
                    <div className="mt-2 space-y-2">
                      <p className="text-sm text-green-600 flex items-center gap-1">
                        Uploaded:{" "}
                        <a
                          href={editingProductConfig.linkFileDesign}
                          target="_blank"
                          rel="noreferrer"
                          className="underline text-blue-600 truncate max-w-[200px]"
                        >
                          {editingProductConfig.linkFileDesign.split("/").pop()}
                        </a>
                      </p>

                      {(editingProductConfig.linkFileDesign
                        .toLowerCase()
                        .endsWith(".jpg") ||
                        editingProductConfig.linkFileDesign
                          .toLowerCase()
                          .endsWith(".png") ||
                        editingProductConfig.linkFileDesign
                          .toLowerCase()
                          .endsWith(".jpeg")) && (
                        <div className="relative inline-block">
                          <img
                            src={
                              editingProductConfig.linkFileDesign ||
                              "/placeholder.svg" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg" ||
                              "/placeholder.svg"
                            }
                            className="w-20 h-20 object-cover rounded border border-gray-300 shadow-sm"
                            alt="Uploaded Design File"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              handleEditRemoveFile("linkFileDesign")
                            }
                            className="absolute top-0 right-0 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold translate-x-1 -translate-y-1"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  )}
              </div>

              {/* Quantity for editing */}
              <div>
                <Label htmlFor="editQuantity">Quantity</Label>
                <Input
                  id="editQuantity"
                  type="number"
                  min="1"
                  value={editingProductConfig.quantity}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d*$/.test(val)) {
                      const num = Number.parseInt(val, 10);
                      if (!isNaN(num) && num >= 1 && num <= 20) {
                        setEditingProductConfig((prev) => ({
                          ...prev,
                          quantity: num,
                        }));
                      } else if (num > 20) {
                        setErrorMessage("Quantity must be between 1 and 20.");
                        setShowErrorDialog(true);
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (["e", "E", "+", "-", "."].includes(e.key))
                      e.preventDefault();
                  }}
                  placeholder="1"
                  className="mt-1"
                />
              </div>

              {/* Note for editing */}
              <div>
                <Label htmlFor="editNote">Note</Label>
                <Textarea
                  id="editNote"
                  value={editingProductConfig.note}
                  onChange={(e) =>
                    setEditingProductConfig((prev) => ({
                      ...prev,
                      note: e.target.value,
                    }))
                  }
                  placeholder="Enter any additional notes"
                  rows={3}
                  className="mt-1"
                />
              </div>

              {/* Modal Action Buttons */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={handleSaveEditedProduct}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingProductId(null);
                    setEditingProductConfig({});
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Select Size */}
        <div>
          <Label htmlFor="size">Size *</Label>
          <Select
            value={currentProductConfig.variantId?.toString() || ""}
            onValueChange={(value) => {
              const selected = currentProduct?.variants?.find(
                (v) => v.productVariantId.toString() === value
              );
              setCurrentProductConfig((prev) => ({
                ...prev,
                size: selected?.sizeInch || "",
                variantId: selected?.productVariantId,
                price: selected?.totalCost || 0,
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              {currentProduct?.variants?.map((v) => (
                <SelectItem
                  key={v.productVariantId}
                  value={v.productVariantId.toString()}
                >
                  {v.sizeInch} - {Number(v.baseCost).toLocaleString("vi-VN")} ₫
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Link Image - File upload with thumbnail preview */}
        <div>
          <Label htmlFor="linkImg">Link Image</Label>
          <div className="relative">
            <Input
              id="linkImg"
              type="file"
              accept="image/*"
              ref={linkImgRef}
              onChange={(e) => handleFileUpload("linkImg", e)}
              disabled={uploadProgress.linkImg.isUploading}
              className="mt-1"
            />
            {uploadProgress.linkImg.isUploading && (
              <CircularProgress progress={uploadProgress.linkImg.progress} />
            )}
          </div>
          {currentProductConfig.linkImg &&
            !uploadProgress.linkImg.isUploading && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-green-600 font-medium">
                  Uploaded: {currentProductConfig.linkImg.split("/").pop()}
                </p>
                <div className="relative w-16 h-16 inline-block">
                  <img
                    src={currentProductConfig.linkImg || "/placeholder.svg"}
                    alt="Uploaded image preview"
                    className="w-full h-full object-cover rounded border border-gray-300 bg-gray-100"
                    onError={(e) => {
                      console.log(
                        "[v0] Image failed to load:",
                        currentProductConfig.linkImg
                      );
                      e.target.src = "/placeholder.svg";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveUploadedFile("linkImg")}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-sm font-bold transition"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
        </div>

        {/* Link Thanks Card - File upload with thumbnail preview */}
        <div>
          <Label htmlFor="linkThanksCard">Link Thanks Card</Label>
          <div className="relative">
            <Input
              id="linkThanksCard"
              type="file"
              accept="image/*"
              ref={linkThanksCardRef}
              onChange={(e) => handleFileUpload("linkThanksCard", e)}
              disabled={uploadProgress.linkThanksCard.isUploading}
              className="mt-1"
            />
            {uploadProgress.linkThanksCard.isUploading && (
              <CircularProgress
                progress={uploadProgress.linkThanksCard.progress}
              />
            )}
          </div>
          {currentProductConfig.linkThanksCard &&
            !uploadProgress.linkThanksCard.isUploading && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-green-600 font-medium">
                  Uploaded:{" "}
                  {currentProductConfig.linkThanksCard.split("/").pop()}
                </p>
                <div className="relative w-16 h-16 inline-block">
                  <img
                    src={
                      currentProductConfig.linkThanksCard || "/placeholder.svg"
                    }
                    alt="Uploaded thanks card preview"
                    className="w-full h-full object-cover rounded border border-gray-300 bg-gray-100"
                    onError={(e) => {
                      console.log(
                        "[v0] Image failed to load:",
                        currentProductConfig.linkThanksCard
                      );
                      e.target.src = "/placeholder.svg";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveUploadedFile("linkThanksCard")}
                    className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-sm font-bold transition"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
        </div>

        {/* Link File Design - File upload with thumbnail preview */}
        <div>
          <Label htmlFor="linkFileDesign">Link File Design</Label>
          <div className="relative">
            <Input
              id="linkFileDesign"
              type="file"
              accept="image/*,.pdf,.zip,.ai,.psd"
              ref={linkFileDesignRef}
              onChange={(e) => handleFileUpload("linkFileDesign", e)}
              disabled={uploadProgress.linkFileDesign.isUploading}
              className="mt-1"
            />
            {uploadProgress.linkFileDesign.isUploading && (
              <CircularProgress
                progress={uploadProgress.linkFileDesign.progress}
              />
            )}
          </div>
          {currentProductConfig.linkFileDesign &&
            !uploadProgress.linkFileDesign.isUploading && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-green-600 font-medium">
                  Uploaded:{" "}
                  {currentProductConfig.linkFileDesign.split("/").pop()}
                </p>
                {(currentProductConfig.linkFileDesign
                  .toLowerCase()
                  .endsWith(".jpg") ||
                  currentProductConfig.linkFileDesign
                    .toLowerCase()
                    .endsWith(".png") ||
                  currentProductConfig.linkFileDesign
                    .toLowerCase()
                    .endsWith(".jpeg")) && (
                  <div className="relative w-16 h-16 inline-block">
                    <img
                      src={
                        currentProductConfig.linkFileDesign ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg"
                      }
                      alt="Uploaded file design preview"
                      className="w-full h-full object-cover rounded border border-gray-300 bg-gray-100"
                      onError={(e) => {
                        console.log(
                          "[v0] Image failed to load:",
                          currentProductConfig.linkFileDesign
                        );
                        e.target.src = "/placeholder.svg";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveUploadedFile("linkFileDesign")}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-sm font-bold transition"
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Quantity */}
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            value={currentProductConfig.quantity}
            onChange={(e) => {
              const val = e.target.value;
              if (/^\d*$/.test(val)) {
                const num = Number.parseInt(val, 10);
                if (isNaN(num) || num < 1 || num > 20) {
                  // alert("Quantity cannot be more than 20."); // Avoid alert, handle with state/feedback
                  setErrorMessage("Quantity must be between 1 and 20.");
                  setShowErrorDialog(true);
                  return;
                }
                setCurrentProductConfig((prev) => ({
                  ...prev,
                  quantity: num,
                }));
              }
            }}
            onKeyDown={(e) => {
              if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
            }}
            placeholder="1"
            className="mt-1"
          />
        </div>

        {/* Note */}
        <div className="md:col-span-2">
          <Label htmlFor="note">Note</Label>
          <Textarea
            id="note"
            value={currentProductConfig.note}
            onChange={(e) =>
              setCurrentProductConfig((prev) => ({
                ...prev,
                note: e.target.value,
              }))
            }
            placeholder="Enter any additional notes"
            rows={3}
            className="mt-1"
          />
        </div>

        {/* Cost Breakdown */}
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200 mt-4 md:col-span-2">
          <h4 className="font-semibold text-slate-900 mb-4 text-lg">
            Cost Breakdown
          </h4>

          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Base Cost:</span>
              <span className="font-medium text-slate-900">
                {Number(getCostDetails().baseCost).toLocaleString("vi-VN")} ₫
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Ship Cost:</span>
              <span className="font-medium text-slate-900">
                {Number(getCostDetails().shipCost).toLocaleString("vi-VN")} ₫
              </span>
            </div>

            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600">Extra Shipping (per unit):</span>
              <span className="font-medium text-slate-900">
                {Number(getCostDetails().extraShipping).toLocaleString("vi-VN")}{" "}
                ₫
              </span>
            </div>

            <div className="border-t border-slate-300 pt-3 mt-3 flex justify-between items-center bg-white bg-opacity-60 p-3 rounded">
              <span className="font-semibold text-slate-900">Unit Price:</span>
              <span className="font-bold text-blue-600 text-base">
                {Number(
                  getCostDetails().baseCost + getCostDetails().shipCost
                ).toLocaleString("vi-VN")}{" "}
                ₫
              </span>
            </div>
          </div>
        </div>

        {/* Product Total Price */}
        <div className="md:col-span-2 mt-2">
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-slate-700 font-semibold">
                Product Price:
              </span>
              <span className="text-xl font-bold text-blue-600">
                {Number(calculateProductPrice()).toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 md:col-span-2">
        <button
          onClick={() => {
            setCurrentStep(3); // "Add More Products" button goes back to step 3
          }}
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
        >
          Add More Products
        </button>
        <button
          onClick={handleAddToCart}
          className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-medium"
        >
          Add to Order
        </button>
      </div>

      {/* Cart Display */}
      {cartProducts.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <h4 className="font-semibold mb-3">
            Products in Order ({cartProducts.length})
          </h4>

          <div className="space-y-3">
            {cartProducts.map((item) => (
              <div
                key={item.id}
                className="border rounded-lg p-4 bg-slate-50 border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product.itemLink || "/placeholder.svg"}
                      alt={item.product.productName}
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="font-medium text-gray-900">
                        {item.product.productName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.config.size} • Quantity: {item.config.quantity}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleProductDetails(item.id)}
                    >
                      {expandedProducts[item.id] ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-1" />
                          Hide Details
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-1" />
                          View Details
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveFromCart(item.id)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>

                {expandedProducts[item.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Size</Label>
                        <Input
                          value={item.config.size || ""}
                          readOnly
                          className="bg-gray-100 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={item.config.quantity}
                          readOnly
                          className="bg-gray-100 cursor-not-allowed"
                        />
                      </div>

                      <div>
                        <Label>Link Image</Label>
                        {item.config.linkImg ? (
                          <div className="space-y-2">
                            <a
                              href={item.config.linkImg}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline break-all"
                            >
                              {item.config.linkImg.split("/").pop()}
                            </a>
                            <img
                              src={item.config.linkImg || "/placeholder.svg"}
                              alt="Link Image"
                              className="w-24 h-24 object-cover rounded border"
                            />
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            No image uploaded
                          </p>
                        )}
                      </div>

                      <div>
                        <Label>Link Thanks Card</Label>
                        {item.config.linkThanksCard ? (
                          <div className="space-y-2">
                            <a
                              href={item.config.linkThanksCard}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline break-all"
                            >
                              {item.config.linkThanksCard.split("/").pop()}
                            </a>
                            <img
                              src={
                                item.config.linkThanksCard || "/placeholder.svg"
                              }
                              alt="Thanks Card"
                              className="w-24 h-24 object-cover rounded border"
                            />
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            No thanks card uploaded
                          </p>
                        )}
                      </div>

                      <div>
                        <Label>Link File Design</Label>
                        {item.config.linkFileDesign ? (
                          <div className="space-y-2">
                            <a
                              href={item.config.linkFileDesign}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:underline break-all"
                            >
                              {item.config.linkFileDesign.split("/").pop()}
                            </a>
                            {(item.config.linkFileDesign.endsWith(".jpg") ||
                              item.config.linkFileDesign.endsWith(".png") ||
                              item.config.linkFileDesign.endsWith(".jpeg")) && (
                              <img
                                src={
                                  item.config.linkFileDesign ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg" ||
                                  "/placeholder.svg"
                                }
                                alt="File Design"
                                className="w-24 h-24 object-cover rounded border"
                              />
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">
                            No file design uploaded
                          </p>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <Label>Note</Label>
                        <Textarea
                          value={item.config.note || ""}
                          readOnly
                          className="bg-gray-100 cursor-not-allowed"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cost Breakdown Section */}
      <div className="mt-6 bg-gradient-to-br from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200">
        <h4 className="font-semibold text-gray-900 mb-4 text-lg">
          Cost Breakdown
        </h4>

        <div className="space-y-4">
          {/* Breakdown for existing items */}
          {currentOrderProducts.length > 0 && (
            <>
              <div>
                <p className="text-sm text-gray-600 italic mb-2">
                  Breakdown for existing items:
                </p>

                {getDetailedCostBreakdown().existingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-sm ml-4 mb-1"
                  >
                    <span className="text-gray-600">
                      {item.name} (Qty: {item.qty}):
                    </span>
                    <span className="text-gray-900">
                      {Number(item.baseCost).toLocaleString("vi-VN")} ₫
                    </span>
                  </div>
                ))}

                <div className="flex justify-between text-sm ml-4 font-medium mt-2 pb-2 border-b border-gray-200">
                  <span className="text-gray-600">
                    Base Ship Cost (Existing):
                  </span>
                  <span className="text-gray-900">
                    {Number(
                      Math.max(
                        ...getDetailedCostBreakdown().existingItems.map(
                          (i) => i.shipCost
                        ),
                        0
                      )
                    ).toLocaleString("vi-VN")}{" "}
                    ₫
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Breakdown for new items */}
          {cartProducts.length > 0 && (
            <>
              <div>
                <p className="text-sm text-gray-600 italic mb-2">
                  Breakdown for new items:
                </p>

                {getDetailedCostBreakdown().newItems.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-3 rounded border border-gray-100 mb-2"
                  >
                    <p className="font-medium text-gray-800 mb-2">
                      {item.name}
                    </p>

                    <div className="flex justify-between text-sm ml-3">
                      <span className="text-gray-600">
                        Base Cost (
                        {Number(item.baseCost).toLocaleString("vi-VN")} ₫ x{" "}
                        {item.qty}):
                      </span>
                      <span className="font-medium text-gray-900">
                        {Number(item.totalBaseCost).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>

                    <div className="flex justify-between text-sm ml-3">
                      <span className="text-gray-600">Ship Cost:</span>
                      <span className="font-medium text-gray-900">
                        {Number(item.shipCost).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>

                    {item.extraShipping > 0 && item.qty > 1 && (
                      <div className="flex justify-between text-sm ml-3">
                        <span className="text-gray-600">
                          Extra Shipping (
                          {Number(item.extraShipping).toLocaleString("vi-VN")} ₫
                          x {item.qty - 1}):
                        </span>
                        <span className="font-medium text-gray-900">
                          {Number(
                            item.extraShipping * (item.qty - 1)
                          ).toLocaleString("vi-VN")}{" "}
                          ₫
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Summary totals */}
          <div className="border-t-2 border-gray-300 pt-4 space-y-2 bg-white bg-opacity-50 p-4 rounded">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-700">
                Total Base Cost (All Items):
              </span>
              <span className="text-gray-900">
                {Number(
                  getDetailedCostBreakdown().totalBaseCost
                ).toLocaleString("vi-VN")}{" "}
                ₫
              </span>
            </div>

            <div className="flex justify-between text-sm font-medium">
              <span className="text-gray-700">
                Base Ship Cost (Max from all):
              </span>
              <span className="text-gray-900">
                {Number(getDetailedCostBreakdown().maxShipCost).toLocaleString(
                  "vi-VN"
                )}{" "}
                ₫
              </span>
            </div>

            {getDetailedCostBreakdown().extraShippingTotal > 0 && (
              <div className="flex justify-between text-sm font-medium">
                <span className="text-gray-700">
                  Extra Shipping (Max from{" "}
                  {getDetailedCostBreakdown().maxExtraProductName}):
                </span>
                <span className="text-gray-900">
                  {Number(
                    getDetailedCostBreakdown().extraShippingTotal
                  ).toLocaleString("vi-VN")}{" "}
                  ₫
                </span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-bold">
              <span className="text-gray-900">Order Total:</span>
              <span className="text-blue-600 text-lg">
                {Number(getDetailedCostBreakdown().orderTotal).toLocaleString(
                  "vi-VN"
                )}{" "}
                ₫
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Total Section */}
      <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200 flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2">
            {/* <Checkbox
                id="activeTTS"
                checked={activeTTS}
                onCheckedChange={(checked) => setActiveTTS(checked)}
              />
              <Label htmlFor="activeTTS" className="text-gray-700">
                Active TTS (Add $1 to Total)
              </Label> */}
          </div>

          <Label className="text-lg font-semibold text-blue-700">
            Total Order: {Number(calculateOrderTotal()).toLocaleString("vi-VN")}{" "}
            ₫
          </Label>
        </div>
      </div>

      <div className="flex gap-2 justify-between pt-4">
        <Button
          onClick={() => setCurrentStep(5)}
          disabled={
            cartProducts.length === 0 && currentOrderProducts.length === 0
          }
        >
          Next
        </Button>
      </div>
    </div>
  );

  // Render Step 5: Review & Confirm Order
  // Dòng ~608: Render Step 5: Review & Confirm Order
  const renderStep5 = () => {
    const breakdown = getDetailedCostBreakdown(); // Lấy breakdown đã tính toán đúng

    // Final Total = Order Total đã tính đúng (từ Step 4) + TTS
    const finalTotal = breakdown.orderTotal + (activeTTS ? 1.0 : 0);

    // Tổng số sản phẩm (để hiển thị tiêu đề)
    const totalProductsCount =
      currentOrderProducts.length + cartProducts.length;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Step 5: Review & Save Order</h3>

        {/* Customer Info */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-900">
              Customer Information
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(1)}
              className="text-xs"
            >
              Edit
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-600">Name</p>
              <p className="font-medium text-gray-900">{customerInfo.name}</p>
            </div>
            <div>
              <p className="text-gray-600">Phone</p>
              <p className="font-medium text-gray-900">{customerInfo.phone}</p>
            </div>
            <div>
              <p className="text-gray-600">Email</p>
              <p className="font-medium text-gray-900">{customerInfo.email}</p>
            </div>
            <div>
              <p className="text-gray-600">Address</p>
              <p className="font-medium text-gray-900">
                {customerInfo.address}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Location</p>
              <p className="font-medium text-gray-900">
                {customerInfo.wardName}, {customerInfo.districtName},{" "}
                {customerInfo.provinceName}
              </p>
            </div>
          </div>
        </div>

        {/* Products Summary */}
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
          <div className="flex justify-between items-center mb-3">
            <h4 className="font-semibold text-gray-900">
              All Products ({totalProductsCount})
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(4)}
              className="text-xs"
            >
              Edit Products
            </Button>
          </div>

          <div className="space-y-3">
            {/* Current Products (already in order) */}
            {currentOrderProducts.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Existing Products:
                </p>
                {currentOrderProducts.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded p-3 flex justify-between items-start mb-2"
                  >
                    <div className="flex gap-3 flex-1">
                      <img
                        src={item.linkImg || "/placeholder.svg"}
                        alt={item.productName}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.productName || "Product"}
                        </p>
                        <p className="text-sm text-gray-600">
                          Size: {item.size || "N/A"} • Qty: {item.quantity || 0}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      {/* Hiển thị giá tổng (price) đã lưu trong currentOrderProducts */}
                      <p className="font-medium text-gray-900">
                        {Number(item.baseCost || 0).toLocaleString("vi-VN")} ₫
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* New Products to Add (from manual configuration in Step 4) */}
            {cartProducts.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Products to Add:
                </p>
                {cartProducts.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded p-3 flex justify-between items-start mb-2"
                  >
                    <div className="flex gap-3 flex-1">
                      <img
                        src={item.product.itemLink || "/placeholder.svg"}
                        alt={item.product.productName}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {item.product.productName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Size: {item.config.size} • Qty: {item.config.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-4">
                      {/* Hiển thị totalPrice đã tính trong handleAddToCart */}
                      <p className="font-medium text-gray-900">
                        ${item.totalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Order Total Summary */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">
              Total Order:
            </span>
            <span className="text-2xl font-bold text-green-700">
              {Number(finalTotal).toLocaleString("vi-VN")} ₫
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSaveOrder}
            disabled={isSaving}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSaving ? "Saving..." : "Save Order"}
          </Button>
          <Button variant="outline" onClick={() => setCurrentStep(4)}>
            Back to Edit Products
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/seller/manage-order")}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  };

  // Main Render Logic for Steps
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <div className="flex">
        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="mb-6 flex items-center gap-2">
              <Link href="/seller/manage-order">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Edit Order</h1>
            </div>

            {/* Step Indicator */}
            <div className="mb-8 flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step <= currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 5 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        step < currentStep ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Dialog for Errors */}
            {showErrorDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                  <h3 className="text-lg font-semibold mb-4">Error</h3>
                  <p className="text-gray-700 mb-6">{errorMessage}</p>
                  <Button onClick={() => setShowErrorDialog(false)}>OK</Button>
                </div>
              </div>
            )}

            {/* Dialog for Success Messages */}
            {showSuccessDialog && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                  <h3 className="text-lg font-semibold mb-4">Success</h3>
                  <p className="text-green-600 font-medium mb-6">
                    {successMessage}
                  </p>
                  <Button onClick={() => setShowSuccessDialog(false)}>
                    OK
                  </Button>
                </div>
              </div>
            )}

            {/* Content Area for Steps */}
            <Card>
              <CardContent className="p-6">
                {(() => {
                  switch (currentStep) {
                    case 1:
                      return renderStep1();
                    case 2:
                      return renderStep2();
                    case 3:
                      return renderStep3();
                    case 4:
                      return renderStep4();
                    case 5:
                      return renderStep5();
                    default:
                      return null;
                  }
                })()}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
