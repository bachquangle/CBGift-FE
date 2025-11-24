"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function ProductDetailsModal({
  product,
  isOpen,
  onClose,
  categories,
  onUpdated,
}) {
  const { toast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [expandedVariant, setExpandedVariant] = useState(null);

  const [formData, setFormData] = useState({
    variants: [],
  });

  const [uploadingImage, setUploadingImage] = useState(false);

  const [categoryList, setCategoryList] = useState([]);

  // ---------------------- LOAD CATEGORY ----------------------
  useEffect(() => {
    const loadCategories = async () => {
      if (
        Array.isArray(categories) &&
        categories.length > 0 &&
        typeof categories[0] === "object"
      ) {
        setCategoryList(categories);
        return;
      }

      try {
        const res = await fetch(
          `${apiClient.defaults.baseURL}/api/Categories/filter?page=1&pageSize=100`
        );
        const data = await res.json();
        setCategoryList(data.categories || []);
      } catch {
        setCategoryList([]);
      }
    };

    loadCategories();
  }, [categories]);

  // ------------------------ LOAD PRODUCT -----------------------
  useEffect(() => {
    if (product) {
      setFormData({
        productId: product.productId,
        productName: product.productName,
        categoryId: product.categoryId ?? null,
        describe: product.describe ?? "",
        itemLink: product.itemLink ?? "",
        status: product.status === 1 ? "Active" : "Inactive",
        variants: product.variants ?? [],
      });
    }
  }, [product]);

  // ------------------------ INPUT CHANGE ------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ------------------------ VARIANT CHANGE ------------------------
  const handleVariantChange = (index, field, value) => {
    const updated = [...formData.variants];
    updated[index] = { ...updated[index], [field]: value };
    setFormData((prev) => ({ ...prev, variants: updated }));
  };

  // ------------------------ IMAGE UPLOAD ------------------------
  const handleImageUpload = async (file) => {
    if (!file) return;

    setUploadingImage(true);

    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/images/upload`,
        {
          method: "POST",
          credentials: "include",
          body: form,
        }
      );

      if (!res.ok) throw new Error("Upload failed");

      const data = await res.json();
      const url = data.url || data.secureUrl || data.path;

      setFormData((prev) => ({
        ...prev,
        itemLink: url,
      }));

      toast({
        title: "Image Uploaded",
        description: "The product image has been updated.",
      });
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
    }

    setUploadingImage(false);
  };

  // --------------------------- SAVE ------------------------------
  const handleSave = async () => {
    const payload = {
      categoryId: Number(formData.categoryId),
      productName: formData.productName,
      productCode: product.productCode,
      status: formData.status === "Active" ? 1 : 0,
      itemLink: formData.itemLink,
      describe: formData.describe,
      template: "",
      tagIds: [],
      variants: formData.variants.map((v) => ({
        lengthCm: Number(v.lengthCm || 0),
        heightCm: Number(v.heightCm || 0),
        widthCm: Number(v.widthCm || 0),
        weightGram: Number(v.weightGram || 0),
        shipCost: Number(v.shipCost || 0),
        baseCost: Number(v.baseCost || 0),
        thicknessMm: v.thicknessMm,
        sizeInch: v.sizeInch,
        layer: v.layer,
        customShape: v.customShape,
        sku: v.sku,
        extraShipping: Number(v.extraShipping || 0),
        totalCost: Number(v.baseCost || 0) + Number(v.shipCost || 0),
      })),
    };

    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Product/${formData.productId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      if (!res.ok) throw new Error("Failed to update product");

      toast({ title: "Success", description: "Product updated successfully!" });
      setIsEditing(false);
      onUpdated?.();
      onClose();

      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      toast({
        title: "Update Failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // --------------------- TOGGLE STATUS ------------------------
  const handleStatusToggle = () => {
    const newStatus = formData.status === "Active" ? "Inactive" : "Active";
    setFormData((prev) => ({ ...prev, status: newStatus }));
  };

  const currentCategoryName =
    categoryList.find((c) => c.categoryId === formData.categoryId)
      ?.categoryName ?? "";

  if (!product) return null;

  // ======================================================
  // UI
  // ======================================================
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between w-full">
            <DialogTitle>Product Details — #{formData.productId}</DialogTitle>
            <Badge
              className={
                formData.status === "Active" ? "bg-green-500" : "bg-gray-500"
              }
            >
              {formData.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* IMAGE PREVIEW + FILE UPLOAD IN EDIT MODE */}
          <div className="flex flex-col items-center gap-3">
            <img
              src={formData.itemLink || "/placeholder.svg"}
              alt={formData.productName}
              className="h-40 w-40 rounded-lg object-cover border"
            />

            {isEditing && (
              <div className="flex flex-col items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0])}
                />
                {uploadingImage && (
                  <p className="text-sm text-gray-500">Uploading...</p>
                )}
              </div>
            )}
          </div>

          {/* PRODUCT INFO */}
          <div className="space-y-4">
            <h4 className="font-semibold">Product Information</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Name */}
              <div>
                <Label>Product Name</Label>
                <Input
                  name="productName"
                  value={formData.productName}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>

              {/* Category */}
              <div>
                <Label>Category</Label>

                {isEditing ? (
                  <Select
                    value={
                      formData.categoryId
                        ? String(formData.categoryId)
                        : "__none"
                    }
                    onValueChange={(value) => {
                      if (value === "__none") {
                        setFormData((prev) => ({ ...prev, categoryId: null }));
                        return;
                      }
                      setFormData((prev) => ({
                        ...prev,
                        categoryId: Number(value),
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>

                    <SelectContent>
                      <SelectItem value="__none">-- Select --</SelectItem>

                      {categoryList.map((c) => (
                        <SelectItem
                          key={c.categoryId}
                          value={String(c.categoryId)}
                        >
                          {c.categoryName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input value={currentCategoryName} disabled />
                )}
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Input
                  name="describe"
                  value={formData.describe}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>

              {/* Image URL - ALWAYS VISIBLE */}
              <div className="md:col-span-2">
                <Label>Image URL</Label>
                <Input
                  name="itemLink"
                  value={formData.itemLink}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
            </div>
          </div>

          {/* VARIANTS */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Product Variants</h4>

            {formData.variants.map((v, index) => (
              <div
                key={v.productVariantId ?? index}
                className="border rounded-lg mb-2"
              >
                <button
                  className="flex justify-between items-center w-full p-3 bg-white hover:bg-gray-100 rounded-lg"
                  onClick={() =>
                    setExpandedVariant(expandedVariant === index ? null : index)
                  }
                >
                  <span className="font-medium">
                    Variant #{index + 1} — SKU: {v.sku}
                  </span>

                  {expandedVariant === index ? (
                    <ChevronDown />
                  ) : (
                    <ChevronRight />
                  )}
                </button>

                {expandedVariant === index && (
                  <div className="p-4 grid grid-cols-2 gap-3 bg-gray-50 border-t">
                    {[
                      ["Length (cm)", "lengthCm"],
                      ["Width (cm)", "widthCm"],
                      ["Height (cm)", "heightCm"],
                      ["Weight (gram)", "weightGram"],
                      ["Thickness (mm)", "thicknessMm"],
                      ["Size (inch)", "sizeInch"],
                      ["Layer", "layer"],
                      ["Custom Shape", "customShape"],
                      ["Ship Cost", "shipCost"],
                      ["Base Cost", "baseCost"],
                      ["Extra Shipping", "extraShipping"],
                    ].map(([label, field]) => (
                      <div key={field}>
                        <Label>{label}</Label>
                        <Input
                          disabled={!isEditing}
                          value={v[field] ?? ""}
                          onChange={(e) =>
                            handleVariantChange(index, field, e.target.value)
                          }
                        />
                      </div>
                    ))}

                    <div>
                      <Label>Total Cost</Label>
                      <Input disabled value={v.totalCost ?? ""} />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>

            {/* <Button
              variant={formData.status === "Active" ? "destructive" : "default"}
              onClick={handleStatusToggle}
            >
              {formData.status === "Active" ? "Deactivate" : "Activate"}
            </Button> */}

            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button className="bg-blue-600" onClick={handleSave}>
                  Save Changes
                </Button>
              </>
            ) : (
              <Button
                className="bg-blue-600"
                onClick={() => setIsEditing(true)}
              >
                Edit Product
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
