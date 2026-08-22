"use client";

import Navbar from "@/components/navbar";
import Link from "next/link";
import { Calculator, QrCode, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      <main className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center">
        {/* Badge เล็กๆ เพิ่มความน่าสนใจ */}
        <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" /> เครื่องมือฟรีสำหรับนักเรียนของเชฟแอร์ และพ่อค้าแม่ค้าออนไลน์
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">
          ชุดเครื่องมือสำหรับนักเรียน เชฟแอร์ <br />
          <span className="text-amber-500">ChefAir Kit</span>
        </h1>
        <p className="text-slate-500 max-w-lg mx-auto mb-10 text-sm sm:text-base">
          ช่วยคำนวณต้นทุนอาหาร ขนม พร้อมเครื่องมือสร้าง QR Code หน้าร้าน ใช้งานฟรีง่ายๆ บนมือถือ
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left mb-16">
          {/* Card 1: Cost */}
          <Link
            href="/cost"
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-amber-300 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="bg-amber-50 p-3 rounded-xl text-amber-600 w-fit mb-4">
                <Calculator className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition">
                คำนวณต้นทุนอาหาร & ขนม
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                คิดต้นทุนวัตถุดิบต่อกรัม/ต่อชิ้น ตั้งราคาขาย พร้อมค้นหาพิกัดซื้อวัตถุดิบบน Shopee
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
              เริ่มใช้งาน <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Card 2: QR */}
          <Link
            href="/qr"
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-amber-300 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="bg-amber-50 p-3 rounded-xl text-amber-600 w-fit mb-4">
                <QrCode className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition">
                สร้าง QR Code หน้าร้าน
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                สร้าง QR Code สแกนเข้าเพจ ลิงก์ร้านค้า หรือเมนูอาหาร พร้อมเพย์ ปรับแต่งและดาวน์โหลดนำไปใช้งานได้ฟรี
              </p>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
              เริ่มใช้งาน <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>

        {/* เพิ่มส่วนจุดเด่น (เพิ่มความน่าเชื่อถือและช่วยดัน SEO) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-left">
          <h3 className="text-sm font-bold text-slate-800 mb-4 text-center">ทำไมต้องใช้งาน ChefAir Kit?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block mb-0.5">ใช้งานฟรี 100%</strong>
                ไม่มีค่าใช้จ่าย ไม่จำกัดจำนวนครั้งในการใช้งาน
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block mb-0.5">ปลอดภัย เป็นส่วนตัว</strong>
                ระบบประมวลผลบนเครื่อง ไม่เก็บข้อมูลส่วนตัวลงเซิร์ฟเวอร์
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800 block mb-0.5">รองรับมือถือทุกรุ่น</strong>
                ออกแบบมาให้ใช้งานและกดง่ายบนสมาร์ทโฟน
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}