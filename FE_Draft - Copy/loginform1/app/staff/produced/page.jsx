"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import StaffSidebar from "@/components/layout/staff/sidebar";
import StaffHeader from "@/components/layout/staff/header";

const FilterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mr-2 text-gray-500"
  >
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
  </svg>
);

const DownloadIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const CardIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12Z" />
    <path d="M6 12h12" />
  </svg>
);

const LabelIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const QrCodeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="3" width="7" height="7"></rect>
    <rect x="14" y="3" width="7" height="7"></rect>
    <rect x="3" y="14" width="7" height="7"></rect>
    <line x1="11" y1="19" x2="17" y2="19"></line>
    <line x1="19" y1="17" x2="19" y2="23"></line>
    <line x1="17" y1="21" x2="23" y2="21"></line>
  </svg>
);

export default function ProducedPage() {
  const [productionData, setProductionData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const fetchProductionData = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedCategory) params.append("categoryId", selectedCategory);
      if (selectedDate) params.append("selectedDate", selectedDate);
      params.append("status", "produced");

      try {
        const response = await fetch(
          `https://localhost:7015/api/plan/staff-view?${params.toString()}`
        );
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setProductionData(data);
      } catch (e) {
        console.error("Failed to fetch production data:", e);
        setError("Could not load production data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProductionData();
  }, [selectedCategory, selectedDate]);

  const getUniqueCategories = () => {
    const categories = productionData.map((item) => ({
      id: item.categoryId,
      name: item.categoryName,
    }));
    return [...new Map(categories.map((item) => [item.id, item])).values()];
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <StaffSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <StaffHeader />

        <main className="flex-1 overflow-y-auto bg-blue-50 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="bg-white p-4 sm:p-6 rounded-lg border-2 border-blue-200 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-lg sm:text-xl font-semibold text-blue-800">
                      Produced Orders
                    </h1>
                    <p className="text-sm sm:text-base text-blue-600 mt-1">
                      Orders that have been completed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100 mb-8 flex items-center flex-wrap gap-4">
              <FilterIcon />
              <h3 className="text-md font-semibold text-slate-700 mr-4">
                Filters:
              </h3>

              <select
                value={selectedCategory || ""}
                onChange={(e) =>
                  setSelectedCategory(
                    e.target.value ? Number.parseInt(e.target.value) : null
                  )
                }
                className="bg-blue-50 border border-blue-100 rounded-md shadow-sm p-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Product Types</option>
                {getUniqueCategories().map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-blue-50 border border-blue-100 rounded-md shadow-sm p-2 text-sm text-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={() => {
                  setSelectedCategory(null);
                  setSelectedDate("");
                }}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline ml-auto pr-2"
              >
                Clear Filters
              </button>
            </div>

            {/* Content Area */}
            <div className="space-y-8">
              {isLoading ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md border border-blue-100">
                  <p className="text-slate-500">Loading...</p>
                </div>
              ) : error ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md border border-blue-100">
                  <p className="text-red-500 font-semibold">{error}</p>
                </div>
              ) : productionData.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg shadow-md border border-blue-100">
                  <p className="text-slate-500">No orders found.</p>
                </div>
              ) : (
                productionData.map((category) => (
                  <div key={category.categoryId}>
                    <h2 className="text-2xl font-bold text-slate-800">
                      {category.categoryName}
                      <span className="text-lg font-medium text-slate-600 ml-2">
                        ({category.totalItems} orders)
                      </span>
                    </h2>
                    <div className="mt-4 space-y-6">
                      {category.dateGroups.map((dateGroup) => (
                        <div
                          key={dateGroup.groupDate}
                          className="bg-white rounded-xl shadow-md overflow-hidden border border-blue-100"
                        >
                          <div className="bg-green-300 p-3">
                            <h3 className="font-bold text-green-900">
                              {new Date(dateGroup.groupDate).toLocaleDateString(
                                "en-US",
                                {
                                  month: "long",
                                  day: "2-digit",
                                  year: "numeric",
                                }
                              )}
                              <span className="font-normal ml-2">
                                ({dateGroup.itemCount} items)
                              </span>
                            </h3>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                              <thead className="bg-blue-50">
                                <tr>
                                  <th className="p-3 text-left font-semibold text-slate-700 w-12">
                                    #
                                  </th>
                                  <th className="p-3 text-left font-semibold text-slate-700 w-24">
                                    Image
                                  </th>
                                  <th className="p-3 text-left font-semibold text-slate-700">
                                    Name
                                  </th>
                                  <th className="p-3 text-center font-semibold text-slate-700">
                                    Quantity
                                  </th>
                                  <th className="p-3 text-left font-semibold text-slate-700">
                                    Note
                                  </th>
                                  <th
                                    className="p-3 text-center font-semibold text-slate-700"
                                    colSpan="4"
                                  >
                                    Documents
                                  </th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-blue-100">
                                {dateGroup.details.map((detail, index) => (
                                  <tr
                                    key={detail.planDetailId}
                                    className="hover:bg-blue-50 transition-colors"
                                  >
                                    <td className="p-3 text-center text-slate-500">
                                      {index + 1}
                                    </td>
                                    <td className="p-3">
                                      <img
                                        src={
                                          detail.imageUrl ||
                                          "https://placehold.co/100x100/e2e8f0/adb5bd?text=N/A" ||
                                          "/placeholder.svg" ||
                                          "/placeholder.svg"
                                        }
                                        alt={detail.customerName}
                                        className="w-16 h-16 object-cover rounded-md border border-blue-100"
                                      />
                                    </td>
                                    <td className="p-3">
                                      <div className="font-bold text-slate-800">
                                        {detail.customerName}
                                      </div>
                                      <div className="text-xs text-slate-500">
                                        {detail.orderCode}
                                      </div>
                                    </td>
                                    <td className="p-3 text-center font-medium text-slate-700">
                                      {detail.quantity}
                                    </td>
                                    <td className="p-3 text-slate-600 max-w-xs truncate">
                                      {detail.noteOrEngravingContent || "N/A"}
                                    </td>
                                    <td className="p-3 text-center">
                                      <a
                                        href={detail.productionFileUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        <DownloadIcon /> Download
                                      </a>
                                    </td>
                                    <td className="p-3 text-center">
                                      <a
                                        href={detail.thankYouCardUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 text-green-600 hover:text-green-800 hover:underline"
                                      >
                                        <CardIcon /> Card
                                      </a>
                                    </td>
                                    <td className="p-3 text-center">
                                      <a
                                        href="#"
                                        className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-800 hover:underline"
                                      >
                                        <LabelIcon /> Label
                                      </a>
                                    </td>
                                    <td className="p-3 text-center">
                                      <Link
                                        href={`/staff/qr-code/${detail.orderDetailId}`}
                                        className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-800 hover:underline"
                                      >
                                        <QrCodeIcon /> QR
                                      </Link>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
