"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import apiClient from "../../../../lib/apiClient"
import StaffSidebar from "@/components/layout/staff/sidebar"
import StaffHeader from "@/components/layout/staff/header"

export default function QrCodePage() {
  const params = useParams()
  const orderDetailId = params.orderDetailId

  const [qrData, setQrData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchQrCode = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`${apiClient.defaults.baseURL}/api/QrCode/${orderDetailId}`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        setQrData(data)
      } catch (e) {
        console.error("Failed to fetch QR code:", e)
        setError("Could not load QR code. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }
    if (orderDetailId) fetchQrCode()
  }, [orderDetailId])

  // --- GIỮ NGUYÊN LOGIC DOWNLOAD CŨ (TÁCH BIỆT ẢNH VÀ QR) ---
  const handleDownloadSimpleTicket = async () => {
    if (!qrData) return
    setIsDownloading(true)

    try {
      const canvasWidth = 3000
      const canvasHeight = 2000
      
      const qrZoneWidth = 800; 
      const imageAreaWidth = canvasWidth - qrZoneWidth; 
      const imageAreaHeight = canvasHeight;

      const canvas = document.createElement("canvas")
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      const ctx = canvas.getContext("2d")

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const loadImage = (src) => {
        return new Promise((resolve) => {
          if (!src) resolve(null)
          const img = new Image()
          img.crossOrigin = "anonymous"
          img.onload = () => resolve(img)
          img.onerror = () => resolve(null)
          img.src = src
        })
      }

      const [designImg, qrImg] = await Promise.all([
        loadImage(qrData.linkDesign),
        loadImage(qrData.qrCodeUrl)
      ])

      // Vẽ Design bên Trái
      if (designImg) {
        const scale = Math.min(imageAreaWidth / designImg.width, imageAreaHeight / designImg.height)
        const dW = designImg.width * scale
        const dH = designImg.height * scale
        const dX = (imageAreaWidth - dW) / 2
        const dY = (imageAreaHeight - dH) / 2
        ctx.drawImage(designImg, dX, dY, dW, dH)
      }

      // Vẽ QR bên Phải
      if (qrImg) {
        const qrSize = 250;     
        const fontSize = 60;    
        const padding = 20;     
        const gap = 15;        
        
        ctx.font = `bold ${fontSize}px Courier New`;
        const textMetrics = ctx.measureText(qrData.orderCode);
        const textWidth = textMetrics.width;
        const textHeightReal = (textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent) || fontSize;

        let boxWidth = Math.ceil(Math.max(qrSize, textWidth)) + (padding * 2);
        if (boxWidth > qrZoneWidth - 40) boxWidth = qrZoneWidth - 40; 

        const boxHeight = padding + textHeightReal + gap + qrSize + padding;

        const sidebarCenterX = imageAreaWidth + (qrZoneWidth / 2);
        const boxX = sidebarCenterX - (boxWidth / 2);
        const marginBottom = 100;
        const boxY = canvasHeight - boxHeight - marginBottom;
        const contentCenterX = boxX + (boxWidth / 2);

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = "#e5e7eb";
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        ctx.fillStyle = "#000000";
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(qrData.orderCode, contentCenterX, boxY + padding, boxWidth - (padding*2));

        const qrY = boxY + padding + textHeightReal + gap;
        ctx.drawImage(qrImg, contentCenterX - (qrSize / 2), qrY, qrSize, qrSize);
      }

      canvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = `Print-${qrData.orderCode}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        setIsDownloading(false)
      }, "image/png")

    } catch (error) {
      console.error("Error downloading:", error)
      alert("Failed to download.")
      setIsDownloading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans text-slate-800">
      <div className="print:hidden h-full flex-shrink-0 flex">
        <StaffSidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="print:hidden bg-white shadow-sm z-10">
          <StaffHeader />
        </div>

        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 p-6 bg-gray-100/50">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                <p className="text-gray-500 font-medium">Loading ticket...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
               <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
                  <div className="text-red-500 text-5xl mb-4">⚠️</div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Error Loading Data</h3>
                  <p className="text-gray-500 mb-6">{error}</p>
                  <Link href="/staff/needs-production" className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-black transition-colors">
                    Go Back
                  </Link>
               </div>
            </div>
          ) : (
            <div className="max-w-[1600px] mx-auto h-full flex flex-col">
              
              {/* Toolbar */}
              <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
                <div>
                  <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Production Ticket</h1>
                  <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                    <span className="bg-gray-200 px-2 py-0.5 rounded text-gray-700 font-mono font-medium">#{qrData.orderDetailId}</span>
                    <span>•</span>
                    <span className="truncate max-w-[300px]">{qrData.productName}</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3">
                  <button 
                    onClick={handleDownloadSimpleTicket} 
                    disabled={isDownloading}
                    className="bg-green-600 text-white px-5 py-2.5 rounded-lg hover:bg-green-700 shadow-sm hover:shadow-md transition-all flex items-center gap-2 font-medium disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isDownloading ? (
                        <>
                           <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                           Processing...
                        </>
                    ) : (
                        <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            Download Ticket
                        </>
                    )}
                  </button>

                  <button onClick={handlePrint} className="bg-white text-gray-700 border border-gray-300 px-5 py-2.5 rounded-lg hover:bg-gray-50 hover:text-black shadow-sm transition-all flex items-center gap-2 font-medium">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                    Print
                  </button>

                  <Link href="/staff/needs-production" className="bg-white text-gray-500 hover:text-gray-800 border border-transparent px-4 py-2.5 rounded-lg transition-colors font-medium">
                    Back
                  </Link>
                </div>
              </div>

              {qrData && (
                <div className="flex-1 bg-white rounded-2xl shadow-xl overflow-hidden print:shadow-none print:rounded-none border border-gray-100">
                  <div className="grid grid-cols-1 lg:grid-cols-12 h-full min-h-[600px]">
                    
                    {/* DESIGN VIEW */}
                    <div className="lg:col-span-9 bg-slate-50 relative flex items-center justify-center p-4 border-b lg:border-b-0 lg:border-r border-gray-200">
                        {/* Background caro mờ */}
                        <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                        
                        {qrData.linkDesign ? (
                            <img 
                                src={qrData.linkDesign} 
                                alt="Design File" 
                                className="relative z-10 w-auto h-auto max-w-full max-h-[80vh] object-contain shadow-sm rounded"
                            />
                        ) : (
                            <div className="flex flex-col items-center text-gray-400 z-10">
                                <span className="font-medium">No Design Available</span>
                            </div>
                        )}
                    </div>

                    {/* SIDEBAR INFO VIEW */}
                    <div className="lg:col-span-3 bg-white flex flex-col h-full">
                        <div className="p-8 flex flex-col items-center justify-center flex-grow border-b border-gray-100 space-y-8">
                            <div className="text-center w-full">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Order Code</p>
                                <h2 className="text-2xl font-mono font-bold text-gray-900 break-all">
                                    {qrData.orderCode}
                                </h2>
                            </div>
                            <div className="bg-white p-2 rounded-xl border border-gray-200">
                                <img
                                    src={qrData.qrCodeUrl}
                                    alt="QR Code"
                                    className="w-48 h-48 object-contain rendering-pixelated"
                                />
                            </div>
                        </div>

                        {/* --- UI THAY ĐỔI: Thêm Index Item --- */}
                        <div className="p-6 bg-gray-50/50 space-y-4">
                            {/* Quantity */}
                            <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
                                <span className="text-sm font-semibold text-gray-500 uppercase">Quantity</span>
                                <span className="text-4xl font-bold text-indigo-600">{qrData.quantity}</span>
                            </div>

                            {/* Item Index (MỚI) */}
                            {qrData.totalItems > 0 && (
                                <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Item Index</span>
                                    <span className="font-mono font-bold text-lg text-gray-700">
                                        {qrData.itemIndex} <span className="text-gray-300">/</span> {qrData.totalItems}
                                    </span>
                                </div>
                            )}

                            {/* Product Name */}
                            <div className="pt-2 text-center text-sm text-gray-500 border-t border-gray-200 mt-2">
                                {qrData.productName}
                            </div>
                        </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        @media print {
          @page { size: landscape; margin: 0; }
          body { background: white; -webkit-print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
        }
        .rendering-pixelated {
            image-rendering: pixelated; 
        }
      `}</style>
    </div>
  )
}