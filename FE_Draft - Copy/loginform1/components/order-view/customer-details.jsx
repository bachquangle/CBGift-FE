"use client";

export default function CustomerDetails({ customer }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Customer details
      </h3>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">First name</p>
          <p className="text-sm font-medium text-gray-900">
            {customer.firstName}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">Last name</p>
          <p className="text-sm font-medium text-gray-900">
            {customer.lastName}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">Email</p>
          <p className="text-sm font-medium text-gray-900">{customer.email}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 font-medium mb-1">Mobile</p>
          <p className="text-sm font-medium text-gray-900">
            {customer.mobile || "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
}
