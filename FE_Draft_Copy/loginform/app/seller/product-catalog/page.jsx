"use client";

import { useState, useEffect } from "react";
import SellerSidebar from "@/components/layout/seller/sidebar";
import SellerHeader from "@/components/layout/seller/header";
import ProductDetailsModal from "@/components/modals/seller-product-details-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import apiClient from "../../../lib/apiClient";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Search, Filter } from "lucide-react";

export default function SellerProductCatalog() {
  const [currentPage] = useState("product-catalog");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // DATA
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [totalProductsCount, setTotalProductsCount] = useState(0);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ======================================================
  // LOAD CATEGORIES
  // ======================================================
  async function fetchCategories() {
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Categories/public`
      );

      if (!res.ok) throw new Error("Failed to load categories");

      const data = await res.json();

      const names = data.map((c) => c.categoryName);

      setCategories(names);
    } catch (err) {
      console.error(err);
    }
  }

  // ======================================================
  // LOAD PRODUCTS
  // ======================================================
  async function fetchProducts() {
    try {
      setLoading(true);
      setError(null);

      const category = categoryFilter === "all" ? "" : categoryFilter;

      const url = `${apiClient.defaults.baseURL}/api/Product/filter?searchTerm=${searchTerm}&category=${category}&status=&page=${page}&pageSize=${itemsPerPage}`;

      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();

      setTotalProductsCount(data.total);

      const mapped = data.products.map((p) => ({
        id: p.productId,
        productName: p.productName,
        description: p.describe,
        category: p.categoryName,
        image: p.itemLink,
        basePrice: "$" + (p.basePrice ?? "0"),
      }));

      setProducts(mapped);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [page, itemsPerPage, searchTerm, categoryFilter]);

  // ======================================================
  // VIEW DETAILS
  // ======================================================
  const handleViewDetails = async (product) => {
    try {
      const res = await fetch(
        `${apiClient.defaults.baseURL}/api/Product/${product.id}`
      );
      const data = await res.json();

      setSelectedProduct(data); // GIỮ NGUYÊN API GỐC
      setShowDetailsModal(true);
    } catch (err) {
      console.error("Failed to load details", err);
    }
  };

  const totalPages = Math.ceil(totalProductsCount / itemsPerPage);

  return (
    <>
      <div className="flex h-screen bg-gray-50">
        {/* <SellerSidebar currentPage={currentPage} /> */}

        <div className="flex-1 flex flex-col overflow-hidden">

          <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-900">
              Product Catalog
            </h1>
            <p className="text-gray-600 mt-1">
              Browse and manage available products
            </p>
          </header>

          <main className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Search + filter */}
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="flex flex-col md:flex-row gap-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search product..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setPage(1);
                        }}
                        className="pl-10"
                      />
                    </div>

                    <Select
                      value={categoryFilter}
                      onValueChange={(value) => {
                        setCategoryFilter(value);
                        setPage(1);
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <Filter className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Filter by category" />
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
                  </div>
                </div>
              </div>

              {/* Products grid */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Products ({totalProductsCount})
                  </h2>
                </div>

                {error && (
                  <div className="p-4 bg-red-50 text-red-700 border-b border-red-200">
                    Error loading products: {error}
                  </div>
                )}

                {loading ? (
                  <div className="p-12 text-center text-gray-500">
                    <p>Loading products...</p>
                  </div>
                ) : products.length === 0 ? (
                  <div className="p-12 text-center text-gray-500">
                    <p>No products found</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
                      {products.map((product) => (
                        <div
                          key={product.id}
                          className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        >
                          <div className="aspect-square bg-gray-100 overflow-hidden">
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.productName}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">
                              {product.productName}
                            </h3>

                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {product.description}
                            </p>

                            <div className="mt-3 flex items-center justify-between">
                              {/* <div>
                              <p className="text-lg font-bold text-gray-900">
                                {product.basePrice}
                              </p>
                              <p className="text-xs text-gray-500">From - To</p>
                            </div> */}
                              <Badge variant="outline" className="text-xs">
                                {product.category}
                              </Badge>
                            </div>

                            <div className="mt-4 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={() => handleViewDetails(product)}
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    <div className="bg-indigo-50 px-4 py-3 border-t border-gray-200 sm:px-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        {/* per page */}
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">Show</span>

                          <Select
                            value={itemsPerPage.toString()}
                            onValueChange={(val) => {
                              setItemsPerPage(Number(val));
                              setPage(1);
                            }}
                          >
                            <SelectTrigger className="w-[70px] bg-white border-indigo-200 hover:bg-indigo-50">
                              <SelectValue placeholder={itemsPerPage} />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="6">6</SelectItem>
                              <SelectItem value="12">12</SelectItem>
                              <SelectItem value="18">18</SelectItem>
                              <SelectItem value="24">24</SelectItem>
                            </SelectContent>
                          </Select>

                          <span className="text-sm text-slate-600">
                            per page
                          </span>
                        </div>

                        <div className="text-sm text-slate-600">
                          Showing{" "}
                          {products.length > 0
                            ? (page - 1) * itemsPerPage + 1
                            : 0}{" "}
                          to {Math.min(page * itemsPerPage, totalProductsCount)}{" "}
                          of {totalProductsCount} results
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 1 || loading}
                            onClick={() => setPage(page - 1)}
                          >
                            Previous
                          </Button>

                          <span className="text-sm text-slate-600 min-w-[60px] text-center">
                            {page} / {totalPages || 1}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            disabled={page === totalPages || loading}
                            onClick={() => setPage(page + 1)}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </main>
        </div>

        <ProductDetailsModal
          product={selectedProduct}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedProduct(null);
          }}
        />
      </div>
    </>
  );
}
