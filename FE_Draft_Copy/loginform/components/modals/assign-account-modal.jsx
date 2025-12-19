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
import apiClient from "../../lib/apiClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { UserPlus, Save, X, AlertCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AssignAccountModal({
  isOpen,
  onClose,
  onAssignAccount,
}) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    username: "",
    role: "",
    department: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    const fullName = formData.fullName.trim();
    if (!fullName) {
      newErrors.fullName = "Full name is required";
    } else if (fullName.length < 3 || fullName.length > 50) {
      newErrors.fullName = "Full name must be between 3 and 50 characters";
    }
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Please enter a valid email address";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    else if (formData.username.length < 3)
      newErrors.username = "Username must be at least 3 characters";
    if (!formData.role) newErrors.role = "Role is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleNameInput = (value) => {
    let sanitized = value
      // Chỉ cho chữ (kể cả tiếng Việt) + khoảng trắng
      .replace(/[^\p{L}\s]/gu, "")
      // Nhiều space -> 1 space
      .replace(/\s+/g, " ")
      // Không cho space đầu
      .replace(/^\s+/, "");

    setFormData((prev) => ({
      ...prev,
      fullName: sanitized,
    }));

    if (errors.fullName) {
      setErrors((prev) => ({ ...prev, fullName: "" }));
    }
  };

  const handleTrimmedInput = (field, value) => {
    // Không cho toàn space
    if (value.trim() === "" && value.length > 0) return;

    setFormData((prev) => ({
      ...prev,
      [field]: value.trimStart(),
    }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setShowError(false);
    setErrorMessage("");

    try {
      console.log("[Step 1] Register & send credentials...");

      const registerRes = await fetch(
        `${apiClient.defaults.baseURL}/api/Auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // 👈 để cookie được gửi
          body: JSON.stringify({ email: formData.email }),
        }
      );

      const registerData = await registerRes.json().catch(() => ({}));
      if (!registerRes.ok) {
        throw new Error(registerData.message || "Failed to register user");
      }

      // ✅ Format role (chữ cái đầu viết hoa)
      const formattedRole =
        formData.role.charAt(0).toUpperCase() +
        formData.role.slice(1).toLowerCase();

      console.log("[Step 2] Save user management info...");

      const managementRes = await fetch(
        `${apiClient.defaults.baseURL}/api/management/accounts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include", // 👈 quan trọng!
          body: JSON.stringify({
            email: formData.email,
            fullName: formData.fullName,
            roles: [formattedRole],
            isActive: true,
            department: formData.department || null,
            notes: formData.notes || null,
          }),
        }
      );

      // ⚠️ Tránh lỗi khi server trả không phải JSON
      const managementData = await managementRes.json().catch(() => ({}));
      const msg = (managementData.message || "").toLowerCase();

      if (managementRes.status === 401) {
        throw new Error(
          "Unauthorized (HTTP 401). Please log in as Manager again."
        );
      }

      // ✅ Nếu duplicate → bỏ qua
      if (!managementRes.ok) {
        if (
          managementRes.status === 400 ||
          managementRes.status === 409 ||
          msg.includes("exists") ||
          msg.includes("already")
        ) {
          console.warn("⚠️ Account already exists in management → continue");
        } else {
          throw new Error(managementData.message || "Failed to save account.");
        }
      }

      // ✅ Success
      const newAccount = {
        id: managementData.data?.id || crypto.randomUUID(),
        email: formData.email,
        fullName: formData.fullName,
        role: formattedRole,
        status: "Active",
        createdDate: new Date().toISOString().split("T")[0],
        lastLogin: "Never",
      };

      onAssignAccount(newAccount);
      setShowSuccess(true);
      window.location.reload();
    } catch (err) {
      console.error("[Error] Assign account failed:", err);
      setErrorMessage(err.message || "Unexpected error occurred.");
      setShowError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setFormData({
      fullName: "",
      email: "",
      username: "",
      role: "",
      department: "",
      notes: "",
    });
    setErrors({});
    setShowError(false);
    setShowSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        {/* ✅ SUCCESS */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Success
            </h3>
            <p className="text-green-700 text-sm mb-4">
              Account created and credentials sent via email successfully!
            </p>
            <Button
              onClick={handleClose}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              OK
            </Button>
          </div>
        )}

        {/* ❌ ERROR */}
        {showError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Error</h3>
            <p className="text-red-700 text-sm mb-4">{errorMessage}</p>
            <Button
              onClick={() => setShowError(false)}
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* FORM */}
        {!showSuccess && !showError && (
          <form onSubmit={handleSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl">
                <UserPlus className="h-5 w-5" />
                Assign New Account
              </DialogTitle>
            </DialogHeader>

            {/* Personal Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Full Name */}
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.fullName}
                    onChange={(e) => handleNameInput(e.target.value)}
                    maxLength={50}
                    className={errors.fullName ? "border-red-500" : ""}
                    placeholder="Enter full name"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.fullName.length}/50 characters
                  </p>
                  {errors.fullName && (
                    <p className="text-sm text-red-500">{errors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      handleTrimmedInput("email", e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Spacebar")
                        e.preventDefault();
                    }}
                    className={errors.email ? "border-red-500" : ""}
                    placeholder="Enter email"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email}</p>
                  )}
                </div>
              </div>

              {/* <div>
                <Label>Username *</Label>
                <Input
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  className={errors.username ? "border-red-500" : ""}
                />
                {errors.username && (
                  <p className="text-sm text-red-500">{errors.username}</p>
                )}
              </div> */}
            </div>

            <Separator />

            {/* Role + Department */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Role Assignment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(v) => handleInputChange("role", v)}
                  >
                    <SelectTrigger
                      className={errors.role ? "border-red-500" : ""}
                    >
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Designer">Designer</SelectItem>
                      <SelectItem value="QC">QC</SelectItem>
                      <SelectItem value="Seller">Seller</SelectItem>
                      <SelectItem value="Staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-red-500">{errors.role}</p>
                  )}
                </div>

                {/* <div>
                  <Label>Department (Optional)</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) =>
                      handleInputChange("department", e.target.value)
                    }
                  />
                </div> */}
              </div>
            </div>

            <Separator />

            {/* Notes */}
            {/* <div>
              <h3 className="text-lg font-semibold">Additional Information</h3>
              <Textarea
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                rows={3}
              />
            </div> */}

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                After creating the account, credentials will be sent to the
                provided email.
              </AlertDescription>
            </Alert>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create & Send
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
