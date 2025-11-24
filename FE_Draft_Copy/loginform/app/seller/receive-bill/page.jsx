"use client";

import { useState, useEffect } from "react";
import SellerSidebar from "@/components/layout/seller/sidebar";
import SellerHeader from "@/components/layout/seller/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {apiClient} from "../../../lib/apiClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Eye,
  AlertTriangle,
  Package,
  CheckCircle,
  Download,
  CreditCard,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";

const API_BASE_URL = "${apiClient}";

export default function ReceiveBillPage() {
  const [currentPage, setCurrentPage] = useState("receive-bill");
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [showPaymentContent, setShowPaymentContent] = useState(false);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/api/invoices/my-invoices`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch invoices: ${response.statusText}`);
        }

        const data = await response.json();
        setInvoices(data);
      } catch (error) {
        console.error("Error fetching invoices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewDetails = async (invoice) => {
    try {
      setLoadingDetails(true);
      const response = await fetch(
        `${API_BASE_URL}/api/invoices/${invoice.invoiceId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch invoice details: ${response.statusText}`
        );
      }

      const detailedInvoice = await response.json();
      setSelectedInvoice(detailedInvoice);
      setIsDetailsOpen(true);

      if (detailedInvoice.paymentLink) {
        setShowPaymentContent(true);
      }
    } catch (error) {
      console.error("Error fetching invoice details:", error);
      alert("Failed to load invoice details. Please try again.");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleDownload = (invoice) => {
    alert(`Downloading invoice: ${invoice.invoiceNumber}`);
  };

  const handleGoToPayment = async (invoice) => {
    try {
      setIsCreatingPayment(true);

      const paymentRequest = {
        invoiceId: invoice.invoiceId,
        returnUrl: `${window.location.origin}/seller/receive-bill?success=true`,
        cancelUrl: `${window.location.origin}/seller/receive-bill?cancelled=true`,
      };

      const response = await fetch(
        `${API_BASE_URL}/api/invoices/create-payment-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(paymentRequest),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create payment link: ${response.statusText}`
        );
      }

      const data = await response.json();

      if (data.paymentUrl) {
        setSelectedInvoice((prev) => ({
          ...prev,
          paymentLink: data.paymentUrl,
        }));
        setShowPaymentContent(true);
      }
    } catch (error) {
      console.error("Error creating payment link:", error);
      alert("Failed to create payment link. Please try again.");
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const stats = [
    {
      title: "Total Invoices",
      value: invoices.length,
      color: "bg-blue-50 border-blue-200",
      icon: Package,
      iconColor: "text-blue-500",
    },
    {
      title: "Pending Payment",
      value: invoices.filter((inv) => inv.status === "Issued").length,
      color: "bg-yellow-50 border-yellow-200",
      icon: AlertTriangle,
      iconColor: "text-yellow-500",
    },
    {
      title: "Paid",
      value: invoices.filter((inv) => inv.status === "Paid").length,
      color: "bg-emerald-50 border-emerald-200",
      icon: CheckCircle,
      iconColor: "text-emerald-500",
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden">
      {/* <SellerSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      /> */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-blue-200 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold text-blue-800">
                    Receive Bill
                  </h1>
                  <p className="text-sm sm:text-base text-blue-600 mt-1">
                    View and manage your invoices
                  </p>
                </div>
                <div className="mt-3 sm:mt-0">
                  <div className="flex items-center gap-2 text-sm text-blue-700">
                    <Package className="h-4 w-4" />
                    <span>{filteredInvoices.length} invoices</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${stat.color} hover:shadow-lg transition-all`}
                  >
                    <div className="flex flex-col items-center text-center gap-2">
                      <IconComponent className={`h-5 w-5 ${stat.iconColor}`} />
                      <div>
                        <p className="text-lg font-bold text-gray-900">
                          {stat.value}
                        </p>
                        <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          {stat.title}
                        </h3>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Search */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 max-w-xs">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Invoices
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Invoice #, Notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              {loading ? (
                <div className="flex items-center justify-center p-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading invoices...</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                          Invoice #
                        </TableHead>
                        <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                          Period
                        </TableHead>
                        <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                          Amount
                        </TableHead>
                        <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                          Paid
                        </TableHead>
                        <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                          Status
                        </TableHead>
                        <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvoices.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={6}
                            className="text-center py-8 text-gray-500"
                          >
                            No invoices found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredInvoices.map((invoice) => (
                          <TableRow
                            key={invoice.invoiceId}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <TableCell className="font-medium text-gray-900">
                              {invoice.invoiceNumber}
                            </TableCell>
                            <TableCell className="text-gray-600 text-sm">
                              {format(
                                new Date(invoice.invoicePeriodStart),
                                "MMM dd"
                              )}{" "}
                              -{" "}
                              {format(
                                new Date(invoice.invoicePeriodEnd),
                                "MMM dd, yyyy"
                              )}
                            </TableCell>
                            <TableCell className="text-gray-900 font-medium">
                              ${invoice.totalAmount.toFixed(2)}
                            </TableCell>
                            <TableCell className="text-gray-600">
                              ${invoice.amountPaid.toFixed(2)}
                            </TableCell>
                            <TableCell>
                              <span
                                className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full ${
                                  invoice.status === "Paid"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {invoice.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleViewDetails(invoice)}
                                  disabled={loadingDetails}
                                  className="bg-transparent hover:bg-gray-50"
                                  title="View Details"
                                >
                                  {loadingDetails ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleDownload(invoice)}
                                  className="bg-transparent hover:bg-blue-50 text-blue-600"
                                  title="Download"
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* View Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showPaymentContent && (
                <button
                  onClick={() => setShowPaymentContent(false)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Back to details"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              )}
              <Package className="h-5 w-5" />
              {showPaymentContent
                ? "Payment"
                : `Invoice Details - ${selectedInvoice?.invoiceNumber}`}
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-6">
              {showPaymentContent && selectedInvoice.paymentLink ? (
                <div className="w-full">
                  <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
                    <p className="text-sm text-gray-600">
                      Complete your payment using the QR code or bank transfer
                      details below.
                    </p>
                  </div>
                  <iframe
                    src={selectedInvoice.paymentLink}
                    title="Payment Gateway"
                    className="w-full border border-gray-200 rounded-lg"
                    style={{ height: "600px" }}
                    allow="payment"
                  />
                </div>
              ) : (
                <>
                  {/* Invoice Header */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900">
                      Invoice Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-500 font-medium">
                          Invoice Number
                        </label>
                        <p className="font-medium text-gray-900 mt-1">
                          {selectedInvoice.invoiceNumber}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 font-medium">
                          Status
                        </label>
                        <p
                          className={`font-medium mt-1 ${
                            selectedInvoice.status === "Paid"
                              ? "text-green-600"
                              : "text-yellow-600"
                          }`}
                        >
                          {selectedInvoice.status}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 font-medium">
                          Invoice Period
                        </label>
                        <p className="font-medium text-gray-900 mt-1">
                          {format(
                            new Date(selectedInvoice.invoicePeriodStart),
                            "MMM dd, yyyy"
                          )}{" "}
                          -{" "}
                          {format(
                            new Date(selectedInvoice.invoicePeriodEnd),
                            "MMM dd, yyyy"
                          )}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 font-medium">
                          Due Date
                        </label>
                        <p className="font-medium text-gray-900 mt-1">
                          {format(
                            new Date(selectedInvoice.dueDate),
                            "MMM dd, yyyy"
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Amount Information */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-lg mb-3 text-gray-900">
                      Amount Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-sm text-gray-500 font-medium">
                          Subtotal
                        </label>
                        <p className="font-medium text-gray-900 mt-1">
                          ${selectedInvoice.subtotal.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 font-medium">
                          Total Amount
                        </label>
                        <p className="font-bold text-blue-600 text-lg mt-1">
                          ${selectedInvoice.totalAmount.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm text-gray-500 font-medium">
                          Amount Paid
                        </label>
                        <p className="font-medium text-green-600 mt-1">
                          ${selectedInvoice.amountPaid.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedInvoice.notes && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 text-gray-900">
                        Notes
                      </h3>
                      <p className="text-gray-700">{selectedInvoice.notes}</p>
                    </div>
                  )}

                  {selectedInvoice.paymentLink && (
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                      <h3 className="font-semibold text-lg mb-3 text-gray-900">
                        Payment
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Payment link is ready. Click below to view payment
                        details and QR code.
                      </p>
                      <Button
                        onClick={() => setShowPaymentContent(true)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        View Payment
                      </Button>
                    </div>
                  )}

                  {selectedInvoice.status !== "Paid" &&
                    !selectedInvoice.paymentLink && (
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg mb-3 text-gray-900">
                          Payment
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Click the button below to proceed with payment for
                          this invoice.
                        </p>
                        <Button
                          onClick={() => handleGoToPayment(selectedInvoice)}
                          disabled={isCreatingPayment}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isCreatingPayment ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Creating Payment Link...
                            </>
                          ) : (
                            <>
                              <CreditCard className="h-4 w-4 mr-2" />
                              Go to Payment
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                </>
              )}
            </div>
          )}
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
              Close
            </Button>
            {!showPaymentContent && (
              <Button
                onClick={() => handleDownload(selectedInvoice)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
