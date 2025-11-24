"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import SellerInfoTab from "./seller-info-tab";
import SellerOrdersTab from "./seller-orders-tab";
import SellerTransactionTab from "./seller-transaction-tab";

export default function SellerDetailModal({ seller, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("info");

  if (!isOpen) return null;

  const tabs = [
    { id: "info", label: "Information", icon: "📋" },
    { id: "orders", label: "Sales History", icon: "📦" },
    { id: "transactions", label: "Payment History", icon: "💰" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-4xl max-h-[90vh] bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 bg-gradient-to-r from-blue-500 to-blue-600">
          <div>
            <h2 className="text-2xl font-bold text-white">{seller.name}</h2>
            <p className="text-blue-100 text-sm mt-1">ID: {seller.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-blue-400 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center px-6 py-4 font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-green-600 text-white border-b-2 border-green-600"
                  : "text-gray-700 hover:text-gray-900"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "info" && <SellerInfoTab seller={seller} />}
          {activeTab === "orders" && <SellerOrdersTab seller={seller} />}
          {activeTab === "transactions" && (
            <SellerTransactionTab seller={seller} />
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 bg-gray-50 p-6">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
