"use client"

import { useState, useEffect, useRef } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import apiClient from "../../../../lib/apiClient";

export default function QrCodePage() {
  const params = useParams()
  const orderDetailId = params.orderDetailId

  const [qrData, setQrData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const canvasRef = useRef(null)
  const downloadCanvasRef = useRef(null)

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

      const padding = 40
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading QR code...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-md">
          <p className="text-red-500 font-semibold mb-4">{error}</p>
          <Link
            href="/staff/dashboard"
            className="inline-flex items-center bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8 flex items-center justify-between print:hidden">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">QR Code View</h1>
            <p className="text-gray-500 mt-1">Order Detail #{orderDetailId}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleDownloadQR}
              className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors flex items-center gap-2"
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
              className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors flex items-center gap-2"
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
              href="/staff/dashboard"
              className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors"
            >
              Back
            </Link>
          </div>
        </div>

        {qrData && (
          <div className="bg-white rounded-lg shadow-lg p-8 border border-gray-200">
            <div className="mb-6 flex justify-center">
              <canvas ref={canvasRef} className="border border-gray-300 rounded-lg" />
            </div>

            <div className="flex justify-center mb-6">
              <div className="border-4 border-gray-300 rounded-lg p-4 bg-white">
                <img
                  src={qrData.qrCodeUrl || "/placeholder.svg"}
                  alt={`QR Code for ${qrData.orderCode}`}
                  className="w-96 h-96"
                />
              </div>
            </div>

            <div className="border-t border-gray-200 pt-6 mt-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Order Code</p>
                  <p className="text-lg font-semibold text-gray-800">{qrData.orderCode}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Order Detail ID</p>
                  <p className="text-lg font-semibold text-gray-800">{qrData.orderDetailId}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Product Name</p>
                  <p className="text-lg font-semibold text-gray-800">{qrData.productName}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Quantity</p>
                  <p className="text-lg font-semibold text-gray-800">{qrData.quantity}</p>
                </div>
              </div>
            </div>
          </div>
        )}
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
