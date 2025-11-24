"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Package, Download, QrCode, Edit, Save, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function YearMonthDayView({ orders }) {
  const [expandedYears, setExpandedYears] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [expandedDays, setExpandedDays] = useState({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedOrder, setEditedOrder] = useState(null);
  const [showDayDetailsDialog, setShowDayDetailsDialog] = useState(false);
  const [selectedDayOrders, setSelectedDayOrders] = useState([]);
  const [selectedDayLabel, setSelectedDayLabel] = useState("");

  const groupOrdersByDate = () => {
    const grouped = {};

    orders.forEach((order) => {
      const date = new Date(order.orderDate);
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();

      const week = Math.ceil(day / 7);

      if (!grouped[year]) {
        grouped[year] = {};
      }
      if (!grouped[year][month]) {
        grouped[year][month] = {};
      }
      if (!grouped[year][month][week]) {
        grouped[year][month][week] = {};
      }
      if (!grouped[year][month][week][day]) {
        grouped[year][month][week][day] = [];
      }

      grouped[year][month][week][day].push(order);
    });

    return grouped;
  };

  const groupedOrders = groupOrdersByDate();
  const years = Object.keys(groupedOrders)
    .map(Number)
    .sort((a, b) => b - a);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const toggleYear = (year) => {
    setExpandedYears((prev) => ({
      ...prev,
      [year]: !prev[year],
    }));
  };

  const toggleMonth = (year, month) => {
    const key = `${year}-${month}`;
    setExpandedMonths((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleWeek = (year, month, week) => {
    const key = `${year}-${month}-${week}`;
    setExpandedWeeks((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const toggleDay = (dayKey) => {
    setExpandedDays((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Draft":
        return "bg-gray-100 text-gray-800";
      case "Assigned Designer":
        return "bg-purple-100 text-purple-800";
      case "Designing":
        return "bg-blue-100 text-blue-800";
      case "Check File Design":
        return "bg-indigo-100 text-indigo-800";
      case "Seller Approved Design":
        return "bg-orange-100 text-orange-800";
      case "Seller Reject Design":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending Design":
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white">
            Pending Design
          </Badge>
        );
      case "In Progress":
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
            In Progress
          </Badge>
        );
      case "Completed":
        return (
          <Badge className="bg-green-500 hover:bg-green-600 text-white">
            Completed
          </Badge>
        );
      case "Assigned Designer":
        return (
          <Badge className="bg-purple-500 hover:bg-purple-600 text-white">
            Assigned Designer
          </Badge>
        );
      case "Check File Design":
        return (
          <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white">
            Check File Design
          </Badge>
        );
      case "Seller Approved Design":
        return (
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
            Seller Approved Design
          </Badge>
        );
      case "Seller Reject Design":
        return (
          <Badge className="bg-red-500 hover:bg-red-600 text-white">
            Seller Reject Design
          </Badge>
        );
      case "Draft":
        return (
          <Badge className="bg-gray-500 hover:bg-gray-600 text-white">
            Draft
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getWeekDateRange = (year, month, week) => {
    const startDay = (week - 1) * 7 + 1;
    const endDay = Math.min(week * 7, new Date(year, month + 1, 0).getDate());

    const startDate = new Date(year, month, startDay);
    const endDate = new Date(year, month, endDay);

    const startStr = startDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const endStr = endDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return `${startStr} - ${endStr}`;
  };

  const handleViewDayDetails = (dayOrders, dayLabel) => {
    setSelectedDayOrders(dayOrders);
    setSelectedDayLabel(dayLabel);
    setShowDayDetailsDialog(true);
  };

  const handleViewOrderDetails = (order) => {
    const customerInfo = order.customerInfo || {
      name: order.customerName || "Unknown",
      phone: order.customerPhone || "N/A",
      email: order.customerEmail || "N/A",
      address: order.customerAddress || "N/A",
      city: order.customerCity || "N/A",
      state: order.customerState || "N/A",
      zipcode: order.customerZipcode || "N/A",
    };

    setEditedOrder({
      ...order,
      customerInfo,
    });
    setIsEditMode(false);
  };

  const handleEditMode = () => {
    setIsEditMode(true);
  };

  const handleSaveUpdate = () => {
    console.log("Saving updated order:", editedOrder);
    setIsEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditedOrder(null);
    setIsEditMode(false);
  };

  const handleFieldChange = (field, value) => {
    setEditedOrder((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCustomerInfoChange = (field, value) => {
    setEditedOrder((prev) => ({
      ...prev,
      customerInfo: {
        ...prev.customerInfo,
        [field]: value,
      },
    }));
  };

  const handleProductChange = (index, field, value) => {
    setEditedOrder((prev) => ({
      ...prev,
      products: prev.products.map((product, i) =>
        i === index ? { ...product, [field]: value } : product
      ),
    }));
  };

  const handleDownload = (file) => {
    console.log(`Downloading file: ${file.name}`);
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name;
    link.click();
  };

  return (
    <div className="space-y-4">
      {years.map((year) => (
        <div
          key={year}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          {/* Year Header */}
          <button
            onClick={() => toggleYear(year)}
            className="w-full bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 px-4 py-3 flex items-center justify-between transition-colors"
          >
            <div className="flex items-center gap-3">
              {expandedYears[year] ? (
                <ChevronDown className="h-5 w-5 text-blue-600" />
              ) : (
                <ChevronRight className="h-5 w-5 text-blue-600" />
              )}
              <Calendar className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-lg text-blue-900">{year}</span>
            </div>
            <Badge className="bg-blue-600 hover:bg-blue-700">
              {Object.values(groupedOrders[year]).reduce(
                (sum, months) =>
                  sum +
                  Object.values(months).reduce(
                    (weekSum, weeks) =>
                      weekSum +
                      Object.values(weeks).reduce(
                        (daySum, days) => daySum + days.length,
                        0
                      ),
                    0
                  ),
                0
              )}{" "}
              orders
            </Badge>
          </button>

          {/* Months */}
          {expandedYears[year] && (
            <div className="bg-white divide-y divide-gray-200">
              {Object.keys(groupedOrders[year])
                .map(Number)
                .sort((a, b) => a - b)
                .map((month) => {
                  const monthKey = `${year}-${month}`;
                  const monthOrders = Object.values(
                    groupedOrders[year][month]
                  ).reduce(
                    (sum, weeks) =>
                      sum +
                      Object.values(weeks).reduce(
                        (daySum, days) => daySum + days.length,
                        0
                      ),
                    0
                  );

                  return (
                    <div key={monthKey}>
                      {/* Month Header */}
                      <button
                        onClick={() => toggleMonth(year, month)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors border-l-4 border-blue-300"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {expandedMonths[monthKey] ? (
                            <ChevronDown className="h-4 w-4 text-gray-600" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-600" />
                          )}
                          <span className="font-semibold text-gray-900">
                            {monthNames[month]}
                          </span>
                        </div>
                        <Badge variant="outline">{monthOrders} orders</Badge>
                      </button>

                      {/* Weeks */}
                      {expandedMonths[monthKey] && (
                        <div className="bg-gray-50 divide-y divide-gray-200">
                          {Object.keys(groupedOrders[year][month])
                            .map(Number)
                            .sort((a, b) => a - b)
                            .map((week) => {
                              const weekKey = `${year}-${month}-${week}`;
                              const weekDays = groupedOrders[year][month][week];
                              const weekOrders = Object.values(weekDays).reduce(
                                (sum, days) => sum + days.length,
                                0
                              );
                              const weekRange = getWeekDateRange(
                                year,
                                month,
                                week
                              );
                              const isWeekExpanded = expandedWeeks[weekKey];

                              return (
                                <div key={weekKey}>
                                  {/* Week Header */}
                                  <button
                                    onClick={() =>
                                      toggleWeek(year, month, week)
                                    }
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-white transition-colors text-left"
                                  >
                                    <div className="flex items-center gap-3 flex-1">
                                      {isWeekExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-gray-600" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-gray-600" />
                                      )}
                                      <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                                        Week {week}
                                      </span>
                                      <span className="text-xs text-gray-500">
                                        {weekRange}
                                      </span>
                                    </div>
                                    <Badge variant="secondary">
                                      {weekOrders} orders
                                    </Badge>
                                  </button>

                                  {/* Days in Week */}
                                  {isWeekExpanded && (
                                    <div className="bg-white divide-y divide-gray-200">
                                      {Object.keys(weekDays)
                                        .map(Number)
                                        .sort((a, b) => a - b)
                                        .map((day) => {
                                          const dayOrders = weekDays[day];
                                          const dayKey = `${year}-${month}-${day}`;
                                          const isDayExpanded =
                                            expandedDays[dayKey];
                                          const dayDate = new Date(
                                            year,
                                            month,
                                            day
                                          );
                                          const dayStr =
                                            dayDate.toLocaleDateString(
                                              "en-US",
                                              {
                                                weekday: "short",
                                                month: "short",
                                                day: "numeric",
                                              }
                                            );

                                          return (
                                            <div key={dayKey}>
                                              <div className="px-4 py-3 flex items-center justify-between hover:bg-blue-50 transition-colors">
                                                <div className="flex items-center gap-3 flex-1">
                                                  <span className="text-sm font-medium text-gray-700 min-w-[100px]">
                                                    {dayStr}
                                                  </span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <Badge variant="secondary">
                                                    {dayOrders.length} orders
                                                  </Badge>
                                                  <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                      handleViewDayDetails(
                                                        dayOrders,
                                                        dayStr
                                                      )
                                                    }
                                                    className="bg-transparent hover:bg-gray-50"
                                                  >
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    View Details
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ))}

      <Dialog
        open={showDayDetailsDialog}
        onOpenChange={setShowDayDetailsDialog}
      >
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Orders for {selectedDayLabel}</DialogTitle>
          </DialogHeader>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                    Order ID
                  </TableHead>
                  <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                    Order Date
                  </TableHead>
                  <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                    Customer
                  </TableHead>
                  <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                    Address
                  </TableHead>
                  <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                    Status
                  </TableHead>
                  <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                    Amount
                  </TableHead>
                  <TableHead className="font-medium text-gray-600 uppercase text-xs tracking-wide whitespace-nowrap">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedDayOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <TableCell className="font-medium text-gray-900 whitespace-nowrap">
                      {order.orderId}
                    </TableCell>
                    <TableCell className="text-gray-600 whitespace-nowrap">
                      {order.orderDate}
                    </TableCell>
                    <TableCell className="min-w-[200px]">
                      <div>
                        <div className="font-medium text-gray-900">
                          {order.customerName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customerEmail || order.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600 max-w-[200px]">
                      <div className="truncate" title={order.address}>
                        {order.address}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell className="font-medium text-gray-900 whitespace-nowrap">
                      {order.totalAmount}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Dialog>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewOrderDetails(order)}
                          className="bg-transparent hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          <span className="hidden xl:inline">View</span>
                        </Button>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Order Details - {editedOrder?.orderId}
                              </div>
                              {!isEditMode && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setIsEditMode(true)}
                                  className="bg-transparent hover:bg-gray-50"
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Order
                                </Button>
                              )}
                            </DialogTitle>
                          </DialogHeader>
                          {editedOrder && (
                            <div className="space-y-6">
                              {/* Customer Information */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                                  Customer Information
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm text-gray-500 font-medium">
                                      Name
                                    </Label>
                                    {isEditMode ? (
                                      <Input
                                        value={
                                          editedOrder?.customerInfo?.name || ""
                                        }
                                        onChange={(e) =>
                                          handleCustomerInfoChange(
                                            "name",
                                            e.target.value
                                          )
                                        }
                                        className="mt-1"
                                      />
                                    ) : (
                                      <p className="font-medium text-gray-900 mt-1">
                                        {editedOrder?.customerInfo?.name ||
                                          "N/A"}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <Label className="text-sm text-gray-500 font-medium">
                                      Phone
                                    </Label>
                                    {isEditMode ? (
                                      <Input
                                        value={
                                          editedOrder?.customerInfo?.phone || ""
                                        }
                                        onChange={(e) =>
                                          handleCustomerInfoChange(
                                            "phone",
                                            e.target.value
                                          )
                                        }
                                        className="mt-1"
                                      />
                                    ) : (
                                      <p className="font-medium text-gray-900 mt-1">
                                        {editedOrder?.customerInfo?.phone ||
                                          "N/A"}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <Label className="text-sm text-gray-500 font-medium">
                                      Email
                                    </Label>
                                    {isEditMode ? (
                                      <Input
                                        value={
                                          editedOrder?.customerInfo?.email || ""
                                        }
                                        onChange={(e) =>
                                          handleCustomerInfoChange(
                                            "email",
                                            e.target.value
                                          )
                                        }
                                        className="mt-1"
                                      />
                                    ) : (
                                      <p className="font-medium text-gray-900 mt-1">
                                        {editedOrder?.customerInfo?.email ||
                                          "N/A"}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <Label className="text-sm text-gray-500 font-medium">
                                      Address
                                    </Label>
                                    {isEditMode ? (
                                      <Input
                                        value={`${
                                          editedOrder?.customerInfo?.address ||
                                          ""
                                        }, ${
                                          editedOrder?.customerInfo?.city || ""
                                        }, ${
                                          editedOrder?.customerInfo?.state || ""
                                        } ${
                                          editedOrder?.customerInfo?.zipcode ||
                                          ""
                                        }`}
                                        onChange={(e) =>
                                          handleCustomerInfoChange(
                                            "address",
                                            e.target.value
                                          )
                                        }
                                        className="mt-1"
                                      />
                                    ) : (
                                      <p className="font-medium text-gray-900 mt-1">
                                        {editedOrder?.customerInfo?.address},{" "}
                                        {editedOrder?.customerInfo?.city},{" "}
                                        {editedOrder?.customerInfo?.state}{" "}
                                        {editedOrder?.customerInfo?.zipcode}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Product Details */}
                              <div>
                                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                                  Product Details
                                </h3>
                                <div className="space-y-4">
                                  {editedOrder?.products?.map(
                                    (product, index) => (
                                      <div
                                        key={index}
                                        className="border border-gray-200 rounded-lg p-4"
                                      >
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                          <div>
                                            <Label className="text-sm text-gray-500 font-medium">
                                              Product
                                            </Label>
                                            {isEditMode ? (
                                              <Input
                                                value={product.name}
                                                onChange={(e) =>
                                                  handleProductChange(
                                                    index,
                                                    "name",
                                                    e.target.value
                                                  )
                                                }
                                                className="mt-1"
                                              />
                                            ) : (
                                              <p className="font-medium text-gray-900 mt-1">
                                                {product.name}
                                              </p>
                                            )}
                                          </div>
                                          <div>
                                            <Label className="text-sm text-gray-500 font-medium">
                                              Size
                                            </Label>
                                            {isEditMode ? (
                                              <Input
                                                value={product.size}
                                                onChange={(e) =>
                                                  handleProductChange(
                                                    index,
                                                    "size",
                                                    e.target.value
                                                  )
                                                }
                                                className="mt-1"
                                              />
                                            ) : (
                                              <p className="font-medium text-gray-900 mt-1">
                                                {product.size}
                                              </p>
                                            )}
                                          </div>
                                          <div>
                                            <Label className="text-sm text-gray-500 font-medium">
                                              Quantity
                                            </Label>
                                            {isEditMode ? (
                                              <Input
                                                type="number"
                                                value={product.quantity}
                                                onChange={(e) =>
                                                  handleProductChange(
                                                    index,
                                                    "quantity",
                                                    Number.parseInt(
                                                      e.target.value
                                                    )
                                                  )
                                                }
                                                className="mt-1"
                                              />
                                            ) : (
                                              <p className="font-medium text-gray-900 mt-1">
                                                {product.quantity}
                                              </p>
                                            )}
                                          </div>
                                          <div>
                                            <Label className="text-sm text-gray-500 font-medium">
                                              Accessory
                                            </Label>
                                            {isEditMode ? (
                                              <Input
                                                value={product.accessory}
                                                onChange={(e) =>
                                                  handleProductChange(
                                                    index,
                                                    "accessory",
                                                    e.target.value
                                                  )
                                                }
                                                className="mt-1"
                                              />
                                            ) : (
                                              <p className="font-medium text-gray-900 mt-1">
                                                {product.accessory}
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                                {editedOrder?.orderNotes && (
                                  <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <Label className="text-sm text-yellow-700 font-medium">
                                      Order Notes
                                    </Label>
                                    {isEditMode ? (
                                      <Textarea
                                        value={editedOrder.orderNotes}
                                        onChange={(e) =>
                                          handleFieldChange(
                                            "orderNotes",
                                            e.target.value
                                          )
                                        }
                                        className="mt-1 bg-white"
                                        rows={3}
                                      />
                                    ) : (
                                      <p className="text-yellow-800 mt-1">
                                        {editedOrder.orderNotes}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Order Status */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                                  Order Status
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-sm text-gray-500 font-medium">
                                      Current Status
                                    </Label>
                                    {isEditMode ? (
                                      <Select
                                        value={editedOrder.status}
                                        onValueChange={(value) =>
                                          handleFieldChange("status", value)
                                        }
                                      >
                                        <SelectTrigger className="mt-1 bg-white">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="Pending Design">
                                            Pending Design
                                          </SelectItem>
                                          <SelectItem value="In Progress">
                                            In Progress
                                          </SelectItem>
                                          <SelectItem value="Completed">
                                            Completed
                                          </SelectItem>
                                          <SelectItem value="Assigned Designer">
                                            Assigned Designer
                                          </SelectItem>
                                          <SelectItem value="Check File Design">
                                            Check File Design
                                          </SelectItem>
                                          <SelectItem value="Seller Approved Design">
                                            Seller Approved Design
                                          </SelectItem>
                                          <SelectItem value="Seller Reject Design">
                                            Seller Reject Design
                                          </SelectItem>
                                          <SelectItem value="Draft">
                                            Draft
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <div className="mt-1">
                                        {getStatusBadge(editedOrder.status)}
                                      </div>
                                    )}
                                  </div>
                                  <div>
                                    <Label className="text-sm text-gray-500 font-medium">
                                      Order Date
                                    </Label>
                                    <p className="font-medium text-gray-900 mt-1">
                                      {editedOrder.orderDate}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Order Files */}
                              <div>
                                <h3 className="font-semibold text-lg mb-3 text-gray-900">
                                  Order Files
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <Label className="text-sm text-gray-500 font-medium">
                                      Reference Image
                                    </Label>
                                    <div className="mt-2">
                                      <img
                                        src={
                                          editedOrder?.uploadedFiles?.linkImg
                                            ?.url ||
                                          "/placeholder.svg" ||
                                          "/placeholder.svg"
                                        }
                                        alt="Reference"
                                        className="w-full h-32 object-cover rounded border"
                                      />
                                      <p className="text-sm mt-2 text-gray-600">
                                        {editedOrder?.uploadedFiles?.linkImg
                                          ?.name || "Reference Image"}
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 w-full bg-transparent hover:bg-gray-50"
                                        onClick={() =>
                                          handleDownload(
                                            editedOrder?.uploadedFiles?.linkImg
                                          )
                                        }
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <Label className="text-sm text-gray-500 font-medium">
                                      Thanks Card
                                    </Label>
                                    <div className="mt-2">
                                      <div className="w-full h-32 bg-gray-100 rounded border flex items-center justify-center">
                                        <QrCode className="h-8 w-8 text-gray-400" />
                                      </div>
                                      <p className="text-sm mt-2 text-gray-600">
                                        {editedOrder?.uploadedFiles
                                          ?.linkThanksCard?.name ||
                                          "Thanks Card"}
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 w-full bg-transparent hover:bg-gray-50"
                                        onClick={() =>
                                          handleDownload(
                                            editedOrder?.uploadedFiles
                                              ?.linkThanksCard
                                          )
                                        }
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <Label className="text-sm text-gray-500 font-medium">
                                      Design File
                                    </Label>
                                    <div className="mt-2">
                                      <div className="w-full h-32 bg-gray-100 rounded border flex items-center justify-center">
                                        <QrCode className="h-8 w-8 text-gray-400" />
                                      </div>
                                      <p className="text-sm mt-2 text-gray-600">
                                        {editedOrder?.uploadedFiles
                                          ?.linkFileDesign?.name ||
                                          "Design File"}
                                      </p>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="mt-2 w-full bg-transparent hover:bg-gray-50"
                                        onClick={() =>
                                          handleDownload(
                                            editedOrder?.uploadedFiles
                                              ?.linkFileDesign
                                          )
                                        }
                                      >
                                        <Download className="h-4 w-4 mr-2" />
                                        Download
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* QR Code Section */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-medium mb-2 text-gray-900">
                                  QR Code for Order {editedOrder?.orderId}
                                </h4>
                                <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded flex items-center justify-center">
                                  <QrCode className="h-16 w-16 text-gray-400" />
                                </div>
                              </div>
                            </div>
                          )}
                          {isEditMode && (
                            <div className="flex gap-2 justify-end">
                              <Button
                                variant="outline"
                                onClick={() => setIsEditMode(false)}
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={() => {
                                  console.log(
                                    "Saving updated order:",
                                    editedOrder
                                  );
                                  setIsEditMode(false);
                                }}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                              </Button>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
