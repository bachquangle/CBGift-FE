"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Upload, Loader } from "lucide-react";
import { saveAs } from "file-saver";

export default function ImportOrdersModal({
  isOpen,
  onClose,
  onImportSuccess,
}) {
  const [uploadedData, setUploadedData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editedData, setEditedData] = useState(null);

  const [editMode, setEditMode] = useState(null);
  const [editValue, setEditValue] = useState("");

  const templateColumns = [
    "OrderID",
    "OrderCode",
    "OrderDate",
    "CustomerName",
    "Phone",
    "Email",
    "Address",
    "Size",
    "ProductName",
    "Quantity",
    "Price",
    "Accessory",
    "PaymentStatus",
    "Note",
    "LinkImg",
    "LinkThanksCard",
    "LinkFileDesign",
    "Status",
    "TotalAmount",
    "OrderNotes",
    "TimeCreated",
  ];

  const downloadTemplate = () => {
    const templateData = [
      {
        OrderID: "1",
        OrderCode: "ORD-001",
        OrderDate: new Date().toISOString().slice(0, 10),
        CustomerName: "John Doe",
        Phone: "0123456789",
        Email: "john@example.com",
        Address: "123 Main St",
        Size: "M",
        ProductName: "T-Shirt",
        Quantity: 1,
        Price: 100000,
        Accessory: "None",
        PaymentStatus: "Paid",
        Note: "Sample order",
        LinkImg: "",
        LinkThanksCard: "",
        LinkFileDesign: "",
        Status: "Processing",
        TotalAmount: 100000,
        OrderNotes: "",
        TimeCreated: new Date().toISOString(),
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "OrderTemplate.xlsx");
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          alert("No data found in the Excel file");
          setIsLoading(false);
          return;
        }

        setUploadedData(jsonData);
        setEditedData(JSON.parse(JSON.stringify(jsonData)));
        setShowPreview(true);
        setIsLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error reading file:", error);
      alert("Error reading file. Please try again.");
      setIsLoading(false);
    }
  };

  const handleEditField = (rowIndex, field, value) => {
    const updated = [...editedData];
    updated[rowIndex] = { ...updated[rowIndex], [field]: value };
    setEditedData(updated);
  };

  const handleConfirmImport = () => {
    setShowConfirm(true);
  };

  const handleSubmitImport = () => {
    if (onImportSuccess) {
      onImportSuccess(editedData);
    }
    resetModal();
  };

  const resetModal = () => {
    setUploadedData(null);
    setEditedData(null);
    setShowPreview(false);
    setShowConfirm(false);
    setEditMode(null);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Import Orders</DialogTitle>
            <DialogDescription>
              Download template and upload your order file
            </DialogDescription>
          </DialogHeader>

          {!showPreview ? (
            <div className="space-y-6 py-4">
              {/* Template Download Section */}
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 bg-blue-50">
                <h3 className="font-semibold text-gray-700 mb-2">
                  1. Download Template
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Download the Excel template to see the required format
                </p>
                <Button
                  onClick={downloadTemplate}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
              </div>

              {/* File Upload Section */}
              <div className="border-2 border-dashed border-blue-200 rounded-lg p-6 bg-blue-50">
                <h3 className="font-semibold text-gray-700 mb-2">
                  2. Upload Your File
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select your completed Excel file to import
                </p>

                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader className="h-6 w-6 animate-spin text-blue-500 mr-2" />
                    <span className="text-gray-600">Processing file...</span>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:bg-blue-100 transition">
                      <Upload className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                      <p className="text-sm font-medium text-gray-700">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        CSV, XLSX, XLS files supported
                      </p>
                    </div>
                    <input
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto py-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-700">
                  Preview ({editedData?.length} records)
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPreview(false)}
                >
                  Back
                </Button>
              </div>

              {/* Preview Table */}
              <div className="overflow-x-auto border rounded-lg">
                <Table className="text-sm">
                  <TableHeader>
                    <TableRow className="bg-blue-100">
                      {templateColumns.map((col) => (
                        <TableHead
                          key={col}
                          className="px-2 py-2 whitespace-nowrap"
                        >
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editedData?.map((row, rowIndex) => (
                      <TableRow key={rowIndex} className="hover:bg-gray-50">
                        {templateColumns.map((col) => (
                          <TableCell
                            key={`${rowIndex}-${col}`}
                            className="px-2 py-2 whitespace-nowrap"
                          >
                            {editMode === `${rowIndex}-${col}` ? (
                              <Input
                                autoFocus
                                defaultValue={row[col]}
                                onBlur={(e) => {
                                  handleEditField(
                                    rowIndex,
                                    col,
                                    e.target.value
                                  );
                                  setEditMode(null);
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    handleEditField(
                                      rowIndex,
                                      col,
                                      e.target.value
                                    );
                                    setEditMode(null);
                                  }
                                }}
                                className="h-7 text-xs"
                              />
                            ) : (
                              <div
                                onClick={() =>
                                  setEditMode(`${rowIndex}-${col}`)
                                }
                                className="cursor-pointer p-1 hover:bg-blue-100 rounded text-xs truncate max-w-xs"
                                title={row[col]}
                              >
                                {row[col] || "-"}
                              </div>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <DialogFooter>
            {!showPreview ? (
              <>
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowPreview(false)}>
                  Back
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Submit
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogDescription>
            Are you sure you want to import {editedData?.length} orders? This
            action cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmitImport}
              className="bg-green-500 hover:bg-green-600"
            >
              Confirm Import
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
