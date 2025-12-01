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
  const [error, setError] = useState(null)
  const canvasRef = useRef(null)
  
  useEffect(() => {
    const fetchQrCode = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${apiClient.defaults.baseURL}/api/QrCode/${orderDetailId}`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        console.log("Fetched QR code data:", data)
        setQrData(data)
      } catch (e) {
        console.error("Failed to fetch QR code:", e)
        setError("Could not load QR code. Please try again later.")
      } finally {
        setIsLoading(false)
      }
    }

    if (orderDetailId) {
      fetchQrCode()
    }
  }, [orderDetailId])

  useEffect(() => {
    if (qrData && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      canvas.width = 600
      canvas.height = 150

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      ctx.fillStyle = "#1f2937"
      ctx.font = "bold 32px Arial"
      ctx.textAlign = "center"
      ctx.fillText(qrData.orderCode, canvas.width / 2, 45)

      ctx.fillStyle = "#4b5563"
      ctx.font = "20px Arial"
      ctx.fillText(qrData.productName, canvas.width / 2, 85)

      ctx.fillStyle = "#6b7280"
      ctx.font = "18px Arial"
      ctx.fillText(`Quantity: ${qrData.quantity}`, canvas.width / 2, 120)
    }
  }, [qrData])

  const handleDownloadQR = async () => {
    if (!qrData || !canvasRef.current) return

    try {
      const downloadCanvas = document.createElement("canvas")
      const ctx = downloadCanvas.getContext("2d")

      const padding = 50
      const qrSize = 400
      const headerHeight = 80
      const totalWidth = qrSize + padding * 2
      const totalHeight = headerHeight + qrSize + padding * 2

      downloadCanvas.width = totalWidth
      downloadCanvas.height = totalHeight

      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height)

      ctx.strokeStyle = "#e5e7eb"
      ctx.lineWidth = 2
      ctx.strokeRect(10, 10, downloadCanvas.width - 20, downloadCanvas.height - 20)

      ctx.fillStyle = "#111827"
      ctx.font = "bold 36px Arial, sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(qrData.orderCode, downloadCanvas.width / 2, padding + 45)

      const qrImage = new Image()
      qrImage.crossOrigin = "anonymous"

      qrImage.onload = () => {
        const qrX = padding
        const qrY = headerHeight + padding

        ctx.shadowColor = "rgba(0, 0, 0, 0.1)"
        ctx.shadowBlur = 10
        ctx.shadowOffsetX = 0
        ctx.shadowOffsetY = 4

        ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize)

        ctx.shadowColor = "transparent"
        ctx.shadowBlur = 0

        downloadCanvas.toBlob((blob) => {
          const url = URL.createObjectURL(blob)
          const link = document.createElement("a")
          link.href = url
          link.download = `QR-${qrData.orderCode}.png`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        }, "image/png")
      }

      qrImage.onerror = () => {
        console.error("Failed to load QR code image")
        alert("Failed to download QR code. Please try again.")
      }

      qrImage.src = qrData.qrCodeUrl
    } catch (error) {
      console.error("Error downloading QR code:", error)
      alert("Failed to download QR code. Please try again.")
    }
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* UPDATE: Thêm class 'flex' để StaffSidebar bên trong tự động giãn full chiều cao */}
      <div className="print:hidden h-full flex-shrink-0 flex">
        <StaffSidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="print:hidden">
          <StaffHeader />
        </div>

        <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 p-6">
          {isLoading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading QR code...</p>
              </div>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center bg-white p-8 rounded-lg shadow-md border border-gray-100">
                <p className="text-red-500 font-semibold mb-4">{error}</p>
                <Link
                  href="/staff/needs-production"
                  className="inline-flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="mb-8 flex items-center justify-between print:hidden">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">QR Code View</h1>
                  <p className="text-gray-500 mt-1">Order Detail #{orderDetailId}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleDownloadQR}
                    className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center gap-2 shadow-sm"
                  >
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
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Download QR
                  </button>
                  <button
                    onClick={handlePrint}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2 shadow-sm"
                  >
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
                      <polyline points="6 9 6 2 18 2 18 9" />
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                      <rect x="6" y="14" width="12" height="8" />
                    </svg>
                    Print
                  </button>
                  <Link
                    href="/staff/needs-production"
                    className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Back
                  </Link>
                </div>
              </div>

              {qrData && (
                <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
                  <div className="mb-6 flex justify-center">
                    <canvas ref={canvasRef} className="border border-gray-200 rounded-lg" />
                  </div>

                  <div className="flex justify-center mb-6">
                    <div className="border-4 border-gray-200 rounded-xl p-4 bg-white">
                      <img
                        src={qrData.qrCodeUrl || "/placeholder.svg"}
                        alt={`QR Code for ${qrData.orderCode}`}
                        className="w-96 h-96 object-contain"
                      />
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-6 mt-6">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Order Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1 font-medium">Order Code</p>
                        <p className="text-lg font-bold text-gray-800 font-mono">{qrData.orderCode}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1 font-medium">Order Detail ID</p>
                        <p className="text-lg font-bold text-gray-800">{qrData.orderDetailId}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1 font-medium">Product Name</p>
                        <p className="text-lg font-bold text-gray-800">{qrData.productName}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <p className="text-sm text-gray-500 mb-1 font-medium">Quantity</p>
                        <p className="text-lg font-bold text-gray-800">{qrData.quantity}</p>
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
          body {
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  )
}