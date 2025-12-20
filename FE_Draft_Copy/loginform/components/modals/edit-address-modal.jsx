"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import apiClient from "../../lib/apiClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { ChevronDown } from "lucide-react";

export default function EditAddressModal({
  open,
  onOpenChange,
  initialAddress,
  onSave,
  isLoading,
}) {
  // Address form state
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

  // Location data
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);

  // Search and dropdown states
  const [searchProvince, setSearchProvince] = useState("");
  const [searchDistrict, setSearchDistrict] = useState("");
  const [searchWard, setSearchWard] = useState("");
  const [openProvinceDropdown, setOpenProvinceDropdown] = useState(false);
  const [openDistrictDropdown, setOpenDistrictDropdown] = useState(false);
  const [openWardDropdown, setOpenWardDropdown] = useState(false);
  const [hoverProvince, setHoverProvince] = useState(null);
  const [hoverDistrict, setHoverDistrict] = useState(null);
  const [hoverWard, setHoverWard] = useState(null);

  useEffect(() => {
    if (!open || !initialAddress) return;

    const parsed = parseLocationFromAddress(initialAddress.address);

    setCustomerInfo({
      name: initialAddress.name || "",
      phone: initialAddress.phone || "",
      email: initialAddress.email || "",
      address: initialAddress.address
        ? initialAddress.address.split(",")[0].trim()
        : "",
      address1: initialAddress.address1 || "",

      provinceName: parsed.provinceName || "",
      districtName: parsed.districtName || "",
      wardName: parsed.wardName || "",

      provinceId: "",
      districtId: "",
      wardId: "",
    });

    fetchProvinces();
  }, [open, initialAddress]);

  useEffect(() => {
    if (!customerInfo.provinceName || provinces.length === 0) return;

    const matchedProvince = provinces.find(
      (p) =>
        p.name.trim().toLowerCase() ===
        customerInfo.provinceName.trim().toLowerCase()
    );

    if (!matchedProvince) return;

    // Only update if provinceId is different to avoid infinite loops
    if (customerInfo.provinceId !== matchedProvince.id.toString()) {
      setCustomerInfo((prev) => ({
        ...prev,
        provinceId: matchedProvince.id.toString(),
        provinceName: matchedProvince.name,
      }));

      fetchDistricts(matchedProvince.id);
    }
  }, [provinces, customerInfo.provinceName]);

  useEffect(() => {
    if (!customerInfo.districtName || districts.length === 0) return;
    if (!customerInfo.provinceId) return;

    const matchedDistrict = districts.find(
      (d) =>
        d.name.trim().toLowerCase() ===
        customerInfo.districtName.trim().toLowerCase()
    );

    if (!matchedDistrict) return;

    // Only update if districtId is different
    if (customerInfo.districtId !== matchedDistrict.id.toString()) {
      setCustomerInfo((prev) => ({
        ...prev,
        districtId: matchedDistrict.id.toString(),
        districtName: matchedDistrict.name,
      }));

      fetchWards(matchedDistrict.id);
    }
  }, [districts, customerInfo.districtName]);

  useEffect(() => {
    if (!customerInfo.wardName || wards.length === 0) return;
    if (!customerInfo.districtId) return;

    const matchedWard = wards.find(
      (w) =>
        w.name.trim().toLowerCase() ===
        customerInfo.wardName.trim().toLowerCase()
    );

    if (!matchedWard) return;

    // Only update if wardId is different
    if (customerInfo.wardId !== matchedWard.id.toString()) {
      setCustomerInfo((prev) => ({
        ...prev,
        wardId: matchedWard.id.toString(),
        wardName: matchedWard.name,
      }));
    }
  }, [wards, customerInfo.wardName]);

  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Location/provinces`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      // Normalize data
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
        `${apiClient.defaults.baseURL}/api/Location/districts/${provinceId}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      const normalized = data.map((d) => ({
        id: d.DistrictID,
        name: d.DistrictName,
      }));

      setDistricts(normalized);
    } catch (err) {
      console.error("Failed to load districts:", err);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const fetchWards = async (districtId) => {
    setLoadingWards(true);
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Location/wards/${districtId}`,
        {
          credentials: "include",
        }
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();

      const normalized = data.map((w) => ({
        id: w.WardCode,
        name: w.WardName,
      }));

      setWards(normalized);
    } catch (err) {
      console.error("Failed to load wards:", err);
    } finally {
      setLoadingWards(false);
    }
  };

  const parseLocationFromAddress = (address) => {
    if (!address) return {};

    const parts = address.split(",").map((p) => p.trim());

    return {
      wardName: parts[parts.length - 3] || "",
      districtName: parts[parts.length - 2] || "",
      provinceName: parts[parts.length - 1] || "",
    };
  };

  const handleProvinceChange = (provinceId) => {
    const province = provinces.find((p) => p.id?.toString() === provinceId);

    setCustomerInfo((prev) => ({
      ...prev,
      provinceId: provinceId,
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
    fetchDistricts(provinceId);
  };

  const handleDistrictChange = (districtId) => {
    const district = districts.find((d) => d.id?.toString() === districtId);

    setCustomerInfo((prev) => ({
      ...prev,
      districtId: districtId,
      districtName: district?.name || "",
      wardId: "",
      wardName: "",
    }));

    setWards([]);
    setOpenDistrictDropdown(false);
    setSearchDistrict("");
    fetchWards(districtId);
  };

  const handleWardChange = (wardId) => {
    const ward = wards.find((w) => w.id?.toString() === wardId);

    setCustomerInfo((prev) => ({
      ...prev,
      wardId: wardId,
      wardName: ward?.name || "",
    }));

    setOpenWardDropdown(false);
    setSearchWard("");
  };

  // NAME: chỉ chữ + space, không space đầu, không nhiều space
  const handleNameInput = (value) => {
    let sanitized = value
      .replace(/[^\p{L}\s]/gu, "") // chỉ chữ (VN) + space
      .replace(/\s+/g, " ") // nhiều space -> 1
      .replace(/^\s+/, ""); // không space đầu

    setCustomerInfo((prev) => ({
      ...prev,
      name: sanitized,
    }));
  };

  // EMAIL: không cho space, trimStart
  const handleEmailInput = (value) => {
    if (value.trim() === "" && value.length > 0) return;

    setCustomerInfo((prev) => ({
      ...prev,
      email: value.replace(/\s/g, "").trimStart(),
    }));
  };

  // PHONE: chỉ số + space, max 10 số
  const handlePhoneInput = (value) => {
    const sanitized = value.replace(/[^\d\s]/g, "");

    setCustomerInfo((prev) => ({
      ...prev,
      phone: sanitized.trimStart(),
    }));
  };

  // Các field text thường (address, address1)
  const handleTrimmedInput = (field, value) => {
    if (value.trim() === "" && value.length > 0) return;

    setCustomerInfo((prev) => ({
      ...prev,
      [field]: value.trimStart(),
    }));
  };

  const validateForm = () => {
    const requiredFields = [
      "name",
      "phone",
      "email",
      "address",
      "provinceId",
      "districtId",
      "wardId",
    ];
    return requiredFields.every((field) =>
      customerInfo[field]?.toString().trim()
    );
  };

  const filteredProvinces = provinces.filter((p) =>
    p.name.toLowerCase().includes(searchProvince.toLowerCase())
  );

  const filteredDistricts = districts.filter((d) =>
    d.name.toLowerCase().includes(searchDistrict.toLowerCase())
  );

  const filteredWards = wards.filter((w) =>
    w.name.toLowerCase().includes(searchWard.toLowerCase())
  );

  const handleSave = () => {
    if (!validateForm()) {
      alert("Please fill in all required fields!");
      return;
    }
    onSave(customerInfo);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Address</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={customerInfo.name}
              onChange={(e) => handleNameInput(e.target.value)}
              placeholder="Enter customer name"
              maxLength={50}
            />
            <p className="text-xs text-gray-500 mt-1">
              {customerInfo.name.length}/50 characters
            </p>
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              value={customerInfo.phone}
              onChange={(e) => handlePhoneInput(e.target.value)}
              placeholder="Enter phone number"
              maxLength={10}
            />
            <p className="text-xs text-gray-500 mt-1">
              Phone format (10 digits, starts with 0)
            </p>
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={customerInfo.email}
              onChange={(e) => handleEmailInput(e.target.value)}
              placeholder="Enter email address"
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Spacebar") e.preventDefault();
              }}
            />
          </div>

          {/* Address */}
          <div>
            <Label htmlFor="address">
              Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              type="text"
              value={customerInfo.address}
              onChange={(e) => handleTrimmedInput("address", e.target.value)}
              placeholder="Enter street address"
            />
          </div>

          {/* Address 1 (Optional) */}
          <div>
            <Label htmlFor="address1">Address 1</Label>
            <Input
              id="address1"
              type="text"
              value={customerInfo.address1}
              onChange={(e) => handleTrimmedInput("address1", e.target.value)}
              placeholder="Enter additional address (optional)"
            />
          </div>

          {/* Province Dropdown */}
          <div>
            <Label htmlFor="province">
              Province <span className="text-red-500">*</span>
            </Label>
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
                        const isSelected =
                          customerInfo.provinceId?.toString() ===
                          p.id?.toString();

                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() =>
                              handleProvinceChange(p.id?.toString())
                            }
                            onMouseEnter={() => setHoverProvince(p.id)}
                            onMouseLeave={() => setHoverProvince(null)}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                              isSelected
                                ? "bg-blue-600 text-white font-bold"
                                : hoverProvince === p.id
                                ? "bg-blue-100 text-blue-900"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <span>{p.name}</span>
                            {isSelected && <span className="font-bold">✓</span>}
                          </button>
                        );
                      })
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

          {/* District Dropdown */}
          <div>
            <Label htmlFor="district">
              District <span className="text-red-500">*</span>
            </Label>
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
                      filteredDistricts.map((d) => {
                        const isSelected =
                          customerInfo.districtId?.toString() ===
                          d.id?.toString();

                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() =>
                              handleDistrictChange(d.id?.toString())
                            }
                            onMouseEnter={() => setHoverDistrict(d.id)}
                            onMouseLeave={() => setHoverDistrict(null)}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                              isSelected
                                ? "bg-blue-50 text-blue-700 font-semibold"
                                : hoverDistrict === d.id
                                ? "bg-blue-100 text-blue-900"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <span>{d.name}</span>
                            {isSelected && (
                              <span className="text-blue-700">✓</span>
                            )}
                          </button>
                        );
                      })
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
            <Label htmlFor="ward">
              Ward <span className="text-red-500">*</span>
            </Label>
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
                      filteredWards.map((w) => {
                        const isSelected =
                          customerInfo.wardId?.toString() === w.id?.toString();

                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => handleWardChange(w.id?.toString())}
                            onMouseEnter={() => setHoverWard(w.id)}
                            onMouseLeave={() => setHoverWard(null)}
                            className={`w-full px-3 py-2 text-left text-sm transition-colors flex items-center justify-between ${
                              isSelected
                                ? "bg-blue-50 text-blue-700 font-semibold"
                                : hoverWard === w.id
                                ? "bg-blue-100 text-blue-900"
                                : "hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            <span>{w.name}</span>
                            {isSelected && (
                              <span className="text-blue-700">✓</span>
                            )}
                          </button>
                        );
                      })
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

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? "Saving..." : "Save Address"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
