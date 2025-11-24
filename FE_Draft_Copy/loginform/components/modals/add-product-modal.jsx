"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useToast } from "@/hooks/use-toast";

export default function AddProductModal({
  isOpen,
  onClose,
  onAddProduct,
  categories,
}) {
  const { toast } = useToast();

  // ----------------------------
  // STATE
  // ----------------------------
  const [formData, setFormData] = useState({
    productName: "",
    description: "",
    category: "",
    image: "",
    variants: [
      {
        sizeInch: "",
        layer: "",
        thicknessMm: "",
        customShape: "",
        weightGram: "",
        lengthCm: "",
        widthCm: "",
        heightCm: "",
        baseCost: "",
        shipCost: "",
        extraShipping: "",
      },
    ],
  });

  const [uploading, setUploading] = useState(false);

  // ----------------------------
  // HANDLERS
  // ----------------------------
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...formData.variants];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, variants: updated }));
  };

  const addVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [
        ...prev.variants,
        {
          sizeInch: "",
          layer: "",
          thicknessMm: "",
          customShape: "",
          weightGram: "",
          lengthCm: "",
          widthCm: "",
          heightCm: "",
          baseCost: "",
          shipCost: "",
          extraShipping: "",
        },
      ],
    }));
  };

  const removeVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  // ----------------------------
  // IMAGE UPLOAD FIXED
  // ----------------------------
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedExt = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!allowedExt.includes(ext)) {
      toast({
        title: "Invalid File",
        description: "Only image files are allowed.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Max size allowed is 5MB",
        variant: "destructive",
      });
      return;
    }

    const form = new FormData();
    form.append("File", file);

    try {
      setUploading(true);

      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/images/upload`,
        {
          method: "POST",
          credentials: "include",
          body: form,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload failed");

      // 🔥 FIX CHÍNH — giống seller EXACT
      const imageUrl =
        data.url || data.secureUrl || data.path || data.imageUrl || "";

      setFormData((prev) => ({ ...prev, image: imageUrl }));

      toast({
        title: "Upload Success",
        description: "Image uploaded successfully.",
      });
    } catch (err) {
      toast({
        title: "Upload Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  // ----------------------------
  // SUBMIT
  // ----------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.productName || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Product name & category are required.",
        variant: "destructive",
      });
      return;
    }

    const categoryId = categories.indexOf(formData.category) + 1;

    const body = {
      categoryId,
      productName: formData.productName,
      productCode: "PRD-" + Date.now(),
      status: 1,
      itemLink: formData.image, // 🔥 sau fix, luôn có url
      describe: formData.description,
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
        sku: "SKU-" + Date.now() + "-" + Math.floor(Math.random() * 9999999),
        extraShipping: Number(v.extraShipping || 0),
        totalCost: Number(v.baseCost || 0) + Number(v.shipCost || 0),
      })),
    };

    try {
      const res = await fetch(`${apiClient.defaults.baseURL}/api/Product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error("Failed to create product");

      toast({
        title: "Success",
        description: "Product created successfully!",
      });

      onAddProduct();
      onClose();
    } catch (err) {
      toast({
        title: "Save Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // ----------------------------
  // JSX
  // ----------------------------
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PRODUCT INFO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Product Name *</Label>
              <Input
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => handleSelectChange("category", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="md:col-span-2">
              <Label>Upload Image *</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />

              {formData.image && (
                <img
                  src={formData.image}
                  className="h-40 mt-3 rounded border object-cover"
                />
              )}
            </div>
          </div>

          {/* VARIANTS */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">Product Variants</h3>
              <Button
                type="button"
                onClick={addVariant}
                className="bg-green-600"
              >
                + Add Variant
              </Button>
            </div>

            {formData.variants.map((v, i) => (
              <div
                key={i}
                className="border rounded-lg p-4 bg-gray-50 mb-4 space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Variant #{i + 1}</h4>
                  {formData.variants.length > 1 && (
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeVariant(i)}
                    >
                      Remove
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Size (inch)"
                    value={v.sizeInch}
                    onChange={(e) =>
                      handleVariantChange(i, "sizeInch", e.target.value)
                    }
                  />

                  <Input
                    placeholder="Layer"
                    value={v.layer}
                    onChange={(e) =>
                      handleVariantChange(i, "layer", e.target.value)
                    }
                  />

                  <Input
                    placeholder="Thickness (mm)"
                    value={v.thicknessMm}
                    onChange={(e) =>
                      handleVariantChange(i, "thicknessMm", e.target.value)
                    }
                  />

                  <Input
                    placeholder="Custom Shape"
                    value={v.customShape}
                    onChange={(e) =>
                      handleVariantChange(i, "customShape", e.target.value)
                    }
                  />

                  <Input
                    placeholder="Weight (gram)"
                    type="number"
                    value={v.weightGram}
                    onChange={(e) =>
                      handleVariantChange(i, "weightGram", e.target.value)
                    }
                  />

                  <div>
                    <Label>Dimensions (cm)</Label>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="L"
                        type="number"
                        value={v.lengthCm}
                        onChange={(e) =>
                          handleVariantChange(i, "lengthCm", e.target.value)
                        }
                      />
                      <Input
                        placeholder="W"
                        type="number"
                        value={v.widthCm}
                        onChange={(e) =>
                          handleVariantChange(i, "widthCm", e.target.value)
                        }
                      />
                      <Input
                        placeholder="H"
                        type="number"
                        value={v.heightCm}
                        onChange={(e) =>
                          handleVariantChange(i, "heightCm", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <Input
                    placeholder="Base Cost"
                    type="number"
                    value={v.baseCost}
                    onChange={(e) =>
                      handleVariantChange(i, "baseCost", e.target.value)
                    }
                  />

                  <Input
                    placeholder="Ship Cost"
                    type="number"
                    value={v.shipCost}
                    onChange={(e) =>
                      handleVariantChange(i, "shipCost", e.target.value)
                    }
                  />

                  <Input
                    placeholder="Extra Shipping"
                    type="number"
                    value={v.extraShipping}
                    onChange={(e) =>
                      handleVariantChange(i, "extraShipping", e.target.value)
                    }
                  />
                </div>
              </div>
            ))}
          </div>

          {/* SUBMIT */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button disabled={uploading} type="submit" className="bg-blue-600">
              {uploading ? "Uploading..." : "Save Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
