"use client";

import { useState } from "react";
import apiClient from "../../lib/apiClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { User, Shield, Save, X, Loader } from "lucide-react";

export default function AccountDetailsModal({
  account,
  isOpen,
  onClose,
  onUpdateRole,
  onToggleBan,
}) {
  const [selectedRole, setSelectedRole] = useState(
    account?.roles?.[0]?.toLowerCase() || ""
  );
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingRole, setIsLoadingRole] = useState(false);
  const [isLoadingBan, setIsLoadingBan] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Dialog states
  const [confirmAction, setConfirmAction] = useState(null); // "role" hoặc "ban"
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (!account) return null;

  const getRoleBadge = (roles) => {
    if (!roles || roles.length === 0)
      return <Badge className="bg-gray-500">NO ROLE</Badge>;
    const roleName = roles[0].toLowerCase();
    const roleColors = {
      manager: "bg-purple-500",
      designer: "bg-blue-500",
      qc: "bg-green-500",
      seller: "bg-orange-500",
      staff: "bg-gray-500",
    };
    return (
      <Badge className={roleColors[roleName] || "bg-gray-500"}>
        {roleName.toUpperCase()}
      </Badge>
    );
  };

  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge className="bg-green-500">Active</Badge>
    ) : (
      <Badge className="bg-red-500">Banned</Badge>
    );
  };

  // Confirm triggers
  const confirmSaveRole = () => {
    setConfirmAction("role");
    setShowConfirmDialog(true);
  };

  const confirmBanToggle = () => {
    setConfirmAction("ban");
    setShowConfirmDialog(true);
  };

  const handleSaveRole = async () => {
    const currentRole = account.roles?.[0]?.toLowerCase() || "";
    if (selectedRole === currentRole) {
      setIsEditing(false);
      return;
    }

    try {
      setIsLoadingRole(true);
      setError(null);
      setSuccess(null);

      const payload = {
        userId: account.id,
        roles: [selectedRole],
      };

      console.log(
        "[v0] Updating role with PUT to /api/management/accounts/roles:",
        payload
      );

      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/management/accounts/roles`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();
      console.log("[v0] Role update response:", responseData);

      if (!response.ok) {
        throw new Error(
          responseData.message || `HTTP error! status: ${response.status}`
        );
      }

      console.log("[v0] Role updated successfully");
      setSuccess("Role updated successfully");
      onUpdateRole(account.id, selectedRole);
      setSuccessMessage("Role updated successfully");
      setShowSuccessDialog(true);

      setIsEditing(false);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("[v0] Error updating role:", err);
      setError(err.message);
    } finally {
      setIsLoadingRole(false);
    }
  };

  const handleCancel = () => {
    setSelectedRole(account.roles?.[0]?.toLowerCase() || "");
    setIsEditing(false);
    setError(null);
    setSuccess(null);
  };

  const handleBanToggle = async () => {
    try {
      setIsLoadingBan(true);
      setError(null);
      setSuccess(null);

      // If currently active, set isActive to false (ban)
      // If currently banned, set isActive to true (unban)
      const newIsActive = !account.isActive;

      const payload = {
        id: account.id,
        fullName: account.fullName,
        email: account.email,
        isActive: newIsActive,
      };

      console.log(
        "[v0] Toggling ban status with PUT to /api/management/accounts:",
        payload
      );

      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/management/accounts`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();
      console.log("[v0] Ban toggle response:", responseData);

      if (!response.ok) {
        throw new Error(
          responseData.message || `HTTP error! status: ${response.status}`
        );
      }

      console.log("[v0] Ban status updated successfully");
      setSuccess(
        newIsActive
          ? "Account unbanned successfully"
          : "Account banned successfully"
      );
      onToggleBan(account.id);
      setSuccessMessage(
        newIsActive
          ? "Account unbanned successfully"
          : "Account banned successfully"
      );
      setShowSuccessDialog(true);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("[v0] Error updating ban status:", err);
      setError(err.message);
    } finally {
      setIsLoadingBan(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Error/Success Messages */}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Account ID
                </Label>
                <p className="text-lg font-semibold">{account.id}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Full Name
                </Label>
                <p className="text-lg">{account.fullName}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Email
                </Label>
                <p className="text-lg">{account.email}</p>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Email Confirmed
                </Label>
                <p className="text-lg">
                  {account.emailConfirmed ? "Yes" : "No"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Account Status
                </Label>
                <div className="mt-1">{getStatusBadge(account.isActive)}</div>
              </div>

              <div>
                <Label className="text-sm font-medium text-gray-500">
                  Current Role(s)
                </Label>
                <div className="mt-1">{getRoleBadge(account.roles)}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Role Management */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-gray-700" />
              <h3 className="text-lg font-semibold">Role Management</h3>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-500">
                    Select Role
                  </Label>
                  {!isEditing ? (
                    <div className="mt-1">{getRoleBadge(account.roles)}</div>
                  ) : (
                    <div className="mt-2">
                      <Select
                        value={selectedRole}
                        onValueChange={setSelectedRole}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="designer">Designer</SelectItem>
                          <SelectItem value="qc">QC</SelectItem>
                          <SelectItem value="seller">Seller</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!isEditing ? (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditing(true)}
                      disabled={isLoadingRole}
                    >
                      Edit Role
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isLoadingRole}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={confirmSaveRole}
                        disabled={isLoadingRole}
                      >
                        Save
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Actions</h3>
            <div className="flex gap-3">
              <Button
                variant={account.isActive ? "destructive" : "default"}
                onClick={confirmBanToggle}
                disabled={isLoadingBan}
              >
                {isLoadingBan && (
                  <Loader className="h-4 w-4 mr-1 animate-spin" />
                )}
                {account.isActive ? "Ban Account" : "Unban Account"}
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoadingRole || isLoadingBan}
          >
            Close
          </Button>
        </div>
      </DialogContent>
      {/* Confirm Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-sm text-center space-y-4">
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "role"
                ? "Confirm Role Change"
                : account.isActive
                ? "Confirm Ban Account"
                : "Confirm Unban Account"}
            </DialogTitle>
          </DialogHeader>

          <p className="text-gray-600">
            {confirmAction === "role"
              ? `Are you sure you want to change this user's role to ${selectedRole.toUpperCase()}?`
              : account.isActive
              ? "Are you sure you want to ban this account?"
              : "Are you sure you want to unban this account?"}
          </p>

          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant={
                confirmAction === "ban" && account.isActive
                  ? "destructive"
                  : "default"
              }
              onClick={async () => {
                setShowConfirmDialog(false);
                if (confirmAction === "role") {
                  await handleSaveRole();
                } else {
                  await handleBanToggle();
                }
              }}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="max-w-sm text-center space-y-4">
          <DialogHeader>
            <DialogTitle className="text-green-600">Success</DialogTitle>
          </DialogHeader>

          <p className="text-gray-700">{successMessage}</p>

          <div className="flex justify-center pt-2">
            <Button
              onClick={() => {
                setShowSuccessDialog(false);
                onClose(); // đóng modal
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
