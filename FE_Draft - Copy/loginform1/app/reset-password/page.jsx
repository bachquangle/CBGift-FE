"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "../../../lib/apiClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [errorOpen, setErrorOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Get email and token from URL query parameters
    const emailParam = searchParams.get("email");
    const tokenParam = searchParams.get("token");
    if (tokenParam) setToken(decodeURIComponent(tokenParam));

    if (emailParam) setEmail(emailParam);
    if (tokenParam) setToken(tokenParam);

    // If no email or token, show error
    if (!emailParam || !tokenParam) {
      setError("Invalid reset link. Please request a new password reset.");
      setErrorOpen(true);
    }
  }, [searchParams]);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    // Validation
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all fields");
      setErrorOpen(true);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      setErrorOpen(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setErrorOpen(true);
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            token: token,
            newPassword: newPassword,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        setError(err.message || "Failed to reset password");
        setErrorOpen(true);
        setIsLoading(false);
        return;
      }

      // Show success message
      setSuccessOpen(true);
    } catch (error) {
      setError("Something went wrong!");
      setErrorOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuccessClose = () => {
    setSuccessOpen(false);
    // Redirect to login page
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex items-center space-x-2 mb-8">
          <div className="w-8 h-8 bg-cyan-400 rounded"></div>
        </div>

        {/* Reset Password Form */}
        <div className="bg-white p-8 rounded-lg shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Reset Password
            </h1>
            <p className="text-gray-600 mt-1">Enter your new password below</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Email Display (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Email</label>
              <Input
                type="email"
                value={email}
                disabled
                className="w-full bg-gray-50"
              />
            </div>

            {/* New Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                New Password*
              </label>
              <Input
                type="password"
                placeholder="Enter new password (minimum 8 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Confirm Password*
              </label>
              <Input
                type="password"
                placeholder="Confirm your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Reset Button */}
            <Button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white py-3"
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </Button>

            {/* Back to Login */}
            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Error Dialog */}
      <Dialog open={errorOpen} onOpenChange={setErrorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Error</DialogTitle>
          </DialogHeader>
          <p className="text-gray-700">{error}</p>
          <DialogFooter>
            <Button onClick={() => setErrorOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-green-600">
              Password Reset Successful!
            </DialogTitle>
          </DialogHeader>
          <p className="text-gray-700 py-4">
            Your password has been reset successfully. You can now login with
            your new password.
          </p>
          <DialogFooter>
            <Button onClick={handleSuccessClose}>Go to Login</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
