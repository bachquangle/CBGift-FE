"use client";

export default function ShippingAddress({ address }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Shipping address
      </h3>
      <div className="space-y-2">
        <p className="text-sm text-gray-900">{address.street}</p>
        <p className="text-sm text-gray-900">
          {address.city}, {address.state}
        </p>
        <p className="text-sm text-gray-900">{address.country}</p>
        <p className="text-sm text-gray-900">Zip code: {address.zipCode}</p>
      </div>
    </div>
  );
}
