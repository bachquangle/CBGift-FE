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
import apiClient from "../../lib/apiClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AddRelationshipModal({ isOpen, onClose, onAdd }) {
  const { toast } = useToast();
  const [sellers, setSellers] = useState([]);
  const [designers, setDesigners] = useState([]);
  const [selectedSeller, setSelectedSeller] = useState("");
  const [selectedDesigner, setSelectedDesigner] = useState("");
  const [sellerSearch, setSellerSearch] = useState("");
  const [designerSearch, setDesignerSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");

  // ✅ Fetch sellers & designers when modal opens
  useEffect(() => {
    if (isOpen) fetchSellersAndDesigners();
  }, [isOpen]);

  const fetchSellersAndDesigners = async () => {
    setLoadingData(true);
    try {
      const [sellerRes, designerRes] = await Promise.all([
        fetch(`${apiClient.defaults.baseURL}/api/Auth/all-sellers`, {
          credentials: "include",
        }),
        fetch(`${apiClient.defaults.baseURL}/api/Auth/all-designers`, {
          credentials: "include",
        }),
      ]);

      if (!sellerRes.ok || !designerRes.ok)
        throw new Error("Failed to fetch sellers or designers.");

      const sellersData = await sellerRes.json();
      const designersData = await designerRes.json();
      setSellers(sellersData);
      setDesigners(designersData);
    } catch (err) {
      console.error("❌ Error fetching sellers/designers:", err);
      setError("Unable to load sellers and designers. Please try again.");
    } finally {
      setLoadingData(false);
    }
  };

  const filteredSellers = sellers.filter((s) =>
    (s.sellerName || "").toLowerCase().includes(sellerSearch.toLowerCase())
  );

  const filteredDesigners = designers.filter((d) =>
    (d.designerName || "").toLowerCase().includes(designerSearch.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedSeller || !selectedDesigner) {
      toast({
        title: "⚠ Missing Info",
        description: "Please select both seller and designer.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      console.log("🟡 Submitting relationship:", {
        sellerUserId: selectedSeller,
        designerUserId: selectedDesigner,
      });

      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/manager/assignments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sellerUserId: selectedSeller,
            designerUserId: selectedDesigner,
          }),
        }
      );

      const text = await res.text();
      console.log("🔵 Response text:", text);

      if (!res.ok) {
        let message = "Failed to create relationship.";
        try {
          const json = JSON.parse(text);
          message = json.message || json.error || message;
        } catch {
          message = text || message;
        }

        // ✅ Nếu backend báo đã tồn tại
        if (
          message.toLowerCase().includes("exist") ||
          message.toLowerCase().includes("tồn tại")
        ) {
          toast({
            title: "Duplicate Relationship",
            description: "This seller–designer relationship already exists.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }

        throw new Error(message);
      }

      // ✅ Success
      toast({
        title: "✅ Success",
        description: "Relationship created successfully!",
        className: "bg-green-50 text-green-700 border border-green-200",
      });

      // Gọi cập nhật danh sách
      onAdd?.();

      // Reset modal sau một chút để toast vẫn hiển thị
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (error) {
      console.error("❌ Create relationship error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create relationship.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedSeller("");
    setSelectedDesigner("");
    setSellerSearch("");
    setDesignerSearch("");
    setNotes("");
    setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Relationship</DialogTitle>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="ml-3 text-gray-600">
              Loading sellers and designers...
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Seller Selection */}
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Seller
                  </Label>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search sellers..."
                        value={sellerSearch}
                        onChange={(e) => setSellerSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={selectedSeller}
                      onValueChange={setSelectedSeller}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a seller" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredSellers.map((seller) => (
                          <SelectItem
                            key={seller.sellerId}
                            value={seller.sellerId}
                          >
                            {seller.sellerName || "Unnamed Seller"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Designer Selection */}
              <Card>
                <CardContent className="p-4">
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Select Designer
                  </Label>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search designers..."
                        value={designerSearch}
                        onChange={(e) => setDesignerSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={selectedDesigner}
                      onValueChange={setSelectedDesigner}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a designer" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredDesigners.map((designer) => (
                          <SelectItem
                            key={designer.designerId}
                            value={designer.designerId}
                          >
                            {designer.designerName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Notes */}
            <div>
              <Label
                htmlFor="notes"
                className="text-sm font-medium text-gray-700"
              >
                Notes (Optional)
              </Label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full mt-1 p-2 border border-gray-300 rounded-md resize-none"
                rows={3}
                placeholder="Add any notes about this relationship..."
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                <Plus className="h-4 w-4 mr-1" />
                {loading ? "Creating..." : "Create Relationship"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
