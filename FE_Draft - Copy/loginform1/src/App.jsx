// "use client"

// import { useState } from "react"
// import "./App.css"

// function App() {
//   const [email, setEmail] = useState("")
//   const [password, setPassword] = useState("")
//   const [rememberMe, setRememberMe] = useState(false)

//   const handleSubmit = (e) => {
//     e.preventDefault()
//     console.log("Login attempt:", { email, password, rememberMe })
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 flex">
//       {/* Left side - Login Form */}
//       <div className="w-1/2 bg-white p-12 flex flex-col justify-center">
//         <div className="max-w-md mx-auto w-full">
//           {/* Logo */}
//           <div className="mb-8">
//             <div className="w-8 h-8 bg-teal-400 rounded-lg mb-6"></div>
//             <h1 className="text-3xl font-bold text-gray-900 mb-2">Login</h1>
//             <p className="text-gray-600">See your growth and get support!</p>
//           </div>

//           <form onSubmit={handleSubmit} className="space-y-6">
//             {/* Google Sign In Button */}
//             <button
//               type="button"
//               className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-full bg-white text-gray-700 hover:bg-gray-50 transition-colors"
//             >
//               <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
//                 <path
//                   fill="#4285F4"
//                   d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
//                 />
//                 <path
//                   fill="#34A853"
//                   d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
//                 />
//                 <path
//                   fill="#FBBC05"
//                   d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
//                 />
//                 <path
//                   fill="#EA4335"
//                   d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
//                 />
//               </svg>
//               Sign in with google
//             </button>

//             {/* Email Field */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Email*</label>
//               <input
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 placeholder="Enter your email"
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
//                 required
//               />
//             </div>

//             {/* Password Field */}
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-2">Password*</label>
//               <input
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 placeholder="minimum 8 characters"
//                 className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50"
//                 required
//                 minLength={8}
//               />
//             </div>

//             {/* Remember Me & Forgot Password */}
//             <div className="flex items-center justify-between">
//               <label className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={rememberMe}
//                   onChange={(e) => setRememberMe(e.target.checked)}
//                   className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
//                 />
//                 <span className="ml-2 text-sm text-gray-700">Remember me</span>
//               </label>
//               <a href="#" className="text-sm text-gray-600 hover:text-gray-800">
//                 Forgot password?
//               </a>
//             </div>

//             {/* Login Button */}
//             <button
//               type="submit"
//               className="w-full bg-gray-900 text-white py-3 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium"
//             >
//               Login
//             </button>

//             {/* Sign Up Link */}
//             <p className="text-center text-sm text-gray-600">
//               Not registered yet?{" "}
//               <a href="#" className="text-gray-900 hover:underline">
//                 Create a new account
//               </a>
//             </p>
//           </form>
//         </div>
//       </div>

//       {/* Right side - Illustration */}
//       <div className="w-1/2 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-12">
//         <div className="relative w-full h-full max-w-2xl">
//           {/* 3D Isometric Illustration */}
//           <div className="absolute inset-0 flex items-center justify-center">
//             <img
//               src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-Lk5b3oNoZ72XsEiTFBlpZkaSEcaesw.png"
//               alt="3D Isometric illustration showing people working with data visualization and digital platforms"
//               className="w-full h-auto max-w-lg object-contain"
//             />
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }

// export default App
