"use client"
import { useState, useEffect, useMemo } from "react"
import StaffSidebar from "@/components/layout/staff/sidebar"
import StaffHeader from "@/components/layout/staff/header"
import { 
  Filter, Download, CreditCard, Tag, QrCode, 
  Calendar, CheckCircle, AlertCircle, 
  Copy, User, StickyNote, AlertTriangle, XCircle, RotateCcw, Clock, Activity, Search
} from "lucide-react"
import apiClient from "../../../lib/apiClient"

export default function ProducedPage() {
  const [productionData, setProductionData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // States cho Filter & Search
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedDate, setSelectedDate] = useState("")
  const [searchOrderCode, setSearchOrderCode] = useState("") 
  
  const [updateTrigger, setUpdateTrigger] = useState(0)

  // --- API CALLS ---
  useEffect(() => {
    const fetchProductionData = async () => {
      setIsLoading(true)
      setError(null)
      const params = new URLSearchParams()
      
      if (selectedCategory) params.append("categoryId", selectedCategory)
      if (selectedDate) params.append("selectedDate", selectedDate)
      
      // Quan trọng: Gọi API lấy danh sách ĐÃ SẢN XUẤT
      params.append("status", "produced")
      
      try {
        const response = await fetch(`${apiClient.defaults.baseURL}/api/plan/staff-view?${params.toString()}`, 
            {
            credentials: "include"
            });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        
        console.log("🔥 Produced Data:", data) 
        setProductionData(data)
      } catch (e) {
        console.error("Failed to fetch production data:", e)
        setError("Could not load production data.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchProductionData()
  }, [selectedCategory, selectedDate, updateTrigger])

  // --- CLIENT-SIDE FILTERING (Tìm kiếm Order Code) ---
  const filteredData = useMemo(() => {
    if (!searchOrderCode.trim()) return productionData;

    const lowerKeyword = searchOrderCode.toLowerCase().trim();

    return productionData.map(category => {
        const dateGroups = category.dateGroups || category.DateGroups || [];

        const filteredDateGroups = dateGroups.map(dateGroup => {
            const orderGroups = dateGroup.orderGroups || dateGroup.OrderGroups || [];

            const filteredOrders = orderGroups.filter(order => {
                const code = order.orderCode || order.OrderCode || "";
                return code.toLowerCase().includes(lowerKeyword);
            });

            if (filteredOrders.length === 0) return null;

            return {
                ...dateGroup,
                orderGroups: filteredOrders,
                OrderGroups: filteredOrders
            };
        }).filter(group => group !== null);

        if (filteredDateGroups.length === 0) return null;

        return {
            ...category,
            dateGroups: filteredDateGroups,
            DateGroups: filteredDateGroups
        };
    }).filter(cat => cat !== null);

  }, [productionData, searchOrderCode]);

  // --- HELPER FUNCTIONS ---
  const getUniqueCategories = () => {
    if (!productionData) return [];
    const categories = productionData.map((item) => ({
      id: item.categoryId || item.CategoryId,
      name: item.categoryName || item.CategoryName,
    }))
    return [...new Map(categories.map((item) => [item.id, item])).values()]
  }

  const getOrderGroups = (dateGroup) => dateGroup.orderGroups || dateGroup.OrderGroups || [];
  const getDetails = (orderGroup) => orderGroup.details || orderGroup.Details || [];

  const clearFilters = () => {
      setSelectedCategory(null);
      setSelectedDate("");
      setSearchOrderCode("");
  }

  // Helper hiển thị Badge Status
  const renderStatusBadge = (status) => {
    switch (status) {
        case 6: // READY_PROD
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                    <Clock className="w-3 h-3" /> Ready
                </span>
            );
        case 7: // IN_PROD
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    <Activity className="w-3 h-3" /> In Prod
                </span>
            );
        case 8: // FINISHED
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    <CheckCircle className="w-3 h-3" /> Finished
                </span>
            );
        case 9: // QC_DONE
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
                    <CheckCircle className="w-3 h-3" /> QC Pass
                </span>
            );
        case 10: // QC_FAIL
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                    <XCircle className="w-3 h-3" /> QC Fail
                </span>
            );
        case 11: // PROD_REWORK
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-200">
                    <RotateCcw className="w-3 h-3" /> Rework
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Unknown ({status})
                </span>
            );
    }
  }

  // --- RENDER UI ---
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <StaffSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <StaffHeader />
        
        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 p-4 sm:p-6">
          <div className="max-w-screen-2xl mx-auto space-y-6">
            
            {/* 1. TOP HEADER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Produced Orders</h1>
                    <p className="text-sm text-slate-500">History of completed manufacturing orders</p>
                </div>
                {/* Đã bỏ nút Group Orders vì không cần thiết ở trang Produced */}
            </div>

            {/* 2. FILTER BAR */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-slate-700 font-semibold min-w-[80px]">
                    <Filter className="w-5 h-5 text-slate-500" />
                    Filters:
                </div>
                <div className="hidden md:block w-px h-8 bg-slate-200 mx-2"></div>

                <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto flex-1">
                    <select
                        value={selectedCategory || ""}
                        onChange={(e) => setSelectedCategory(e.target.value ? Number.parseInt(e.target.value) : null)}
                        className="w-full md:w-[200px] bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    >
                        <option value="">All Product Types</option>
                        {getUniqueCategories().map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                    </select>

                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full md:w-[160px] bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                    />

                    {/* Search Input */}
                    <div className="relative w-full md:w-[250px]">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <Search className="w-4 h-4 text-slate-400" />
                        </div>
                        <input 
                            type="text" 
                            className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block pl-10 p-2.5" 
                            placeholder="Search Order Code..."
                            value={searchOrderCode}
                            onChange={(e) => setSearchOrderCode(e.target.value)}
                        />
                    </div>
                </div>

                {(selectedCategory || selectedDate || searchOrderCode) && (
                    <button
                        onClick={clearFilters}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline whitespace-nowrap ml-auto"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* 3. List Data */}
            <div className="space-y-8">
              {isLoading ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
              ) : filteredData.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                        <Search className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-lg font-medium text-slate-500">No orders found.</p>
                        <p className="text-sm">Try adjusting your filters or search criteria.</p>
                    </div>
                </div>
              ) : (
                filteredData.map((category, catIndex) => (
                  <div key={category.categoryId || category.CategoryId || catIndex} className="space-y-4">
                    
                    {/* Category Name */}
                    <div className="flex items-center gap-2 px-2 pt-4">
                        <span className="h-6 w-1 bg-blue-500 rounded-full"></span>
                        <h2 className="text-lg font-bold text-slate-800">
                            {category.categoryName || category.CategoryName}
                        </h2>
                        <span className="text-xs font-semibold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            {category.totalItems || category.TotalItems} items
                        </span>
                    </div>

                    {(category.dateGroups || category.DateGroups || []).map((dateGroup, dateIndex) => {
                        const orderGroups = getOrderGroups(dateGroup);

                        return (
                        <div key={dateIndex}>
                             {/* Date Header */}
                            <div className="mb-2 ml-2 text-sm font-semibold text-slate-500 flex items-center gap-2 mt-4">
                                <Calendar className="w-4 h-4" />
                                {new Date(dateGroup.groupDate || dateGroup.GroupDate).toLocaleDateString("en-US", { weekday: 'short', month: 'long', day: 'numeric' })}
                                <span className="text-xs font-normal text-slate-400">({dateGroup.itemCount || dateGroup.ItemCount} items)</span>
                            </div>

                            {/* TABLE */}
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 font-medium w-12 text-center">#</th>
                                            <th className="px-4 py-3 font-medium min-w-[300px]">Item Detail</th>
                                            <th className="px-4 py-3 font-medium w-[250px]">Customer / Order</th>
                                            <th className="px-4 py-3 font-medium text-center w-20">Qty</th>
                                            <th className="px-4 py-3 font-medium text-center w-32">Status</th>
                                            <th className="px-4 py-3 font-medium">Notes</th>
                                            <th className="px-4 py-3 font-medium text-center">Files</th>
                                            {/* Đã bỏ cột Action */}
                                        </tr>
                                    </thead>
                                    
                                    {orderGroups.length > 0 ? (
                                        orderGroups.map((group, groupIndex) => {
                                            const details = getDetails(group);
                                            const customerName = group.customerName || group.CustomerName || "N/A";
                                            const orderCode = group.orderCode || group.OrderCode || "N/A";
                                            const orderId = group.orderId || group.OrderId;

                                            return (
                                            <tbody key={orderId || groupIndex} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30 transition-colors group">
                                                {details.map((detail, index) => {
                                                    const d_planDetailId = detail.planDetailId || detail.PlanDetailId;
                                                    const d_imageUrl = detail.imageUrl || detail.ImageUrl;
                                                    const d_productName = detail.productName || detail.ProductName;
                                                    const d_sku = detail.sku || detail.Sku;
                                                    const d_reason = detail.reason || detail.Reason;
                                                    const d_qty = detail.quantity || detail.Quantity;
                                                    const d_note = detail.noteOrEngravingContent || detail.NoteOrEngravingContent;
                                                    const d_file = detail.productionFileUrl || detail.ProductionFileUrl;
                                                    const d_card = detail.thankYouCardUrl || detail.ThankYouCardUrl;
                                                    const d_orderDetailId = detail.orderDetailId || detail.OrderDetailId;
                                                    const d_status = detail.statusOrder || detail.StatusOrder; 

                                                    return (
                                                    <tr key={d_planDetailId}>
                                                        {/* STT */}
                                                        {index === 0 && (
                                                            <td className="px-4 py-4 text-center align-top border-r border-transparent group-hover:border-slate-200" rowSpan={details.length}>
                                                                <span className="text-slate-400 font-mono text-xs">{groupIndex + 1}</span>
                                                            </td>
                                                        )}

                                                        {/* Product Info */}
                                                        <td className="px-4 py-4 align-top">
                                                            <div className="flex gap-4">
                                                                <div className="relative h-20 w-20 flex-shrink-0 rounded-lg border border-slate-200 bg-slate-100 overflow-hidden">
                                                                    <img
                                                                        src={d_imageUrl || "/placeholder.svg"} 
                                                                        alt={d_productName}
                                                                        className="h-full w-full object-cover"
                                                                        onError={(e) => { e.target.onerror = null; e.target.src = "https://via.placeholder.com/150?text=No+Image"; }}
                                                                    />
                                                                </div>
                                                                <div className="flex flex-col justify-start py-1">
                                                                    <h3 className="text-base font-bold text-slate-800 line-clamp-2 leading-tight">
                                                                        {d_productName || "No Name"}
                                                                    </h3>
                                                                    <div className="mt-1.5 flex flex-wrap gap-2">
                                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                                                                            {d_sku || "NO-SKU"}
                                                                        </span>
                                                                        {d_reason && (
                                                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                                                                                <AlertTriangle className="w-3 h-3 mr-1" />
                                                                                {d_reason}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Customer / Order Info */}
                                                        {index === 0 && (
                                                            <td className="px-4 py-4 align-top border-l border-r border-transparent group-hover:border-slate-100" rowSpan={details.length}>
                                                                <div className="flex flex-col gap-2">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                                            <User className="h-3.5 w-3.5" />
                                                                        </div>
                                                                        <span className="font-semibold text-slate-700 text-sm">{customerName}</span>
                                                                    </div>
                                                                    
                                                                    <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 px-2 py-1.5 rounded-md w-fit max-w-full">
                                                                        <Tag className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                                                        <span className="text-xs font-mono text-slate-600 truncate max-w-[140px]" title={orderCode}>
                                                                            {orderCode}
                                                                        </span>
                                                                        <button 
                                                                            onClick={() => navigator.clipboard.writeText(orderCode)}
                                                                            className="ml-1 text-slate-400 hover:text-blue-600" title="Copy Order ID"
                                                                        >
                                                                            <Copy className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        )}

                                                        {/* Quantity */}
                                                        <td className="px-4 py-4 align-top text-center pt-8">
                                                            <span className="font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-md">x{d_qty}</span>
                                                        </td>

                                                        {/* Status */}
                                                        <td className="px-4 py-4 align-top text-center pt-8">
                                                            {renderStatusBadge(d_status)}
                                                        </td>

                                                        {/* Notes */}
                                                        <td className="px-4 py-4 align-top pt-6">
                                                            {d_note ? (
                                                                <div className="flex items-start gap-2 bg-yellow-50 text-yellow-800 text-xs p-2 rounded border border-yellow-200">
                                                                    <StickyNote className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                                                    <span className="italic">{d_note}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-300 text-xs italic">--</span>
                                                            )}
                                                        </td>

                                                        {/* Files */}
                                                        <td className="px-4 py-4 align-top text-center pt-6">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                {d_file && (
                                                                    <a href={d_file} target="_blank" title="Download Design" className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-100">
                                                                        <Download className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                                {d_card && (
                                                                    <a href={d_card} target="_blank" title="Thank You Card" className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-100">
                                                                        <CreditCard className="w-4 h-4" />
                                                                    </a>
                                                                )}
                                                                <a href={`/staff/qr-code/${d_orderDetailId}`} title="View QR" className="p-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition border border-slate-200">
                                                                    <QrCode className="w-4 h-4" />
                                                                </a>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )})}
                                            </tbody>
                                        )})
                                    ) : (
                                        <tbody>
                                            <tr>
                                                <td colSpan="7" className="text-center py-6 text-slate-400 italic">No produced items available.</td>
                                            </tr>
                                        </tbody>
                                    )}
                                </table>
                            </div>
                        </div>
                    )})}
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}