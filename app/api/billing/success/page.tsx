"use client";

import {
  useRouter,
} from "next/navigation";

import {
  CheckCircle2,
} from "lucide-react";

export default function BillingSuccessPage() {
  const router =
    useRouter();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="max-w-xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 sm:p-10 text-center">
        <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />

        <h1 className="text-2xl font-extrabold text-slate-800 mt-5">
          ชำระเงินเรียบร้อย
        </h1>

        <p className="text-sm text-slate-500 mt-2">
          ระบบกำลังอัปเดตสิทธิ์สมาชิกของคุณ
        </p>

        <button
          type="button"
          onClick={() =>
            router.push("/")
          }
          className="mt-6 bg-slate-800 hover:bg-slate-900 text-white font-bold px-5 py-3 rounded-xl text-sm"
        >
          กลับหน้าหลัก
        </button>
      </div>
    </main>
  );
}
