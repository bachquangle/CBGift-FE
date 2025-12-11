"use client"

import { useState, useRef } from "react"
import { Upload, Download, AlertCircle, Image as ImageIcon, Wand2, CircleCheck, Trash2, Sliders, Info } from "lucide-react"
import apiClient from "../../../lib/apiClient" 
import DesignerHeader from "@/components/layout/designer/header"
import DesignerSidebar from "@/components/layout/designer/sidebar"

// Import Options từ file options.js
import { STYLE_OPTIONS, QUALITY_OPTIONS } from "../../../lib/options"

const OptionButton = ({ label, onClick, isSelected }) => (
  <button
    type="button"
    onClick={onClick}
    className={`relative flex-1 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 border whitespace-nowrap
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
  const [currentPage, setCurrentPage] = useState("ai-studio")

  // --- Main State ---
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [generatedImageUrl, setGeneratedImageUrl] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const fileInputRef = useRef(null)

  // --- Settings ---
  // Mặc định chọn chế độ đầu tiên (Ảnh thật)
  const [selectedStyle, setSelectedStyle] = useState(STYLE_OPTIONS[0].id)
  const [selectedQuality, setSelectedQuality] = useState(QUALITY_OPTIONS[0].value)
  const [controlStrength, setControlStrength] = useState(0.7) 

  // --- Form Data ---
  const [profDetails, setProfDetails] = useState({
    name: "",
    gender: "female",
    career: "",
    outfit: "",
  })

  const [freestylePrompt, setFreestylePrompt] = useState("")

  // --- Handlers ---
  const handleDetailsChange = (e) => {
    const { name, value } = e.target
    setProfDetails(prev => ({ ...prev, [name]: value }))
  }

  const handleFileSelect = (file) => {
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn một tệp hình ảnh hợp lệ.")
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Dung lượng ảnh quá lớn. Vui lòng chọn ảnh dưới 10MB.")
      return;
    }
    setSelectedFile(file)
    setError("")
    setGeneratedImageUrl("")
    const reader = new FileReader()
    reader.onload = (e) => setPreviewUrl(e.target?.result)
    reader.readAsDataURL(file)
  }

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl("");
    setGeneratedImageUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleDragOver = (e) => e.preventDefault()
  
  const handleDrop = (e) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) handleFileSelect(files[0])
  }

  const handleGenerateImage = async (e) => {
    e.preventDefault()
    
    if (!selectedFile) {
      setError("Vui lòng tải lên một hình ảnh để bắt đầu.")
      return
    }

    let finalPrompt = ""
    let apiStylePreset = "photographic" // Giá trị mặc định

    // LOGIC: Nếu không phải Freestyle thì dùng form nhập liệu (Professional hoặc Toy)
    if (selectedStyle !== "freestyle") {
      const { name, career, gender, outfit } = profDetails;

      if (!career.trim() || !name.trim()) {
        setError("Vui lòng nhập Tên và Nghề nghiệp.")
        return
      }

      const genderText = gender === 'male' ? 'man' : 'woman'

      // --- TRƯỜNG HỢP 1: ẢNH THẬT (Professional) ---
      if (selectedStyle === "professional") {
          const outfitText = outfit.trim() || `professional ${career} uniform`
          finalPrompt = `A high-quality professional portrait of a ${genderText} working as a ${career}. The person is named ${name}, wearing ${outfitText}, standing confidently in a modern workplace environment appropriate for a ${career}. Cinematic lighting, 8k resolution, photorealistic, sharp focus, highly detailed texture.`
          apiStylePreset = "photographic"
      }
      
      // --- TRƯỜNG HỢP 2: ĐỒ CHƠI 3D (Toy) ---
      else if (selectedStyle === "toy") {
          const outfitText = outfit.trim() || `${career} outfit`
          // Prompt Blister Pack
          finalPrompt = `A 3D cute action figure of a ${genderText} working as a ${career}, inside a blister pack toy packaging. The packaging card says "${name.toUpperCase()}" at the top and "${career.toUpperCase()}" below. The figure is made of plastic, wearing ${outfitText}. Smooth 3D rendering, plastic texture, studio lighting, product photography, vivid colors, 3d style.`
          apiStylePreset = "3d-model"
      }
    
    } else {
      // --- TRƯỜNG HỢP 3: FREESTYLE ---
      if (!freestylePrompt.trim()) {
        setError("Vui lòng nhập câu lệnh mô tả.")
        return
      }
      finalPrompt = freestylePrompt
      apiStylePreset = "digital-art" // Hoặc để trống để AI tự quyết
    }

    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("ImageFile", selectedFile)
      formData.append("Prompt", finalPrompt)
      formData.append("Style", apiStylePreset) 
      formData.append("Quality", selectedQuality)
      formData.append("ControlStrength", controlStrength.toString())

      const response = await fetch(`${apiClient.defaults.baseURL}/api/AiStudio/generate`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => null)
        throw new Error(errData?.message || `Lỗi API: ${response.status}`)
      }

      const data = await response.json()
      const imageUrl = data?.image || data?.imageUrl
      
      if (!imageUrl) throw new Error("Không nhận được dữ liệu ảnh từ server.")
      setGeneratedImageUrl(imageUrl)
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.")
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
      const ext = selectedQuality === 'Standard' ? 'jpg' : 'png'
      a.download = `ai-gen-${selectedStyle}-${new Date().getTime()}.${ext}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch {
      setError("Không thể tải xuống hình ảnh.")
    }
  }

  return (
    <div className="flex h-screen bg-neutral-bg">
      <DesignerSidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <DesignerHeader />

        <main className="flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-bg">
          <div className="mx-auto max-w-7xl">
            <div className="relative mb-6 flex items-center justify-center text-center">
              <h1 className="text-3xl sm:text-4xl font-bold text-purple-primary">
                <span className="text-teal-accent">*</span> AI Studio <span className="text-teal-accent">*</span>
              </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* === CỘT TRÁI (INPUT) === */}
              <div className="flex flex-col gap-6">
                
                {/* 1. Upload */}
                <div className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm">
                  <h2 className="mb-4 text-lg font-semibold text-purple-900">1. Tải ảnh gốc</h2>
                  <div
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => !selectedFile && fileInputRef.current?.click()}
                    className={`relative flex min-h-[200px] flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all 
                      ${selectedFile ? 'border-purple-300 bg-purple-50' : 'border-teal-300 bg-teal-50 hover:border-teal-400 hover:bg-teal-100 cursor-pointer'}`}
                  >
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} className="hidden" />
                    
                    {previewUrl ? (
                      <div className="relative w-full h-full flex flex-col items-center group">
                        <img src={previewUrl} alt="Preview" className="max-h-64 w-full rounded-lg object-contain" />
                        <button 
                          onClick={handleRemoveFile}
                          className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-red-100 text-red-500 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100"
                          title="Xóa ảnh"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mb-3 h-10 w-10 text-teal-400" />
                        <p className="font-medium text-purple-900">Click để tải ảnh hoặc kéo thả</p>
                        <p className="text-xs text-slate-400 mt-1">Hỗ trợ JPG, PNG (Tối đa 10MB)</p>
                      </>
                    )}
                  </div>
                </div>

                {/* 2. Controls Form */}
                <form onSubmit={handleGenerateImage} className="rounded-2xl border border-teal-200 bg-white p-5 shadow-sm space-y-6">
                  
                  {/* STYLE MODE */}
                  <div>
                    <label className="block text-sm font-semibold text-purple-900 mb-3">
                      2. Chọn chế độ
                    </label>
                    <div className="flex flex-col sm:flex-row gap-3">
                      {STYLE_OPTIONS.map((style) => (
                        <OptionButton
                          key={style.id}
                          label={style.label}
                          onClick={() => setSelectedStyle(style.id)}
                          isSelected={selectedStyle === style.id}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-slate-500 italic flex items-center gap-1">
                      <Info className="w-3 h-3"/> {STYLE_OPTIONS.find(s => s.id === selectedStyle)?.description}
                    </p>
                  </div>

                  {/* FORM FIELDS - DYNAMIC */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    {/* Nếu chọn Real hoặc Toy thì hiện form nhập liệu */}
                    {selectedStyle !== "freestyle" ? (
                      <>
                        <label className="block text-sm font-semibold text-purple-900 mb-4 border-b pb-2">
                          3. Thông tin nhân vật {selectedStyle === 'toy' ? '(Mô hình)' : ''}
                        </label>
                        
                        <div className="space-y-4">
                          <div className="flex gap-4">
                            <div className="flex-1">
                                <span className="text-xs font-bold text-slate-600 uppercase mb-1 block">Tên nhân vật *</span>
                                <input
                                  type="text"
                                  name="name"
                                  value={profDetails.name}
                                  onChange={handleDetailsChange}
                                  placeholder={selectedStyle === 'toy' ? "VD: Iron Man" : "VD: Nguyen Van A"}
                                  className="w-full rounded-lg border border-teal-200 p-2 text-sm focus:border-purple-primary outline-none"
                                />
                            </div>
                            <div className="w-1/3">
                                <span className="text-xs font-bold text-slate-600 uppercase mb-1 block">Giới tính</span>
                                <select 
                                  name="gender"
                                  value={profDetails.gender}
                                  onChange={handleDetailsChange}
                                  className="w-full rounded-lg border border-teal-200 p-2 text-sm focus:border-purple-primary outline-none bg-white"
                                >
                                  <option value="female">Nữ</option>
                                  <option value="male">Nam</option>
                                </select>
                            </div>
                          </div>

                          <div>
                            <span className="text-xs font-bold text-slate-600 uppercase mb-1 block">Nghề nghiệp / Vai trò *</span>
                            <input
                              type="text"
                              name="career"
                              value={profDetails.career}
                              onChange={handleDetailsChange}
                              placeholder="VD: Doctor, Police, Engineer..."
                              className="w-full rounded-lg border border-teal-200 p-2 text-sm focus:border-purple-primary outline-none"
                            />
                          </div>

                          <div>
                             <span className="text-xs font-bold text-slate-600 uppercase mb-1 block">Trang phục (Tùy chọn)</span>
                             <input 
                                type="text" 
                                name="outfit" 
                                value={profDetails.outfit} 
                                onChange={handleDetailsChange} 
                                placeholder="VD: White coat, Blue uniform..." 
                                className="w-full rounded-lg border border-teal-200 p-2 text-sm focus:border-purple-primary outline-none" 
                             />
                          </div>
                        </div>
                      </>
                    ) : (
                      // Nếu chọn Freestyle thì hiện Textarea
                      <>
                      <label className="block text-sm font-semibold text-purple-900 mb-2">
                        3. Nhập câu lệnh (Prompt)
                      </label>
                      
                      <textarea
                        value={freestylePrompt}
                        onChange={(e) => setFreestylePrompt(e.target.value)}
                        placeholder="Nhập mô tả bằng TIẾNG ANH. Ví dụ: 'A cute cat sitting on the moon, cinematic lighting, 8k resolution...'"
                        rows={6}
                        className="w-full rounded-lg border border-teal-200 p-3 text-sm text-purple-900 focus:border-purple-primary outline-none"
                      />
                    
                      {/* PHẦN CẢNH BÁO NHẤN MẠNH */}
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                        <Info className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-red-700">
                          <span className="font-bold">LƯU Ý QUAN TRỌNG:</span>
                          <p className="text-xs mt-1 text-red-600">
                            Hệ thống chỉ nhận diện tốt nhất với mô tả bằng <span className="font-bold underline uppercase">TIẾNG ANH</span>. Vui lòng không sử dụng tiếng Việt.
                          </p>
                        </div>
                      </div>
                    </>
                    )}
                  </div>

                  {/* ADVANCED SETTINGS */}
                  <div className="space-y-4">
                     <label className="block text-sm font-semibold text-purple-900">4. Cấu hình nâng cao</label>
                     
                     {/* Slider Control Strength */}
                     <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                        <div className="flex justify-between items-center mb-2">
                           <div className="flex items-center gap-2 text-purple-900 font-medium text-sm">
                              <Sliders className="w-4 h-4" /> Độ giống ảnh gốc
                           </div>
                           <span className="text-purple-700 font-bold text-sm bg-purple-200 px-2 py-0.5 rounded text-xs">
                             {controlStrength}
                           </span>
                        </div>
                        <input 
                           type="range" 
                           min="0.1" 
                           max="1.0" 
                           step="0.05"
                           value={controlStrength}
                           onChange={(e) => setControlStrength(parseFloat(e.target.value))}
                           className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-primary"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1 uppercase font-semibold">
                           <span>Sáng tạo</span>
                           <span>Cân bằng (0.7)</span>
                           <span>Y hệt</span>
                        </div>
                     </div>

                     <div className="flex flex-wrap gap-4">
                        {/* Tỷ lệ (Disabled) */}
                        <div className="flex-1 min-w-[150px] opacity-60">
                           <label className="block text-xs font-bold text-slate-500 mb-2">Tỷ lệ khung hình</label>
                           <div className="relative">
                               <select 
                                  disabled
                                  value="Auto"
                                  className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-slate-100 text-slate-400 cursor-not-allowed outline-none appearance-none"
                               >
                                  <option value="Auto">Tự động (Giữ nguyên)</option>
                               </select>
                               <div className="mt-1 flex gap-1 items-center text-[10px] text-slate-500">
                                  <Info className="w-3 h-3"/> Giữ nguyên cỡ ảnh gốc
                               </div>
                           </div>
                        </div>
                        
                        {/* Chất lượng */}
                        <div className="flex-1 min-w-[150px]">
                           <label className="block text-xs font-bold text-slate-500 mb-2">Chất lượng</label>
                           <select 
                              value={selectedQuality}
                              onChange={(e) => setSelectedQuality(e.target.value)}
                              className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-purple-primary outline-none"
                           >
                              {QUALITY_OPTIONS.map(opt => (
                                 <option key={opt.id} value={opt.value}>{opt.label}</option>
                              ))}
                           </select>
                        </div>
                     </div>
                  </div>
                  
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2 items-center text-sm text-red-700 animate-pulse">
                      <AlertCircle className="w-4 h-4" /> {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={!selectedFile || isLoading}
                    className="w-full rounded-full bg-purple-primary py-4 font-bold text-white shadow-lg hover:bg-purple-700 disabled:opacity-50 flex justify-center items-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99]"
                  >
                    {isLoading ? <span className="animate-spin">⏳</span> : <Wand2 className="w-5 h-5"/>}
                    {isLoading ? "Đang xử lý..." : "Tạo ảnh ngay"}
                  </button>
                </form>
              </div>

              {/* === CỘT PHẢI (RESULT) === */}
              <div className="flex flex-col gap-6">
                <div className="sticky top-8 rounded-2xl border border-teal-200 bg-white p-5 shadow-sm min-h-[500px] flex flex-col h-full">
                  <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
                    Kết quả 
                    {generatedImageUrl && <span className="text-xs font-normal text-teal-600 bg-teal-50 px-2 py-1 rounded-full">Hoàn thành</span>}
                  </h3>
                  
                  <div className="flex-1 relative w-full rounded-xl bg-teal-50 border-2 border-dashed border-teal-200 overflow-hidden flex items-center justify-center min-h-[400px]">
                    {isLoading ? (
                      <div className="text-center p-6 flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-purple-800 font-bold text-lg">Đang AI xử lý...</p>
                        <p className="text-sm text-slate-500 mt-2">
                           {selectedStyle === 'toy' ? 'Đang tạo mô hình đồ chơi...' : 'Đang biến hình ảnh...'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">Vui lòng đợi 10-20 giây</p>
                      </div>
                    ) : generatedImageUrl ? (
                      <img 
                        src={generatedImageUrl} 
                        alt="Result" 
                        className="w-full h-full object-contain animate-in fade-in duration-500" 
                      />
                    ) : (
                      <div className="text-center text-slate-400">
                        <ImageIcon className="w-16 h-16 mx-auto mb-3 opacity-30"/>
                        <p className="font-medium">Chưa có kết quả</p>
                        <p className="text-xs mt-1">Ảnh sau khi xử lý sẽ hiện ở đây</p>
                      </div>
                    )}
                  </div>

                  {generatedImageUrl && !isLoading && (
                    <div className="mt-4 animate-in slide-in-from-bottom-2">
                      <button 
                        onClick={handleDownload} 
                        className="w-full py-3 bg-teal-accent text-white rounded-full font-bold hover:bg-teal-600 flex justify-center items-center gap-2 shadow-md transition-all hover:shadow-lg"
                      >
                        <Download className="w-5 h-5"/> Tải ảnh xuống
                      </button>
                    </div>
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
