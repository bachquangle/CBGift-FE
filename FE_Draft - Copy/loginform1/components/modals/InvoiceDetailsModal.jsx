"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  User,
  Calendar,
  DollarSign,
  Image as ImageIcon,
} from "lucide-react";

export default function InvoiceDetailsModal({ isOpen, onClose, invoice }) {
  if (!invoice) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Invoice Details - {invoice.invoiceNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 p-1 pr-4">
          {/* Thông tin tổng quan */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50 p-4 rounded-lg border">
            <div>
              <Label className="text-gray-500 font-medium flex items-center gap-1">
                <User size={14} /> Seller
              </Label>
              <p className="font-semibold text-gray-900 mt-1">
                {invoice.sellerUser?.fullName || "N/A"}
              </p>
            </div>
            <div>
              <Label className="text-gray-500 font-medium flex items-center gap-1">
                <Calendar size={14} /> Created Date
              </Label>
              <p className="font-semibold text-gray-900 mt-1">
                {new Date(invoice.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <Label className="text-gray-500 font-medium">Status</Label>
              <div className="mt-1">
                <Badge
                  className={
                    invoice.status === "Paid"
                      ? "bg-green-100 text-green-800"
                      : invoice.status === "Issued"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }
                >
                  {invoice.status}
                </Badge>
              </div>
            </div>
            <div>
              <Label className="text-gray-500 font-medium flex items-center gap-1">
                <DollarSign size={14} /> Total Amount
              </Label>
              <p className="font-bold text-lg text-blue-600 mt-1">
                ${invoice.totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Bảng danh sách Order */}
          <div>
            <h3 className="font-semibold text-lg mb-2 text-gray-800">
              Orders Included ({invoice.items?.length || 0})
            </h3>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader className="bg-gray-50">
                  <TableRow>
                    <TableHead>Order Code</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Image</TableHead>
                    <TableHead>Design File</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {invoice.items?.map((item) => {
                    const firstDetail = item.order?.orderDetails?.[0];
                    const imageUrl =
                      firstDetail?.productVariant?.product?.itemLink;
                    const designImageUrl = firstDetail?.linkFileDesign;

                    return (
                      <React.Fragment key={item.invoiceItemId}>
                        <TableRow>
                          <TableCell className="font-medium">
                            {item.order.orderCode}
                          </TableCell>

                          <TableCell>
                            {new Date(
                              item.order.orderDate
                            ).toLocaleDateString()}
                          </TableCell>

                          <TableCell>
                            {imageUrl ? (
                              <a
                                href={imageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Image for ${item.order.orderCode}`}
                                  className="w-16 h-16 object-cover rounded-md border bg-gray-100 hover:opacity-80 transition-opacity"
                                />
                              </a>
                            ) : (
                              <div className="w-16 h-16 rounded-md border bg-gray-100 flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            {designImageUrl ? (
                              <a
                                href={designImageUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <img
                                  src={designImageUrl}
                                  alt={`Design for ${item.order.orderCode}`}
                                  className="w-16 h-16 object-cover rounded-md border bg-gray-100 hover:opacity-80 transition-opacity"
                                />
                              </a>
                            ) : (
                              <div className="w-16 h-16 rounded-md border bg-gray-100 flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </TableCell>

                          <TableCell>
                            <Badge variant="outline">
                              {item.order.statusOrderNavigation?.nameVi ||
                                `Status ID: ${item.order.statusOrder}`}
                            </Badge>
                          </TableCell>

                          <TableCell className="text-right font-medium">
                            ${item.amount.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
