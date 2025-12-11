"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronRight, ChevronLeft, Trash2, Plus } from "lucide-react";
import apiClient from "@/lib/apiClient";

const EditOrderModal = ({ open, onOpenChange, order, onSave }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [products, setProducts] = useState([]);
  const [cartProducts, setCartProducts] = useState([]);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [currentProductConfig, setCurrentProductConfig] = useState({
    variantId: "",
    quantity: 1,
    linkImg: "",
    linkThanksCard: "",
    linkFileDesign: "",
    accessory: "",
    note: "",
    activeTTS: false,
  });

  // Customer info state
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    address1: "",
    provinceId: "",
    districtId: "",
    wardId: "",
    provinceName: "",
    districtName: "",
    wardName: "",
  });

  const [searchProductName, setSearchProductName] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [pageNum, setPageNum] = useState(1);
  const [filteredProducts, setFilteredProducts] = useState([]);

  // Initialize from order data
  useEffect(() => {
    if (open && order) {
      setCustomerInfo({
        name: order.customerInfo?.name || "",
        phone: order.customerInfo?.phone || "",
        email: order.customerInfo?.email || "",
        address: order.customerInfo?.address || "",
        address1: order.customerInfo?.address1 || "",
        provinceId: order.orderCreate?.toProvinceId || "",
        districtId: order.orderCreate?.toDistrictId || "",
        wardId: order.orderCreate?.toWardCode || "",
        provinceName: "",
        districtName: "",
        wardName: "",
      });

      // Initialize cart with existing products
      if (order.orderDetails && Array.isArray(order.orderDetails)) {
        setCartProducts(
          order.orderDetails.map((detail) => ({
            ...detail,
            config: {
              variantId: detail.productVariantID,
              quantity: detail.quantity,
              linkImg: detail.linkImg || "",
              linkThanksCard: detail.linkThanksCard || "",
              linkFileDesign: detail.linkDesign || "",
              accessory: detail.accessory || "",
              note: detail.note || "",
              activeTTS: false,
            },
          }))
        );
      }

      setCurrentStep(1);
    }
  }, [open, order]);

  // Fetch provinces on mount
  useEffect(() => {
    if (open) {
      fetchProvinces();
    }
  }, [open]);

  // Fetch districts when province changes
  useEffect(() => {
    if (customerInfo.provinceId) {
      fetchDistricts(customerInfo.provinceId);
    } else {
      setDistricts([]);
      setWards([]);
    }
  }, [customerInfo.provinceId]);

  // Fetch wards when district changes
  useEffect(() => {
    if (customerInfo.districtId) {
      fetchWards(customerInfo.districtId);
    } else {
      setWards([]);
    }
  }, [customerInfo.districtId]);

  const fetchProvinces = async () => {
    try {
      const res = await apiClient.get("/api/Location/provinces");
      const data = res.data;

      setProvinces(
        data.map((p) => ({
          id: p.ProvinceID,
          name: p.ProvinceName,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch provinces:", err);
    }
  };

  const fetchDistricts = async (provinceId) => {
    try {
      const res = await apiClient.get(`/api/Location/districts/${provinceId}`);
      const data = res.data;

      setDistricts(
        data.map((d) => ({
          id: d.DistrictID,
          name: d.DistrictName,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch districts:", err);
    }
  };
  const fetchWards = async (districtId) => {
    try {
      const res = await apiClient.get(`/api/Location/wards/${districtId}`);
      const data = res.data;

      setWards(
        data.map((w) => ({
          id: w.WardCode,
          name: w.WardName,
        }))
      );
    } catch (err) {
      console.error("Failed to fetch wards:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({
        SearchProductName: searchProductName,
        PageSize: pageSize,
        PageNum: pageNum,
      });
      const response = await apiClient.get(`/api/Product?${params}`);
      const productList = response.data || [];
      setProducts(productList);

      const filtered = productList.filter((p) =>
        (p.productName || "")
          .toLowerCase()
          .includes(searchProductName.toLowerCase())
      );
      setFilteredProducts(filtered);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    if (currentStep === 3) {
      fetchProducts();
    }
  }, [currentStep, searchProductName, pageSize, pageNum]);

  const handleProductSelect = async (product) => {
    try {
      let fullProduct = product;

      // If product has ID, fetch full details
      if (product.id || product.productId) {
        const productId = product.id || product.productId;
        const response = await apiClient.get(`/api/Product/${productId}`);
        fullProduct = response.data;
      }

      setCurrentProduct(fullProduct);
      setCurrentProductConfig({
        variantId: "",
        quantity: 1,
        linkImg: "",
        linkThanksCard: "",
        linkFileDesign: "",
        accessory: "",
        note: "",
        activeTTS: false,
      });
    } catch (error) {
      console.error("Error fetching product details:", error);
    }
  };

  const calculateProductPrice = () => {
    if (!currentProduct || !currentProductConfig.variantId) return 0;

    const variant = currentProduct.variants?.find(
      (v) => v.productVariantId === currentProductConfig.variantId
    );

    if (!variant) return 0;

    const basePrice = variant.totalCost || 0;
    const qty = Number.parseInt(currentProductConfig.quantity) || 1;
    const ttsExtra = currentProductConfig.activeTTS ? 1.0 : 0.0;

    return (basePrice + ttsExtra) * qty;
  };

  const handleAddToCart = () => {
    if (!currentProductConfig.variantId) {
      alert("Please select a size/variant");
      return;
    }

    const cartItem = {
      ...currentProduct,
      config: { ...currentProductConfig },
      totalPrice: calculateProductPrice(),
    };

    setCartProducts([...cartProducts, cartItem]);
    setCurrentProduct(null);
    setCurrentProductConfig({
      variantId: "",
      quantity: 1,
      linkImg: "",
      linkThanksCard: "",
      linkFileDesign: "",
      accessory: "",
      note: "",
      activeTTS: false,
    });
  };

  const handleRemoveFromCart = (index) => {
    setCartProducts(cartProducts.filter((_, i) => i !== index));
  };

  const calculateOrderTotal = () => {
    if (cartProducts.length === 0) return 0;

    let totalBaseCost = 0;
    let shipCost = 0;
    let maxExtraShipping = 0;
    let maxBaseShipCost = 0;
    let totalQty = 0;

    cartProducts.forEach((item, index) => {
      const variant = item.variants?.find(
        (v) => v.productVariantId === item.config.variantId
      );

      if (variant) {
        const baseCost = variant.baseCost || 0;
        const shipCostVariant = variant.shipCost || 0;
        const extraShipping = variant.extraShipping || 0;
        const qty = item.config.quantity || 1;

        totalBaseCost += baseCost * qty;

        if (index === 0) {
          shipCost = shipCostVariant;
        }

        maxExtraShipping = Math.max(maxExtraShipping, extraShipping);
        maxBaseShipCost = Math.max(maxBaseShipCost, shipCostVariant);
        totalQty += qty;
      }
    });

    let total = totalBaseCost + shipCost;
    total += (totalQty - 1) * maxExtraShipping;
    total += maxBaseShipCost;

    return total;
  };

  const handleSaveOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.email) {
      alert("Please fill in all customer information");
      return;
    }

    if (cartProducts.length === 0) {
      alert("Please add at least one product");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        orderId: order.id,
        customerInfo: {
          name: customerInfo.name.trim(),
          phone: customerInfo.phone.trim(),
          email: customerInfo.email.trim(),
          address: customerInfo.address,
          address1: customerInfo.address1,
          zipCode: "",
          shipState: "",
          shipCountry: "",
        },
        orderCreate: {
          toProvinceId: Number.parseInt(customerInfo.provinceId),
          toDistrictId: Number.parseInt(customerInfo.districtId),
          toWardCode: customerInfo.wardId,
          totalCost: calculateOrderTotal(),
        },
        orderDetails: cartProducts.map((item) => ({
          productVariantID: item.config.variantId,
          quantity: item.config.quantity,
          price: item.totalPrice,
          linkImg: item.config.linkImg,
          linkThanksCard: item.config.linkThanksCard,
          linkDesign: item.config.linkFileDesign,
          accessory: item.config.accessory,
          note: item.config.note,
        })),
      };

      await apiClient.post("/api/Order/edit-order", payload);
      alert("Order updated successfully!");
      onOpenChange(false);
      onSave?.();
    } catch (error) {
      console.error("Error saving order:", error);
      alert("Failed to save order");
    } finally {
      setLoading(false);
    }
  };

  const handleProvinceChange = (val) => {
    setCustomerInfo({
      ...customerInfo,
      provinceId: val,
      districtId: "",
      wardId: "",
    });
  };

  const handleDistrictChange = (val) => {
    setCustomerInfo({ ...customerInfo, districtId: val, wardId: "" });
  };

  // Step 1: Customer Information
  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <Input
            value={customerInfo.name}
            onChange={(e) =>
              setCustomerInfo({ ...customerInfo, name: e.target.value })
            }
            placeholder="Customer name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Phone *</label>
          <Input
            value={customerInfo.phone}
            onChange={(e) =>
              setCustomerInfo({ ...customerInfo, phone: e.target.value })
            }
            placeholder="Phone number"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email *</label>
        <Input
          type="email"
          value={customerInfo.email}
          onChange={(e) =>
            setCustomerInfo({ ...customerInfo, email: e.target.value })
          }
          placeholder="Email address"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Province *</label>
        <Select
          value={customerInfo.provinceId?.toString() || ""}
          onValueChange={handleProvinceChange}
          disabled={!provinces || provinces.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select province" />
          </SelectTrigger>
          <SelectContent>
            {provinces.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">District *</label>
        <Select
          value={customerInfo.districtId?.toString() || ""}
          onValueChange={handleDistrictChange}
          disabled={
            !customerInfo.provinceId || !districts || districts.length === 0
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select district" />
          </SelectTrigger>
          <SelectContent>
            {districts.map((d) => (
              <SelectItem key={d.id} value={d.id.toString()}>
                {d.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Ward *</label>
        <Select
          value={customerInfo.wardId?.toString() || ""}
          onValueChange={(val) =>
            setCustomerInfo({ ...customerInfo, wardId: val })
          }
          disabled={!customerInfo.districtId || !wards || wards.length === 0}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select ward" />
          </SelectTrigger>
          <SelectContent>
            {wards.map((w) => (
              <SelectItem key={w.id} value={w.id.toString()}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Address *</label>
        <Input
          value={customerInfo.address}
          onChange={(e) =>
            setCustomerInfo({ ...customerInfo, address: e.target.value })
          }
          placeholder="Street address"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Address Detail (Optional)
        </label>
        <Input
          value={customerInfo.address1}
          onChange={(e) =>
            setCustomerInfo({ ...customerInfo, address1: e.target.value })
          }
          placeholder="Building, apartment, etc."
        />
      </div>
    </div>
  );

  // Step 2: View Existing Products
  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-blue-900 mb-2">
          Current Products in Order
        </h3>
        <p className="text-sm text-blue-800">
          Review existing products. You can remove and add new ones in the next
          step.
        </p>
      </div>

      {cartProducts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No products in this order
        </div>
      ) : (
        <div className="space-y-3">
          {cartProducts.map((item, index) => (
            <Card key={index}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.productName}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      Variant:{" "}
                      {item.variants?.find(
                        (v) => v.productVariantId === item.config.variantId
                      )?.sizeInch || "N/A"}
                    </p>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.config.quantity}
                    </p>
                    <p className="text-sm text-gray-600">
                      Note: {item.config.note || "None"}
                    </p>
                    <p className="font-semibold text-green-600 mt-2">
                      {item.totalPrice?.toLocaleString()} ₫
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFromCart(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Step 3: Add/Edit Products
  const renderStep3 = () => (
    <div className="space-y-4">
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Products</TabsTrigger>
          <TabsTrigger value="configure">Configure</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Search Products
            </label>
            <Input
              placeholder="Search by product name..."
              value={searchProductName}
              onChange={(e) => setSearchProductName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Items per page
            </label>
            <Select
              value={pageSize.toString()}
              onValueChange={(val) => setPageSize(Number.parseInt(val))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[5, 10, 20, 50].map((size) => (
                  <SelectItem key={size} value={size.toString()}>
                    {size} items
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => (
              <Card
                key={product.id || product.productId}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleProductSelect(product)}
              >
                <CardContent className="pt-4">
                  {product.image && (
                    <img
                      src={product.image || "/placeholder.svg"}
                      alt={product.productName}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                  )}
                  <h4 className="font-semibold text-sm line-clamp-2">
                    {product.productName}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-1">
                    {product.description}
                  </p>
                  <p className="text-green-600 font-semibold mt-2">
                    From
                    {Math.min(
                      ...(product.variants?.map((v) => v.totalCost.toLocaleString()) || [0])
                    )}₫
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="configure" className="space-y-4">
          {!currentProduct ? (
            <div className="text-center py-8 text-gray-500">
              Select a product from the Browse tab to configure
            </div>
          ) : (
            <>
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-semibold">{currentProduct.productName}</h4>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Size/Variant *
                </label>
                <Select
                  value={currentProductConfig.variantId}
                  onValueChange={(val) =>
                    setCurrentProductConfig({
                      ...currentProductConfig,
                      variantId: val,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {currentProduct.variants?.map((variant) => (
                      <SelectItem
                        key={variant.productVariantId}
                        value={variant.productVariantId.toString()}
                      >
                        {variant.sizeInch}
                        {variant.totalCost.toLocaleString()}₫
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Quantity (1-20) *
                </label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={currentProductConfig.quantity}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    const num = Math.min(
                      Math.max(Number.parseInt(val) || 1, 1),
                      20
                    );
                    setCurrentProductConfig({
                      ...currentProductConfig,
                      quantity: num,
                    });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Product Image Link
                </label>
                <Input
                  placeholder="https://..."
                  value={currentProductConfig.linkImg}
                  onChange={(e) =>
                    setCurrentProductConfig({
                      ...currentProductConfig,
                      linkImg: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Thank You Card Link
                </label>
                <Input
                  placeholder="https://..."
                  value={currentProductConfig.linkThanksCard}
                  onChange={(e) =>
                    setCurrentProductConfig({
                      ...currentProductConfig,
                      linkThanksCard: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Design File Link (.pdf, .zip, .ai, .psd)
                </label>
                <Input
                  placeholder="https://..."
                  value={currentProductConfig.linkFileDesign}
                  onChange={(e) =>
                    setCurrentProductConfig({
                      ...currentProductConfig,
                      linkFileDesign: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Accessories
                </label>
                <Input
                  placeholder="e.g., Special packaging, gift wrap"
                  value={currentProductConfig.accessory}
                  onChange={(e) =>
                    setCurrentProductConfig({
                      ...currentProductConfig,
                      accessory: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Special Note
                </label>
                <Textarea
                  placeholder="Any special instructions..."
                  value={currentProductConfig.note}
                  onChange={(e) =>
                    setCurrentProductConfig({
                      ...currentProductConfig,
                      note: e.target.value,
                    })
                  }
                  rows={3}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="activeTTS"
                  checked={currentProductConfig.activeTTS}
                  onChange={(e) =>
                    setCurrentProductConfig({
                      ...currentProductConfig,
                      activeTTS: e.target.checked,
                    })
                  }
                />
                <label htmlFor="activeTTS" className="text-sm">
                  Add Text-to-Speech (+$1.00)
                </label>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm text-gray-600">Product Price</p>
                <p className="text-2xl font-bold text-green-600">
                  ${calculateProductPrice().toFixed(2)}
                </p>
              </div>

              <Button
                onClick={handleAddToCart}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={!currentProductConfig.variantId}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add to Cart
              </Button>
            </>
          )}
        </TabsContent>
      </Tabs>

      <Card className="bg-blue-50 border-blue-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Cart Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            {cartProducts.length} products in cart
          </p>
          <p className="text-lg font-bold text-green-600">
            Total: {calculateOrderTotal().toLocaleString()}₫
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // Step 4: Review Order
  const renderStep4 = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Name:</strong> {customerInfo.name}
          </p>
          <p>
            <strong>Phone:</strong> {customerInfo.phone}
          </p>
          <p>
            <strong>Email:</strong> {customerInfo.email}
          </p>
          <p>
            <strong>Address:</strong> {customerInfo.address}{" "}
            {customerInfo.address1}
          </p>
          <p>
            <strong>Location:</strong> {customerInfo.wardName},{" "}
            {customerInfo.districtName}, {customerInfo.provinceName}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Order Items ({cartProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {cartProducts.map((item, index) => (
            <div key={index} className="border-t pt-2 text-sm">
              <p className="font-semibold">{item.productName}</p>
              <p className="text-gray-600">
                Qty: {item.config.quantity} × $
                {(item.totalPrice / item.config.quantity).toLocaleString()}₫
              </p>
              <p className="font-semibold text-green-600">
                {item.totalPrice?.toLocaleString()}₫
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-green-50">
        <CardContent className="pt-4">
          <p className="text-sm text-gray-600">Order Total</p>
          <p className="text-3xl font-bold text-green-600">
            {calculateOrderTotal().toLocaleString()}₫
          </p>
        </CardContent>
      </Card>
    </div>
  );

  // Step 5: Finalize
  const renderStep5 = () => (
    <div className="space-y-4">
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <h3 className="font-semibold text-blue-900 mb-2">
            Order Update Summary
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Customer information updated</li>
            <li>✓ Products configured: {cartProducts.length} item(s)</li>
            <li>✓ Total order amount: {calculateOrderTotal().toLocaleString()}₫</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">
            Current payment status will be maintained
          </p>
          <p className="text-sm font-semibold">
            New Total: {calculateOrderTotal().toLocaleString()}₫
          </p>
        </CardContent>
      </Card>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Click "Finalize Order" to save all changes.
          Customer will be notified of any changes.
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Order #{order?.orderId}</DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex justify-between items-center mb-6">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === currentStep
                    ? "bg-blue-600 text-white"
                    : step < currentStep
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {step}
              </div>
              {step < 5 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    step < currentStep ? "bg-green-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Labels */}
        <div className="grid grid-cols-5 gap-2 mb-6 text-center text-xs">
          <p className="font-semibold">Address</p>
          <p className="font-semibold">Current</p>
          <p className="font-semibold">Products</p>
          <p className="font-semibold">Review</p>
          <p className="font-semibold">Finalize</p>
        </div>

        {/* Step Content */}
        <div className="mb-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>

        {/* Navigation Buttons */}
        <DialogFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>

            {currentStep === 5 ? (
              <Button
                onClick={handleSaveOrder}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? "Saving..." : "Finalize Order"}
              </Button>
            ) : (
              <Button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditOrderModal;
