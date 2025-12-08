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
import { Download, Upload, Loader, AlertCircle, CheckCircle, FileSpreadsheet } from "lucide-react";
import { saveAs } from "file-saver";
import { toast } from "sonner"; 
import apiClient from "../../lib/apiClient";

export default function ImportOrdersModal({
  isOpen,
  onClose,
  onImportSuccess,
}) {
  // --- STATE QUẢN LÝ ---
  const [dataRows, setDataRows] = useState(null); // Dữ liệu nhận từ API Validate
  const [fileError, setFileError] = useState(null);
  
  const [isLoading, setIsLoading] = useState(false); // Loading khi Upload/Validate
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading khi Confirm
  const [isDownloading, setIsDownloading] = useState(false); // Loading khi tải Master Data
 const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [importResult, setImportResult] = useState(null); // Kết quả sau khi Confirm

  const [editMode, setEditMode] = useState(null);

  // Kiểm tra xem có dòng nào đang lỗi không
  const hasErrors = useMemo(() => {
    return dataRows?.some(row => !row.isValid);
  }, [dataRows]);

  // Cấu hình cột hiển thị (Khớp với field trả về từ Backend - camelCase)
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

  // --- 1. Tải Template Rỗng (Client Side) ---
  // const downloadTemplate = () => {
  //   const templateData = [
  //     {
  //       OrderCode: "ORD-DEMO-01",
  //       CustomerName: "John Doe",
  //       Phone: "0987654321",
  //       Email: "johndoe@example.com",
  //       Address: "123 Main St",
  //       Province: "Hanoi",
  //       District: "Dong Da",
  //       Ward: "Lang Thuong",
  //       SKU: "TSHIRT-BLK-L",
  //       Quantity: 2,
  //       Accessory: "Gift Box",
  //       Note: "Deliver during office hours",
  //       LinkImg: "https://example.com/img.jpg",
  //       LinkThanksCard: "",
  //       LinkFileDesign: "",
  //     },
  //   ];

  //   const worksheet = XLSX.utils.json_to_sheet(templateData);
  //   const wscols = columns.map(() => ({ wch: 20 }));
  //   worksheet["!cols"] = wscols;

  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
  //   const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  //   const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  //   saveAs(blob, "Order_Import_Template.xlsx");
  // };
  // --- 1. Tải Template (GỌI API THAY VÌ TẠO CLIENT) ---
  const downloadTemplate = async () => {
    setIsDownloadingTemplate(true);
    try {
      // Gọi API Backend vừa viết
      const response = await apiClient.get('/api/OrderImport/download-template', { 
         responseType: 'blob', // Quan trọng: Báo axios nhận về file
         credentials: "include",
      });

      // Tạo blob và tải xuống
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

  // --- 2. Tải Master Data (Gọi API) ---
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

  // --- 3. Upload & Validate (LOGIC MỚI - UI CŨ) ---
  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check đuôi file
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
      // GỌI API VALIDATE (Thay vì đọc XLSX ở Client)
      const response = await apiClient.post('/api/Order/validate-import', formData, {
        headers: { "Content-Type": "multipart/form-data" },
        credentials: "include",
      });

      // Server trả về List DTO (bao gồm cả isValid và errors)
      setDataRows(response.data);
      setShowPreview(true); // Chuyển sang màn hình Preview
    } catch (error) {
      console.error("Validate error:", error);
      toast.error("Failed to validate file: " + (error.response?.data?.message || error.message));
    } finally {
      setIsLoading(false);
      event.target.value = ""; // Reset input
    }
  };

  // --- 4. Sửa dữ liệu (Client Side) ---
  const handleEditField = (rowIndex, field, value) => {
    if (!dataRows) return;
    
    // 1. Lấy giá trị hiện tại của ô đó
    const currentValue = dataRows[rowIndex][field];

    // 2. KIỂM TRA QUAN TRỌNG: 
    // Nếu giá trị mới (value) GIỐNG HỆT giá trị cũ -> Không làm gì cả (Giữ nguyên lỗi nếu có)
    // Lưu ý: So sánh lỏng (==) để tránh lỗi kiểu number vs string, hoặc dùng toString() nếu cần chặt chẽ
    if (currentValue == value) { 
        return; 
    }

    // 3. Nếu giá trị thực sự thay đổi, thì mới cập nhật state
    const updated = [...dataRows];
    updated[rowIndex] = { ...updated[rowIndex], [field]: value };
    
    // 4. Chỉ xóa trạng thái lỗi khi người dùng đã thực sự sửa đổi dữ liệu
    if (!updated[rowIndex].isValid) {
        updated[rowIndex].isValid = true;
        updated[rowIndex].errors = []; // Xóa danh sách lỗi để người dùng thử Submit lại
    }

    setDataRows(updated);
  };

  // --- 5. Submit Confirm (Gửi JSON lên API) ---
  const handleSubmitImport = async () => {
    // ... check hasErrors ...
    setIsSubmitting(true);
    setShowConfirm(false); 

    try {
      const response = await apiClient.post('/api/Order/confirm-import', dataRows, {
          withCredentials: true,
          headers: { "Authorization": `Bearer ${localStorage.getItem("token") || ""}` }
      });

      const result = response.data;

      // TRƯỜNG HỢP 1: Valid lại thấy vẫn còn lỗi (User sửa sai)
      if (result.errors && result.errors.length > 0) {
          toast.error(`Found ${result.errors.length} errors. Please fix them.`);
          
          // Cập nhật lại bảng dataRows để tô đỏ các dòng bị lỗi lại
          const updatedRows = [...dataRows];
          result.errors.forEach(err => {
             // Tìm dòng tương ứng theo RowNumber
             const rowIndex = updatedRows.findIndex(r => r.rowNumber === err.rowNumber);
             if (rowIndex !== -1) {
                 updatedRows[rowIndex].isValid = false;
                 updatedRows[rowIndex].errors = err.messages;
             }
          });
          setDataRows(updatedRows);
          
          // Không đóng bảng Preview, để user sửa tiếp
          return; 
      }

      // TRƯỜNG HỢP 2: Thành công (Errors = 0, Success > 0)
      if (result.successCount > 0) {
        setImportResult(result); // Hiện màn hình kết quả xanh
        if(onImportSuccess) onImportSuccess(); 
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

  const resetModal = () => {
    setDataRows(null);
    setShowPreview(false);
    setShowConfirm(false);
    setEditMode(null);
    setImportResult(null);
    setFileError(null);
    if(onClose) onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={resetModal}>
        <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Import Orders from Excel</DialogTitle>
            <DialogDescription>
              Download templates, verify product SKUs, fill data, and upload.
            </DialogDescription>
          </DialogHeader>

          {/* VIEW 1: KẾT QUẢ IMPORT (Sau khi confirm) */}
          {importResult ? (
             <div className="flex-1 overflow-y-auto space-y-4">
                <Alert className={importResult.errors?.length === 0 ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}>
                    {importResult.errors?.length === 0 ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-orange-600" />}
                    <AlertTitle className="font-bold">Import Results</AlertTitle>
                    <AlertDescription>
                        Total Rows: <strong>{importResult.totalRows}</strong> <br/>
                        Success: <strong className="text-green-600">{importResult.successCount}</strong> <br/>
                        Errors: <strong className="text-red-600">{importResult.errors?.length || 0}</strong>
                    </AlertDescription>
                </Alert>

                {/* Nếu có lỗi hệ thống khi Confirm thì hiện ở đây */}
             </div>
          ) : 
          
          /* VIEW 2: PREVIEW & FIX (Sau khi upload) */
          showPreview ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-700">
                  Preview ({dataRows?.length} rows) 
                  {hasErrors && <span className="ml-2 text-red-600 text-sm font-bold">(Contains Errors - Please Fix)</span>}
                </h3>
                <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                  Back to upload
                </Button>
              </div>

              <div className="flex-1 overflow-auto border rounded-lg bg-white relative">
                <Table className="text-xs w-max">
                  <TableHeader className="sticky top-0 z-10 bg-blue-100 shadow-sm">
                    <TableRow>
                      <TableHead className="w-10 text-center bg-blue-100">#</TableHead>
                      {columns.map((col) => (
                        <TableHead key={col.key} className="px-3 py-2 whitespace-nowrap font-bold text-gray-700 bg-blue-100">
                          {col.label}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dataRows?.map((row, rowIndex) => (
                      <TableRow 
                        key={rowIndex} 
                        // Style Cũ nhưng có Logic Mới: Dòng lỗi sẽ màu đỏ
                        className={!row.isValid ? "bg-red-50 hover:bg-red-100" : "hover:bg-blue-50"}
                      >
                        <TableCell className="text-center text-gray-400 font-medium">
                            {rowIndex + 1}
                            {/* Icon cảnh báo nhỏ nếu lỗi */}
                            {!row.isValid && (
                                <div className="text-red-500 cursor-help" title={row.errors?.join("\n")}>
                                    <AlertCircle className="w-3 h-3 mx-auto mt-1"/>
                                </div>
                            )}
                        </TableCell>
                        
                        {columns.map((col) => (
                          <TableCell
                            key={`${rowIndex}-${col.key}`}
                            className="px-2 py-1 border-r last:border-r-0 max-w-[200px] truncate"
                            // Hiện lỗi khi hover vào ô bất kỳ của dòng lỗi
                            title={!row.isValid ? row.errors?.join(", ") : row[col.key]}
                          >
                            {editMode === `${rowIndex}-${col.key}` ? (
                              <Input
                              autoFocus
                              // Dùng defaultValue để không bị lock khi gõ, 
                              // hoặc dùng value + onChange (nhưng cần quản lý state local input phức tạp hơn)
                              // Ở đây logic onBlur của bạn đang dùng defaultValue là ổn với use case này.
                              defaultValue={row[col.key]} 
                              
                              // Sửa lỗi: Trim() giá trị để tránh khoảng trắng thừa gây hiểu nhầm là đã sửa
                              onBlur={(e) => {
                                const val = e.target.value.trim(); // Trim dữ liệu
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
                              className="h-7 text-xs w-full min-w-[100px]"
                            />
                            ) : (
                              <div
                                onClick={() => setEditMode(`${rowIndex}-${col.key}`)}
                                className="cursor-text p-1 min-h-[24px] hover:bg-white/50 rounded"
                              >
                                {row[col.key] || <span className="text-gray-300 italic">--</span>}
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
          ) : (
            
          /* VIEW 3: UPLOAD MẶC ĐỊNH (Giao diện Cũ) */
            <div className="space-y-6 py-8 flex-1">
              
              {/* Grid 2 Nút Download */}
              <div className="grid grid-cols-2 gap-4">
                 {/* Step 1A */}
                 {/* Step 1A: Import Template */}
                  <div className="border border-dashed border-blue-200 rounded-lg p-6 bg-blue-50/50 flex flex-col items-center justify-center text-center">
                    <h3 className="font-semibold text-gray-700 mb-2">Step 1A: Import Template</h3>
                    <p className="text-sm text-gray-500 mb-4">Get template with SKU Dropdown.</p>
                    
                    <Button 
                      onClick={downloadTemplate} 
                      disabled={isDownloadingTemplate} // Disable khi đang tải
                      variant="outline" 
                      className="border-blue-500 text-blue-600 hover:bg-blue-50"
                    >
                      {isDownloadingTemplate ? (
                        <Loader className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" /> 
                      )}
                      Download Template
                    </Button>
                  </div>

                 {/* Step 1B */}
                 <div className="border border-dashed border-green-200 rounded-lg p-6 bg-green-50/50 flex flex-col items-center justify-center text-center">
                    <h3 className="font-semibold text-gray-700 mb-2">Step 1B: Master Data</h3>
                    <p className="text-sm text-gray-500 mb-4">Get Products & SKUs.</p>
                    <Button onClick={handleDownloadProductMaster} disabled={isDownloading} variant="outline" className="border-green-600 text-green-700 hover:bg-green-100">
                      {isDownloading ? <Loader className="h-4 w-4 mr-2 animate-spin"/> : <FileSpreadsheet className="h-4 w-4 mr-2" />}
                      Download Master Data
                    </Button>
                 </div>
              </div>

              {/* Step 2: Upload */}
              <div className={`border-2 border-dashed rounded-lg p-8 transition-colors bg-gray-50 flex flex-col items-center justify-center 
                  ${fileError ? 'border-red-400 bg-red-50' : 'border-gray-300 hover:border-blue-400'}`}>
                
                <h3 className="font-semibold text-center text-gray-700 mb-4">Step 2: Upload Your File</h3>
                
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-4">
                    <Loader className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                    <span className="text-gray-600">Validating data...</span>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center cursor-pointer w-full">
                    <div className="bg-white p-4 rounded-full shadow-sm mb-3">
                        <Upload className={`h-8 w-8 ${fileError ? 'text-red-500' : 'text-blue-500'}`} />
                    </div>
                    <p className="text-sm font-medium text-gray-700">Click to select file or drag and drop here</p>
                    <p className="text-xs text-gray-500 mt-1">Supports .xlsx, .xls</p>
                    
                    <input
                      type="file"
                      accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                )}

                {/* Hiển thị lỗi file */}
                {fileError && (
                  <div className="flex items-center mt-4 text-red-600 bg-white px-4 py-2 rounded-md shadow-sm border border-red-200">
                    <AlertCircle className="h-4 w-4 mr-2" />
                    <span className="text-sm font-medium">{fileError}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="mt-4 border-t pt-4">
            {importResult ? (
                <Button onClick={resetModal}>Close</Button>
            ) : showPreview ? (
              <>
                <Button variant="ghost" onClick={resetModal} disabled={isSubmitting}>Cancel</Button>
                <Button 
                    onClick={() => {
                        if (hasErrors) {
                            toast.warning("Please fix all red rows first!");
                            return;
                        }
                        setShowConfirm(true);
                    }} 
                    className={`bg-blue-600 hover:bg-blue-700 ${hasErrors ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isSubmitting || hasErrors}
                >
                    {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                    Proceed Import
                </Button>
              </>
            ) : (
              <Button variant="ghost" onClick={resetModal}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ALERT CONFIRM GIỮ NGUYÊN */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to import <strong>{dataRows?.length}</strong> orders.
              <br/>Make sure all data is correct.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                  e.preventDefault();
                  handleSubmitImport();
              }}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}