"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function ProductDetailsModal({ product, isOpen, onClose }) {
  if (!product) return null;

  // --- STATE ---
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);

  // --- UNIQUE SIZE + LAYER ---
  const uniqueSizes = [
    ...new Set(product?.variants?.map((v) => v.sizeInch) ?? []),
  ];

  const uniqueLayers = [
    ...new Set(product?.variants?.map((v) => v.layer) ?? []),
  ];

  // --- FIND VARIANT ---
  useEffect(() => {
    if (selectedSize && selectedLayer && product?.variants?.length) {
      const variant = product.variants.find(
        (v) => v.sizeInch === selectedSize && v.layer === selectedLayer
      );
      setSelectedVariant(variant || null);
    }
  }, [selectedSize, selectedLayer, product?.variants]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between w-full pr-0">
            <div>
              <DialogTitle className="text-2xl">
                {product.productName}
              </DialogTitle>

              <Badge variant="outline" className="mt-2">
                {product.categoryName || product.category}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* BODY */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* IMAGE */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <img
                src={product.itemLink || "/placeholder.svg"}
                alt={product.productName}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* DETAILS */}
          <div className="space-y-6">
            {/* PRICE FROM */}
            <div className="border-t border-b border-gray-200 py-4">
              <p className="text-sm text-gray-600 mb-1">Price From</p>
              <p className="text-3xl font-bold text-gray-900">
                {"$" + (product?.variants?.[0]?.totalCost || 0)}
              </p>
            </div>

            {/* SIZE */}
            <div>
              <p className="font-semibold text-gray-900 mb-3">Size :</p>
              <div className="flex flex-wrap gap-2">
                {uniqueSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`px-4 py-2 border rounded text-sm ${
                      selectedSize === size
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* LAYER */}
            <div>
              <p className="font-semibold text-gray-900 mb-3">Layer :</p>
              <div className="flex flex-wrap gap-2">
                {uniqueLayers.map((layer) => (
                  <button
                    key={layer}
                    onClick={() => setSelectedLayer(layer)}
                    className={`px-4 py-2 border rounded text-sm ${
                      selectedLayer === layer
                        ? "bg-blue-600 text-white border-blue-600"
                        : "border-gray-300 hover:border-gray-400 text-gray-700"
                    }`}
                  >
                    {layer}
                  </button>
                ))}
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <p className="font-semibold text-gray-900 mb-3">Describe :</p>
              <textarea
                value={product.describe || ""}
                readOnly
                className="w-full p-3 border border-gray-200 rounded bg-gray-50 text-sm text-gray-600 resize-none"
                rows="4"
              />
            </div>
          </div>
        </div>

        {/* --- PRODUCT SPECIFICATIONS --- */}
        {selectedVariant && (
          <div className="border-t border-gray-200 mt-6 pt-6 space-y-4">
            <h3 className="font-semibold text-gray-900">
              Product Specifications
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <SpecCard label="Thickness" value={selectedVariant.thicknessMm} />
              <SpecCard
                label="Weight (gram)"
                value={selectedVariant.weightGram}
              />
              <SpecCard
                label="Custom Shape"
                value={selectedVariant.customShape}
              />
              <SpecCard label="Length" value={selectedVariant.lengthCm} />
              <SpecCard label="Width" value={selectedVariant.widthCm} />
              <SpecCard label="Height" value={selectedVariant.heightCm} />
            </div>
          </div>
        )}

        {/* --- COST INFO --- */}
        {selectedVariant && (
          <div className="border-t border-gray-200 mt-6 pt-6 space-y-4">
            <h3 className="font-semibold text-gray-900">Cost Information</h3>

            <div className="grid grid-cols-3 gap-4">
              <SpecCard label="Base Cost" value={selectedVariant.baseCost} />
              <SpecCard label="Ship Cost" value={selectedVariant.shipCost} />
              <SpecCard label="Total Price" value={selectedVariant.totalCost} />
            </div>
          </div>
        )}

        {/* CLOSE */}
        <div className="border-t border-gray-200 mt-6 pt-4 flex justify-end">
          <Button onClick={onClose} className="bg-blue-600 hover:bg-blue-700">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SpecCard({ label, value }) {
  return (
    <div className="p-3 bg-gray-50 rounded">
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className="font-semibold text-gray-900">{value}</p>
    </div>
  );
}
