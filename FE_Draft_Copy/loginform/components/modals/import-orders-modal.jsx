"use client";

import { useState, useMemo } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Upload, Loader, AlertCircle, CheckCircle, FileSpreadsheet, X, AlertTriangle, ArrowRight } from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner";
import apiClient from "../../lib/apiClient";
import { cn } from "@/lib/utils"; // Đảm bảo bạn có file utils này (của shadcn)

export default function ImportOrdersModal({
  isOpen,
  onClose,
  onImportSuccess,
}) {
  // --- STATE QUẢN LÝ ---
  const [dataRows, setDataRows] = useState(null);
  const [fileError, setFileError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [editMode, setEditMode] = useState(null);

  // --- LOGIC TÍNH TOÁN ---
  const hasErrors = useMemo(() => {
    return dataRows?.some(row => !row.isValid);
  }, [dataRows]);

  const errorCount = useMemo(() => dataRows?.filter(r => !r.isValid).length || 0, [dataRows]);
  const validCount = useMemo(() => dataRows?.filter(r => r.isValid).length || 0, [dataRows]);

  const columns = [
    { key: "orderCode", label: "Order Code" },
    { key: "customerName", label: "Customer Name" },
    { key: "phone", label: "Phone" },
    { key: "email", label: "Email" },
    { key: "address", label: "Address" },
    { key: "province", label: "Province" },
    { key: "district", label: "District" },
    { key: "ward", label: "Ward" },
    { key: "sku", label: "SKU" },
    { key: "quantity", label: "Qty" },
    { key: "accessory", label: "Accessory" },
    { key: "note", label: "Note" },
    { key: "linkImg", label: "Link Img" },
  ];

  // --- ACTIONS ---

  const resetModal = () => {
    setDataRows(null);
    setShowPreview(false);
    setShowConfirm(false);
    setEditMode(null);
    setImportResult(null);
    setFileError(null);
    setIsLoading(false);
    setIsSubmitting(false);
    if (onClose) onClose();
  };

  const downloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      const response = await apiClient.get('/api/OrderImport/download-template', {
        responseType: 'blob',
        credentials: "include",
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, "Order_Import_Template.xlsx");
      toast.success("Template downloaded successfully!");
    } catch (error) {
      console.error("Download template failed:", error);
      toast.error("Failed to download template.");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };

  const handleDownloadProductMaster = async () => {
    setIsDownloading(true);
    try {
      const response = await apiClient.get('/api/Product/export-master', {
        responseType: 'blob',
        credentials: "include",
      });
      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `Product_Master_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Product Master Data downloaded successfully!");
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Failed to download Product Master Data.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validExtensions = ['.xlsx', '.xls'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      setFileError("Invalid file format. Please select .xlsx or .xls files only.");
      event.target.value = "";
      return;
    }

    setFileError(null);
    setIsLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiClient.post('/api/Order/validate-import', formData, {
        headers: { "Content-Type": "multipart/form-data" },
        credentials: "include",
      });
      setDataRows(response.data);
      setShowPreview(true);
    } catch (error) {
      console.error("Validate error:", error);
      toast.error("Failed to validate file: " + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  const handleEditField = (rowIndex, field, value) => {
    if (!dataRows) return;
    const currentValue = dataRows[rowIndex][field];
    if (currentValue == value) return;

    const updated = [...dataRows];
    updated[rowIndex] = { ...updated[rowIndex], [field]: value };

    // Reset valid status if changed
    if (!updated[rowIndex].isValid) {
      updated[rowIndex].isValid = true;
      updated[rowIndex].errors = [];
    }
    setDataRows(updated);
  };

  const handleSubmitImport = async () => {
    setIsSubmitting(true);
    setShowConfirm(false);

    try {
      const response = await apiClient.post('/api/Order/confirm-import', dataRows, {
        withCredentials: true,
      });

      const result = response.data;

      if (result.errors && result.errors.length > 0) {
        toast.error(`Found ${result.errors.length} errors. Please fix them.`);
        const updatedRows = [...dataRows];
        result.errors.forEach(err => {
          const rowIndex = updatedRows.findIndex(r => r.rowNumber === err.rowNumber);
          if (rowIndex !== -1) {
            updatedRows[rowIndex].isValid = false;
            updatedRows[rowIndex].errors = err.messages;
          }
        });
        setDataRows(updatedRows);
        return;
      }

      if (result.successCount > 0) {
        setImportResult(result);
        if (onImportSuccess) onImportSuccess();
        toast.success(`Successfully imported ${result.successCount} orders!`);
        setShowPreview(false);
      }

    } catch (error) {
      console.error("Import failed:", error);
      toast.error("System error: " + (error.response?.data?.message || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={resetModal}>
        <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 gap-0 overflow-hidden bg-gray-50/50">
          
          {/* HEADER */}
          <div className="px-6 py-4 bg-white border-b flex justify-between items-center shadow-sm z-10">
            <div>
              <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-green-600"/>
                Import Orders
              </DialogTitle>
              <DialogDescription className="text-xs mt-1">
                Validate excel data before importing to system.
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={resetModal} className="h-8 w-8 rounded-full hover:bg-gray-100">
                <X className="h-5 w-5 text-gray-500" />
            </Button>
          </div>

          {/* MAIN CONTENT AREA */}
          <div className="flex-1 overflow-hidden relative bg-gray-50">
            
            {/* VIEW 1: RESULT SCREEN */}
            {importResult ? (
               <div className="h-full flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className={cn(
                      "p-8 rounded-2xl border shadow-xl max-w-md w-full text-center bg-white",
                      importResult.errors?.length === 0 ? "border-green-100 ring-4 ring-green-50" : "border-orange-100 ring-4 ring-orange-50"
                  )}>
                      {importResult.errors?.length === 0 ? (
                          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                              <CheckCircle className="h-10 w-10 text-green-600" />
                          </div>
                      ) : (
                          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                              <AlertTriangle className="h-10 w-10 text-orange-600" />
                          </div>
                      )}
                      
                      <h3 className="text-2xl font-bold mb-2 text-gray-800">Import Completed</h3>
                      <p className="text-gray-500 mb-8">Summary of your import action.</p>

                      <div className="grid grid-cols-3 gap-3 mb-8 text-sm">
                          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                              <p className="text-gray-500 text-xs uppercase font-bold tracking-wider mb-1">Total</p>
                              <p className="font-bold text-xl text-gray-800">{importResult.totalRows}</p>
                          </div>
                          <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                              <p className="text-green-600 text-xs uppercase font-bold tracking-wider mb-1">Success</p>
                              <p className="font-bold text-xl text-green-700">{importResult.successCount}</p>
                          </div>
                          <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                              <p className="text-red-600 text-xs uppercase font-bold tracking-wider mb-1">Failed</p>
                              <p className="font-bold text-xl text-red-700">{importResult.errors?.length || 0}</p>
                          </div>
                      </div>

                      <Button onClick={resetModal} className="w-full h-11 text-base shadow-md">Close & Continue</Button>
                  </div>
               </div>
            ) : 
            
            /* VIEW 2: PREVIEW TABLE (GIAO DIỆN MỚI) */
            showPreview ? (
              <div className="h-full flex flex-col">
                {/* Toolbar */}
                <div className="px-6 py-3 bg-white border-b flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-4">
                    <h3 className="font-bold text-gray-700">Data Preview</h3>
                    <div className="h-6 w-px bg-gray-300"></div>
                    <div className="flex gap-3 text-sm">
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md font-medium border border-gray-200">
                            <span>Total:</span> 
                            <span className="text-gray-900">{dataRows?.length}</span>
                        </span>
                        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-md font-medium border border-green-100">
                            <CheckCircle className="w-3.5 h-3.5"/>
                            <span>Valid:</span> 
                            <span className="font-bold">{validCount}</span>
                        </span>
                        {errorCount > 0 && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-700 rounded-md font-medium border border-red-100 animate-pulse">
                                <AlertCircle className="w-3.5 h-3.5"/>
                                <span>Errors:</span> 
                                <span className="font-bold">{errorCount}</span>
                            </span>
                        )}
                    </div>
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={() => setShowPreview(false)} className="text-gray-600 hover:text-gray-900">
                    <Upload className="w-4 h-4 mr-2"/> Re-upload File
                  </Button>
                </div>

                {/* Table Scroll Area */}
                <div className="flex-1 overflow-auto bg-gray-50/50 p-4">
                  <div className="bg-white border rounded-lg shadow-sm overflow-hidden min-w-max">
                    <Table className="text-xs">
                      <TableHeader>
                        <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-gray-200">
                          <TableHead className="w-12 text-center font-bold text-gray-600 h-10">#</TableHead>
                          {columns.map((col) => (
                            <TableHead key={col.key} className="px-4 py-2 font-bold text-gray-600 h-10 whitespace-nowrap border-l border-gray-200/50">
                              {col.label}
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dataRows?.map((row, rowIndex) => {
                            const isError = !row.isValid;
                            return (
                                <>
                                    {/* DÒNG DỮ LIỆU CHÍNH */}
                                    <TableRow 
                                        key={`row-${rowIndex}`} 
                                        className={cn(
                                            "transition-colors group",
                                            isError 
                                                ? "bg-red-50/30 hover:bg-red-50 border-l-[4px] border-l-red-500" 
                                                : "hover:bg-blue-50/50 border-l-[4px] border-l-transparent odd:bg-white even:bg-gray-50/30"
                                        )}
                                    >
                                        <TableCell className="text-center font-medium py-2">
                                            {isError ? <AlertCircle className="w-4 h-4 text-red-500 mx-auto" /> : (rowIndex + 1)}
                                        </TableCell>
                                        
                                        {columns.map((col) => (
                                            <TableCell
                                                key={`${rowIndex}-${col.key}`}
                                                className="px-2 py-1.5 max-w-[200px] truncate border-l border-gray-100 first:border-l-0"
                                            >
                                                {editMode === `${rowIndex}-${col.key}` ? (
                                                    <Input
                                                        autoFocus
                                                        defaultValue={row[col.key]} 
                                                        onBlur={(e) => {
                                                            const val = e.target.value.trim();
                                                            handleEditField(rowIndex, col.key, val);
                                                            setEditMode(null);
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") {
                                                                const val = e.currentTarget.value.trim();
                                                                handleEditField(rowIndex, col.key, val);
                                                                setEditMode(null);
                                                            }
                                                        }}
                                                        className="h-7 text-xs w-full shadow-sm border-blue-400 focus-visible:ring-1 bg-white"
                                                    />
                                                ) : (
                                                    <div
                                                        onClick={() => setEditMode(`${rowIndex}-${col.key}`)}
                                                        className={cn(
                                                            "cursor-text px-2 py-1 rounded w-full h-full min-h-[24px] flex items-center",
                                                            "hover:bg-white hover:shadow-sm hover:ring-1 hover:ring-blue-200 transition-all",
                                                            !row[col.key] && "text-gray-300 italic"
                                                        )}
                                                    >
                                                        {row[col.key] || "Empty"}
                                                    </div>
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>

                                    {/* DÒNG HIỂN THỊ LỖI (INLINE ERROR ROW) */}
                                    {isError && (
                                        <TableRow key={`err-${rowIndex}`} className="bg-red-50 hover:bg-red-50 border-b-2 border-red-100">
                                            <TableCell colSpan={columns.length + 1} className="p-0">
                                                <div className="px-10 py-2 flex items-start gap-3">
                                                    <div className="mt-0.5 p-1 bg-red-100 rounded text-red-600">
                                                        <AlertTriangle className="w-3.5 h-3.5"/>
                                                    </div>
                                                    <div className="text-xs text-red-700">
                                                        <span className="font-bold uppercase tracking-wider text-[10px] text-red-500 mb-1 block">Issues found:</span>
                                                        <ul className="list-disc pl-4 space-y-0.5">
                                                            {row.errors?.map((err, i) => (
                                                                <li key={i} className="leading-tight font-medium">{err}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
                            );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                
                {/* Action Bar */}
                <div className="p-4 bg-white border-t flex justify-end gap-3 items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                    {hasErrors ? (
                        <div className="mr-auto flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg border border-red-100">
                            <AlertTriangle className="w-5 h-5"/>
                            <span className="text-sm font-semibold">Please fix {errorCount} errors in the table above before proceeding.</span>
                        </div>
                    ) : (
                        <div className="mr-auto flex items-center gap-2 text-green-700 px-4">
                            <CheckCircle className="w-5 h-5"/>
                            <span className="text-sm font-semibold">All data looks good!</span>
                        </div>
                    )}

                    <Button variant="outline" onClick={resetModal} disabled={isSubmitting} className="h-10 px-6">Cancel</Button>
                    <Button 
                        onClick={() => setShowConfirm(true)} 
                        className={cn(
                            "h-10 px-6 font-semibold shadow-sm transition-all",
                            hasErrors ? "bg-gray-200 text-gray-400 cursor-not-allowed hover:bg-gray-200" : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md"
                        )}
                        disabled={isSubmitting || hasErrors}
                    >
                        {isSubmitting ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Import {validCount} Orders
                    </Button>
                </div>
              </div>
            ) : (
              
            /* VIEW 3: UPLOAD SCREEN (ĐÃ BỎ CỘT 3 & CHỈNH LẠI GRID) */
              <div className="h-full flex flex-col items-center justify-center p-8 bg-gray-50/50">
                <div className="w-full max-w-4xl">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Bulk Import Orders</h2>
                        <p className="text-gray-500">Follow the steps below to import orders quickly.</p>
                    </div>

                    {/* SỬA grid-cols-3 THÀNH grid-cols-2 ĐỂ CÂN ĐỐI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        {/* Step 1 */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden group hover:border-blue-300 transition-all">
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500"></div>
                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mb-4 text-blue-600 font-bold text-lg">1</div>
                            <h4 className="font-bold text-gray-800 mb-1">Get Template</h4>
                            <p className="text-xs text-gray-500 mb-4">Download Excel file with SKU dropdown.</p>
                            <Button variant="outline" size="sm" onClick={downloadTemplate} disabled={isDownloadingTemplate} className="mt-auto w-full border-blue-200 text-blue-700 hover:bg-blue-50">
                                {isDownloadingTemplate ? <Loader className="h-3 w-3 mr-2 animate-spin"/> : <Download className="h-3 w-3 mr-2"/>}
                                Download Template
                            </Button>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center relative overflow-hidden group hover:border-green-300 transition-all">
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-4 text-green-600 font-bold text-lg">2</div>
                            <h4 className="font-bold text-gray-800 mb-1">Prepare Data</h4>
                            <p className="text-xs text-gray-500 mb-4">Use Master Data to fill correct Products.</p>
                            <Button variant="outline" size="sm" onClick={handleDownloadProductMaster} disabled={isDownloading} className="mt-auto w-full border-green-200 text-green-700 hover:bg-green-50">
                                {isDownloading ? <Loader className="h-3 w-3 mr-2 animate-spin"/> : <FileSpreadsheet className="h-3 w-3 mr-2"/>}
                                Get Master Data
                            </Button>
                        </div>

                        {/* ĐÃ XÓA STEP 3 Ở ĐÂY */}
                    </div>

                    {/* Upload Box */}
                    <div className={cn(
                        "relative w-full border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all duration-300",
                        fileError 
                            ? "border-red-300 bg-red-50/50" 
                            : "border-gray-300 bg-white hover:border-blue-400 hover:shadow-lg hover:shadow-blue-50/50"
                    )}>
                        {isLoading ? (
                            <div className="flex flex-col items-center animate-in zoom-in-95">
                                <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                                <p className="font-bold text-lg text-gray-700">Validating Data...</p>
                                <p className="text-sm text-gray-500">Processing large files may take a moment.</p>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center cursor-pointer w-full h-full group">
                                <div className={cn(
                                    "w-20 h-20 rounded-full flex items-center justify-center mb-4 transition-transform group-hover:scale-110 shadow-sm",
                                    fileError ? "bg-red-100 text-red-500" : "bg-blue-50 text-blue-600"
                                )}>
                                    <Upload className="h-10 w-10" />
                                </div>
                                <p className="text-xl font-bold text-gray-700 mb-2">Upload Excel File</p>
                                <p className="text-gray-500 mb-6">Drag & drop or click to browse (.xlsx, .xls)</p>
                                
                                <span className="px-6 py-3 bg-gray-900 text-white rounded-lg text-sm font-semibold shadow hover:bg-gray-800 transition-all flex items-center gap-2">
                                    Choose File <ArrowRight className="w-4 h-4"/>
                                </span>

                                <input type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
                            </label>
                        )}

                        {fileError && (
                            <div className="absolute bottom-4 flex items-center gap-2 text-red-600 bg-white px-4 py-2 rounded-full shadow-sm border border-red-100 animate-in slide-in-from-bottom-2">
                                <AlertCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">{fileError}</span>
                            </div>
                        )}
                    </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ALERT CONFIRM */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                <Upload className="h-6 w-6 text-blue-600" />
            </div>
            <AlertDialogTitle className="text-center text-xl">Ready to Import?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              You are about to import <strong className="text-gray-900">{validCount}</strong> valid orders into the system.
              <br/>This action adds data directly to the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-2">
            <AlertDialogCancel disabled={isSubmitting} className="w-full sm:w-auto mt-0">Review Again</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                  e.preventDefault();
                  handleSubmitImport();
              }}
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader className="h-4 w-4 animate-spin mr-2"/> : null}
              {isSubmitting ? "Importing..." : "Confirm Import"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}