"use client";

import Navbar from "@/components/navbar";
import Link from "next/link";
import {
  Calculator,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
  PackageSearch,
  Scale,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      <main className="py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-3 py-1 rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          เครื่องมือสำหรับนักเรียนของเชฟแอร์ และพ่อค้าแม่ค้าออนไลน์
        </div>

        {/* Hero */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">
          ชุดเครื่องมือสำหรับนักเรียน เชฟแอร์ <br />
          <span className="text-amber-500">ChefAir Kit</span>
        </h1>

        <p className="text-slate-500 max-w-xl mx-auto mb-10 text-sm sm:text-base">
          เครื่องมือสำหรับคำนวณสูตร ต้นทุน จัดการวัตถุดิบ
          โภชนาการ และสร้าง QR Code สำหรับงานอาหารและธุรกิจ
        </p>

        {/* Program Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-left mb-16">
          {/* Recipe Calculator */}
          <Link
            href="/recipe-calculator"
            className="sm:col-span-2 bg-white p-6 sm:p-7 rounded-2xl shadow-sm border border-amber-200 hover:border-amber-400 hover:shadow-md transition group"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="bg-amber-50 p-4 rounded-2xl text-amber-600 w-fit shrink-0">
                <Scale className="w-7 h-7" />
              </div>

              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h2 className="text-xl font-extrabold text-slate-800 group-hover:text-amber-600 transition">
                    เครื่องคำนวณสูตรอาหาร
                  </h2>

                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full">
                    ใช้ฟรี
                  </span>

                  <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2.5 py-1 rounded-full">
                    ใหม่
                  </span>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  ย่อหรือขยายสูตร คูณสูตร
                  ปรับตามน้ำหนัก Yield หรือจำนวนเสิร์ฟ
                  แล้วคำนวณวัตถุดิบทุกตัวให้อัตโนมัติ
                </p>
              </div>

              <div className="flex items-center gap-1 text-xs font-bold text-amber-600 shrink-0">
                เริ่มคำนวณ
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
              </div>
            </div>
          </Link>

          {/* Cost */}
          <Link
            href="/cost"
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-amber-300 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="bg-amber-50 p-3 rounded-xl text-amber-600 w-fit">
                  <Calculator className="w-6 h-6" />
                </div>

                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full">
                  ใช้ฟรี
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition">
                คำนวณต้นทุนอาหาร & ขนม
              </h2>

              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                คิดต้นทุนวัตถุดิบต่อกรัม ต่อชิ้น และต่อ Yield
                เพื่อช่วยกำหนดต้นทุนสำหรับการขาย
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
              เริ่มใช้งาน
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* QR */}
          <Link
            href="/qr"
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-amber-300 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="bg-amber-50 p-3 rounded-xl text-amber-600 w-fit">
                  <QrCode className="w-6 h-6" />
                </div>

                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full">
                  ใช้ฟรี
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition">
                สร้าง QR Code หน้าร้าน
              </h2>

              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                สร้าง QR Code สำหรับเพจ ร้านค้า เมนูอาหาร WiFi
                พร้อมเพย์ และข้อมูลติดต่อ
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
              เริ่มใช้งาน
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Recipes */}
          <Link
            href="/recipes"
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-amber-300 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="bg-amber-50 p-3 rounded-xl text-amber-600 w-fit">
                  <BookOpen className="w-6 h-6" />
                </div>

                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  สำหรับสมาชิก
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition">
                สูตรของฉัน
              </h2>

              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                บันทึกสูตร คำนวณต้นทุน ย่อ-ขยายสูตร
                วางแผนการผลิต รายการซื้อวัตถุดิบ
                และข้อมูลโภชนาการ
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
              เปิดสูตรของฉัน
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Ingredients */}
          <Link
            href="/ingredients"
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:border-amber-300 hover:shadow-md transition group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="bg-amber-50 p-3 rounded-xl text-amber-600 w-fit">
                  <PackageSearch className="w-6 h-6" />
                </div>

                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                  สำหรับสมาชิก
                </span>
              </div>

              <h2 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-amber-600 transition">
                คลังวัตถุดิบ
              </h2>

              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                บันทึกราคา ขนาดแพ็ก แบรนด์ และข้อมูลโภชนาการ
                เพื่อใช้ข้อมูลเดียวกันกับหลายสูตร
              </p>
            </div>

            <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
              เปิดคลังวัตถุดิบ
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>

        {/* Features */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm text-left">
          <h3 className="text-sm font-bold text-slate-800 mb-4 text-center">
            ทำไมต้องใช้งาน ChefAir Kit?
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-600">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />

              <div>
                <strong className="text-slate-800 block mb-0.5">
                  มีเครื่องมือใช้ฟรี
                </strong>
                เครื่องมือพื้นฐานสามารถเปิดใช้ได้ทันที
                โดยไม่ต้องสมัครสมาชิก
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />

              <div>
                <strong className="text-slate-800 block mb-0.5">
                  เก็บงานไว้ในบัญชี
                </strong>
                สมาชิกสามารถบันทึกสูตร วัตถุดิบ ราคา
                และกลับมาใช้งานต่อได้
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />

              <div>
                <strong className="text-slate-800 block mb-0.5">
                  ออกแบบสำหรับงานอาหาร
                </strong>
                ใช้งานได้ทั้งบนมือถือ แท็บเล็ต
                และคอมพิวเตอร์
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}