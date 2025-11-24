"use client";

import React, { useState, useEffect } from "react";
import  apiClient from "../../../lib/apiClient";
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
import { Search, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import AddRelationshipModal from "@/components/modals/add-relationship-modal";
import ManagerSidebar from "@/components/layout/manager/sidebar";
import ManagerHeader from "@/components/layout/manager/header";
import { useToast } from "@/components/ui/use-toast"; // ✅ import toast hook
import { Toaster } from "@/components/ui/toaster";

export default function ManageRelationshipPage() {
  const { toast } = useToast(); // ✅ init toast

  const [currentPage, setCurrentPage] = useState("manage-relationship");
  const [relationships, setRelationships] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sellerFilter, setSellerFilter] = useState("all");
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // ✅ Delete popup state
  const [showDeletePopup, setShowDeletePopup] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // ✅ Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // ✅ Fetch relationships
  const fetchAssignments = async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: itemsPerPage.toString(),
        searchTerm: searchTerm,
      });

      if (sellerFilter !== "all") params.append("sellerId", sellerFilter);

      const url = `${apiClient.defaults.baseURL}/api/manager/assignments/all?${params.toString()}`;
      const response = await fetch(url, { credentials: "include" });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const json = await response.json();
      const data = json.items || json.data || json.assignments || [];
      const total = json.total || 0;

      setRelationships(data);
      setTotalCount(total);

      // Extract sellers for dropdown
      if (data && data.length > 0) {
        const uniqueSellers = [
          ...new Map(
            data.map((item) => [
              item.sellerId,
              { id: item.sellerId, name: item.sellerName },
            ])
          ).values(),
        ];
        setSellers(uniqueSellers);
      }
    } catch (err) {
      console.error("❌ Error fetching relationships:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [page, itemsPerPage, searchTerm, sellerFilter]);

  // ✅ Handle Delete
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/manager/assignments`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            sellerUserId: deleteTarget.sellerId,
            designerUserId: deleteTarget.designerId,
          }),
        }
      );

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Delete failed.");
      }

      // ✅ Success toast
      toast({
        title: "✅ Success",
        description: "Relationship deleted successfully!",
        className:
          "bg-green-50 text-green-700 border border-green-200 font-medium",
      });

      // Refresh data
      fetchAssignments();
      setShowDeletePopup(false);
    } catch (err) {
      console.error("❌ Delete failed:", err);
      toast({
        title: "Error",
        description: "Failed to delete. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ✅ Filters + Pagination
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleSellerFilterChange = (value) => {
    setSellerFilter(value);
    setPage(1);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setPage(1);
  };

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  if (loading && relationships.length === 0) {
    return (
      <div className="flex h-screen bg-gray-50">
        <ManagerSidebar
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading relationships...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar
        currentRole="manager"
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ManagerHeader />

        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Manage Relationships
              </h1>
              <p className="text-gray-600 mt-1">
                Manage seller-designer assignments and connections.
              </p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto p-6">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by seller or designer..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select
                value={sellerFilter}
                onValueChange={handleSellerFilterChange}
              >
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Filter by Seller" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sellers</SelectItem>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.id} value={seller.id}>
                      {seller.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Relationship
              </Button>
            </div>
          </div>

          {/* List */}
          <div className="grid gap-4">
            {relationships.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-gray-500">
                  No relationships found.
                </CardContent>
              </Card>
            ) : (
              relationships.map((relationship) => (
                <Card
                  key={`${relationship.sellerId}-${relationship.designerId}`}
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6 flex justify-between items-center">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Seller
                        </p>
                        <p className="text-sm text-gray-600">
                          {relationship.sellerName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {relationship.sellerId}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Designer
                        </p>
                        <p className="text-sm text-gray-600">
                          {relationship.designerName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {relationship.designerId}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Created
                        </p>
                        <p className="text-sm text-gray-600">
                          {relationship.createdAt
                            ? new Date(relationship.createdAt)
                                .toISOString()
                                .split("T")[0]
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDeleteTarget(relationship);
                        setShowDeletePopup(true);
                      }}
                      className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Pagination */}
          {relationships.length > 0 && (
            <div className="bg-blue-50 px-4 py-3 border border-blue-100 rounded-lg mt-6 sm:px-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600">
                    Items per page:
                  </span>
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={handleItemsPerPageChange}
                  >
                    <SelectTrigger className="w-[70px] bg-white border-blue-200 hover:bg-blue-50">
                      <SelectValue placeholder={itemsPerPage} />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20, 50].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-sm text-slate-600">
                  Showing {(page - 1) * itemsPerPage + 1}–
                  {Math.min(page * itemsPerPage, totalCount)} of {totalCount}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
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
                        {index > 0 && pageNum > arr[index - 1] + 1 && (
                          <span className="text-slate-600 mx-1">...</span>
                        )}
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      </React.Fragment>
                    ))}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add relationship modal */}
      <AddRelationshipModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={() => {
          fetchAssignments();
          toast({
            title: "✅ Success",
            description: "Relationship created successfully!",
            className:
              "bg-green-50 text-green-700 border border-green-200 font-medium",
          });
        }}
      />

      {/* Delete confirmation popup */}
      {showDeletePopup && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[400px] text-center">
            <h3 className="text-lg font-semibold mb-2 text-gray-800">
              Confirm Deletion
            </h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this relationship?
            </p>

            <div className="flex justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeletePopup(false)}
                disabled={deleteLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
