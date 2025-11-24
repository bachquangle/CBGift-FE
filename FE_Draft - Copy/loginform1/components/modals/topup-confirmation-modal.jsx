"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, X, DollarSign, User, Calendar, CreditCard, AlertTriangle } from "lucide-react"

export default function TopUpConfirmationModal({ isOpen, onClose, request, action, onConfirm }) {
  const [loading, setLoading] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")

  const handleConfirm = async () => {
    if (action === "reject" && !rejectionReason.trim()) {
      alert("Please provide a reason for rejection")
      return
    }

    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const updatedRequest = {
        ...request,
        status: action === "approve" ? "approved" : "rejected",
        [action === "approve" ? "approvedDate" : "rejectedDate"]: new Date().toISOString().split("T")[0],
        ...(action === "reject" && { rejectionReason }),
      }

      onConfirm(updatedRequest)
      handleClose()

      const message =
        action === "approve" ? "Top-up request approved successfully!" : "Top-up request rejected successfully!"
      alert(message)
    } catch (error) {
      alert(`Failed to ${action} request. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setRejectionReason("")
    onClose()
  }

  if (!request) return null

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount)
  }

  const isApprove = action === "approve"
  const actionColor = isApprove ? "green" : "red"
  const ActionIcon = isApprove ? Check : X

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ActionIcon className={`h-5 w-5 text-${actionColor}-600`} />
            {isApprove ? "Approve" : "Reject"} Top-up Request
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Warning Message */}
          <div
            className={`p-4 rounded-lg border ${isApprove ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className={`h-5 w-5 mt-0.5 text-${actionColor}-600`} />
              <div>
                <p className={`font-medium text-${actionColor}-800`}>
                  {isApprove ? "Confirm Approval" : "Confirm Rejection"}
                </p>
                <p className={`text-sm text-${actionColor}-700 mt-1`}>
                  {isApprove
                    ? "This will approve the top-up request and the funds will be processed."
                    : "This will reject the top-up request and notify the seller."}
                </p>
              </div>
            </div>
          </div>

          {/* Request Details */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Seller Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Seller Information
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm text-gray-600">Name</Label>
                      <p className="text-sm font-medium">{request.seller.name}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Email</Label>
                      <p className="text-sm">{request.seller.email}</p>
                    </div>
                  </div>
                </div>

                {/* Request Details */}
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Request Details
                  </h3>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-sm text-gray-600">Amount</Label>
                      <p className="text-lg font-bold text-green-600">
                        {formatCurrency(request.amount, request.currency)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Payment Method</Label>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <p className="text-sm">{request.paymentMethod}</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-600">Transaction ID</Label>
                      <p className="text-sm font-mono">{request.transactionId}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-gray-600">Request Date</Label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <p className="text-sm">{request.requestDate}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm text-gray-600">Status</Label>
                    <div className="mt-1">
                      <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
                    </div>
                  </div>
                </div>

                {request.notes && (
                  <div className="mt-4">
                    <Label className="text-sm text-gray-600">Notes</Label>
                    <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded-md">{request.notes}</p>
                  </div>
                )}

                {request.attachments.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm text-gray-600">Attachments</Label>
                    <div className="mt-1 space-y-1">
                      {request.attachments.map((attachment, index) => (
                        <p key={index} className="text-sm text-blue-600 hover:underline cursor-pointer">
                          {attachment}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rejection Reason (only for reject action) */}
          {!isApprove && (
            <div>
              <Label htmlFor="rejectionReason" className="text-sm font-medium text-gray-700">
                Rejection Reason *
              </Label>
              <textarea
                id="rejectionReason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full mt-1 p-3 border border-gray-300 rounded-md resize-none"
                rows={3}
                placeholder="Please provide a clear reason for rejecting this request..."
                required
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading}
              className={`${isApprove ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}`}
            >
              <ActionIcon className="h-4 w-4 mr-1" />
              {loading ? `${isApprove ? "Approving" : "Rejecting"}...` : `${isApprove ? "Approve" : "Reject"} Request`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
