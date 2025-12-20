import "./globals.css";
import { Inter } from "next/font/google";
import { SignalRProvider } from "../contexts/SignalRContext"; // 👈 1. Import Provider
import { Toaster } from "@/components/ui/toaster";
const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "CB Gift Fulfillment",
  description: "CB Gift Fulfillment",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={inter.style}>
        {/* 👇 2. Bọc {children} bằng Provider */}
        <SignalRProvider>
          {children}
          <Toaster /> {/* 👈 thêm dòng này nếu chưa có */}
        </SignalRProvider>
      </body>
    </html>
  );
}
