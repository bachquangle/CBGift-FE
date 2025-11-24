"use client";

import { useState, useEffect } from "react";
import StaffSidebar from "@/components/layout/staff/sidebar";
import StaffHeader from "@/components/layout/staff/header";
import { Layers } from "lucide-react"; // Import thêm icon cho nút mới
import apiClient from "../../../lib/apiClient";

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

export default function NeedsProductionPage() {
  const [productionData, setProductionData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [isGrouping, setIsGrouping] = useState(false);

  useEffect(() => {
    const fetchProductionData = async () => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedCategory) params.append("categoryId", selectedCategory);
      if (selectedDate) params.append("selectedDate", selectedDate);
      params.append("status", "needs_production");

      try {
        const response = await fetch(
          `${
            apiClient.defaults.baseURL
          }/api/plan/staff-view?${params.toString()}`
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
  }, [selectedCategory, selectedDate, updateTrigger]);
  const handleGroupSubmit = async () => {
    setIsGrouping(true); // Bắt đầu loading
    try {
      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/plan/group-submitted`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        // Ném lỗi nếu server trả về lỗi (vd: 400, 500)
        throw new Error(`API call failed with status: ${response.status}`);
      }

      // Nếu thành công
      alert("Orders have been grouped successfully!");

      // Kích hoạt useEffect để tải lại dữ liệu mới nhất
      setUpdateTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to group submitted orders:", error);
      alert(`Error grouping orders: ${error.message}`);
    } finally {
      setIsGrouping(false); // Dừng loading dù thành công hay thất bại
    }
  };

  const handleUpdateStatus = async (planDetailId, newStatus) => {
    try {
      const response = await fetch(
        `${apiClient.defaults.baseURL}/api/plan/update-status/${planDetailId}?newStatus=${newStatus}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`API call failed with status: ${response.status}`);
      }

      setUpdateTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to update status:", error);
      alert(`Error updating status: ${error.message}`);
    }
  };

  const handleMarkProduced = async (detail) => {
    await handleUpdateStatus(detail.planDetailId, 8);
  };

  const handleReproduction = async (detail) => {
    await handleUpdateStatus(detail.planDetailId, 7);
  };

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
                      Needs Production
                    </h1>
                    <p className="text-sm sm:text-base text-blue-600 mt-1">
                      Orders waiting to be produced
                    </p>
                  </div>

                  {/* 3. Thêm nút "Group Submit" vào đây */}
                  <div className="mt-4 sm:mt-0">
                    <button
                      onClick={handleGroupSubmit}
                      disabled={isGrouping}
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Layers className="h-5 w-5 mr-2" />
                      {isGrouping ? "Grouping..." : "Group Submitted Orders"}
                    </button>
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
                          <div className="bg-slate-200 p-3">
                            <h3 className="font-bold text-slate-900">
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
                                  <th className="p-3 text-center font-semibold text-slate-700">
                                    Documents
                                  </th>
                                  <th className="p-3 text-left font-semibold text-slate-700">
                                    Status
                                  </th>
                                  <th className="p-3 text-left font-semibold text-slate-700">
                                    Action
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
                                          "/placeholder.svg" ||
                                          "/placeholder.svg" ||
                                          "/placeholder.svg" ||
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
                                    <td className="p-3 text-slate-600 max-w-xs">
                                      {/* Hiển thị Note (nếu có) */}
                                      {detail.noteOrEngravingContent ? (
                                        <div
                                          className="truncate"
                                          title={detail.noteOrEngravingContent}
                                        >
                                          {detail.noteOrEngravingContent}
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 italic">
                                          N/A
                                        </span>
                                      )}

                                      {/* Hiển thị Reason (nếu có) */}
                                      {detail.reason && (
                                        <div
                                          className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded-md p-2"
                                          title={detail.reason}
                                        >
                                          <strong>QC Reject Reason:</strong>{" "}
                                          {detail.reason}
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      <div className="flex flex-wrap gap-2 justify-center">
                                        <a
                                          href={detail.productionFileUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline text-xs"
                                        >
                                          <DownloadIcon /> File
                                        </a>
                                        <a
                                          href={detail.thankYouCardUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="inline-flex items-center gap-1 text-green-600 hover:text-green-800 hover:underline text-xs"
                                        >
                                          <CardIcon /> Card
                                        </a>
                                        <button className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 text-xs">
                                          <LabelIcon /> Label
                                        </button>
                                        <button className="inline-flex items-center gap-1 text-orange-600 hover:text-orange-800 text-xs">
                                          <QrCodeIcon /> QR
                                        </button>
                                      </div>
                                    </td>
                                    <td className="p-3">
                                      {detail.statusOrder === 6 && (
                                        <span className="inline-flex items-center bg-slate-100 text-slate-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                          <span className="w-2 h-2 me-1 bg-slate-500 rounded-full"></span>
                                          Waiting for Production
                                        </span>
                                      )}
                                      {detail.statusOrder === 11 && (
                                        <span className="inline-flex items-center bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                          <span className="w-2 h-2 me-1 bg-red-500 rounded-full"></span>
                                          Production Failed
                                        </span>
                                      )}
                                      {detail.statusOrder === 7 && (
                                        <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                          <span className="w-2 h-2 me-1 bg-blue-500 rounded-full"></span>
                                          Production In Progress
                                        </span>
                                      )}
                                      {detail.statusOrder === 8 && (
                                        <span className="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                          <span className="w-2 h-2 me-1 bg-green-500 rounded-full"></span>
                                          Completed
                                        </span>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      {detail.statusOrder === 6 && (
                                        <button
                                          onClick={() =>
                                            handleUpdateStatus(
                                              detail.planDetailId,
                                              7
                                            )
                                          }
                                          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition font-medium text-sm"
                                        >
                                          Start Production
                                        </button>
                                      )}
                                      {detail.statusOrder === 11 && (
                                        <button
                                          onClick={() =>
                                            handleReproduction(detail)
                                          }
                                          className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition font-medium text-sm"
                                        >
                                          Reproduce
                                        </button>
                                      )}
                                      {detail.statusOrder === 7 && (
                                        <button
                                          onClick={() =>
                                            handleMarkProduced(detail)
                                          }
                                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition font-medium text-sm"
                                        >
                                          Mark as Produced
                                        </button>
                                      )}
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
