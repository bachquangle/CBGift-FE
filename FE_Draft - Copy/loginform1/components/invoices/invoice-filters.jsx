"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function InvoiceFilters({
  selectedMonth,
  onMonthChange,
  selectedSeller,
  onSellerChange,
  sellers,
  searchTerm,
  onSearchChange,
  itemsPerPage,
  onItemsPerPageChange,
}) {
  return (
    <div className="bg-blue-50 p-4 sm:p-6 rounded-lg shadow-sm border border-blue-100">
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full">
          {/* Month Filter */}
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Month
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="w-full px-3 py-2 border border-blue-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-blue-300 transition-colors"
            />
          </div>

          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Select Seller
            </label>
            <select
              value={selectedSeller}
              onChange={(e) => onSellerChange(e.target.value)}
              className="w-full px-3 py-2 border border-blue-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-blue-300 transition-colors"
            >
              <option value="all">All Sellers</option>
              {sellers.map((seller) => (
                <option key={seller.id} value={seller.id}>
                  {seller.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-xs">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Search Invoices
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Invoice ID, Order, Seller..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 bg-white border-blue-100 focus:border-blue-300"
              />
            </div>
          </div>
        </div>

        {/* Items Per Page */}
        <div className="w-full lg:w-auto">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Show per page
          </label>
          <select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            className="w-full lg:w-[120px] px-3 py-2 border border-blue-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white hover:border-blue-300 transition-colors"
          >
            <option value="5">5 items</option>
            <option value="10">10 items</option>
            <option value="20">20 items</option>
            <option value="50">50 items</option>
            <option value="100">100 items</option>
          </select>
        </div>
      </div>
    </div>
  );
}
