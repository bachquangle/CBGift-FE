"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { DollarSign, Download, ChevronLeft, ChevronRight } from "lucide-react";
import React from "react";

export default function InvoiceTable({
  invoices,
  isLoading,
  page,
  itemsPerPage,
  totalInvoices,
  onPageChange,
  onPaymentClick,
  onDownloadClick,
}) {
  const totalPages = Math.ceil(totalInvoices / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const paginatedInvoices = invoices.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      Paid: "bg-green-100 text-green-800 border border-green-200",
      Partial: "bg-amber-100 text-amber-800 border border-amber-200",
      Unpaid: "bg-red-100 text-red-800 border border-red-200",
    };
    return (
      <Badge
        className={
          statusConfig[status] ||
          "bg-gray-100 text-gray-800 border border-gray-200"
        }
      >
        {status}
      </Badge>
    );
  };

  return (
    <div className="bg-blue-50 rounded-lg shadow-sm border border-blue-100 overflow-hidden">
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-slate-600">Loading invoices...</p>
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-blue-100 hover:bg-blue-100">
                <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                  Invoice ID
                </TableHead>
                <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                  Seller
                </TableHead>
                <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                  Order Code
                </TableHead>
                <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap text-right">
                  Total Amount
                </TableHead>
                <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap text-right">
                  Paid
                </TableHead>
                <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap text-right">
                  Remaining
                </TableHead>
                <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                  Status
                </TableHead>
                <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                  Due Date
                </TableHead>
                <TableHead className="font-medium text-slate-700 uppercase text-xs tracking-wide whitespace-nowrap">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedInvoices.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={9}
                    className="text-center py-8 text-gray-500"
                  >
                    No invoices found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedInvoices.map((invoice) => {
                  const remaining = invoice.totalAmount - invoice.paidAmount;
                  return (
                    <TableRow
                      key={invoice.id}
                      className="hover:bg-blue-50 transition-colors border-b border-blue-100"
                    >
                      <TableCell className="font-semibold text-gray-900">
                        {invoice.id}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900 text-sm">
                          {invoice.sellerName}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {invoice.orderCode}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-gray-900">
                        {invoice.totalAmount.toLocaleString("vi-VN")} VNĐ
                      </TableCell>
                      <TableCell className="text-right text-green-600 font-semibold">
                        {invoice.paidAmount.toLocaleString("vi-VN")} VNĐ
                      </TableCell>
                      <TableCell className="text-right text-orange-600 font-semibold text-sm">
                        {remaining.toLocaleString("vi-VN")} VNĐ
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(invoice.paymentStatus)}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">
                        {new Date(invoice.dueDate).toLocaleDateString("vi-VN")}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white hover:bg-blue-50 border-blue-200 text-blue-600"
                            onClick={() => onPaymentClick(invoice)}
                            title="Record Payment"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-white hover:bg-blue-50 border-blue-200 text-blue-600"
                            onClick={() => onDownloadClick(invoice)}
                            title="Download PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Pagination Footer */}
      {!isLoading && (
        <div className="bg-blue-100 px-4 py-3 border-t border-blue-200 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Items Per Page Selector */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">Items per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  const parentSelect = document.querySelector(
                    "select[value='" + itemsPerPage + "']"
                  );
                  if (parentSelect) parentSelect.value = e.target.value;
                }}
                className="px-3 py-1 text-sm bg-white border border-blue-200 rounded hover:bg-blue-50 cursor-pointer"
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
                <option value="50">50</option>
                <option value="100">100</option>
              </select>
            </div>

            <div className="text-sm text-slate-600">
              Showing {paginatedInvoices.length > 0 ? startIndex + 1 : 0} to{" "}
              {Math.min(startIndex + itemsPerPage, totalInvoices)} of{" "}
              {totalInvoices} invoices
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 1}
                onClick={() => onPageChange(page - 1)}
                className="disabled:opacity-50 border-blue-200 hover:bg-blue-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (pageNum) =>
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= page - 2 && pageNum <= page + 2)
                )
                .map((pageNum, index, arr) => (
                  <React.Fragment key={pageNum}>
                    {/* Show ellipsis if there's a gap */}
                    {index > 0 && pageNum > arr[index - 1] + 1 && (
                      <span className="text-slate-600 mx-1">...</span>
                    )}

                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => onPageChange(pageNum)}
                      className={`w-8 h-8 p-0 ${
                        page === pageNum
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "border-blue-200 hover:bg-blue-50"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  </React.Fragment>
                ))}

              <Button
                variant="outline"
                size="sm"
                disabled={page === totalPages}
                onClick={() => onPageChange(page + 1)}
                className="disabled:opacity-50 border-blue-200 hover:bg-blue-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
