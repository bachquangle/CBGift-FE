"use client";

import { useState, useEffect } from "react";
import ManagerSidebar from "@/components/layout/manager/sidebar";
import ManagerHeader from "@/components/layout/manager/header";
import AddProductModal from "@/components/modals/add-product-modal";
import ProductDetailsModal from "@/components/modals/product-details-modal";
import ManageCategoryModal from "@/components/modals/manage-category-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import apiClient from "../../../lib/apiClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Eye,
  Plus,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Trash2,
  RotateCcw,
} from "lucide-react";

import { useToast } from "@/hooks/use-toast";

export default function ManageCatalog() {
  const { toast } = useToast();

  const [currentPage, setCurrentPage] = useState("manage-catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [products, setProducts] = useState([]);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // -------------------------
  // LẤY CATEGORY
  // -------------------------
  async function fetchCategories() {
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Categories/public`
      );

      if (!res.ok) throw new Error("Failed to fetch categories");

      const data = await res.json();
      const names = data.map((c) => c.categoryName);
      setCategories(names);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  // -------------------------
  // LẤY PRODUCT LIST
  // -------------------------
  async function fetchProducts() {
    try {
      setLoading(true);
      setError(null);

      const status =
        statusFilter === "all" ? "" : statusFilter === "Active" ? 1 : 0;

      const category = categoryFilter === "all" ? "" : categoryFilter;

      const url = `${apiClient.defaults.baseURL}/api/Product/filter?searchTerm=${searchTerm}&category=${category}&status=${status}&page=${page}&pageSize=${itemsPerPage}`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch product list");

      const data = await res.json();

      setTotalProductsCount(data.total);

      const mapped = data.products.map((p) => ({
        id: p.productId,
        productName: p.productName,
        description: p.describe ?? "",
        category: p.categoryName ?? "Unknown",
        image: p.itemLink ?? "",
        status: p.status === 1 ? "Active" : "Inactive",
        variants: p.variants,
      }));

      setProducts(mapped);
      setSelectedProducts([]);
      setSelectAll(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, [page, itemsPerPage, searchTerm, statusFilter, categoryFilter]);

  // -------------------------
  // FILTER EVENTS — FIXED
  // -------------------------
  const handleSearchChange = (v) => {
    setSearchTerm(v);
    setPage(1);
  };

  const handleStatusFilterChange = (value) => {
    setStatusFilter(value);
    setPage(1);
  };

  const handleItemsPerPageChange = (v) => {
    setItemsPerPage(Number(v));
    setPage(1);
  };

  // -------------------------
  // VIEW DETAILS
  // -------------------------
  const handleViewDetails = async (product) => {
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Product/${product.id}`
      );
      const data = await res.json();

      const mapped = {
        productId: data.productId,
        productName: data.productName,
        categoryId: data.categoryId,
        categoryName: data.categoryName,
        describe: data.describe,
        itemLink: data.itemLink,
        status: data.status,
        variants: data.variants,
      };

      setSelectedProduct(mapped);
      setShowDetailsModal(true);
    } catch (e) {
      console.error("Failed to load product details", e);
    }
  };

  // -----------------------------
  // DELETE (SOFT DELETE)
  // -----------------------------
  const handleSoftDelete = async (id) => {
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Product/hidden/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!res.ok) throw new Error("Failed to hide product");

      toast({ title: "Success", description: "Product hidden!" });

      fetchProducts();
    } catch (err) {
      toast({
        title: "Delete failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  // -----------------------------
  // RESTORE PRODUCT
  // -----------------------------
  const handleRestore = async (id) => {
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Product/restore/${id}`,
        {
          method: "PATCH",
        }
      );

      if (!res.ok) throw new Error("Failed to restore product");

      toast({ title: "Success", description: "Product restored!" });

      fetchProducts();
    } catch (err) {
      toast({
        title: "Restore failed",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const totalPages = Math.ceil(totalProductsCount / itemsPerPage);

  // BADGE
  const getStatusBadge = (status) =>
    status === "Active" ? (
      <Badge className="bg-green-500">Active</Badge>
    ) : (
      <Badge className="bg-gray-500">Inactive</Badge>
    );

  return (
    <div className="flex h-screen bg-gray-50">
      <ManagerSidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <ManagerHeader />

        <header className="bg-white shadow-sm border-b px-6 py-4">
          <h1 className="text-2xl font-semibold">Manage Catalog</h1>
          <p className="text-gray-600 mt-1">Manage products and categories</p>
        </header>

        {/* MAIN */}
        <main className="p-6 overflow-y-auto">
          <div className="space-y-6">
            {/* SEARCH & FILTER */}
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex flex-col md:flex-row gap-4 justify-between">
                <div className="flex gap-4 flex-1">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search products..."
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select
                    value={statusFilter}
                    onValueChange={handleStatusFilterChange}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  {/* CATEGORY FILTER */}
                  <Select
                    value={categoryFilter}
                    onValueChange={(value) => {
                      setCategoryFilter(value);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>

                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded shadow">
              <div className="px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">
                  Products ({totalProductsCount})
                </h2>
              </div>

              <div className="overflow-x-auto">
                {error && (
                  <div className="p-4 bg-red-50 border-b border-red-200 text-red-700">
                    Error: {error}
                  </div>
                )}

                <Table>
                  <TableHeader>
                    <TableRow className="bg-blue-100">
                      <TableHead></TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Image</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan="8" className="text-center py-6">
                          Loading...
                        </TableCell>
                      </TableRow>
                    ) : products.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan="8" className="text-center py-6">
                          No products found
                        </TableCell>
                      </TableRow>
                    ) : (
                      products.map((p) => (
                        <TableRow key={p.id} className="hover:bg-blue-50">
                          <TableCell></TableCell>

                          <TableCell>{p.id}</TableCell>
                          <TableCell>{p.productName}</TableCell>
                          <TableCell>{p.description}</TableCell>
                          <TableCell>
                            <img
                              src={p.image || "/placeholder.svg"}
                              className="h-10 w-10 object-cover rounded"
                            />
                          </TableCell>
                          <TableCell>{p.category}</TableCell>
                          <TableCell>{getStatusBadge(p.status)}</TableCell>

                          <TableCell className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewDetails(p)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                            </Button>

                            {p.status === "Active" ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleSoftDelete(p.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="bg-green-600"
                                onClick={() => handleRestore(p.id)}
                              >
                                <RotateCcw className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* PAGINATION */}
              <div className="bg-blue-50 p-4 flex justify-between">
                <div>
                  Items per page:
                  <Select
                    value={itemsPerPage.toString()}
                    onValueChange={handleItemsPerPageChange}
                  >
                    <SelectTrigger className="w-20 ml-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  Page {page} of {totalPages}
                </div>

                <div className="flex gap-2">
                  <Button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    <ChevronLeft />
                  </Button>

                  <Button
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    <ChevronRight />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* MODALS */}
      <AddProductModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        categories={categories}
        onAddProduct={() => fetchProducts()}
      />

      <ProductDetailsModal
        product={selectedProduct}
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        categories={categories}
        onUpdated={() => fetchProducts()}
      />

      <ManageCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categories}
      />
    </div>
  );
}
