"use client"

import { useState, useRef } from "react"
import { Upload, Download, AlertCircle, Image as ImageIcon, Wand2, CircleCheck } from "lucide-react"
import apiClient from "../../../lib/apiClient";

// --- IMPORT COMPONENT LAYOUT ---
import DesignerHeader from "@/components/layout/designer/header";
import DesignerSidebar from "@/components/layout/designer/sidebar";

import {
  STYLE_OPTIONS,
  CHIBI_CONCEPTS,
  ANIME_CONCEPTS,
  PROFESSIONAL_CONCEPTS,
  ASPECT_RATIO_OPTIONS,
  QUALITY_OPTIONS,
} from "../../../lib/options"

// Helper component
const OptionButton = ({ label, onClick, isSelected }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 border
      ${
        isSelected
          ? "bg-purple-primary border-purple-primary text-white shadow-md"
          : "bg-white border-teal-200 text-purple-800 hover:bg-teal-50"
      }`}
  >
    {label}
    {isSelected && (
      <CircleCheck className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-white text-purple-primary" />
    )}
  </button>
)

export default function Home() {
  // --- State cho Layout ---
  // Bạn có thể đặt tên ID này khớp với menu trong Sidebar để nó highlight
  const [currentPage, setCurrentPage] = useState("ai-studio"); 

  // --- State Logic cũ ---
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const fileInputRef = useRef(null)
  const [generatedImageUrl, setGeneratedImageUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedStyle, setSelectedStyle] = useState(STYLE_OPTIONS[0].id) 
  const [selectedConcept, setSelectedConcept] = useState("")
  const [selectedConceptPrompt, setSelectedConceptPrompt] = useState("")
  const [customPosePrompt, setCustomPosePrompt] = useState("")
  const [overridePrompt, setOverridePrompt] = useState("")
  const [selectedAspectRatio, setSelectedAspectRatio] = useState(ASPECT_RATIO_OPTIONS[0].value)
  const [selectedQuality, setSelectedQuality] = useState(QUALITY_OPTIONS[0].value)

  // --- Logic Handlers (Giữ nguyên) ---
  const handleFileSelect = (file) => {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn một tệp hình ảnh hợp lệ.")
      return
    }
    setSelectedFile(file)
    setError("")
    setGeneratedImageUrl("")
    const reader = new FileReader()
    reader.onload = (e) => setPreviewUrl(e.target?.result)
    reader.readAsDataURL(file)
  }
  const handleDragOver = (e) => e.preventDefault()
  const handleDrop = (e) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) handleFileSelect(files[0])
  }
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
  }
  const handleStyleSelect = (styleId) => {
    setSelectedStyle(styleId)
    setSelectedConcept("")
    setSelectedConceptPrompt("")
  }
  const getCurrentConcepts = () => {
    if (selectedStyle === "chibi") return CHIBI_CONCEPTS
    if (selectedStyle === "anime") return ANIME_CONCEPTS
    if (selectedStyle === "professional") return PROFESSIONAL_CONCEPTS
    return []
  }
  const handleConceptSelect = (concept) => {
    setSelectedConcept(concept.id)
    setSelectedConceptPrompt(concept.value)
    setOverridePrompt("")
  }
  const handleOverridePromptChange = (e) => {
    setOverridePrompt(e.target.value)
    setSelectedConcept("")
    setSelectedConceptPrompt("")
  }
  const handleGenerateImage = async (e) => {
    e.preventDefault()
    if (!selectedFile) {
      setError("Vui lòng tải lên một hình ảnh để bắt đầu.")
      return
    }
    let finalPrompt = ""
    if (overridePrompt) {
      finalPrompt = overridePrompt
    } else if (selectedConceptPrompt) {
      finalPrompt = `${selectedConceptPrompt} ${customPosePrompt}`.trim()
    } else {
      finalPrompt = customPosePrompt
    }
    if (!finalPrompt && !overridePrompt) {
      setError("Vui lòng chọn một concept hoặc tự viết câu lệnh mô tả.")
      return
    }
    setIsLoading(true)
    setError("")
    try {
      const formData = new FormData()
      formData.append("ImageFile", selectedFile)
      formData.append("Prompt", finalPrompt || selectedConceptPrompt)
      formData.append("Style", selectedStyle) 
      formData.append("AspectRatio", selectedAspectRatio)
      formData.append("Quality", selectedQuality)
      
      const response = await fetch(`${apiClient.defaults.baseURL}/api/AiStudio/generate`, {
        method: "POST",
        body: formData,
      })

      if (response.status === 401 || response.status === 403) {
        throw new Error("Lỗi xác thực. API key của AI có thể đã hết hạn hoặc vượt giới hạn.")
      }
      if (!response.ok) {
        const errData = await response.json().catch(() => null)
        throw new Error(errData?.message || `Lỗi API: ${response.status}`)
      }
      const data = await response.json()
      const imageUrl = data?.image || data?.imageUrl
      if (!imageUrl) throw new Error("Không nhận được kết quả từ server.")
      setGeneratedImageUrl(imageUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.")
      setGeneratedImageUrl("")
    } finally {
      setIsLoading(false)
    }
  }
  const handleDownload = async () => {
    if (!generatedImageUrl) return

    try {
      const response = await fetch(generatedImageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "ai-generated-image.png"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      setError("Không thể tải xuống hình ảnh.")
    }
  }

  // --- GIAO DIỆN JSX CẬP NHẬT ---
  return (
    // Wrapper Layout chính
    <div className="flex h-screen bg-neutral-bg">
      {/* 1. Sidebar bên trái */}
      <DesignerSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      {/* 2. Khu vực nội dung bên phải */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Header ở trên cùng */}
        <DesignerHeader />

        {/* Nội dung chính có thể cuộn (Scrollable Main Content) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-bg">
          <div className="mx-auto max-w-7xl">
            {/* Title Page */}
            <div className="relative mb-6 flex items-center justify-center text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-purple-primary">
                <span className="text-teal-accent">*</span> Trình Tạo Ảnh AI <span className="text-teal-accent">*</span>
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* === CỘT BÊN TRÁI (CÀI ĐẶT) === */}
              <div className="flex flex-col gap-6">
                
                {/* 1. Upload */}
                <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-purple-900">1. Tải ảnh chân dung</h2>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-teal-300 bg-teal-50 p-6 text-center transition-all hover:border-teal-400 hover:bg-teal-100"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                    {previewUrl ? (
                      <img src={previewUrl} alt="Preview" className="max-h-48 w-full rounded-lg object-contain" />
                    ) : (
                      <>
                        <Upload className="mb-3 h-10 w-10 text-teal-400" />
                        <p className="font-medium text-purple-900">Chọn ảnh của bạn hoặc kéo thả vào đây</p>
                        <p className="text-xs text-purple-700">PNG, JPG, WEBP...</p>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Controls */}
                <form onSubmit={handleGenerateImage} className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm space-y-6">
                  
                  {/* CHỌN STYLE CHÍNH */}
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-3">
                      2. Chọn Style Chính
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {STYLE_OPTIONS.map((style) => (
                        <OptionButton
                          key={style.id}
                          label={style.label}
                          onClick={() => handleStyleSelect(style.id)}
                          isSelected={selectedStyle === style.id}
                        />
                      ))}
                    </div>
                  </div>

                  {/* CHỌN CONCEPT CON */}
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-3">
                      3. Chọn Concept Có Sẵn
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {getCurrentConcepts().map((concept) => (
                        <OptionButton
                          key={concept.id}
                          label={concept.label}
                          onClick={() => handleConceptSelect(concept)}
                          isSelected={selectedConcept === concept.id}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Tùy chỉnh thêm */}
                  <div>
                    <label htmlFor="custom-pose" className="block text-sm font-semibold text-purple-900 mb-2">
                      🎨 Tùy chỉnh thêm (tùy chọn)
                    </label>
                    <textarea
                      id="custom-pose"
                      value={customPosePrompt}
                      onChange={(e) => setCustomPosePrompt(e.target.value)}
                      placeholder="Ví dụ: đang mỉm cười, tóc màu xanh, tay cầm hoa..."
                      rows={3}
                      className="w-full rounded-lg border border-teal-200 p-3 text-sm text-purple-900 placeholder-teal-400 focus:border-purple-primary focus:ring-purple-primary"
                    />
                  </div>
                  
                  {/* Hoặc viết câu lệnh */}
                  <div>
                    <label htmlFor="override-prompt" className="block text-sm font-semibold text-purple-900 mb-2">
                      ✍️ Hoặc viết câu lệnh riêng của bạn
                    </label>
                    <textarea
                      id="override-prompt"
                      value={overridePrompt}
                      onChange={handleOverridePromptChange}
                      placeholder="Mô tả ảnh bạn muốn tạo... (Nếu điền, các lựa chọn bên trên sẽ bị bỏ qua)"
                      rows={3}
                      className="w-full rounded-lg border border-teal-200 p-3 text-sm text-purple-900 placeholder-teal-400 focus:border-purple-primary focus:ring-purple-primary"
                    />
                  </div>

                  {/* Tỷ Lệ & Chất Lượng */}
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-3">
                      4. Tùy chọn khác
                    </label>
                    <div className="flex flex-wrap gap-6">
                      <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-medium text-purple-800 mb-2">Tỷ Lệ Ảnh</label>
                        <div className="flex flex-wrap gap-2">
                          {ASPECT_RATIO_OPTIONS.map((option) => (
                            <OptionButton
                              key={option.id}
                              label={option.label}
                              onClick={() => setSelectedAspectRatio(option.value)}
                              isSelected={selectedAspectRatio === option.value}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 min-w-[150px]">
                          <label className="block text-xs font-medium text-purple-800 mb-2">Chất Lượng</label>
                        <div className="flex flex-wrap gap-2">
                          {QUALITY_OPTIONS.map((option) => (
                            <OptionButton
                              key={option.id}
                              label={option.label}
                              onClick={() => setSelectedQuality(option.value)}
                              isSelected={selectedQuality === option.value}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Error & Nút Tạo Ảnh */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={!selectedFile || isLoading}
                    className="w-full rounded-full bg-purple-primary py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-purple-700 active:scale-95 disabled:cursor-not-allowed disabled:bg-purple-300 flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <><div className="animate-spin"><Wand2 className="w-5 h-5" /></div><span>Đang tạo...</span></>
                    ) : (
                      <><Wand2 className="w-5 h-5" /><span>Tạo ảnh ngay</span></>
                    )}
                  </button>

                </form>
              </div>

              {/* === CỘT BÊN PHẢI (KẾT QUẢ) === */}
              <div className="sticky top-8 flex flex-col gap-6">
                <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm">
                  <h3 className="text-lg font-semibold text-purple-900 mb-4">Kết quả</h3>
                  <div className="relative w-full aspect-square rounded-xl bg-teal-50 border-2 border-dashed border-teal-200 overflow-hidden">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center h-full gap-4">
                        <div className="relative w-16 h-16">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-teal-400 rounded-full animate-spin" />
                          <div className="absolute inset-1 bg-teal-50 rounded-full" />
                          <Wand2 className="absolute inset-0 m-auto w-6 h-6 text-purple-primary" />
                        </div>
                        <p className="text-sm font-medium text-purple-800">Đang biến hóa ảnh của bạn...</p>
                      </div>
                    ) : generatedImageUrl ? (
                      <img src={generatedImageUrl} alt="Generated" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-4">
                        <ImageIcon className="w-12 h-12 text-teal-300 mb-3" />
                        <p className="text-sm font-medium text-purple-800">Tải ảnh lên và chọn style</p>
                        <p className="text-xs text-purple-700 mt-1">để bắt đầu tạo ảnh AI của riêng bạn!</p>
                      </div>
                    )}
                  </div>
                  
                  {generatedImageUrl && !isLoading && (
                    <button
                      onClick={handleDownload}
                      className="w-full mt-4 rounded-full bg-teal-accent py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-teal-600 active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      <span>Tải xuống hình ảnh</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 