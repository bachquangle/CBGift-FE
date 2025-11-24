"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Check, X, DollarSign, Calendar, User } from "lucide-react";
import RoleSidebar from "@/components/layout/shared/role-sidebar";
import TopUpConfirmationModal from "@/components/modals/topup-confirmation-modal";
import ManagerSidebar from "@/components/layout/manager/sidebar";
import ManagerHeader from "@/components/layout/manager/header";

export default function ManageTopUpPage() {
  const [currentPage, setCurrentPage] = useState("manage-topup");
  const [topUpRequests, setTopUpRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    const mockRequests = [
      {
        id: 1,
        seller: { id: 1, name: "John Seller", email: "john@seller.com" },
        amount: 500.0,
        currency: "USD",
        status: "pending",
        requestDate: "2024-01-25",
        paymentMethod: "Bank Transfer",
        attachments: ["receipt_001.pdf"],
      },
      {
        id: 2,
        seller: { id: 2, name: "Mike Seller", email: "mike@seller.com" },
        amount: 750.0,
        currency: "USD",
        status: "pending",
        requestDate: "2024-01-24",
        paymentMethod: "Credit Card",
        attachments: ["receipt_002.pdf", "invoice_002.pdf"],
      },
      {
        id: 3,
        seller: { id: 3, name: "Sarah Seller", email: "sarah@seller.com" },
        amount: 300.0,
        currency: "USD",
        status: "approved",
        requestDate: "2024-01-23",
        approvedDate: "2024-01-24",
        paymentMethod: "PayPal",
        attachments: ["receipt_003.pdf"],
      },
      {
        id: 4,
        seller: { id: 4, name: "Tom Seller", email: "tom@seller.com" },
        amount: 200.0,
        currency: "USD",
        status: "rejected",
        requestDate: "2024-01-22",
        rejectedDate: "2024-01-23",
        paymentMethod: "Bank Transfer",
        rejectionReason: "Insufficient documentation provided",
        attachments: [],
      },
    ];

    setTimeout(() => {
      setTopUpRequests(mockRequests);
      setFilteredRequests(mockRequests);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter requests based on search and status
  useEffect(() => {
    let filtered = topUpRequests;

    if (searchTerm) {
      filtered = filtered.filter(
        (req) =>
          req.seller.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          req.seller.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((req) => req.status === statusFilter);
    }

    setFilteredRequests(filtered);
  }, [searchTerm, statusFilter, topUpRequests]);

  const handleAction = (request, action) => {
    setSelectedRequest(request);
    setConfirmAction(action);
    setShowConfirmModal(true);
  };

  const handleConfirmAction = (updatedRequest) => {
    const updatedRequests = topUpRequests.map((req) =>
      req.id === updatedRequest.id ? updatedRequest : req
    );
    setTopUpRequests(updatedRequests);
    setFilteredRequests(updatedRequests);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <ManagerSidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading top-up requests...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ManagerHeader />
        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Manage Top Up Money
              </h1>
              <p className="text-gray-600 mt-1">
                Review and approve seller top-up requests
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Pending: </span>
                {
                  filteredRequests.filter((req) => req.status === "pending")
                    .length
                }
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by seller name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4">
            {filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <p className="text-gray-500">
                    No top-up requests found matching your criteria.
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card
                  key={request.id}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
                        {/* Seller Info */}
                        <div>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Seller
                          </p>
                          <p className="text-sm text-gray-600">
                            {request.seller.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.seller.email}
                          </p>
                        </div>

                        {/* Amount */}
                        <div>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            Amount
                          </p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(request.amount, request.currency)}
                          </p>
                          <p className="text-xs text-gray-500">
                            {request.paymentMethod}
                          </p>
                        </div>

                        {/* Status & Date */}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Status
                          </p>
                          {getStatusBadge(request.status)}
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {request.requestDate}
                          </p>
                        </div>

                        {/* Attachments */}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Attachments
                          </p>
                          <p className="text-sm text-gray-600">
                            {request.attachments.length} files
                          </p>
                          {request.rejectionReason && (
                            <p className="text-xs text-red-600 mt-1">
                              Rejected: {request.rejectionReason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {request.status === "pending" && (
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAction(request, "reject")}
                            className="flex items-center gap-1 text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleAction(request, "approve")}
                            className="flex items-center gap-1 bg-green-600 hover:bg-green-700"
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <TopUpConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        request={selectedRequest}
        action={confirmAction}
        onConfirm={handleConfirmAction}
      />
    </div>
  );
}
