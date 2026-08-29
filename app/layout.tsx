import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import Navbar from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChefAir Kit",
  description:
    "เครื่องมือสำหรับคำนวณสูตร ต้นทุน จัดการวัตถุดิบ โภชนาการ และ QR Code สำหรับร้านอาหารและธุรกิจ",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50">
        <Navbar />

        <div className="flex-1">
          {children}
        </div>
      </body>
    </html>
  );
}