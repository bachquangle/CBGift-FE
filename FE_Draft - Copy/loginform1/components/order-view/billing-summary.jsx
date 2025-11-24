"use client";

export default function BillingSummary({ billing }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing</h3>
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Production costs:</span>
          <span className="font-medium text-gray-900">
            {billing.productionCosts}
          </span>
        </div>
        {/* <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping (standard):</span>
          <span className="font-medium text-gray-900">
            {billing.shippingStandard}
          </span>
        </div> */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping cost:</span>
          <span className="font-medium text-gray-900">
            {billing.shippingCost}
          </span>
        </div>
        {/* <div className="flex justify-between text-sm">
          <span className="text-gray-600">Surcharge fee:</span>
          <span className="font-medium text-gray-900">
            {billing.surchargeFee}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Tax cost:</span>
          <span className="font-medium text-gray-900">{billing.taxCost}</span>
        </div> */}
        <div className="flex justify-between text-base border-t border-gray-200 pt-3 mt-3">
          <span className="font-semibold text-gray-900">Total costs:</span>
          <span className="font-bold text-gray-900">{billing.totalCosts}</span>
        </div>
      </div>
    </div>
  );
}
