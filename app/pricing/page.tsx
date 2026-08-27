"use client";

import Link from "next/link";
import {
  Check,
  X,
  Sparkles,
  Crown,
  Building2,
  ArrowRight,
} from "lucide-react";

import Navbar from "@/components/navbar";

type FeatureRow = {
  label: string;
  free: string | boolean;
  pro: string | boolean;
  business: string | boolean;
};

const features: FeatureRow[] = [
  {
    label: "คำนวณต้นทุนอาหาร",
    free: true,
    pro: true,
    business: true,
  },
  {
    label: "สร้าง QR Code",
    free: true,
    pro: true,
    business: true,
  },
  {
    label: "บันทึกสูตร",
    free: "สูงสุด 5 สูตร",
    pro: "ไม่จำกัด",
    business: "ไม่จำกัด",
  },
  {
    label: "คลังวัตถุดิบ",
    free: "สูงสุด 30 รายการ",
    pro: "ไม่จำกัด",
    business: "ไม่จำกัด",
  },
  {
    label: "ย่อ / ขยายสูตร",
    free: true,
    pro: true,
    business: true,
  },
  {
    label: "คำนวณโภชนาการ",
    free: true,
    pro: true,
    business: true,
  },
  {
    label: "วางแผนการผลิต",
    free: false,
    pro: true,
    business: true,
  },
  {
    label: "Shopping List",
    free: false,
    pro: true,
    business: true,
  },
  {
    label: "Export PDF",
    free: false,
    pro: true,
    business: true,
  },
  {
    label: "Export Excel",
    free: false,
    pro: true,
    business: true,
  },
  {
    label: "AI Tools",
    free: false,
    pro: "100 ครั้ง / เดือน",
    business: "500 ครั้ง / เดือน",
  },
];

function FeatureValue({
  value,
}: {
  value: string | boolean;
}) {
  if (value === true) {
    return (
      <Check className="w-5 h-5 text-emerald-500 mx-auto" />
    );
  }

  if (value === false) {
    return (
      <X className="w-5 h-5 text-slate-300 mx-auto" />
    );
  }

  return (
    <span className="text-xs font-semibold text-slate-700">
      {value}
    </span>
  );
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        {/* Header */}

        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1.5 rounded-full mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            ChefAir Kit Membership
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800">
            เลือกแพ็กเกจที่เหมาะกับคุณ
          </h1>

          <p className="text-sm sm:text-base text-slate-500 mt-3">
            เริ่มใช้งานเครื่องมือพื้นฐานได้ฟรี
            และอัปเกรดเมื่อคุณต้องการเครื่องมือสำหรับงานที่มากขึ้น
          </p>
        </div>

        {/* Plan Cards */}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* FREE */}

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-2xl flex items-center justify-center mb-5">
              <Sparkles className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-extrabold text-slate-800">
              Free
            </h2>

            <p className="text-xs text-slate-500 mt-1 min-h-[40px]">
              สำหรับทดลองใช้งานและผู้เริ่มต้น
            </p>

            <div className="mt-5">
              <span className="text-4xl font-extrabold text-slate-800">
                ฿0
              </span>

              <span className="text-sm text-slate-400">
                {" "}
                / เดือน
              </span>
            </div>

            <div className="border-t border-slate-100 my-6" />

            <div className="space-y-3 text-sm text-slate-600 flex-1">
              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                คำนวณต้นทุน
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                สร้าง QR Code
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                บันทึกสูตรสูงสุด 5 สูตร
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                วัตถุดิบสูงสุด 30 รายการ
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                คำนวณโภชนาการ
              </div>
            </div>

            <Link
              href="/register"
              className="mt-7 w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-amber-300 text-slate-700 hover:text-amber-600 font-bold py-3 rounded-xl transition text-sm"
            >
              เริ่มใช้ฟรี
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* PRO */}

          <div className="relative bg-white border-2 border-amber-400 rounded-3xl p-6 shadow-md flex flex-col">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-extrabold px-4 py-1.5 rounded-full whitespace-nowrap">
              แนะนำ
            </div>

            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mb-5">
              <Crown className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-extrabold text-slate-800">
              Pro
            </h2>

            <p className="text-xs text-slate-500 mt-1 min-h-[40px]">
              สำหรับร้านอาหาร เชฟ และผู้ประกอบการ
            </p>

            <div className="mt-5">
              <span className="text-3xl font-extrabold text-slate-800">
                เร็ว ๆ นี้
              </span>
            </div>

            <div className="border-t border-slate-100 my-6" />

            <div className="space-y-3 text-sm text-slate-600 flex-1">
              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                สูตรและวัตถุดิบไม่จำกัด
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                วางแผนการผลิต
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                Shopping List
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                Export PDF / Excel
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                AI Tools 100 ครั้ง / เดือน
              </div>
            </div>

            <button
              type="button"
              disabled
              className="mt-7 w-full bg-amber-100 text-amber-600 font-bold py-3 rounded-xl text-sm cursor-not-allowed"
            >
              เปิดให้บริการเร็ว ๆ นี้
            </button>
          </div>

          {/* BUSINESS */}

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col">
            <div className="w-12 h-12 bg-slate-800 text-white rounded-2xl flex items-center justify-center mb-5">
              <Building2 className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-extrabold text-slate-800">
              Business
            </h2>

            <p className="text-xs text-slate-500 mt-1 min-h-[40px]">
              สำหรับธุรกิจที่ต้องการใช้งานในระดับสูง
            </p>

            <div className="mt-5">
              <span className="text-3xl font-extrabold text-slate-800">
                เร็ว ๆ นี้
              </span>
            </div>

            <div className="border-t border-slate-100 my-6" />

            <div className="space-y-3 text-sm text-slate-600 flex-1">
              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                ทุกฟีเจอร์ของ Pro
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                AI Tools 500 ครั้ง / เดือน
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                เตรียมรองรับฟีเจอร์ธุรกิจ
              </div>

              <div className="flex gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                รองรับการขยายระบบในอนาคต
              </div>
            </div>

            <button
              type="button"
              disabled
              className="mt-7 w-full bg-slate-100 text-slate-400 font-bold py-3 rounded-xl text-sm cursor-not-allowed"
            >
              เปิดให้บริการเร็ว ๆ นี้
            </button>
          </div>
        </div>

        {/* Comparison */}

        <section className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-extrabold text-slate-800">
              เปรียบเทียบแพ็กเกจ
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              รายละเอียดนี้ยังสามารถปรับได้ก่อนเปิดระบบสมาชิกแบบชำระเงิน
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left px-6 py-4 font-bold text-slate-700">
                    ฟีเจอร์
                  </th>

                  <th className="px-4 py-4 font-bold text-slate-700">
                    Free
                  </th>

                  <th className="px-4 py-4 font-bold text-amber-600">
                    Pro
                  </th>

                  <th className="px-4 py-4 font-bold text-slate-700">
                    Business
                  </th>
                </tr>
              </thead>

              <tbody>
                {features.map((feature) => (
                  <tr
                    key={feature.label}
                    className="border-t border-slate-100"
                  >
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                      {feature.label}
                    </td>

                    <td className="px-4 py-4 text-center">
                      <FeatureValue
                        value={feature.free}
                      />
                    </td>

                    <td className="px-4 py-4 text-center bg-amber-50/30">
                      <FeatureValue
                        value={feature.pro}
                      />
                    </td>

                    <td className="px-4 py-4 text-center">
                      <FeatureValue
                        value={feature.business}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-center text-[11px] text-slate-400 mt-6">
          ฟีเจอร์ ราคา และข้อจำกัดของแพ็กเกจ Pro / Business
          อาจมีการเปลี่ยนแปลงก่อนเปิดให้บริการจริง
        </p>
      </main>
    </div>
  );
}