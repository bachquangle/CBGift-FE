"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { X } from "lucide-react";
import Swal from "sweetalert2";

export default function InvoicePaymentModal({
  isOpen,
  onClose,
  selectedInvoice,
  onConfirmPayment,
  onInvoicesUpdate,
}) {
  const [paymentType, setPaymentType] = React.useState("full");
  const [creditPercentage, setCreditPercentage] = React.useState(20);

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return;

    let paymentAmount = selectedInvoice.totalAmount;
    let paymentDetails = "";

    if (paymentType === "full") {
      paymentAmount = selectedInvoice.totalAmount;
      paymentDetails = "Full Payment";
    } else {
      const percentage = creditPercentage;
      paymentAmount = (selectedInvoice.totalAmount * percentage) / 100;
      paymentDetails = `Credit Payment - ${percentage}%`;
    }

    const result = await Swal.fire({
      title: "Confirm Payment",
      html: `
        <div style="text-align: left;">
          <p><strong>Invoice:</strong> ${selectedInvoice.id}</p>
          <p><strong>Customer:</strong> ${selectedInvoice.customerName}</p>
          <p><strong>Type:</strong> ${paymentDetails}</p>
          <p style="font-size: 18px; margin-top: 15px;">
            <strong>Amount: ${paymentAmount.toLocaleString(
              "vi-VN"
            )} VNĐ</strong>
          </p>
        </div>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Confirm Payment",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
    });

    if (result.isConfirmed) {
      onClose();
      Swal.fire({
        icon: "success",
        title: "Payment Recorded!",
        text: `${paymentDetails} has been recorded for invoice ${selectedInvoice.id}`,
        timer: 2000,
        showConfirmButton: false,
      });

      // Call the callback to update invoices
      onInvoicesUpdate(selectedInvoice.id, paymentAmount, paymentDetails);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        {selectedInvoice && (
          <div className="space-y-6 py-4">
            {/* Invoice Details */}
            <div className="bg-purple-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Invoice:</span>
                <span className="font-semibold text-gray-900">
                  {selectedInvoice.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Customer:</span>
                <span className="font-semibold text-gray-900">
                  {selectedInvoice.customerName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Total Amount:</span>
                <span className="font-semibold text-gray-900">
                  {selectedInvoice.totalAmount.toLocaleString("vi-VN")} VNĐ
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 text-sm">Remaining:</span>
                <span className="font-semibold text-red-600">
                  {(
                    selectedInvoice.totalAmount - selectedInvoice.paidAmount
                  ).toLocaleString("vi-VN")}{" "}
                  VNĐ
                </span>
              </div>
            </div>

            {/* Payment Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">
                Payment Type
              </label>
              <div className="space-y-2">
                {/* Full Payment Option */}
                <div
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentType === "full"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                  onClick={() => setPaymentType("full")}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentType"
                      value="full"
                      checked={paymentType === "full"}
                      onChange={() => setPaymentType("full")}
                      className="h-4 w-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Full Payment</p>
                      <p className="text-sm text-gray-600">
                        Pay the complete invoice amount
                      </p>
                    </div>
                  </div>
                </div>

                {/* Credit Payment Option */}
                <div
                  className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    paymentType === "credit"
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                  onClick={() => setPaymentType("credit")}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentType"
                      value="credit"
                      checked={paymentType === "credit"}
                      onChange={() => setPaymentType("credit")}
                      className="h-4 w-4 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        Credit Payment
                      </p>
                      <p className="text-sm text-gray-600">
                        Pay a partial amount now
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Credit Percentage Selection */}
            {paymentType === "credit" && (
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-gray-700">
                  Payment Percentage
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[20, 30, 50].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => setCreditPercentage(percent)}
                      className={`p-3 rounded-lg border-2 font-semibold transition-all ${
                        creditPercentage === percent
                          ? "border-purple-500 bg-purple-100 text-purple-700"
                          : "border-gray-300 bg-white text-gray-700 hover:border-purple-300"
                      }`}
                    >
                      {percent}%
                    </button>
                  ))}
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Amount to pay:{" "}
                    <span className="font-semibold text-gray-900">
                      {(
                        (selectedInvoice.totalAmount * creditPercentage) /
                        100
                      ).toLocaleString("vi-VN")}{" "}
                      VNĐ
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* Full Payment Amount Display */}
            {paymentType === "full" && (
              <div className="bg-green-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  Total amount to pay:{" "}
                  <span className="font-semibold text-green-700">
                    {selectedInvoice.totalAmount.toLocaleString("vi-VN")} VNĐ
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmPayment}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Confirm Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
