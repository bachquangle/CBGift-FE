"use client";

import { Package, AlertCircle, Clock, CheckCircle } from "lucide-react";

export default function InvoiceStats({ invoices }) {
  const totalAmount = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidTotal = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const unpaidCount = invoices.filter(
    (inv) => inv.paymentStatus === "Unpaid"
  ).length;
  const partialCount = invoices.filter(
    (inv) => inv.paymentStatus === "Partial"
  ).length;
  const paidCount = invoices.filter(
    (inv) => inv.paymentStatus === "Paid"
  ).length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <div className="bg-white shadow p-4 rounded-lg text-center border border-gray-100">
        <h3 className="text-gray-500 text-sm font-medium">Total</h3>
        <p className="text-2xl font-bold text-gray-900 mt-2">
          {invoices.length}
        </p>
      </div>

      <div className="bg-red-50 shadow p-4 rounded-lg text-center border border-red-100">
        <div className="flex items-center justify-center gap-2 mb-1">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <h3 className="text-red-700 text-sm font-medium">Unpaid</h3>
        </div>
        <p className="text-2xl font-bold text-red-600">{unpaidCount}</p>
      </div>

      <div className="bg-amber-50 shadow p-4 rounded-lg text-center border border-amber-100">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Clock className="h-4 w-4 text-amber-600" />
          <h3 className="text-amber-700 text-sm font-medium">Partial</h3>
        </div>
        <p className="text-2xl font-bold text-amber-600">{partialCount}</p>
      </div>

      <div className="bg-green-50 shadow p-4 rounded-lg text-center border border-green-100">
        <div className="flex items-center justify-center gap-2 mb-1">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <h3 className="text-green-700 text-sm font-medium">Paid</h3>
        </div>
        <p className="text-2xl font-bold text-green-600">{paidCount}</p>
      </div>

      <div className="bg-blue-50 shadow p-4 rounded-lg text-center border border-blue-100">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Package className="h-4 w-4 text-blue-600" />
          <h3 className="text-blue-700 text-sm font-medium">Collected</h3>
        </div>
        <p className="text-lg font-bold text-blue-600">
          {(paidTotal / 1000000).toFixed(1)}M
        </p>
      </div>
    </div>
  );
}
