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

export default function PasswordModal({ open, onOpenChange }) {
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState({ success: false, message: "" });
  const [fieldErrors, setFieldErrors] = useState({ current: "", new: "" });

  useEffect(() => {
    if (!open) {
      // reset state khi đóng modal
      setPasswords({ current: "", new: "", confirm: "" });
      setFieldErrors({ current: "", new: "" });
      setShowConfirm(false);
      setShowResult(false);
    }
  }, [open]);

  const handleChange = () => {
    setFieldErrors({ current: "", new: "" });

    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setResult({ success: false, message: "Please fill all the input" });
      setShowResult(true);
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setResult({
        success: false,
        message: "Your new password and confirm password do not match",
      });
      setShowResult(true);
      return;
    }
    if (passwords.new.length < 8) {
      setResult({
        success: false,
        message: "Password must be at least 8 characters",
      });
      setShowResult(true);
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setFieldErrors({ current: "", new: "" });

    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/auth/change-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            CurrentPassword: passwords.current,
            NewPassword: passwords.new,
          }),
        }
      );

      let payload = null;
      try {
        payload = await res.json();
      } catch (e) {}

      if (!res.ok) {
        let message = payload?.message ?? "Change password failed";

        // check Identity errors
        if (payload?.errors && Array.isArray(payload.errors)) {
          const mismatch = payload.errors.find(
            (e) =>
              (e.Description &&
                e.Description.toLowerCase().includes("incorrect")) ||
              (e.Description &&
                e.Description.toLowerCase().includes("mismatch"))
          );

          if (mismatch) {
            message = "Current password is incorrect";
            setFieldErrors((prev) => ({
              ...prev,
              current: message,
            }));
            setTimeout(() => document.getElementById("current")?.focus(), 0);
          }
        }

        setResult({ success: false, message });
        setShowResult(true);
        return;
      }

      // thành công
      const successMsg = payload?.message ?? "Change password successfully";
      setResult({ success: true, message: successMsg });
      setShowResult(true);

      // tự động đóng popup + modal sau 1.5s
      setTimeout(() => {
        setShowResult(false);
        onOpenChange(false);
        setPasswords({ current: "", new: "", confirm: "" });
      }, 1500);
    } catch (error) {
      console.error("Change password error:", error);
      setResult({
        success: false,
        message: "Something went wrong, please try again",
      });
      setShowResult(true);
    }
  };

  const handleInputChange = (field, value) => {
    setPasswords((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({
      ...prev,
      [field === "confirm" ? "new" : field]: "",
    }));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current">Current Password</Label>
              <Input
                id="current"
                type="password"
                value={passwords.current}
                onChange={(e) => handleInputChange("current", e.target.value)}
              />
              {fieldErrors.current && (
                <p className="text-sm text-red-600 mt-1">
                  {fieldErrors.current}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New Password</Label>
              <Input
                id="new"
                type="password"
                value={passwords.new}
                onChange={(e) => handleInputChange("new", e.target.value)}
                placeholder="Minimum 8 characters"
              />
              {fieldErrors.new && (
                <p className="text-sm text-red-600 mt-1">{fieldErrors.new}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm New Password</Label>
              <Input
                id="confirm"
                type="password"
                value={passwords.confirm}
                onChange={(e) => handleInputChange("confirm", e.target.value)}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleChange}>Change Password</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm change password */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Password Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change your password?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirm(false)}>
              No
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Yes</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Result popup */}
      <AlertDialog open={showResult} onOpenChange={setShowResult}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {result.success ? "✅ Successfully" : "❌ Error"}
            </AlertDialogTitle>
            <AlertDialogDescription>{result.message}</AlertDialogDescription>
          </AlertDialogHeader>
          {!result.success && (
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setShowResult(false)}>
                OK
              </AlertDialogAction>
            </AlertDialogFooter>
          )}
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
