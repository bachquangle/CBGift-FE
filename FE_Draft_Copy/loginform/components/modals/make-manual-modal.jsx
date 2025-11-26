"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import apiClient from "../../lib/apiClient";
import { useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ChevronDown, ChevronUp } from "lucide-react";

const CircularProgress = ({ progress }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg width="50" height="50" className="absolute top-1 left-1">
      <circle
        cx="25"
        cy="25"
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="2"
      />
      <circle
        cx="25"
        cy="25"
        r={radius}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.2s ease" }}
      />
      <text
        x="25"
        y="30"
        textAnchor="middle"
        fontSize="10"
        fontWeight="bold"
        fill="#1f2937"
      >
        {Math.round(progress)}%
      </text>
    </svg>
  );
};

// Mock product data
const availableProducts = [
  {
    id: 1,
    name: "Custom Acrylic Keychain",
    description: "High-quality acrylic keychain with custom design",
    image: "/acrylic-keychain.jpg",
    basePrice: 5.99,
    sizes: ["Small (2 inch)", "Medium (3 inch)", "Large (4 inch)"],
    accessories: ["None", "Keyring", "Phone Strap", "Carabiner"],
  },
  {
    id: 2,
    name: "Custom Acrylic Stand",
    description: "Durable acrylic display stand for photos or artwork",
    image: "/acrylic-stand.jpg",
    basePrice: 12.99,
    sizes: ["Small (4x6 inch)", "Medium (5x7 inch)", "Large (8x10 inch)"],
    accessories: ["None", "LED Base", "Rotating Base", "Weighted Base"],
  },
  {
    id: 3,
    name: "Custom Acrylic Charm",
    description: "Cute acrylic charm perfect for bags and accessories",
    image: "/acrylic-charm.jpg",
    basePrice: 3.99,
    sizes: ["Mini (1 inch)", "Small (1.5 inch)", "Medium (2 inch)"],
    accessories: ["None", "Bell", "Tassel", "Chain"],
  },
];

export default function MakeManualModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState({});
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [orderId, setOrderId] = useState("");
  const [isOrderIdSet, setIsOrderIdSet] = useState(false);
  const [activeTTS, setActiveTTS] = useState(false);
  const [searchProvince, setSearchProvince] = useState("");
  const [searchDistrict, setSearchDistrict] = useState("");
  const [searchWard, setSearchWard] = useState("");
  const [openProvinceDropdown, setOpenProvinceDropdown] = useState(false);
  const [openDistrictDropdown, setOpenDistrictDropdown] = useState(false);
  const [openWardDropdown, setOpenWardDropdown] = useState(false);
  const [hoverProvince, setHoverProvince] = useState(null);
  const [hoverDistrict, setHoverDistrict] = useState(null);
  const [hoverWard, setHoverWard] = useState(null);
  const linkThanksCardRef = useRef(null);
  const linkFileDesignRef = useRef(null);
  const linkImgRef = useRef(null);

  const [uploadProgress, setUploadProgress] = useState({
    linkImg: { isUploading: false, progress: 0 },
    linkThanksCard: { isUploading: false, progress: 0 },
    linkFileDesign: { isUploading: false, progress: 0 },
  });

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

  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  const [cartProducts, setCartProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [currentProductConfig, setCurrentProductConfig] = useState({
    size: "",
    accessory: "",
    linkImg: null,
    linkThanksCard: null,
    linkFileDesign: null,
    quantity: 1,
    activeTTS: false,
    note: "",
    productPrice: 0,
  });

  const [previewData, setPreviewData] = useState(null);

  const resetForm = () => {
    setCurrentStep(1);
    setCustomerInfo({
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
    setCartProducts([]);
    setCurrentProduct(null);
    setOrderId("");
    setIsOrderIdSet(false);
    setCurrentProductConfig({
      size: "",
      accessory: "",
      linkThanksCard: null,
      linkFileDesign: null,
      quantity: 1,
      activeTTS: false,
      note: "",
      productPrice: 0,
    });
    setDistricts([]);
    setWards([]);
    setPreviewData(null); // Reset preview data
    // Reset upload progress states
    setUploadProgress({
      linkImg: { isUploading: false, progress: 0 },
      linkThanksCard: { isUploading: false, progress: 0 },
      linkFileDesign: { isUploading: false, progress: 0 },
    });
  };

  // ─── Step 2: load products từ BE ───
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [productCurrentPage, setProductCurrentPage] = useState(1);
  const [productItemsPerPage, setProductItemsPerPage] = useState(5);

  useEffect(() => {
    if (!isOpen) return;
    fetchProducts();
    fetchProvinces();
    setProductCurrentPage(1);
    setProductSearchTerm("");
  }, [isOpen]);

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setProductsError(null);
    try {
      const res = await fetch(`${apiClient.defaults.baseURL}/api/Product`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setProducts(data || []);
    } catch (err) {
      console.error("fetchProducts error:", err);
      setProductsError(err.message || "Failed to load products");
    } finally {
      setLoadingProducts(false);
    }
  };

  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const res = await fetch(`https://localhost:7015/api/Location/provinces`, {
        credentials: "include",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // 🔥 Chuẩn hóa data về dạng FE cần
      const normalized = data.map((p) => ({
        id: p.ProvinceID,
        name: p.ProvinceName,
      }));

      setProvinces(normalized);
    } catch (err) {
      console.error("Failed to fetch provinces:", err);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchDistricts = async (provinceId) => {
    setLoadingDistricts(true);
    try {
      const res = await fetch(
        `https://localhost:7015/api/Location/districts/${provinceId}`,
        { credentials: "include" }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      const normalized = data.map((d) => ({
        id: d.DistrictID,
        name: d.DistrictName,
      }));

      setDistricts(normalized);
    } catch (err) {
      alert(`Failed to load districts: ${err.message}`);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchWards = async (districtId) => {
    setLoadingWards(true);
    try {
      const res = await fetch(
        `https://localhost:7015/api/Location/wards/${districtId}`,
        { credentials: "include" }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      const normalized = data.map((w) => ({
        id: w.WardCode,
        name: w.WardName,
      }));

      setWards(normalized);
    } catch (err) {
      alert(`Failed to load wards: ${err.message}`);
    } finally {
      setLoadingWards(false);
    }
  };

  const uploadImage = async (file, onProgress) => {
    const formData = new FormData();
    formData.append("File", file);

    try {
      // Simulate progress updates
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        if (currentProgress < 90) {
          currentProgress += Math.random() * 30;
          if (onProgress) onProgress(Math.min(currentProgress, 90));
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

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Upload failed: ${res.status} - ${errText}`);
      }

      const data = await res.json();
      if (onProgress) onProgress(100);
      console.log("Upload success:", data);
      return data.url || data.secureUrl || data.path || null;
    } catch (err) {
      console.error("Upload error:", err);
      setErrorMessage("Upload failed: " + err.message);
      setShowErrorDialog(true);
      return null;
    }
  };

  const calculateProductPrice = () => {
    if (!currentProduct) return 0;

    const variantId = currentProductConfig.variantId;
    const variant = currentProduct?.variants?.find(
      (v) => v.productVariantId === variantId
    );

    const basePrice = variant?.totalCost ?? currentProduct.basePrice ?? 0;
    const qty = Number.parseInt(currentProductConfig.quantity) || 1;
    const ttsExtra = currentProductConfig.activeTTS ? 1.0 : 0.0;

    const total = (basePrice + ttsExtra) * qty;
    return total;
  };

  const calculateOrderTotal = () => {
    if (cartProducts.length === 0) return 0;

    let totalBaseCost = 0;
    let shipCost = 0;
    let maxExtraShipping = 0;
    let maxBaseShipCost = 0;
    let totalQty = 0;

    cartProducts.forEach((item, index) => {
      const variant = item.product.variants?.find(
        (v) => v.productVariantId === item.config.variantId
      );

      const baseCost = variant?.baseCost ?? 0;
      const shipCost_variant = variant?.shipCost ?? 0;
      const extraShipping = variant?.extraShipping ?? 0;
      const baseShipCost = variant?.shipCost ?? 0; // ⭐ NEW
      const qty = item.config.quantity || 1;

      totalBaseCost += baseCost * qty;

      if (cartProducts.length === 1 && index === 0) {
        shipCost = shipCost_variant;
      }

      // max extra ship
      if (extraShipping > maxExtraShipping) {
        maxExtraShipping = extraShipping;
      }

      // ⭐ NEW — GET MAX BASE SHIP COST
      if (baseShipCost > maxBaseShipCost) {
        maxBaseShipCost = baseShipCost;
      }

      totalQty += qty;
    });

    let total = totalBaseCost + shipCost;

    if (cartProducts.length > 1) {
      total += (totalQty - 1) * maxExtraShipping;
    } else {
      total += (totalQty - 1) * maxExtraShipping;
    }

    // ⭐ NEW — ADD BASE SHIP COST
    total += maxBaseShipCost;

    if (activeTTS) {
      total += 1.0;
    }

    return total;
  };

  const getOrderCostBreakdown = () => {
    if (cartProducts.length === 0) {
      return {
        items: [],
        totalBase: 0,
        shipCost: 0,
        maxExtraShipping: 0,
        maxExtraProductName: "",
      };
    }

    let totalBase = 0;
    let shipCost = 0;
    let maxExtraShipping = 0;
    let maxBaseShipCost = 0;
    let maxExtraProductName = "";

    const breakdownItems = cartProducts.map((item, index) => {
      const variant = item.product.variants?.find(
        (v) => v.productVariantId === item.config.variantId
      );
      const baseCost = variant?.baseCost ?? 0;
      const shipCost_variant = variant?.shipCost ?? 0;
      const baseShipCost = variant?.shipCost ?? 0;
      const extraShipping = variant?.extraShipping ?? 0;
      const qty = item.config.quantity || 1;

      const itemBaseCost = baseCost * qty;
      totalBase += itemBaseCost;

      if (cartProducts.length === 1 && index === 0) {
        shipCost = shipCost_variant;
      }

      if (extraShipping > maxExtraShipping) {
        maxExtraShipping = extraShipping;
        maxExtraProductName = item.product.productName;
      }

      if (baseShipCost > maxBaseShipCost) {
        maxBaseShipCost = baseShipCost;
      }

      return {
        id: item.id,
        name: item.product.productName,
        baseCost,
        qty,
        totalBaseCost: itemBaseCost,
        extraShipping,
      };
    });

    return {
      items: breakdownItems,
      totalBase,
      shipCost,
      maxExtraShipping,
      maxExtraProductName,
      maxBaseShipCost,
    };
  };

  useEffect(() => {
    const total = calculateProductPrice();
    setCurrentProductConfig((prev) => ({
      ...prev,
      productPrice: total,
    }));
  }, [
    currentProductConfig.variantId,
    currentProductConfig.quantity,
    currentProductConfig.activeTTS,
  ]);

  const calculateTotalMoney = () => {
    let total = cartProducts.reduce(
      (sum, product) => sum + product.totalPrice,
      0
    );
    if (activeTTS) total += 1;
    return total;
  };

  const handleNext = () => {
    if (currentStep === 1) {
      console.log("Step 1 - Customer Info:", customerInfo);

      const requiredFields = [
        "name",
        "phone",
        "email",
        "address",
        "provinceId",
        "districtId",
        "wardId",
      ];

      const missing = requiredFields.filter(
        (f) => !customerInfo[f]?.toString().trim()
      );
      if (missing.length > 0) {
        setErrorMessage(
          `Please fill all required fields: ${missing.join(", ")}`
        );
        setShowErrorDialog(true);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(customerInfo.email)) {
        setErrorMessage("Please enter a valid email address.");
        setShowErrorDialog(true);
        return;
      }

      setCurrentStep(2);
      return;
    }

    if (currentStep === 2) {
      console.log("Step 2 - Selected Product:", currentProduct);
      setCurrentStep(3);
      return;
    }

    if (currentStep === 3) {
      if (cartProducts.length === 0) {
        setErrorMessage("Please add at least one product to continue.");
        setShowErrorDialog(true);
        return;
      }
      setCurrentStep(4);
      return;
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleTrimmedInput = (field, value) => {
    if (value.trim() === "" && value.length > 0) return;
    setCustomerInfo((prev) => ({ ...prev, [field]: value.trimStart() }));
  };

  const getCostDetails = () => {
    if (!currentProduct || !currentProductConfig.variantId) {
      return { baseCost: 0, shipCost: 0, extraShipping: 0 };
    }

    const variant = currentProduct.variants?.find(
      (v) => v.productVariantId === currentProductConfig.variantId
    );

    return {
      baseCost: variant?.baseCost ?? 0,
      shipCost: variant?.shipCost ?? 0,
      extraShipping: variant?.extraShipping ?? 0,
    };
  };

  const handleFileUpload = async (field, event) => {
    const file = event.target.files[0];
    if (!file) return;

    // ✅ Chỉ cho phép ảnh JPG/JPEG/PNG
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setErrorMessage(
        "❌ Invalid file type. Only JPG, JPEG, and PNG files are allowed."
      );
      setShowErrorDialog(true);
      event.target.value = ""; // clear input
      return;
    }

    try {
      setUploadProgress((prev) => ({
        ...prev,
        [field]: { isUploading: true, progress: 0 },
      }));

      const uploadedUrl = await uploadImage(file, (progress) => {
        setUploadProgress((prev) => ({
          ...prev,
          [field]: { isUploading: true, progress },
        }));
      });

      if (uploadedUrl) {
        setCurrentProductConfig((prev) => ({
          ...prev,
          [field]: uploadedUrl,
        }));

        // preview image (optional)
        const previewUrl = URL.createObjectURL(file);
        setCurrentProductConfig((prev) => ({
          ...prev,
          [`${field}Preview`]: previewUrl,
        }));

        setUploadProgress((prev) => ({
          ...prev,
          [field]: { isUploading: false, progress: 100 },
        }));

        // Clear progress after a brief delay
        setTimeout(() => {
          setUploadProgress((prev) => ({
            ...prev,
            [field]: { isUploading: false, progress: 0 },
          }));
        }, 500);
      }
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage("⚠️ Upload failed. Please try again.");
      setShowErrorDialog(true);
      setUploadProgress((prev) => ({
        ...prev,
        [field]: { isUploading: false, progress: 0 },
      }));
    }
  };

  const handleProductSelect = async (product) => {
    const id = product?.id ?? product?.productId;
    if (!id) {
      setCurrentProduct(product);
      setCurrentStep(3);
      return;
    }

    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Product/${id}`,
        {
          credentials: "include",
        }
      );
      if (!res.ok) {
        console.warn("Product detail fetch failed, use base product");
        setCurrentProduct(product);
        setCurrentStep(3);
        return;
      }
      const detail = await res.json();
      setCurrentProduct(detail);
      setCurrentProductConfig({
        size: "",
        accessory: "",
        linkThanksCard: null,
        linkFileDesign: null,
        quantity: 1,
        activeTTS: false,
        note: "",
        productPrice: 0,
        variantId: null,
      });
      setCurrentStep(3);
    } catch (err) {
      console.error("handleProductSelect error:", err);
      setCurrentProduct(product);
      setCurrentStep(3);
    }
  };

  const handleAddToCart = () => {
    if (!currentProduct) return;

    if (!isOrderIdSet) {
      setIsOrderIdSet(true);
    }

    const productPrice = calculateProductPrice();
    const productToAdd = {
      id: Date.now(),
      product: currentProduct,
      config: { ...currentProductConfig },
      unitPrice: (() => {
        const vid = currentProductConfig.variantId;
        if (vid && currentProduct.productVariants) {
          const vv = currentProduct.productVariants.find(
            (x) => (x.id ?? x.variantId) === vid
          );
          return vv?.price ?? vv?.unitPrice ?? currentProduct.basePrice ?? 0;
        }
        return currentProduct.basePrice ?? currentProduct.price ?? 0;
      })(),
      totalPrice: productPrice,
    };

    setCartProducts((prev) => [...prev, productToAdd]);
    setCurrentProductConfig({
      size: "",
      accessory: "",
      linkImg: null,
      linkThanksCard: null,
      linkFileDesign: null,
      linkImgPreview: null,
      linkThanksCardPreview: null,
      linkFileDesignPreview: null,
      quantity: 1,
      activeTTS: false,
      note: "",
      productPrice: 0,
      variantId: null, // để dropdown hiện lại
    });

    // ✅ Clear toàn bộ input file DOM refs
    if (linkImgRef.current) linkImgRef.current.value = "";
    if (linkThanksCardRef.current) linkThanksCardRef.current.value = "";
    if (linkFileDesignRef.current) linkFileDesignRef.current.value = "";
  };

  const handleRemoveFromCart = (cartItemId) => {
    setCartProducts((prev) => prev.filter((item) => item.id !== cartItemId));
    if (cartProducts.length === 1) {
      setIsOrderIdSet(false);
    }
  };

  const handleMakeOrder = () => {
    setShowConfirmDialog(true);
  };

  const confirmMakeOrder = async () => {
    const orderDetails = cartProducts.map((p) => ({
      orderId: 0,
      productVariantID: p.config.variantId,
      quantity: Number(p.config.quantity),
      price: p.config.productPrice || 0,
      linkImg: p.config.linkImg || p.product.image || null,
      needDesign: true,
      linkThanksCard: p.config.linkThanksCard || null,
      linkDesign: p.config.linkFileDesign || null,
      accessory: p.config.accessory || "",
      note: p.config.note || "",
      productionStatus: 0,
    }));

    const orderPayload = {
      customerInfo: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email,
        address: `${customerInfo.address},${customerInfo.wardName}, ${customerInfo.districtName}, ${customerInfo.provinceName}`,
        address1: customerInfo.address1,
        zipCode: "",
        shipState: "",
        shipCountry: "",
      },

      orderCreate: {
        orderCode: orderId?.trim() || `ORD-${Date.now()}`,
        endCustomerID: 0,
        totalCost: calculateOrderTotal(),
        sellerUserId: null,
        orderDate: new Date().toISOString(),
        costScan: 1,
        activeTTS: activeTTS,
        tracking: "",
        productionStatus: "Pending",
        paymentStatus: "Unpaid",

        // 🔥 Quan trọng – đưa đúng vào DB
        toProvinceId: Number(customerInfo.provinceId),
        toDistrictId: Number(customerInfo.districtId),
        toWardCode: customerInfo.wardId,
      },

      // 🔥 Để đúng vị trí API yêu cầu
      orderDetails: orderDetails,
    };

    console.log("Sending order payload:", orderPayload);
    console.log(JSON.stringify(orderPayload, null, 2));

    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Order/make-order`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(orderPayload),
        }
      );

      const text = await res.text();
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${text}`);

      console.log("Order created successfully:", text);
      setSuccessMessage("🎉 Order created successfully!");
      setShowSuccessDialog(true);

      setShowConfirmDialog(false);
      onClose();
      resetForm();
      window.location.reload();
    } catch (err) {
      console.error("❌ Create order failed:", err);
      setErrorMessage("❌ Failed to create order: " + err.message);
      setShowErrorDialog(true);
    }
  };

  const toggleProductDetails = (cartItemId) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [cartItemId]: !prev[cartItemId],
    }));
  };

  const updateCartProduct = (cartItemId, field, value) => {
    setCartProducts((prev) =>
      prev.map((item) => {
        if (item.id === cartItemId) {
          const updatedConfig = { ...item.config, [field]: value };
          const basePrice = item.product.basePrice;
          const quantity = Number.parseInt(updatedConfig.quantity) || 1;
          const accessoryPrice =
            updatedConfig.accessory !== "None" && updatedConfig.accessory
              ? 2.0
              : 0;
          const totalPrice = (basePrice + accessoryPrice) * quantity;

          return {
            ...item,
            config: updatedConfig,
            totalPrice: totalPrice,
          };
        }
        return item;
      })
    );
  };

  const handleCartFileUpload = (cartItemId, field, event) => {
    const file = event.target.files[0];
    if (file) {
      updateCartProduct(cartItemId, field, file);
    }
  };

  const renderStep1 = () => {
    const handleTrimmedInput = (field, value) => {
      if (value.trim() === "" && value.length > 0) return;

      if (field === "email") {
        value = value.replace(/\s/g, "");
      }

      if (field === "phone") {
        value = value.replace(/[^\d+]/g, "");
      }

      setCustomerInfo((prev) => ({
        ...prev,
        [field]: value.trimStart(),
      }));
    };

    const handleProvinceChange = (provinceId) => {
      const province = provinces.find((p) => {
        const pid = p.id ?? p.provinceId;
        return pid?.toString() === provinceId;
      });

      setCustomerInfo((prev) => ({
        ...prev,
        provinceId: provinceId,
        provinceName: province?.name || province?.provinceName || "",
        districtId: "",
        districtName: "",
        wardId: "",
        wardName: "",
      }));

      setDistricts([]);
      setWards([]);
      setOpenProvinceDropdown(false);
      setSearchProvince("");
      fetchDistricts(provinceId);
    };

    const handleDistrictChange = (districtId) => {
      const district = districts.find((d) => {
        const did = d.id ?? d.districtId;
        return did?.toString() === districtId;
      });

      setCustomerInfo((prev) => ({
        ...prev,
        districtId: districtId,
        districtName: district?.name || district?.districtName || "",
        wardId: "",
        wardName: "",
      }));
      setWards([]);
      setOpenDistrictDropdown(false);
      setSearchDistrict("");
      fetchWards(districtId);
    };

    const handleWardChange = (wardId) => {
      const ward = wards.find((w) => {
        const wid = w.id ?? w.wardId;
        return wid?.toString() === wardId;
      });

      setCustomerInfo((prev) => ({
        ...prev,
        wardId: wardId,
        wardName: ward?.name || ward?.wardName || "",
      }));
      setOpenWardDropdown(false);
      setSearchWard("");
    };

    const filteredProvinces = provinces.filter((p) =>
      (p.name || p.provinceName)
        .toLowerCase()
        .includes(searchProvince.toLowerCase())
    );

    const filteredDistricts = districts.filter((d) =>
      (d.name || d.districtName)
        .toLowerCase()
        .includes(searchDistrict.toLowerCase())
    );

    const filteredWards = wards.filter((w) =>
      (w.name || w.wardName).toLowerCase().includes(searchWard.toLowerCase())
    );

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Step 1: End Customer Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={customerInfo.name}
              onChange={(e) => handleTrimmedInput("name", e.target.value)}
              placeholder="Enter customer name"
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={customerInfo.phone}
              onChange={(e) => handleTrimmedInput("phone", e.target.value)}
              placeholder="Enter phone number"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={customerInfo.email}
              onChange={(e) => handleTrimmedInput("email", e.target.value)}
              placeholder="Enter email address"
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Spacebar") e.preventDefault();
              }}
            />
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">Address *</Label>
            <Input
              id="address"
              value={customerInfo.address}
              onChange={(e) => handleTrimmedInput("address", e.target.value)}
              placeholder="Enter address"
            />
          </div>

          {/* Address1 */}
          <div>
            <Label htmlFor="address1">Address 1</Label>
            <Input
              id="address1"
              value={customerInfo.address1}
              onChange={(e) => handleTrimmedInput("address1", e.target.value)}
              placeholder="Enter address line 2"
            />
          </div>

          <div>
            <Label htmlFor="province">Province *</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenProvinceDropdown(!openProvinceDropdown)}
                disabled={loadingProvinces}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-left text-sm flex justify-between items-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                      filteredProvinces.map((p, idx) => (
                        <button
                          key={p.id || p.provinceId || `prov-${idx}`}
                          type="button"
                          onClick={() =>
                            handleProvinceChange(
                              (p.id || p.provinceId || idx).toString()
                            )
                          }
                          onMouseEnter={() =>
                            setHoverProvince(p.id || p.provinceId || idx)
                          }
                          onMouseLeave={() => setHoverProvince(null)}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                            hoverProvince === (p.id || p.provinceId || idx)
                              ? "bg-blue-100 text-blue-900"
                              : customerInfo.provinceId?.toString() ===
                                (p.id || p.provinceId || idx)?.toString()
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {p.name || p.provinceName}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500">
                        No province found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="district">District *</Label>
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
                          key={d.id || d.districtId}
                          type="button"
                          onClick={() =>
                            handleDistrictChange(
                              (d.id || d.districtId)?.toString()
                            )
                          }
                          onMouseEnter={() =>
                            setHoverDistrict(d.id || d.districtId)
                          }
                          onMouseLeave={() => setHoverDistrict(null)}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                            hoverDistrict === (d.id || d.districtId)
                              ? "bg-blue-100 text-blue-900"
                              : customerInfo.districtId?.toString() ===
                                (d.id || d.districtId)?.toString()
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {d.name || d.districtName}
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

          <div>
            <Label htmlFor="ward">Ward *</Label>
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
                          key={w.id || w.wardId}
                          type="button"
                          onClick={() =>
                            handleWardChange((w.id || w.wardId)?.toString())
                          }
                          onMouseEnter={() => setHoverWard(w.id || w.wardId)}
                          onMouseLeave={() => setHoverWard(null)}
                          className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                            hoverWard === (w.id || w.wardId)
                              ? "bg-blue-100 text-blue-900"
                              : customerInfo.wardId?.toString() ===
                                (w.id || w.wardId)?.toString()
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          {w.name || w.wardName}
                        </button>
                      ))
                    ) : (
                      <div className="px-3 py-2 text-gray-500">
                        No ward found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    const filteredProducts = products.filter(
      (p) =>
        p.productName
          ?.toLowerCase()
          .includes(productSearchTerm.toLowerCase()) ||
        p.describe?.toLowerCase().includes(productSearchTerm.toLowerCase())
    );

    const totalProducts = filteredProducts.length;
    const totalPages = Math.ceil(totalProducts / productItemsPerPage);
    const startIndex = (productCurrentPage - 1) * productItemsPerPage;
    const paginatedProducts = filteredProducts.slice(
      startIndex,
      startIndex + productItemsPerPage
    );

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Step 2: Select Product</h3>

        <div className="flex gap-2 items-center">
          <Input
            type="text"
            placeholder="Search products by name or description..."
            value={productSearchTerm}
            onChange={(e) => {
              setProductSearchTerm(e.target.value);
              setProductCurrentPage(1); // Reset to first page when searching
            }}
            className="flex-1"
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            <Label className="text-sm">Items per page:</Label>
            <Select
              value={productItemsPerPage.toString()}
              onValueChange={(val) => {
                setProductItemsPerPage(Number(val));
                setProductCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm text-gray-600">
            Page {productCurrentPage} of {totalPages || 1} ({totalProducts}{" "}
            items)
          </span>
        </div>

        {loadingProducts ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : productsError ? (
          <div className="p-4 bg-red-50 rounded border border-red-200">
            <p className="text-red-700">
              Error loading products: {productsError}
            </p>
            <Button variant="outline" onClick={fetchProducts}>
              Retry
            </Button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-gray-600">
            {productSearchTerm
              ? "No products match your search"
              : "No products found"}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedProducts.map((p) => {
                const price = p.variants?.length
                  ? Math.min(...p.variants.map((v) => v.totalCost))
                  : 0;

                return (
                  <div
                    key={p.productId}
                    onClick={() => handleProductSelect(p)}
                    className="cursor-pointer border rounded-lg p-4 hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={
                        p.itemLink ||
                        "/placeholder.svg?height=128&width=256&query=product" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg"
                      }
                      alt={p.productName}
                      className="w-full h-32 object-cover rounded-md mb-3"
                    />

                    <h4 className="font-semibold text-sm mb-2">
                      {p.productName}
                    </h4>

                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                      {p.describe}
                    </p>

                    <p className="text-sm font-bold text-blue-600">
                      ${price.toFixed(2)}
                    </p>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-1 mt-4 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() =>
                    setProductCurrentPage((p) => Math.max(1, p - 1))
                  }
                  disabled={productCurrentPage === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {/* Show first page only if not on page 1 */}
                  {productCurrentPage !== 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setProductCurrentPage(1)}
                      className="w-10"
                    >
                      1
                    </Button>
                  )}

                  {/* Show ellipsis if needed before current page */}
                  {productCurrentPage > 3 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}

                  {/* Show pages around current page */}
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      // Show page 1 only once (already shown above if not on page 1)
                      if (page === 1) return productCurrentPage === 1;
                      // Show current page and 1 page before/after
                      if (page === productCurrentPage) return true;
                      if (
                        page === productCurrentPage - 1 &&
                        productCurrentPage > 2
                      )
                        return true;
                      if (
                        page === productCurrentPage + 1 &&
                        productCurrentPage < totalPages - 1
                      )
                        return true;
                      return false;
                    })
                    .map((page) => (
                      <Button
                        key={page}
                        variant={
                          productCurrentPage === page ? "default" : "outline"
                        }
                        onClick={() => setProductCurrentPage(page)}
                        className="w-10"
                      >
                        {page}
                      </Button>
                    ))}

                  {/* Show ellipsis if needed after current page */}
                  {productCurrentPage < totalPages - 2 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}

                  {/* Show last page only if not on last page */}
                  {productCurrentPage !== totalPages && totalPages > 1 && (
                    <Button
                      variant="outline"
                      onClick={() => setProductCurrentPage(totalPages)}
                      className="w-10"
                    >
                      {totalPages}
                    </Button>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={() =>
                    setProductCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={productCurrentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">
        Step 3: Configure Product & Review Costs
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

      <div className="mb-4">
        <Label htmlFor="orderId" className="text-sm font-medium text-gray-700">
          Order ID *
        </Label>
        <Input
          id="orderId"
          type="text"
          value={orderId}
          onChange={(e) => {
            if (!isOrderIdSet) {
              setOrderId(e.target.value);
            }
          }}
          placeholder="Enter Order ID..."
          className="mt-1"
          readOnly={isOrderIdSet}
          disabled={isOrderIdSet}
        />
        {isOrderIdSet && (
          <p className="text-xs text-gray-500 mt-1">
            Order ID is locked after adding first product
          </p>
        )}
      </div>

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
                  {/* {v.sizeInch} — ${v.totalCost.toFixed(2)} */}
                  {v.sizeInch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Link Image */}
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
            />
            {uploadProgress.linkImg.isUploading && (
              <CircularProgress progress={uploadProgress.linkImg.progress} />
            )}
          </div>

          {currentProductConfig.linkImg &&
            !uploadProgress.linkImg.isUploading && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-green-600 flex items-center gap-1">
                  Uploaded:{" "}
                  <a
                    href={currentProductConfig.linkImg}
                    target="_blank"
                    className="underline text-blue-600 truncate max-w-[200px]"
                    rel="noreferrer"
                  >
                    {currentProductConfig.linkImg.split("/").pop()}
                  </a>
                </p>

                {(currentProductConfig.linkImg.endsWith(".png") ||
                  currentProductConfig.linkImg.endsWith(".jpg") ||
                  currentProductConfig.linkImg.endsWith(".jpeg")) && (
                  <div className="relative inline-block">
                    <img
                      src={currentProductConfig.linkImg || "/placeholder.svg"}
                      alt="Uploaded Image Preview"
                      className="w-20 h-20 object-cover rounded border border-gray-300 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentProductConfig((prev) => ({
                          ...prev,
                          linkImg: null,
                        }));
                        if (linkImgRef.current) {
                          linkImgRef.current.value = "";
                        }
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 translate-x-1 -translate-y-1"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Link Thanks Card */}
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
            />
            {uploadProgress.linkThanksCard.isUploading && (
              <CircularProgress
                progress={uploadProgress.linkThanksCard.progress}
              />
            )}
          </div>

          {currentProductConfig.linkThanksCard &&
            !uploadProgress.linkThanksCard.isUploading && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-green-600 flex items-center gap-1">
                  Uploaded:{" "}
                  <a
                    href={currentProductConfig.linkThanksCard}
                    target="_blank"
                    className="underline text-blue-600 truncate max-w-[200px]"
                    rel="noreferrer"
                  >
                    {currentProductConfig.linkThanksCard.split("/").pop()}
                  </a>
                </p>

                {(currentProductConfig.linkThanksCard.endsWith(".png") ||
                  currentProductConfig.linkThanksCard.endsWith(".jpg") ||
                  currentProductConfig.linkThanksCard.endsWith(".jpeg")) && (
                  <div className="relative inline-block">
                    <img
                      src={
                        currentProductConfig.linkThanksCard ||
                        "/placeholder.svg"
                      }
                      alt="Thanks Card Preview"
                      className="w-20 h-20 object-cover rounded border border-gray-300 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentProductConfig((prev) => ({
                          ...prev,
                          linkThanksCard: null,
                        }));
                        if (linkThanksCardRef.current) {
                          linkThanksCardRef.current.value = "";
                        }
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 translate-x-1 -translate-y-1"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>

        {/* Link File Design */}
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
            />
            {uploadProgress.linkFileDesign.isUploading && (
              <CircularProgress
                progress={uploadProgress.linkFileDesign.progress}
              />
            )}
          </div>

          {currentProductConfig.linkFileDesign &&
            !uploadProgress.linkFileDesign.isUploading && (
              <div className="mt-2 space-y-2">
                <p className="text-sm text-green-600 flex items-center gap-1">
                  Uploaded:{" "}
                  <a
                    href={currentProductConfig.linkFileDesign}
                    target="_blank"
                    className="underline text-blue-600 truncate max-w-[200px]"
                    rel="noreferrer"
                  >
                    {currentProductConfig.linkFileDesign.split("/").pop()}
                  </a>
                </p>

                {(currentProductConfig.linkFileDesign.endsWith(".png") ||
                  currentProductConfig.linkFileDesign.endsWith(".jpg") ||
                  currentProductConfig.linkFileDesign.endsWith(".jpeg")) && (
                  <div className="relative inline-block">
                    <img
                      src={
                        currentProductConfig.linkFileDesign ||
                        "/placeholder.svg"
                      }
                      alt="Design File Preview"
                      className="w-20 h-20 object-cover rounded border border-gray-300 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentProductConfig((prev) => ({
                          ...prev,
                          linkFileDesign: null,
                        }));
                        if (linkFileDesignRef.current) {
                          linkFileDesignRef.current.value = "";
                        }
                      }}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600 translate-x-1 -translate-y-1"
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
                  alert("Quantity cannot be more than 20.");
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
          />
        </div>

        <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-4 md:col-span-2">
          <h4 className="font-semibold text-gray-900 mb-3">Cost Breakdown</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Base Cost:</span>
              <span className="font-medium text-gray-900">
                ${getCostDetails().baseCost.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ship Cost:</span>
              <span className="font-medium text-gray-900">
                ${getCostDetails().shipCost.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Extra Shipping (per unit):</span>
              <span className="font-medium text-gray-900">
                ${getCostDetails().extraShipping.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-slate-200 pt-2 flex justify-between">
              <span className="font-semibold text-gray-900">Unit Price:</span>
              <span className="font-bold text-blue-600 text-lg">
                $
                {(
                  getCostDetails().baseCost + getCostDetails().shipCost
                ).toFixed(2)}
              </span>
            </div>
          </div>

          {/* {cartProducts.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-slate-700">
              <p className="font-semibold text-blue-900 mb-1">
                📦 Shipping Calculation:
              </p>
              {cartProducts.length === 1 ? (
                <p>Single product: Total = Base Cost + Ship Cost</p>
              ) : (
                <>
                  <p>Multiple products: Extra shipping uses the highest rate</p>
                  <p>Total += (Total Quantity - 1) × Max Extra Shipping</p>
                </>
              )}
            </div>
          )} */}
        </div>

        {/* Price */}
        <div className="md:col-span-2">
          <div className="bg-blue-50 p-4 rounded-lg">
            <Label className="text-lg font-semibold">
              Product Price: $
              {Number(calculateProductPrice()).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Label>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2 pt-4">
        <Button
          onClick={handleAddToCart}
          disabled={!currentProductConfig.variantId}
        >
          Add to Order
        </Button>
        <Button variant="outline" onClick={() => setCurrentStep(2)}>
          Add More Products
        </Button>
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
                    {/* <span className="font-semibold text-blue-600">
                      ${item.totalPrice.toFixed(2)}
                    </span> */}
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

                      {/* ✅ Link Image */}
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
                              {item.config.linkImg}
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

                      {/* ✅ Link Thanks Card */}
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
                              {item.config.linkThanksCard}
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

                      {/* ✅ Link File Design */}
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
                              {item.config.linkFileDesign}
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

          <div className="mt-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
            <h4 className="font-semibold text-gray-900 mb-3">Cost Breakdown</h4>
            <div className="space-y-3">
              {cartProducts.length === 1 ? (
                <div className="space-y-2">
                  {getOrderCostBreakdown().items.map((item) => (
                    <div key={item.id} className="space-y-1">
                      <p className="text-sm font-medium text-gray-700">
                        {item.name}
                      </p>
                      <div className="flex justify-between text-sm ml-3">
                        <span className="text-gray-600">Base Cost:</span>
                        <span className="font-medium text-gray-900">
                          ${item.baseCost.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm ml-3">
                        <span className="text-gray-600">Ship Cost:</span>
                        <span className="font-medium text-gray-900">
                          ${getOrderCostBreakdown().shipCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-slate-300 pt-2 flex justify-between font-semibold">
                    <span className="text-gray-900">Total:</span>
                    <span className="text-blue-600">
                      $
                      {(
                        getOrderCostBreakdown().totalBase +
                        getOrderCostBreakdown().shipCost +
                        (activeTTS ? 1.0 : 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 italic mb-2">
                    Breakdown by product:
                  </p>
                  {getOrderCostBreakdown().items.map((item) => (
                    <div
                      key={item.id}
                      className="flex justify-between text-sm ml-3"
                    >
                      <span className="text-gray-600">
                        {item.name} (Base: ${item.baseCost.toFixed(2)} ×{" "}
                        {item.qty})
                      </span>
                      <span className="font-medium text-gray-900">
                        ${item.totalBaseCost.toFixed(2)}
                      </span>
                    </div>
                  ))}

                  <div className="border-t border-slate-300 pt-2 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Base Cost:</span>
                      <span className="font-medium text-gray-900">
                        ${getOrderCostBreakdown().totalBase.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base Ship Cost:</span>
                      <span className="font-medium text-gray-900">
                        ${getOrderCostBreakdown().maxBaseShipCost.toFixed(2)}
                      </span>
                    </div>
                    {getOrderCostBreakdown().maxExtraShipping > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Extra Shipping (Max from{" "}
                          {getOrderCostBreakdown().maxExtraProductName}):
                        </span>
                        <span className="font-medium text-gray-900">
                          $
                          {(
                            getOrderCostBreakdown().maxExtraShipping *
                            (cartProducts.reduce(
                              (sum, p) => sum + p.config.quantity,
                              0
                            ) -
                              1)
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-300 pt-2 flex justify-between font-semibold">
                    <span className="text-gray-900">Order Total:</span>
                    <span className="text-blue-600">
                      $
                      {(calculateOrderTotal() - (activeTTS ? 1.0 : 0)).toFixed(
                        2
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Total Section */}
          <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-200 flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="activeTTS"
                  checked={activeTTS}
                  onCheckedChange={(checked) => setActiveTTS(checked)}
                />
                <Label htmlFor="activeTTS" className="text-gray-700">
                  Active TTS (Add $1 to Total)
                </Label>
              </div>

              <Label className="text-lg font-semibold text-blue-700">
                Total Order: ${calculateOrderTotal().toFixed(2)}
              </Label>
            </div>

            <Button
              onClick={handleNext}
              disabled={cartProducts.length === 0}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Review & Continue
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep4 = () => {
    const {
      items,
      totalBase,
      shipCost,
      maxExtraShipping,
      maxExtraProductName,
    } = getOrderCostBreakdown();
    const totalQty = cartProducts.reduce(
      (sum, item) => sum + item.config.quantity,
      0
    );
    const shippingCost =
      cartProducts.length > 1
        ? shipCost + (totalQty - 1) * maxExtraShipping
        : shipCost;

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Step 4: Review & Confirm Order
        </h3>

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
              Back to Step 1 Edit
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
              Products ({cartProducts.length})
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentStep(3)}
              className="text-xs"
            >
              Back to Step 3 Edit
            </Button>
          </div>

          <div className="space-y-3">
            {cartProducts.map((item) => (
              <div key={item.id}>
                <div className="bg-white border border-slate-200 rounded p-3 flex justify-between items-start">
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
                  {/* <p className="font-semibold text-gray-900">
                    ${item.totalPrice?.toFixed(2) || "0.00"}
                  </p> */}
                </div>

                {/* <div className="bg-blue-50 p-2 rounded text-xs text-gray-700 space-y-1 mt-2 mx-0">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Unit Cost:</span>
                    <span className="font-medium text-gray-900">
                      $
                      {(
                        item.product.variants?.find(
                          (v) => v.productVariantId === item.config.variantId
                        )?.baseCost ?? 0
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit Ship Cost:</span>
                    <span className="font-medium text-gray-900">
                      $
                      {(
                        item.product.variants?.find(
                          (v) => v.productVariantId === item.config.variantId
                        )?.shipCost ?? 0
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit Extra Shipping:</span>
                    <span className="font-medium text-gray-900">
                      $
                      {(
                        item.product.variants?.find(
                          (v) => v.productVariantId === item.config.variantId
                        )?.extraShipping ?? 0
                      ).toFixed(2)}
                    </span>
                  </div>
                </div> */}
              </div>
            ))}
          </div>
        </div>

        {/* Cost Breakdown */}

        {/* Order Total */}
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">
              Total Order:
            </span>
            <span className="text-2xl font-bold text-green-700">
              ${calculateOrderTotal().toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Make Manual Order - Step {currentStep} of 4
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="flex items-center justify-between mb-6">
              {[1, 2, 3, 4].map((step) => (
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
                  {step < 4 && (
                    <div
                      className={`w-12 h-1 mx-2 ${
                        step < currentStep ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Step content */}
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </div>

          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Back
            </Button>

            {currentStep < 4 && <Button onClick={handleNext}>Next</Button>}

            {currentStep === 4 && (
              <Button
                onClick={handleMakeOrder}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Confirm Order
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Order Creation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to create this order with{" "}
              {cartProducts.length} product(s) for $
              {calculateOrderTotal().toFixed(2)}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction onClick={confirmMakeOrder}>
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Missing Information</AlertDialogTitle>
            <AlertDialogDescription>{errorMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowErrorDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Success Dialog */}
      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Success</AlertDialogTitle>
            <AlertDialogDescription>{successMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setShowSuccessDialog(false)}>
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
